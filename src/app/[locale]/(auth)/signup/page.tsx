import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SignupForm } from '@/components/auth/signup-form';

export default async function SignupPage({
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
        {t('signup.title')}
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {t('signup.subtitle')}
      </p>

      <SignupForm />
    </>
  );
}
