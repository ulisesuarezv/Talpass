import { useFormatter, useTranslations } from 'next-intl';

import { AGREEMENT_FLOOR } from '@/lib/opportunities';

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
