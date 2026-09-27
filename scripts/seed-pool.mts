import type { SupabaseClient } from '@supabase/supabase-js';

import {
  adminClient,
  assertLocalTarget,
  findUserIdByEmail,
} from './lib/supabase.mts';
import { DEMO_PASSWORD } from './seed-demo.mts';

/**
 * Una bolsa de demostración para enseñar el portal de agencia (ADR-52).
 *
 * `seed:demo` deja **un solo** candidato visible en la bolsa, porque su trabajo
 * es dar a los tests de seguridad un tablero pequeño y conocido. Para enseñarle
 * la bolsa a una ETT hace falta una bolsa que parezca una bolsa. Va aparte para
 * no tocar ese tablero: la batería busca candidatos concretos y esto solo
 * añade.
 *
 * Todo es ficticio, todo lleva `@talpass.test` y **nunca va a producción**:
 * `assertLocalTarget` mira el host real de la base y aborta si no es local
 * (ADR-17). Enseñar a una ETT perfiles inventados como si fueran reales sería
 * justo lo que la credibilidad del proyecto no aguanta.
 *
 * Idempotente. Con `--reset` borra antes lo que sembró.
 */

type PoolCandidate = {
  key: string;
  firstName: string;
  lastName: string;
  birth: string;
  nationality: string;
  country: string;
  city: string;
  english: 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';
  license: boolean;
  workedAbroad: boolean;
  housing: boolean;
  transport: boolean;
  experience: string;
  sectors: [slug: string, months: number][];
  /** Documentos verificados. `id` son las dos caras del DNI o pasaporte. */
  docs: ('id' | 'cv' | 'audio_en' | 'driving_license')[];
  /** Días desde la última actividad: ordena la bolsa como lo haría la vida. */
  activeDaysAgo: number;
};

const POOL: PoolCandidate[] = [
  {
    key: 'lucia',
    firstName: 'Lucía',
    lastName: 'Navarro Gil',
    birth: '1997-05-18',
    nationality: 'ES',
    country: 'ES',
    city: 'Málaga',
    english: 'b2',
    license: true,
    workedAbroad: true,
    housing: true,
    transport: false,
    experience:
      'Dos años de preparación de pedidos con escáner en un centro de Amazon en Holanda. Turnos de noche.',
    sectors: [
      ['warehouse', 30],
      ['logistics', 8],
    ],
    docs: ['id', 'cv', 'audio_en', 'driving_license'],
    activeDaysAgo: 0,
  },
  {
    key: 'diego',
    firstName: 'Diego',
    lastName: 'Ramírez Ortega',
    birth: '1990-10-02',
    nationality: 'ES',
    country: 'ES',
    city: 'Zaragoza',
    english: 'b1',
    license: true,
    workedAbroad: false,
    housing: true,
    transport: true,
    experience:
      'Carretillero con carnet desde 2016. Carga y descarga de camiones, retráctil y frontal.',
    sectors: [
      ['logistics', 60],
      ['warehouse', 24],
    ],
    docs: ['id', 'cv', 'driving_license'],
    activeDaysAgo: 1,
  },
  {
    key: 'ines',
    firstName: 'Inês',
    lastName: 'Carvalho Sousa',
    birth: '1999-02-27',
    nationality: 'PT',
    country: 'PT',
    city: 'Braga',
    english: 'c1',
    license: false,
    workedAbroad: false,
    housing: true,
    transport: true,
    experience:
      'Operaria de linha numa fábrica de componentes automóveis. Controlo de qualidade visual.',
    sectors: [['production', 20]],
    docs: ['id', 'cv', 'audio_en'],
    activeDaysAgo: 1,
  },
  {
    key: 'javier',
    firstName: 'Javier',
    lastName: 'Moreno Castillo',
    birth: '1988-08-14',
    nationality: 'ES',
    country: 'DE',
    city: 'Stuttgart',
    english: 'b1',
    license: true,
    workedAbroad: true,
    housing: false,
    transport: false,
    experience:
      'Ya vivo en Alemania. Un año en cárnico (despiece) y dos en construcción como peón.',
    sectors: [
      ['meat-processing', 12],
      ['construction', 24],
    ],
    docs: ['id', 'cv', 'driving_license'],
    activeDaysAgo: 2,
  },
  {
    key: 'andrea',
    firstName: 'Andrea',
    lastName: 'López Serrano',
    birth: '2000-12-03',
    nationality: 'ES',
    country: 'ES',
    city: 'Murcia',
    english: 'a2',
    license: false,
    workedAbroad: false,
    housing: true,
    transport: true,
    experience:
      'Campañas de recolección de fruta y almacén de envasado en Murcia, cuatro temporadas.',
    sectors: [
      ['agriculture', 28],
      ['warehouse', 6],
    ],
    docs: ['id', 'cv'],
    activeDaysAgo: 3,
  },
  {
    key: 'tiago',
    firstName: 'Tiago',
    lastName: 'Almeida Rocha',
    birth: '1995-06-21',
    nationality: 'PT',
    country: 'PT',
    city: 'Lisboa',
    english: 'b2',
    license: true,
    workedAbroad: true,
    housing: true,
    transport: false,
    experience:
      'Seis meses num armazém em Roterdão e dois anos de logística em Lisboa. Empilhador.',
    sectors: [
      ['logistics', 24],
      ['warehouse', 6],
    ],
    docs: ['id', 'cv', 'audio_en', 'driving_license'],
    activeDaysAgo: 3,
  },
  {
    key: 'paula',
    firstName: 'Paula',
    lastName: 'Herrera Vidal',
    birth: '1993-04-09',
    nationality: 'ES',
    country: 'ES',
    city: 'Valladolid',
    english: 'b2',
    license: true,
    workedAbroad: false,
    housing: true,
    transport: true,
    experience:
      'Limpieza industrial en planta alimentaria, turnos rotativos, manejo de maquinaria.',
    sectors: [
      ['cleaning', 36],
      ['production', 10],
    ],
    docs: ['id', 'cv', 'audio_en'],
    activeDaysAgo: 4,
  },
  {
    key: 'sergio',
    firstName: 'Sergio',
    lastName: 'Domínguez Prieto',
    birth: '1986-01-30',
    nationality: 'ES',
    country: 'ES',
    city: 'Vigo',
    english: 'a2',
    license: true,
    workedAbroad: true,
    housing: true,
    transport: true,
    experience:
      'Montaje en línea de automoción durante ocho años. Trabajé una temporada en Bélgica.',
    sectors: [['production', 96]],
    docs: ['id', 'cv', 'driving_license'],
    activeDaysAgo: 5,
  },
  {
    key: 'marta',
    firstName: 'Marta',
    lastName: 'Ibáñez Fuentes',
    birth: '1998-09-11',
    nationality: 'ES',
    country: 'ES',
    city: 'Bilbao',
    english: 'c1',
    license: false,
    workedAbroad: false,
    housing: true,
    transport: true,
    experience:
      'Camarera de pisos y cocina en hotel de temporada. Antes, dependienta.',
    sectors: [['hospitality', 30]],
    docs: ['id', 'cv', 'audio_en'],
    activeDaysAgo: 6,
  },
  {
    key: 'rui',
    firstName: 'Rui',
    lastName: 'Fernandes Pinto',
    birth: '1991-11-19',
    nationality: 'PT',
    country: 'PT',
    city: 'Aveiro',
    english: 'b1',
    license: true,
    workedAbroad: false,
    housing: true,
    transport: false,
    experience:
      'Servente de obra e montagem de estruturas metálicas. Carta de condução categoria B.',
    sectors: [['construction', 48]],
    docs: ['id', 'cv', 'driving_license'],
    activeDaysAgo: 7,
  },
  {
    key: 'alba',
    firstName: 'Alba',
    lastName: 'Molina Crespo',
    birth: '2001-03-25',
    nationality: 'ES',
    country: 'ES',
    city: 'Granada',
    english: 'b2',
    license: false,
    workedAbroad: false,
    housing: true,
    transport: true,
    experience:
      'Picking y empaquetado en e-commerce durante la campaña de Navidad, tres años seguidos.',
    sectors: [['warehouse', 9]],
    docs: ['id', 'audio_en'],
    activeDaysAgo: 8,
  },
  {
    key: 'hugo',
    firstName: 'Hugo',
    lastName: 'Santos Vega',
    birth: '1994-07-07',
    nationality: 'ES',
    country: 'ES',
    city: 'Córdoba',
    english: 'a2',
    license: true,
    workedAbroad: false,
    housing: true,
    transport: true,
    experience: 'Matadero de porcino, línea de despiece. Tres años.',
    sectors: [['meat-processing', 36]],
    docs: ['id', 'cv'],
    activeDaysAgo: 9,
  },
  {
    key: 'beatriz',
    firstName: 'Beatriz',
    lastName: 'Costa Martins',
    birth: '1996-05-02',
    nationality: 'PT',
    country: 'DE',
    city: 'Hamburg',
    english: 'b2',
    license: true,
    workedAbroad: true,
    housing: false,
    transport: false,
    experience:
      'Vivo em Hamburgo há um ano. Armazém de frio e preparação de encomendas.',
    sectors: [
      ['warehouse', 14],
      ['logistics', 6],
    ],
    docs: ['id', 'cv', 'audio_en', 'driving_license'],
    activeDaysAgo: 10,
  },
  {
    key: 'ivan',
    firstName: 'Iván',
    lastName: 'Guerrero Pastor',
    birth: '1989-12-12',
    nationality: 'ES',
    country: 'ES',
    city: 'Alicante',
    english: 'b1',
    license: true,
    workedAbroad: true,
    housing: true,
    transport: false,
    experience:
      'Invernaderos en Almería y dos temporadas de espárrago en Alemania (Baja Sajonia).',
    sectors: [['agriculture', 40]],
    docs: ['id', 'cv', 'driving_license'],
    activeDaysAgo: 12,
  },
  {
    key: 'claudia',
    firstName: 'Claudia',
    lastName: 'Ruiz Delgado',
    birth: '1997-10-28',
    nationality: 'ES',
    country: 'ES',
    city: 'Madrid',
    english: 'c1',
    license: false,
    workedAbroad: false,
    housing: true,
    transport: true,
    experience:
      'Recepción y almacén de una cadena de supermercados. Control de inventario con SAP.',
    sectors: [
      ['warehouse', 18],
      ['logistics', 12],
    ],
    docs: ['id', 'cv', 'audio_en'],
    activeDaysAgo: 14,
  },
  {
    key: 'nuno',
    firstName: 'Nuno',
    lastName: 'Ribeiro Lopes',
    birth: '1992-02-16',
    nationality: 'PT',
    country: 'PT',
    city: 'Coimbra',
    english: 'a1',
    license: true,
    workedAbroad: false,
    housing: true,
    transport: true,
    experience: 'Limpeza de escritórios e de fábrica. Disponível para turnos.',
    sectors: [['cleaning', 24]],
    docs: ['id'],
    activeDaysAgo: 18,
  },
];

const email = (key: string) => `pool-${key}@talpass.test`;

const DOC_FILES: Record<
  string,
  { slug: string; bucket: string; file: string; mime: string }[]
> = {
  id: [
    {
      slug: 'id_front',
      bucket: 'candidate-documents',
      file: 'id-front.pdf',
      mime: 'application/pdf',
    },
    {
      slug: 'id_back',
      bucket: 'candidate-documents',
      file: 'id-back.pdf',
      mime: 'application/pdf',
    },
  ],
  cv: [
    {
      slug: 'cv',
      bucket: 'candidate-documents',
      file: 'cv.pdf',
      mime: 'application/pdf',
    },
  ],
  audio_en: [
    {
      slug: 'audio_en',
      bucket: 'candidate-audio',
      file: 'intro-en.mp3',
      mime: 'audio/mpeg',
    },
  ],
  driving_license: [
    {
      slug: 'driving_license',
      bucket: 'candidate-documents',
      file: 'driving-licence.pdf',
      mime: 'application/pdf',
    },
  ],
};

async function check<T>(
  promise: PromiseLike<{ data: T; error: { message: string } | null }>,
  context: string,
): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(`${context}: ${error.message}`);
  return data;
}

async function idsBySlug(
  admin: SupabaseClient,
  table: 'sectors' | 'document_types',
): Promise<Map<string, string>> {
  const rows = await check(
    admin.from(table).select('id, slug'),
    `Catálogo ${table}`,
  );
  return new Map(
    (rows as { id: string; slug: string }[]).map((r) => [r.slug, r.id]),
  );
}

async function ensureCandidateUser(
  admin: SupabaseClient,
  address: string,
): Promise<string> {
  const created = await admin.auth.admin.createUser({
    email: address,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });

  if (created.data.user) return created.data.user.id;

  if (!/already|exists|registered/i.test(created.error?.message ?? '')) {
    throw created.error;
  }

  const id = await findUserIdByEmail(admin, address);
  if (!id) throw new Error(`No se pudo crear ni encontrar ${address}.`);
  return id;
}

async function reset(admin: SupabaseClient): Promise<void> {
  for (const candidate of POOL) {
    const id = await findUserIdByEmail(admin, email(candidate.key));
    if (!id) continue;

    for (const bucket of ['candidate-documents', 'candidate-audio']) {
      const { data } = await admin.storage.from(bucket).list(id);
      const paths = (data ?? []).map((object) => `${id}/${object.name}`);
      if (paths.length > 0) await admin.storage.from(bucket).remove(paths);
    }

    await admin.auth.admin.deleteUser(id);
  }
}

export async function seedPool({ reset: wipe = false } = {}): Promise<number> {
  assertLocalTarget('Sembrar la bolsa de demostración');

  const admin = adminClient();

  if (wipe) await reset(admin);

  const sectors = await idsBySlug(admin, 'sectors');
  const documentTypes = await idsBySlug(admin, 'document_types');

  for (const candidate of POOL) {
    const id = await ensureCandidateUser(admin, email(candidate.key));
    const lastActivity = new Date(
      Date.now() - candidate.activeDaysAgo * 86_400_000,
    ).toISOString();

    await check(
      admin.from('candidates').upsert(
        {
          profile_id: id,
          first_name: candidate.firstName,
          last_name: candidate.lastName,
          date_of_birth: candidate.birth,
          nationality_code: candidate.nationality,
          current_country_code: candidate.country,
          current_city: candidate.city,
          english_level: candidate.english,
          has_driving_license: candidate.license,
          worked_in_nl_de: candidate.workedAbroad,
          needs_housing: candidate.housing,
          needs_transport: candidate.transport,
          work_experience: candidate.experience,
          status: 'active',
          verification_status: 'verified',
          last_activity_at: lastActivity,
        },
        { onConflict: 'profile_id' },
      ),
      `Candidato ${candidate.key}`,
    );

    await check(
      admin.from('candidate_sectors').upsert(
        candidate.sectors.map(([slug, months]) => {
          const sectorId = sectors.get(slug);
          if (!sectorId) throw new Error(`Falta el sector "${slug}".`);
          return {
            candidate_id: id,
            sector_id: sectorId,
            months_experience: months,
          };
        }),
        { onConflict: 'candidate_id,sector_id' },
      ),
      `Sectores de ${candidate.key}`,
    );

    for (const doc of candidate.docs.flatMap((kind) => DOC_FILES[kind])) {
      const path = `${id}/${doc.file}`;
      const typeId = documentTypes.get(doc.slug);
      if (!typeId) throw new Error(`Falta el tipo de documento "${doc.slug}".`);

      const { error: uploadError } = await admin.storage
        .from(doc.bucket)
        .upload(
          path,
          new Blob([`Documento de demostración de Talpass — ${path}\n`], {
            type: doc.mime,
          }),
          { contentType: doc.mime, upsert: true },
        );
      if (uploadError) {
        throw new Error(
          `Subida a ${doc.bucket}/${path}: ${uploadError.message}`,
        );
      }

      await check(
        admin.from('candidate_documents').upsert(
          {
            candidate_id: id,
            document_type_id: typeId,
            storage_bucket: doc.bucket,
            storage_path: path,
            status: 'verified',
            reviewed_at: lastActivity,
            mime_type: doc.mime,
            size_bytes: 2048,
          },
          { onConflict: 'storage_path' },
        ),
        `Documento ${doc.slug} de ${candidate.key}`,
      );
    }
  }

  return POOL.length;
}

if (process.argv[1]?.endsWith('seed-pool.mts')) {
  const count = await seedPool({ reset: process.argv.includes('--reset') });
  console.log(`Bolsa de demostración: ${count} candidatos verificados.`);
}
