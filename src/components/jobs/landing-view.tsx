import { getTranslations } from 'next-intl/server';

import { JobCard } from '@/components/jobs/job-card';
import { SignupCta } from '@/components/jobs/signup-cta';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { JobSummary } from '@/lib/jobs';
import { listLandings, type Landing } from '@/lib/landings';

/**
 * Cuerpo común de las cuatro landings programáticas (ADR-23).
 *
 * Una landing es: un `h1` que dice exactamente lo que se buscó, las vacantes
 * que la sostienen —enlazadas— y enlaces a las landings vecinas. Ese último
 * bloque es el que convierte una colección de páginas sueltas en una red
 * navegable, tanto para el candidato como para el rastreador.
 */
export async function LandingView({
  landing,
  jobs,
  locale,
}: {
  landing: Landing;
  jobs: JobSummary[];
  locale: Locale;
}) {
  const t = await getTranslations('Landing');

  const values = {
    place: landing.placeByLocale[locale],
    sector: landing.sectorByLocale?.[locale] ?? '',
  };

  const siblings = await relatedLandings(landing, locale);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {t(`${landing.kind}.title`, values)}
        </h1>
        <p className="text-muted-foreground">
          {t(`${landing.kind}.intro`, { ...values, count: jobs.length })}
        </p>
      </header>

      <div className="grid gap-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      <SignupCta />

      {siblings.length > 0 ? (
        <>
          <Separator />
          <nav aria-label={t('related')} className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">{t('related')}</h2>
            <ul className="flex flex-wrap gap-2">
              {siblings.map((sibling) => (
                <li key={key(sibling, locale)}>
                  <Badge asChild variant="outline">
                    <Link
                      href={
                        {
                          pathname: sibling.pathname,
                          params: sibling.paramsByLocale[locale],
                          // `Landing.pathname` es una unión de rutas y sus
                          // params van en un objeto genérico; el `Link` de
                          // next-intl los empareja uno a uno y no acepta la
                          // unión entera.
                        } as never
                      }
                    >
                      {t(`${sibling.kind}.link`, {
                        place: sibling.placeByLocale[locale],
                        sector: sibling.sectorByLocale?.[locale] ?? '',
                      })}
                    </Link>
                  </Badge>
                </li>
              ))}
            </ul>
          </nav>
        </>
      ) : null}
    </div>
  );
}

function key(landing: Landing, locale: Locale): string {
  return `${landing.kind}:${Object.values(landing.paramsByLocale[locale]).join('/')}`;
}

/**
 * Vecinas de una landing: las que comparten país, más el país mismo. La ciudad
 * es la excepción — sus vecinas son las del país de sus vacantes, que es la
 * ampliación natural de "no hay nada en Berlín, ¿y en Alemania?".
 */
async function relatedLandings(
  landing: Landing,
  locale: Locale,
): Promise<Landing[]> {
  const all = await listLandings();
  const self = key(landing, locale);

  const country =
    landing.kind === 'city'
      ? landing.jobs[0]?.countrySlugs[locale]
      : landing.paramsByLocale[locale].country;

  return all.filter((candidate) => {
    if (key(candidate, locale) === self) return false;

    if (candidate.kind === 'city') {
      return candidate.jobs[0]?.countrySlugs[locale] === country;
    }

    return candidate.paramsByLocale[locale].country === country;
  });
}
