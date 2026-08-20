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
    <nav aria-label={t('label')} className="flex items-center gap-1">
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
              'rounded-md px-2 py-1 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              isActive
                ? 'font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground',
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
