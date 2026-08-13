import { getTranslations } from 'next-intl/server';

export default async function AccountPage() {
  const t = await getTranslations('Account');

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="text-muted-foreground">{t('placeholder')}</p>
    </div>
  );
}
