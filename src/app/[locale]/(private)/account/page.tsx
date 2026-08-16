import { getFormatter, getTranslations } from 'next-intl/server';

import { AudioConsentPanel } from '@/components/candidate/audio-consent';
import { AvailabilityPanel } from '@/components/candidate/availability-panel';
import { DocumentsStatus } from '@/components/candidate/documents-status';
import { ProfileForm } from '@/components/candidate/profile-form';
import { Badge } from '@/components/ui/badge';
import { requireCandidate } from '@/lib/auth/session';
import { listCandidateDocuments } from '@/lib/candidate/documents';
import { listCountries } from '@/lib/catalogs';
import { createClient } from '@/lib/supabase/server';

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId, email, candidate } = await requireCandidate(locale);

  const supabase = await createClient();

  const [t, format, countries, documents, { data: audioConsent }] =
    await Promise.all([
      getTranslations({ locale, namespace: 'Account' }),
      getFormatter({ locale }),
      listCountries(locale),
      listCandidateDocuments(userId, locale, {
        hasDrivingLicense: candidate.has_driving_license,
      }),
      supabase
        .from('consents')
        .select('granted_at')
        .eq('profile_id', userId)
        .eq('type', 'audio_sharing')
        .is('revoked_at', null)
        .order('granted_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('title', {
            name: candidate.first_name,
          })}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              candidate.verification_status === 'verified'
                ? 'default'
                : 'secondary'
            }
          >
            {t(`verification.${candidate.verification_status}`)}
          </Badge>
          <span className="text-sm text-muted-foreground">{email}</span>
        </div>

        <p className="text-sm text-muted-foreground">
          {t(`verificationHelp.${candidate.verification_status}`)}
        </p>
      </header>

      <AvailabilityPanel active={candidate.status === 'active'} />

      <DocumentsStatus rows={documents} locale={locale} />

      <AudioConsentPanel
        granted={Boolean(audioConsent)}
        grantedAt={
          audioConsent
            ? format.dateTime(new Date(audioConsent.granted_at), {
                dateStyle: 'long',
              })
            : null
        }
      />

      <section className="flex flex-col gap-4">
        <h2 className="font-medium">{t('profileSection')}</h2>
        <ProfileForm candidate={candidate} countries={countries} />
      </section>
    </div>
  );
}
