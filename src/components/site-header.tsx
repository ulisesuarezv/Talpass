import { getTranslations } from 'next-intl/server';

import { AccountNav } from '@/components/account-nav';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';

/**
 * Cabecera pública. Server Component y sin estado de sesión a propósito:
 * leer la sesión aquí volvería dinámica toda página que use este layout
 * (ADR-11). El estado de sesión lo pone `AccountNav`, que es cliente y aislado
 * justamente por eso.
 *
 * ## El rediseño del 2026-09-25, y qué problema resuelve
 *
 * Antes había cuatro cosas del mismo peso pegadas a la derecha —dos enlaces de
 * sección, el enlace de cuenta y el conmutador de idioma—, todas en `text-sm
 * text-muted-foreground`. Sin jerarquía, «Entrar» pesaba lo mismo que «EN», y
 * en móvil y en español la fila **envolvía a dos líneas**: 73 px de cabecera
 * frente a 57, y esos 16 px se los comen las ofertas de la home, que tienen que
 * asomar en 375 × 667 (ADR-46).
 *
 * Ahora hay **tres rangos y dos grupos**, y cada pieza se pinta según el papel
 * que hace, no según dónde cae:
 *
 * 1. **La marca** (17 px, semibold, `--primary`) y **la sección** (14 px,
 *    medium, tinta normal) forman el grupo de la izquierda: son navegación.
 * 2. **El idioma** es una herramienta, no un destino, y por eso deja de
 *    parecer un enlace: pasa a ser un **control segmentado** de 12 px, con la
 *    pastilla blanca marcando el idioma activo. Que no se lea como enlace es
 *    justamente el arreglo.
 * 3. **La acción de cuenta** es lo único con forma de botón, y va pegada al
 *    borde derecho, que es la posición de más peso de la fila (lo pinta
 *    `AccountNav`).
 *
 * `/oportunidades` sale de la cabecera: la navegación se queda con una sola
 * sección por decisión de Ulises. Con un enlace menos la fila cabe entera a
 * 375 px en español, así que la cabecera **baja de 73 a 49 px** en móvil y las
 * ofertas de la home suben otro tanto.
 *
 * **Sigue sin menú desplegable, y sigue siendo a propósito.** Un menú exige
 * estado —y por tanto JavaScript— en la cabecera de TODAS las páginas
 * públicas, que son estáticas (ADR-11). El `flex-wrap` se queda como red de
 * seguridad por si una traducción futura crece: hoy no llega a envolver en
 * ninguno de los dos idiomas, ni con la sesión abierta, pero si algún día no
 * cabe, la fila se parte en vez de desbordar el documento de lado (que es lo
 * que pasaba a 390 px antes de la fase C1).
 */
export async function SiteHeader() {
  const t = await getTranslations('Nav');

  return (
    // Petróleo y opaca (elección de Ulises, 2026-09-25). Antes era el fondo
    // de la página al 92 %: con tan poco contraste contra el cuerpo, la
    // cabecera no se leía como una pieza y «Entrar» desaparecía dentro de
    // ella. Ahora comparte superficie con el hero —`--hero`, la única oscura
    // del sitio— así que al cargar la home las dos se leen como un solo bloque
    // y, al hacer scroll, la barra se sostiene sola sobre el contenido claro.
    //
    // Opaca a propósito: traslúcida sobre el hero dejaba pasar el fantasma del
    // titular, y el desenfoque costaba una capa de composición en cada scroll.
    <header className="sticky top-0 z-40 border-b border-hero-foreground/15 bg-hero text-hero-foreground">
      <a
        href="#content"
        className="sr-only bg-background text-foreground focus:not-sr-only focus:absolute focus:left-4 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        {t('skipToContent')}
      </a>

      {/*
        Alto mínimo y no fijo, por lo del `flex-wrap` de arriba. 48 px en móvil
        y 56 desde `sm`: en móvil cada píxel de cabecera empuja hacia abajo el
        `h2` de ofertas de la home, y 48 px siguen dejando 8 px por arriba y por
        abajo alrededor del botón de cuenta, que mide 32.
      */}
      <div className="container-page flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 sm:min-h-14 sm:gap-x-5">
        {/* La marca manda en el grupo de la izquierda: es el único elemento en
            color de marca, y va dos puntos por encima del enlace de sección. */}
        <Link
          href="/"
          className="text-[1.0625rem] leading-none font-semibold tracking-tight text-hero-foreground"
        >
          {siteConfig.name}
        </Link>

        {/* `mr-auto`: el hueco de la fila va aquí, entre los dos grupos. Es lo
            que separa «dónde estoy» de «qué hago». */}
        <nav aria-label={t('sectionsLabel')} className="mr-auto">
          <Link
            href="/jobs"
            className="type-meta font-medium text-hero-muted underline-offset-[6px] transition-colors hover:text-hero-foreground hover:underline"
          >
            {t('jobs')}
          </Link>
        </nav>

        {/* El idioma antes que la cuenta a propósito: `AccountNav` cambia de
            ancho cuando resuelve la sesión en cliente, y dejándolo el último de
            la fila ese cambio no mueve nada más. */}
        <LocaleSwitcher />
        <AccountNav />
      </div>
    </header>
  );
}
