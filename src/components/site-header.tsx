import { getTranslations } from 'next-intl/server';

import { LocaleSwitcher } from '@/components/locale-switcher';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';

/**
 * Cabecera pública. Server Component y sin estado de sesión a propósito:
 * leer la sesión aquí volvería dinámica toda página que use este layout
 * (ADR-11). Cuando haga falta mostrar "mi cuenta" según login, será un
 * componente cliente aislado.
 */
export async function SiteHeader() {
  const t = await getTranslations('Nav');

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <a
        href="#content"
        className="sr-only bg-background focus:not-sr-only focus:absolute focus:left-4 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        {t('skipToContent')}
      </a>

      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          {siteConfig.name}
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/jobs"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('jobs')}
          </Link>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
