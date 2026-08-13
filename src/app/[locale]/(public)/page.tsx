import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Home');

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-16 sm:py-24">
      <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        {t('eyebrow')}
      </p>

      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        {t('title')}
      </h1>

      <p className="text-base text-pretty text-muted-foreground sm:text-lg">
        {t('subtitle', { brand: siteConfig.name })}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/jobs">{t('ctaJobs')}</Link>
        </Button>
      </div>

      <p className="border-t pt-6 text-sm text-muted-foreground">{t('note')}</p>
    </div>
  );
}
