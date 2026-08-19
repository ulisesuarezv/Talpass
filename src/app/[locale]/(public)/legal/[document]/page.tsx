import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';

import {
  documentFromSlug,
  documentVersion,
  legalHref,
  legalLink,
  LEGAL_DOCUMENTS,
  LEGAL_SLUGS,
  type LegalDocument,
} from '@/config/legal';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getLegalBody } from '@/lib/legal';
import { seoMetadata } from '@/lib/seo';

/**
 * Un texto legal: `/es/legal/privacidad`, `/en/legal/privacy` (ADR-33).
 *
 * Pública y estática como el resto de `(public)`: no lee sesión, ni cookies, ni
 * `searchParams` (ADR-11, ADR-13). Es condición, no preferencia — el
 * consentimiento del registro apunta aquí, así que estas direcciones tienen que
 * responder a cualquiera, sin cuenta y sin JavaScript, y desde el CDN.
 *
 * `dynamicParams = false`: los documentos son cinco y están en el código, así
 * que un segmento que no se haya generado es un 404 y no una página vacía.
 */
export const revalidate = 3600;
export const dynamicParams = false;

type Params = { locale: Locale; document: string };

export function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  return LEGAL_DOCUMENTS.map((document) => ({
    document: LEGAL_SLUGS[document][locale],
  }));
}

/** El documento del segmento, o un 404. Se resuelve una vez y se reutiliza. */
async function resolve(params: Promise<Params>) {
  const { locale, document: slug } = await params;
  const document = documentFromSlug(locale, slug);
  if (!document) notFound();
  return { locale, document };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, document } = await resolve(params);
  const t = await getTranslations({ locale, namespace: 'Legal' });

  // Metadatos propios, no los heredados de la home: la auditoría del
  // 2026-08-18 encontró ese fallo en `(auth)` (hallazgo 7) y no se repite aquí.
  return seoMetadata({
    locale,
    href: legalHref(document),
    title: t(`documents.${document}.meta.title`, { brand: siteConfig.name }),
    description: t(`documents.${document}.meta.description`, {
      brand: siteConfig.name,
    }),
  });
}

export default async function LegalDocumentPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, document } = await resolve(params);
  setRequestLocale(locale);

  const [t, format, body] = await Promise.all([
    getTranslations({ locale, namespace: 'Legal' }),
    getFormatter({ locale }),
    getLegalBody(locale, document),
  ]);

  const version = documentVersion(document);

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          <Link href="/legal" className="underline underline-offset-4">
            {t('backToIndex')}
          </Link>
        </p>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t(`documents.${document}.title`)}
        </h1>

        {/* Cada documento abre diciendo de qué fecha es su versión, y esa fecha
            es la de `CONSENT_VERSIONS`: es lo que hace comprobable qué texto
            aceptó una persona. El Impressum no se consiente, así que no tiene
            versión y lo dice en vez de inventarse una. */}
        <p className="text-sm text-muted-foreground">
          {version
            ? t('version', {
                date: format.dateTime(new Date(version), { dateStyle: 'long' }),
              })
            : t('noVersion')}
        </p>

        <p className="text-pretty">{body.summary}</p>
      </header>

      {body.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            {section.heading}
          </h2>

          {/* La lista antes que los párrafos, y no al revés: en estos
              documentos `items` es siempre la enumeración —quién es el
              responsable, qué datos se recogen, qué ve una agencia— y
              `paragraphs` el comentario que la matiza. Pintarlos al revés
              dejaba frases como «la dirección de arriba» encima de la
              dirección. */}
          {section.items ? (
            <ul className="flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
              {section.items.map((item) => (
                <li key={item} className="text-pretty">
                  {item}
                </li>
              ))}
            </ul>
          ) : null}

          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="text-pretty text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      {/* Visible y no en letra pequeña: estos textos los redacta el responsable
          y no son un dictamen jurídico. Es cierto, y un proyecto que vende
          transparencia no puede fingir un sello que no tiene. */}
      <aside className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        {t('authorship')}
      </aside>

      <nav
        aria-label={t('title')}
        className="flex flex-col gap-2 border-t pt-6 text-sm"
      >
        {LEGAL_DOCUMENTS.filter((other) => other !== document).map((other) => (
          <OtherDocument
            key={other}
            document={other}
            locale={locale}
            label={t(`documents.${other}.title`)}
          />
        ))}
      </nav>
    </article>
  );
}

function OtherDocument({
  document,
  locale,
  label,
}: {
  document: LegalDocument;
  locale: Locale;
  label: string;
}) {
  return (
    <Link
      href={legalLink(document, locale)}
      className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
    >
      {label}
    </Link>
  );
}
