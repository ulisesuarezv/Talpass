import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  LockIcon,
  MailIcon,
  PhoneIcon,
} from 'lucide-react';
import type { Metadata } from 'next';

import { AgencyNav, unreadCount } from '@/components/demo/agency-nav';
import { AutoRefresh, Composer, SubmitButton } from '@/components/demo/client';
import { JobCard, Messages, StatusPill } from '@/components/demo/thread';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getAgencyTranslations } from '@/lib/agency/translations';
import { requireArea } from '@/lib/auth/session';
import { hireAction, sendMessageAction } from '@/lib/demo/actions';
import { getConversation, listConversations } from '@/lib/demo/conversations';

type Params = Promise<{ locale: string; conversationId: string }>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getAgencyTranslations(locale as Locale);
  return { title: t('inbox.meta', { brand: siteConfig.name }) };
}

/** ⚠️ DEMO. Un hilo, desde el lado de la ETT. */
export default async function AgencyConversationPage({
  params,
}: {
  params: Params;
}) {
  const { locale, conversationId } = await params;
  await requireArea('/agency', locale);

  const [t, conversation, list] = await Promise.all([
    getAgencyTranslations(locale as Locale),
    UUID.test(conversationId) ? getConversation(conversationId, locale) : null,
    listConversations(locale),
  ]);

  const back = (
    <Link
      href="/agency/messages"
      className="inline-flex min-h-11 items-center gap-1.5 type-meta text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon aria-hidden className="size-4" />
      {t('inbox.back')}
    </Link>
  );

  if (!conversation) {
    return (
      <div className="container-page py-8">
        {back}
        <h1 className="type-h1">{t('candidate.notFound.title')}</h1>
      </div>
    );
  }

  const { status } = conversation;
  const hasMasked = conversation.messages.some((m) => m.masked);

  return (
    <>
      <AutoRefresh />
      <AgencyNav t={t} current="messages" unread={unreadCount(list)} />
      <div className="container-page flex flex-col gap-4 py-6">
        {back}

        <header className="flex flex-wrap items-center gap-3">
          <h1 className="type-h1">{conversation.candidate_name}</h1>
          <StatusPill status={status} label={t(`inbox.status.${status}`)} />
          <Link
            href={{
              pathname: '/agency/candidates/[candidateId]',
              params: { candidateId: conversation.candidate_id },
            }}
            className="type-meta type-link"
          >
            {t('card.open')}
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:gap-10">
          <section className="flex flex-col gap-4 rounded-2xl border bg-muted/40 p-4 sm:p-6">
            <div className="flex max-h-[55vh] flex-col overflow-y-auto pr-1">
              <Messages
                messages={conversation.messages}
                locale={locale}
                youLabel={t('inbox.you')}
                otherLabel={conversation.candidate_name}
              />
            </div>

            {hasMasked ? (
              <p className="inline-flex items-center gap-1.5 type-caption text-muted-foreground">
                <LockIcon aria-hidden className="size-3.5" />
                {t('inbox.maskedNote')}
              </p>
            ) : null}

            {status === 'pending' ? (
              <p className="rounded-xl bg-amber-50 p-3 type-meta text-amber-900">
                {t('inbox.pendingNote')}
              </p>
            ) : status === 'declined' ? (
              <p className="rounded-xl bg-muted p-3 type-meta text-muted-foreground">
                {t('inbox.declinedNote')}
              </p>
            ) : (
              <Composer
                action={sendMessageAction}
                hidden={{ conversationId: conversation.id }}
                placeholder={t('inbox.composer')}
                sendLabel={t('inbox.send')}
              />
            )}
          </section>

          <aside className="flex flex-col gap-4">
            {status === 'hired' && conversation.contact ? (
              <section className="flex flex-col gap-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
                <h2 className="inline-flex items-center gap-2 type-h4 text-emerald-900">
                  <CheckCircle2Icon aria-hidden className="size-5" />
                  {t('inbox.contactTitle')}
                </h2>
                <p className="type-h4">{conversation.candidate_name}</p>
                {conversation.contact.phone ? (
                  <p className="inline-flex items-center gap-2 type-body">
                    <PhoneIcon aria-hidden className="size-4" />
                    {conversation.contact.phone}
                  </p>
                ) : null}
                {conversation.contact.email ? (
                  <p className="inline-flex items-center gap-2 type-body break-all">
                    <MailIcon aria-hidden className="size-4 shrink-0" />
                    {conversation.contact.email}
                  </p>
                ) : null}
              </section>
            ) : null}

            {status === 'open' ? (
              <form
                action={hireAction}
                className="flex flex-col gap-2 rounded-xl border bg-card p-4"
              >
                <input
                  type="hidden"
                  name="conversationId"
                  value={conversation.id}
                />
                <SubmitButton label={t('inbox.hire')} />
                <p className="type-caption text-muted-foreground">
                  {t('inbox.hireNote')}
                </p>
              </form>
            ) : null}

            {conversation.job ? (
              <JobCard
                job={conversation.job}
                locale={locale}
                labels={{
                  heading: t('inbox.job'),
                  perHour: (amount) => t('inbox.perHour', { amount }),
                  fromPerHour: (amount) => t('inbox.fromPerHour', { amount }),
                  transport: t('inbox.transport'),
                  housing: t('inbox.housing'),
                  start: (date) => t('inbox.start', { date }),
                }}
              />
            ) : null}
          </aside>
        </div>
      </div>
    </>
  );
}
