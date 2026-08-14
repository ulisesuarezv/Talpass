-- Permisos de tabla explícitos (ADR-19).
--
-- Hasta aquí, el schema no concedía ni un solo permiso a `anon`,
-- `authenticated` ni `service_role`: se apoyaba en el ACL por defecto que trae
-- el proyecto alojado de Supabase. Eso funcionaba en producción y NO funciona
-- en la base local: allí ese ACL por defecto pertenece a `supabase_admin`,
-- mientras que las migraciones se aplican como `postgres`, así que las tablas
-- nacían sin permisos y hasta la `service_role` recibía
-- "permission denied for table agencies".
--
-- Un schema que solo se levanta entero en un entorno concreto no es
-- reproducible, y esa es justo la propiedad que hace que la base local sirva
-- para probar antes de tocar producción (ADR-17). Así que los permisos pasan a
-- ser parte de las migraciones, como todo lo demás.
--
-- Contra producción esta migración es un no-op: concede lo que ya está
-- concedido y vuelve a retirar lo que ya está retirado.
--
-- Quién ve qué lo siguen decidiendo las políticas de RLS, no estos permisos.
-- El permiso de tabla es la puerta; la RLS es el portero. Sin permiso no se
-- entra aunque la política diga que sí, y con permiso no se ve nada que la
-- política no autorice.

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;

grant all on all tables in schema public
  to anon, authenticated, service_role;
grant all on all sequences in schema public
  to anon, authenticated, service_role;

-- `grant all on all tables` acaba de tocar también las tablas que la migración
-- de RLS había cerrado a `anon`. Se vuelven a cerrar, en el mismo orden y con
-- la misma lista: cualquier tabla que guarde datos de una persona concreta.
-- Lo que queda abierto a `anon` es el catálogo, las agencias y las vacantes,
-- que es lo que alimenta las páginas públicas.
revoke all on public.profiles from anon;
revoke all on public.candidates from anon;
revoke all on public.candidate_private from anon;
revoke all on public.candidate_identifiers from anon;
revoke all on public.candidate_documents from anon;
revoke all on public.candidate_sectors from anon;
revoke all on public.agency_members from anon;
revoke all on public.applications from anon;
revoke all on public.application_events from anon;
revoke all on public.document_access_requests from anon;
revoke all on public.document_access_request_scope from anon;
revoke all on public.document_access_log from anon;
revoke all on public.candidate_contact_requests from anon;
revoke all on public.consents from anon;
revoke all on public.activity_pings from anon;
revoke all on public.email_log from anon;
revoke all on public.data_deletion_requests from anon;

-- La bolsa seudonimizada no la mira nunca un visitante sin cuenta (ADR-03).
revoke all on public.candidate_directory from anon, public;
