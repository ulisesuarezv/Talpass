# PROMPT — Fase 4b · Oportunidades de mercado

> Pegar en una sesión nueva y limpia. Fases 0, 1 y 2 cerradas; la 3 y la 4 construidas y verificadas en local, ambas 🟡 esperando una ETT real.

---

Eres el desarrollador de este proyecto. Antes de escribir nada, lee `CLAUDE.md`, `docs/ESTADO.md` (empieza por el aviso del 2026-08-17, que está arriba del todo), `docs/00-PROJECT.md` (ADRs 01–29), `docs/01-DATA-MODEL.md`, `docs/CONVENTIONS.md`, la ficha de la **Fase 4b** en `docs/02-ROADMAP.md` y el informe `docs/investigacion/ofertas-mercado.md`.

Tu tarea es la **Fase 4b: publicar oportunidades de mercado y abrir el sitio a Google, sin ETT y sin fingir vacantes.**

## 0. Por qué existe esta fase

El proyecto está bloqueado en un pollo y huevo: no hay vacante real sin ETT, no hay ETT sin candidatos que enseñar, y no hay candidatos sin ofertas que enganchen. Las fases 3 y 4 llevan desde el 2026-08-16 esperando a una vacante real que no puede existir todavía.

Se rompe por el lado del candidato. **El gancho de conversión es ver condiciones concretas**, no que exista un puesto con fecha de incorporación: quien se registra lo hace porque `16 €/h, sin alemán, con alojamiento` le cambia la vida. Esa concreción se puede publicar **siendo cierta**, porque sale del convenio de la Zeitarbeit y de 14 ofertas reales analizadas con fecha en `docs/investigacion/ofertas-mercado.md`.

Lo que no se puede publicar es una **vacante inventada**.

## 1. Entorno y límites

```bash
pnpm db:start        # OrbStack arrancado
pnpm seed:demo       # solo si necesitas el listado de /ofertas con contenido
pnpm dev:local       # Next contra la base local
```

Todo se construye **contra la base local** (ADR-17).

**Nada de escrituras contra la base de datos de producción** — ni `db:push:prod`, ni `job:publish:prod`, ni `service_role` contra el proyecto alojado. El clasificador de permisos las deniega y hace bien.

**Pero el despliegue sí es tuyo, y la bandera de indexación también.** Es la diferencia de esta fase: las oportunidades son ficheros y rutas estáticas, no filas, así que publicarlas no escribe una sola línea en producción. Ulises ha pedido expresamente (2026-08-17) no tener que ejecutar nada a mano. Está en el paso 7, y ahí están las condiciones.

**No toques la maquinaria de vacantes.** `content/jobs/`, `pnpm job:publish`, `job-posting-jsonld.tsx`, `src/lib/jobs.ts` y `src/lib/landings.ts` están construidos, verificados y correctos. Siguen esperando a la primera ETT. Esta fase construye **al lado**, no encima.

## 2. La regla que define la fase

Lo que activa las políticas de Google Jobs **no es el texto ni el tono: es el marcado `JobPosting`**, que es una declaración legible por máquina de que ese empleo existe y está abierto. Publicarlo sobre ofertas inventadas arriesga una acción manual por _job posting spam_ en el canal exacto del que depende toda la estrategia de la fase 3, y cuesta meses deshacerla.

Sin esa etiqueta, la página es contenido ordinario y Google la juzga por calidad. Cuatro reglas, y **ninguna quita el gancho**:

1. **Cero marcado `JobPosting`** en esta sección. Ni uno. Es el interruptor.
2. **Ninguna empresa concreta con vacante abierta.** Nada de agencias inventadas —el `ejemplo-almacen-nuremberg.json` tiene una, `Franken Personal GmbH`, que no existe— ni de fechas de incorporación.
3. **Ninguna promesa específica sin confirmar**: alojamiento a 280 €, meses gratis, transporte diario. Lo avisa la sección 5 del propio informe — eso solo lo promete la ETT que lo va a cumplir, y Talpass vende transparencia.
4. **Encuadre honesto y visible**, no en letra pequeña: son condiciones típicas del mercado, no una vacante a la que se aplica.

**Lo que sí se publica, y es todo lo que convierte:** rangos salariales, el convenio y su subida del 2026-09-01, ciudades y sectores con demanda real, y que en varios no se exige alemán.

## 3. Dónde vive esto — la restricción estructural

**Una oportunidad NUNCA es una fila en `jobs`.** Es la restricción más importante de la fase y es de seguridad, no de estilo: si vive en esa tabla, entonces el listado, el sitemap, el `JobPosting`, las landings de ADR-23 y —en la fase 5— el botón de aplicar la tratan automáticamente como vacante real. Una sola bandera olvidada publica exactamente lo que esta fase existe para no publicar. **Que el error sea estructuralmente imposible, no que dependa de acordarse.**

Elige la forma más simple que respete eso y **razona la elección**. Lo natural es por fichero, como ADR-28 hizo con las vacantes: contenido en `content/opportunities/`, rutas estáticas propias, sin base de datos y sin migración. Si ves algo mejor, arguméntalo.

Ojo a una consecuencia buena: por este camino **la enmienda a ADR-23 no hace falta en esta fase**. Las landings siguen derivando de vacantes vivas y las oportunidades son su propio árbol de rutas. Esa enmienda es de las landings de mercado, que están aplazadas.

## 4. La sección

`/es/oportunidades` ↔ `/en/opportunities` (ADR-14: ruta interna en inglés, externa traducida).

- **Listado** con tarjetas que se ven y se sienten como un listado de ofertas —es lo que convierte—: sector, ciudad o región, franja salarial con moneda y periodo, idioma exigido, alojamiento, transporte, turnos.
- **Página por perfil** con tareas, requisitos y condiciones, al detalle del que dan los borradores del informe.
- **CTA a registro** en las dos, reutilizando el patrón de `SignupCta` que ya usa la vacante.
- **`hreflang`, canónica y Open Graph** como el resto de páginas públicas.
- **En el `sitemap.ts`**, con sus `xhtml:link`.

**Cinco o seis perfiles**, no tres y no cincuenta. Menos no llena una página que parezca un job board; más, con el contenido que da el informe, son páginas delgadas y multiplicar ciudad × sector hasta cincuenta las convierte en _doorway pages_, que sí es un problema de calidad. **La contención está en no multiplicarlas.**

El informe trae tres borradores (`§4`). Redacta los que falten con sus rangos y su vocabulario, en `es` y `en`, sin inventar condiciones que el informe no documente. **Ulises revisa los textos antes de publicar**: son suyos y es él quien responde de ellos.

## 5. Los slugs, que es lo que hay que acertar hoy

`/oportunidades` es de esta etapa, pero **no se borra cuando deje de hacer falta**: para entonces esas URLs tendrán posiciones, enlaces e historial. Se retiran con **301 de cada oportunidad a su equivalente concreto** —almacén en Sajonia → la landing de almacén en Sajonia—, nunca con un borrado ni con un 301 en bloque a `/ofertas`, que Google trata como _soft 404_.

**Por eso los slugs tienen que encajar con los de las landings de ADR-23.** Mira cómo los construye `src/lib/landings.ts` y hazlos compatibles. Si eliges slugs cómodos, cierras esa puerta sin enterarte, y es lo único de esta fase que no se puede arreglar después.

## 6. `/ofertas` mientras esté vacío

Hoy es una página sin una sola vacante, y va a seguir así hasta que haya ETT. Ponla en **`noindex`** mientras esté vacía, con un enlace visible a `/oportunidades` para que no sea un callejón sin salida. Que vuelva sola a ser indexable cuando haya vacantes publicadas: es una condición sobre el contenido, no una bandera que alguien tenga que acordarse de cambiar.

## 7. Publicar en producción — lo haces tú

Decisión de Ulises del 2026-08-17: **no quiere ejecutar nada a mano.** La CLI de Vercel está autenticada (`ulisesuarezv`) y el proyecto enlazado (`prj_9OIGFbXigzCFz97ID7kTrhvfX4zv`), así que esto lo lanzas tú.

**Pídele confirmación explícita antes de cada uno de los dos gestos.** Salen a Internet y no se deshacen con un `git revert`: un despliegue queda publicado y una URL indexada tarda en desindexarse. Enséñale qué vas a publicar antes de publicarlo.

**Y no despliegues hasta que el punto 8 esté verificado en local**, en particular el `grep` de `JobPosting`. Desplegar primero y comprobar después es cómo se publica justo lo que esta fase existe para no publicar.

```bash
pnpm exec vercel --prod                                              # 1. publica el contenido
printf 'true' | pnpm exec vercel env add NEXT_PUBLIC_ALLOW_INDEXING production   # 2. abre a Google
pnpm exec vercel --prod                                              # 3. sí, otra vez
```

**El orden importa y el tercer paso no es opcional.** `NEXT_PUBLIC_ALLOW_INDEXING` se hornea en el build: añadir la variable no cambia nada hasta que se vuelve a desplegar. Y se abre a Google **después** de que el contenido esté vivo, no antes.

Recuerda que **este proyecto de Vercel no tiene integración con GitHub**: un `git push` no despliega nada. La fase 3 pasó un día entero en `origin` creyéndose desplegada.

**Si un despliegue te lo deniegan**, no insistas ni busques otra vía: anótalo en `docs/ESTADO.md` con el comando exacto y déjalo para Ulises con el prefijo `!`. Entrega el resto de la fase completo.

## 8. Hecho cuando

Verifica cada punto y deja la evidencia en `docs/evidencia/fase-4b/`:

- **`grep -ri "JobPosting"` sobre el HTML generado de `/oportunidades` no devuelve nada.** Es el criterio central de la fase: compruébalo sobre el HTML del build, no sobre el código fuente.
- Las oportunidades salen en el HTML estático **sin ejecutar JavaScript**, como se comprobó el listado en la fase 3.
- `next build`: las oportunidades son `●`; las privadas siguen `ƒ`.
- Cabeceras (ADR-11, ADR-13): `x-nextjs-cache: HIT`, **sin** `x-ett-session-checked` ni `Set-Cookie`. Las rutas públicas no tocan la sesión, y esta fase añade rutas públicas.
- `hreflang` recíproco entre `/es/oportunidades/...` y `/en/opportunities/...`, con `x-default`.
- `/ofertas` vacío responde con `noindex` y enlaza a `/oportunidades`.
- Un candidato llega a una oportunidad desde el móvil (390×844) y **completa el registro**.
- Cero texto en el JSX: todo el copy desde `messages/`, en `es` y `en`.
- `test:security` (64/64) y `:drill` siguen en verde — esta fase no debería tocar la base, así que si algo cambia ahí, párate y explica por qué.
- `typecheck`, `lint`, `format:check` limpios.

**Y después de desplegar, contra `https://talpass.eu` — la fase no está hecha hasta aquí:**

- **`curl` del HTML de una oportunidad en producción: cero `JobPosting`.** Se comprueba otra vez sobre producción, no solo sobre el build local. Es el criterio central y es el único sitio donde importa de verdad.
- `/robots.txt` **ya no dice `Disallow: /`**, que es el gesto que abre el sitio a Google después de meses apagado.
- `/sitemap.xml` trae las oportunidades — deja anotado cuántas URLs, que hasta hoy eran 2.
- Las oportunidades salen en el HTML de producción **sin ejecutar JavaScript**.
- `/es/oportunidades`: `HIT`, **sin** `x-ett-session-checked` ni `Set-Cookie`. `/es/cuenta` sigue redirigiendo con `1`.
- `/es/ofertas` responde con `noindex` y enlaza a las oportunidades.

**Cuidado con verificar contra un build viejo**: el despliegue tarda en propagarse. Confirma que estás mirando el despliegue nuevo antes de dar por buena una cabecera, y anota su ID en la evidencia.

## 9. Fuera de alcance — anotar, no hacer

- **Las landings de mercado** (contenido tipo "cuánto se paga en almacén en Alemania"). Aceptadas y aplazadas: ver la ficha de la 4b en el roadmap. Necesitan la enmienda a ADR-23; esta fase no la hace.
- **Aplicar a una oportunidad.** No existe y no debe existir: no hay a dónde mandar la candidatura. Aplicar es la fase 5 y es sobre vacantes reales.
- **Avisar al candidato cuando entre una vacante de su perfil.** Es lo que hace que la lista no se enfríe, y es fase 8. Anota si el onboarding ya captura sector y ciudad preferidos, porque de ahí saldrá.
- **Retirar `/oportunidades`.** Se hace el día que haya vacantes reales, con los 301 del punto 5.

## 10. Al cerrar

Anota las decisiones nuevas como ADR en `docs/00-PROJECT.md` — **la última es la ADR-29, así que la tuya empieza en la 30**. Ten en cuenta que **ADR-16 y ADR-23 se corrigieron el 2026-08-17** por esta misma fase: reléelas antes de escribir la tuya. Actualiza `docs/02-ROADMAP.md` y `docs/ESTADO.md` —incluido el aviso del 2026-08-17, que esta fase resuelve— y resume qué debe saber la sesión siguiente.

**Y no marques la fase ✅ sin haber medido su criterio.** Vale para las fases 3 y 4, que **siguen 🟡** y que esta fase no cierra: su criterio pide el Rich Results Test sobre una vacante real y esto no lo sustituye. En este proyecto ya se marcó una fase ✅ con el criterio sin comprobar, y hubo que revertirlo.
