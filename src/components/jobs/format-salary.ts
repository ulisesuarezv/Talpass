import type { useFormatter } from 'next-intl';

import type { JobSummary } from '@/lib/jobs';

/**
 * La firma mínima que hace falta, no el tipo completo de `useTranslations`:
 * así vale igual el traductor de cliente y el que devuelve `getTranslations`
 * en servidor, que no son el mismo tipo.
 */
type Translate = (key: string, values?: Record<string, string>) => string;
type Format = ReturnType<typeof useFormatter>;

/**
 * Salario legible, o `null` si la vacante no lo declara.
 *
 * El importe siempre viaja con su moneda y su periodo (ADR-07): nada de asumir
 * euros por hora porque el MVP sea Alemania. Sin moneda o sin periodo, la
 * vacante no enseña salario — un número sin unidad es ruido, y en el marcado de
 * schema.org sería directamente un dato falso.
 */
export function formatSalary(
  job: JobSummary,
  t: Translate,
  format: Format,
): string | null {
  if (job.salaryMin === null || !job.salaryCurrency || !job.salaryPeriod) {
    return null;
  }

  const money = (value: number) =>
    format.number(value, {
      style: 'currency',
      currency: job.salaryCurrency as string,
      maximumFractionDigits: 2,
    });

  const period = t(`periods.${job.salaryPeriod}`);

  return job.salaryMax === null || job.salaryMax === job.salaryMin
    ? t('salaryFrom', { min: money(job.salaryMin), period })
    : t('salaryRange', {
        min: money(job.salaryMin),
        max: money(job.salaryMax),
        period,
      });
}
