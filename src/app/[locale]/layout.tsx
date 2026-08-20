import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { siteConfig } from '@/config/site';
import { routing } from '@/i18n/routing';

import '../globals.css';

/**
 * General Sans (Fontshare / ITF), autoalojada — fase C2, ADR-39.
 *
 * **Un solo corte, un solo fichero, un solo `preload`: 23.904 B.** Son 5,4 KB
 * MENOS que el subconjunto `latin` de Geist que había antes (29.288 B), así que
 * la tipografía de marca entra abaratando la ruta crítica en vez de gravarla.
 *
 * 🔴 **Y solo la Regular, porque el resto se midió y no cabe.** El variable
 * 200–700 son 38 KB en un fichero y cuesta **4 puntos de Lighthouse y 0,15 s de
 * LCP**; dos estáticas preacargadas cuestan lo mismo; diferir la Semibold sin
 * preacargarla sigue empeorando el LCP en las dos páginas medidas. Lo que pesa
 * no son las peticiones, son los bytes en la ruta crítica, y el umbral cae
 * entre los 29 KB de Geist y los 38 del variable. Las seis configuraciones y
 * sus cifras, en `docs/evidencia/fase-c2/02-rendimiento.md`.
 *
 * **El precio asumido:** los `font-semibold` los emboldece el navegador a
 * partir de la Regular. No es la Semibold de verdad. Está escrito en
 * `src/app/fonts/README.md` para que sea una decisión y no una sorpresa, con lo
 * que costaría comprarla si Ulises la quiere.
 *
 * **No está subseteada, y no es un descuido:** la ITF Free Font License v2.0
 * §02 prohíbe expresamente el subsetting y la conversión de formato. Se sirve
 * el binario oficial sin tocar. §01 permite el autoalojamiento con todas las
 * letras, y hasta lo recomienda.
 *
 * `display: 'swap'` y `adjustFontFallback: 'Arial'` (el de por defecto,
 * explícito aquí para que se lea): el texto pinta con la fuente del sistema
 * ajustada por métricas mientras baja el WOFF2, así que el LCP no espera a la
 * fuente y el CLS no se mueve.
 */
const generalSans = localFont({
  src: './../fonts/GeneralSans-Regular.woff2',
  weight: '400',
  variable: '--font-sans',
  display: 'swap',
  adjustFontFallback: 'Arial',
  fallback: ['system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

// Geist Mono se cargaba aquí y no se usaba en ninguna pantalla: 29 KB de
// tipografía en el camino crítico de un producto cuyo candidato entra con 4G
// (ADR-10). Se retira; el día que haga falta una monoespaciada, vuelve.

/** Prerenderiza un árbol por idioma. Sin esto no habría páginas estáticas. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    metadataBase: new URL(siteConfig.url),
    title: t('title', { brand: siteConfig.name }),
    description: t('description'),
    // `hreflang` por defecto del árbol de idioma. Cada página pública lo
    // sobrescribe con el suyo y con su canónica vía `seoMetadata`; esto es la
    // red de seguridad para las que no lo hacen.
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          new URL(`/${l}`, siteConfig.url).toString(),
        ]),
      ),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Habilita el renderizado estático de todo lo que cuelgue de este layout.
  setRequestLocale(locale);

  const tCommon = await getTranslations({ locale, namespace: 'Common' });

  return (
    <html
      lang={locale}
      className={`${generalSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <SiteHeader />
          <main id="content" className="flex-1">
            {children}
          </main>
          <SiteFooter />

          {/* El nombre accesible del estado de carga, y vive aquí por un
              motivo medido: `loading.tsx` no recibe `params`, así que no puede
              traducir sin volver dinámico el árbol entero (ADR-40) y sin
              llevarse un `chunk` de cliente al paquete de todas las páginas.
              El layout sí tiene el idioma. `PageLoading` apunta a este `id`
              con `aria-labelledby` y así no manda un byte de JavaScript.
              `hidden` no impide que `aria-labelledby` lo lea. */}
          <span id="app-loading-label" hidden>
            {tCommon('loading.label')}
          </span>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
