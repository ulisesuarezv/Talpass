import { useFormatter, useTranslations } from 'next-intl';

import { AGREEMENT_FLOOR, OPPORTUNITY_SOURCE_DATE } from '@/lib/opportunities';

/**
 * El encuadre honesto de la fase 4b, regla 4: **visible y arriba**, no en letra
 * pequeña al pie.
 *
 * Va en el listado y en cada perfil, antes del contenido. Dice tres cosas que
 * tienen que quedar claras antes de leer una sola cifra: que no hay una vacante
 * detrás, de dónde salen los datos y con qué fecha, y que las cifras caducan
 * cuando suba el convenio.
 */
export function MarketDisclosure() {
  const t = useTranslations('Opportunities.disclosure');
  const format = useFormatter();

  return (
    <aside className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/30 p-4">
      <p className="text-sm font-semibold tracking-tight">{t('title')}</p>
      <p className="type-body text-muted-foreground">{t('body')}</p>
      <p className="text-xs text-muted-foreground">
        {t('source', {
          date: format.dateTime(new Date(OPPORTUNITY_SOURCE_DATE), {
            dateStyle: 'long',
          }),
        })}
      </p>
    </aside>
  );
}

/**
 * El suelo del convenio, que es el dato con el que se juzga cualquier oferta
 * del sector y el único que se puede afirmar de los perfiles que no salen en la
 * muestra analizada.
 */
export function AgreementFloor() {
  const t = useTranslations('Opportunities.agreement');
  const format = useFormatter();

  return (
    <section className="flex flex-col gap-2 rounded-lg border p-4">
      <h2 className="type-h3">{t('title')}</h2>
      <p className="type-body text-muted-foreground">
        {t('body', {
          amount: format.number(AGREEMENT_FLOOR.amount, {
            style: 'currency',
            currency: AGREEMENT_FLOOR.currency,
            maximumFractionDigits: 2,
          }),
          date: format.dateTime(new Date(AGREEMENT_FLOOR.since), {
            dateStyle: 'long',
          }),
        })}
      </p>
    </section>
  );
}
