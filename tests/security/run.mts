import type { SupabaseClient } from '@supabase/supabase-js';

import {
  adminClient,
  anonClient,
  signInAs,
} from '../../scripts/lib/supabase.mts';
import { DEMO, DEMO_PASSWORD, seedDemo } from '../../scripts/seed-demo.mts';
import {
  Suite,
  assert,
  assertAbsent,
  assertFails,
  assertNoRows,
  assertOk,
  assertWriteDenied,
  rows,
} from './harness.mts';

/**
 * TESTS DE SEGURIDAD — el entregable de la fase 1.
 *
 * No prueban funciones: prueban POLÍTICAS. Cada comprobación habla con la API
 * real de Supabase, autenticada como un usuario real, exactamente igual que lo
 * hará la aplicación. Si una política se rompe, esto se pone rojo.
 *
 *   pnpm test:security
 *
 * Cómo comprobar que los tests valen para algo (obligatorio al tocar RLS):
 *
 *   pnpm test:security:drill
 *
 * Rompe políticas a propósito y exige que esta batería se ponga roja. Unos
 * tests que nadie ha visto fallar solo demuestran que el código se ejecuta.
 */

// Datos en claro que la ETT NO puede ver por ningún camino. Se buscan en cada
// respuesta que reciba una ETT.
const SECRETS = [
  'Martínez Ruiz', // apellido completo
  'ES9121000418450200051332', // IBAN
  '+34600111222', // teléfono
  'Calle Betis', // dirección
  '1994-03-12', // fecha de nacimiento
  'carlos@talpass.test', // email
  '12345678901', // Steuer-ID
  'Borrador Secreto', // apellido a medio escribir en el onboarding (fase 2)
];

const SENSITIVE_TABLES = [
  'candidates',
  'candidate_private',
  'candidate_identifiers',
  'candidate_sectors',
  'candidate_documents',
  'candidate_onboarding_drafts',
  'profiles',
  'consents',
  'activity_pings',
  'email_log',
  'data_deletion_requests',
];

const suite = new Suite();

console.log('Sembrando datos de demostración (con --reset)…');
const ids = await seedDemo({ reset: true });

const admin = adminClient();
const anon = anonClient();

const agency: SupabaseClient = await signInAs(
  DEMO.agencies.nordlicht.owner,
  DEMO_PASSWORD,
);
const otherAgency: SupabaseClient = await signInAs(
  DEMO.agencies.elbe.owner,
  DEMO_PASSWORD,
);
const candidate: SupabaseClient = await signInAs(
  DEMO.candidates.verified,
  DEMO_PASSWORD,
);
const otherCandidate: SupabaseClient = await signInAs(
  DEMO.candidates.pending,
  DEMO_PASSWORD,
);

const idFrontPath = `${ids.candidates.verified}/id-front.pdf`;
const cvPath = `${ids.candidates.verified}/cv.pdf`;

/**
 * Descarga el DNI con una sesión de ETT recién abierta.
 *
 * Hace falta porque Supabase Storage cachea el resultado de la política por
 * token de acceso: reutilizar el mismo cliente mediría la caché en lugar de la
 * política. Un token nuevo es lo que recibiría cualquier petición real
 * posterior a la revocación.
 */
async function freshAgencySession() {
  const client = await signInAs(DEMO.agencies.nordlicht.owner, DEMO_PASSWORD);
  return client.storage.from('candidate-documents').download(idFrontPath);
}

// ==========================================================================
suite.section('1 · La ETT no alcanza los datos personales de un candidato');

suite.check('no lee la tabla `candidates` (ni una fila)', async () => {
  const result = await agency.from('candidates').select('*');
  assertNoRows(result, 'La ETT ha leído `candidates`');
});

suite.check('no lee `candidate_private` — IBAN y dirección', async () => {
  const result = await agency.from('candidate_private').select('*');
  assertNoRows(result, 'La ETT ha leído `candidate_private`');
});

suite.check('no lee `candidate_identifiers` — Steuer-ID', async () => {
  const result = await agency.from('candidate_identifiers').select('*');
  assertNoRows(result, 'La ETT ha leído los identificadores fiscales');
});

suite.check('no lee el `profiles` de un candidato — email', async () => {
  const result = await agency
    .from('profiles')
    .select('*')
    .eq('id', ids.candidates.verified);
  assertNoRows(result, 'La ETT ha leído el perfil de un candidato');
});

suite.check('ninguna tabla sensible le devuelve nada', async () => {
  for (const table of SENSITIVE_TABLES) {
    const result = await agency.from(table).select('*');
    const data = Array.isArray(result.data) ? result.data : [];
    assertAbsent(data, SECRETS, `Fuga leyendo \`${table}\` como ETT`);
  }
});

suite.check('tampoco por join desde una aplicación suya', async () => {
  // PostgREST puede incrustar relaciones. La RLS de la tabla incrustada sigue
  // aplicándose: si esto devolviera el candidato entero, sería la fuga clásica.
  const result = await agency
    .from('applications')
    .select('*, candidates(*), jobs(*)');
  assertAbsent(result.data, SECRETS, 'Fuga por join desde `applications`');
});

suite.check('tampoco por join desde la solicitud de acceso', async () => {
  const result = await agency
    .from('document_access_requests')
    .select('*, candidates(*), candidate_private(*)');
  assertAbsent(result.data, SECRETS, 'Fuga por join desde la solicitud');
});

suite.check('no puede llamar a `rls_audit()` por RPC', async () => {
  const result = await agency.rpc('rls_audit');
  assertFails(result, 'La ETT ha podido ejecutar `rls_audit()`');
});

// ==========================================================================
suite.section('2 · La bolsa está seudonimizada en la base de datos (ADR-03)');

suite.check('la ETT sí ve al candidato verificado en la vista', async () => {
  const data = rows(
    await agency.from('candidate_directory').select('*'),
    'La ETT no puede leer la bolsa',
  ) as Record<string, unknown>[];

  const row = data.find((r) => r.candidate_id === ids.candidates.verified);
  assert(row != null, 'El candidato verificado no aparece en la bolsa');
});

suite.check('solo nombre e inicial, nunca el apellido', async () => {
  const data = rows(
    await agency.from('candidate_directory').select('*'),
    'Lectura de la bolsa',
  ) as Record<string, unknown>[];

  const row = data.find((r) => r.candidate_id === ids.candidates.verified)!;
  assert(
    row.display_name === 'Carlos M.',
    `display_name inesperado: ${String(row.display_name)}`,
  );
  assertAbsent(data, SECRETS, 'La bolsa filtra datos personales');
});

suite.check('edad calculada, nunca la fecha de nacimiento', async () => {
  const data = rows(
    await agency.from('candidate_directory').select('*'),
    'Lectura de la bolsa',
  ) as Record<string, unknown>[];

  const row = data.find((r) => r.candidate_id === ids.candidates.verified)!;
  assert(typeof row.age === 'number', 'La bolsa no expone la edad calculada');
  assert(!('date_of_birth' in row), 'La vista expone la fecha de nacimiento');
});

suite.check('la vista no tiene ni una columna prohibida', async () => {
  const data = rows(
    await agency.from('candidate_directory').select('*'),
    'Lectura de la bolsa',
  ) as Record<string, unknown>[];

  const forbidden = [
    'last_name',
    'date_of_birth',
    'email',
    'phone',
    'address_line',
    'postal_code',
    'iban',
    'iban_ciphertext',
    'iban_last4',
    'storage_path',
    'value_ciphertext',
  ];

  for (const row of data) {
    for (const column of Object.keys(row)) {
      assert(
        !forbidden.includes(column),
        `La vista expone la columna prohibida "${column}"`,
      );
    }
  }
});

suite.check('un candidato inactivo no aparece en la bolsa', async () => {
  const data = rows(
    await agency.from('candidate_directory').select('candidate_id'),
    'Lectura de la bolsa',
  ) as { candidate_id: string }[];

  assert(
    !data.some((r) => r.candidate_id === ids.candidates.inactive),
    'Un candidato inactivo sigue en la bolsa (regla de negocio 6)',
  );
});

suite.check('un candidato sin verificar no aparece en la bolsa', async () => {
  const data = rows(
    await agency.from('candidate_directory').select('candidate_id'),
    'Lectura de la bolsa',
  ) as { candidate_id: string }[];

  for (const key of ['pending', 'unverified'] as const) {
    assert(
      !data.some((r) => r.candidate_id === ids.candidates[key]),
      `Un candidato "${key}" aparece en la bolsa`,
    );
  }
});

suite.check('un candidato no puede leer la bolsa', async () => {
  const result = await candidate.from('candidate_directory').select('*');
  assertNoRows(result, 'Un candidato ha leído la bolsa entera');
});

suite.check('un anónimo no puede leer la bolsa', async () => {
  const result = await anon.from('candidate_directory').select('*');
  assertNoRows(result, 'Un anónimo ha leído la bolsa');
});

// ==========================================================================
suite.section('3 · Documentos: nada sin consentimiento vigente (ADR-05)');

suite.check(
  'sin consentimiento, la ETT no ve ni la ficha del documento',
  async () => {
    const result = await agency.from('candidate_documents').select('*');
    assertNoRows(result, 'La ETT ve documentos sin consentimiento');
  },
);

suite.check('sin consentimiento, la descarga del archivo falla', async () => {
  const result = await agency.storage
    .from('candidate-documents')
    .download(idFrontPath);
  assert(
    result.error != null,
    'La ETT ha descargado un documento sin consentimiento',
  );
});

let requestId = '';

suite.check('la ETT puede solicitar acceso (queda pendiente)', async () => {
  const result = await agency
    .from('document_access_requests')
    .insert({
      agency_id: ids.agencies.nordlicht,
      candidate_id: ids.candidates.verified,
      application_id: ids.application,
      requested_by: ids.members.nordlichtOwner,
      message: 'Necesitamos verificar la identidad antes de la entrevista.',
    })
    .select('id, status')
    .single();

  assertOk(result, 'La ETT no ha podido solicitar acceso');
  const row = result.data as { id: string; status: string };
  assert(row.status === 'pending', 'La solicitud no nace pendiente');
  requestId = row.id;

  const scope = await agency.from('document_access_request_scope').insert({
    request_id: requestId,
    document_type_id: ids.documentTypes.id_front,
  });
  assertOk(scope, 'La ETT no ha podido fijar el alcance de la solicitud');
});

suite.check('la ETT NO puede concederse el acceso a sí misma', async () => {
  const result = await agency
    .from('document_access_requests')
    .update({ status: 'granted' })
    .eq('id', requestId)
    .select('id');
  assertWriteDenied(result, 'La ETT se ha autoconcedido el acceso');
});

suite.check(
  'con la solicitud pendiente, sigue sin poder descargar',
  async () => {
    const result = await agency.storage
      .from('candidate-documents')
      .download(idFrontPath);
    assert(result.error != null, 'Una solicitud pendiente ya daba acceso');
  },
);

suite.check('el candidato concede el acceso', async () => {
  const result = await candidate
    .from('document_access_requests')
    .update({ status: 'granted' })
    .eq('id', requestId)
    .select('id, status, access_expires_at')
    .single();

  assertOk(result, 'El candidato no ha podido conceder el acceso');
  const row = result.data as { status: string; access_expires_at: string };
  assert(row.status === 'granted', 'La solicitud no quedó en `granted`');
  assert(
    row.access_expires_at != null,
    'Un acceso concedido sin fecha de caducidad es un acceso para siempre',
  );
});

suite.check(
  'con el consentimiento, la ETT ya ve la ficha del documento',
  async () => {
    const data = rows(
      await agency.from('candidate_documents').select('id, storage_path'),
      'Lectura de documentos con consentimiento',
    ) as { id: string }[];

    assert(
      data.some((d) => d.id === ids.documents.verifiedCandidateIdFront),
      'El consentimiento concedido no da acceso al documento pedido',
    );
  },
);

suite.check('…y descarga el archivo concedido', async () => {
  const result = await agency.storage
    .from('candidate-documents')
    .download(idFrontPath);
  assert(
    result.error == null,
    `La descarga con consentimiento ha fallado: ${result.error?.message}`,
  );
});

suite.check('el alcance se respeta: el CV no estaba pedido', async () => {
  const result = await agency.storage
    .from('candidate-documents')
    .download(cvPath);
  assert(
    result.error != null,
    'El consentimiento sobre el DNI ha abierto también el CV',
  );
});

suite.check('la otra ETT no se aprovecha de este consentimiento', async () => {
  const download = await otherAgency.storage
    .from('candidate-documents')
    .download(idFrontPath);
  assert(
    download.error != null,
    'Otra ETT ha descargado un documento concedido a la primera',
  );

  const table = await otherAgency.from('candidate_documents').select('*');
  assertNoRows(table, 'Otra ETT ve el documento concedido a la primera');

  const request = await otherAgency
    .from('document_access_requests')
    .select('*')
    .eq('id', requestId);
  assertNoRows(request, 'Otra ETT ve la solicitud ajena');
});

suite.check('caducado el acceso, deja de funcionar', async () => {
  const expire = await admin
    .from('document_access_requests')
    .update({ access_expires_at: new Date(Date.now() - 60_000).toISOString() })
    .eq('id', requestId)
    .select('id');
  assertOk(expire, 'No se ha podido caducar el acceso para la prueba');

  const table = await agency.from('candidate_documents').select('*');
  assertNoRows(table, 'Un acceso caducado sigue mostrando el documento');

  // Sesión nueva: ver la comprobación siguiente para el porqué.
  const download = await freshAgencySession();
  assert(download.error != null, 'Un acceso caducado sigue descargando');
});

suite.check('revocado el acceso, deja de funcionar', async () => {
  // Se devuelve la ventana a futuro para que lo único que corte sea la
  // revocación, y no la caducidad de la comprobación anterior.
  const restore = await admin
    .from('document_access_requests')
    .update({
      status: 'granted',
      access_expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    })
    .eq('id', requestId)
    .select('id');
  assertOk(restore, 'No se ha podido restaurar la ventana de acceso');

  const beforeRevoke = await freshAgencySession();
  assert(
    beforeRevoke.error == null,
    'La restauración de la ventana no ha devuelto el acceso: la prueba de ' +
      'revocación no probaría nada',
  );

  const revoke = await candidate
    .from('document_access_requests')
    .update({ status: 'revoked' })
    .eq('id', requestId)
    .select('id');
  assertOk(revoke, 'El candidato no ha podido revocar');

  const afterRevoke = await freshAgencySession();
  assert(afterRevoke.error != null, 'Un acceso revocado sigue descargando');

  const table = await agency.from('candidate_documents').select('*');
  assertNoRows(table, 'Un acceso revocado sigue mostrando el documento');
});

suite.check(
  'AVISO CONOCIDO: storage cachea la autorización por token',
  async () => {
    // Comprobado contra la API real: Supabase Storage memoriza el resultado de
    // la política por (token, objeto). Con la solicitud ya revocada, un token
    // NUEVO recibe 400 al instante — la política funciona —, pero el token que
    // ya descargó ese archivo lo sigue descargando hasta que caduca (1 h).
    //
    // Consecuencia de diseño para la fase 7, y no es opcional: los documentos
    // NO se sirven nunca con URL autenticada directa al navegador de la ETT.
    // Se sirven con URL firmada de vida corta que emite el servidor DESPUÉS de
    // comprobar el permiso, que es además donde se escribe
    // `document_access_log`. Así la revocación es inmediata porque la decisión
    // la toma nuestro código, no la caché de storage.
    //
    // Este test fija el comportamiento observado: si algún día Supabase lo
    // cambia, se pondrá rojo y habrá que releer esta nota.
    const cached = await agency.storage
      .from('candidate-documents')
      .download(idFrontPath);
    const fresh = await freshAgencySession();

    assert(
      fresh.error != null,
      'Una sesión nueva sigue descargando tras la revocación: esto SÍ sería ' +
        'una brecha, no una caché',
    );
    assert(
      cached.error != null || fresh.error != null,
      'Ni la sesión cacheada ni la nueva han sido cortadas',
    );
  },
);

suite.check('la ETT no puede pedir acceso en nombre de otra ETT', async () => {
  const result = await agency
    .from('document_access_requests')
    .insert({
      agency_id: ids.agencies.elbe,
      candidate_id: ids.candidates.verified,
      requested_by: ids.members.nordlichtOwner,
    })
    .select('id');
  assertWriteDenied(result, 'Una ETT ha creado una solicitud a nombre de otra');
});

// ==========================================================================
suite.section('4 · Un candidato no alcanza los datos de otro');

suite.check('no lee la ficha de otro candidato', async () => {
  const result = await otherCandidate
    .from('candidates')
    .select('*')
    .eq('profile_id', ids.candidates.verified);
  assertNoRows(result, 'Un candidato ha leído la ficha de otro');
});

suite.check('no lee los datos sensibles de otro', async () => {
  const result = await otherCandidate
    .from('candidate_private')
    .select('*')
    .eq('candidate_id', ids.candidates.verified);
  assertNoRows(result, 'Un candidato ha leído el IBAN de otro');
});

suite.check('no lee los documentos de otro', async () => {
  const table = await otherCandidate
    .from('candidate_documents')
    .select('*')
    .eq('candidate_id', ids.candidates.verified);
  assertNoRows(table, 'Un candidato ve los documentos de otro');

  const download = await otherCandidate.storage
    .from('candidate-documents')
    .download(idFrontPath);
  assert(
    download.error != null,
    'Un candidato ha descargado el documento de otro',
  );
});

suite.check('no lee las aplicaciones de otro', async () => {
  const result = await otherCandidate
    .from('applications')
    .select('*')
    .eq('candidate_id', ids.candidates.verified);
  assertNoRows(result, 'Un candidato ve las aplicaciones de otro');
});

suite.check(
  'nada de otro candidato se cuela en ninguna respuesta',
  async () => {
    for (const table of SENSITIVE_TABLES) {
      const result = await otherCandidate.from(table).select('*');
      assertAbsent(
        result.data,
        SECRETS,
        `Fuga leyendo \`${table}\` como otro candidato`,
      );
    }
  },
);

// ==========================================================================
suite.section('5 · El candidato no se verifica a sí mismo');

suite.check('no cambia el estado de sus propios documentos', async () => {
  // Se usa la candidata con documentos PENDIENTES a propósito. Con documentos
  // ya verificados, el UPDATE no cambiaría ninguna columna vigilada y pasaría
  // sin que el disparador tuviera nada que impedir: el test saldría verde sin
  // haber probado nada.
  const before = rows(
    await otherCandidate
      .from('candidate_documents')
      .select('id, status')
      .eq('candidate_id', ids.candidates.pending),
    'Lectura de los propios documentos',
  ) as { id: string; status: string }[];

  assert(
    before.some((d) => d.status === 'pending'),
    'La prueba necesita al menos un documento pendiente y no lo hay',
  );

  const result = await otherCandidate
    .from('candidate_documents')
    .update({ status: 'verified' })
    .eq('candidate_id', ids.candidates.pending)
    .select('id');
  assertWriteDenied(
    result,
    'El candidato ha verificado sus propios documentos',
  );

  const after = rows(
    await otherCandidate
      .from('candidate_documents')
      .select('status')
      .eq('candidate_id', ids.candidates.pending),
    'Relectura de los propios documentos',
  ) as { status: string }[];

  assert(
    after.every((d) => d.status === 'pending'),
    'El estado de verificación ha cambiado pese a todo',
  );
});

suite.check('no sube un documento ya verificado', async () => {
  const result = await candidate
    .from('candidate_documents')
    .insert({
      candidate_id: ids.candidates.verified,
      document_type_id: ids.documentTypes.tax_doc,
      storage_path: `${ids.candidates.verified}/trampa.pdf`,
      status: 'verified',
      mime_type: 'application/pdf',
      size_bytes: 1024,
    })
    .select('id');
  assertWriteDenied(result, 'Un documento ha nacido verificado');
});

suite.check('no cambia su propio `verification_status`', async () => {
  const result = await otherCandidate
    .from('candidates')
    .update({ verification_status: 'verified' })
    .eq('profile_id', ids.candidates.pending)
    .select('profile_id');
  assertWriteDenied(result, 'Un candidato se ha verificado a sí mismo');
});

suite.check('no se asciende a administrador', async () => {
  const result = await candidate
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', ids.candidates.verified)
    .select('id');
  assertWriteDenied(result, 'Un candidato se ha hecho administrador');
});

// Fase 2: el consentimiento es la base legal de todo el producto (ADR-05,
// ADR-18). Si se pudiera escribir a nombre de otro, la prueba de haberlo
// obtenido no valdría nada — y con ella se cae la defensa GDPR entera.
suite.check('no consiente en nombre de otro candidato', async () => {
  const result = await candidate
    .from('consents')
    .insert({
      profile_id: ids.candidates.pending,
      type: 'audio_sharing',
      version: 'falsificado',
    })
    .select('id');
  assertWriteDenied(result, 'Un candidato ha consentido por otro');
});

suite.check('no marca como verificado su identificador fiscal', async () => {
  const result = await candidate
    .from('candidate_identifiers')
    .update({ verified_at: new Date().toISOString() })
    .eq('candidate_id', ids.candidates.verified)
    .select('id');
  assertWriteDenied(
    result,
    'El candidato ha verificado su propio identificador',
  );
});

suite.check('un candidato sin verificar no puede aplicar', async () => {
  const unverified = await signInAs(DEMO.candidates.unverified, DEMO_PASSWORD);
  const result = await unverified
    .from('applications')
    .insert({
      job_id: ids.jobs[DEMO.jobs.elbePublished],
      candidate_id: ids.candidates.unverified,
    })
    .select('id');
  assertWriteDenied(
    result,
    'Un candidato sin verificar ha aplicado a una vacante',
  );
});

// ==========================================================================
suite.section('6 · Una ETT no ve el trabajo de otra ETT');

suite.check('no ve las vacantes en borrador de la otra', async () => {
  const data = rows(
    await otherAgency.from('jobs').select('slug, status, agency_id'),
    'Lectura de vacantes',
  ) as { slug: string; status: string; agency_id: string }[];

  assert(
    !data.some((job) => job.slug === DEMO.jobs.nordlichtDraft),
    'Una ETT ve el borrador de otra',
  );

  // Lo único que puede ver de fuera de su casa es lo que ya es público.
  const foreignNotPublished = data.filter(
    (job) => job.agency_id !== ids.agencies.elbe && job.status !== 'published',
  );
  assert(
    foreignNotPublished.length === 0,
    `Una ETT ve vacantes ajenas sin publicar: ${foreignNotPublished
      .map((j) => j.slug)
      .join(', ')}`,
  );
});

suite.check('no modifica las vacantes de la otra', async () => {
  const result = await otherAgency
    .from('jobs')
    .update({ status: 'closed' })
    .eq('slug', DEMO.jobs.nordlichtPublished)
    .select('id');
  assertWriteDenied(result, 'Una ETT ha modificado la vacante de otra');
});

suite.check('no ve las aplicaciones a las vacantes de la otra', async () => {
  const data = rows(
    await otherAgency.from('applications').select('id'),
    'Lectura de aplicaciones',
  ) as { id: string }[];

  assert(
    !data.some((a) => a.id === ids.application),
    'Una ETT ve las candidaturas de otra',
  );
});

suite.check('no cambia el estado de una aplicación ajena', async () => {
  const result = await otherAgency
    .from('applications')
    .update({ status: 'in_review' })
    .eq('id', ids.application)
    .select('id');
  assertWriteDenied(result, 'Una ETT ha movido la candidatura de otra');
});

// ==========================================================================
suite.section('7 · El anónimo solo ve vacantes publicadas');

suite.check('solo devuelve vacantes en estado `published`', async () => {
  const data = rows(
    await anon.from('jobs').select('slug, status'),
    'Lectura anónima de vacantes',
  ) as { slug: string; status: string }[];

  assert(data.length > 0, 'El anónimo no ve ninguna vacante publicada');
  assert(
    data.every((job) => job.status === 'published'),
    'El anónimo ve vacantes que no están publicadas',
  );
  assert(
    !data.some((job) =>
      [DEMO.jobs.nordlichtDraft, DEMO.jobs.elbeDraft].includes(
        job.slug as never,
      ),
    ),
    'El anónimo ve un borrador',
  );
});

suite.check('no ve el texto de las vacantes no publicadas', async () => {
  const data = rows(
    await anon.from('job_translations').select('job_id, title'),
    'Lectura anónima de traducciones',
  ) as { title: string }[];

  assertAbsent(data, ['borrador', '(draft)'], 'El anónimo ve un borrador');
});

suite.check('no lee ninguna tabla sensible', async () => {
  for (const table of SENSITIVE_TABLES) {
    const result = await anon.from(table).select('*');
    assertNoRows(result, `El anónimo ha leído \`${table}\``);
  }
});

suite.check('no puede aplicar a una vacante', async () => {
  const result = await anon
    .from('applications')
    .insert({
      job_id: ids.jobs[DEMO.jobs.elbePublished],
      candidate_id: ids.candidates.verified,
    })
    .select('id');
  assertWriteDenied(result, 'Un anónimo ha creado una candidatura');
});

// ==========================================================================
suite.section('8 · Integridad del ciclo de vida (ADR-04)');

suite.check('el candidato no mueve el estado de su candidatura', async () => {
  const result = await candidate
    .from('applications')
    .update({ status: 'hired' })
    .eq('id', ids.application)
    .select('id');
  assertWriteDenied(result, 'El candidato se ha contratado a sí mismo');
});

suite.check('la ETT no puede saltarse un estado', async () => {
  const result = await agency
    .from('applications')
    .update({ status: 'hired' })
    .eq('id', ids.application)
    .select('id');
  assertFails(result, 'Se ha permitido pending → hired');
});

suite.check(
  'la transición válida sí se aplica y queda registrada',
  async () => {
    const update = await agency
      .from('applications')
      .update({ status: 'in_review' })
      .eq('id', ids.application)
      .select('id, status')
      .single();
    assertOk(update, 'La ETT no ha podido mover la candidatura a in_review');

    const events = rows(
      await agency
        .from('application_events')
        .select('from_status, to_status')
        .eq('application_id', ids.application),
      'Lectura del historial',
    ) as { from_status: string | null; to_status: string }[];

    assert(
      events.some(
        (e) => e.from_status === 'pending' && e.to_status === 'in_review',
      ),
      'La transición no ha quedado en el historial de auditoría',
    );
  },
);

suite.check('el historial de auditoría no se puede reescribir', async () => {
  const insert = await agency.from('application_events').insert({
    application_id: ids.application,
    to_status: 'hired',
  });
  assertFails(insert, 'Se ha podido inventar un evento de auditoría');

  const remove = await agency
    .from('application_events')
    .delete()
    .eq('application_id', ids.application)
    .select('id');
  assertWriteDenied(remove, 'Se ha podido borrar el historial');
});

// ==========================================================================
suite.section('9 · Ninguna tabla se queda sin RLS');

suite.check('todas las tablas de `public` tienen RLS activada', async () => {
  const result = await admin.rpc('rls_audit');
  assertOk(result, 'No se ha podido auditar la RLS');

  const audit = result.data as {
    table_name: string;
    rls_enabled: boolean;
    policy_count: number;
  }[];

  assert(audit.length > 0, 'La auditoría no ha devuelto ninguna tabla');

  const unprotected = audit.filter((t) => !t.rls_enabled);
  assert(
    unprotected.length === 0,
    `Tablas SIN RLS: ${unprotected.map((t) => t.table_name).join(', ')}`,
  );

  const orphan = audit.filter((t) => t.policy_count === 0);
  assert(
    orphan.length === 0,
    `Tablas con RLS pero sin ninguna política (inaccesibles hasta para su ` +
      `dueño legítimo): ${orphan.map((t) => t.table_name).join(', ')}`,
  );
});

suite.check('el candidato sí llega a lo suyo (control positivo)', async () => {
  // Sin esto, una RLS que lo negara TODO pasaría los tests anteriores con
  // sobresaliente y la aplicación no funcionaría.
  const own = rows(
    await candidate.from('candidate_private').select('iban_last4'),
    'El candidato no puede leer sus propios datos',
  ) as { iban_last4: string }[];

  assert(own.length === 1, 'El candidato no ve su propia fila privada');
  assert(
    own[0].iban_last4 === '1332',
    'El candidato no ve los últimos dígitos de su IBAN',
  );

  const docs = rows(
    await candidate.from('candidate_documents').select('id'),
    'El candidato no puede ver sus documentos',
  );
  assert(docs.length >= 4, 'El candidato no ve sus propios documentos');

  const download = await candidate.storage
    .from('candidate-documents')
    .download(idFrontPath);
  assert(
    download.error == null,
    'El candidato no puede descargar su propio documento',
  );
});

suite.check(
  'el admin llega a lo que tiene que llegar (control positivo)',
  async () => {
    const adminUser = await signInAs(DEMO.admin, DEMO_PASSWORD);

    const candidates = rows(
      await adminUser.from('candidates').select('profile_id'),
      'El admin no puede leer la lista de candidatos',
    );
    assert(candidates.length >= 4, 'El admin no ve a todos los candidatos');

    const verify = await adminUser
      .from('candidate_documents')
      .update({ status: 'verified', reviewed_at: new Date().toISOString() })
      .eq('candidate_id', ids.candidates.pending)
      .select('id');
    assertOk(verify, 'El admin no puede verificar documentos');
  },
);

// ==========================================================================
process.exit(await suite.run());
