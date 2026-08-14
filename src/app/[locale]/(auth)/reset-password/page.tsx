import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Auth');

  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">
        {t('reset.title')}
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {t('reset.subtitle')}
      </p>

      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
