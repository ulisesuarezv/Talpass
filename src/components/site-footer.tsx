import { getTranslations } from 'next-intl/server';

import { siteConfig } from '@/config/site';

export async function SiteFooter() {
  const t = await getTranslations('Footer');

  return (
    <footer className="border-t">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground">
        {t('rights', { brand: siteConfig.name })}
      </div>
    </footer>
  );
}
