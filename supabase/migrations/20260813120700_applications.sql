-- Fase 1 · Aplicaciones y su auditoría (ADR-04).

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  -- `restrict`, no `cascade`: borrar una vacante no puede borrar la prueba de
  -- que hubo candidaturas. Las vacantes se cierran, no se borran.
  job_id uuid not null references public.jobs (id) on delete restrict,
  candidate_id uuid not null
    references public.candidates (profile_id) on delete cascade,
  status public.application_status not null default 'pending',
  status_changed_at timestamptz not null default now(),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Regla de negocio 3: una aplicación por candidato y vacante.
  unique (job_id, candidate_id)
);

create index applications_candidate_idx
  on public.applications (candidate_id, status);
create index applications_job_status_idx
  on public.applications (job_id, status);
create index applications_status_changed_idx
  on public.applications (status, status_changed_at desc);

create trigger applications_set_updated_at before update on public.applications
  for each row execute function app.set_updated_at();

-- --------------------------------------------------------------------------
-- Auditoría inmutable
-- --------------------------------------------------------------------------

create table public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null
    references public.applications (id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index application_events_application_idx
  on public.application_events (application_id, created_at desc);

comment on table public.application_events is
  'Se escribe SOLO desde el disparador de `applications`. No hay política de '
  'INSERT, UPDATE ni DELETE para nadie: ni la ETT ni el admin pueden reescribir '
  'el historial desde la API.';

-- --------------------------------------------------------------------------
-- Transiciones válidas (ADR-04)
--
--   pending             → in_review | rejected
--   in_review           → documents_requested | rejected
--   documents_requested → hired | rejected
--   hired, rejected     → terminales
--
-- `documents_requested` no se puede saltar a propósito: es el futuro punto de
-- cobro y tiene que quedar registrado que ocurrió.
-- --------------------------------------------------------------------------

create or replace function app.enforce_application_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  allowed public.application_status[];
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending' then
      raise exception 'Una aplicación nace en estado pending'
        using errcode = 'check_violation';
    end if;

    return new;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  allowed := case old.status
    when 'pending' then
      array['in_review', 'rejected']::public.application_status[]
    when 'in_review' then
      array['documents_requested', 'rejected']::public.application_status[]
    when 'documents_requested' then
      array['hired', 'rejected']::public.application_status[]
    else
      array[]::public.application_status[]
  end;

  if not (new.status = any (allowed)) then
    raise exception 'Transición de aplicación no válida: % → %',
      old.status, new.status
      using errcode = 'check_violation';
  end if;

  if new.status = 'rejected'
     and length(btrim(coalesce(new.rejection_reason, ''))) = 0 then
    raise exception 'Rechazar una aplicación exige un motivo'
      using errcode = 'check_violation';
  end if;

  new.status_changed_at := now();

  return new;
end;
$$;

create trigger applications_enforce_transition
  before insert or update on public.applications
  for each row execute function app.enforce_application_transition();

-- El evento se escribe DESPUÉS: en un BEFORE INSERT la fila de `applications`
-- todavía no existe y la clave foránea del evento fallaría.
create or replace function app.log_application_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return null;
  end if;

  insert into public.application_events (
    application_id, from_status, to_status, actor_profile_id, note
  )
  values (
    new.id,
    case when tg_op = 'UPDATE' then old.status else null end,
    new.status,
    (select auth.uid()),
    new.rejection_reason
  );

  return null;
end;
$$;

comment on function app.log_application_event() is
  'SECURITY DEFINER únicamente para poder escribir en `application_events`, '
  'que no tiene política de INSERT para ningún rol. No acepta parámetros, no '
  'devuelve datos y solo escribe la transición que acaba de ocurrir.';

create trigger applications_log_event
  after insert or update on public.applications
  for each row execute function app.log_application_event();
