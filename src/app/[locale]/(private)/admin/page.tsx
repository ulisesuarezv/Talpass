import { getFormatter, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { requireArea } from '@/lib/auth/session';
import { listReviewQueue } from '@/lib/admin/review';

/**
 * Cola de revisión: el esqueleto del backoffice.
 *
 * Crece a lo largo de tres fases —documentos aquí, aplicaciones en la 5,
 * desbloqueos en la 7—, así que se monta como una lista de secciones a la que
 * se añade, no como una pantalla que luego haya que rehacer.
 */
export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  await requireArea('/admin', locale);

  const [t, format, queue] = await Promise.all([
    getTranslations({ locale, namespace: 'Admin' }),
    getFormatter({ locale }),
    listReviewQueue(),
  ]);

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
    </div>
  );
}
