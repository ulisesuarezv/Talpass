import { getTranslations } from 'next-intl/server';

import { requireArea } from '@/lib/auth/session';

export default async function AgencyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Un candidato que abra esta URL no ve un error: sale hacia su propia área.
  await requireArea('/agency', locale);

  const t = await getTranslations('Agency');

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="text-muted-foreground">{t('placeholder')}</p>
    </div>
  );
}
