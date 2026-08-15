import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';

import { formatSalary } from '@/components/jobs/format-salary';
import { JobPostingJsonLd } from '@/components/jobs/job-posting-jsonld';
import { RelatedLandings } from '@/components/jobs/related-landings';
import { SignupCta } from '@/components/jobs/signup-cta';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Locale } from '@/i18n/routing';
import { listLanguages } from '@/lib/catalogs';
import { getJobBySlug, listPublishedJobSlugs } from '@/lib/jobs';
import { absoluteUrl, seoMetadata } from '@/lib/seo';

/**
 * Detalle de vacante: la página que indexa Google Jobs (ADR-02).
 *
 * Prerenderizada por slug y revalidada cada hora. `dynamicParams` se queda en
 * su valor por defecto (`true`) a propósito: una vacante publicada después del
 * build se sirve a la primera visita y queda cacheada, sin esperar a un
 * despliegue.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  const jobs = await listPublishedJobSlugs();
  return jobs.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const job = await getJobBySlug(slug, locale);

  if (!job) return {};

  const t = await getTranslations({ locale, namespace: 'Jobs' });
  const place = [job.city, job.countryName].filter(Boolean).join(', ');

  return seoMetadata({
    locale,
    href: { pathname: '/jobs/[slug]', params: { slug } },
    title: t('detail.metaTitle', { title: job.title, place }),
    description: job.description.slice(0, 200),
  });
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const job = await getJobBySlug(slug, locale);
  if (!job) notFound();

  const t = await getTranslations('Jobs');
  const format = await getFormatter();

  // El nombre del idioma sale del catálogo (ADR-07), no de `messages/`: abrir
  // un idioma de requisito nuevo no puede pedir tocar los ficheros de copy.
  const languages = await listLanguages(locale);
  const requiredLanguage = languages.find(
    (language) => language.id === job.requiredLanguageCode,
  );

  const place = [job.city, job.countryName].filter(Boolean).join(', ');
  const salary = formatSalary(job, t, format);

  const sections = [
    { key: 'description', value: job.description },
    { key: 'tasks', value: job.tasks },
    { key: 'requirements', value: job.requirements },
    { key: 'benefits', value: job.benefits },
  ].filter((section) => section.value);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:py-16">
      <JobPostingJsonLd
        job={job}
        url={absoluteUrl(locale, {
          pathname: '/jobs/[slug]',
          params: { slug },
        })}
        description={[job.description, job.tasks, job.requirements]
          .filter(Boolean)
          .join('\n\n')}
      />

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {job.title}
        </h1>
        <p className="text-muted-foreground">
          {place} · {job.sectorName}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('detail.postedBy', { organization: job.hiringOrganization })}
        </p>
        {salary ? <p className="text-lg font-semibold">{salary}</p> : null}
      </header>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm sm:grid-cols-3">
        <Fact label={t('facts.housingLabel')}>
          {job.housingProvided
            ? job.housingPrice !== null && job.housingCurrency
              ? t('facts.housingWithPrice', {
                  price: format.number(job.housingPrice, {
                    style: 'currency',
                    currency: job.housingCurrency,
                    maximumFractionDigits: 0,
                  }),
                })
              : t('facts.yes')
            : t('facts.no')}
        </Fact>

        <Fact label={t('facts.transportLabel')}>
          {job.transportProvided ? t('facts.yes') : t('facts.no')}
        </Fact>

        <Fact label={t('facts.drivingLicenseLabel')}>
          {job.requiresDrivingLicense ? t('facts.yes') : t('facts.no')}
        </Fact>

        {job.weeklyHours !== null ? (
          <Fact label={t('facts.weeklyHoursLabel')}>
            {t('facts.weeklyHours', { hours: job.weeklyHours })}
          </Fact>
        ) : null}

        {job.minContractMonths !== null ? (
          <Fact label={t('facts.contractLabel')}>
            {t('facts.contractMonths', { months: job.minContractMonths })}
          </Fact>
        ) : null}

        {job.startDate ? (
          <Fact label={t('facts.startDateLabel')}>
            {format.dateTime(new Date(job.startDate), { dateStyle: 'long' })}
          </Fact>
        ) : null}

        {requiredLanguage && job.requiredLanguageLevel ? (
          <Fact label={t('facts.languageLabel')}>
            {t('facts.language', {
              language: requiredLanguage.name,
              level: job.requiredLanguageLevel.toUpperCase(),
            })}
          </Fact>
        ) : null}

        {job.shifts.length > 0 ? (
          <Fact label={t('facts.shiftsLabel')}>
            <span className="flex flex-wrap gap-1">
              {job.shifts.map((shift) => (
                <Badge key={shift} variant="outline">
                  {t(`shifts.${shift}`)}
                </Badge>
              ))}
            </span>
          </Fact>
        ) : null}
      </dl>

      {sections.map((section) => (
        <section key={section.key} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {t(`detail.sections.${section.key}`)}
          </h2>
          <p className="text-sm whitespace-pre-line text-muted-foreground">
            {section.value}
          </p>
        </section>
      ))}

      <SignupCta />

      <Separator />
      <RelatedLandings job={job} locale={locale} />
    </div>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
