import type { Metadata } from 'next';
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';

import { controller, controllerAddressLine } from '@/config/controller';
import { documentVersion, legalLink, LEGAL_DOCUMENTS } from '@/config/legal';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { seoMetadata } from '@/lib/seo';

/**
 * Índice legal: `/es/legal` (ADR-33).
 *
 * Existe por dos razones y ninguna es de maquetación. Una, el pie necesita un
 * ancla: cinco enlaces en el pie de un móvil es lo que nadie lee. Y dos, esta
 * página enseña **la versión de los cinco documentos de un vistazo**, que es
 * exactamente lo que hay que poder comprobar cuando se discute qué texto aceptó
 * una persona.
 *
 * Pública y estática, como el resto de `(public)`: sin sesión, sin cookies
 * (ADR-11, ADR-13).
 */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Legal' });

  return seoMetadata({
    locale,
    href: '/legal',
    title: t('index.meta.title', { brand: siteConfig.name }),
    description: t('index.meta.description', { brand: siteConfig.name }),
  });
}

export default async function LegalIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, format] = await Promise.all([
    getTranslations({ locale, namespace: 'Legal' }),
    getFormatter({ locale }),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('index.title')}
        </h1>
        <p className="text-pretty text-muted-foreground">{t('index.intro')}</p>
      </header>

      <ul className="flex flex-col gap-4">
        {LEGAL_DOCUMENTS.map((document) => {
          const version = documentVersion(document);

          return (
            <li key={document} className="flex flex-col gap-1 border-b pb-4">
              <Link
                href={legalLink(document, locale)}
                className="font-medium underline underline-offset-4"
              >
                {t(`documents.${document}.title`)}
              </Link>
              <p className="text-sm text-muted-foreground">
                {t(`documents.${document}.meta.description`, {
                  brand: siteConfig.name,
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {version
                  ? t('version', {
                      date: format.dateTime(new Date(version), {
                        dateStyle: 'long',
                      }),
                    })
                  : t('noVersion')}
              </p>
            </li>
          );
        })}
      </ul>

      {/* El responsable, también aquí y no solo dentro del Impressum: quien
          llega a `/legal` buscando quién hay detrás no debería tener que
          adivinar en cuál de los cinco documentos está. */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {t('index.controllerHeading')}
        </h2>
        <address className="text-sm text-muted-foreground not-italic">
          {controller.name}
          <br />
          {controllerAddressLine(locale)}
          <br />
          <a
            href={`mailto:${controller.email}`}
            className="underline underline-offset-4"
          >
            {controller.email}
          </a>
        </address>
      </section>

      <aside className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        {t('authorship')}
      </aside>
    </div>
  );
}
