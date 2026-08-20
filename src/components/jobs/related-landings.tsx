import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { JobSummary } from '@/lib/jobs';

/**
 * El enlace de vuelta vacante → landing (ADR-23).
 *
 * Sin esto las landings serían callejones sin salida y el enlazado interno solo
 * iría en un sentido, que es la mitad de lo que hace funcionar a un job board.
 * Todas las landings enlazadas existen por construcción: se derivan de las
 * vacantes publicadas, y esta vacante es una de ellas.
 */
export function RelatedLandings({
  job,
  locale,
}: {
  job: JobSummary;
  locale: Locale;
}) {
  const t = useTranslations('Jobs');

  return (
    <nav aria-label={t('related.title')} className="flex flex-col gap-3">
      <h2 className="type-h4">{t('related.title')}</h2>

      <ul className="flex flex-wrap gap-2">
        <li>
          <Badge asChild variant="outline">
            <Link
              href={{
                pathname: '/work/[country]',
                params: { country: job.countrySlugs[locale] },
              }}
            >
              {t('related.country', { country: job.countryName })}
            </Link>
          </Badge>
        </li>

        <li>
          <Badge asChild variant="outline">
            <Link
              href={{
                pathname: '/work/[country]/[sector]',
                params: {
                  country: job.countrySlugs[locale],
                  sector: job.sectorSlugs[locale],
                },
              }}
            >
              {t('related.sector', {
                sector: job.sectorName,
                country: job.countryName,
              })}
            </Link>
          </Badge>
        </li>

        {job.citySlug ? (
          <li>
            <Badge asChild variant="outline">
              <Link
                href={{
                  pathname: '/work/city/[city]',
                  params: { city: job.citySlug },
                }}
              >
                {t('related.city', { city: job.city ?? job.citySlug })}
              </Link>
            </Badge>
          </li>
        ) : null}

        {job.housingProvided ? (
          <li>
            <Badge asChild variant="outline">
              <Link
                href={{
                  pathname: '/work/[country]/with-housing',
                  params: { country: job.countrySlugs[locale] },
                }}
              >
                {t('related.housing', { country: job.countryName })}
              </Link>
            </Badge>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
