import type { SupabaseClient } from '@supabase/supabase-js';

import {
  blindIndex,
  encryptSensitive,
  last4,
  normalizeIdentifier,
} from '../src/lib/crypto/sensitive.ts';
import {
  adminClient,
  assertLocalTarget,
  findUserIdByEmail,
} from './lib/supabase.mts';

/**
 * Datos de demostración. Sirven para dos cosas a la vez:
 *   · trabajar en las fases siguientes con algo que se parezca a la realidad
 *   · dar a los tests de seguridad un tablero conocido sobre el que atacar
 *
 * Es idempotente. Con `--reset` borra antes lo que sembró (y solo eso: todo
 * lleva dominios `.test`).
 *
 * NO se ejecuta contra producción: `assertLocalTarget` mira el host real de la
 * base de datos y aborta si no es local (ADR-17).
 */

export const DEMO_PASSWORD = 'Talpass-Demo-2026!';

export const DEMO = {
  admin: 'admin@talpass.test',
  agencies: {
    nordlicht: {
      slug: 'nordlicht-personal',
      name: 'Nordlicht Personal GmbH',
      owner: 'owner@nordlicht.test',
      recruiter: 'recruiter@nordlicht.test',
    },
    elbe: {
      slug: 'elbe-staffing',
      name: 'Elbe Staffing GmbH',
      owner: 'owner@elbe.test',
    },
  },
  candidates: {
    verified: 'carlos@talpass.test',
    pending: 'maria@talpass.test',
    unverified: 'joao@talpass.test',
    inactive: 'ana@talpass.test',
  },
  jobs: {
    nordlichtPublished: 'almacen-berlin-turnos',
    nordlichtPublishedTwo: 'produccion-leipzig',
    nordlichtDraft: 'carnico-bremen-borrador',
    elbePublished: 'logistica-hamburgo',
    elbeDraft: 'agricola-kiel-borrador',
  },
} as const;

type Ids = {
  admin: string;
  agencies: Record<'nordlicht' | 'elbe', string>;
  members: Record<
    'nordlichtOwner' | 'nordlichtRecruiter' | 'elbeOwner',
    string
  >;
  candidates: Record<
    'verified' | 'pending' | 'unverified' | 'inactive',
    string
  >;
  /** Indexado por slug de vacante. */
  jobs: Record<string, string>;
  documents: { verifiedCandidateIdFront: string; verifiedCandidateCv: string };
  documentTypes: Record<string, string>;
  application: string;
};

function assertNotProduction(): void {
  assertLocalTarget('Sembrar datos de demostración');
}

function unwrap<T>(
  result: { data: T; error: unknown },
  context: string,
): NonNullable<T> {
  if (result.error) {
    throw new Error(
      `${context}: ${
        result.error instanceof Error
          ? result.error.message
          : JSON.stringify(result.error)
      }`,
    );
  }

  if (result.data == null) {
    throw new Error(`${context}: la operación no ha devuelto ninguna fila.`);
  }

  return result.data;
}

async function ensureUser(
  admin: SupabaseClient,
  email: string,
  role: 'candidate' | 'agency_member' | 'admin',
): Promise<string> {
  const created = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });

  let id = created.data.user?.id ?? null;

  if (created.error) {
    if (!/already|exists|registered/i.test(created.error.message)) {
      throw created.error;
    }
    id = await findUserIdByEmail(admin, email);
  }

  if (!id) {
    throw new Error(`No se pudo crear ni encontrar el usuario ${email}.`);
  }

  // El disparador `on_auth_user_created` lo dejó como `candidate` a propósito:
  // promocionar es una operación de service_role, nunca del propio registro.
  const { error } = await admin.from('profiles').update({ role }).eq('id', id);
  if (error) throw error;

  return id;
}

async function catalogId(
  admin: SupabaseClient,
  table: string,
  slug: string,
): Promise<string> {
  const { data, error } = await admin
    .from(table)
    .select('id')
    .eq('slug', slug)
    .single();

  if (error) {
    throw new Error(
      `Catálogo ${table}: falta la fila "${slug}" (${error.message})`,
    );
  }

  return data.id as string;
}

async function uploadPlaceholder(
  admin: SupabaseClient,
  bucket: string,
  path: string,
  contentType: string,
): Promise<void> {
  const body = new Blob([`Documento de demostración de Talpass — ${path}\n`], {
    type: contentType,
  });

  const { error } = await admin.storage
    .from(bucket)
    .upload(path, body, { contentType, upsert: true });

  if (error) throw new Error(`Subida a ${bucket}/${path}: ${error.message}`);
}

async function reset(admin: SupabaseClient): Promise<void> {
  const emails = [
    DEMO.admin,
    DEMO.agencies.nordlicht.owner,
    DEMO.agencies.nordlicht.recruiter,
    DEMO.agencies.elbe.owner,
    ...Object.values(DEMO.candidates),
  ];

  for (const email of emails) {
    const id = await findUserIdByEmail(admin, email);
    if (!id) continue;

    // Los archivos de storage no se borran en cascada: hay que quitarlos a mano.
    for (const bucket of ['candidate-documents', 'candidate-audio']) {
      const { data } = await admin.storage.from(bucket).list(id);
      if (data?.length) {
        await admin.storage
          .from(bucket)
          .remove(data.map((file) => `${id}/${file.name}`));
      }
    }

    // Al borrar el usuario cae el perfil, y con él candidato, documentos,
    // aplicaciones y solicitudes, todo en cascada.
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  }

  const slugs = [DEMO.agencies.nordlicht.slug, DEMO.agencies.elbe.slug];
  const { error } = await admin.from('agencies').delete().in('slug', slugs);
  if (error) throw error;
}

export async function seedDemo(
  options: { reset?: boolean } = {},
): Promise<Ids> {
  assertNotProduction();

  const admin = adminClient();

  if (options.reset) {
    await reset(admin);
  }

  // ---------------------------------------------------------------- usuarios
  const adminId = await ensureUser(admin, DEMO.admin, 'admin');
  const nordlichtOwnerId = await ensureUser(
    admin,
    DEMO.agencies.nordlicht.owner,
    'agency_member',
  );
  const nordlichtRecruiterId = await ensureUser(
    admin,
    DEMO.agencies.nordlicht.recruiter,
    'agency_member',
  );
  const elbeOwnerId = await ensureUser(
    admin,
    DEMO.agencies.elbe.owner,
    'agency_member',
  );

  const candidateIds = {
    verified: await ensureUser(admin, DEMO.candidates.verified, 'candidate'),
    pending: await ensureUser(admin, DEMO.candidates.pending, 'candidate'),
    unverified: await ensureUser(
      admin,
      DEMO.candidates.unverified,
      'candidate',
    ),
    inactive: await ensureUser(admin, DEMO.candidates.inactive, 'candidate'),
  };

  // ------------------------------------------------------------------- ETTs
  const handelsregisterId = await catalogId(
    admin,
    'registration_types',
    'handelsregister',
  );

  const agencies = unwrap(
    await admin
      .from('agencies')
      .upsert(
        [
          {
            name: DEMO.agencies.nordlicht.name,
            slug: DEMO.agencies.nordlicht.slug,
            country_code: 'DE',
            registration_type_id: handelsregisterId,
            registration_number: 'HRB 123456 B',
            status: 'approved',
          },
          {
            name: DEMO.agencies.elbe.name,
            slug: DEMO.agencies.elbe.slug,
            country_code: 'DE',
            registration_type_id: handelsregisterId,
            registration_number: 'HRB 654321 H',
            status: 'approved',
          },
        ],
        { onConflict: 'slug' },
      )
      .select('id, slug'),
    'Alta de ETTs',
  );

  const agencyIds = {
    nordlicht: agencies.find((a) => a.slug === DEMO.agencies.nordlicht.slug)!
      .id as string,
    elbe: agencies.find((a) => a.slug === DEMO.agencies.elbe.slug)!
      .id as string,
  };

  unwrap(
    await admin
      .from('agency_translations')
      .upsert(
        [
          {
            agency_id: agencyIds.nordlicht,
            locale: 'es',
            description: 'ETT de Berlín especializada en almacén y producción.',
          },
          {
            agency_id: agencyIds.nordlicht,
            locale: 'en',
            description: 'Berlin agency focused on warehouse and production.',
          },
          {
            agency_id: agencyIds.elbe,
            locale: 'es',
            description: 'ETT de Hamburgo, logística portuaria.',
          },
          {
            agency_id: agencyIds.elbe,
            locale: 'en',
            description: 'Hamburg agency, port logistics.',
          },
        ],
        { onConflict: 'agency_id,locale' },
      )
      .select('agency_id'),
    'Traducciones de ETT',
  );

  unwrap(
    await admin
      .from('agency_members')
      .upsert(
        [
          {
            profile_id: nordlichtOwnerId,
            agency_id: agencyIds.nordlicht,
            role: 'owner',
          },
          {
            profile_id: nordlichtRecruiterId,
            agency_id: agencyIds.nordlicht,
            role: 'recruiter',
          },
          {
            profile_id: elbeOwnerId,
            agency_id: agencyIds.elbe,
            role: 'owner',
          },
        ],
        { onConflict: 'profile_id,agency_id' },
      )
      .select('id'),
    'Miembros de ETT',
  );

  // -------------------------------------------------------------- candidatos
  unwrap(
    await admin
      .from('candidates')
      .upsert(
        [
          {
            profile_id: candidateIds.verified,
            first_name: 'Carlos',
            last_name: 'Martínez Ruiz',
            date_of_birth: '1994-03-12',
            nationality_code: 'ES',
            current_country_code: 'ES',
            current_city: 'Sevilla',
            english_level: 'b2',
            has_driving_license: true,
            worked_in_nl_de: true,
            needs_housing: true,
            needs_transport: false,
            work_experience:
              'Tres años en almacén y carretilla frontal. Turnos rotativos.',
            status: 'active',
            verification_status: 'verified',
          },
          {
            profile_id: candidateIds.pending,
            first_name: 'María',
            last_name: 'Gómez Silva',
            date_of_birth: '1999-07-30',
            nationality_code: 'ES',
            current_country_code: 'ES',
            current_city: 'Valencia',
            english_level: 'b1',
            has_driving_license: false,
            worked_in_nl_de: false,
            needs_housing: true,
            needs_transport: true,
            work_experience: 'Un año en línea de producción alimentaria.',
            status: 'active',
            verification_status: 'pending',
          },
          {
            profile_id: candidateIds.unverified,
            first_name: 'João',
            last_name: 'Pereira Costa',
            date_of_birth: '1996-11-05',
            nationality_code: 'PT',
            current_country_code: 'PT',
            current_city: 'Porto',
            english_level: 'a2',
            has_driving_license: true,
            worked_in_nl_de: false,
            needs_housing: true,
            needs_transport: true,
            work_experience: 'Construcción y almacén.',
            status: 'active',
            verification_status: 'unverified',
          },
          {
            // Verificada pero inactiva: NO debe salir en la bolsa (regla 6).
            profile_id: candidateIds.inactive,
            first_name: 'Ana',
            last_name: 'Ferreira Lima',
            date_of_birth: '1992-01-22',
            nationality_code: 'PT',
            current_country_code: 'DE',
            current_city: 'Bremen',
            english_level: 'c1',
            has_driving_license: true,
            worked_in_nl_de: true,
            needs_housing: false,
            needs_transport: false,
            work_experience: 'Cinco años en logística.',
            status: 'inactive',
            verification_status: 'verified',
          },
        ],
        { onConflict: 'profile_id' },
      )
      .select('profile_id'),
    'Alta de candidatos',
  );

  // Datos sensibles: aquí es donde se prueba el cifrado de verdad (ADR-15).
  const iban = 'ES9121000418450200051332';

  unwrap(
    await admin
      .from('candidate_private')
      .upsert(
        [
          {
            candidate_id: candidateIds.verified,
            phone: '+34600111222',
            address_line: 'Calle Betis 14, 3º B',
            postal_code: '41010',
            city: 'Sevilla',
            country_code: 'ES',
            iban_ciphertext: encryptSensitive(
              normalizeIdentifier(iban),
              `candidate_private.iban:${candidateIds.verified}`,
            ),
            iban_key_id: process.env.TALPASS_ENCRYPTION_ACTIVE_KEY_ID ?? 'k1',
            iban_last4: last4(iban),
          },
          {
            candidate_id: candidateIds.pending,
            phone: '+34600333444',
            address_line: 'Avinguda del Port 88',
            postal_code: '46023',
            city: 'Valencia',
            country_code: 'ES',
          },
        ],
        { onConflict: 'candidate_id' },
      )
      .select('candidate_id'),
    'Datos sensibles del candidato',
  );

  const steuerIdType = await catalogId(admin, 'identifier_types', 'steuer_id');
  const steuerId = '12345678901';

  unwrap(
    await admin
      .from('candidate_identifiers')
      .upsert(
        [
          {
            candidate_id: candidateIds.verified,
            identifier_type_id: steuerIdType,
            value_ciphertext: encryptSensitive(
              steuerId,
              `candidate_identifiers.value:${candidateIds.verified}`,
            ),
            value_key_id: process.env.TALPASS_ENCRYPTION_ACTIVE_KEY_ID ?? 'k1',
            value_blind_index: blindIndex(steuerId),
            verified_at: new Date().toISOString(),
            verified_by: adminId,
          },
        ],
        { onConflict: 'candidate_id,identifier_type_id' },
      )
      .select('id'),
    'Identificadores fiscales',
  );

  const logisticsId = await catalogId(admin, 'sectors', 'logistics');
  const warehouseId = await catalogId(admin, 'sectors', 'warehouse');
  const productionId = await catalogId(admin, 'sectors', 'production');

  unwrap(
    await admin
      .from('candidate_sectors')
      .upsert(
        [
          {
            candidate_id: candidateIds.verified,
            sector_id: warehouseId,
            months_experience: 36,
          },
          {
            candidate_id: candidateIds.verified,
            sector_id: logisticsId,
            months_experience: 12,
          },
          {
            candidate_id: candidateIds.pending,
            sector_id: productionId,
            months_experience: 12,
          },
        ],
        { onConflict: 'candidate_id,sector_id' },
      )
      .select('candidate_id'),
    'Sectores del candidato',
  );

  // ------------------------------------------------------------- documentos
  const documentTypes: Record<string, string> = {};
  for (const slug of [
    'id_front',
    'id_back',
    'cv',
    'audio_en',
    'driving_license',
    'tax_doc',
  ]) {
    documentTypes[slug] = await catalogId(admin, 'document_types', slug);
  }

  type DocSpec = {
    candidateId: string;
    slug: string;
    bucket: string;
    file: string;
    mime: string;
    status: 'pending' | 'verified' | 'rejected';
  };

  const docs: DocSpec[] = [
    {
      candidateId: candidateIds.verified,
      slug: 'id_front',
      bucket: 'candidate-documents',
      file: 'id-front.pdf',
      mime: 'application/pdf',
      status: 'verified',
    },
    {
      candidateId: candidateIds.verified,
      slug: 'id_back',
      bucket: 'candidate-documents',
      file: 'id-back.pdf',
      mime: 'application/pdf',
      status: 'verified',
    },
    {
      candidateId: candidateIds.verified,
      slug: 'cv',
      bucket: 'candidate-documents',
      file: 'cv.pdf',
      mime: 'application/pdf',
      status: 'verified',
    },
    {
      candidateId: candidateIds.verified,
      slug: 'audio_en',
      bucket: 'candidate-audio',
      file: 'intro-en.mp3',
      mime: 'audio/mpeg',
      status: 'verified',
    },
    {
      candidateId: candidateIds.verified,
      slug: 'driving_license',
      bucket: 'candidate-documents',
      file: 'driving-licence.pdf',
      mime: 'application/pdf',
      status: 'verified',
    },
    {
      candidateId: candidateIds.pending,
      slug: 'id_front',
      bucket: 'candidate-documents',
      file: 'id-front.pdf',
      mime: 'application/pdf',
      status: 'pending',
    },
    {
      candidateId: candidateIds.pending,
      slug: 'cv',
      bucket: 'candidate-documents',
      file: 'cv.pdf',
      mime: 'application/pdf',
      status: 'pending',
    },
  ];

  const documentRows: Record<string, string> = {};

  for (const doc of docs) {
    const path = `${doc.candidateId}/${doc.file}`;
    await uploadPlaceholder(admin, doc.bucket, path, doc.mime);

    const row = unwrap(
      await admin
        .from('candidate_documents')
        .upsert(
          {
            candidate_id: doc.candidateId,
            document_type_id: documentTypes[doc.slug],
            storage_bucket: doc.bucket,
            storage_path: path,
            status: doc.status,
            reviewed_by: doc.status === 'verified' ? adminId : null,
            reviewed_at:
              doc.status === 'verified' ? new Date().toISOString() : null,
            mime_type: doc.mime,
            size_bytes: 2048,
          },
          { onConflict: 'storage_path' },
        )
        .select('id')
        .single(),
      `Documento ${doc.slug} de ${doc.candidateId}`,
    );

    documentRows[`${doc.candidateId}:${doc.slug}`] = row.id as string;
  }

  // ---------------------------------------------------------------- vacantes
  //
  // Todas las filas tienen que llevar EXACTAMENTE las mismas columnas: en un
  // upsert múltiple, PostgREST construye un solo INSERT, y una columna ausente
  // en una fila viaja como NULL y pisa el `default` de la tabla.
  const jobDefaults = {
    client_company_name: null as string | null,
    show_client_company: false,
    city: null as string | null,
    salary_min: null as number | null,
    salary_max: null as number | null,
    salary_currency: null as string | null,
    salary_period: null as string | null,
    shifts: [] as string[],
    weekly_hours: null as number | null,
    required_language_code: null as string | null,
    required_language_level: null as string | null,
    requires_driving_license: false,
    housing_provided: false,
    housing_price: null as number | null,
    housing_currency: null as string | null,
    transport_provided: false,
    min_contract_months: null as number | null,
    start_date: null as string | null,
    status: 'draft',
  };

  const jobRows = unwrap(
    await admin
      .from('jobs')
      .upsert(
        [
          {
            ...jobDefaults,
            agency_id: agencyIds.nordlicht,
            created_by: nordlichtOwnerId,
            slug: DEMO.jobs.nordlichtPublished,
            client_company_name: 'Logistikzentrum Spandau',
            show_client_company: false,
            country_code: 'DE',
            city: 'Berlín',
            sector_id: warehouseId,
            salary_min: 13.5,
            salary_max: 15,
            salary_currency: 'EUR',
            salary_period: 'hour',
            shifts: ['morning', 'afternoon', 'night'],
            weekly_hours: 40,
            required_language_code: 'en',
            required_language_level: 'a2',
            requires_driving_license: false,
            housing_provided: true,
            housing_price: 320,
            housing_currency: 'EUR',
            transport_provided: true,
            min_contract_months: 6,
            start_date: '2026-09-01',
            status: 'draft',
          },
          {
            ...jobDefaults,
            agency_id: agencyIds.nordlicht,
            created_by: nordlichtOwnerId,
            slug: DEMO.jobs.nordlichtPublishedTwo,
            country_code: 'DE',
            city: 'Leipzig',
            sector_id: productionId,
            salary_min: 14,
            salary_currency: 'EUR',
            salary_period: 'hour',
            shifts: ['rotating'],
            weekly_hours: 38,
            housing_provided: true,
            transport_provided: false,
            min_contract_months: 3,
            status: 'draft',
          },
          {
            ...jobDefaults,
            agency_id: agencyIds.nordlicht,
            created_by: nordlichtOwnerId,
            slug: DEMO.jobs.nordlichtDraft,
            country_code: 'DE',
            city: 'Bremen',
            sector_id: productionId,
            status: 'draft',
          },
          {
            ...jobDefaults,
            agency_id: agencyIds.elbe,
            created_by: elbeOwnerId,
            slug: DEMO.jobs.elbePublished,
            country_code: 'DE',
            city: 'Hamburgo',
            sector_id: logisticsId,
            salary_min: 15,
            salary_max: 17,
            salary_currency: 'EUR',
            salary_period: 'hour',
            shifts: ['morning'],
            weekly_hours: 40,
            housing_provided: false,
            transport_provided: true,
            status: 'draft',
          },
          {
            ...jobDefaults,
            agency_id: agencyIds.elbe,
            created_by: elbeOwnerId,
            slug: DEMO.jobs.elbeDraft,
            country_code: 'DE',
            city: 'Kiel',
            sector_id: logisticsId,
            status: 'draft',
          },
        ],
        { onConflict: 'slug' },
      )
      .select('id, slug'),
    'Alta de vacantes',
  );

  const jobIdBySlug = Object.fromEntries(
    jobRows.map((row) => [row.slug as string, row.id as string]),
  );

  const translations = [
    {
      slug: DEMO.jobs.nordlichtPublished,
      es: {
        title: 'Mozo/a de almacén en Berlín — turnos rotativos',
        description:
          'Centro logístico en Spandau. Preparación de pedidos y carretilla.',
      },
      en: {
        title: 'Warehouse operative in Berlin — rotating shifts',
        description: 'Logistics centre in Spandau. Order picking and forklift.',
      },
    },
    {
      slug: DEMO.jobs.nordlichtPublishedTwo,
      es: {
        title: 'Operario/a de producción en Leipzig',
        description:
          'Línea de montaje, turnos rotativos, alojamiento incluido.',
      },
      en: {
        title: 'Production operative in Leipzig',
        description: 'Assembly line, rotating shifts, housing included.',
      },
    },
    {
      slug: DEMO.jobs.nordlichtDraft,
      es: {
        title: 'Sector cárnico en Bremen (borrador)',
        description: 'Vacante en preparación.',
      },
      en: {
        title: 'Meat processing in Bremen (draft)',
        description: 'Job posting in preparation.',
      },
    },
    {
      slug: DEMO.jobs.elbePublished,
      es: {
        title: 'Logística portuaria en Hamburgo',
        description: 'Puerto de Hamburgo. Carga y descarga de contenedores.',
      },
      en: {
        title: 'Port logistics in Hamburg',
        description: 'Port of Hamburg. Container loading and unloading.',
      },
    },
    {
      slug: DEMO.jobs.elbeDraft,
      es: {
        title: 'Trabajo agrícola en Kiel (borrador)',
        description: 'Vacante en preparación.',
      },
      en: {
        title: 'Agricultural work in Kiel (draft)',
        description: 'Job posting in preparation.',
      },
    },
  ];

  unwrap(
    await admin
      .from('job_translations')
      .upsert(
        translations.flatMap((entry) => [
          {
            job_id: jobIdBySlug[entry.slug],
            locale: 'es',
            title: entry.es.title,
            description: entry.es.description,
          },
          {
            job_id: jobIdBySlug[entry.slug],
            locale: 'en',
            title: entry.en.title,
            description: entry.en.description,
          },
        ]),
        { onConflict: 'job_id,locale' },
      )
      .select('job_id'),
    'Traducciones de vacantes',
  );

  // Se publican DESPUÉS de tener traducción: el disparador de ciclo de vida
  // impide publicar una vacante vacía, y hace bien.
  unwrap(
    await admin
      .from('jobs')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .in('slug', [
        DEMO.jobs.nordlichtPublished,
        DEMO.jobs.nordlichtPublishedTwo,
        DEMO.jobs.elbePublished,
      ])
      .select('id'),
    'Publicación de vacantes',
  );

  // ------------------------------------------------------------ aplicaciones
  const application = unwrap(
    await admin
      .from('applications')
      .upsert(
        {
          job_id: jobIdBySlug[DEMO.jobs.nordlichtPublished],
          candidate_id: candidateIds.verified,
        },
        { onConflict: 'job_id,candidate_id' },
      )
      .select('id')
      .single(),
    'Aplicación de demostración',
  );

  return {
    admin: adminId,
    agencies: agencyIds,
    members: {
      nordlichtOwner: nordlichtOwnerId,
      nordlichtRecruiter: nordlichtRecruiterId,
      elbeOwner: elbeOwnerId,
    },
    candidates: candidateIds,
    jobs: jobIdBySlug,
    documents: {
      verifiedCandidateIdFront:
        documentRows[`${candidateIds.verified}:id_front`],
      verifiedCandidateCv: documentRows[`${candidateIds.verified}:cv`],
    },
    documentTypes,
    application: application.id as string,
  };
}

const invokedDirectly = process.argv[1]?.endsWith('seed-demo.mts');

if (invokedDirectly) {
  const ids = await seedDemo({ reset: process.argv.includes('--reset') });
  console.log('Semilla de demostración aplicada.');
  console.log(`  admin ................ ${DEMO.admin}`);
  console.log(
    `  ETT (2) .............. ${Object.keys(ids.agencies).join(', ')}`,
  );
  console.log(
    `  candidatos (4) ....... ${Object.keys(ids.candidates).join(', ')}`,
  );
  console.log(`  vacantes ............. 3 publicadas, 2 en borrador`);
  console.log(`  contraseña de todos .. ${DEMO_PASSWORD}`);
}
