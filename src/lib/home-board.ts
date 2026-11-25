import 'server-only';

import { getFormatter, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import type { JobSummary } from '@/lib/jobs';
import { listPublishedJobs } from '@/lib/jobs';
import {
  listOpportunities,
  OPPORTUNITY_SOURCE_DATE,
  opportunityHref,
  type Opportunity,
} from '@/lib/opportunities';
import { getHomeTranslations } from '@/lib/home';
import type { Href } from '@/lib/seo';

/**
 * Las filas del panel de ofertas de la home, y el billete del hero.
 *
 * Mezcla dos cosas que NO son lo mismo y lo dice en cada fila (ADR-30):
 *
 * - **Vacantes reales** (`jobs`), publicadas por una ETT. Llevan ciudad,
 *   fecha de inicio y botón «Ver oferta».
 * - **Perfiles de mercado**, que resumen ofertas analizadas y no son
 *   vacantes. Llevan el rótulo «Perfil de mercado», sin fecha, y «Ver perfil».
 *
 * Las vacantes van primero. Mientras no haya ninguna, el panel enseña solo
 * los perfiles, con el mismo aspecto pero sin prometer nada que no existe.
 */

export type IncludeIcon = 'housing' | 'transport' | 'language' | 'shift';

export type OfferView = {
  key: string;
  kind: 'job' | 'profile';
  href: Href;
  /** Tres letras para las fichas del panel: ciudad (vacante) o sector (perfil). */
  code: string;
  place: string;
  title: string;
  sub: string;
  /** Rótulo corto de arriba del billete: el sector. */
  tag: string;
  includes: { label: string; icon: IncludeIcon; highlight: boolean }[];
  /** Cifra principal del sueldo por hora («15,69») y el resto («–17,50»). */
  salaryMain: string;
  salaryRest: string;
  salaryNote: string;
  start: string;
  startNote: string | null;
};

function code3(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase();
}

export async function getHomeBoard(locale: Locale): Promise<{
  offers: OfferView[];
  hasJobs: boolean;
  jobCities: { city: string; count: number }[];
  sourceDate: string;
}> {
  const [jobs, opportunities, t, tJobs, tOpp, format] = await Promise.all([
    listPublishedJobs(locale),
    listOpportunities(locale),
    getHomeTranslations(locale),
    getTranslations({ locale, namespace: 'Jobs' }),
    getTranslations({ locale, namespace: 'Opportunities' }),
    getFormatter({ locale }),
  ]);

  const num = (value: number) =>
    format.number(value, {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    });

  const fromJob = (job: JobSummary): OfferView => {
    const includes: OfferView['includes'] = [];
    if (job.housingProvided) {
      includes.push({
        icon: 'housing',
        highlight: true,
        label:
          job.housingPrice !== null
            ? t('board.housingPrice', { price: num(job.housingPrice) })
            : t('board.housing'),
      });
    }
    if (job.transportProvided) {
      includes.push({
        icon: 'transport',
        highlight: false,
        label: t('board.transport'),
      });
    }
    if (job.requiredLanguageCode && job.requiredLanguageLevel) {
      const level = job.requiredLanguageLevel.toUpperCase();
      includes.push({
        icon: 'language',
        highlight: false,
        label:
          job.requiredLanguageCode === 'de'
            ? t('board.german', { level })
            : t('board.english', { level }),
      });
    }

    const hourly = job.salaryPeriod === 'hour' && job.salaryMin !== null;

    return {
      key: `job-${job.id}`,
      kind: 'job',
      href: { pathname: '/jobs/[slug]', params: { slug: job.slug } } as Href,
      code: code3(job.city ?? job.countryName),
      place: job.city ?? job.countryName,
      title: job.title,
      sub: job.sectorName,
      tag: job.sectorName,
      includes: includes.slice(0, 3),
      salaryMain: hourly ? num(job.salaryMin as number) : '—',
      salaryRest:
        hourly && job.salaryMax !== null && job.salaryMax !== job.salaryMin
          ? `–${num(job.salaryMax)}`
          : '',
      salaryNote:
        job.weeklyHours !== null
          ? t('board.weekly', { hours: String(job.weeklyHours) })
          : '',
      start: job.startDate
        ? format.dateTime(new Date(job.startDate), {
            day: 'numeric',
            month: 'short',
          })
        : t('ticket.noDate'),
      startNote: null,
    };
  };

  const fromProfile = (opportunity: Opportunity): OfferView => {
    const copy = (key: string) => tOpp(`profiles.${opportunity.sector}.${key}`);
    const includes: OfferView['includes'] = [];
    if (opportunity.housing === 'sometimes') {
      includes.push({
        icon: 'housing',
        highlight: true,
        label: t('board.housingSometimes'),
      });
    }
    if (opportunity.transport === 'sometimes') {
      includes.push({
        icon: 'transport',
        highlight: false,
        label: t('board.transportSometimes'),
      });
    }
    if (opportunity.germanLevel) {
      includes.push({
        icon: 'language',
        highlight: false,
        label: t('board.german', {
          level: opportunity.germanLevel.toUpperCase(),
        }),
      });
    } else if (opportunity.shifts[0]) {
      includes.push({
        icon: 'shift',
        highlight: false,
        label: tJobs(`shifts.${opportunity.shifts[0]}`),
      });
    }

    const { salary } = opportunity;

    return {
      key: `profile-${opportunity.sector}`,
      kind: 'profile',
      href: opportunityHref(opportunity)(locale),
      code: code3(opportunity.sectorName),
      place: copy('region'),
      title: copy('title'),
      sub: copy('cities').trim()
        ? t('board.profileSub', { cities: copy('cities') })
        : t('ticket.profile'),
      tag: opportunity.sectorName,
      includes: includes.slice(0, 2),
      salaryMain:
        salary.max === null
          ? `${t('ticket.from')} ${num(salary.min)}`
          : num(salary.min),
      salaryRest: salary.max === null ? '' : `–${num(salary.max)}`,
      salaryNote:
        salary.basis === 'observed'
          ? t('board.observed')
          : t('board.agreement'),
      start: t('ticket.noDate'),
      startNote: t('ticket.profile'),
    };
  };

  const counts = new Map<string, number>();
  for (const job of jobs) {
    if (job.city) counts.set(job.city, (counts.get(job.city) ?? 0) + 1);
  }

  return {
    offers: [...jobs.map(fromJob), ...opportunities.map(fromProfile)],
    hasJobs: jobs.length > 0,
    jobCities: [...counts.entries()]
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
    sourceDate: format.dateTime(new Date(OPPORTUNITY_SOURCE_DATE), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };
}
