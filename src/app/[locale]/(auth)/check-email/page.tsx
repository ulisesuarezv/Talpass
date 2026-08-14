import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ResendConfirmationForm } from '@/components/auth/resend-confirmation-form';
import { Link } from '@/i18n/navigation';

export default async function CheckEmailPage({
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
        {t('checkEmail.title')}
      </h1>
      <p className="mb-2 text-sm text-muted-foreground">
        {t('checkEmail.body')}
      </p>
      <p className="mb-8 text-sm text-muted-foreground">
        {t('checkEmail.spam')}
      </p>

      {/* El correo llega por query, y leerlo obliga a una frontera de Suspense
          para que la página siga siendo estática. */}
      <Suspense fallback={null}>
        <ResendConfirmationForm />
      </Suspense>

      <Link href="/login" className="mt-6 text-sm underline underline-offset-4">
        {t('backToLogin')}
      </Link>
    </>
  );
}
