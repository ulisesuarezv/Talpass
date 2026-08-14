-- Fase 1 · Catálogos (ADR-07).
--
-- REGLA: abrir un país nuevo debe ser INSERTAR FILAS. Si en cualquier fase
-- futura aparece un `if country === 'DE'`, es que a este bloque le falta una
-- tabla. Los textos visibles viven en tablas `*_translations`, nunca en la
-- fila del catálogo: así se abre un idioma igual que se abre un país.

-- --------------------------------------------------------------------------
-- Idiomas de la interfaz
-- --------------------------------------------------------------------------

create table public.locales (
  code text primary key,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locales_code_format check (code ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

comment on table public.locales is
  'Idiomas de la aplicación (ADR-01). Coincide con `locales` de src/i18n/routing.ts.';

-- --------------------------------------------------------------------------
-- Países
-- --------------------------------------------------------------------------

create table public.countries (
  code char(2) primary key,
  default_currency char(3) not null,
  -- MVP: solo Alemania activo. NL/BE/NO existen ya, apagados.
  is_active boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint countries_code_format check (code ~ '^[A-Z]{2}$'),
  constraint countries_currency_format check (default_currency ~ '^[A-Z]{3}$')
);

create table public.country_translations (
  country_code char(2) not null
    references public.countries (code) on delete cascade,
  locale text not null references public.locales (code) on delete restrict,
  name text not null,
  primary key (country_code, locale)
);

-- --------------------------------------------------------------------------
-- Sectores
-- --------------------------------------------------------------------------

create table public.sectors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sectors_slug_format check (slug ~ '^[a-z0-9-]+$')
);

create table public.sector_translations (
  sector_id uuid not null references public.sectors (id) on delete cascade,
  locale text not null references public.locales (code) on delete restrict,
  name text not null,
  primary key (sector_id, locale)
);

-- --------------------------------------------------------------------------
-- Tipos de documento
-- --------------------------------------------------------------------------

create table public.document_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  -- A qué bucket va este tipo. Es dato, no un `if slug === 'audio_en'`.
  storage_bucket text not null default 'candidate-documents',
  accepted_mime_types text[] not null,
  max_size_bytes bigint not null default 10485760,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_types_slug_format check (slug ~ '^[a-z0-9_]+$'),
  constraint document_types_mimes_not_empty
    check (array_length(accepted_mime_types, 1) > 0),
  constraint document_types_max_size_positive check (max_size_bytes > 0)
);

create table public.document_type_translations (
  document_type_id uuid not null
    references public.document_types (id) on delete cascade,
  locale text not null references public.locales (code) on delete restrict,
  name text not null,
  help_text text,
  primary key (document_type_id, locale)
);

-- Qué papeles pide cada país y cuáles son obligatorios.
create table public.country_document_requirements (
  country_code char(2) not null
    references public.countries (code) on delete cascade,
  document_type_id uuid not null
    references public.document_types (id) on delete restrict,
  is_required boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (country_code, document_type_id)
);

-- --------------------------------------------------------------------------
-- Identificadores fiscales / nacionales (ADR-07)
-- --------------------------------------------------------------------------

create table public.identifier_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  country_code char(2) not null
    references public.countries (code) on delete restrict,
  -- Validación como DATO. Se aplica en el servidor al guardar; el valor real
  -- se almacena cifrado, así que la base no puede comprobarlo por sí misma.
  validation_regex text not null,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint identifier_types_slug_format check (slug ~ '^[a-z0-9_]+$')
);

create table public.identifier_type_translations (
  identifier_type_id uuid not null
    references public.identifier_types (id) on delete cascade,
  locale text not null references public.locales (code) on delete restrict,
  name text not null,
  help_text text,
  primary key (identifier_type_id, locale)
);

-- --------------------------------------------------------------------------
-- Registros mercantiles (Handelsregister, KvK, …)
-- --------------------------------------------------------------------------

create table public.registration_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  country_code char(2) not null
    references public.countries (code) on delete restrict,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint registration_types_slug_format check (slug ~ '^[a-z0-9_]+$')
);

comment on table public.registration_types is
  'Tipo de registro mercantil de una ETT. Es catálogo por país, no un enum: '
  'abrir NL trae `kvk` como una fila más.';

create table public.registration_type_translations (
  registration_type_id uuid not null
    references public.registration_types (id) on delete cascade,
  locale text not null references public.locales (code) on delete restrict,
  name text not null,
  primary key (registration_type_id, locale)
);

-- --------------------------------------------------------------------------
-- Idiomas hablados (requisitos de vacante y nivel del candidato)
-- --------------------------------------------------------------------------

create table public.languages (
  code text primary key,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint languages_code_format check (code ~ '^[a-z]{2}$')
);

create table public.language_translations (
  language_code text not null
    references public.languages (code) on delete cascade,
  locale text not null references public.locales (code) on delete restrict,
  name text not null,
  primary key (language_code, locale)
);

-- --------------------------------------------------------------------------
-- updated_at
-- --------------------------------------------------------------------------

create trigger locales_set_updated_at before update on public.locales
  for each row execute function app.set_updated_at();
create trigger countries_set_updated_at before update on public.countries
  for each row execute function app.set_updated_at();
create trigger sectors_set_updated_at before update on public.sectors
  for each row execute function app.set_updated_at();
create trigger document_types_set_updated_at before update on public.document_types
  for each row execute function app.set_updated_at();
create trigger country_document_requirements_set_updated_at
  before update on public.country_document_requirements
  for each row execute function app.set_updated_at();
create trigger identifier_types_set_updated_at before update on public.identifier_types
  for each row execute function app.set_updated_at();
create trigger registration_types_set_updated_at before update on public.registration_types
  for each row execute function app.set_updated_at();
create trigger languages_set_updated_at before update on public.languages
  for each row execute function app.set_updated_at();

-- --------------------------------------------------------------------------
-- Índices
-- --------------------------------------------------------------------------

create index countries_active_idx on public.countries (is_active, sort_order);
create index sectors_active_idx on public.sectors (is_active, sort_order);
create index identifier_types_country_idx
  on public.identifier_types (country_code) where is_active;
create index country_document_requirements_required_idx
  on public.country_document_requirements (country_code) where is_required;
