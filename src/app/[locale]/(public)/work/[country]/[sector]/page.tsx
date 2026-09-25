import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LandingView } from '@/components/jobs/landing-view';
import type { Locale } from '@/i18n/routing';
import { landingHref, landingParams, resolveLanding } from '@/lib/landings';
import { getOpportunity } from '@/lib/opportunities';
import { seoMetadata } from '@/lib/seo';

/**
 * Landing por país y sector: `/es/trabajo/alemania/logistica`.
 * Es la combinación de long-tail con más intención de búsqueda de las cuatro.
 *
 * **Y la única de las cuatro que existe sin vacantes** (ADR-50). `landingParams`
 * devuelve la unión de los pares con vacante viva y los pares con perfil de
 * mercado, así que `dynamicParams = false` se queda como está: lo que no se ha
 * generado sigue siendo 404, pero los cinco destinos de los 301 de ADR-49 y los
 * cinco enlaces de las tarjetas están generados con cero vacantes.
 *
 * 🔴 Sin vacantes esta página **no emite `JobPosting` ni ningún otro JSON-LD de
 * empleo**, no nombra empresa ni fecha de incorporación y no tiene botón de
 * aplicar. Es el interruptor de ADR-30 y se comprueba sobre el HTML servido.
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

  // Sin vacantes, la meta de siempre prometería «0 ofertas» en el resultado de
  // búsqueda y describiría una página que no es esta: lo que hay dentro es el
  // perfil de mercado, y eso es lo que se anuncia.
  const market = resolved.jobs.length === 0;

  return seoMetadata({
    locale,
    href: landingHref(resolved.landing),
    title: market
      ? t('sector.marketMetaTitle', values)
      : t('sector.metaTitle', values),
    description: market
      ? t('sector.marketMetaDescription', values)
      : t('sector.metaDescription', {
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

  const [resolved, opportunity] = await Promise.all([
    resolveLanding('sector', locale, { country, sector }),
    // El perfil se resuelve aparte de la landing: una landing con vacantes
    // **también** lo enseña, debajo y con su rótulo (ADR-49, punto 3), y un
    // sector sin perfil —los que traiga una ETT— sigue funcionando sin él.
    getOpportunity(locale, { country, sector }),
  ]);
  if (!resolved) notFound();

  return (
    <LandingView
      landing={resolved.landing}
      jobs={resolved.jobs}
      locale={locale}
      opportunity={opportunity}
    />
  );
}
