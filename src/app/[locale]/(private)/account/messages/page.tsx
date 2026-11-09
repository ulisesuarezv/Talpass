import { ArrowLeftIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AutoRefresh } from '@/components/demo/client';
import { formatTime, StatusPill } from '@/components/demo/thread';
import { Link } from '@/i18n/navigation';
import { requireCandidate } from '@/lib/auth/session';
import { listConversations } from '@/lib/demo/conversations';
import { cn } from '@/lib/utils';

/** ⚠️ DEMO. La bandeja del candidato, pensada para el móvil. */
export default async function CandidateMessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireCandidate(locale);

  const [t, conversations] = await Promise.all([
    getTranslations({ locale, namespace: 'Inbox' }),
    listConversations(locale),
  ]);

  return (
    <div className="container-page flex max-w-2xl flex-col gap-5 py-6">
      <AutoRefresh ms={3000} />
      <Link
        href="/account"
        className="inline-flex min-h-11 items-center gap-1.5 type-meta text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon aria-hidden className="size-4" />
        {t('back')}
      </Link>
      <h1 className="type-h1">{t('title')}</h1>

      {conversations.length === 0 ? (
        <p className="rounded-xl border bg-card p-5 type-body text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {conversations.map((c) => {
            const isNew = c.status === 'pending' || c.lastSender === 'agency';
            return (
              <li key={c.id}>
                <Link
                  href={{
                    pathname: '/account/messages/[conversationId]',
                    params: { conversationId: c.id },
                  }}
                  className={cn(
                    'flex flex-col gap-1.5 rounded-xl border bg-card p-4',
                    isNew &&
                      'border-brand-accent/60 ring-1 ring-brand-accent/30',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="type-h4">{c.agencyName}</span>
                    <StatusPill
                      status={c.status}
                      label={t(`status.${c.status}`)}
                    />
                  </div>
                  {c.jobTitle ? (
                    <span className="type-meta font-medium">{c.jobTitle}</span>
                  ) : null}
                  {c.lastBody ? (
                    <p className="line-clamp-2 type-meta text-muted-foreground">
                      {c.lastSender === 'candidate' ? `${t('you')}: ` : null}
                      {c.lastBody}
                    </p>
                  ) : null}
                  {c.lastAt ? (
                    <span className="type-caption text-muted-foreground">
                      {formatTime(c.lastAt, locale)}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
