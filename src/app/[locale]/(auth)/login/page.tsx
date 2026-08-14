import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage({
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
        {t('login.title')}
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {t('login.subtitle')}
      </p>

      <LoginForm />
    </>
  );
}
