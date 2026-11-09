import { Link } from '@/i18n/navigation';
import type { AgencyTranslator } from '@/lib/agency/translations';
import { cn } from '@/lib/utils';

/** ⚠️ DEMO. Pestañas del portal: bolsa y mensajes. */
export function AgencyNav({
  t,
  current,
  unread = 0,
}: {
  t: AgencyTranslator;
  current: 'pool' | 'messages';
  unread?: number;
}) {
  const item = (active: boolean) =>
    cn(
      'inline-flex min-h-11 items-center gap-2 border-b-2 px-1 type-meta font-medium transition-colors',
      active
        ? 'border-brand text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground',
    );

  return (
    <nav className="border-b">
      <div className="container-page flex gap-6">
        <Link href="/agency" className={item(current === 'pool')}>
          {t('nav.pool')}
        </Link>
        <Link href="/agency/messages" className={item(current === 'messages')}>
          {t('nav.messages')}
          {unread > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-accent px-1.5 type-caption font-semibold text-brand-accent-ink">
              {unread}
            </span>
          ) : null}
        </Link>
      </div>
    </nav>
  );
}

/** Conversaciones cuyo último mensaje es del candidato: las que esperan a la ETT. */
export function unreadCount(
  list: { lastSender: 'agency' | 'candidate' | null; status: string }[],
) {
  return list.filter((c) => c.lastSender === 'candidate' && c.status === 'open')
    .length;
}
