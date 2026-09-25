import { useFormatter, useTranslations } from 'next-intl';

import { AgreementFloor } from '@/components/opportunities/agreement-floor';
import { formatMarketSalaryParts } from '@/components/opportunities/format-market-salary';
import {
  AGREEMENT_FLOOR,
  OPPORTUNITY_SOURCE_DATE,
  type Opportunity,
} from '@/lib/opportunities';

/**
 * El perfil de mercado desarrollado, dentro de la landing de país + sector
 * (ADR-50).
 *
 * 🔴 **Esto NO es una vacante y no puede parecerlo.** Es el mismo contenido que
 * pintaba la ficha `/oportunidades/[country]/[sector]` retirada por ADR-49, que
 * dejó su copy huérfano en `messages/` —intro, tareas, requisitos y
 * condiciones— viajando en el HTML de todas las páginas (ADR-37) sin que nadie
 * lo pintara. Aquí vuelve a tener sitio, y en la URL a la que ya redirige el
 * 301.
 *
 * Lo que sostiene la separación es lo mismo que en `/ofertas`, y son tres cosas
 * y solo tres (ADR-49, punto 4):
 *
 * 1. **El rótulo**: antetítulo «Perfiles de mercado», encabezado propio y la
 *    línea `notJobs` antes de cualquier dato, que dice qué no es esto.
 * 2. **Cero `JobPosting`**, y ningún otro JSON-LD de empleo. Este componente no
 *    emite marcado: es el interruptor de ADR-30 y se verifica sobre el HTML
 *    servido, no sobre el código.
 * 3. **Ningún botón de aplicar**, ni empresa, ni fecha de incorporación.
 *
 * Quien añada aquí cualquiera de esas tres cosas rompe la garantía entera, y no
 * queda red.
 *
 * Y la franja salarial **nunca viaja sin su procedencia** (ADR-31): la etiqueta
 * —«Rango observado» con su fecha, o «Suelo del convenio»— va pegada a la
 * cifra, no en otra sección.
 */
export function MarketProfile({
  opportunity,
  place,
  sector,
}: {
  opportunity: Opportunity;
  /** Nombre traducido del país, el mismo que usa el `h1` de la landing. */
  place: string;
  /** Nombre traducido del sector, el del catálogo. */
  sector: string;
}) {
  const t = useTranslations('Opportunities');
  const tJobs = useTranslations('Jobs');
  const format = useFormatter();

  const profile = `profiles.${opportunity.sector}`;
  const cities = t(`${profile}.cities`);
  const salary = formatMarketSalaryParts(opportunity, t, tJobs, format);
  const hours = opportunity.weeklyHours;

  const money = (value: number) =>
    format.number(value, {
      style: 'currency',
      currency: AGREEMENT_FLOOR.currency,
      maximumFractionDigits: 2,
    });

  const facts: { key: string; label: string; value: string }[] = [
    {
      key: 'hours',
      label: t('facts.weeklyHoursLabel'),
      value: !hours
        ? t('facts.unknown')
        : hours.min === hours.max
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
      // `null` significa «no lo sabemos», **no** «no hace falta alemán», y
      // callarlo dejaría que se lea lo segundo.
      value: opportunity.germanLevel
        ? t('facts.languageLevel', {
            level: opportunity.germanLevel.toUpperCase(),
          })
        : t('facts.unknown'),
    },
    {
      key: 'housing',
      label: t('facts.housingLabel'),
      value:
        opportunity.housing === 'sometimes'
          ? t('facts.perkSometimes')
          : t('facts.perkUndocumented'),
    },
    {
      key: 'transport',
      label: t('facts.transportLabel'),
      value:
        opportunity.transport === 'sometimes'
          ? t('facts.perkSometimes')
          : t('facts.perkUndocumented'),
    },
    cities && {
      key: 'cities',
      label: t('facts.citiesLabel'),
      value: cities,
    },
  ].filter(Boolean) as { key: string; label: string; value: string }[];

  // El suelo del convenio y la fecha de consulta del informe se interpolan en
  // las líneas de `conditions`. Viven en constantes y no dentro del texto
  // traducido: escritos en el copy, la cifra caduca sin que nadie se entere.
  const conditionValues = {
    floor: money(AGREEMENT_FLOOR.amount),
    floorDate: format.dateTime(new Date(AGREEMENT_FLOOR.since), {
      dateStyle: 'long',
    }),
    date: format.dateTime(new Date(OPPORTUNITY_SOURCE_DATE), {
      dateStyle: 'long',
    }),
  };

  const sections = (['tasks', 'requirements', 'conditions'] as const).map(
    (key) => ({
      key,
      items: (t.raw(`${profile}.${key}`) as string[]).map((line) =>
        fill(line, conditionValues),
      ),
    }),
  );

  return (
    <section
      id="market-profile"
      aria-labelledby="market-profile-title"
      className="flex scroll-mt-24 flex-col gap-6 border-t pt-8 sm:pt-10"
    >
      <header className="flex flex-col gap-2">
        <p className="type-eyebrow">{t('eyebrow')}</p>
        <h2 id="market-profile-title" className="type-h2">
          {t('market.title', { sector, place })}
        </h2>
        {/* La línea que sostiene la diferencia. No es letra pequeña: va al
            mismo cuerpo que el resto y antes del primer dato. */}
        <p className="type-body font-medium text-foreground">{t('notJobs')}</p>
      </header>

      <div className="surface-offer flex flex-col bg-card">
        <div className="flex flex-col gap-1 p-4 sm:p-5">
          <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
            <span className="type-figure">{salary.figure}</span>
            <span className="type-meta text-muted-foreground">
              {salary.per}
            </span>
          </p>
          {/* ADR-31: la cifra nunca viaja sin decir de dónde sale. */}
          <p className="type-caption text-muted-foreground">
            {opportunity.salary.basis === 'observed'
              ? t('facts.basisObserved', { date: conditionValues.date })
              : t('facts.basisAgreement')}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t px-4 py-3 sm:grid-cols-3 sm:px-5">
          {facts.map((fact) => (
            <div key={fact.key} className="flex flex-col gap-1">
              <dt className="fact-label">{fact.label}</dt>
              <dd className="fact-value">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="type-h3">{t('market.sections.intro')}</h3>
        <p className="type-body text-muted-foreground">
          {t(`${profile}.intro`)}
        </p>
      </div>

      {sections.map((section) => (
        <div key={section.key} className="flex flex-col gap-2">
          <h3 className="type-h3">{t(`market.sections.${section.key}`)}</h3>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 type-body text-muted-foreground">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}

      <AgreementFloor />
    </section>
  );
}

/**
 * Sustituye `{clave}` en una línea de copy.
 *
 * Hace falta porque `tasks`, `requirements` y `conditions` son **listas**, y de
 * una lista next-intl devuelve el valor crudo: `t.raw` no interpola.
 */
function fill(line: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    line,
  );
}
