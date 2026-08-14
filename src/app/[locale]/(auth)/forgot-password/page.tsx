import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default async function ForgotPasswordPage({
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
        {t('forgot.title')}
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {t('forgot.subtitle')}
      </p>

      <ForgotPasswordForm />
    </>
  );
}
