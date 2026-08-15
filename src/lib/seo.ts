import type { Metadata } from 'next';

import { siteConfig } from '@/config/site';
import { getPathname } from '@/i18n/navigation';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';

/**
 * Canónica, `hreflang` y Open Graph de una página pública, en un solo sitio.
 *
 * **Todo se construye sobre `siteConfig.url`, que es el apex** (ADR-12). Mezclar
 * `talpass.eu` con `www.talpass.eu` parte la señal de SEO en dos y rompe el
 * canje de sesión del correo de confirmación; que la URL se arme aquí y no en
 * cada página es lo que impide que un host se cuele por descuido.
 *
 * Las URLs de cada idioma salen de `getPathname`, o sea del mapa `pathnames`
 * (ADR-14). Al abrir `pt` aparecen solas: no hay una segunda lista de rutas que
 * mantener sincronizada.
 */

// `getPathname` acepta la ruta interna con sus params. Se toma su propio tipo
// para no reescribir a mano la unión de todas las rutas del mapa.
export type Href = Parameters<typeof getPathname>[0]['href'];

/**
 * Una ruta fija, o una función que la construye para cada idioma.
 *
 * La segunda forma no es un lujo: en las landings **los params también cambian
 * de idioma** (`alemania` ↔ `germany`), así que reutilizar los del idioma
 * actual para el `hreflang` produce URLs que no existen — `/en/work/alemania` —
 * y Google descarta el emparejamiento entero.
 */
export type LocalizedHref = Href | ((locale: Locale) => Href);

function resolve(href: LocalizedHref, locale: Locale): Href {
  return typeof href === 'function' ? href(locale) : href;
}

export function absoluteUrl(locale: Locale, href: LocalizedHref): string {
  return new URL(
    getPathname({ locale, href: resolve(href, locale) }),
    siteConfig.url,
  ).toString();
}

export function seoMetadata({
  locale,
  href,
  title,
  description,
}: {
  locale: Locale;
  href: LocalizedHref;
  title: string;
  description: string;
}): Metadata {
  const canonical = absoluteUrl(locale, href);

  const languages = Object.fromEntries(
    locales.map((l) => [l, absoluteUrl(l, href)]),
  );

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...languages,
        // Sin `x-default` Google elige él por dónde entra el usuario que no
        // encaja en ningún idioma declarado.
        'x-default': absoluteUrl(defaultLocale, href),
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: siteConfig.name,
      locale,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
