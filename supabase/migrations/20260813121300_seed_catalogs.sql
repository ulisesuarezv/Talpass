-- Fase 1 · Semilla de catálogos (ADR-07).
--
-- Esto no son "datos de prueba": es el contenido con el que la aplicación
-- arranca en producción. Por eso va en una migración y no en `seed.sql`.
-- Todo es idempotente: se puede reaplicar sin duplicar nada.
--
-- Distinción importante en `countries`:
--   · La fila EXISTE para cualquier país cuya nacionalidad pueda tener un
--     candidato (un rumano con pasaporte comunitario trabajando en Alemania).
--   · `is_active` marca los MERCADOS abiertos. Hoy solo Alemania.
--   Abrir los Países Bajos es `update countries set is_active = true` más las
--   filas de requisitos documentales. Ni una línea de código.

-- --------------------------------------------------------------------------
-- Idiomas de la interfaz
-- --------------------------------------------------------------------------

insert into public.locales (code, is_active, sort_order) values
  ('es', true, 1),
  ('en', true, 2),
  -- Preparados, apagados: añadir `pt` es activarlo y crear messages/pt.json.
  ('pt', false, 3),
  ('de', false, 4),
  ('nl', false, 5)
on conflict (code) do nothing;

-- --------------------------------------------------------------------------
-- Países
-- --------------------------------------------------------------------------

drop table if exists _seed_countries;
create temporary table _seed_countries (
  code char(2),
  currency char(3),
  is_active boolean,
  sort_order smallint,
  name_es text,
  name_en text
);

insert into _seed_countries values
  ('DE', 'EUR', true,  1,   'Alemania',      'Germany'),
  ('NL', 'EUR', false, 2,   'Países Bajos',  'Netherlands'),
  ('BE', 'EUR', false, 3,   'Bélgica',       'Belgium'),
  ('NO', 'NOK', false, 4,   'Noruega',       'Norway'),
  ('AT', 'EUR', false, 100, 'Austria',       'Austria'),
  ('BG', 'BGN', false, 100, 'Bulgaria',      'Bulgaria'),
  ('CY', 'EUR', false, 100, 'Chipre',        'Cyprus'),
  ('CZ', 'CZK', false, 100, 'Chequia',       'Czechia'),
  ('DK', 'DKK', false, 100, 'Dinamarca',     'Denmark'),
  ('EE', 'EUR', false, 100, 'Estonia',       'Estonia'),
  ('ES', 'EUR', false, 100, 'España',        'Spain'),
  ('FI', 'EUR', false, 100, 'Finlandia',     'Finland'),
  ('FR', 'EUR', false, 100, 'Francia',       'France'),
  ('GR', 'EUR', false, 100, 'Grecia',        'Greece'),
  ('HR', 'EUR', false, 100, 'Croacia',       'Croatia'),
  ('HU', 'HUF', false, 100, 'Hungría',       'Hungary'),
  ('IE', 'EUR', false, 100, 'Irlanda',       'Ireland'),
  ('IT', 'EUR', false, 100, 'Italia',        'Italy'),
  ('LT', 'EUR', false, 100, 'Lituania',      'Lithuania'),
  ('LU', 'EUR', false, 100, 'Luxemburgo',    'Luxembourg'),
  ('LV', 'EUR', false, 100, 'Letonia',       'Latvia'),
  ('MT', 'EUR', false, 100, 'Malta',         'Malta'),
  ('PL', 'PLN', false, 100, 'Polonia',       'Poland'),
  ('PT', 'EUR', false, 100, 'Portugal',      'Portugal'),
  ('RO', 'RON', false, 100, 'Rumanía',       'Romania'),
  ('SE', 'SEK', false, 100, 'Suecia',        'Sweden'),
  ('SI', 'EUR', false, 100, 'Eslovenia',     'Slovenia'),
  ('SK', 'EUR', false, 100, 'Eslovaquia',    'Slovakia');

insert into public.countries (code, default_currency, is_active, sort_order)
select code, currency, is_active, sort_order from _seed_countries
on conflict (code) do nothing;

insert into public.country_translations (country_code, locale, name)
select code, 'es', name_es from _seed_countries
union all
select code, 'en', name_en from _seed_countries
on conflict (country_code, locale) do nothing;

drop table _seed_countries;

-- --------------------------------------------------------------------------
-- Sectores
-- --------------------------------------------------------------------------

drop table if exists _seed_sectors;
create temporary table _seed_sectors (
  slug text,
  sort_order smallint,
  name_es text,
  name_en text
);

insert into _seed_sectors values
  ('logistics',       1, 'Logística',              'Logistics'),
  ('warehouse',       2, 'Almacén',                'Warehouse'),
  ('production',      3, 'Producción',             'Production'),
  ('meat-processing', 4, 'Cárnico',                'Meat processing'),
  ('agriculture',     5, 'Agrícola',               'Agriculture'),
  ('construction',    6, 'Construcción',           'Construction'),
  ('cleaning',        7, 'Limpieza',               'Cleaning'),
  ('hospitality',     8, 'Hostelería',             'Hospitality');

insert into public.sectors (slug, sort_order)
select slug, sort_order from _seed_sectors
on conflict (slug) do nothing;

insert into public.sector_translations (sector_id, locale, name)
select s.id, v.locale, v.name
from (
  select slug, 'es' as locale, name_es as name from _seed_sectors
  union all
  select slug, 'en', name_en from _seed_sectors
) v
join public.sectors s on s.slug = v.slug
on conflict (sector_id, locale) do nothing;

drop table _seed_sectors;

-- --------------------------------------------------------------------------
-- Tipos de documento
-- --------------------------------------------------------------------------

drop table if exists _seed_document_types;
create temporary table _seed_document_types (
  slug text,
  bucket text,
  mimes text[],
  max_bytes bigint,
  sort_order smallint,
  name_es text,
  name_en text,
  help_es text,
  help_en text
);

insert into _seed_document_types values
  ('id_front', 'candidate-documents',
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
   10485760, 1,
   'DNI o pasaporte (anverso)', 'ID card or passport (front)',
   'Foto nítida, con las cuatro esquinas visibles.',
   'Sharp photo with all four corners visible.'),
  ('id_back', 'candidate-documents',
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
   10485760, 2,
   'DNI o pasaporte (reverso)', 'ID card or passport (back)',
   'No hace falta si tu pasaporte no tiene reverso.',
   'Not needed if your passport has no back side.'),
  ('cv', 'candidate-documents',
   array['application/pdf', 'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
   10485760, 3,
   'CV en inglés', 'CV in English',
   'PDF o Word. En inglés: es el idioma que lee la ETT.',
   'PDF or Word, in English — that is what the agency reads.'),
  ('audio_en', 'candidate-audio',
   array['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav'],
   10485760, 4,
   'Audio en inglés', 'Audio in English',
   'Preséntate en inglés durante 30 segundos.',
   'Introduce yourself in English for 30 seconds.'),
  ('driving_license', 'candidate-documents',
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
   10485760, 5,
   'Carnet de conducir', 'Driving licence',
   'Solo si has indicado que tienes carnet.',
   'Only if you stated that you hold one.'),
  ('tax_doc', 'candidate-documents',
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
   10485760, 6,
   'Justificante de identificador fiscal', 'Tax identifier document',
   'Steuer-ID, BSN o el equivalente de tu país de destino.',
   'Steuer-ID, BSN or the equivalent in your destination country.');

insert into public.document_types
  (slug, storage_bucket, accepted_mime_types, max_size_bytes, sort_order)
select slug, bucket, mimes, max_bytes, sort_order from _seed_document_types
on conflict (slug) do nothing;

insert into public.document_type_translations
  (document_type_id, locale, name, help_text)
select d.id, v.locale, v.name, v.help
from (
  select slug, 'es' as locale, name_es as name, help_es as help
    from _seed_document_types
  union all
  select slug, 'en', name_en, help_en from _seed_document_types
) v
join public.document_types d on d.slug = v.slug
on conflict (document_type_id, locale) do nothing;

drop table _seed_document_types;

-- --------------------------------------------------------------------------
-- Requisitos documentales por país
--
-- Aquí es donde "abrir un país" deja de ser código. Alemania y los tres
-- mercados dormidos ya tienen sus filas.
-- --------------------------------------------------------------------------

drop table if exists _seed_requirements;
create temporary table _seed_requirements (
  country char(2),
  slug text,
  is_required boolean,
  sort_order smallint
);

insert into _seed_requirements
select c.code, r.slug, r.is_required, r.sort_order
from (values ('DE'), ('NL'), ('BE'), ('NO')) as c(code)
cross join (values
  ('id_front',        true,  1::smallint),
  ('id_back',         true,  2),
  ('cv',              true,  3),
  ('audio_en',        true,  4),
  ('driving_license', false, 5),
  ('tax_doc',         false, 6)
) as r(slug, is_required, sort_order);

insert into public.country_document_requirements
  (country_code, document_type_id, is_required, sort_order)
select v.country, d.id, v.is_required, v.sort_order
from _seed_requirements v
join public.document_types d on d.slug = v.slug
on conflict (country_code, document_type_id) do nothing;

drop table _seed_requirements;

-- --------------------------------------------------------------------------
-- Identificadores fiscales / nacionales
-- --------------------------------------------------------------------------

drop table if exists _seed_identifier_types;
create temporary table _seed_identifier_types (
  slug text,
  country char(2),
  regex text,
  sort_order smallint,
  name_es text,
  name_en text,
  help_es text,
  help_en text
);

insert into _seed_identifier_types values
  ('steuer_id', 'DE', '^[0-9]{11}$', 1,
   'Steuer-ID', 'Steuer-ID',
   'Once dígitos. Lo emite el Bundeszentralamt für Steuern.',
   'Eleven digits, issued by the Bundeszentralamt für Steuern.'),
  ('bsn', 'NL', '^[0-9]{8,9}$', 2,
   'BSN', 'BSN',
   'Ocho o nueve dígitos (burgerservicenummer).',
   'Eight or nine digits (burgerservicenummer).'),
  ('rijksregister', 'BE', '^[0-9]{11}$', 3,
   'Número de registro nacional', 'National register number',
   'Once dígitos (rijksregisternummer).',
   'Eleven digits (rijksregisternummer).'),
  ('fodselsnummer', 'NO', '^[0-9]{11}$', 4,
   'Fødselsnummer', 'Fødselsnummer',
   'Once dígitos.',
   'Eleven digits.');

insert into public.identifier_types
  (slug, country_code, validation_regex, sort_order)
select slug, country, regex, sort_order from _seed_identifier_types
on conflict (slug) do nothing;

insert into public.identifier_type_translations
  (identifier_type_id, locale, name, help_text)
select i.id, v.locale, v.name, v.help
from (
  select slug, 'es' as locale, name_es as name, help_es as help
    from _seed_identifier_types
  union all
  select slug, 'en', name_en, help_en from _seed_identifier_types
) v
join public.identifier_types i on i.slug = v.slug
on conflict (identifier_type_id, locale) do nothing;

drop table _seed_identifier_types;

-- --------------------------------------------------------------------------
-- Registros mercantiles
-- --------------------------------------------------------------------------

drop table if exists _seed_registration_types;
create temporary table _seed_registration_types (
  slug text,
  country char(2),
  sort_order smallint,
  name_es text,
  name_en text
);

insert into _seed_registration_types values
  ('handelsregister', 'DE', 1, 'Handelsregister', 'Handelsregister'),
  ('kvk',             'NL', 2, 'KvK',             'KvK'),
  ('kbo_bce',         'BE', 3, 'KBO/BCE',         'KBO/BCE'),
  ('brreg',           'NO', 4, 'Brønnøysundregistrene', 'Brønnøysundregistrene');

insert into public.registration_types (slug, country_code, sort_order)
select slug, country, sort_order from _seed_registration_types
on conflict (slug) do nothing;

insert into public.registration_type_translations
  (registration_type_id, locale, name)
select r.id, v.locale, v.name
from (
  select slug, 'es' as locale, name_es as name from _seed_registration_types
  union all
  select slug, 'en', name_en from _seed_registration_types
) v
join public.registration_types r on r.slug = v.slug
on conflict (registration_type_id, locale) do nothing;

drop table _seed_registration_types;

-- --------------------------------------------------------------------------
-- Idiomas hablados
-- --------------------------------------------------------------------------

drop table if exists _seed_languages;
create temporary table _seed_languages (
  code text,
  sort_order smallint,
  name_es text,
  name_en text
);

insert into _seed_languages values
  ('en', 1, 'Inglés',     'English'),
  ('de', 2, 'Alemán',     'German'),
  ('nl', 3, 'Neerlandés', 'Dutch'),
  ('es', 4, 'Español',    'Spanish'),
  ('pt', 5, 'Portugués',  'Portuguese'),
  ('no', 6, 'Noruego',    'Norwegian'),
  ('fr', 7, 'Francés',    'French');

insert into public.languages (code, sort_order)
select code, sort_order from _seed_languages
on conflict (code) do nothing;

insert into public.language_translations (language_code, locale, name)
select code, 'es', name_es from _seed_languages
union all
select code, 'en', name_en from _seed_languages
on conflict (language_code, locale) do nothing;

drop table _seed_languages;
