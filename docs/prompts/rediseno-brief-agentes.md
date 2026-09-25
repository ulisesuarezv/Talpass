# Brief común para los agentes de diseño — rediseño de la home de Talpass

> Escrito el 2026-09-22 para encadenar `layout-disruptivo` → `ui-polish` →
> `gsap-senior-animator` → `visual-qa` (ADR-47). **El estado vivo manda sobre
> este brief:** antes de pasárselo a un agente, cotéjalo con el bloque 🎨 de
> `docs/ESTADO.md` y actualiza las secciones «Estado actual» y la línea base.
> Las secciones «Lo que el dueño rechaza» y «Dirección acordada» describen la
> iteración 2 y ya se aplicaron.

Repo: /Users/ulises/Desktop/EttRecruiter (Next.js 16 App Router, Tailwind v4, shadcn/ui, next-intl).
LEE ANTES: `AGENTS.md` (Next 16 tiene cambios; docs en node_modules/next/dist/docs/), `CLAUDE.md`,
ADR-45 y ADR-46 al final de la sección 4 de `docs/00-PROJECT.md`.

## Qué es

Portal que conecta candidatos hispanohablantes/lusófonos (entran desde el MÓVIL, 4G, datos limitados)
con ETTs (agencias de trabajo temporal) de Europa. MVP: Alemania.

## Estado actual (2026-09-25, sin commitear)

- Home: `src/app/[locale]/(home)/page.tsx` (Server Component, estática, revalidate 3600).
- Copy: `messages/home/es.json` y `en.json` (namespace `Home`, cargado vía `src/lib/home.ts`).
  Paridad de claves obligatoria: `node docs/evidencia/correccion-copy/parity.mjs messages/home/es.json messages/home/en.json`.
- Primitivas de layout en `src/app/globals.css`: `container-page`, `section-y`, `surface-hero`, `surface-panel`,
  `stack-*`, `pad-tile` (@utility), junto a la escala tipográfica `type-*`. Paleta «petróleo y azafrán»
  (ADR-48, propuesta pendiente de ajuste) en `:root`. Colores SIEMPRE como tokens, nunca hex en JSX.
- Franja de ventajas `perks` entre hero y ofertas (en móvil va detrás de las ofertas, `order-last`).
- Estructura (boceto del dueño, se RESPETA): header · [hero a la izquierda | 3 pasos a la derecha] · debajo
  "Ofertas en Alemania" (5 OpportunityCard de `src/components/opportunities/opportunity-card.tsx`) · luego
  3 secciones antiguas (Cómo funciona, privacidad, coste) que NO se tocan en contenido.
- En móvil (375×667) el `h2` de ofertas y el inicio de la primera tarjeta DEBEN verse sin scroll.

## Lo que el dueño (Ulises) rechaza de la versión actual

"Todo se ve abarrotado", "no me convencen los colores ni los espacios". Diagnóstico acordado:

1. Demasiado contenido en la caja del hero: eyebrow + título 3 líneas + subtítulo 4 líneas + 5 tags + 2 botones.
2. Los 5 tags (texto largo + icono, gap 8px) forman un muro de 4 filas.
3. Espaciado uniforme (gap 20px entre todo): no hay agrupación (título+subtítulo juntos; más aire antes de tags y CTA).
4. Color lavado: fondo menta + eyebrow teal + bordes teal claros → poco contraste, nada destaca salvo el botón.

## Dirección acordada

1. Menos texto en el hero: subtítulo de 1–2 líneas; máx. 3 tags cortos. Los demás puntos fuertes van a una
   franja de ventajas (feature strip) — puede ir dentro del hero debajo, o entre hero y ofertas, siempre que en
   móvil las ofertas sigan asomando en 375×667.
2. Escala de espaciado con jerarquía (gap corto intra-grupo, largo inter-grupo, más padding interior).
3. Paleta: el dueño aún no ha dado referencias. Se puede proponer una paleta nueva más contrastada y con más
   carácter, SOLO cambiando tokens de globals.css. WCAG AA obligatorio: `pnpm check:contrast` debe pasar
   (script en scripts/check-contrast.mts; si cambias tokens, actualiza sus pares).

## Los puntos fuertes (copy del dueño; reclamos asumidos por él en ADR-45 — NO suavizarlos ni quitarlos)

- El primer portal que te conecta directamente con ETTs en Europa
- Alojamiento y transporte en la mayoría de ofertas
- Empieza a trabajar en tiempo récord en distintos países de la UE
- Solo necesitas ser ciudadano de la UE; inglés según la oferta
- ¿Poca experiencia? Hay ofertas que no la piden
  Nunca escribir "sin intermediarios" (ADR-44). No re-enfatizar "al candidato no se le cobra".

## Reglas duras

- i18n: nada de texto hardcodeado; es + en siempre, paridad.
- La home sigue ESTÁTICA (● en la tabla de `pnpm build`): no leer cookies/sesión/searchParams.
- Rendimiento es puerta dura (ADR-10). **Línea base del árbol actual, bisecada el 2026-09-25 con 9 pasadas:
  nota 96 · LCP 2,77 s · CLS 0,001.** Lo que mueve ese número NO es el diseño (gradiente, sombra, `clamp()` y
  transiciones costaron 0 ms): son los BYTES de la página. Medido: ~8 KB más de documento+CSS = +150 ms de LCP,
  un RTT del 4G simulado. Así que el presupuesto de esta sesión es de bytes, no de efectos: markup escueto,
  sin imágenes ni fuentes nuevas, y ojo con multiplicar nodos por tarjeta (son 5). Iconos: lucide-react (ya instalado).
  El LCP salta entre cubos discretos (1,96 / 2,62 / 2,78): **la mediana de 3 NO basta, usa 6 pasadas** para
  afirmar que algo cambió.
- NO añadir `loading.tsx` en `(home)` (causó CLS 0,24; ADR-46).
- No tocar otras páginas salvo header/footer si hace falta para la coherencia.
- No hacer git commit ni push. No tocar docs/ salvo que se pida.
- Tras editar: `pnpm exec prettier --write <ficheros>`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, paridad.
- Servidor de prueba: `pnpm build:local && pnpm start:local -p 3210` (matar antes con `kill -9 $(lsof -ti tcp:3210)`;
  Supabase local ya está levantado). NUNCA escribas en BD.
- Capturas con Playwright: guárdalas en `/Users/ulises/Desktop/EttRecruiter/.playwright-mcp/` (única ruta permitida
  por el MCP; está en .gitignore).
- Móvil 375×667: mide con `getBoundingClientRect` que `#home-offers` y el principio de la primera tarjeta queden
  por encima de y=667. Margen al cerrar el 2026-09-22: ~28 px.
