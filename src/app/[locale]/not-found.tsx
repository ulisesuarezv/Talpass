import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default async function LocaleNotFound() {
  const t = await getTranslations('NotFound');

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-4 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="text-muted-foreground">{t('description')}</p>
      <Button asChild variant="outline">
        <Link href="/">{t('back')}</Link>
      </Button>
    </div>
  );
}
