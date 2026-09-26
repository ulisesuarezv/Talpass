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
 *
 * ## El rediseño del 2026-09-27
 *
 * Era lo único que el rediseño no había tocado: una fila de enlaces grises de
 * 14 px sobre el fondo de la página, sin grupos, y una línea con la marca
 * debajo. Tres cambios:
 *
 * 1. **Petróleo, como la cabecera.** Las dos cierran la página por arriba y
 *    por abajo con la misma superficie, y el contenido claro queda en medio.
 *    Es `--hero` con los mismos contrastes medidos que la cabecera: blanco
 *    14,55 y `--hero-muted` 8,65.
 * 2. **Dos grupos con rótulo** —secciones y legal— en vez de una fila suelta.
 *    El rótulo es un `p` y no un `h2`: la home tiene cinco `h2` medidos y el
 *    pie no es una sección de contenido. El nombre accesible lo da
 *    `aria-labelledby`.
 * 3. **Zonas táctiles de 44 px en móvil** (antes 32), que baja a 32 desde
 *    `sm`, donde ya no se toca con el dedo.
 *
 * La línea `Footer.rights` desaparece: desde ADR-43 decía solo la marca, y
 * ahora la marca encabeza el pie. El nombre del responsable sigue donde lo
 * exige la ley, en el Impressum, que es el primer enlace.
 */
export async function SiteFooter() {
  const [t, nav, footer, locale] = await Promise.all([
    getTranslations('Legal'),
    getTranslations('Nav'),
    getTranslations('Footer'),
    getLocale(),
  ]);

  const linkClass =
    'inline-flex min-h-11 items-center type-meta text-hero-foreground underline-offset-4 transition-colors hover:underline sm:min-h-8';
  const labelClass =
    'mb-1 text-xs leading-snug font-semibold tracking-[0.08em] text-hero-muted uppercase';

  return (
    <footer className="border-t border-hero-foreground/15 bg-hero text-hero-foreground">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-[1fr_auto_auto] sm:gap-x-16 sm:py-12">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center self-start justify-self-start text-[1.0625rem] leading-none font-semibold tracking-tight text-hero-foreground sm:min-h-0"
        >
          {siteConfig.name}
        </Link>

        <nav aria-labelledby="footer-sections">
          <p id="footer-sections" className={labelClass}>
            {nav('sectionsLabel')}
          </p>
          <ul>
            <li>
              <Link href="/jobs" className={linkClass}>
                {nav('jobs')}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-legal">
          <p id="footer-legal" className={labelClass}>
            {footer('legalHeading')}
          </p>
          <ul>
            {LEGAL_DOCUMENTS.map((document) => (
              <li key={document}>
                <Link
                  href={legalLink(document, locale as Locale)}
                  className={linkClass}
                >
                  {t(`documents.${document}.title`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
