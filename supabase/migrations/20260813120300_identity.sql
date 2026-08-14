-- Fase 1 · Identidad: `profiles` 1:1 con auth.users, y los predicados de rol
-- sobre los que se apoya toda la RLS del proyecto.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'candidate',
  locale text not null default 'es'
    references public.locales (code) on delete restrict,
  email text not null,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_lowercase check (email = lower(email))
);

comment on table public.profiles is
  'Un usuario tiene exactamente un rol. El correo se copia de auth.users para '
  'poder consultarlo con RLS; la ETT no tiene ninguna política que lo alcance.';

create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function app.set_updated_at();

-- --------------------------------------------------------------------------
-- Predicados de rol
--
-- Todos son SECURITY DEFINER porque tienen que leer `profiles` saltándose la
-- RLS de `profiles` (si no, la política de `profiles` que los llamara entraría
-- en recursión infinita). Por eso mismo son la superficie más peligrosa del
-- schema, y se escriben con tres reglas fijas:
--
--   1. NO ACEPTAN PARÁMETROS que decidan de quién se habla. Siempre resuelven
--      la identidad desde auth.uid(). Un `is_admin(p_user uuid)` sería una
--      puerta abierta a preguntar por terceros.
--   2. DEVUELVEN BOOLEAN O UN ID PROPIO. Nunca filas, nunca datos personales:
--      una función definer que devuelve datos es una fuga con otro nombre.
--   3. `search_path = ''` y todo cualificado, para que nadie pueda anteponer
--      un esquema propio y suplantar `profiles`.
-- --------------------------------------------------------------------------

-- ¿Conexión de servicio (migraciones, cron, backoffice con service_role)?
-- No es SECURITY DEFINER y no lee datos: solo mira con qué rol se conecta.
create or replace function app.is_privileged_connection()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('postgres', 'service_role', 'supabase_admin');
$$;

create or replace function app.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid());
$$;

create or replace function app.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

create or replace function app.is_candidate()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'candidate'
  );
$$;

-- Los predicados de ETT (`app.is_agency_member`, `app.current_agency_id`) viven
-- en la migración de agencias: Postgres valida el cuerpo de una función SQL al
-- crearla, y aquí todavía no existen esas tablas.

revoke all on function
  app.is_privileged_connection(),
  app.current_role(),
  app.is_admin(),
  app.is_candidate()
from public, anon;

grant execute on function
  app.is_privileged_connection(),
  app.current_role(),
  app.is_admin(),
  app.is_candidate()
to authenticated, service_role;

-- --------------------------------------------------------------------------
-- Alta de perfil
-- --------------------------------------------------------------------------

-- El perfil nace SIEMPRE como `candidate`. Deliberadamente no se lee el rol de
-- los metadatos del registro: cualquiera puede enviarse a sí mismo
-- `{"role":"admin"}` al registrarse. Promocionar a `agency_member` o `admin`
-- es una operación con service_role desde el backoffice (fases 4 y 6).
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, locale)
  values (
    new.id,
    lower(new.email),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'locale', ''),
      'es'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- El rol no se cambia desde la sesión del propio usuario. Sin este disparador,
-- la política "el candidato edita su perfil" bastaría para autoascenderse.
create or replace function app.guard_profile_privileged_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and not (app.is_admin() or app.is_privileged_connection()) then
    raise exception 'El rol de un perfil solo lo cambia un administrador'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row execute function app.guard_profile_privileged_columns();
