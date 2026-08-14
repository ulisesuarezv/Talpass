import { getTranslations } from 'next-intl/server';

import { Badge } from '@/components/ui/badge';

export type DocumentStatusRow = {
  slug: string;
  label: string;
  required: boolean;
  status: 'missing' | 'pending' | 'verified' | 'rejected';
};

/**
 * Estado de verificación documento a documento, en solo lectura.
 *
 * La subida es de la fase 4; lo que hace falta hoy es que el candidato sepa qué
 * le van a pedir y en qué punto está cada cosa. Enseñar la lista antes de poder
 * subir nada es deliberado: un candidato que no sabe qué papeles necesita
 * abandona antes de empezar.
 *
 * Los tipos y su obligatoriedad salen del catálogo por país (ADR-07), no de
 * una lista escrita aquí.
 */
export async function DocumentsStatus({
  rows,
  locale,
}: {
  rows: DocumentStatusRow[];
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'Account.documents' });

  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="font-medium">{t('title')}</h2>
      <p className="text-sm text-muted-foreground">{t('explainer')}</p>

      <ul className="divide-y">
        {rows.map((row) => (
          <li
            key={row.slug}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <span className="text-sm">
              {row.label}
              {row.required ? null : (
                <span className="text-muted-foreground">
                  {' '}
                  · {t('optional')}
                </span>
              )}
            </span>
            <Badge
              variant={row.status === 'verified' ? 'default' : 'secondary'}
            >
              {t(`status.${row.status}`)}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
