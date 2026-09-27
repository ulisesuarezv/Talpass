-- La política de lectura de `agency_members` se consultaba a sí misma.
--
-- `agency_members_same_agency_read` decía «ves las filas de las agencias en
-- las que tú estás», y para saber en cuáles estás leía `agency_members`… con
-- la misma política. Postgres lo corta con «infinite recursion detected in
-- policy for relation agency_members». Y como `agencies_member_read` y
-- `agencies_owner_update` también preguntan a `agency_members` desde una
-- subconsulta, heredaban el mismo fallo: **un miembro de una ETT no podía leer
-- ni su propia agencia**.
--
-- Estaba así desde la fase 1 y no lo vio nadie porque nada lo ejercitaba: la
-- batería de seguridad solo comprueba lo que una ETT NO puede leer, y el
-- portal de agencia no existía. Salió el 2026-09-27 al construir la bolsa
-- (ADR-52), que es la primera pantalla que pregunta «¿de qué agencia soy?».
--
-- El arreglo es el patrón que ya usan `is_agency_member()` y
-- `current_agency_id()`: una función `security definer` lee la tabla sin pasar
-- por su RLS, y la política pregunta a la función. Estas dos reciben el id de
-- una **agencia**, no de una persona: quién pregunta sigue saliendo de
-- `auth.uid()`, y devuelven un booleano (reglas de CONVENTIONS, «Funciones
-- SECURITY DEFINER»). Igual que `agency_can_read_document(p_document_id)`.
--
-- No miran `agencies.status` a propósito: un miembro ve su ETT aunque esté
-- pendiente o suspendida, que es lo que ya decía la política original. Lo que
-- corta el trabajo de una ETT suspendida son `is_agency_member()` y
-- `current_agency_id()`, que sí lo miran, y eso no cambia.

create or replace function app.is_member_of_agency(p_agency_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.agency_members m
    where m.agency_id = p_agency_id
      and m.profile_id = (select auth.uid())
  );
$$;

create or replace function app.is_owner_of_agency(p_agency_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.agency_members m
    where m.agency_id = p_agency_id
      and m.profile_id = (select auth.uid())
      and m.role = 'owner'
  );
$$;

revoke all on function app.is_member_of_agency(uuid), app.is_owner_of_agency(uuid)
  from public, anon;
grant execute on function app.is_member_of_agency(uuid), app.is_owner_of_agency(uuid)
  to authenticated, service_role;

drop policy agency_members_same_agency_read on public.agency_members;
create policy agency_members_same_agency_read on public.agency_members
  for select to authenticated
  using (app.is_member_of_agency(agency_id));

drop policy agencies_member_read on public.agencies;
create policy agencies_member_read on public.agencies
  for select to authenticated
  using (app.is_member_of_agency(id));

drop policy agencies_owner_update on public.agencies;
create policy agencies_owner_update on public.agencies
  for update to authenticated
  using (app.is_owner_of_agency(id))
  with check (app.is_owner_of_agency(id));
