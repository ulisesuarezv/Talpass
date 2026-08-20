# PROMPT — Fase C1 · Credibilidad

> Pegar en una sesión nueva y limpia. Es la primera de las dos fases de diseño decididas el 2026-08-20. La C2 (sistema visual) es la siguiente y **no es esta**.
>
> **No depende del punto 4 y puede correr en paralelo** — corregido el 2026-08-20: el PM lo había escrito como precondición y no lo es. Esta fase no toca la base de datos, ni el correo, ni el backoffice; el punto 4 no toca la home, ni los metadatos, ni la cabecera. Cero ficheros en común.
>
> **La única coordinación, y es de calendario:** esta fase redespliega producción y toca la página de registro, y al punto 4 le queda un alta real end-to-end desde el móvil. Que ese alta no caiga **en mitad** de tu despliegue, para no probar un blanco móvil. Antes o después, da igual.

---

Eres el desarrollador de este proyecto. Antes de escribir nada, lee `CLAUDE.md`, `docs/ESTADO.md` (empieza por los bloques del 2026-08-20 y del 2026-08-18), `docs/00-PROJECT.md` (ADR-01…34, y con atención **ADR-10** sobre el acabado visual, **ADR-11** y **ADR-13** sobre el proxy, y **ADR-30** sobre por qué una oportunidad no es una vacante), `docs/CONVENTIONS.md`, y la ficha **Fase C1** de `docs/02-ROADMAP.md`.

Y lee entera `docs/evidencia/auditoria-previa/00-resumen.md`. **Su tabla de 40 cifras es el contrato de esta fase**: se vuelve a rellenar columna a columna con los mismos comandos. No la reinventes.

Tu tarea: **que un candidato pueda decidir que esto no es un fraude.**

## 0. Por qué esto es lo siguiente, y por qué no es un rediseño

El problema no es que esté feo. Es que un peón que se plantea subir su DNI y su IBAN a un dominio que no conoce, en un sector lleno de estafas, **no tiene con qué decidir que esto no es un fraude**.

Planteado como «está genérico» se discute de gustos. Planteado como credibilidad **se mide**, y por eso esta fase se cierra con una tabla y no con una opinión.

Dos cosas que ya están hechas y **no hay que rehacer**: desde el 2026-08-19 la home dice que detrás hay una persona con nombre y domicilio publicados y enlaza al Impressum, y el pie lleva los cinco enlaces legales. Eso era la mitad del problema. Lo que falta es lo de abajo.

## 1. Entorno y límites

```bash
pnpm db:start
pnpm seed:demo
pnpm dev:local
```

Contra la base local (ADR-17). **Nada de escrituras contra producción.**

**El despliegue es tuyo**, y esto no está hecho hasta estar vivo en `https://talpass.eu`. Este proyecto de Vercel **no tiene integración con GitHub**: un `git push` no despliega nada, y «desplegado» y «subido» son dos hechos distintos que hay que comprobar por separado.

En producción **`x-nextjs-cache` no existe**: Next 16 sobre Vercel lo expresa como `x-vercel-cache` + `x-nextjs-prerender: 1`. Y justo después de desplegar verás `PRERENDER` en vez de `HIT` porque el borde está frío — no es una regresión.

**Al terminar, el `dpl_` que acreditas se lee de `pnpm exec vercel inspect talpass.eu`**, no del que devolvió el despliegue. Son dos hechos distintos y el segundo caduca en cuanto alguien redespliega: ha envejecido mal tres veces en dos días.

## 2. Las cinco reglas que acotan esta fase

1. **El presupuesto de velocidad es puerta dura, no aspiración.** Lighthouse móvil **no baja** de lo medido (filas 32 y 33 de la tabla: local 99/99/99/97/99/99, producción 97/98/100/98/97). El candidato entra con 4G desde el móvil (ADR-10). Si una decisión de diseño cuesta puntos, la decisión está mal.
2. **Nada de GSAP, R3F, shaders ni layout disruptivo.** Decisión de Ulises del 2026-08-18, reafirmada el 2026-08-20. Hay agentes instalados para eso en esta máquina y **en este proyecto restan**: un layout roto en un sitio cuyo problema es que podría parecer una estafa empeora justo lo que vienes a arreglar. **No los invoques.** Los que sí puedes usar son **`visual-qa`** —capturas, 390 px real, Lighthouse; es lo que te permite cerrar con medición— y **`nextjs-app-router`** para los metadatos.
3. **Las rutas públicas no tocan la sesión** (ADR-11, ADR-13). Si una página deja de servirse con caché y sin `Set-Cookie`, has roto algo. Se comprueba al final, no se supone.
4. **Cero texto en el JSX**, y paridad `es`/`en` (ADR-01). Todo copy nuevo va a `messages/`, en los dos idiomas. La marca sale de `src/config/site.ts` (ADR-12).
5. **No toca la base de datos.** Ni migración, ni tabla, ni política. Si crees que hace falta una, la respuesta es que esta fase no es esa.

## 3. Lo que hay que arreglar, y está medido

Todo lo de abajo se midió contra producción el 2026-08-20. Recomprueba antes de tocar: si algo ya no está, dilo y no lo «arregles».

### 3.1 La home no dice nada — `src/app/[locale]/(public)/page.tsx`

**Un `<h1>` y cero `<h2>`.** El namespace `Home` son **546 bytes** en total. Es un hero, dos botones, una nota y el enlace al Impressum; se acaba ahí.

Un candidato que llega no puede responder: **cómo funciona esto, qué pasa con mis documentos, quién los ve, si me van a cobrar, y por qué debería fiarme.** El «no se te cobra nunca» está —en una línea al pie del hero—, y el resto no está en ninguna parte.

Lo que tiene que poder responderse **leyendo solo la home y sin ejecutar JavaScript**. Cómo lo estructures es tuyo; el criterio es que las respuestas estén y se encuentren.

> **Y hay material real que hoy no se usa.** «Cómo se comparte tu perfil» (`/es/legal/datos-y-agencias`) ya enumera campo a campo qué ve una ETT y qué no, a partir de la vista seudonimizada de verdad. Es el argumento de confianza más fuerte que tiene el proyecto y está enterrado en un documento legal. **No lo dupliques**: resúmelo y enlázalo.

### 3.2 Lo primero que se lee es «Fase de construcción»

`Home.eyebrow`. A alguien que está valorando si esto es una estafa, lo primero que le decimos es que aún no está terminado.

No es mentira, y ahí está la tensión: **este proyecto no publica copy falso** (ADR-31 y la corrección del 2026-08-19). No lo sustituyas por una promesa que no se cumple. La honestidad es el activo; lo que sobra es la disculpa.

### 3.3 La jerarquía de los CTA — léelo entero antes de tocar

El botón primario de la home es **«Ver ofertas» → `/jobs`**, y ese destino aparece **dos veces** en el HTML de la home, más una tercera en la cabecera.

**Cuidado, porque aquí es fácil arreglar lo que no está roto.** `/es/ofertas` **no es un callejón sin salida**: cuando no hay vacantes muestra un estado vacío honesto —«Todavía no hay vacantes publicadas», explicando que se están cerrando los primeros acuerdos— y un botón a las oportunidades. Está en `src/app/[locale]/(public)/jobs/page.tsx:84-97`, es `noindex`, y **está bien hecho**. No lo rehagas.

El problema es de **jerarquía**: el botón más llamativo del sitio lleva a la página que dice que no hay nada, mientras `/oportunidades` —que sí tiene cinco perfiles con cifras, fuentes y fecha— es el enlace secundario. Para quien llega por primera vez, el orden está invertido.

Decídelo tú y **razónalo en el cierre**. Lo que no vale: inventar vacantes (ADR-30), ni prometer lo que no hay.

### 3.4 Las páginas de `(auth)` no tienen identidad — hallazgo 7

`/es/registro` sirve **el título y la descripción de la home** y no tiene canónica. **Ninguna** página de `(auth)` define `generateMetadata`; `src/app/[locale]/(auth)/layout.tsx` solo fija `robots: noindex, follow`.

El `noindex` es deliberado y **se queda**. Pero el `<title>` es lo que el candidato ve en la pestaña y lo que aparece si comparte el enlace por WhatsApp, que es exactamente como se va a compartir esto. Un enlace de registro que se anuncia como la home resta confianza en el momento de máxima desconfianza.

`seoMetadata` ya existe y hace el trabajo (`src/lib/seo.ts:45`). Cubre `signup`, `login`, `forgot-password`, `reset-password` y `check-email`.

### 3.5 La cabecera desborda en móvil — `src/components/site-header.tsx:26`

A 390 px de ancho, **el documento mide 453**. La causa es la cabecera, no el contenido: marca + dos enlaces + `AccountNav` + `LocaleSwitcher`, todo en una fila con `gap-4` y sin plan para pantallas estrechas.

Encontrado el 2026-08-19 y confirmado que **la home hace lo mismo**, así que no lo trajo ninguna fase reciente. El pie nuevo, en cambio, mide 390 y envuelve bien: mírale el patrón antes de inventar otro.

Es el defecto más visible de todos: el candidato entra desde el móvil y lo primero que hace la página es moverse de lado.

## 4. Lo que NO es de esta fase

**El sistema visual es la C2**: tipografía, escala tipográfica, color, espaciado, componentes, estados de carga y error. La paleta (`#0D9488`, `#134E4A`, `#F97316`) y **General Sans** ya están elegidas y **no se aplican aquí**.

Si al estructurar la home te hace falta un color o un peso, **usa los tokens que ya existen** en `src/app/globals.css`. No introduzcas la paleta nueva ni cambies la fuente: eso llega con su propio criterio de contraste medido, y mezclarlo haría que lo subjetivo contaminara lo auditable. En esta casa, lo que no se mide no se cierra.

## 5. Hecho cuando

Todo esto se comprueba. Nada se opina.

- **La tabla de 40 cifras vuelve a estar rellena**, columna a columna, con los mismos comandos, en `docs/evidencia/fase-c1/00-tabla.md`. Las filas que empeoren se señalan y se explican; ninguna de rendimiento puede empeorar.
- **Una persona ajena al proyecto responde, leyendo solo la home y sin JavaScript**: quién responde de este sitio · qué hace Talpass · si le van a cobrar · qué pasa con sus documentos y quién los ve · a dónde lleva cada botón.
- **390×844 sin desbordamiento horizontal** en home, registro y una oportunidad. Se demuestra con capturas de `visual-qa` y comparando el ancho del documento con el del viewport, no a ojo.
- **Las cinco páginas de `(auth)` tienen `<title>` y `description` propios**, en `es` y `en`, y conservan el `noindex`.
- **Lighthouse móvil igual o mejor** que la línea base, página por página, local y producción.
- **Sin regresión de caché ni de sesión**: públicas con `x-vercel-cache` y sin `x-ett-session-checked` ni `Set-Cookie`; `/es/cuenta` sigue en 307 con la cabecera y con la función en `dub1`.
- `JobPosting` en oportunidades sigue en **0**. Sitemap y `robots.txt` sin cambios no buscados.
- `typecheck`, `lint`, `format:check` limpios · `test:security` **64/64** · `drill` en verde.
- **Paridad `es`/`en`** de todo el copy nuevo, comprobada con `docs/evidencia/correccion-copy/parity.mjs`, que acepta el par de ficheros por argumento.

## 6. Fuera de alcance — anotar, no hacer

- **La C2 entera** (§4).
- **`ettrecruiter.vercel.app` sirve el sitio a 200 y es rastreable** (hallazgo 8). Está mitigado porque su canónica apunta al apex, y es configuración de dominio, no credibilidad ante el candidato. Anótalo.
- **`/es/trabajo/**` es 404 en producción** (hallazgo 5). Funciona como está diseñado —0 vacantes ⇒ 0 landings, ADR-23— y **no se arregla con código**: se arregla con una ETT. Mide en local si necesitas esas seis páginas.
- **El campo de sector/ciudad de destino en el onboarding** es el punto 5 y va aparte. Si te cruzas con él: `candidate_sectors` es experiencia **pasada**, no preferencia de destino, y reutilizarla sería un error.
- **Cualquier cosa que pida tocar la base de datos.**

## 7. Al cerrar

1. Evidencia en `docs/evidencia/fase-c1/`: `00-tabla.md` (la de 40 cifras rellenada), `01-local.md`, `02-produccion.md` y las capturas.
2. Marca la fase en `docs/02-ROADMAP.md` **solo si su «hecho cuando» está medido entero**. Si falta un criterio, se queda 🟡 y se dice cuál — este proyecto tiene dos correcciones ganadas por marcar ✅ de más.
3. Decisiones nuevas a `docs/00-PROJECT.md` como ADR. **Ojo: ADR-10 está pendiente de precisar** desde el 2026-08-18 —«sobrio y profesional» pasa a definirse como **creíble**, no como vacío, con el presupuesto de velocidad intacto—. Si esta fase la resuelve de hecho, escríbela; es una enmienda de un párrafo, no una sustitución.
4. Actualiza `docs/ESTADO.md`: qué queda hecho, qué no, y qué debe saber la sesión de la C2.
5. Y deja escrito **qué decidiste sobre la jerarquía de CTA (§3.3) y por qué**. Es la decisión de producto de esta fase, y quien venga detrás tiene que poder discutirla sabiendo qué se sopesó.
