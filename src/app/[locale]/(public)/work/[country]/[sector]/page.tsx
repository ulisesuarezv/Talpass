import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LandingView } from '@/components/jobs/landing-view';
import type { Locale } from '@/i18n/routing';
import { landingHref, landingParams, resolveLanding } from '@/lib/landings';
import { seoMetadata } from '@/lib/seo';

/**
 * Landing por país y sector: `/es/trabajo/alemania/logistica`.
 * Es la combinación de long-tail con más intención de búsqueda de las cuatro.
 */
export const revalidate = 3600;
export const dynamicParams = false;

type Params = { locale: Locale; country: string; sector: string };

export async function generateStaticParams({
  params,
}: {
  // El validador de rutas de Next tipa `locale` como `string`: este
  // `generateStaticParams` es hijo del de `[locale]`, que ya lo ha acotado.
  params: { locale: string };
}) {
  return landingParams('sector', params.locale as Locale);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, country, sector } = await params;
  const resolved = await resolveLanding('sector', locale, { country, sector });

  if (!resolved) return {};

  const t = await getTranslations({ locale, namespace: 'Landing' });
  const values = {
    place: resolved.landing.placeByLocale[locale],
    sector: resolved.landing.sectorByLocale?.[locale] ?? '',
  };

  return seoMetadata({
    locale,
    href: landingHref(resolved.landing),
    title: t('sector.metaTitle', values),
    description: t('sector.metaDescription', {
      ...values,
      count: resolved.jobs.length,
    }),
  });
}

export default async function SectorLandingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, country, sector } = await params;
  setRequestLocale(locale);

  const resolved = await resolveLanding('sector', locale, { country, sector });
  if (!resolved) notFound();

  return (
    <LandingView
      landing={resolved.landing}
      jobs={resolved.jobs}
      locale={locale}
    />
  );
}
