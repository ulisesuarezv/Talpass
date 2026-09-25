import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { JobBrowser } from '@/components/jobs/job-browser';
import { SignupCta } from '@/components/jobs/signup-cta';
import { AgreementFloor } from '@/components/opportunities/agreement-floor';
import { OpportunityCard } from '@/components/opportunities/opportunity-card';
import type { Locale } from '@/i18n/routing';
import { listCountries, listLanguages, listSectors } from '@/lib/catalogs';
import { listPublishedJobs } from '@/lib/jobs';
import { listOpportunities } from '@/lib/opportunities';
import { seoMetadata } from '@/lib/seo';

/**
 * Listado público de vacantes **y** de perfiles de mercado (ADR-49).
 *
 * Estática y revalidada cada hora. No lee sesión, ni cookies, ni
 * `searchParams`: el filtrado ocurre en cliente sobre las vacantes que ya vienen
 * en el HTML (ver `JobBrowser`). Cualquiera de esas tres cosas la volvería
 * dinámica y la sacaría del CDN, que es donde vive el SEO (ADR-11, ADR-13).
 *
 * 🔴 **Esta página contiene dos cosas que NO son lo mismo, y desde ADR-49 lo
 * único que las separa es el rótulo y el marcado.** Arriba, las vacantes
 * reales: tienen empresa, fecha y botón de aplicar, y son las únicas que emiten
 * `JobPosting`. Abajo, los cinco perfiles de mercado de ADR-30: describen lo
 * que se paga en un sector, **no existen como puesto**, no prometen empresa ni
 * fecha, no se puede aplicar a ellos y **no emiten ni una línea de
 * `JobPosting`**. Hasta hoy vivían en `/oportunidades` y confundirlos era
 * imposible por construcción; ahora la garantía la sostienen el orden, los dos
 * encabezados y la ausencia de marcado. Quien toque esta página tiene que leer
 * ADR-49 antes: meter un perfil en la rejilla de vacantes, o emitir
 * `JobPosting` sobre él, es exactamente el fallo del que depende toda la
 * estrategia de SEO del proyecto.
 *
 * ⚠️ **Y el 2026-09-26 esa garantía perdió una de sus tres patas.** Ulises
 * hizo retirar de esta página el rótulo «Perfiles de mercado», el encabezado
 * «Qué se paga de verdad en Alemania» y la línea «esto no son vacantes», por
 * repetitivos. Quedan en pie las otras dos —cero `JobPosting` y ningún botón
 * de aplicar— y el estado vacío que las acompañaba también se fue, así que
 * **hoy nada en el texto de esta página dice que estas cinco tarjetas no son
 * ofertas de una empresa**. Lo que lo diga tiene que volver por algún lado
 * cuando entre el aviso de «pronto habrá más ofertas»; hasta entonces, es
 * deuda conocida y aceptada, no un descuido.
 */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Jobs' });

  // Indexable siempre, y eso CAMBIÓ con ADR-49.
  //
  // El `noindex` de la fase 4b no era una política, era un hecho: sin vacantes,
  // esta página no tenía nada que leer, y una página delgada en el índice
  // cuesta rastreo. Desde que los cinco perfiles de mercado viven aquí, la
  // página tiene contenido con o sin vacantes —cifras fechadas, jornada,
  // turnos, nivel de idioma y el suelo del convenio—, que es justo lo que le
  // faltaba. Mantener el `noindex` ahora sacaría del índice el único contenido
  // de mercado que le queda al sitio, porque las diez fichas que lo sostenían
  // se han retirado.
  return seoMetadata({
    locale,
    href: '/jobs',
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

export default async function JobsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Jobs');
  // El copy de los perfiles sigue en su namespace, que es donde está el de las
  // cinco tarjetas: la sección cambió de página, no de contenido.
  const tMarket = await getTranslations('Opportunities');

  const [jobs, countries, sectors, languages, opportunities] =
    await Promise.all([
      listPublishedJobs(locale),
      listCountries(locale),
      listSectors(locale),
      listLanguages(locale),
      listOpportunities(locale),
    ]);

  // Las opciones salen de los catálogos (ADR-07), pero se quedan solo las que
  // alguna vacante usa: un filtro que solo sabe devolver cero resultados es
  // peor que no ofrecerlo.
  const usedCountries = new Set(jobs.map((job) => job.countryCode));
  const usedSectors = new Set(jobs.map((job) => job.sectorId));
  const usedLanguages = new Set(
    jobs.map((job) => job.requiredLanguageCode).filter(Boolean),
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="type-h1">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>

        {/*
          El aviso de que esto se está llenando.
          
          🔴 **No dice «los primeros acuerdos», y es deliberado**: Ulises lo
          corrigió el 2026-09-26 porque esa palabra insinúa que no hay ninguno
          cerrado. La frase habla del trabajo en curso sin afirmar ni negar
          cuántos hay, que es lo que se puede sostener. No la conviertas en un
          número, ni en una fecha, ni en «el primer/único» (ADR-44).

          Va solo mientras la página no tenga vacantes: con ellas, el aviso
          sobra porque lo dice la propia lista. Sin caja y sin franja de estado
          a propósito: una insignia de «en proceso» que diga lo mismo dentro de
          tres meses juega en contra.
        */}
        {jobs.length === 0 ? (
          <p className="type-body font-medium text-foreground">
            {t('upcoming')}
          </p>
        ) : null}
      </header>

      {jobs.length > 0 ? (
        /*
          Sin `Suspense` y sin `useSearchParams` dentro: `JobBrowser` es cliente,
          pero se prerenderiza aquí con todas las vacantes, así que salen en el
          HTML estático. Ver el comentario de ese fichero — es la diferencia entre
          una página que el rastreador lee y una que solo existe si se ejecuta el
          JavaScript.
        */
        <JobBrowser
          jobs={jobs}
          countries={countries.filter((c) => usedCountries.has(c.id))}
          sectors={sectors.filter((s) => usedSectors.has(s.id))}
          languages={languages.filter((l) => usedLanguages.has(l.id))}
        />
      ) : null}

      {/*
        Los perfiles de mercado (ADR-30), que hasta ADR-49 vivían en
        `/oportunidades`.

        Van DEBAJO de las vacantes y en su propia sección, con antetítulo,
        encabezado y una línea que dice qué son y qué no. Ese orden y ese rótulo
        son ahora la separación entera: si mañana hay vacantes reales, siguen
        arriba en su rejilla y estos siguen aquí abajo, nunca mezclados en la
        misma lista. Sin `JobPosting`, sin empresa, sin fecha y sin botón de
        aplicar — se comprueba en el HTML servido, no en el código (ADR-30).
      */}
      <section
        id="market-profiles"
        aria-label={tMarket('eyebrow')}
        className="flex scroll-mt-24 flex-col gap-6"
      >
        {/* Un pelo más de aire entre tarjetas que antes: desde el rediseño del
            2026-09-25 cada una termina en su rejilla de datos con una línea
            encima, y a 12 px esa línea se confundía con la separación. */}
        <ul className="flex flex-col gap-4">
          {opportunities.map((opportunity) => (
            <li key={opportunity.sector}>
              <OpportunityCard opportunity={opportunity} />
            </li>
          ))}
        </ul>

        <AgreementFloor />
      </section>

      {/* Con vacantes se aplica; sin ellas no hay a dónde aplicar todavía, y
          prometerlo sería mentir en una de las dos situaciones. */}
      <SignupCta variant={jobs.length > 0 ? 'jobs' : 'opportunities'} />
    </div>
  );
}
