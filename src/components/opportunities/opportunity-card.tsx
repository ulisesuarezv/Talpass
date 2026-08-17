import { useFormatter, useLocale, useTranslations } from 'next-intl';

import { formatMarketSalary } from '@/components/opportunities/format-market-salary';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { Opportunity } from '@/lib/opportunities';

/**
 * Tarjeta de un perfil de mercado en `/oportunidades`.
 *
 * Se ve y se siente como una tarjeta de vacante —es lo que convierte— pero
 * enlaza a un perfil, no a un puesto: no lleva empresa, ni fecha de
 * incorporación, ni botón de aplicar. El encuadre honesto no está aquí sino
 * arriba del listado, visible y no en letra pequeña (regla 4 de la fase 4b).
 */
export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const t = useTranslations('Opportunities');
  const tJobs = useTranslations('Jobs');
  const format = useFormatter();
  const locale = useLocale() as Locale;

  const profile = `profiles.${opportunity.sector}`;
  const region = t(`${profile}.region`);
  const cities = t(`${profile}.cities`);

  return (
    <article className="relative rounded-lg border p-4 transition-colors hover:bg-muted/40">
      <h3 className="text-base font-semibold tracking-tight text-pretty">
        <Link
          href={{
            pathname: '/opportunities/[country]/[sector]',
            // Los segmentos cambian enteros de idioma (`alemania/almacen` ↔
            // `germany/warehouse`), así que se toman los del idioma que se está
            // renderizando. El `hreflang` lo resuelve `opportunityHref`.
            params: opportunity.paramsByLocale[locale],
          }}
          className="after:absolute after:inset-0 focus-visible:underline"
        >
          {t(`${profile}.title`)}
        </Link>
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">
        {[region, opportunity.countryName].filter(Boolean).join(' · ')}
      </p>

      <p className="mt-2 text-sm font-medium">
        {formatMarketSalary(opportunity, t, tJobs, format)}
      </p>

      <p className="mt-2 text-sm text-muted-foreground">
        {t(`${profile}.summary`)}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="secondary">
          {opportunity.germanLevel
            ? t('facts.languageLevel', {
                level: opportunity.germanLevel.toUpperCase(),
              })
            : t('facts.unknown')}
        </Badge>

        {opportunity.shifts.map((shift) => (
          <Badge key={shift} variant="outline">
            {tJobs(`shifts.${shift}`)}
          </Badge>
        ))}
      </div>

      {cities ? (
        <p className="mt-3 text-xs text-muted-foreground">{cities}</p>
      ) : null}
    </article>
  );
}
