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
