import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { controller } from '@/config/controller';
import { legalLink } from '@/config/legal';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getHomeTranslations } from '@/lib/home';
import { listPublishedJobs } from '@/lib/jobs';
import { seoMetadata } from '@/lib/seo';

/**
 * Home pública.
 *
 * Estática y revalidada cada hora, como el resto de `(public)`: no lee sesión,
 * ni cookies, ni `searchParams` (ADR-11, ADR-13). La única lectura es la de
 * vacantes publicadas, que va por `lib/supabase/public` y no toca cookies.
 *
 * **Por qué la home consulta vacantes (fase C1, ADR-35).** Lo que la home dice
 * sobre el estado del proyecto —«hoy no hay ninguna vacante publicada»— y a
 * dónde apunta su botón principal dependen de un hecho que cambia solo el día
 * que una ETT publique. Escribirlo en el copy lo convertiría en una frase que
 * envejece mal sin que nadie se entere; la condición es el contenido, no una
 * bandera, igual que en `jobs/page.tsx` con el `noindex`.
 */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return seoMetadata({
    locale,
    href: '/',
    title: t('title', { brand: siteConfig.name }),
    description: t('description'),
  });
}

/** Los cuatro pasos, en el orden en que le ocurren al candidato. */
const HOW_STEPS = ['account', 'documents', 'pool', 'consent'] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, jobs] = await Promise.all([
    getHomeTranslations(locale),
    listPublishedJobs(locale),
  ]);

  const brand = siteConfig.name;
  const hasJobs = jobs.length > 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-12 px-4 py-12 sm:py-20">
      <section className="flex flex-col gap-6">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          {t('eyebrow')}
        </p>

        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          {t('title')}
        </h1>

        <p className="text-base text-pretty text-muted-foreground sm:text-lg">
          {t('subtitle', { brand })}
        </p>

        {/*
          La jerarquía de los CTA la decide el contenido, no el gusto (ADR-36).
          Mientras no haya vacantes, el botón principal lleva a los perfiles de
          mercado —que sí tienen cifras, fuente y fecha— y no a un listado que
          solo sabe decir que está vacío. El día que haya una vacante, el
          primario pasa a ser el listado sin que nadie tenga que acordarse.
        */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={hasJobs ? '/jobs' : '/opportunities'}>
              {hasJobs ? t('ctaJobs') : t('ctaOpportunities')}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/signup">{t('ctaSignup')}</Link>
          </Button>
        </div>

        <p className="border-t pt-6 text-sm text-muted-foreground">
          {t('note')}
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {t('how.title')}
        </h2>
        <ol className="flex flex-col gap-4">
          {HOW_STEPS.map((step, index) => (
            <li key={step} className="flex flex-col gap-1">
              <h3 className="font-medium">
                {index + 1}. {t(`how.steps.${step}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(`how.steps.${step}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/*
        El argumento de confianza más fuerte que tiene el proyecto estaba
        enterrado en un documento legal. Aquí va resumido y enlazado al texto
        completo, no duplicado: el que manda es `/legal/datos-y-agencias`.
      */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {t('privacy.title')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('privacy.intro')}</p>

        <div className="flex flex-col gap-6 rounded-lg border bg-muted/40 p-5 sm:flex-row sm:gap-8">
          <div className="flex flex-1 flex-col gap-2">
            <h3 className="text-sm font-semibold">{t('privacy.seesTitle')}</h3>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
              {(t.raw('privacy.sees') as string[]).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <h3 className="text-sm font-semibold">{t('privacy.neverTitle')}</h3>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
              {(t.raw('privacy.never') as string[]).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {t('privacy.nothingAsked', { brand })}
        </p>

        <p className="text-sm">
          <Link
            href={legalLink('data_sharing', locale)}
            className="underline underline-offset-4"
          >
            {t('privacy.link')}
          </Link>
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {t('cost.title')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('cost.body')}</p>
        <p className="text-sm text-muted-foreground">
          {t('cost.who', { brand })}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {t('status.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {hasJobs
            ? t('status.open', { brand, count: jobs.length })
            : t('status.empty', { brand })}
        </p>
        <p className="text-sm text-muted-foreground">{t('status.meanwhile')}</p>
        {/*
          El enlace al listado de vacantes solo aparece cuando hay alguna.
          Invitar a ver «las ofertas publicadas» en el párrafo que acaba de
          decir que no hay ninguna es la contradicción que esta fase viene a
          quitar, no una que valga la pena añadir.
        */}
        <p className="flex flex-col gap-2 text-sm sm:flex-row sm:gap-5">
          <Link href="/opportunities" className="underline underline-offset-4">
            {t('status.opportunitiesLink')}
          </Link>
          {hasJobs ? (
            <Link href="/jobs" className="underline underline-offset-4">
              {t('status.jobsLink')}
            </Link>
          ) : null}
        </p>
      </section>

      {/* El Impressum, también desde la home y no solo desde el pie: es la
          prueba de existencia más barata que puede dar un proyecto nuevo, y
          quien se plantea subir su DNI a un dominio que no conoce la busca
          antes de bajar hasta el final de la página. El nombre y la ciudad
          salen de `config/controller`, no del copy (ADR-12). */}
      <section className="flex flex-col gap-3 border-t pt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {t('behind.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('behind.body', {
            brand,
            name: controller.name,
            city: controller.address.city,
          })}
        </p>
        <p className="text-sm text-muted-foreground">{t('behind.detail')}</p>
        <p className="text-sm">
          <Link
            href={legalLink('impressum', locale)}
            className="underline underline-offset-4"
          >
            {t('behind.link')}
          </Link>
        </p>
      </section>
    </div>
  );
}
