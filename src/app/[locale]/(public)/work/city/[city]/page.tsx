import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LandingView } from '@/components/jobs/landing-view';
import type { Locale } from '@/i18n/routing';
import { landingHref, landingParams, resolveLanding } from '@/lib/landings';
import { seoMetadata } from '@/lib/seo';

/**
 * Landing por ciudad: `/es/trabajo/ciudad/berlin` ↔ `/en/work/city/berlin`.
 *
 * El slug de ciudad NO cambia de idioma: la ciudad es un texto libre de la
 * vacante, no un catálogo traducido, así que hay un solo nombre y un solo slug.
 * Cuando la fase 6 deje a las ETTs escribir ciudades, ese texto es el que manda.
 */
export const revalidate = 3600;
export const dynamicParams = false;

type Params = { locale: Locale; city: string };

export async function generateStaticParams({
  params,
}: {
  // El validador de rutas de Next tipa `locale` como `string`: este
  // `generateStaticParams` es hijo del de `[locale]`, que ya lo ha acotado.
  params: { locale: string };
}) {
  return landingParams('city', params.locale as Locale);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, city } = await params;
  const resolved = await resolveLanding('city', locale, { city });

  if (!resolved) return {};

  const t = await getTranslations({ locale, namespace: 'Landing' });
  const place = resolved.landing.placeByLocale[locale];

  return seoMetadata({
    locale,
    href: landingHref(resolved.landing),
    title: t('city.metaTitle', { place }),
    description: t('city.metaDescription', {
      place,
      count: resolved.jobs.length,
    }),
  });
}

export default async function CityLandingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, city } = await params;
  setRequestLocale(locale);

  const resolved = await resolveLanding('city', locale, { city });
  if (!resolved) notFound();

  return (
    <LandingView
      landing={resolved.landing}
      jobs={resolved.jobs}
      locale={locale}
    />
  );
}
