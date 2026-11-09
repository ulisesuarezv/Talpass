import type { Metadata } from 'next';

import { AgencyNav, unreadCount } from '@/components/demo/agency-nav';
import { AutoRefresh } from '@/components/demo/client';
import { formatTime, StatusPill } from '@/components/demo/thread';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getAgencyTranslations } from '@/lib/agency/translations';
import { requireArea } from '@/lib/auth/session';
import { listConversations } from '@/lib/demo/conversations';
import { cn } from '@/lib/utils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getAgencyTranslations(locale as Locale);
  return { title: t('inbox.meta', { brand: siteConfig.name }) };
}

/** ⚠️ DEMO. La bandeja de la ETT. */
export default async function AgencyMessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireArea('/agency', locale);

  const [t, conversations] = await Promise.all([
    getAgencyTranslations(locale as Locale),
    listConversations(locale),
  ]);

  return (
    <>
      <AutoRefresh ms={4000} />
      <AgencyNav t={t} current="messages" unread={unreadCount(conversations)} />
      <div className="container-page flex max-w-3xl flex-col gap-6 py-8">
        <h1 className="type-h1">{t('inbox.title')}</h1>

        {conversations.length === 0 ? (
          <p className="rounded-xl border bg-card p-5 type-body text-muted-foreground">
            {t('inbox.empty')}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {conversations.map((c) => {
              const waiting = c.lastSender === 'candidate';
              return (
                <li key={c.id}>
                  <Link
                    href={{
                      pathname: '/agency/messages/[conversationId]',
                      params: { conversationId: c.id },
                    }}
                    className={cn(
                      'flex flex-col gap-1.5 rounded-xl border bg-card p-4 transition-colors hover:border-brand/50',
                      waiting && 'border-brand/50 ring-1 ring-brand/20',
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="type-h4">
                        {waiting ? (
                          <span
                            aria-hidden
                            className="mr-2 inline-block size-2 rounded-full bg-brand-accent align-middle"
                          />
                        ) : null}
                        {c.candidateName}
                      </span>
                      <span className="flex items-center gap-2">
                        {c.lastAt ? (
                          <span className="type-caption text-muted-foreground">
                            {formatTime(c.lastAt, locale)}
                          </span>
                        ) : null}
                        <StatusPill
                          status={c.status}
                          label={t(`inbox.status.${c.status}`)}
                        />
                      </span>
                    </div>
                    {c.jobTitle ? (
                      <span className="type-caption text-muted-foreground">
                        {c.jobTitle}
                      </span>
                    ) : null}
                    {c.lastBody ? (
                      <p className="line-clamp-2 type-meta">
                        {c.lastSender === 'agency' ? (
                          <span className="text-muted-foreground">
                            {t('inbox.you')}:{' '}
                          </span>
                        ) : null}
                        {c.lastBody}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
