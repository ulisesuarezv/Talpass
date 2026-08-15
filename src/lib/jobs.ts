import 'server-only';

import type { Locale } from '@/i18n/routing';
import { defaultLocale, locales } from '@/i18n/routing';
import { createPublicClient } from '@/lib/supabase/public';
import type { Database } from '@/lib/supabase/database.types';
import { slugify } from '@/lib/slug';

/**
 * Lectura pública de vacantes (ADR-02).
 *
 * **Solo se ve lo `published`, y eso lo garantiza la RLS**, no este fichero:
 * `jobs_public_read` filtra por `status = 'published' and deleted_at is null` y
 * la política hermana de `job_translations` cuelga de ella. Aquí no se repite
 * ese filtro a propósito — duplicarlo invita a creer que es el filtro de verdad
 * y a relajar el de la base de datos algún día.
 *
 * Todo pasa por el cliente sin cookies (ADR-22): estas consultas alimentan
 * páginas estáticas.
 */

type ShiftType = Database['public']['Enums']['shift_type'];
type SalaryPeriod = Database['public']['Enums']['salary_period'];
type LanguageLevel = Database['public']['Enums']['language_level'];

export type JobSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  countryCode: string;
  countryName: string;
  countryNames: Record<Locale, string>;
  countrySlugs: Record<Locale, string>;
  city: string | null;
  citySlug: string | null;
  sectorId: string;
  sectorName: string;
  sectorNames: Record<Locale, string>;
  sectorSlugs: Record<Locale, string>;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: SalaryPeriod | null;
  shifts: ShiftType[];
  weeklyHours: number | null;
  requiredLanguageCode: string | null;
  requiredLanguageLevel: LanguageLevel | null;
  requiresDrivingLicense: boolean;
  housingProvided: boolean;
  housingPrice: number | null;
  housingCurrency: string | null;
  transportProvided: boolean;
  minContractMonths: number | null;
  startDate: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
};

export type JobDetail = JobSummary & {
  tasks: string | null;
  requirements: string | null;
  benefits: string | null;
  /** Nombre visible del empleador: la empresa cliente solo si la ETT lo permite. */
  hiringOrganization: string;
  agencyName: string;
  /** Título por idioma, para el `hreflang` y el `og:title` del otro idioma. */
  titles: Record<Locale, string>;
};

const JOB_COLUMNS = `
  id, slug, country_code, city, sector_id,
  salary_min, salary_max, salary_currency, salary_period,
  shifts, weekly_hours,
  required_language_code, required_language_level, requires_driving_license,
  housing_provided, housing_price, housing_currency, transport_provided,
  min_contract_months, start_date, published_at, expires_at,
  client_company_name, show_client_company,
  agencies (name),
  job_translations (locale, title, description, tasks, requirements, benefits),
  countries (code, country_translations (locale, name)),
  sectors (id, slug, sector_translations (locale, name))
`;

type TranslationRow = { locale: string; name: string };

function namesByLocale(
  rows: TranslationRow[] | null,
  fallback: string,
): Record<Locale, string> {
  const list = rows ?? [];
  const first = list[0]?.name ?? fallback;

  return Object.fromEntries(
    locales.map((locale) => [
      locale,
      list.find((row) => row.locale === locale)?.name ?? first,
    ]),
  ) as Record<Locale, string>;
}

type JobTranslationRow = {
  locale: string;
  title: string;
  description: string;
  tasks: string | null;
  requirements: string | null;
  benefits: string | null;
};

/**
 * Una vacante no se publica sin al menos una traducción (lo impide un
 * disparador), pero puede no tenerla en el idioma que se pide. En ese caso se
 * cae al idioma por defecto antes que a la primera fila: es la que va a estar
 * escrita de verdad.
 */
function pickTranslation(
  rows: JobTranslationRow[] | null,
  locale: string,
): JobTranslationRow | null {
  const list = rows ?? [];
  return (
    list.find((row) => row.locale === locale) ??
    list.find((row) => row.locale === defaultLocale) ??
    list[0] ??
    null
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSummary(row: any, locale: string): JobSummary | null {
  const translation = pickTranslation(row.job_translations, locale);
  if (!translation) return null;

  const countryNames = namesByLocale(
    row.countries?.country_translations ?? null,
    row.country_code,
  );
  const sectorNames = namesByLocale(
    row.sectors?.sector_translations ?? null,
    row.sectors?.slug ?? '',
  );

  return {
    id: row.id,
    slug: row.slug,
    title: translation.title,
    description: translation.description,
    countryCode: row.country_code,
    countryName: countryNames[locale as Locale] ?? row.country_code,
    countryNames,
    countrySlugs: Object.fromEntries(
      locales.map((l) => [l, slugify(countryNames[l])]),
    ) as Record<Locale, string>,
    city: row.city,
    citySlug: row.city ? slugify(row.city) : null,
    sectorId: row.sector_id,
    sectorName: sectorNames[locale as Locale] ?? '',
    sectorNames,
    sectorSlugs: Object.fromEntries(
      locales.map((l) => [l, slugify(sectorNames[l])]),
    ) as Record<Locale, string>,
    salaryMin: row.salary_min === null ? null : Number(row.salary_min),
    salaryMax: row.salary_max === null ? null : Number(row.salary_max),
    salaryCurrency: row.salary_currency,
    salaryPeriod: row.salary_period,
    shifts: row.shifts ?? [],
    weeklyHours: row.weekly_hours,
    requiredLanguageCode: row.required_language_code,
    requiredLanguageLevel: row.required_language_level,
    requiresDrivingLicense: row.requires_driving_license,
    housingProvided: row.housing_provided,
    housingPrice: row.housing_price === null ? null : Number(row.housing_price),
    housingCurrency: row.housing_currency,
    transportProvided: row.transport_provided,
    minContractMonths: row.min_contract_months,
    startDate: row.start_date,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
  };
}

/** Todas las vacantes publicadas, ya traducidas. Alimenta listado y sitemap. */
export async function listPublishedJobs(locale: string): Promise<JobSummary[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_COLUMNS)
    .order('published_at', { ascending: false });

  if (error) throw new Error(`Vacantes publicadas: ${error.message}`);

  return (data ?? [])
    .map((row) => toSummary(row, locale))
    .filter((job): job is JobSummary => job !== null);
}

export async function getJobBySlug(
  slug: string,
  locale: string,
): Promise<JobDetail | null> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_COLUMNS)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`Vacante ${slug}: ${error.message}`);
  if (!data) return null;

  const summary = toSummary(data, locale);
  if (!summary) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const translation = pickTranslation(row.job_translations, locale)!;
  const agencyName: string = row.agencies?.name ?? '';

  const titles = Object.fromEntries(
    locales.map((l) => [
      l,
      pickTranslation(row.job_translations, l)?.title ?? summary.title,
    ]),
  ) as Record<Locale, string>;

  return {
    ...summary,
    tasks: translation.tasks,
    requirements: translation.requirements,
    benefits: translation.benefits,
    agencyName,
    // ADR-06: la ETT decide si su cliente final aparece. Si no lo permite, el
    // empleador visible es la propia ETT — nunca se filtra el nombre del
    // cliente por la puerta de atrás del marcado de schema.org.
    hiringOrganization:
      row.show_client_company && row.client_company_name
        ? row.client_company_name
        : agencyName,
    titles,
  };
}

/** Solo los slugs, para `generateStaticParams` y el sitemap. */
export async function listPublishedJobSlugs(): Promise<
  { slug: string; publishedAt: string | null }[]
> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('jobs')
    .select('slug, published_at')
    .order('published_at', { ascending: false });

  if (error) throw new Error(`Slugs de vacantes: ${error.message}`);

  return (data ?? []).map((row) => ({
    slug: row.slug,
    publishedAt: row.published_at,
  }));
}
