import { useFormatter, useLocale, useTranslations } from 'next-intl';

import { formatMarketSalaryParts } from '@/components/opportunities/format-market-salary';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import type { Opportunity } from '@/lib/opportunities';

/**
 * Tarjeta de un perfil de mercado. La usan la home y `/ofertas`.
 *
 * Se ve y se siente como una tarjeta de vacante —es lo que convierte— pero
 * enlaza a una landing de país + sector, no a un puesto: no lleva empresa, ni
 * fecha de incorporación, ni botón de aplicar.
 *
 * 🔴 **Desde ADR-49 esta tarjeta comparte página con las vacantes reales.** La
 * separación dejó de ser estructural —vivían en `/oportunidades`, otro árbol de
 * rutas— y ahora la sostienen tres cosas y solo tres: el rótulo de la sección
 * que la contiene, que **no se emite `JobPosting`** y que no hay botón de
 * aplicar (ADR-30, intacto). Si alguien añade aquí un dato que suene a puesto
 * concreto —una empresa, una fecha de incorporación, un «aplicar»—, no queda
 * red: hay que leer ADR-49 antes de tocar esto.
 *
 * ## La anatomía (rediseño del 2026-09-25)
 *
 * Antes eran cinco párrafos seguidos de 14-15 px, casi del mismo gris, con el
 * salario escondido en medio: «demasiado plana y básica», y con razón. Ahora
 * hay tres zonas con papeles distintos y una escala de 11 a 40 px:
 *
 * 1. **Identificación**: región y país en versales pequeñas, y el título.
 * 2. **La cifra**, que es el dato que decide, en grande y con `tabular-nums`,
 *    con su unidad al lado y **su procedencia debajo** (ADR-31: la etiqueta
 *    corta viaja con el número, no se queda en la ficha).
 * 3. **La rejilla de datos**, separada por una línea: jornada, turnos, alemán,
 *    alojamiento y —en la variante ancha— transporte y ciudades. Jornada,
 *    alojamiento y transporte **no se enseñaban en ninguna tarjeta** hasta hoy,
 *    y son justo lo que hace que el perfil se lea como una oferta de verdad.
 *
 * Un dato que el perfil no documenta **se omite de la rejilla** en vez de
 * pintar «sin datos» cinco veces; la excepción es el alemán, donde `null`
 * significa «no lo sabemos» y **no** «no hace falta», y callarlo sería dejar
 * que se lea lo segundo.
 *
 * ## Las variantes
 *
 * `default` es la ancha (la sección de perfiles de `/ofertas` y la tarjeta destacada de la
 * home): resumen + seis datos. `compact` quita el resumen, el transporte y las
 * ciudades, porque en la home va en una columna de un tercio y ahí ese texto
 * es ruido. **Es una prop, no un componente aparte**: dos copias de esta
 * tarjeta serían dos sitios donde olvidarse de ADR-30.
 */
export type OpportunityCardVariant = 'default' | 'compact';

export function OpportunityCard({
  opportunity,
  variant = 'default',
  featured = false,
}: {
  opportunity: Opportunity;
  variant?: OpportunityCardVariant;
  /** Superficie de marca y cifra a 40 px. Solo la primera de la home. */
  featured?: boolean;
}) {
  const t = useTranslations('Opportunities');
  const tJobs = useTranslations('Jobs');
  const format = useFormatter();
  const locale = useLocale() as Locale;

  const profile = `profiles.${opportunity.sector}`;
  const region = t(`${profile}.region`);
  const cities = t(`${profile}.cities`);
  const wide = variant === 'default';

  const salary = formatMarketSalaryParts(opportunity, t, tJobs, format);
  const hours = opportunity.weeklyHours;

  const facts: { key: string; label: string; value: string }[] = [
    hours && {
      key: 'hours',
      label: t('facts.weeklyHoursLabel'),
      value:
        hours.min === hours.max
          ? t('facts.weeklyHours', { hours: String(hours.min) })
          : t('facts.weeklyHoursRange', {
              min: String(hours.min),
              max: String(hours.max),
            }),
    },
    {
      key: 'shifts',
      label: t('facts.shiftsLabel'),
      value: opportunity.shifts.map((s) => tJobs(`shifts.${s}`)).join(' · '),
    },
    {
      key: 'language',
      label: t('facts.languageLabel'),
      value: opportunity.germanLevel
        ? t('facts.languageLevel', {
            level: opportunity.germanLevel.toUpperCase(),
          })
        : t('facts.unknown'),
    },
    // Un extra sin documentar SE CALLA. Pintar «Sin datos» en alojamiento y en
    // transporte dejaba las dos últimas tarjetas —las que menos datos tienen—
    // pareciendo a medio hacer, y «sin datos» sobre un extra no informa de
    // nada: el dato completo de cada perfil está en su comentario de
    // `lib/opportunities.ts`, no en la tarjeta. El alemán es la
    // excepción de arriba, y por eso sigue diciéndolo.
    opportunity.housing === 'sometimes' && {
      key: 'housing',
      label: t('facts.housingLabel'),
      value: t('facts.perkSometimes'),
    },
    wide &&
      opportunity.transport === 'sometimes' && {
        key: 'transport',
        label: t('facts.transportLabel'),
        value: t('facts.perkSometimes'),
      },
    wide &&
      cities && {
        key: 'cities',
        label: t('facts.citiesLabel'),
        value: cities,
      },
  ].filter(Boolean) as { key: string; label: string; value: string }[];

  return (
    <article
      className={cn(
        // `@container`: la rejilla de datos pasa a tres columnas según el ancho
        // de LA TARJETA, no el de la pantalla. La misma tarjeta mide 343 px en
        // un móvil, 400 en una columna de la home y 740 en `/ofertas`, y
        // un `sm:` habría puesto tres columnas justo donde no caben.
        'group @container surface-offer',
        featured ? 'bg-brand-soft' : 'bg-card',
      )}
    >
      {/* La destacada ocupa dos columnas, y con el pie de datos DEBAJO le
          sobraba altura: se estiraba a la altura de la fila y dejaba un
          agujero de ~200 px entre el resumen y la rejilla. A partir de 672 px
          de tarjeta, la rejilla se pone AL LADO y separa con línea vertical:
          el ancho que ya tenía se usa en vez de crecer hacia abajo. */}
      <div
        className={cn(
          'flex flex-1 flex-col',
          featured && '@2xl:grid @2xl:grid-cols-[1.35fr_1fr]',
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-1 p-4',
            featured ? 'sm:p-6 lg:p-8' : 'sm:p-5',
          )}
        >
          {/* La procedencia geográfica va ARRIBA del título, no debajo: es lo
            que el ojo usa para descartar, y en versales pequeñas no compite
            con el titular. No es una empresa (ADR-30). */}
          <p className="type-eyebrow">
            {[region, opportunity.countryName].filter(Boolean).join(' · ')}
          </p>

          <h3
            className={cn(
              'transition-colors group-hover:text-primary',
              featured ? 'type-h2' : 'type-h3',
            )}
          >
            <Link
              href={{
                // Desde ADR-49 la tarjeta lleva a la LANDING de país + sector,
                // no a una ficha propia: la ficha se retiró y su URL redirige
                // aquí con un 301.
                pathname: '/work/[country]/[sector]',
                // Los segmentos cambian enteros de idioma (`alemania/almacen` ↔
                // `germany/warehouse`), así que se toman los del idioma que se está
                // renderizando. El `hreflang` lo resuelve `opportunityHref`.
                params: opportunity.paramsByLocale[locale],
              }}
              className="outline-none after:absolute after:inset-0 focus-visible:underline"
            >
              {t(`${profile}.title`)}
            </Link>
          </h3>

          <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
            <span className={featured ? 'type-figure-lg' : 'type-figure'}>
              {salary.figure}
            </span>
            <span className="type-meta text-muted-foreground">
              {salary.per}
            </span>
          </p>
          {/* ADR-31: la cifra nunca viaja sin decir de dónde sale. */}
          <p className="type-caption text-muted-foreground">{salary.basis}</p>

          {wide ? (
            <p className="mt-3 type-body text-muted-foreground">
              {t(`${profile}.summary`)}
            </p>
          ) : null}
        </div>

        <dl
          className={cn(
            'grid grid-cols-2 gap-x-4 gap-y-3 border-t px-4 py-3 @md:grid-cols-3',
            featured
              ? 'sm:px-6 sm:py-4 lg:px-8 @2xl:grid-cols-2 @2xl:content-start @2xl:border-t-0 @2xl:border-l @2xl:py-6 @2xl:pl-6'
              : 'sm:px-5',
          )}
        >
          {facts.map((fact) => (
            <div key={fact.key} className="flex flex-col gap-1">
              <dt className="fact-label">{fact.label}</dt>
              <dd className="fact-value">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
