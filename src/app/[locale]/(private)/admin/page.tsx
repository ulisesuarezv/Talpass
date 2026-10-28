import { getFormatter, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { requireArea } from '@/lib/auth/session';
import {
  listCandidates,
  listIncompleteSignups,
  listReviewQueue,
  VERIFICATION_STATUSES,
  type VerificationStatus,
} from '@/lib/admin/review';

/**
 * Cola de revisión: el esqueleto del backoffice.
 *
 * Crece a lo largo de tres fases —documentos aquí, aplicaciones en la 5,
 * desbloqueos en la 7—, así que se monta como una lista de secciones a la que
 * se añade, no como una pantalla que luego haya que rehacer.
 */
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ verification?: string | string[] }>;
}) {
  const { locale } = await params;

  await requireArea('/admin', locale);

  const { verification: rawVerification } = await searchParams;
  const verification = VERIFICATION_STATUSES.find(
    (status) => status === rawVerification,
  );

  const [t, format, queue, candidates, incomplete] = await Promise.all([
    getTranslations({ locale, namespace: 'Admin' }),
    getFormatter({ locale }),
    listReviewQueue(),
    listCandidates(verification),
    listIncompleteSignups(),
  ]);

  const formatDate = (date: string) =>
    format.dateTime(new Date(date), { dateStyle: 'medium' });

  const filterOptions: (VerificationStatus | undefined)[] = [
    undefined,
    ...VERIFICATION_STATUSES,
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="type-h1">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('queue.explainer')}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">{t('queue.title')}</h2>

        {queue.length === 0 ? (
          <p className="rounded-lg border p-4 text-sm text-muted-foreground">
            {t('queue.empty')}
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {queue.map((entry) => (
              <li key={entry.candidateId}>
                <Link
                  href={{
                    pathname: '/admin/[candidateId]',
                    params: { candidateId: entry.candidateId },
                  }}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-muted"
                >
                  <span className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      {entry.firstName} {entry.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('queue.waitingSince', {
                        date: format.dateTime(new Date(entry.waitingSince), {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }),
                      })}
                    </span>
                  </span>

                  <Badge variant="secondary">
                    {t('queue.pending', { count: entry.pendingCount })}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">{t('directory.title')}</h2>

        <nav aria-label={t('directory.filterLabel')}>
          <ul className="flex flex-wrap gap-2">
            {filterOptions.map((option) => {
              const active = option === verification;

              return (
                <li key={option ?? 'all'}>
                  <Link
                    href={{
                      pathname: '/admin',
                      query: option ? { verification: option } : {},
                    }}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {option
                      ? t(`candidate.verification.${option}`)
                      : t('directory.all')}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {candidates.length === 0 ? (
          <p className="rounded-lg border p-4 text-sm text-muted-foreground">
            {t('directory.empty')}
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {candidates.map((entry) => (
              <li key={entry.candidateId}>
                <Link
                  href={{
                    pathname: '/admin/[candidateId]',
                    params: { candidateId: entry.candidateId },
                  }}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-muted"
                >
                  <span className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      {entry.firstName} {entry.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('directory.since', {
                        date: formatDate(entry.createdAt),
                      })}
                    </span>
                  </span>

                  <Badge
                    variant={
                      entry.verificationStatus === 'verified'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {t(`candidate.verification.${entry.verificationStatus}`)}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {incomplete.length > 0 && (
        <section className="flex flex-col gap-3">
          <header className="flex flex-col gap-1">
            <h2 className="font-medium">{t('incomplete.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('incomplete.explainer')}
            </p>
          </header>

          <ul className="divide-y rounded-lg border">
            {incomplete.map((entry) => (
              <li
                key={entry.profileId}
                className="flex flex-col gap-1 p-4 text-sm"
              >
                <span className="font-medium break-all">{entry.email}</span>
                <span className="text-xs text-muted-foreground">
                  {t('directory.since', { date: formatDate(entry.createdAt) })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
