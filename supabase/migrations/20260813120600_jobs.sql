-- Fase 1 · Vacantes (ADR-02, ADR-06).
--
-- El texto de la vacante NO vive aquí: vive en `job_translations`, una fila por
-- idioma. `jobs` guarda solo lo estructurado, que es lo que se filtra y lo que
-- alimenta el `JobPosting` de schema.org.

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  slug text not null unique,

  client_company_name text,
  show_client_company boolean not null default false,

  country_code char(2) not null
    references public.countries (code) on delete restrict,
  city text,
  sector_id uuid not null references public.sectors (id) on delete restrict,

  -- Importe + moneda + periodo (ADR-07): Noruega paga en NOK por hora y eso no
  -- puede ser una suposición del código.
  salary_min numeric(10, 2),
  salary_max numeric(10, 2),
  salary_currency char(3),
  salary_period public.salary_period,

  shifts public.shift_type[] not null default '{}',
  weekly_hours smallint,

  required_language_code text
    references public.languages (code) on delete restrict,
  required_language_level public.language_level,
  requires_driving_license boolean not null default false,

  housing_provided boolean not null default false,
  housing_price numeric(10, 2),
  housing_currency char(3),
  transport_provided boolean not null default false,

  min_contract_months smallint,
  start_date date,

  status public.job_status not null default 'draft',
  published_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint jobs_slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint jobs_salary_range check (
    salary_min is null or salary_max is null or salary_max >= salary_min
  ),
  constraint jobs_salary_currency_format
    check (salary_currency is null or salary_currency ~ '^[A-Z]{3}$'),
  -- Si hay importe, hay moneda y periodo. Un salario sin unidad es ruido.
  constraint jobs_salary_complete check (
    (salary_min is null and salary_max is null)
    or (salary_currency is not null and salary_period is not null)
  ),
  constraint jobs_housing_price_currency check (
    housing_price is null or housing_currency is not null
  ),
  constraint jobs_weekly_hours_sane
    check (weekly_hours is null or (weekly_hours > 0 and weekly_hours <= 60)),
  constraint jobs_min_contract_sane
    check (min_contract_months is null or min_contract_months > 0),
  constraint jobs_published_has_timestamp
    check (status <> 'published' or published_at is not null),
  constraint jobs_language_level_pair check (
    (required_language_code is null) = (required_language_level is null)
  )
);

create table public.job_translations (
  job_id uuid not null references public.jobs (id) on delete cascade,
  locale text not null references public.locales (code) on delete restrict,
  title text not null,
  description text not null,
  tasks text,
  requirements text,
  benefits text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (job_id, locale),
  constraint job_translations_title_not_blank check (length(btrim(title)) > 0)
);

-- --------------------------------------------------------------------------
-- Índices: el listado público y el panel de la ETT
-- --------------------------------------------------------------------------

create index jobs_public_listing_idx
  on public.jobs (country_code, sector_id, published_at desc)
  where status = 'published' and deleted_at is null;

create index jobs_published_recent_idx
  on public.jobs (published_at desc)
  where status = 'published' and deleted_at is null;

create index jobs_city_idx on public.jobs (city)
  where status = 'published' and deleted_at is null;

create index jobs_perks_idx on public.jobs (housing_provided, transport_provided)
  where status = 'published' and deleted_at is null;

create index jobs_agency_status_idx on public.jobs (agency_id, status);

create index jobs_expiring_idx on public.jobs (expires_at)
  where status = 'published' and expires_at is not null;

create trigger jobs_set_updated_at before update on public.jobs
  for each row execute function app.set_updated_at();
create trigger job_translations_set_updated_at before update on public.job_translations
  for each row execute function app.set_updated_at();

-- --------------------------------------------------------------------------
-- Ciclo de vida de la vacante
--
-- `closed` es terminal a propósito: una vacante cerrada con aplicaciones
-- dentro es historial, y reabrirla falsearía la métrica de colocaciones.
-- Se publica una nueva.
-- --------------------------------------------------------------------------

create or replace function app.enforce_job_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  has_translation boolean;
begin
  if tg_op = 'UPDATE' and old.status = 'closed' and new.status <> 'closed' then
    raise exception 'Una vacante cerrada no se reabre: publica una nueva'
      using errcode = 'check_violation';
  end if;

  if new.status = 'published' then
    select exists (
      select 1 from public.job_translations t where t.job_id = new.id
    ) into has_translation;

    if not has_translation then
      raise exception 'Una vacante no se publica sin al menos una traducción'
        using errcode = 'check_violation';
    end if;

    if new.published_at is null then
      new.published_at = now();
    end if;
  end if;

  return new;
end;
$$;

create trigger jobs_enforce_lifecycle
  before insert or update on public.jobs
  for each row execute function app.enforce_job_lifecycle();
