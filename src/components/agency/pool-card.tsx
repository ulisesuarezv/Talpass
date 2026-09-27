import { Stamps } from '@/components/agency/stamps';
import { formatActivity, formatExperience } from '@/components/agency/format';
import { Link } from '@/i18n/navigation';
import type { PoolCandidate } from '@/lib/agency/pool';
import type { AgencyTranslator } from '@/lib/agency/translations';

/**
 * Una fila de la bolsa. Lo que va aquí es lo que una ETT mira para decidir si
 * abre la ficha: quién es (nombre de pila, edad, dónde vive), qué sabe hacer
 * (sectores con su tiempo), si se entiende con él (inglés) y qué está
 * comprobado (sellos). Lo que necesita —alojamiento, transporte— va al final,
 * porque condiciona la oferta y no el interés.
 */
export function PoolCard({
  candidate,
  t,
  countryName,
  sectorName,
}: {
  candidate: PoolCandidate;
  t: AgencyTranslator;
  countryName: (code: string | null) => string | null;
  sectorName: (slug: string) => string;
}) {
  const place = [candidate.city, countryName(candidate.countryCode)]
    .filter(Boolean)
    .join(', ');
  const activity = formatActivity(t, candidate.lastActivityAt);

  return (
    <article className="surface-offer gap-3 bg-card p-4 sm:p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="type-h3">
          <Link
            href={{
              pathname: '/agency/candidates/[candidateId]',
              params: { candidateId: candidate.id },
            }}
            className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
          >
            {candidate.displayName}
          </Link>
        </h2>
        {activity ? (
          <span className="type-caption text-muted-foreground">{activity}</span>
        ) : null}
      </header>

      <p className="type-meta text-muted-foreground">
        {[
          candidate.age != null ? t('card.age', { age: candidate.age }) : null,
          place || null,
          candidate.englishLevel
            ? t('englishLevel', {
                level: t(`levels.${candidate.englishLevel}`),
              })
            : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>

      {candidate.sectors.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {candidate.sectors.map((sector) => (
            <li
              key={sector.slug}
              className="rounded-full bg-brand-soft px-2.5 py-0.5 type-caption text-foreground"
            >
              {sectorName(sector.slug)} · {formatExperience(t, sector.months)}
            </li>
          ))}
        </ul>
      ) : null}

      <Stamps stamps={candidate.stamps} t={t} compact />

      {candidate.needsHousing || candidate.needsTransport ? (
        <p className="type-caption text-muted-foreground">
          {[
            candidate.needsHousing ? t('card.needsHousing') : null,
            candidate.needsTransport ? t('card.needsTransport') : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      ) : null}
    </article>
  );
}
