import { getTranslations } from 'next-intl/server';

import { AccountNav } from '@/components/account-nav';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';

/**
 * Cabecera pública. Server Component y sin estado de sesión a propósito:
 * leer la sesión aquí volvería dinámica toda página que use este layout
 * (ADR-11). El estado de sesión lo pone `AccountNav`, que es cliente y aislado
 * justamente por eso.
 */
export async function SiteHeader() {
  const t = await getTranslations('Nav');

  return (
    <header className="sticky top-0 z-40 border-b border-b-brand/30 bg-background/85 backdrop-blur-sm">
      <a
        href="#content"
        className="sr-only bg-background focus:not-sr-only focus:absolute focus:left-4 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        {t('skipToContent')}
      </a>

      {/*
        `flex-wrap` y altura mínima en vez de `h-14` fija: a 390 px la fila
        —marca + dos enlaces + `AccountNav` + `LocaleSwitcher`— medía 453 px y
        empujaba el documento entero de lado (medido el 2026-08-19, arreglado en
        la fase C1). El pie ya envolvía bien con este mismo patrón; aquí no se
        inventa otro. Que envuelva en vez de esconderse detrás de un menú
        desplegable no es pereza: un menú exige JavaScript y un estado en la
        cabecera de TODAS las páginas públicas, y estas son estáticas a
        propósito (ADR-11).
      */}
      <div className="mx-auto flex min-h-14 max-w-5xl flex-wrap items-center justify-between gap-x-2 gap-y-1 px-4 py-2 sm:gap-x-4">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-primary"
        >
          {siteConfig.name}
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 sm:gap-x-4">
          <Link
            href="/opportunities"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('opportunities')}
          </Link>
          <Link
            href="/jobs"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('jobs')}
          </Link>
          <AccountNav />
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
