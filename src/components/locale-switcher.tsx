'use client';

import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { usePathname, useRouter } from '@/i18n/navigation';
import {
  localeLabels,
  localeShortLabels,
  locales,
  type Locale,
} from '@/i18n/routing';
import { cn } from '@/lib/utils';

/**
 * Selector de idioma que conserva la ruta actual.
 *
 * `usePathname` de `@/i18n/navigation` devuelve la ruta INTERNA (`/jobs`), y
 * `router.replace` con `{locale}` la vuelve a traducir a la externa del idioma
 * destino (`/en/jobs` ↔ `/es/ofertas`). Por eso no se manipulan strings a mano.
 */
export function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const activeLocale = useLocale() as Locale;
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  function switchTo(nextLocale: Locale) {
    if (nextLocale === activeLocale) return;

    router.replace(
      // `params` lleva los segmentos dinámicos (p. ej. el slug de la vacante).
      // El tipado de `pathnames` no puede saber cuáles aplican en runtime.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { pathname, params } as any,
      { locale: nextLocale },
    );
  }

  return (
    // Control segmentado, y no dos enlaces sueltos (rediseño de la cabecera,
    // 2026-09-25). El idioma es una herramienta, no un destino: pintado como
    // dos textos de 14 px pesaba lo mismo que «Entrar», que es la acción de la
    // cabecera. La pastilla blanca sobre el carril gris dice «esto conmuta»
    // sin una palabra y de paso marca el idioma activo con algo más que el
    // color (WCAG 1.4.1: además va el peso y `aria-current`).
    //
    // Sobre la cabecera petróleo (2026-09-25) el carril es blanco al 12 % y la
    // pastilla del activo blanca entera con tinta del hero encima; el inactivo
    // usa `--hero-muted`, que es el gris verdoso claro ya medido contra el
    // petróleo (8,65). Los tres pares están en `pnpm check:contrast`.
    <nav
      aria-label={t('label')}
      className="flex shrink-0 items-center gap-0.5 rounded-full bg-hero-foreground/12 p-0.5"
    >
      {locales.map((locale) => {
        const isActive = locale === activeLocale;

        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => switchTo(locale)}
            className={cn(
              'rounded-full px-2.5 py-1.5 text-xs leading-none font-medium transition-colors focus-visible:ring-2 focus-visible:ring-hero-foreground focus-visible:outline-none',
              isActive
                ? 'bg-hero-foreground text-hero'
                : 'text-hero-muted hover:text-hero-foreground',
            )}
          >
            {/*
              A 390 px «Español» y «English» sumaban 135 px de cabecera y eran
              la mitad del desbordamiento. El código corto se lee igual y el
              nombre completo sigue ahí para quien navega con lector de
              pantalla, que es a quien le servía de verdad.
            */}
            <span aria-hidden>{localeShortLabels[locale]}</span>
            <span className="sr-only">{localeLabels[locale]}</span>
          </button>
        );
      })}
    </nav>
  );
}
