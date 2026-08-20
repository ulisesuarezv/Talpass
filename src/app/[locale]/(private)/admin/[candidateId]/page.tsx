import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

import { DocumentReview } from '@/components/admin/document-review';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { getCandidateFile } from '@/lib/admin/review';
import { requireArea } from '@/lib/auth/session';

/**
 * Ficha de un candidato: su estado de verificación, sus documentos y quién los
 * ha abierto.
 *
 * El registro de aperturas se enseña aquí a propósito. Es la tabla que sostiene
 * la defensa GDPR y el argumento de venta, y una traza que nadie mira nunca
 * acaba siendo una traza que nadie nota cuando deja de escribirse.
 */
export default async function AdminCandidatePage({
  params,
}: {
  params: Promise<{ locale: string; candidateId: string }>;
}) {
  const { locale, candidateId } = await params;

  await requireArea('/admin', locale);

  const [t, format, file] = await Promise.all([
    getTranslations({ locale, namespace: 'Admin' }),
    getFormatter({ locale }),
    getCandidateFile(candidateId, locale),
  ]);

  if (!file) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <Link href="/admin" className="text-sm type-link">
        {t('candidate.back')}
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="type-h1">
          {file.firstName} {file.lastName}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              file.verificationStatus === 'verified' ? 'default' : 'secondary'
            }
          >
            {t(`candidate.verification.${file.verificationStatus}`)}
          </Badge>
          {file.email ? (
            <span className="text-sm text-muted-foreground">{file.email}</span>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">{t('candidate.city')}</dt>
            <dd>{file.currentCity ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('candidate.english')}</dt>
            <dd>{file.englishLevel?.toUpperCase() ?? '—'}</dd>
          </div>
        </dl>
      </header>

      <DocumentReview documents={file.documents} locale={locale} />

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">{t('candidate.openings')}</h2>

        {file.openings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('candidate.noOpenings')}
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
            {file.openings.map((opening) => (
              <li key={`${opening.documentId}-${opening.openedAt}`}>
                {format.dateTime(new Date(opening.openedAt), {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
