-- Fase 1 · Candidato.
--
-- El reparto entre `candidates` y `candidate_private` NO es cosmético (ADR-08):
-- `candidates` es la base de la bolsa seudonimizada y `candidate_private` no
-- tiene ninguna política que alcance a una ETT, en ningún caso. Si un dato
-- personal directo (teléfono, dirección, IBAN) apareciera en `candidates`, la
-- vista de la bolsa podría filtrarlo por descuido. Por eso están separados.

create table public.candidates (
  profile_id uuid primary key
    references public.profiles (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  nationality_code char(2) not null
    references public.countries (code) on delete restrict,
  current_country_code char(2) not null
    references public.countries (code) on delete restrict,
  current_city text,
  english_level public.language_level,
  has_driving_license boolean not null default false,
  worked_in_nl_de boolean not null default false,
  needs_housing boolean not null default false,
  needs_transport boolean not null default false,
  work_experience text,
  status public.candidate_status not null default 'active',
  verification_status public.verification_status not null default 'unverified',
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint candidates_first_name_not_blank
    check (length(btrim(first_name)) > 0),
  constraint candidates_last_name_not_blank
    check (length(btrim(last_name)) > 0),
  -- La mayoría de edad se comprueba en un disparador: `current_date` no es
  -- inmutable y Postgres no la admite en un CHECK.
  constraint candidates_date_of_birth_sane
    check (date_of_birth > date '1930-01-01')
);

-- --------------------------------------------------------------------------
-- Datos sensibles segregados (ADR-08). Ninguna política de ETT llega aquí.
-- --------------------------------------------------------------------------

create table public.candidate_private (
  candidate_id uuid primary key
    references public.candidates (profile_id) on delete cascade,
  phone text,
  address_line text,
  postal_code text,
  city text,
  country_code char(2) references public.countries (code) on delete restrict,
  -- IBAN cifrado en la capa de aplicación (ADR-15). La base de datos nunca ve
  -- el valor en claro ni la clave.
  iban_ciphertext text,
  iban_key_id text,
  -- Últimos cuatro dígitos, para que el candidato reconozca su cuenta sin
  -- descifrar nada. No identifica por sí solo.
  iban_last4 char(4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidate_private_iban_envelope
    check (iban_ciphertext is null or iban_ciphertext like 'v1.%'),
  constraint candidate_private_iban_key_id_present
    check ((iban_ciphertext is null) = (iban_key_id is null))
);

comment on column public.candidate_private.iban_ciphertext is
  'AES-256-GCM, formato v1.<keyId>.<iv>.<ciphertext+tag> en base64url (ADR-15).';

-- --------------------------------------------------------------------------
-- Identificadores fiscales / nacionales, multi-país (ADR-07)
-- --------------------------------------------------------------------------

create table public.candidate_identifiers (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null
    references public.candidates (profile_id) on delete cascade,
  identifier_type_id uuid not null
    references public.identifier_types (id) on delete restrict,
  value_ciphertext text not null,
  value_key_id text not null,
  -- Índice ciego: HMAC-SHA256 con clave propia, distinta de la de cifrado.
  -- Permite detectar dos candidatos con el mismo Steuer-ID sin guardar ni un
  -- solo identificador en claro, y sin poder recorrer el valor hacia atrás.
  value_blind_index text not null,
  verified_at timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, identifier_type_id),
  unique (identifier_type_id, value_blind_index),
  constraint candidate_identifiers_envelope
    check (value_ciphertext like 'v1.%')
);

-- --------------------------------------------------------------------------
-- Documentos
-- --------------------------------------------------------------------------

create table public.candidate_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null
    references public.candidates (profile_id) on delete cascade,
  document_type_id uuid not null
    references public.document_types (id) on delete restrict,
  storage_bucket text not null default 'candidate-documents',
  storage_path text not null unique,
  status public.document_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidate_documents_size_positive check (size_bytes > 0),
  -- La primera carpeta del objeto es SIEMPRE el id del candidato. De esto
  -- depende la política de storage que impide leer la carpeta de otro.
  constraint candidate_documents_path_owned
    check (storage_path like candidate_id::text || '/%'),
  constraint candidate_documents_rejection_reason_present
    check (status <> 'rejected' or length(btrim(coalesce(rejection_reason, ''))) > 0)
);

-- Un documento vigente por tipo. Los rechazados se conservan como historial.
create unique index candidate_documents_one_live_per_type_idx
  on public.candidate_documents (candidate_id, document_type_id)
  where status <> 'rejected';

create table public.candidate_sectors (
  candidate_id uuid not null
    references public.candidates (profile_id) on delete cascade,
  sector_id uuid not null references public.sectors (id) on delete restrict,
  months_experience integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (candidate_id, sector_id),
  constraint candidate_sectors_months_sane
    check (months_experience >= 0 and months_experience <= 720)
);

-- --------------------------------------------------------------------------
-- Índices: los filtros reales de la bolsa (fase 7) y la cola de revisión (4)
-- --------------------------------------------------------------------------

create index candidates_directory_idx
  on public.candidates (current_country_code, english_level)
  where verification_status = 'verified'
    and status = 'active'
    and deleted_at is null;

create index candidates_city_idx on public.candidates (current_city)
  where verification_status = 'verified' and status = 'active';

create index candidates_housing_idx on public.candidates (needs_housing, needs_transport)
  where verification_status = 'verified' and status = 'active';

-- Cola de verificación del backoffice y cron de inactividad.
create index candidates_verification_status_idx
  on public.candidates (verification_status, created_at);
create index candidates_last_activity_idx
  on public.candidates (last_activity_at) where status = 'active';

create index candidate_documents_candidate_idx
  on public.candidate_documents (candidate_id);
create index candidate_documents_review_queue_idx
  on public.candidate_documents (status, created_at) where status = 'pending';
create index candidate_sectors_sector_idx on public.candidate_sectors (sector_id);
create index candidate_identifiers_candidate_idx
  on public.candidate_identifiers (candidate_id);

-- --------------------------------------------------------------------------
-- updated_at
-- --------------------------------------------------------------------------

create trigger candidates_set_updated_at before update on public.candidates
  for each row execute function app.set_updated_at();
create trigger candidate_private_set_updated_at before update on public.candidate_private
  for each row execute function app.set_updated_at();
create trigger candidate_identifiers_set_updated_at before update on public.candidate_identifiers
  for each row execute function app.set_updated_at();
create trigger candidate_documents_set_updated_at before update on public.candidate_documents
  for each row execute function app.set_updated_at();

-- --------------------------------------------------------------------------
-- Columnas que el candidato NO decide
--
-- La RLS concede al candidato "editar su ficha". Sin estos disparadores, esa
-- misma política le dejaría marcarse como `verified` y entrar en la bolsa sin
-- que nadie haya mirado un solo documento. La verificación es el producto:
-- se protege con la base de datos, no con la interfaz.
-- --------------------------------------------------------------------------

create or replace function app.guard_candidate_privileged_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.date_of_birth > current_date - interval '18 years' then
    raise exception 'El candidato debe ser mayor de edad'
      using errcode = 'check_violation';
  end if;

  -- Nacer verificado sería la misma brecha que autoverificarse: la política de
  -- INSERT del candidato le deja elegir los valores de su propia fila.
  if tg_op = 'INSERT'
     and new.verification_status <> 'unverified'
     and not (app.is_admin() or app.is_privileged_connection()) then
    raise exception 'Un candidato nace sin verificar'
      using errcode = 'insufficient_privilege';
  end if;

  if tg_op = 'UPDATE'
     and new.verification_status is distinct from old.verification_status
     and not (app.is_admin() or app.is_privileged_connection()) then
    raise exception 'El estado de verificación solo lo cambia un administrador'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger candidates_guard_privileged_columns
  before insert or update on public.candidates
  for each row execute function app.guard_candidate_privileged_columns();

create or replace function app.guard_document_review_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending'
       and not (app.is_admin() or app.is_privileged_connection()) then
      raise exception 'Un documento nace en estado pendiente de revisión'
        using errcode = 'insufficient_privilege';
    end if;
    return new;
  end if;

  if (new.status is distinct from old.status
      or new.reviewed_by is distinct from old.reviewed_by
      or new.reviewed_at is distinct from old.reviewed_at
      or new.rejection_reason is distinct from old.rejection_reason)
     and not (app.is_admin() or app.is_privileged_connection()) then
    raise exception 'La revisión de un documento solo la cambia un administrador'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger candidate_documents_guard_review
  before insert or update on public.candidate_documents
  for each row execute function app.guard_document_review_columns();

create or replace function app.guard_identifier_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (new.verified_at is not null or new.verified_by is not null)
       and not (app.is_admin() or app.is_privileged_connection()) then
      raise exception 'Un identificador nace sin verificar'
        using errcode = 'insufficient_privilege';
    end if;
    return new;
  end if;

  if (new.verified_at is distinct from old.verified_at
      or new.verified_by is distinct from old.verified_by)
     and not (app.is_admin() or app.is_privileged_connection()) then
    raise exception 'La verificación de un identificador solo la cambia un administrador'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger candidate_identifiers_guard_verification
  before insert or update on public.candidate_identifiers
  for each row execute function app.guard_identifier_verification();
