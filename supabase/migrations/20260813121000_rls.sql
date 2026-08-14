-- Fase 1 · Row Level Security. La migración más importante del proyecto.
--
-- Implementa la matriz de acceso de docs/01-DATA-MODEL.md:
--
--   Recurso                        Candidato   ETT sin cons.  ETT con cons.  Admin
--   Perfil propio                  RW          —              —              R
--   Datos sensibles (IBAN, dir.)   RW          Nunca          Nunca          R
--   Documentos                     RW          No             R temporal     RW
--   Bolsa (vista seudonimizada)    —           R              R              R
--   Vacantes publicadas            R           RW (propias)   RW (propias)   RW
--   Aplicaciones                   R (propias) RW (a las suyas)              RW
--
-- Tres reglas que se siguen sin excepción:
--
--   1. RLS ACTIVADA EN TODAS LAS TABLAS. Sin política, una tabla con RLS no
--      devuelve nada: el estado por defecto es denegar, y hay que escribir
--      para abrir. `public.rls_audit()` comprueba que no queda ninguna fuera.
--   2. LA ETT NO TIENE NINGUNA POLÍTICA sobre `candidates`, `candidate_private`,
--      `candidate_identifiers`, `candidate_sectors` ni `profiles`. Ni una de
--      lectura parcial. Su única puerta a la bolsa es la vista
--      `candidate_directory`. Así "no ve el apellido" no depende de que nadie
--      se acuerde de no hacer un `select *`.
--   3. `service_role` no aparece aquí: salta la RLS por atributo del rol. Todo
--      lo que se haga con esa clave es responsabilidad del servidor, y por eso
--      nunca sale de él.

-- ==========================================================================
-- A. Catálogos — lectura pública, escritura solo del admin
-- ==========================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'locales',
    'countries',
    'country_translations',
    'sectors',
    'sector_translations',
    'document_types',
    'document_type_translations',
    'country_document_requirements',
    'identifier_types',
    'identifier_type_translations',
    'registration_types',
    'registration_type_translations',
    'languages',
    'language_translations'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_public_read', t
    );

    execute format(
      'create policy %I on public.%I for all to authenticated '
      'using (app.is_admin()) with check (app.is_admin())',
      t || '_admin_write', t
    );
  end loop;
end;
$$;

-- ==========================================================================
-- B. Identidad
-- ==========================================================================

alter table public.profiles enable row level security;

create policy profiles_owner_read on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- El disparador `profiles_guard_privileged_columns` impide que este UPDATE
-- toque la columna `role`.
create policy profiles_owner_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profiles_admin_read on public.profiles
  for select to authenticated
  using (app.is_admin());

-- Sin política de INSERT ni de DELETE: el perfil lo crea el disparador
-- `on_auth_user_created` y se borra en cascada con `auth.users`.

revoke all on public.profiles from anon;

-- ==========================================================================
-- C. Candidato
--
-- La ETT NO aparece en ninguna de estas políticas. Es intencionado.
-- ==========================================================================

alter table public.candidates enable row level security;

create policy candidates_owner_read on public.candidates
  for select to authenticated
  using (profile_id = (select auth.uid()));

create policy candidates_owner_insert on public.candidates
  for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy candidates_owner_update on public.candidates
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy candidates_admin_read on public.candidates
  for select to authenticated
  using (app.is_admin());

-- El admin verifica: sin UPDATE aquí no podría mover `verification_status`,
-- que es exactamente lo que hace en la fase 4.
create policy candidates_admin_update on public.candidates
  for update to authenticated
  using (app.is_admin())
  with check (app.is_admin());

-- La vista `candidate_directory` lee esta tabla saltándose la RLS. Para que
-- eso funcione sin depender de si el propietario tiene BYPASSRLS, se le da
-- lectura explícita al rol dueño de la vista. `postgres` no es alcanzable
-- desde la API: es el rol de las migraciones.
create policy candidates_view_owner_read on public.candidates
  for select to postgres
  using (true);

revoke all on public.candidates from anon;

-- --- Datos sensibles: nunca salen del candidato y del admin (ADR-08) -------

alter table public.candidate_private enable row level security;

create policy candidate_private_owner_all on public.candidate_private
  for all to authenticated
  using (candidate_id = (select auth.uid()))
  with check (candidate_id = (select auth.uid()));

-- Solo lectura para el admin: el IBAN de una persona no se edita desde el
-- backoffice, se corrige desde su propia cuenta.
create policy candidate_private_admin_read on public.candidate_private
  for select to authenticated
  using (app.is_admin());

revoke all on public.candidate_private from anon;

alter table public.candidate_identifiers enable row level security;

create policy candidate_identifiers_owner_all on public.candidate_identifiers
  for all to authenticated
  using (candidate_id = (select auth.uid()))
  with check (candidate_id = (select auth.uid()));

create policy candidate_identifiers_admin_read on public.candidate_identifiers
  for select to authenticated
  using (app.is_admin());

-- Para poder marcar `verified_at` tras comprobar el papel (fase 4).
create policy candidate_identifiers_admin_update on public.candidate_identifiers
  for update to authenticated
  using (app.is_admin())
  with check (app.is_admin());

revoke all on public.candidate_identifiers from anon;

-- --- Documentos: la única lectura de terceros del schema -------------------

alter table public.candidate_documents enable row level security;

create policy candidate_documents_owner_all on public.candidate_documents
  for all to authenticated
  using (candidate_id = (select auth.uid()))
  with check (candidate_id = (select auth.uid()));

create policy candidate_documents_admin_all on public.candidate_documents
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

-- ADR-05: solo con consentimiento concedido, dentro del alcance pedido y sin
-- que la ventana de acceso haya vencido. Revocar o dejar caducar la corta.
create policy candidate_documents_agency_granted_read on public.candidate_documents
  for select to authenticated
  using (app.agency_can_read_document(id));

revoke all on public.candidate_documents from anon;

alter table public.candidate_sectors enable row level security;

create policy candidate_sectors_owner_all on public.candidate_sectors
  for all to authenticated
  using (candidate_id = (select auth.uid()))
  with check (candidate_id = (select auth.uid()));

create policy candidate_sectors_admin_read on public.candidate_sectors
  for select to authenticated
  using (app.is_admin());

-- Igual que con `candidates`: la vista agrega los sectores, la ETT no toca
-- la tabla.
create policy candidate_sectors_view_owner_read on public.candidate_sectors
  for select to postgres
  using (true);

revoke all on public.candidate_sectors from anon;

-- ==========================================================================
-- D. ETT
-- ==========================================================================

alter table public.agencies enable row level security;

-- El perfil de la ETT aparece en la página pública de sus vacantes.
create policy agencies_public_read on public.agencies
  for select to anon, authenticated
  using (status = 'approved' and deleted_at is null);

-- Un miembro ve su ETT aunque esté pendiente o suspendida: si no, no podría
-- ni entender por qué no puede trabajar.
create policy agencies_member_read on public.agencies
  for select to authenticated
  using (
    exists (
      select 1
      from public.agency_members m
      where m.agency_id = agencies.id
        and m.profile_id = (select auth.uid())
    )
  );

-- El disparador `agencies_guard_privileged_columns` impide tocar `status`.
create policy agencies_owner_update on public.agencies
  for update to authenticated
  using (
    exists (
      select 1
      from public.agency_members m
      where m.agency_id = agencies.id
        and m.profile_id = (select auth.uid())
        and m.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from public.agency_members m
      where m.agency_id = agencies.id
        and m.profile_id = (select auth.uid())
        and m.role = 'owner'
    )
  );

create policy agencies_admin_all on public.agencies
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

alter table public.agency_translations enable row level security;

create policy agency_translations_public_read on public.agency_translations
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.agencies a
      where a.id = agency_translations.agency_id
        and a.status = 'approved'
        and a.deleted_at is null
    )
  );

create policy agency_translations_member_all on public.agency_translations
  for all to authenticated
  using (agency_id = app.current_agency_id())
  with check (agency_id = app.current_agency_id());

create policy agency_translations_admin_all on public.agency_translations
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

alter table public.agency_sectors enable row level security;

create policy agency_sectors_public_read on public.agency_sectors
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.agencies a
      where a.id = agency_sectors.agency_id
        and a.status = 'approved'
        and a.deleted_at is null
    )
  );

create policy agency_sectors_member_all on public.agency_sectors
  for all to authenticated
  using (agency_id = app.current_agency_id())
  with check (agency_id = app.current_agency_id());

create policy agency_sectors_admin_all on public.agency_sectors
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

alter table public.agency_members enable row level security;

-- Cada uno ve el equipo de su propia ETT, y de nadie más.
create policy agency_members_same_agency_read on public.agency_members
  for select to authenticated
  using (
    agency_id in (
      select m.agency_id
      from public.agency_members m
      where m.profile_id = (select auth.uid())
    )
  );

create policy agency_members_admin_all on public.agency_members
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

revoke all on public.agency_members from anon;

-- ==========================================================================
-- E. Vacantes
-- ==========================================================================

alter table public.jobs enable row level security;

-- ADR-02: ver es libre, y sin cuenta. Esta es la única lectura anónima de
-- contenido del proyecto.
create policy jobs_public_read on public.jobs
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null);

create policy jobs_agency_all on public.jobs
  for all to authenticated
  using (agency_id = app.current_agency_id())
  with check (agency_id = app.current_agency_id());

create policy jobs_admin_all on public.jobs
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

alter table public.job_translations enable row level security;

create policy job_translations_public_read on public.job_translations
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.jobs j
      where j.id = job_translations.job_id
        and j.status = 'published'
        and j.deleted_at is null
    )
  );

create policy job_translations_agency_all on public.job_translations
  for all to authenticated
  using (
    exists (
      select 1
      from public.jobs j
      where j.id = job_translations.job_id
        and j.agency_id = app.current_agency_id()
    )
  )
  with check (
    exists (
      select 1
      from public.jobs j
      where j.id = job_translations.job_id
        and j.agency_id = app.current_agency_id()
    )
  );

create policy job_translations_admin_all on public.job_translations
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

-- ==========================================================================
-- F. Aplicaciones
-- ==========================================================================

alter table public.applications enable row level security;

create policy applications_candidate_read on public.applications
  for select to authenticated
  using (candidate_id = (select auth.uid()));

-- Regla de negocio 1: aplicar exige cuenta verificada. Va en la política, no
-- en el formulario: un `curl` no pasa por el formulario.
create policy applications_candidate_insert on public.applications
  for insert to authenticated
  with check (
    candidate_id = (select auth.uid())
    and exists (
      select 1
      from public.candidates c
      where c.profile_id = (select auth.uid())
        and c.verification_status = 'verified'
        and c.status = 'active'
        and c.deleted_at is null
    )
    and exists (
      select 1
      from public.jobs j
      where j.id = applications.job_id
        and j.status = 'published'
        and j.deleted_at is null
    )
  );

-- El candidato no cambia el estado de su candidatura: no hay política de
-- UPDATE para él.

create policy applications_agency_read on public.applications
  for select to authenticated
  using (
    exists (
      select 1
      from public.jobs j
      where j.id = applications.job_id
        and j.agency_id = app.current_agency_id()
    )
  );

create policy applications_agency_update on public.applications
  for update to authenticated
  using (
    exists (
      select 1
      from public.jobs j
      where j.id = applications.job_id
        and j.agency_id = app.current_agency_id()
    )
  )
  with check (
    exists (
      select 1
      from public.jobs j
      where j.id = applications.job_id
        and j.agency_id = app.current_agency_id()
    )
  );

create policy applications_admin_all on public.applications
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

revoke all on public.applications from anon;

alter table public.application_events enable row level security;

-- Solo lectura, para las tres partes. La escritura es del disparador.
create policy application_events_candidate_read on public.application_events
  for select to authenticated
  using (
    exists (
      select 1
      from public.applications a
      where a.id = application_events.application_id
        and a.candidate_id = (select auth.uid())
    )
  );

create policy application_events_agency_read on public.application_events
  for select to authenticated
  using (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = application_events.application_id
        and j.agency_id = app.current_agency_id()
    )
  );

create policy application_events_admin_read on public.application_events
  for select to authenticated
  using (app.is_admin());

revoke all on public.application_events from anon;

-- ==========================================================================
-- G. Acceso a documentos (ADR-05)
-- ==========================================================================

alter table public.document_access_requests enable row level security;

create policy document_access_requests_candidate_read
  on public.document_access_requests
  for select to authenticated
  using (candidate_id = (select auth.uid()));

-- Conceder, denegar y revocar. El disparador comprueba además que el actor sea
-- el candidato, para que esta política no pueda usarse de otra forma.
create policy document_access_requests_candidate_update
  on public.document_access_requests
  for update to authenticated
  using (candidate_id = (select auth.uid()))
  with check (candidate_id = (select auth.uid()));

create policy document_access_requests_agency_read
  on public.document_access_requests
  for select to authenticated
  using (agency_id = app.current_agency_id());

create policy document_access_requests_agency_insert
  on public.document_access_requests
  for insert to authenticated
  with check (
    agency_id = app.current_agency_id()
    and requested_by = (select auth.uid())
  );

-- La ETT no tiene UPDATE: si lo tuviera, el único obstáculo entre ella y los
-- documentos sería un disparador. Mejor que no llegue ni a intentarlo.

create policy document_access_requests_admin_all
  on public.document_access_requests
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

revoke all on public.document_access_requests from anon;

alter table public.document_access_request_scope enable row level security;

create policy document_access_request_scope_read
  on public.document_access_request_scope
  for select to authenticated
  using (
    exists (
      select 1
      from public.document_access_requests r
      where r.id = document_access_request_scope.request_id
        and (
          r.candidate_id = (select auth.uid())
          or r.agency_id = app.current_agency_id()
        )
    )
  );

create policy document_access_request_scope_agency_insert
  on public.document_access_request_scope
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.document_access_requests r
      where r.id = document_access_request_scope.request_id
        and r.agency_id = app.current_agency_id()
        and r.status = 'pending'
    )
  );

create policy document_access_request_scope_admin_all
  on public.document_access_request_scope
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

revoke all on public.document_access_request_scope from anon;

alter table public.document_access_log enable row level security;

-- Transparencia para el candidato: quién abrió qué y cuándo. Es su derecho.
create policy document_access_log_candidate_read on public.document_access_log
  for select to authenticated
  using (
    exists (
      select 1
      from public.document_access_requests r
      where r.id = document_access_log.request_id
        and r.candidate_id = (select auth.uid())
    )
  );

create policy document_access_log_agency_read on public.document_access_log
  for select to authenticated
  using (
    exists (
      select 1
      from public.document_access_requests r
      where r.id = document_access_log.request_id
        and r.agency_id = app.current_agency_id()
    )
  );

create policy document_access_log_admin_read on public.document_access_log
  for select to authenticated
  using (app.is_admin());

-- Sin INSERT para nadie: la fila la escribe el servidor con service_role en el
-- mismo paso en el que firma la URL. Si se pudiera abrir un documento sin
-- dejar rastro, el registro no valdría como prueba.

revoke all on public.document_access_log from anon;

alter table public.candidate_contact_requests enable row level security;

create policy candidate_contact_requests_candidate_read
  on public.candidate_contact_requests
  for select to authenticated
  using (candidate_id = (select auth.uid()));

create policy candidate_contact_requests_candidate_update
  on public.candidate_contact_requests
  for update to authenticated
  using (candidate_id = (select auth.uid()))
  with check (candidate_id = (select auth.uid()));

create policy candidate_contact_requests_agency_read
  on public.candidate_contact_requests
  for select to authenticated
  using (agency_id = app.current_agency_id());

create policy candidate_contact_requests_agency_insert
  on public.candidate_contact_requests
  for insert to authenticated
  with check (
    agency_id = app.current_agency_id()
    and requested_by = (select auth.uid())
  );

create policy candidate_contact_requests_admin_all
  on public.candidate_contact_requests
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

revoke all on public.candidate_contact_requests from anon;

-- ==========================================================================
-- H. Cumplimiento
-- ==========================================================================

alter table public.consents enable row level security;

create policy consents_owner_read on public.consents
  for select to authenticated
  using (profile_id = (select auth.uid()));

create policy consents_owner_insert on public.consents
  for insert to authenticated
  with check (profile_id = (select auth.uid()));

-- Retirar un consentimiento es marcar `revoked_at`, nunca borrar la fila.
create policy consents_owner_update on public.consents
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy consents_admin_read on public.consents
  for select to authenticated
  using (app.is_admin());

revoke all on public.consents from anon;

alter table public.activity_pings enable row level security;

-- Ni siquiera el propio candidato: la tabla guarda el token del enlace del
-- correo, y RLS no filtra columnas. El canje se hace en el servidor.
create policy activity_pings_admin_read on public.activity_pings
  for select to authenticated
  using (app.is_admin());

revoke all on public.activity_pings from anon;

alter table public.email_log enable row level security;

create policy email_log_admin_read on public.email_log
  for select to authenticated
  using (app.is_admin());

revoke all on public.email_log from anon;

alter table public.data_deletion_requests enable row level security;

create policy data_deletion_requests_owner_read on public.data_deletion_requests
  for select to authenticated
  using (profile_id = (select auth.uid()));

create policy data_deletion_requests_owner_insert on public.data_deletion_requests
  for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy data_deletion_requests_admin_all on public.data_deletion_requests
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

revoke all on public.data_deletion_requests from anon;
