import { siteConfig } from '@/config/site';
import type { Locale } from '@/i18n/routing';

/**
 * `Organization` y `WebSite` de schema.org, solo en la home.
 *
 * Le dicen a Google qué marca hay detrás del dominio y cuál es su logo, que es
 * lo que alimenta el nombre del sitio y el icono en los resultados. **No es
 * marcado de empleo**: no nombra vacantes ni empresas, así que no toca la línea
 * de ADR-30 (sin vacantes no se emite nada que parezca una oferta).
 *
 * No lleva `SearchAction` porque el sitio no tiene buscador que filtre: el del
 * hero enlaza a `/ofertas`. Declararlo sería prometerle a Google una búsqueda
 * que no existe. Se añade el día que exista.
 *
 * Todo sale de `siteConfig`: la marca no se escribe aquí (CLAUDE.md).
 */
export function SiteJsonLd({ locale }: { locale: Locale }) {
  const url = new URL('/', siteConfig.url).toString();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${url}#organization`,
        name: siteConfig.name,
        url,
        logo: new URL('/brand/talpass-logo-512.png', siteConfig.url).toString(),
      },
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        name: siteConfig.name,
        url,
        inLanguage: locale,
        publisher: { '@id': `${url}#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // `<` escapado: el JSON va dentro de un `<script>` y un `</script>` en
      // un dato lo cerraría (guía de JSON-LD de Next).
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
      }}
    />
  );
}
