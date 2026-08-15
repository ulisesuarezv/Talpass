import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LandingView } from '@/components/jobs/landing-view';
import type { Locale } from '@/i18n/routing';
import { landingHref, landingParams, resolveLanding } from '@/lib/landings';
import { seoMetadata } from '@/lib/seo';

/**
 * Landing por país: `/es/trabajo/alemania` ↔ `/en/work/germany`.
 *
 * `dynamicParams = false`: si la combinación no está generada es que no tiene
 * ni una vacante, y entonces la respuesta correcta es 404, no una página vacía
 * que Google indexe y tarde meses en olvidar (ADR-16, ADR-23).
 */
export const revalidate = 3600;
export const dynamicParams = false;

type Params = { locale: Locale; country: string };

export async function generateStaticParams({
  params,
}: {
  // El validador de rutas de Next tipa `locale` como `string`: este
  // `generateStaticParams` es hijo del de `[locale]`, que ya lo ha acotado.
  params: { locale: string };
}) {
  return landingParams('country', params.locale as Locale);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  const resolved = await resolveLanding('country', locale, { country });

  if (!resolved) return {};

  const t = await getTranslations({ locale, namespace: 'Landing' });
  const place = resolved.landing.placeByLocale[locale];

  return seoMetadata({
    locale,
    href: landingHref(resolved.landing),
    title: t('country.metaTitle', { place }),
    description: t('country.metaDescription', {
      place,
      count: resolved.jobs.length,
    }),
  });
}

export default async function CountryLandingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, country } = await params;
  setRequestLocale(locale);

  const resolved = await resolveLanding('country', locale, { country });
  if (!resolved) notFound();

  return (
    <LandingView
      landing={resolved.landing}
      jobs={resolved.jobs}
      locale={locale}
    />
  );
}
