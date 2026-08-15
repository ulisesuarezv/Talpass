import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { JobBrowser } from '@/components/jobs/job-browser';
import { SignupCta } from '@/components/jobs/signup-cta';
import type { Locale } from '@/i18n/routing';
import { listCountries, listLanguages, listSectors } from '@/lib/catalogs';
import { listPublishedJobs } from '@/lib/jobs';
import { seoMetadata } from '@/lib/seo';

/**
 * Listado público de vacantes.
 *
 * Estática y revalidada cada hora. No lee sesión, ni cookies, ni
 * `searchParams`: el filtrado ocurre en cliente sobre las vacantes que ya vienen
 * en el HTML (ver `JobBrowser`). Cualquiera de esas tres cosas la volvería
 * dinámica y la sacaría del CDN, que es donde vive el SEO (ADR-11, ADR-13).
 */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Jobs' });

  return seoMetadata({
    locale,
    href: '/jobs',
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

export default async function JobsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Jobs');

  const [jobs, countries, sectors, languages] = await Promise.all([
    listPublishedJobs(locale),
    listCountries(locale),
    listSectors(locale),
    listLanguages(locale),
  ]);

  // Las opciones salen de los catálogos (ADR-07), pero se quedan solo las que
  // alguna vacante usa: un filtro que solo sabe devolver cero resultados es
  // peor que no ofrecerlo.
  const usedCountries = new Set(jobs.map((job) => job.countryCode));
  const usedSectors = new Set(jobs.map((job) => job.sectorId));
  const usedLanguages = new Set(
    jobs.map((job) => job.requiredLanguageCode).filter(Boolean),
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('title')}
        </h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>

      {/*
        Sin `Suspense` y sin `useSearchParams` dentro: `JobBrowser` es cliente,
        pero se prerenderiza aquí con todas las vacantes, así que salen en el
        HTML estático. Ver el comentario de ese fichero — es la diferencia entre
        una página que el rastreador lee y una que solo existe si se ejecuta el
        JavaScript.
      */}
      <JobBrowser
        jobs={jobs}
        countries={countries.filter((c) => usedCountries.has(c.id))}
        sectors={sectors.filter((s) => usedSectors.has(s.id))}
        languages={languages.filter((l) => usedLanguages.has(l.id))}
      />

      <SignupCta />
    </div>
  );
}
