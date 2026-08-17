import type { useFormatter } from 'next-intl';

import type { Opportunity } from '@/lib/opportunities';

type Translate = (key: string, values?: Record<string, string>) => string;
type Format = ReturnType<typeof useFormatter>;

/**
 * La franja salarial de un perfil de mercado.
 *
 * Sin techo se dice "desde", no se inventa un máximo: es la diferencia entre el
 * rango que se ha medido en las ofertas analizadas y el suelo del convenio, que
 * es lo único que se puede afirmar de los sectores que no salen en la muestra.
 *
 * El periodo sale de `Jobs.periods` a propósito: "hora" es la misma palabra en
 * una vacante y en un perfil de mercado, y duplicarla en dos namespaces es
 * garantizar que un día digan cosas distintas.
 */
export function formatMarketSalary(
  opportunity: Opportunity,
  t: Translate,
  tPeriods: Translate,
  format: Format,
): string {
  const { salary } = opportunity;

  const money = (value: number) =>
    format.number(value, {
      style: 'currency',
      currency: salary.currency,
      maximumFractionDigits: 2,
    });

  const period = tPeriods(`periods.${salary.period}`);

  return salary.max === null
    ? t('facts.salaryFrom', { min: money(salary.min), period })
    : t('facts.salaryRange', {
        min: money(salary.min),
        max: money(salary.max),
        period,
      });
}
