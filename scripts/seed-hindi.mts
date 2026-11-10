import { existsSync, readFileSync } from 'node:fs';

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  adminClient,
  assertLocalTarget,
  findUserIdByEmail,
} from './lib/supabase.mts';
import { DEMO_PASSWORD } from './seed-demo.mts';

/**
 * ⚠️ DEMO (rama demo/hindi). La agencia de la reunión con Hindi
 * Personalmanagement, su oferta real y un par de conversaciones ya empezadas
 * para que la bandeja no salga vacía. Solo local (ADR-17).
 *
 * Va después de `seed:demo` y `seed:pool`. Idempotente.
 */

const AGENCY = {
  slug: 'hindi-personalmanagement',
  name: 'Hindi Personalmanagement GmbH',
  owner: 'demo@hindi.test',
};

const JOB_SLUG = 'lagerhelfer-goettingen';

const PHONES: Record<string, string> = {
  pablo: '+49 1520 4417 382',
  elena: '+49 1577 2290 115',
  tiagof: '+49 1514 8832 906',
  sergiom: '+49 1590 6612 447',
  carla: '+49 1525 3071 268',
  ruim: '+351 912 448 301',
};

const poolEmail = (key: string) => `pool-${key}@talpass.test`;

async function check<T>(
  promise: PromiseLike<{ data: T; error: { message: string } | null }>,
  context: string,
): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(`${context}: ${error.message}`);
  return data;
}

async function ensureUser(admin: SupabaseClient, email: string) {
  const created = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  let id = created.data.user?.id ?? null;
  if (!id) id = await findUserIdByEmail(admin, email);
  if (!id) throw new Error(`No se pudo crear ${email}`);
  await check(
    admin
      .from('profiles')
      .update({ role: 'agency_member', locale: 'de' })
      .eq('id', id),
    'Rol de agencia',
  );
  return id;
}

async function idOf(admin: SupabaseClient, table: string, slug: string) {
  const row = await check(
    admin.from(table).select('id').eq('slug', slug).single(),
    `${table}.${slug}`,
  );
  return (row as { id: string }).id;
}

async function candidateId(admin: SupabaseClient, key: string) {
  const id = await findUserIdByEmail(admin, poolEmail(key));
  if (!id) throw new Error(`Falta ${poolEmail(key)}: corre antes seed:pool.`);
  return id;
}

assertLocalTarget('Sembrar la demo de Hindi');
const admin = adminClient();

const ownerId = await ensureUser(admin, AGENCY.owner);

const agency = await check(
  admin
    .from('agencies')
    .upsert(
      {
        name: AGENCY.name,
        slug: AGENCY.slug,
        country_code: 'DE',
        registration_type_id: await idOf(
          admin,
          'registration_types',
          'handelsregister',
        ),
        registration_number: 'HRB 200252',
        status: 'approved',
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single(),
  'Agencia',
);
const agencyId = (agency as { id: string }).id;

await check(
  admin.from('agency_translations').upsert(
    [
      {
        agency_id: agencyId,
        locale: 'de',
        description:
          'Personaldienstleister in Göttingen für Lager, Logistik und Produktion.',
      },
      {
        agency_id: agencyId,
        locale: 'en',
        description:
          'Staffing agency in Göttingen for warehouse, logistics and production.',
      },
      {
        agency_id: agencyId,
        locale: 'es',
        description: 'ETT de Göttingen para almacén, logística y producción.',
      },
    ],
    { onConflict: 'agency_id,locale' },
  ),
  'Traducciones de la agencia',
);

await check(
  admin
    .from('agency_members')
    .upsert(
      { profile_id: ownerId, agency_id: agencyId, role: 'owner' },
      { onConflict: 'profile_id,agency_id' },
    ),
  'Miembro',
);

// ------------------------------------------------------------------ oferta
const job = await check(
  admin
    .from('jobs')
    .upsert(
      {
        agency_id: agencyId,
        created_by: ownerId,
        slug: JOB_SLUG,
        client_company_name: null,
        show_client_company: false,
        country_code: 'DE',
        city: 'Göttingen',
        sector_id: await idOf(admin, 'sectors', 'warehouse'),
        salary_min: 15.33,
        salary_max: null,
        salary_currency: 'EUR',
        salary_period: 'hour',
        shifts: ['morning', 'afternoon'],
        weekly_hours: 40,
        required_language_code: 'en',
        required_language_level: 'a2',
        requires_driving_license: false,
        housing_provided: false,
        housing_price: null,
        housing_currency: null,
        transport_provided: true,
        min_contract_months: 3,
        start_date: '2026-11-17',
        status: 'draft',
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single(),
  'Oferta',
);
const jobId = (job as { id: string }).id;

await check(
  admin.from('job_translations').upsert(
    [
      {
        job_id: jobId,
        locale: 'de',
        title: 'Lagerhelfer (m/w/d) in Göttingen',
        description:
          'Kommissionierung, Verpackung und Warenannahme. Früh- und Spätschicht. Fahrdienst zur Arbeit und Begleitung am ersten Tag.',
      },
      {
        job_id: jobId,
        locale: 'en',
        title: 'Warehouse operative in Göttingen',
        description:
          'Order picking, packing and goods receipt. Morning and afternoon shifts. Transport to work and someone with you on your first day.',
      },
      {
        job_id: jobId,
        locale: 'es',
        title: 'Mozo/a de almacén en Göttingen',
        description:
          'Preparación de pedidos, embalaje y recepción de mercancía. Turnos de mañana y tarde. Te llevamos al trabajo y te acompañamos el primer día.',
      },
    ],
    { onConflict: 'job_id,locale' },
  ),
  'Traducciones de la oferta',
);

await check(
  admin
    .from('jobs')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', jobId),
  'Publicar oferta',
);

// Segunda oferta: la que Pablo encuentra en /ofertas y a la que se postula.
const job2 = await check(
  admin
    .from('jobs')
    .upsert(
      {
        agency_id: agencyId,
        created_by: ownerId,
        slug: 'produktionshelfer-goettingen',
        client_company_name: null,
        show_client_company: false,
        country_code: 'DE',
        city: 'Göttingen',
        sector_id: await idOf(admin, 'sectors', 'production'),
        salary_min: 15.1,
        salary_max: 16.5,
        salary_currency: 'EUR',
        salary_period: 'hour',
        shifts: ['morning', 'afternoon', 'night'],
        weekly_hours: 38,
        required_language_code: 'en',
        required_language_level: 'a2',
        requires_driving_license: false,
        housing_provided: false,
        housing_price: null,
        housing_currency: null,
        transport_provided: true,
        min_contract_months: 6,
        start_date: '2026-12-01',
        status: 'draft',
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single(),
  'Segunda oferta',
);
const job2Id = (job2 as { id: string }).id;

await check(
  admin.from('job_translations').upsert(
    [
      {
        job_id: job2Id,
        locale: 'de',
        title: 'Produktionshelfer (m/w/d) in Göttingen',
        description:
          'Maschinenbedienung, Sichtkontrolle und Verpackung in der Lebensmittelproduktion. 3-Schicht-System mit Zuschlägen. Fahrdienst zur Arbeit.',
      },
      {
        job_id: job2Id,
        locale: 'en',
        title: 'Production operative in Göttingen',
        description:
          'Machine operation, visual quality checks and packing in food production. Three-shift system with shift bonuses. Transport to work provided.',
      },
      {
        job_id: job2Id,
        locale: 'es',
        title: 'Operario/a de producción en Göttingen',
        description:
          'Manejo de máquinas, control visual de calidad y embalaje en producción de alimentos. Tres turnos, con plus por turno. Te llevamos al trabajo.',
      },
    ],
    { onConflict: 'job_id,locale' },
  ),
  'Traducciones de la segunda oferta',
);

await check(
  admin
    .from('jobs')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', job2Id),
  'Publicar segunda oferta',
);

// ------------------------------------------------------------- teléfonos
for (const [key, phone] of Object.entries(PHONES)) {
  const id = await findUserIdByEmail(admin, poolEmail(key));
  if (!id) continue;
  await check(
    admin
      .from('candidate_private')
      .upsert({ candidate_id: id, phone }, { onConflict: 'candidate_id' }),
    `Teléfono de ${key}`,
  );
}

// Lo que ve la ETT al contratar: un correo con cara de correo. El de entrar
// sigue siendo `pool-<key>@talpass.test` (vive en auth.users, no aquí).
const CONTACT_EMAILS: Record<string, string> = {
  pablo: 'pablo.herrera@example.com',
  elena: 'elena.ruiz@example.com',
  tiagof: 'tiago.ferreira@example.com',
  sergiom: 'sergio.molina@example.com',
  carla: 'carla.dominguez@example.com',
  ruim: 'rui.martins@example.com',
};
for (const [key, address] of Object.entries(CONTACT_EMAILS)) {
  const id = await findUserIdByEmail(admin, poolEmail(key));
  if (!id) continue;
  await check(
    admin.from('profiles').update({ email: address }).eq('id', id),
    `Correo de ${key}`,
  );
}

// ------------------------------------------------------------- papeles
// Archivos de verdad (CV, DNI y carné de muestra, audio en inglés con voz)
// en lugar de los de texto de seed:pool, para que la ETT los abra al contratar.
const ASSETS = [
  {
    file: 'id-front.pdf',
    slug: 'id_front',
    bucket: 'candidate-documents',
    mime: 'application/pdf',
  },
  {
    file: 'id-back.pdf',
    slug: 'id_back',
    bucket: 'candidate-documents',
    mime: 'application/pdf',
  },
  {
    file: 'cv.pdf',
    slug: 'cv',
    bucket: 'candidate-documents',
    mime: 'application/pdf',
  },
  {
    file: 'intro-en.m4a',
    slug: 'audio_en',
    bucket: 'candidate-audio',
    mime: 'audio/mp4',
  },
  {
    file: 'driving-licence.pdf',
    slug: 'driving_license',
    bucket: 'candidate-documents',
    mime: 'application/pdf',
  },
];
const assetDir = new URL('./demo-assets/', import.meta.url);
const typeIds = new Map(
  (
    (await check(
      admin.from('document_types').select('id, slug'),
      'Tipos de documento',
    )) as { id: string; slug: string }[]
  ).map((row) => [row.slug, row.id]),
);

for (const key of Object.keys(PHONES)) {
  const id = await findUserIdByEmail(admin, poolEmail(key));
  if (!id) continue;
  for (const asset of ASSETS) {
    const source = new URL(`${key}/${asset.file}`, assetDir);
    if (!existsSync(source)) continue;
    const typeId = typeIds.get(asset.slug)!;
    const bytes = readFileSync(source);
    const path = `${id}/${asset.file}`;

    const old = (await check(
      admin
        .from('candidate_documents')
        .select('id, storage_bucket, storage_path')
        .eq('candidate_id', id)
        .eq('document_type_id', typeId),
      `Papeles de ${key}`,
    )) as { id: string; storage_bucket: string; storage_path: string }[];
    for (const row of old) {
      if (row.storage_path !== path)
        await admin.storage.from(row.storage_bucket).remove([row.storage_path]);
      await check(
        admin.from('candidate_documents').delete().eq('id', row.id),
        `Borrar ${asset.slug} de ${key}`,
      );
    }

    const { error } = await admin.storage
      .from(asset.bucket)
      .upload(path, bytes, { contentType: asset.mime, upsert: true });
    if (error) throw new Error(`Subida ${path}: ${error.message}`);

    await check(
      admin.from('candidate_documents').insert({
        candidate_id: id,
        document_type_id: typeId,
        storage_bucket: asset.bucket,
        storage_path: path,
        status: 'verified',
        reviewed_at: new Date().toISOString(),
        mime_type: asset.mime,
        size_bytes: bytes.byteLength,
      }),
      `Documento ${asset.slug} de ${key}`,
    );
  }
}

// --------------------------------------------------------- conversaciones
// Se borran y se rehacen: así la demo arranca siempre igual.
await check(
  admin.from('demo_conversations').delete().eq('agency_id', agencyId),
  'Limpiar conversaciones',
);

const minutesAgo = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();

type Seeded = {
  key: string;
  status: 'pending' | 'open' | 'hired';
  messages: [
    sender: 'agency' | 'candidate',
    body: string,
    minutesAgo: number,
  ][];
};

const SEEDED: Seeded[] = [
  {
    key: 'tiagof',
    status: 'hired',
    messages: [
      [
        'agency',
        'Hallo Tiago, wir haben eine Stelle als Lagerhelfer in Göttingen, Früh- und Spätschicht, ab 15,33 €/h. Hätten Sie Interesse?',
        60 * 26,
      ],
      [
        'candidate',
        'Hello! Yes, I am interested. I live in Hannover and have a car, so I can get there easily.',
        60 * 25,
      ],
      [
        'agency',
        'Perfect. Can you start on Monday the 17th at 6:00? Please call me to confirm.',
        60 * 24,
      ],
      [
        'candidate',
        'Yes, Monday is fine. My number is +49 1514 8832 906.',
        60 * 23,
      ],
    ],
  },
  {
    key: 'elena',
    status: 'open',
    messages: [
      [
        'agency',
        'Hi Elena, we have a warehouse job in Göttingen with transport to work included. Morning and afternoon shifts, from €15.33/h. Interested?',
        180,
      ],
      [
        'candidate',
        'Hi! Yes, very interested. Is the transport from Kassel too, or only inside Göttingen?',
        150,
      ],
    ],
  },
];

for (const conversation of SEEDED) {
  const cid = await candidateId(admin, conversation.key);
  const row = await check(
    admin
      .from('demo_conversations')
      .insert({
        agency_id: agencyId,
        candidate_id: cid,
        job_id: jobId,
        status: conversation.status,
        created_by: ownerId,
        created_at: minutesAgo(conversation.messages[0][2] + 1),
        updated_at: minutesAgo(conversation.messages.at(-1)![2]),
      })
      .select('id')
      .single(),
    `Conversación con ${conversation.key}`,
  );
  const conversationId = (row as { id: string }).id;

  for (const [sender, body, ago] of conversation.messages) {
    await check(
      admin.rpc('demo_seed_message', {
        p_conversation_id: conversationId,
        p_sender: sender,
        p_sender_id: sender === 'agency' ? ownerId : cid,
        p_body: body,
        p_created_at: minutesAgo(ago),
      }),
      `Mensaje a ${conversation.key}`,
    );
  }
}

console.log('Demo Hindi lista.');
console.log(`  ETT ............ ${AGENCY.owner}`);
console.log(`  candidato ...... ${poolEmail('pablo')} (el de la demo en vivo)`);
console.log(`  contraseña ..... ${DEMO_PASSWORD}`);
