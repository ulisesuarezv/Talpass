import { getTranslations } from 'next-intl/server';

import { AudioRecorder } from '@/components/candidate/audio-recorder';
import { DocumentUpload } from '@/components/candidate/document-upload';
import { Badge } from '@/components/ui/badge';
import { isRejectionReason } from '@/lib/admin/rejection-reasons';
import type { CandidateDocument } from '@/lib/candidate/documents';

/**
 * Verificación del candidato: qué se le pide, cómo va cada papel y por dónde
 * se sube.
 *
 * Los tipos y su obligatoriedad salen del catálogo por país (ADR-07), no de
 * una lista escrita aquí, y el bucket de cada tipo decide qué control se pinta:
 * el audio se graba, el resto se sube. Es dato, no un `if slug === 'audio_en'`.
 *
 * El motivo de un rechazo se enseña entero y en el idioma del candidato: es lo
 * único que le dice qué tiene que corregir, y esconderlo convierte un trámite
 * en un muro.
 */
export async function DocumentsStatus({
  rows,
  locale,
}: {
  rows: CandidateDocument[];
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'Account.documents' });

  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="font-medium">{t('title')}</h2>
      <p className="text-sm text-muted-foreground">{t('explainer')}</p>

      <ul className="divide-y">
        {rows.map((row) => {
          const isAudio = row.bucket === 'candidate-audio';
          const isPhoto = row.acceptedMimeTypes.some((mime) =>
            mime.startsWith('image/'),
          );

          return (
            <li key={row.slug} className="flex flex-col gap-2 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {row.label}
                    {row.required ? null : (
                      <span className="font-normal text-muted-foreground">
                        {' '}
                        · {t('optional')}
                      </span>
                    )}
                  </span>

                  {row.help ? (
                    <span className="text-xs text-muted-foreground">
                      {row.help}
                    </span>
                  ) : null}
                </div>

                <Badge
                  variant={row.status === 'verified' ? 'default' : 'secondary'}
                >
                  {t(`status.${row.status}`)}
                </Badge>
              </div>

              {row.status === 'rejected' && row.rejectionReason ? (
                <p className="rounded-md bg-muted p-3 text-sm">
                  <span className="font-medium">{t('rejectedReason')}: </span>
                  {/* Lo guardado es una clave, no una frase: así el motivo que
                      escribió un admin en español lo lee en inglés quien se
                      registró en inglés. */}
                  {isRejectionReason(row.rejectionReason)
                    ? t(`rejectionReasons.${row.rejectionReason}`)
                    : row.rejectionReason}
                </p>
              ) : null}

              {row.documentId ? (
                <a
                  href={`/api/documents/${row.documentId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm type-link"
                >
                  {t('view')}
                </a>
              ) : null}

              {row.status === 'verified' ? (
                <p className="text-xs text-muted-foreground">
                  {t('lockedWhenVerified')}
                </p>
              ) : isAudio ? (
                <AudioRecorder
                  typeId={row.typeId}
                  acceptedMimeTypes={row.acceptedMimeTypes}
                  maxSizeBytes={row.maxSizeBytes}
                  label={row.label}
                />
              ) : (
                <DocumentUpload
                  typeId={row.typeId}
                  acceptedMimeTypes={row.acceptedMimeTypes}
                  maxSizeBytes={row.maxSizeBytes}
                  photo={isPhoto}
                  label={row.label}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
