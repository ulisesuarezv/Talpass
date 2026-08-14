import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import type { SupabaseClient } from '@supabase/supabase-js';

import { adminClient, findUserIdByEmail, required } from './lib/supabase.mts';
import { DEMO } from './seed-demo.mts';

/**
 * Retira de PRODUCCIÓN los datos de demostración que la fase 1 sembró allí por
 * error (ADR-17). Deja el schema y los catálogos; se lleva candidatos, ETTs,
 * vacantes y archivos falsos.
 *
 *     node --env-file=.env.local scripts/clean-prod-demo.mts [--yes]
 *
 * Este script NO lleva `assertLocalTarget` y no es un descuido: su trabajo es
 * precisamente tocar el destino remoto. Lo que lo hace seguro es que solo sabe
 * borrar, y solo lo que `seed-demo.mts` sabe crear:
 *
 *   · usuarios cuyo email está en la constante `DEMO` — todos en dominios
 *     `.test`, que por RFC 2606 no pueden ser de nadie real
 *   · las dos ETTs de demostración, por slug
 *
 * No acepta una lista por parámetro, no borra por patrón y no toca ninguna
 * tabla de catálogo. Un candidato real no puede caer aquí porque su email no
 * puede estar en esa constante.
 *
 * La otra mitad del cuidado es la comprobación final: cuenta lo que queda y
 * exige que los catálogos sigan poblados. Un borrado que se lleva por delante
 * los países tiene que salir en rojo, no en silencio.
 */

const CONFIRMATION = 'borrar';

const DEMO_EMAILS = [
  DEMO.admin,
  DEMO.agencies.nordlicht.owner,
  DEMO.agencies.nordlicht.recruiter,
  DEMO.agencies.elbe.owner,
  ...Object.values(DEMO.candidates),
];

const DEMO_AGENCY_SLUGS = [
  DEMO.agencies.nordlicht.slug,
  DEMO.agencies.elbe.slug,
];

const CATALOGS = [
  'countries',
  'sectors',
  'document_types',
  'identifier_types',
  'registration_types',
  'languages',
  'locales',
  'country_document_requirements',
];

async function count(admin: SupabaseClient, table: string): Promise<number> {
  const { count: n, error } = await admin
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) throw new Error(`Contando ${table}: ${error.message}`);
  return n ?? 0;
}

const target = new URL(required('NEXT_PUBLIC_SUPABASE_URL')).host;
const admin = adminClient();

console.log(`\n  Destino: \x1b[1m${target}\x1b[0m`);
console.log('  Se van a borrar, si existen:\n');

const present: Array<{ email: string; id: string }> = [];
for (const email of DEMO_EMAILS) {
  const id = await findUserIdByEmail(admin, email);
  if (id) present.push({ email, id });
}

for (const { email } of present) console.log(`    · usuario  ${email}`);

const { data: agencies, error: agenciesError } = await admin
  .from('agencies')
  .select('slug, name')
  .in('slug', DEMO_AGENCY_SLUGS);
if (agenciesError) throw agenciesError;

for (const a of agencies ?? []) console.log(`    · ETT      ${a.name}`);

if (present.length === 0 && (agencies ?? []).length === 0) {
  console.log('    (nada: ya está limpio)\n');
  process.exit(0);
}

console.log(
  '\n  Las vacantes, candidaturas, documentos y solicitudes de estas\n' +
    '  cuentas caen en cascada. Los catálogos no se tocan.\n',
);

if (!process.argv.includes('--yes')) {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(`  Escribe "${CONFIRMATION}" para seguir: `);
  rl.close();
  if (answer.trim() !== CONFIRMATION) {
    console.log('\n  Cancelado. No se ha tocado nada.\n');
    process.exit(1);
  }
  console.log('');
}

for (const { email, id } of present) {
  // Storage no cae en cascada con el usuario: hay que vaciar sus carpetas.
  for (const bucket of ['candidate-documents', 'candidate-audio']) {
    const { data } = await admin.storage.from(bucket).list(id);
    if (data?.length) {
      await admin.storage
        .from(bucket)
        .remove(data.map((file) => `${id}/${file.name}`));
    }
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(`Borrando ${email}: ${error.message}`);
  console.log(`  ✓ borrado ${email}`);
}

const { error: deleteAgenciesError } = await admin
  .from('agencies')
  .delete()
  .in('slug', DEMO_AGENCY_SLUGS);
if (deleteAgenciesError) throw deleteAgenciesError;
console.log('  ✓ borradas las ETTs de demostración');

console.log('\n  Cómo queda:\n');

for (const table of ['profiles', 'candidates', 'agencies', 'jobs']) {
  console.log(`    ${table.padEnd(14)} ${await count(admin, table)} filas`);
}

let catalogsEmpty = 0;
for (const table of CATALOGS) {
  const n = await count(admin, table);
  if (n === 0) catalogsEmpty += 1;
  console.log(`    ${table.padEnd(14)} ${n} filas`);
}

if (catalogsEmpty > 0) {
  console.error(
    `\n  \x1b[31mHay ${catalogsEmpty} catálogos vacíos. Esto no debía pasar.\x1b[0m\n`,
  );
  process.exit(1);
}

console.log('\n  Producción queda con schema y catálogos, sin datos falsos.\n');
