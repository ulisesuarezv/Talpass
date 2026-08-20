import { useFormatter, useTranslations } from 'next-intl';

import { formatSalary } from '@/components/jobs/format-salary';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import type { JobSummary } from '@/lib/jobs';

/**
 * Tarjeta de vacante del listado y de las landings.
 *
 * Sin `'use client'`: se renderiza en servidor desde las landings y entra en el
 * paquete del navegador cuando la usa el filtro. `useTranslations` y
 * `useFormatter` de next-intl funcionan en los dos sitios, así que no hace
 * falta una versión por cada uno.
 */
export function JobCard({ job }: { job: JobSummary }) {
  const t = useTranslations('Jobs');
  const format = useFormatter();

  const place = [job.city, job.countryName].filter(Boolean).join(', ');

  const salary = formatSalary(job, t, format);

  return (
    <article className="relative rounded-lg border p-4 transition-colors hover:bg-muted/40">
      <h3 className="type-h3">
        <Link
          href={{ pathname: '/jobs/[slug]', params: { slug: job.slug } }}
          className="after:absolute after:inset-0 focus-visible:underline"
        >
          {job.title}
        </Link>
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">
        {place} · {job.sectorName}
      </p>

      {salary ? <p className="mt-2 text-sm font-medium">{salary}</p> : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.housingProvided ? (
          <Badge variant="secondary">{t('facts.housing')}</Badge>
        ) : null}
        {job.transportProvided ? (
          <Badge variant="secondary">{t('facts.transport')}</Badge>
        ) : null}
        {job.requiresDrivingLicense ? (
          <Badge variant="outline">{t('facts.drivingLicense')}</Badge>
        ) : null}
        {job.shifts.map((shift) => (
          <Badge key={shift} variant="outline">
            {t(`shifts.${shift}`)}
          </Badge>
        ))}
      </div>
    </article>
  );
}
