import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { legalLink } from '@/config/legal';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { seoMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return seoMetadata({
    locale,
    href: '/',
    title: t('title', { brand: siteConfig.name }),
    description: t('description'),
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
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
        <Button asChild size="lg" variant="outline">
          <Link href="/signup">{t('ctaSignup')}</Link>
        </Button>
      </div>

      <p className="border-t pt-6 text-sm text-muted-foreground">{t('note')}</p>

      {/* El Impressum, también desde la home y no solo desde el pie: es la
          prueba de existencia más barata que puede dar un proyecto nuevo, y
          quien se plantea subir su DNI a un dominio que no conoce la busca
          antes de bajar hasta el final de la página. */}
      <p className="text-sm text-muted-foreground">
        {t('behind', { brand: siteConfig.name })}{' '}
        <Link
          href={legalLink('impressum', locale)}
          className="underline underline-offset-4"
        >
          {t('behindLink')}
        </Link>
      </p>
    </div>
  );
}
