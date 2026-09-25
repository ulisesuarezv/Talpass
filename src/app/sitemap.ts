import type { MetadataRoute } from 'next';

import { legalHref, LEGAL_DOCUMENTS } from '@/config/legal';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { listPublishedJobs } from '@/lib/jobs';
import { landingHref, listLandings } from '@/lib/landings';
import { absoluteUrl, type LocalizedHref } from '@/lib/seo';

/**
 * Sitemap único para todo el sitio (ADR-11): un solo host, un solo sitemap.
 *
 * Cada entrada declara sus `alternates.languages`, que es el `hreflang` en el
 * sitemap. Con eso Google empareja `/es/ofertas/x` con `/en/jobs/x` sin
 * depender de que rastree las dos y encuentre las etiquetas del `<head>`.
 *
 * Solo entra lo que se puede visitar de verdad: la portada, el listado, las
 * vacantes publicadas, las landings vivas y los textos legales. **Las áreas privadas y las de
 * autenticación no**, que son `noindex`. Declarar en el sitemap una URL que
 * luego se bloquea es la contradicción más común y la que gasta rastreo.
 *
 * No lleva `revalidate` propio: se regenera con el resto del despliegue y
 * cuando caduca su caché de ruta. Un sitemap con unas horas de retraso no rompe
 * nada; una vacante nueva se descubre igualmente por el enlace de su landing.
 */
export const revalidate = 3600;

function entry(
  href: LocalizedHref,
  options: { priority: number; lastModified?: Date },
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(defaultLocale, href),
    lastModified: options.lastModified,
    priority: options.priority,
    alternates: {
      languages: {
        ...Object.fromEntries(
          locales.map((locale: Locale) => [locale, absoluteUrl(locale, href)]),
        ),
        'x-default': absoluteUrl(defaultLocale, href),
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, landings] = await Promise.all([
    listPublishedJobs(defaultLocale),
    listLandings(),
  ]);

  return [
    entry('/', { priority: 1 }),

    // `/ofertas` entra SIEMPRE desde ADR-49. Hasta entonces solo entraba con
    // vacantes, porque vacío era `noindex` y declarar en el sitemap una URL que
    // luego se bloquea es la contradicción que más rastreo gasta. Ya no está
    // vacío nunca: lleva dentro los cinco perfiles de mercado, así que es
    // indexable con o sin vacantes y el sitemap y `generateMetadata` vuelven a
    // decir lo mismo.
    //
    // ⛔ Y aquí ya NO van `/oportunidades` ni sus cinco fichas: se retiraron
    // con un 301 a `/ofertas` y a su landing de país+sector (ADR-49). Una URL
    // redirigida en el sitemap es rastreo tirado y una señal contradictoria.
    entry('/jobs', { priority: 0.9 }),

    ...landings.map((landing) =>
      entry(landingHref(landing), { priority: 0.7 }),
    ),

    ...jobs.map((job) =>
      entry(
        { pathname: '/jobs/[slug]', params: { slug: job.slug } },
        {
          priority: 0.8,
          lastModified: job.publishedAt ? new Date(job.publishedAt) : undefined,
        },
      ),
    ),

    // Los legales entran, con prioridad baja (ADR-33). No compiten por rastreo
    // con las páginas que captan, pero un Impressum que Google no encuentra no
    // cumple la función por la que existe: que alguien que duda del sitio pueda
    // dar con quién hay detrás sin tener que fiarse del propio sitio.
    entry('/legal', { priority: 0.3 }),
    ...LEGAL_DOCUMENTS.map((document) =>
      entry(legalHref(document), { priority: 0.3 }),
    ),
  ];
}
