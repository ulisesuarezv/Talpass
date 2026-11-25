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
 * Tipografía del rediseño de Kayao (2026-11-24): Inter para el texto, Inter
 * Tight para titulares y cifras, Geist Mono para rótulos y códigos.
 *
 * Sustituye a General Sans en un solo corte (ADR-39). Aquel presupuesto se
 * fijó para un candidato con datos limitados; Ulises lo reabre: la audiencia
 * entra desde móviles buenos en Europa y el corte único —con negritas
 * fingidas por el navegador— era parte de lo que hacía parecer barato el
 * producto. Se sirven desde el propio dominio: no hay petición a Google.
 */
//
// Se sirven recortadas (`src/app/fonts/kayao/`, ver su README): solo los
// caracteres del español, alemán, portugués e inglés y solo los pesos que usa
// la web. Mismo dibujo que las de Google, a la mitad de bytes, que es lo que
// compite con la foto del hero en un móvil lento.
const inter = localFont({
  src: '../fonts/kayao/inter.woff2',
  weight: '400 700',
  variable: '--font-sans',
  display: 'swap',
});

const interTight = localFont({
  src: '../fonts/kayao/inter-tight.woff2',
  weight: '500 800',
  variable: '--font-display',
  display: 'swap',
});

const geistMono = localFont({
  src: '../fonts/kayao/geist-mono.woff2',
  weight: '400 600',
  variable: '--font-mono-brand',
  display: 'swap',
  preload: false,
});

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
      className={`${inter.variable} ${interTight.variable} ${geistMono.variable} h-full antialiased`}
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
