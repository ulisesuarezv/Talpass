import { getTranslations } from 'next-intl/server';

import { OnboardingWizard } from '@/components/candidate/onboarding-wizard';
import { redirectAndStop } from '@/i18n/navigation';
import { requireArea } from '@/lib/auth/session';
import { getDraft } from '@/lib/candidate/actions';
import { stepFromParam } from '@/lib/candidate/onboarding';
import { listCountries } from '@/lib/catalogs';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Onboarding' });
  return { title: t('title') };
}

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { locale } = await params;
  const session = await requireArea('/onboarding', locale);

  const supabase = await createClient();
  const { data: candidate } = await supabase
    .from('candidates')
    .select('profile_id')
    .eq('profile_id', session.userId)
    .maybeSingle();

  // Ya tiene ficha: esto está terminado y volver aquí no aporta nada.
  if (candidate) {
    redirectAndStop({ href: '/account', locale });
  }

  const [draft, countries, { step: rawStep }] = await Promise.all([
    getDraft(),
    listCountries(locale),
    searchParams,
  ]);

  return (
    <OnboardingWizard
      step={stepFromParam(rawStep, draft)}
      draft={draft}
      countries={countries}
    />
  );
}
