import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LandingView } from '@/components/jobs/landing-view';
import type { Locale } from '@/i18n/routing';
import { landingHref, landingParams, resolveLanding } from '@/lib/landings';
import { seoMetadata } from '@/lib/seo';

/**
 * Landing de vacantes con alojamiento: `/es/trabajo/alemania/con-alojamiento`.
 *
 * El alojamiento es la primera pregunta de quien se plantea mudarse a otro
 * país, así que merece URL propia y no un filtro en la query.
 *
 * El segmento es fijo y va delante del `[sector]` hermano: Next resuelve antes
 * lo estático, así que ningún sector puede taparlo.
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
  return landingParams('housing', params.locale as Locale);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  const resolved = await resolveLanding('housing', locale, { country });

  if (!resolved) return {};

  const t = await getTranslations({ locale, namespace: 'Landing' });
  const place = resolved.landing.placeByLocale[locale];

  return seoMetadata({
    locale,
    href: landingHref(resolved.landing),
    title: t('housing.metaTitle', { place }),
    description: t('housing.metaDescription', {
      place,
      count: resolved.jobs.length,
    }),
  });
}

export default async function HousingLandingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, country } = await params;
  setRequestLocale(locale);

  const resolved = await resolveLanding('housing', locale, { country });
  if (!resolved) notFound();

  return (
    <LandingView
      landing={resolved.landing}
      jobs={resolved.jobs}
      locale={locale}
    />
  );
}
