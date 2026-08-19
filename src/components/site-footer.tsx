import { getLocale, getTranslations } from 'next-intl/server';

import { legalLink, LEGAL_DOCUMENTS } from '@/config/legal';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

/**
 * Pie público. Server Component y sin sesión, como la cabecera (ADR-11).
 *
 * Los cinco documentos legales van enlazados aquí y no detrás de un índice:
 * el pie es donde una persona que duda de un sitio va a buscar si hay alguien
 * detrás, y obligarla a un clic más para averiguarlo es perder justo a quien
 * había que convencer. El Impressum va el primero por eso mismo.
 */
export async function SiteFooter() {
  const [t, locale] = await Promise.all([
    getTranslations('Legal'),
    getLocale(),
  ]);
  const footer = await getTranslations('Footer');

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground">
        <nav aria-label={footer('legalHeading')}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_DOCUMENTS.map((document) => (
              <li key={document}>
                <Link
                  href={legalLink(document, locale as Locale)}
                  className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  {t(`documents.${document}.title`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p>{footer('rights', { brand: siteConfig.name })}</p>
      </div>
    </footer>
  );
}
