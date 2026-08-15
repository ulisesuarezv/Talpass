import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { siteConfig } from '@/config/site';
import { routing } from '@/i18n/routing';

import '../globals.css';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
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

  return (
    <html lang={locale} className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <SiteHeader />
          <main id="content" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
