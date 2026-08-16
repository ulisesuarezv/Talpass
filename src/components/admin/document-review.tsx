'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  approveDocumentAction,
  rejectDocumentAction,
  type ReviewResult,
} from '@/lib/admin/actions';
import { REJECTION_REASONS } from '@/lib/admin/rejection-reasons';
import type { CandidateDocument } from '@/lib/candidate/documents';

/**
 * Aprobar o rechazar, documento a documento.
 *
 * Rechazar exige elegir un motivo de la lista cerrada: lo que se guarda es la
 * clave y el candidato la lee traducida a su idioma. Por eso no hay un campo
 * de texto libre — ver `lib/admin/rejection-reasons`.
 *
 * El aviso de correo fallido se enseña **junto al resultado correcto**: la
 * decisión se ha guardado, lo que no ha salido es el email. Confundir las dos
 * cosas llevaría al admin a repetir una aprobación que ya está hecha.
 */
export function DocumentReview({
  documents,
  locale,
}: {
  documents: CandidateDocument[];
  locale: string;
}) {
  const t = useTranslations('Admin.candidate');

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium">{t('documents')}</h2>

      <ul className="divide-y rounded-lg border">
        {documents.map((document) => (
          <li key={document.slug} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="flex flex-col gap-1">
                <span className="text-sm font-medium">{document.label}</span>
                {document.required ? null : (
                  <span className="text-xs text-muted-foreground">
                    {t('optional')}
                  </span>
                )}
              </span>

              <Badge
                variant={
                  document.status === 'verified' ? 'default' : 'secondary'
                }
              >
                {t(`status.${document.status}`)}
              </Badge>
            </div>

            {document.documentId ? (
              <DocumentActions
                documentId={document.documentId}
                status={document.status}
                locale={locale}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t('missing')}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DocumentActions({
  documentId,
  status,
  locale,
}: {
  documentId: string;
  status: CandidateDocument['status'];
  locale: string;
}) {
  const t = useTranslations('Admin.candidate');
  const tReasons = useTranslations('Account.documents.rejectionReasons');

  const [approval, approve, approving] = useActionState<
    ReviewResult | null,
    FormData
  >(approveDocumentAction, null);
  const [rejection, reject, rejecting] = useActionState<
    ReviewResult | null,
    FormData
  >(rejectDocumentAction, null);

  const [reason, setReason] = useState<string>(REJECTION_REASONS[0]);

  const result = approval ?? rejection;

  return (
    <div className="flex flex-col gap-3">
      <a
        href={`/api/documents/${documentId}`}
        target="_blank"
        rel="noreferrer"
        className="text-sm underline underline-offset-4"
      >
        {t('view')}
      </a>

      {status === 'verified' ? null : (
        <div className="flex flex-wrap items-end gap-2">
          <form action={approve}>
            <input type="hidden" name="documentId" value={documentId} />
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" size="sm" disabled={approving || rejecting}>
              {approving ? t('working') : t('approve')}
            </Button>
          </form>

          <form action={reject} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="documentId" value={documentId} />
            <input type="hidden" name="locale" value={locale} />

            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">{t('reasonLabel')}</span>
              <select
                name="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="h-9 rounded-md border bg-transparent px-2 text-sm"
              >
                {REJECTION_REASONS.map((key) => (
                  <option key={key} value={key}>
                    {tReasons(key)}
                  </option>
                ))}
              </select>
            </label>

            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={approving || rejecting}
            >
              {rejecting ? t('working') : t('reject')}
            </Button>
          </form>
        </div>
      )}

      {result?.ok ? (
        <p className="text-sm">
          {t(`messages.${result.message}`)}
          {result.warning ? (
            <span className="text-destructive">
              {' '}
              · {t(`messages.${result.warning}`)}
            </span>
          ) : null}
        </p>
      ) : null}

      {result && !result.ok ? (
        <p className="text-sm text-destructive">
          {t(`messages.${result.error}`)}
        </p>
      ) : null}
    </div>
  );
}
