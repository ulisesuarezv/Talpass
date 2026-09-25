import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import {
  ArrowRight,
  ChevronDown,
  FileCheck,
  Handshake,
  House,
  IdCard,
  Languages,
  Lock,
  Sparkles,
  UserPlus,
  Zap,
} from 'lucide-react';

import { HomeMotion } from '@/components/home/home-motion';
import { OpportunityCard } from '@/components/opportunities/opportunity-card';
import { Button } from '@/components/ui/button';
import { legalLink } from '@/config/legal';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getHomeTranslations } from '@/lib/home';
import { listOpportunities } from '@/lib/opportunities';
import { seoMetadata } from '@/lib/seo';

/**
 * Home pública.
 *
 * Estática y revalidada cada hora, como el resto de `(public)`: no lee sesión,
 * ni cookies, ni `searchParams` (ADR-11, ADR-13). La única lectura es la de los
 * catálogos que resuelven los perfiles de mercado, y no toca cookies.
 *
 * **Ya no consulta vacantes, y eso cambió con ADR-49.** Lo hacía por ADR-35: el
 * botón principal tenía que llevar a lo que tuviera contenido, y con cero
 * vacantes eso era `/oportunidades`. Ahora los perfiles viven dentro de
 * `/ofertas`, así que ese listado tiene contenido siempre y el destino no
 * depende de ningún hecho que consultar. El criterio de ADR-36 sigue vivo —el
 * botón más llamativo lleva a lo que tiene contenido—, lo que desapareció es la
 * bifurcación.
 *
 * **Por qué vive en `(home)` y no en `(public)` (ADR-46).** El `loading.tsx` de
 * `(public)` abre una frontera de `Suspense`, y en el HTML estático eso se sirve
 * como esqueleto seguido del contenido oculto y un script que los intercambia.
 * Con la home Indeed-first el documento pasó a 126 KB: el esqueleto llegaba a
 * pintarse, el intercambio empujaba el pie fuera de la pantalla, y Lighthouse
 * medía un CLS de 0,24 en dos de tres pasadas. Aquí no hay `loading.tsx`, así
 * que no hay nada que intercambiar.
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

/** Los cuatro pasos de «Cómo funciona», en el orden en que le ocurren al candidato. */

/**
 * Los ganchos del hero: solo los dos que caben en una etiqueta sin perder
 * matiz. El copy y su riesgo asumido están en ADR-45.
 */
const HERO_TAGS = [
  { key: 'eu', Icon: IdCard },
  { key: 'english', Icon: Languages },
] as const;

/**
 * Los puntos fuertes que necesitan una frase entera (ADR-45). Salieron del
 * hero en la iteración 2 porque, como etiquetas, formaban un muro de cuatro
 * filas; aquí se leen de un vistazo y conservan el «en la mayoría» y el «hay
 * ofertas que», que son lo que los hace defendibles.
 */
const PERKS = [
  { key: 'housing', Icon: House },
  { key: 'speed', Icon: Zap },
  { key: 'experience', Icon: Sparkles },
] as const;

/**
 * Los anchos de las barras de tachado de la ficha de privacidad. Irregulares a
 * propósito: un bloque redactado no tiene todas las líneas del mismo largo, y
 * tres barras idénticas se leen como una barra de progreso. Son decorativas
 * (`aria-hidden`); el texto de cada fila lo pone `privacy.blocked`.
 */
const REDACTED = ['w-24 sm:w-32', 'w-16 sm:w-24', 'w-28 sm:w-40'] as const;

/**
 * Los cuatro momentos de «No llegas solo», en el orden en que le ocurren al
 * candidato: antes de salir, la llegada, el primer día, el primer cobro. El
 * orden ES el contenido de la sección; no se reordena.
 */
const SUPPORT = ['agent', 'arrival', 'paperwork', 'pay'] as const;

/**
 * Las seis preguntas del FAQ, en el orden que fijó Ulises. `cost` va la
 * primera porque es la que frena a todo el mundo, y `travel` —quién paga el
 * viaje y el alojamiento— va entera y sin suavizar a propósito: es el dato
 * más incómodo de la home.
 */
const FAQ = ['cost', 'who', 'eu', 'travel', 'pay', 'data'] as const;

/** Los tres pasos de la columna derecha del hero (ADR-46). */
const HERO_STEPS = [
  { key: 'signup', Icon: UserPlus },
  { key: 'verify', Icon: FileCheck },
  { key: 'hired', Icon: Handshake },
] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, opportunities] = await Promise.all([
    getHomeTranslations(locale),
    listOpportunities(locale),
  ]);

  const brand = siteConfig.name;

  return (
    <div className="pb-12 sm:pb-16">
      {/*
        La parte de arriba es la del boceto de Ulises (ADR-46): el hero a la
        izquierda, con superficie propia para que no se confunda con una
        sección, y los pasos a la derecha; debajo, las ofertas.

        El espaciado es la escala de `globals.css` (`stack-*`), y su jerarquía es
        lo que agrupa: 8-12 px dentro de un grupo, 20-32 entre grupos, 32-48
        entre bloques. En móvil los pasos se compactan en una fila y la franja
        de ventajas baja detrás de las ofertas (`order-last`), para que el `h2`
        de ofertas y la primera tarjeta asomen en la primera pantalla: es lo
        que invita a hacer scroll, igual que en Indeed. La franja no tiene
        nada enfocable, así que el cambio de orden visual no altera el orden
        de tabulación.
      */}
      <div className="container-page flex flex-col stack-block pt-4 sm:pt-8 lg:pt-12">
        <div className="grid grid-cols-1 stack-group lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-stretch">
          <section className="flex flex-col stack-group surface-hero lg:justify-center">
            <div className="flex flex-col stack-tight">
              <p className="type-eyebrow">{t('eyebrow')}</p>
              <h1 className="type-display">{t('title')}</h1>
              {/* En móvil la entradilla cede su sitio para que las ofertas asomen
                  en la primera pantalla; lo que promete lo desarrolla la franja
                  de ventajas. */}
              <p className="hidden max-w-[38ch] type-lead text-muted-foreground sm:block">
                {t('subtitle')}
              </p>
            </div>

            {/* Las etiquetas bajan de línea, también en móvil. Hasta el
                2026-09-26 iban en una fila que se deslizaba, y con solo dos la
                segunda salía cortada a media palabra («Inglés según la of»)
                de 320 a 414 px: se leía como un fallo, no como un carrusel. La
                fila de más cuesta ~36 px en 375×667 y las ofertas siguen
                asomando (medido tras el cambio). */}
            <ul aria-label={t('tagsLabel')} className="flex flex-wrap gap-2">
              {HERO_TAGS.map(({ key, Icon }) => (
                <li
                  key={key}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-hero-foreground/6 px-3 py-1 type-meta whitespace-nowrap text-foreground"
                >
                  <Icon
                    aria-hidden
                    className="size-4 shrink-0 text-brand-strong"
                  />
                  {t(`tags.${key}`)}
                </li>
              ))}
            </ul>

            {/*
              La jerarquía de los CTA la decide el contenido, no el gusto (ADR-36),
              y desde ADR-49 ese criterio ya no necesita preguntar nada: los
              perfiles de mercado viven DENTRO de `/ofertas`, así que ese listado
              tiene contenido haya vacantes o no. Antes el botón principal
              apuntaba a `/oportunidades` mientras no hubiera ninguna, y la home
              consultaba las vacantes solo para decidirlo.

              En móvil los dos botones pierden 4 px de padding lateral cada uno:
              es lo que hace que «Create my account» quepa al lado del primario a
              375 px. Partidos en dos filas empujaban las ofertas 56 px abajo.
            */}
            {/*
              El CTA principal es el único sitio de la página donde el naranja va
              a pleno: es el punto focal (paleta 2026-09-22). Sobre el petróleo
              da 5,19 como interfaz y la tinta encima 6,30; sobre claro no
              valdría, por eso no es el `--primary` del resto del sitio.
            */}
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-brand-accent px-4 font-semibold text-brand-accent-ink shadow-[0_6px_16px_-8px_color-mix(in_oklch,var(--brand-accent)_70%,transparent)] hover:bg-brand-accent-hover sm:px-5"
              >
                <Link href="/jobs">{t('ctaJobs')}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-hero-foreground/40 bg-transparent px-4 text-hero-foreground hover:border-hero-foreground/70 hover:bg-hero-foreground/10 hover:text-hero-foreground sm:px-5"
              >
                <Link href="/signup">{t('ctaSignup')}</Link>
              </Button>
            </div>
          </section>

          {/*
            Los pasos son un solo panel partido por líneas, no tres tarjetas: son
            una secuencia, y la línea la cuenta mejor que tres cajas sueltas. La
            cabecera y la lista guardan la misma distancia (`stack-group`) que la
            cabecera de ofertas y sus tarjetas.

            En escritorio la columna se alinea con el hero por arriba y por
            abajo: el `lg:pt-12` es el padding de `surface-hero` en `lg`, así que
            «Cómo empiezas» cae en la misma línea que el antetítulo, y el panel
            crece (`flex-1` + `auto-rows-fr`) hasta el borde inferior del hero.
            Si cambia el padding del hero, cambia este.
          */}
          <section
            aria-labelledby="home-steps"
            className="flex flex-col stack-group lg:pt-12"
          >
            <h2
              id="home-steps"
              className="sr-only lg:not-sr-only lg:type-h4 lg:text-muted-foreground"
            >
              {t('steps.title')}
            </h2>
            <ol className="grid grid-cols-3 divide-x surface-panel lg:flex-1 lg:auto-rows-fr lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
              {HERO_STEPS.map(({ key, Icon }, index) => (
                <li
                  key={key}
                  className="flex flex-col items-center gap-2 pad-tile text-center lg:flex-row lg:items-start lg:gap-4 lg:text-left"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground lg:size-10">
                    <Icon aria-hidden className="size-4 lg:size-5" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[0.9375rem] leading-snug font-semibold text-foreground lg:type-h3">
                      <span className="sr-only lg:not-sr-only">
                        {index + 1}.{' '}
                      </span>
                      {t(`steps.items.${key}.title`)}
                    </h3>
                    <p className="hidden type-body text-muted-foreground lg:block">
                      {t(`steps.items.${key}.body`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/*
          La franja de ventajas: los puntos fuertes que no caben en una etiqueta.
          Sin `h2` a propósito —la home tiene los que tiene (ADR-43)—; la nombra
          el `aria-label`.
        */}
        <section
          aria-label={t('perks.label')}
          className="order-last lg:order-none"
        >
          <ul className="grid divide-y surface-panel lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {PERKS.map(({ key, Icon }) => (
              <li
                key={key}
                data-reveal
                className="flex items-start gap-3 pad-tile"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
                  <Icon aria-hidden className="size-4" />
                </span>
                <p className="self-center type-body text-muted-foreground">
                  <strong className="font-semibold text-foreground">
                    {t(`perks.items.${key}.lead`)}
                  </strong>{' '}
                  {t(`perks.items.${key}.rest`)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/*
          Las ofertas, a todo el ancho. Son los cinco perfiles de mercado con la
          misma tarjeta: no emiten `JobPosting` (ADR-30 sigue intacto). «Ver
          todas» lleva a `/ofertas`, que desde ADR-49 es donde viven —debajo de
          las vacantes reales y con su propio rótulo—.
        */}
        <section
          aria-labelledby="home-offers"
          className="flex flex-col stack-group"
        >
          <div className="flex items-baseline justify-between gap-4">
            {/* En escritorio el `h2` sube dos puntos por encima de `type-h2`:
                con la cifra de la tarjeta destacada a 40 px, el título de la
                sección tiene que seguir mandando sobre ella. En móvil no se
                toca, que es donde cada píxel de alto se paga. */}
            <h2 id="home-offers" className="type-h2 lg:text-[1.75rem]">
              {t('offers.title')}
            </h2>
            <Link
              href="/jobs"
              className="-my-2 inline-flex shrink-0 items-center gap-1 py-2 type-meta font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('offers.seeAll')}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>

          {/*
            Cinco tarjetas en tres columnas dejaban una fila coja y, sobre todo,
            cinco piezas idénticas: nada mandaba sobre nada. La primera pasa a
            ocupar dos columnas con la cifra al doble de tamaño y su resumen, y
            las otras cuatro van en versión `compact`. Así la rejilla se cierra
            sola —2+1 arriba, 3 abajo— sin hueco que rellenar, y el reparto es
            asimétrico a propósito.

            Tres densidades, no dos: la destacada, la que la acompaña en la fila
            de arriba —que lleva resumen y los seis datos, porque si no el
            estirado de la fila le dejaba dentro un agujero de 200 px— y las
            tres de abajo en `compact`.

            El orden lo da `listOpportunities`, que es el de `OPPORTUNITY_PROFILES`:
            la destacada es almacén porque es el perfil con más ofertas en la
            muestra, no porque se esté promocionando nada (ADR-30).
          */}
          <ul className="grid stack-items sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opportunity, index) => (
              /* La destacada mide lo que mide: igualarla a su vecina repartía
                 el sobrante DENTRO de la pieza y abría un agujero entre el
                 resumen y la rejilla de datos. Las demás sí se igualan dentro
                 de su fila (`h-full` en la tarjeta), con los datos al fondo:
                 sin eso, a 768 px quedaba un hueco bajo la más corta. */
              <li
                key={opportunity.sector}
                data-reveal
                className={index === 0 ? 'sm:col-span-2' : undefined}
              >
                <OpportunityCard
                  opportunity={opportunity}
                  variant={index < 2 ? 'default' : 'compact'}
                  featured={index === 0}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/*
        «Cómo funciona» se retiró de la home el 2026-09-25 por decisión de
        Ulises: sus cuatro pasos repetían, más largos, el panel de tres pasos
        que ya va al lado del hero, y la home entraba en la privacidad tras
        hacer leer dos veces lo mismo. El copy se va con él; el recorrido
        completo sigue contado en `/legal/datos-y-agencias`.
      */}
      <div className="container-page mt-8 flex flex-col divide-y sm:mt-12">
        {/*
          El argumento de confianza más fuerte que tiene el proyecto. Aquí va
          resumido y enlazado al texto completo, no duplicado: el que manda es
          `/legal/datos-y-agencias`.

          La composición, y por qué no son dos listas de viñetas (2026-09-25).

          El contenido es una OPOSICIÓN —lo que la agencia ve contra lo que no—,
          y dos columnas de puntos obligan a leer ocho frases para verla. Aquí
          la oposición se enseña en vez de contarse: a la derecha va **la ficha
          que la agencia consulta de verdad**, con la mitad de arriba rellena y
          la de abajo tachada. Es el mismo vocabulario de la tarjeta de oferta
          (`fact-label` / `fact-value`), así que la sección continúa el sistema
          de las ofertas en lugar de abrir uno nuevo; y el argumento —«esto es
          un permiso, no una promesa»— se queda a la izquierda, en texto.

          El reparto es 40/60 en escritorio: el argumento es corto y la prueba
          es larga, y partirlos por la mitad habría mentido sobre cuál manda.

          ⚠️ Los datos de la ficha son un EJEMPLO y lo dice su antetítulo. Los
          campos son exactamente los de la vista `candidate_directory`
          (`01-DATA-MODEL.md`, apartado J): nombre de pila + inicial, edad
          calculada, ciudad/país/nacionalidad, experiencia y sectores, inglés,
          disponibilidad y necesidad de alojamiento o transporte. Lo tachado es
          lo que exige consentimiento, **y el IBAN va con ello**: hasta el
          2026-09-25 tenía fila propia diciendo «nunca, ni con tu permiso», y
          Ulises lo corrigió —la ETT acaba viéndolo, porque es quien paga la
          nómina—. Ojo: `01-DATA-MODEL.md` (apartado J) todavía dice que no se
          comparte en ningún caso dentro del MVP. Esa contradicción está
          abierta y la decide él.

          La oposición no la lleva el color (WCAG 1.4.1): la llevan dos
          encabezados, la posición y el hecho de que abajo no hay valor que
          leer. Las barras son decorativas y cada fila tachada dice en texto
          —para el lector de pantalla— que está oculta.
        */}
        <section
          aria-labelledby="home-privacy"
          className="grid stack-group section-y lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] lg:items-start lg:gap-12"
        >
          <div data-reveal className="flex flex-col stack-group">
            <div className="flex flex-col stack-tight">
              <h2 id="home-privacy" className="type-h2 lg:text-[1.75rem]">
                {t('privacy.title')}
              </h2>
              <p className="type-lead font-medium text-foreground">
                {t('privacy.hook')}
              </p>
            </div>

            <div className="flex flex-col stack-tight">
              <p className="type-body text-muted-foreground">
                {t('privacy.intro')}
              </p>
              <p className="type-body text-muted-foreground">
                {t('privacy.nothingAsked', { brand })}
              </p>
              <Link
                href={legalLink('data_sharing', locale)}
                className="w-fit type-body type-link"
              >
                {t('privacy.link')}
              </Link>
            </div>
          </div>

          <div data-reveal className="overflow-hidden surface-panel">
            <div className="flex flex-col gap-4 bg-brand-soft p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col gap-0.5">
                <p className="type-eyebrow">{t('privacy.example')}</p>
                <p className="type-card-title">{t('privacy.displayName')}</p>
                <p className="type-caption text-muted-foreground">
                  {t('privacy.displayNote')}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                {/* Estos dos rótulos son los que sostienen la oposición, y
                    además son lo que la sostiene para quien no ve el color
                    (WCAG 1.4.1). A `type-h4` se leían como texto normal. */}
                <h3 className="type-h3 text-brand-strong">
                  {t('privacy.seesTitle')}
                </h3>
                <dl className="flex flex-col divide-y divide-foreground/10">
                  {(
                    t.raw('privacy.sees') as { label: string; value: string }[]
                  ).map((row) => (
                    <div
                      key={row.label}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2"
                    >
                      <dt className="fact-label">{row.label}</dt>
                      {/* `ml-auto`: en móvil «Residencia» no cabe en la misma
                          línea que su valor, y sin esto el valor caía a la
                          izquierda y rompía la columna de la derecha. */}
                      <dd className="ml-auto text-right fact-value">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="flex flex-col gap-1 p-4 sm:p-5 lg:p-6">
              <h3 className="flex items-center gap-2 type-h3">
                <Lock aria-hidden className="size-4 shrink-0 text-brand" />
                {t('privacy.neverTitle')}
              </h3>
              <dl className="flex flex-col divide-y">
                {(t.raw('privacy.never') as string[]).map((label, index) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <dt className="fact-value text-muted-foreground">
                      {label}
                    </dt>
                    <dd>
                      <span className="sr-only">{t('privacy.blocked')}</span>
                      <span
                        aria-hidden
                        data-redact
                        className={`block h-2 shrink-0 rounded-full bg-foreground/15 ${REDACTED[index]}`}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/*
          «No llegas solo» — lo que hace la AGENCIA, no lo que hace Talpass
          (2026-09-25, copy de Ulises a partir de su propia experiencia).

          Es la única sección de la home que cuenta lo que pasa después de que
          te seleccionen, y es una SECUENCIA en el tiempo: antes de salir, la
          llegada, el primer día, el primer cobro. Por eso no son cuatro
          tarjetas en fila —cuatro cajas iguales dicen «cuatro cosas», no
          «una detrás de otra»— sino cuatro filas separadas por línea, con el
          momento en el margen izquierdo y la ordinal a 20 px al lado. El
          vocabulario es el de la ficha de privacidad y el de la tarjeta de
          oferta (`fact-label`), así que continúa el sistema en vez de abrir
          uno nuevo, y cuesta un `<ol>` con cuatro `<li>`: el presupuesto de
          esta página es de bytes (bisecado el 2026-09-25).

          El reparto de la fila en escritorio es 2/4/6: el momento es corto, el
          titular manda y el cuerpo es lo largo. En móvil el momento se pone
          encima del titular y el cuerpo debajo.

          🔴 **Los «en algunos casos» y «en algunas ofertas» son de Ulises y no
          se suben a «siempre» ni a «incluido».** Sin ellos esto deja de
          describir cómo funciona el trabajo por agencia en Alemania y pasa a
          prometer un servicio, y el proyecto no tiene todavía NINGUNA ETT con
          la que responder de esa promesa. La nota del final no es adorno
          legal: es lo que hace que la sección sea cierta, y va dentro de la
          sección, no en el pie de página.
        */}
        <section
          aria-labelledby="home-support"
          className="flex flex-col stack-group section-y"
        >
          <div data-reveal className="flex flex-col stack-tight">
            <h2 id="home-support" className="type-h2 lg:text-[1.75rem]">
              {t('support.title')}
            </h2>
            <p className="type-lead font-medium text-foreground">
              {t('support.hook')}
            </p>
          </div>

          <ol className="flex flex-col border-t">
            {SUPPORT.map((key, index) => (
              <li
                key={key}
                data-reveal
                className="grid gap-x-6 gap-y-1 border-b py-4 sm:py-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,4fr)_minmax(0,6fr)] lg:items-baseline lg:gap-x-8"
              >
                <p className="flex items-baseline gap-2">
                  {/* La ordinal es gráfica, no información: el orden lo dice ya
                      el `<ol>`. Por eso va con el momento y no dentro del
                      titular. */}
                  <span aria-hidden className="type-figure text-brand-strong">
                    {index + 1}
                  </span>
                  <span className="fact-label">
                    {t(`support.items.${key}.when`)}
                  </span>
                </p>
                <h3 className="type-h3">{t(`support.items.${key}.title`)}</h3>
                <p className="type-body text-muted-foreground">
                  {t(`support.items.${key}.body`)}
                </p>
              </li>
            ))}
          </ol>

          {/* Al mismo cuerpo que los textos de los pasos, no en letra pequeña:
              esta frase es lo que hace cierta la sección entera —lo que cuenta
              arriba lo hace la AGENCIA, y varía— y a 12 px se leía como la
              letra chica de un contrato, que es justo lo contrario de lo que
              es. */}
          <p
            data-reveal
            className="max-w-[70ch] type-body text-muted-foreground"
          >
            {t('support.note')}
          </p>
        </section>

        {/*
          El FAQ, con `<details>`/`<summary>` nativos: cero JavaScript, cero
          hidratación, teclado y lector de pantalla de serie, y la home sigue
          estática. Un acordeón de cliente aquí habría costado bytes de JS en
          la página cuyo LCP ya lo mandan los 263 KB de scripts.

          La primera respuesta es el antiguo bloque «Qué te cuesta esto», que
          se retiró el 2026-09-25: era la última sección con el estilo viejo
          (`max-w-3xl` centrado) y, sobre todo, una pregunta disfrazada de
          sección. Su copy está entero aquí, `{brand}` incluido.

          Reparto 4/6 con la cabecera pegada arriba (`sticky`) en escritorio:
          la lista es larga y el título no tiene por qué irse de la pantalla.

          ⚠️ Sin `FAQPage` ni ningún otro JSON-LD. El marcado estructurado de
          esta home está acotado por ADR y no se amplía sin pedirlo (ADR-30).
        */}
        <section
          aria-labelledby="home-faq"
          className="grid stack-group section-y lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] lg:items-start lg:gap-12"
        >
          <div
            data-reveal
            className="flex flex-col stack-tight lg:sticky lg:top-24"
          >
            <h2 id="home-faq" className="type-h2 lg:text-[1.75rem]">
              {t('faq.title')}
            </h2>
            <p className="type-lead text-muted-foreground">{t('faq.hook')}</p>
          </div>

          <div className="flex flex-col border-t">
            {FAQ.map((key) => (
              <details key={key} data-reveal className="group border-b">
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 py-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden">
                  <h3 className="type-h3">
                    {t(`faq.items.${key}.q`, { brand })}
                  </h3>
                  <ChevronDown
                    aria-hidden
                    className="size-5 shrink-0 translate-y-0.5 text-brand-strong group-open:rotate-180"
                  />
                </summary>
                <p className="pb-4 type-body text-muted-foreground">
                  {t(`faq.items.${key}.a`, { brand })}
                </p>
                {key === 'data' ? (
                  <p className="pb-4">
                    <Link
                      href={legalLink('data_sharing', locale)}
                      className="type-body type-link"
                    >
                      {t('faq.items.data.link')}
                    </Link>
                  </p>
                ) : null}
              </details>
            ))}
          </div>
        </section>
      </div>

      {/*
        El revelado al hacer scroll (ADR-47). No pinta nada ni oculta nada en
        el HTML: GSAP llega después de \`load\`, en un chunk aparte, y solo
        anima lo marcado con \`data-reveal\` que esté por debajo de la pantalla.
      */}
      <HomeMotion />
    </div>
  );
}
