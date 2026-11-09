import { getFormatter, getTranslations } from 'next-intl/server';

import { AudioConsentPanel } from '@/components/candidate/audio-consent';
import { AvailabilityPanel } from '@/components/candidate/availability-panel';
import { DocumentsStatus } from '@/components/candidate/documents-status';
import { ProfileForm } from '@/components/candidate/profile-form';
import { AutoRefresh } from '@/components/demo/client';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { listConversations } from '@/lib/demo/conversations';
import { MessageCircleIcon } from 'lucide-react';
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

  const [
    t,
    format,
    countries,
    documents,
    { data: audioConsent },
    tInbox,
    conversations,
  ] = await Promise.all([
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
    getTranslations({ locale, namespace: 'Inbox' }),
    listConversations(locale),
  ]);

  // ⚠️ DEMO: lo que espera respuesta del candidato.
  const waiting = conversations.filter(
    (c) => c.status === 'pending' || c.lastSender === 'agency',
  ).length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-3">
        <h1 className="type-h1">
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

      <AutoRefresh ms={3000} />
      <Link
        href="/account/messages"
        className={
          waiting > 0
            ? 'flex items-center gap-3 rounded-2xl border-2 border-brand-accent bg-brand-accent-soft/50 p-4'
            : 'flex items-center gap-3 rounded-2xl border bg-card p-4'
        }
      >
        <MessageCircleIcon aria-hidden className="size-6 shrink-0" />
        <span className="flex flex-1 flex-col">
          <span className="type-h4">
            {waiting > 0
              ? tInbox('banner', { count: waiting })
              : tInbox('title')}
          </span>
        </span>
        <span className="type-meta font-semibold">{tInbox('see')} →</span>
      </Link>

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
