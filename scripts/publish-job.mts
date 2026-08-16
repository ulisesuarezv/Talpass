import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import type { SupabaseClient } from '@supabase/supabase-js';

import { loadEnvFile } from './lib/env-file.mts';

/**
 * Publicar una vacante real, desde un fichero JSON.
 *
 *     pnpm job:publish content/jobs/almacen-berlin.json          # base local
 *     pnpm job:publish:prod content/jobs/almacen-berlin.json     # PRODUCCIÓN
 *
 * Por qué existe (fase 4): hasta hoy no había ninguna forma de meter una
 * vacante en producción. El CRUD de la ETT es de la fase 6 y `seed:demo` se
 * niega —con razón— a tocar el proyecto remoto, así que todo el SEO de la
 * fase 3 estaba construido sobre un catálogo vacío.
 *
 * Por qué un fichero JSON y no una pantalla de admin:
 *   · Una vacante real lleva unos 20 campos y **texto traducible en dos
 *     idiomas**. Un formulario para eso es la mitad del CRUD de la fase 6, que
 *     además lo va a hacer la propia ETT (ADR-06): se tiraría entero.
 *   · Un fichero se redacta con calma, se corrige, se versiona con el
 *     repositorio y queda como plantilla de la siguiente oferta. La sexta
 *     vacante se publica copiando la quinta.
 *   · Y es **repetible sin Claude**: un comando y un fichero de texto.
 *
 * Es idempotente: la clave es el `slug`, y volver a lanzarlo con la misma
 * oferta la actualiza en vez de duplicarla.
 *
 * Y va **a local por defecto**. Publicar contra producción es una escritura
 * deliberada y cuesta el mismo gesto que `db:push:prod`: escribir "produccion".
 */

const CONFIRMATION = 'produccion';

type Translation = {
  title: string;
  description: string;
  tasks?: string | null;
  requirements?: string | null;
  benefits?: string | null;
};

type JobFile = {
  slug: string;
  status?: 'draft' | 'published';
  agency: {
    slug: string;
    name: string;
    countryCode: string;
    registrationType: string;
    registrationNumber: string;
    descriptions?: Record<string, string>;
  };
  countryCode: string;
  city?: string | null;
  sector: string;
  clientCompanyName?: string | null;
  showClientCompany?: boolean;
  salary?: {
    min?: number | null;
    max?: number | null;
    currency: string;
    period: 'hour' | 'month';
  } | null;
  shifts?: ('morning' | 'afternoon' | 'night' | 'rotating')[];
  weeklyHours?: number | null;
  requiredLanguage?: { code: string; level: string } | null;
  requiresDrivingLicense?: boolean;
  housing?: {
    provided: boolean;
    price?: number | null;
    currency?: string | null;
  } | null;
  transportProvided?: boolean;
  minContractMonths?: number | null;
  startDate?: string | null;
  translations: Record<string, Translation>;
};

function fail(message: string): never {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
}

function readJobFile(path: string): JobFile {
  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(
      `${path} no es un JSON válido: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const job = parsed as JobFile;
  const problems: string[] = [];

  if (!job.slug || !/^[a-z0-9-]+$/.test(job.slug)) {
    problems.push('`slug` obligatorio, en minúsculas, números y guiones.');
  }
  if (!job.agency?.slug || !job.agency?.name) {
    problems.push('`agency.slug` y `agency.name` son obligatorios.');
  }
  if (!job.countryCode || !job.sector) {
    problems.push('`countryCode` y `sector` son obligatorios.');
  }
  if (!job.translations || Object.keys(job.translations).length === 0) {
    problems.push(
      '`translations` no puede estar vacío: una vacante sin texto no se publica.',
    );
  }

  for (const [locale, translation] of Object.entries(job.translations ?? {})) {
    if (!translation?.title || !translation?.description) {
      problems.push(
        `\`translations.${locale}\` necesita \`title\` y \`description\`.`,
      );
    }
  }

  if (problems.length > 0) {
    fail(`${path}:\n    · ${problems.join('\n    · ')}`);
  }

  return job;
}

async function catalogId(
  db: SupabaseClient,
  table: string,
  slug: string,
): Promise<string> {
  const { data, error } = await db
    .from(table)
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) fail(`Leyendo el catálogo ${table}: ${error.message}`);
  if (!data) fail(`El catálogo ${table} no tiene ninguna fila "${slug}".`);

  return data.id as string;
}

async function publish(db: SupabaseClient, job: JobFile): Promise<void> {
  // Los idiomas activos salen del catálogo, no de una lista aquí: abrir `pt`
  // tiene que ser insertar una fila (ADR-07).
  const { data: locales } = await db
    .from('locales')
    .select('code')
    .eq('is_active', true);

  const activeLocales = (locales ?? []).map((row) => row.code as string);
  const missing = activeLocales.filter((code) => !job.translations[code]);

  if (missing.length > 0) {
    fail(
      `Faltan traducciones para: ${missing.join(', ')}. ` +
        'Una vacante a medio traducir rompe el hreflang recíproco (ADR-23).',
    );
  }

  const registrationTypeId = await catalogId(
    db,
    'registration_types',
    job.agency.registrationType,
  );
  const sectorId = await catalogId(db, 'sectors', job.sector);

  // --- ETT ---------------------------------------------------------------
  const { data: agency, error: agencyError } = await db
    .from('agencies')
    .upsert(
      {
        slug: job.agency.slug,
        name: job.agency.name,
        country_code: job.agency.countryCode,
        registration_type_id: registrationTypeId,
        registration_number: job.agency.registrationNumber,
        status: 'approved',
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single();

  if (agencyError || !agency) {
    fail(`Alta de la ETT: ${agencyError?.message ?? 'sin respuesta'}`);
  }

  if (job.agency.descriptions) {
    const { error } = await db.from('agency_translations').upsert(
      Object.entries(job.agency.descriptions).map(([locale, description]) => ({
        agency_id: agency.id,
        locale,
        description,
      })),
      { onConflict: 'agency_id,locale' },
    );
    if (error) fail(`Traducciones de la ETT: ${error.message}`);
  }

  // --- Vacante -----------------------------------------------------------
  //
  // Nace o se actualiza en `draft`: el disparador de ciclo de vida no deja
  // publicar una vacante sin traducción, así que primero el texto y luego la
  // publicación.
  const { data: row, error: jobError } = await db
    .from('jobs')
    .upsert(
      {
        agency_id: agency.id,
        slug: job.slug,
        client_company_name: job.clientCompanyName ?? null,
        show_client_company: job.showClientCompany ?? false,
        country_code: job.countryCode,
        city: job.city ?? null,
        sector_id: sectorId,
        salary_min: job.salary?.min ?? null,
        salary_max: job.salary?.max ?? null,
        salary_currency: job.salary ? job.salary.currency : null,
        salary_period: job.salary ? job.salary.period : null,
        shifts: job.shifts ?? [],
        weekly_hours: job.weeklyHours ?? null,
        required_language_code: job.requiredLanguage?.code ?? null,
        required_language_level: job.requiredLanguage?.level ?? null,
        requires_driving_license: job.requiresDrivingLicense ?? false,
        housing_provided: job.housing?.provided ?? false,
        housing_price: job.housing?.price ?? null,
        housing_currency: job.housing?.currency ?? null,
        transport_provided: job.transportProvided ?? false,
        min_contract_months: job.minContractMonths ?? null,
        start_date: job.startDate ?? null,
        status: 'draft',
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single();

  if (jobError || !row) {
    fail(`Alta de la vacante: ${jobError?.message ?? 'sin respuesta'}`);
  }

  const { error: translationError } = await db.from('job_translations').upsert(
    Object.entries(job.translations).map(([locale, translation]) => ({
      job_id: row.id,
      locale,
      title: translation.title,
      description: translation.description,
      tasks: translation.tasks ?? null,
      requirements: translation.requirements ?? null,
      benefits: translation.benefits ?? null,
    })),
    { onConflict: 'job_id,locale' },
  );

  if (translationError) {
    fail(`Traducciones de la vacante: ${translationError.message}`);
  }

  const status = job.status ?? 'published';

  if (status === 'published') {
    const { error } = await db
      .from('jobs')
      .update({ status: 'published' })
      .eq('id', row.id);

    if (error) fail(`Publicación: ${error.message}`);
  }

  console.log(`  ✓ ${job.slug} — ${status}`);
}

// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const toProduction = args.includes('--prod');
const files = args.filter((arg) => !arg.startsWith('--'));

if (files.length === 0) {
  fail(
    'Dime qué fichero publicar:\n' +
      '      pnpm job:publish content/jobs/mi-oferta.json',
  );
}

loadEnvFile(toProduction ? '.env.local' : '.env.test');

// `assertLocalTarget` se importa DESPUÉS de cargar el entorno: mira el host
// real de la base de datos, y sin entorno no habría nada que mirar.
const { adminClient, assertLocalTarget } = await import('./lib/supabase.mts');

if (toProduction) {
  console.log(
    '\x1b[33m\n  Vas a publicar en PRODUCCIÓN una vacante que será pública e indexable.\x1b[0m\n',
  );
  console.log(`  Ficheros: ${files.map((f) => basename(f)).join(', ')}\n`);

  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(
    `  Escribe "${CONFIRMATION}" para continuar: `,
  );
  rl.close();

  if (answer.trim() !== CONFIRMATION) {
    console.log('\n  Cancelado. No se ha tocado nada.\n');
    process.exit(1);
  }
  console.log('');
} else {
  assertLocalTarget('Publicar una vacante');
}

const db = adminClient();

for (const file of files) {
  await publish(db, readJobFile(file));
}

console.log(
  '\n  Hecho.\n' +
    (toProduction
      ? '  Una vacante en una CIUDAD o un SECTOR nuevos estrena landing, y las\n' +
        '  landings son estáticas y se derivan de las vacantes vivas (ADR-23):\n' +
        '  hasta que no se redespliegue, esa landing devuelve 404.\n\n' +
        '      pnpm exec vercel --prod\n'
      : '  Arranca `pnpm dev:local` para verla en el listado y en su landing.\n'),
);
