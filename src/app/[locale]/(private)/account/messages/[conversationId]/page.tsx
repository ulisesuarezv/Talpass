import { ArrowLeftIcon, LockIcon, PartyPopperIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AutoRefresh, Composer, SubmitButton } from '@/components/demo/client';
import { JobCard, Messages } from '@/components/demo/thread';
import { Link } from '@/i18n/navigation';
import { requireCandidate } from '@/lib/auth/session';
import { respondAction, sendMessageAction } from '@/lib/demo/actions';
import { getConversation } from '@/lib/demo/conversations';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ⚠️ DEMO. Un hilo, desde el lado del candidato. */
export default async function CandidateConversationPage({
  params,
}: {
  params: Promise<{ locale: string; conversationId: string }>;
}) {
  const { locale, conversationId } = await params;
  await requireCandidate(locale);

  const [t, conversation] = await Promise.all([
    getTranslations({ locale, namespace: 'Inbox' }),
    UUID.test(conversationId) ? getConversation(conversationId, locale) : null,
  ]);

  const back = (
    <Link
      href="/account/messages"
      className="inline-flex min-h-11 items-center gap-1.5 type-meta text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon aria-hidden className="size-4" />
      {t('back')}
    </Link>
  );

  if (!conversation) {
    return <div className="container-page py-6">{back}</div>;
  }

  const { status } = conversation;
  const job = conversation.job ? (
    <JobCard
      job={conversation.job}
      locale={locale}
      labels={{
        heading: t('job'),
        perHour: (amount) => t('perHour', { amount }),
        fromPerHour: (amount) => t('fromPerHour', { amount }),
        transport: t('transport'),
        housing: t('housing'),
        start: (date) => t('start', { date }),
      }}
    />
  ) : null;

  return (
    <div className="container-page flex max-w-2xl flex-col gap-4 py-4">
      <AutoRefresh />
      {back}
      <h1 className="type-h2">{conversation.agency_name}</h1>

      {status === 'pending' ? (
        <section className="flex flex-col gap-3 rounded-2xl border-2 border-brand-accent/50 bg-brand-accent-soft/40 p-4">
          <h2 className="type-h3">
            {t('pendingTitle', { agency: conversation.agency_name })}
          </h2>
          <p className="type-meta text-muted-foreground">{t('pendingBody')}</p>
        </section>
      ) : null}

      {status === 'hired' ? (
        <p className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 p-3 type-meta font-medium text-emerald-900">
          <PartyPopperIcon aria-hidden className="size-5 shrink-0" />
          {t('hiredNote')}
        </p>
      ) : null}

      {job}

      <section className="flex flex-col gap-4 rounded-2xl border bg-muted/40 p-3 sm:p-5">
        <Messages
          messages={conversation.messages}
          locale={locale}
          youLabel={t('you')}
          otherLabel={conversation.agency_name}
        />

        {status === 'pending' ? (
          <form action={respondAction} className="flex flex-col gap-2">
            <input
              type="hidden"
              name="conversationId"
              value={conversation.id}
            />
            <SubmitButton label={t('accept')} name="accept" value="yes" />
            <SubmitButton
              label={t('decline')}
              name="accept"
              value="no"
              variant="outline"
            />
          </form>
        ) : status === 'declined' ? (
          <p className="rounded-xl bg-muted p-3 type-meta text-muted-foreground">
            {t('declinedNote')}
          </p>
        ) : (
          <>
            {status === 'open' ? (
              <p className="inline-flex items-center gap-1.5 type-caption text-muted-foreground">
                <LockIcon aria-hidden className="size-3.5 shrink-0" />
                {t('maskedNote')}
              </p>
            ) : null}
            <Composer
              action={sendMessageAction}
              hidden={{ conversationId: conversation.id }}
              placeholder={t('composer')}
              sendLabel={t('send')}
            />
          </>
        )}
      </section>
    </div>
  );
}
