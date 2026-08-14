-- Fase 1 · Acceso a documentos — el corazón del producto (ADR-05).
--
-- Dos relojes distintos, y confundirlos sería un fallo de seguridad:
--   · `expires_at`        — plazo del CANDIDATO para responder (7 días).
--   · `access_expires_at` — hasta cuándo la ETT puede abrir los documentos
--                           una vez concedido el permiso.
-- Una solicitud caducada sin respuesta no da acceso; un acceso concedido y
-- vencido deja de darlo aunque la solicitud siga en `granted`.

create table public.document_access_requests (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  candidate_id uuid not null
    references public.candidates (profile_id) on delete cascade,
  -- Nulo si la solicitud nace de la bolsa y no de una candidatura concreta.
  application_id uuid references public.applications (id) on delete set null,
  requested_by uuid references public.profiles (id) on delete set null,
  status public.access_request_status not null default 'pending',
  message text,
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  expires_at timestamptz not null default now() + interval '7 days',
  reminder_sent_at timestamptz,
  access_expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_access_requests_granted_has_window
    check (status <> 'granted' or access_expires_at is not null),
  constraint document_access_requests_responded_set
    check (status = 'pending' or responded_at is not null)
);

-- Una sola solicitud viva por ETT y candidato: sin esto, una ETT podría
-- ametrallar al candidato con avisos hasta que ceda.
create unique index document_access_requests_one_pending_idx
  on public.document_access_requests (agency_id, candidate_id)
  where status = 'pending';

create index document_access_requests_candidate_idx
  on public.document_access_requests (candidate_id, status);
create index document_access_requests_agency_idx
  on public.document_access_requests (agency_id, status);
-- Para el cron de recordatorio (24 h) y de caducidad (7 días).
create index document_access_requests_pending_expiry_idx
  on public.document_access_requests (expires_at)
  where status = 'pending';
create index document_access_requests_granted_expiry_idx
  on public.document_access_requests (access_expires_at)
  where status = 'granted';

-- El alcance es una tabla, no un array de texto: así hay clave foránea real
-- contra el catálogo de tipos de documento.
create table public.document_access_request_scope (
  request_id uuid not null
    references public.document_access_requests (id) on delete cascade,
  document_type_id uuid not null
    references public.document_types (id) on delete restrict,
  primary key (request_id, document_type_id)
);

-- --------------------------------------------------------------------------
-- Registro de aperturas. Una fila por cada vez que se abre un documento.
-- --------------------------------------------------------------------------

create table public.document_access_log (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null
    references public.document_access_requests (id) on delete cascade,
  document_id uuid references public.candidate_documents (id) on delete set null,
  opened_by uuid references public.profiles (id) on delete set null,
  opened_at timestamptz not null default now(),
  ip inet,
  user_agent text
);

create index document_access_log_request_idx
  on public.document_access_log (request_id, opened_at desc);
create index document_access_log_document_idx
  on public.document_access_log (document_id, opened_at desc);

comment on table public.document_access_log is
  'Sostiene el argumento de venta, la defensa GDPR y la futura facturación. '
  'No es logging opcional. Solo se escribe desde el servidor al firmar una URL.';

-- --------------------------------------------------------------------------
-- Contacto desde la bolsa, sin vacante asociada
-- --------------------------------------------------------------------------

create table public.candidate_contact_requests (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  candidate_id uuid not null
    references public.candidates (profile_id) on delete cascade,
  requested_by uuid references public.profiles (id) on delete set null,
  message text not null,
  status public.contact_request_status not null default 'pending',
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidate_contact_requests_message_not_blank
    check (length(btrim(message)) > 0)
);

create index candidate_contact_requests_candidate_idx
  on public.candidate_contact_requests (candidate_id, status);
create index candidate_contact_requests_agency_idx
  on public.candidate_contact_requests (agency_id, status);

create trigger document_access_requests_set_updated_at
  before update on public.document_access_requests
  for each row execute function app.set_updated_at();
create trigger candidate_contact_requests_set_updated_at
  before update on public.candidate_contact_requests
  for each row execute function app.set_updated_at();

-- --------------------------------------------------------------------------
-- Quién puede mover una solicitud, y a dónde
--
--   pending → granted | denied | expired
--   granted → revoked | expired
--   denied, revoked, expired → terminales
--
-- Conceder y denegar son actos del CANDIDATO. Que la ETT tenga UPDATE sobre
-- sus propias solicitudes (para cancelarlas) no puede convertirse en poder
-- autoconcederse el acceso, así que el actor se comprueba aquí y no solo en
-- la política.
-- --------------------------------------------------------------------------

create or replace function app.enforce_access_request_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  allowed public.access_request_status[];
  is_owner boolean;
  is_service boolean;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending' then
      raise exception 'Una solicitud de acceso nace en estado pending'
        using errcode = 'check_violation';
    end if;
    return new;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  is_owner := (select auth.uid()) = new.candidate_id;
  is_service := app.is_admin() or app.is_privileged_connection();

  allowed := case old.status
    when 'pending' then
      array['granted', 'denied', 'expired']::public.access_request_status[]
    when 'granted' then
      array['revoked', 'expired']::public.access_request_status[]
    else
      array[]::public.access_request_status[]
  end;

  if not (new.status = any (allowed)) then
    raise exception 'Transición de solicitud de acceso no válida: % → %',
      old.status, new.status
      using errcode = 'check_violation';
  end if;

  if new.status in ('granted', 'denied', 'revoked')
     and not (is_owner or is_service) then
    raise exception 'Solo el candidato decide sobre el acceso a sus documentos'
      using errcode = 'insufficient_privilege';
  end if;

  -- `expired` es trabajo del cron, nunca de una de las dos partes.
  if new.status = 'expired' and not is_service then
    raise exception 'La caducidad la aplica el sistema'
      using errcode = 'insufficient_privilege';
  end if;

  new.responded_at := coalesce(new.responded_at, now());

  if new.status = 'granted' then
    new.access_expires_at := coalesce(
      new.access_expires_at, now() + interval '7 days'
    );
  end if;

  if new.status = 'revoked' then
    new.revoked_at := coalesce(new.revoked_at, now());
  end if;

  return new;
end;
$$;

create trigger document_access_requests_enforce_transition
  before insert or update on public.document_access_requests
  for each row execute function app.enforce_access_request_transition();

-- --------------------------------------------------------------------------
-- El predicado que decide si una ETT puede abrir un documento concreto
--
-- Acepta un id de documento, pero NO acepta "en nombre de quién": la ETT
-- siempre sale de `app.current_agency_id()`. Devuelve un booleano y nada más.
-- Es el único punto del schema donde un documento de un candidato se vuelve
-- legible para un tercero, y de él dependen tanto la RLS de
-- `candidate_documents` como la política de storage.
-- --------------------------------------------------------------------------

create or replace function app.agency_can_read_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.candidate_documents d
    join public.document_access_requests r
      on r.candidate_id = d.candidate_id
    join public.document_access_request_scope s
      on s.request_id = r.id
     and s.document_type_id = d.document_type_id
    where d.id = p_document_id
      and r.agency_id = app.current_agency_id()
      and r.status = 'granted'
      and r.access_expires_at > now()
  );
$$;

-- Misma regla, entrando por el objeto de storage en lugar de por el id.
create or replace function app.agency_can_read_object(
  p_bucket_id text,
  p_object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.candidate_documents d
    join public.document_access_requests r
      on r.candidate_id = d.candidate_id
    join public.document_access_request_scope s
      on s.request_id = r.id
     and s.document_type_id = d.document_type_id
    where d.storage_bucket = p_bucket_id
      and d.storage_path = p_object_name
      and r.agency_id = app.current_agency_id()
      and r.status = 'granted'
      and r.access_expires_at > now()
  );
$$;

revoke all on function
  app.agency_can_read_document(uuid),
  app.agency_can_read_object(text, text)
from public, anon;

grant execute on function
  app.agency_can_read_document(uuid),
  app.agency_can_read_object(text, text)
to authenticated, service_role;
