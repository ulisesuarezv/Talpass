import { CheckIcon, MinusIcon } from 'lucide-react';

import type { AgencyTranslator } from '@/lib/agency/translations';
import type { PoolCandidate } from '@/lib/agency/pool';

const ORDER = ['identity', 'drivingLicense', 'taxId', 'cv', 'audio'] as const;

/**
 * Los sellos de la bolsa: dicen que un documento existe y está comprobado,
 * nunca enseñan el documento (ADR-03).
 *
 * En la tarjeta (`compact`) solo salen los que el candidato tiene: cinco
 * «no» por fila convertirían la lista en ruido. En la ficha salen los cinco,
 * y el que falta lo dice, porque ahí es donde la ETT decide.
 */
export function Stamps({
  stamps,
  t,
  compact = false,
}: {
  stamps: PoolCandidate['stamps'];
  t: AgencyTranslator;
  compact?: boolean;
}) {
  const shown = compact ? ORDER.filter((key) => stamps[key]) : ORDER;

  if (compact) {
    return (
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {shown.map((key) => (
          <li
            key={key}
            className="inline-flex items-center gap-1 type-caption text-foreground"
          >
            <CheckIcon aria-hidden className="size-3.5 text-primary" />
            {t(`stamps.${key}`)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="divide-y rounded-xl border">
      {shown.map((key) => (
        <li
          key={key}
          className="flex items-center justify-between gap-3 px-4 py-3"
        >
          <span className="type-meta font-medium">{t(`stamps.${key}`)}</span>
          {stamps[key] ? (
            <CheckIcon
              aria-label={t('yes')}
              className="size-4 shrink-0 text-primary"
            />
          ) : (
            <span className="inline-flex items-center gap-1 type-caption text-muted-foreground">
              <MinusIcon aria-hidden className="size-3.5" />
              {t('candidate.verified.missing')}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
