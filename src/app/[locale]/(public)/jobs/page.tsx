import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function JobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Jobs');

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t('title')}
      </h1>
      <p className="text-muted-foreground">{t('subtitle')}</p>
      <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        {t('empty')}
      </p>
    </div>
  );
}
