-- Fase 1 · Vista `candidate_directory` — la bolsa seudonimizada (ADR-03).
--
-- Esta vista es la ÚNICA puerta de una ETT a los datos de un candidato. La
-- seudonimización vive aquí, en la base de datos, no en el cliente: un `select
-- *` desde cualquier sitio devuelve exactamente estas columnas y ninguna más.
--
-- Lo que deliberadamente NO existe en esta vista, y no debe añadirse nunca:
--   · apellido completo — solo la inicial
--   · fecha de nacimiento — solo la edad ya calculada
--   · email, teléfono, dirección, IBAN, identificadores fiscales
--   · rutas de storage ni identificadores de documento
--
-- Sobre `security_invoker`: la vista se queda como SECURITY DEFINER (el valor
-- por defecto) A PROPÓSITO. Con `security_invoker = on` heredaría la RLS de
-- `candidates`, donde la ETT no tiene ninguna política, y devolvería cero
-- filas. Al ser definer, la vista misma es el control de acceso: de ahí el
-- filtro por rol del final, que es tan parte de la seguridad como una política.

create view public.candidate_directory
with (security_invoker = off)
as
select
  c.profile_id as candidate_id,

  -- "Carlos M." — nombre de pila e inicial, nunca el apellido.
  c.first_name || ' ' || left(c.last_name, 1) || '.' as display_name,

  extract(year from age(c.date_of_birth))::int as age,

  c.current_country_code,
  c.current_city,
  c.nationality_code,
  c.english_level,
  c.work_experience,
  c.has_driving_license,
  c.worked_in_nl_de,
  c.needs_housing,
  c.needs_transport,
  c.last_activity_at,
  c.created_at,

  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'sector_id', cs.sector_id,
          'slug', s.slug,
          'months_experience', cs.months_experience
        )
        order by cs.months_experience desc
      )
      from public.candidate_sectors cs
      join public.sectors s on s.id = cs.sector_id
      where cs.candidate_id = c.profile_id
    ),
    '[]'::jsonb
  ) as sectors,

  -- Sellos. La ETT ve que el papel existe y está comprobado; el papel, no.
  exists (
    select 1
    from public.candidate_documents d
    join public.document_types dt on dt.id = d.document_type_id
    where d.candidate_id = c.profile_id
      and d.status = 'verified'
      and dt.slug in ('id_front', 'id_back')
    group by d.candidate_id
    having count(distinct dt.slug) = 2
  ) as identity_verified,

  exists (
    select 1
    from public.candidate_documents d
    join public.document_types dt on dt.id = d.document_type_id
    where d.candidate_id = c.profile_id
      and d.status = 'verified'
      and dt.slug = 'driving_license'
  ) as driving_license_verified,

  exists (
    select 1
    from public.candidate_identifiers ci
    where ci.candidate_id = c.profile_id
      and ci.verified_at is not null
  ) as tax_id_verified,

  -- Booleano calculado a partir de `candidate_private`. Que la vista lea esa
  -- tabla no expone nada: solo sale de aquí un sí/no.
  exists (
    select 1
    from public.candidate_private cp
    where cp.candidate_id = c.profile_id
      and cp.iban_ciphertext is not null
  ) as iban_on_file,

  exists (
    select 1
    from public.candidate_documents d
    join public.document_types dt on dt.id = d.document_type_id
    where d.candidate_id = c.profile_id
      and d.status = 'verified'
      and dt.slug = 'audio_en'
  ) as has_audio,

  exists (
    select 1
    from public.candidate_documents d
    join public.document_types dt on dt.id = d.document_type_id
    where d.candidate_id = c.profile_id
      and d.status = 'verified'
      and dt.slug = 'cv'
  ) as has_cv

from public.candidates c
where c.verification_status = 'verified'
  and c.status = 'active'
  and c.deleted_at is null
  -- El control de acceso de la vista. Sin esto, cualquier usuario autenticado
  -- —incluido otro candidato— leería la bolsa entera.
  and (app.is_agency_member() or app.is_admin());

comment on view public.candidate_directory is
  'Bolsa seudonimizada (ADR-03). Única lectura de datos de candidato que tiene '
  'una ETT. Añadir aquí una columna con dato personal directo es una brecha.';

revoke all on public.candidate_directory from anon, public;
grant select on public.candidate_directory to authenticated;
