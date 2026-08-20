import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ResendConfirmationForm } from '@/components/auth/resend-confirmation-form';
import { Link } from '@/i18n/navigation';
import { siteConfig } from '@/config/site';
import type { Locale } from '@/i18n/routing';
import { seoMetadata } from '@/lib/seo';

/**
 * Metadatos propios, y no los de la home (hallazgo 7 de la auditoría del
 * 2026-08-18, arreglado en la fase C1).
 *
 * El `noindex` lo pone el layout del grupo y se queda: estas páginas no aportan
 * SEO. El `<title>` no es para Google — es lo que ve el candidato en la pestaña
 * y lo que se pinta cuando alguien comparte el enlace por WhatsApp, que es
 * exactamente como se va a compartir esto. Un enlace de registro que se anuncia
 * como la home resta confianza en el momento de máxima desconfianza.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth' });

  return seoMetadata({
    locale,
    href: '/check-email',
    title: t('meta.checkEmail.title', { brand: siteConfig.name }),
    description: t('meta.checkEmail.description', { brand: siteConfig.name }),
  });
}

export default async function CheckEmailPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
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
