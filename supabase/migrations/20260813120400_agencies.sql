-- Fase 1 · ETTs y su pertenencia.

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  country_code char(2) not null
    references public.countries (code) on delete restrict,
  registration_type_id uuid
    references public.registration_types (id) on delete restrict,
  registration_number text,
  status public.agency_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint agencies_slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint agencies_name_not_blank check (length(btrim(name)) > 0)
);

comment on table public.agencies is
  'Alta invite-only por admin (fase 6). `status` es la llave maestra: una ETT '
  'que no está `approved` no existe para ninguna política de acceso.';

-- Descripción visible para el candidato, una fila por idioma (ADR-01).
create table public.agency_translations (
  agency_id uuid not null references public.agencies (id) on delete cascade,
  locale text not null references public.locales (code) on delete restrict,
  description text,
  primary key (agency_id, locale)
);

create table public.agency_sectors (
  agency_id uuid not null references public.agencies (id) on delete cascade,
  sector_id uuid not null references public.sectors (id) on delete restrict,
  primary key (agency_id, sector_id)
);

create table public.agency_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  role public.agency_member_role not null default 'recruiter',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, agency_id)
);

create index agency_members_agency_idx on public.agency_members (agency_id);
create index agencies_status_idx on public.agencies (status)
  where deleted_at is null;

create trigger agencies_set_updated_at before update on public.agencies
  for each row execute function app.set_updated_at();
create trigger agency_members_set_updated_at before update on public.agency_members
  for each row execute function app.set_updated_at();

-- --------------------------------------------------------------------------
-- Predicados de ETT (continúan los de 20260813120300_identity.sql)
-- --------------------------------------------------------------------------

create or replace function app.is_agency_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.agency_members m
    join public.agencies a on a.id = m.agency_id
    where m.profile_id = (select auth.uid())
      and a.status = 'approved'
      and a.deleted_at is null
  );
$$;

-- La ETT del usuario actual. Una ETT suspendida o pendiente no devuelve nada:
-- así "suspender una ETT" corta el acceso de verdad y no solo en la interfaz.
create or replace function app.current_agency_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.agency_id
  from public.agency_members m
  join public.agencies a on a.id = m.agency_id
  where m.profile_id = (select auth.uid())
    and a.status = 'approved'
    and a.deleted_at is null
  limit 1;
$$;

revoke all on function app.is_agency_member(), app.current_agency_id()
  from public, anon;
grant execute on function app.is_agency_member(), app.current_agency_id()
  to authenticated, service_role;

-- Una ETT no se aprueba ni se reactiva a sí misma.
create or replace function app.guard_agency_privileged_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.status is distinct from old.status
      or new.deleted_at is distinct from old.deleted_at)
     and not (app.is_admin() or app.is_privileged_connection()) then
    raise exception 'El estado de una ETT solo lo cambia un administrador'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger agencies_guard_privileged_columns
  before update on public.agencies
  for each row execute function app.guard_agency_privileged_columns();
