-- Fase 1 · Cumplimiento y ciclo de vida.

-- Consentimientos versionados: hay que poder demostrar QUÉ texto aceptó una
-- persona y CUÁNDO, no solo que aceptó algo alguna vez.
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type public.consent_type not null,
  version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint consents_version_not_blank check (length(btrim(version)) > 0)
);

create index consents_profile_idx
  on public.consents (profile_id, type, granted_at desc);

-- Regla de negocio 5: 30 días sin actividad → aviso → 72 h para confirmar.
create table public.activity_pings (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null
    references public.candidates (profile_id) on delete cascade,
  -- Secreto de un solo uso que viaja en el enlace del correo. Ninguna política
  -- deja leer esta tabla a un usuario final, ni siquiera al propio candidato:
  -- el token se compara en el servidor con service_role.
  token text not null unique,
  sent_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '72 hours',
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index activity_pings_candidate_idx
  on public.activity_pings (candidate_id, sent_at desc);
create index activity_pings_open_idx on public.activity_pings (expires_at)
  where confirmed_at is null;

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  -- Se conserva aunque el perfil desaparezca: es prueba de qué se envió.
  recipient_email text,
  template text not null,
  locale text references public.locales (code) on delete set null,
  provider_id text,
  status public.email_status not null default 'queued',
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_log_profile_idx on public.email_log (profile_id, created_at desc);
create index email_log_status_idx on public.email_log (status, created_at desc);

-- GDPR art. 17. El borrado efectivo lo ejecuta el backoffice (fase 9)
-- respetando las obligaciones de conservación; aquí solo vive la solicitud.
create table public.data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status public.deletion_request_status not null default 'pending',
  reason text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index data_deletion_requests_one_open_idx
  on public.data_deletion_requests (profile_id)
  where status in ('pending', 'processing');

create index data_deletion_requests_status_idx
  on public.data_deletion_requests (status, requested_at);

create trigger email_log_set_updated_at before update on public.email_log
  for each row execute function app.set_updated_at();
create trigger data_deletion_requests_set_updated_at
  before update on public.data_deletion_requests
  for each row execute function app.set_updated_at();

-- El solicitante no cierra su propia solicitud de borrado.
create or replace function app.guard_deletion_request_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending'
       and not (app.is_admin() or app.is_privileged_connection()) then
      raise exception 'Una solicitud de borrado nace en estado pending'
        using errcode = 'insufficient_privilege';
    end if;
    return new;
  end if;

  if (new.status is distinct from old.status
      or new.processed_at is distinct from old.processed_at
      or new.processed_by is distinct from old.processed_by)
     and not (app.is_admin() or app.is_privileged_connection()) then
    raise exception 'Solo un administrador tramita una solicitud de borrado'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger data_deletion_requests_guard_status
  before insert or update on public.data_deletion_requests
  for each row execute function app.guard_deletion_request_status();
