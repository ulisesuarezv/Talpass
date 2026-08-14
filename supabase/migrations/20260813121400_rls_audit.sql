-- Fase 1 · Auditoría de RLS contra el catálogo de Postgres.
--
-- "Creo que todas las tablas tienen RLS" no es una comprobación. Esta función
-- lo pregunta a `pg_class` y la usan los tests de seguridad, que fallan si
-- aparece una sola tabla desprotegida. Una tabla nueva sin RLS rompe el build,
-- que es exactamente lo que tiene que pasar.

create or replace function public.rls_audit()
returns table (
  table_name text,
  rls_enabled boolean,
  policy_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.relname::text,
    c.relrowsecurity,
    (
      select count(*)
      from pg_catalog.pg_policy p
      where p.polrelid = c.oid
    )
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname not like '\_seed%'
  order by c.relname;
$$;

comment on function public.rls_audit() is
  'Estado de RLS de cada tabla de `public`. Solo para service_role: es '
  'metainformación del schema, no datos, pero tampoco tiene por qué verla un '
  'usuario final.';

revoke all on function public.rls_audit() from public, anon, authenticated;
grant execute on function public.rls_audit() to service_role;
