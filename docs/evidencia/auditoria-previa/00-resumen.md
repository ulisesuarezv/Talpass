# 00 · Resumen — la línea base antes del rediseño

> **Medición: 2026-08-18.** Commit `ed214e8`, árbol limpio.
> Local: base de datos de `pnpm db:start` con `pnpm seed:demo` (3 vacantes
> publicadas, determinista) y `.env.test` (ADR-17).
> Producción: `dpl_14Fw5ScwWntESvy6wTGkjaEiEYJR`, vivo en `https://talpass.eu`.
>
> **Esta auditoría no ha arreglado nada.** Todo lo que aparece marcado 🔴 sigue
> exactamente igual que como se encontró.

---

## La tabla de cifras a batir

Esta tabla es el contrato de la auditoría posterior: se vuelve a rellenar
columna a columna con los mismos comandos. Ninguna fila depende de que alguien
recuerde cómo se midió.

| #   | Métrica                                                                                              | Valor hoy                                                                                                            | Comando que lo mide                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Páginas de idioma prerenderizadas `●`                                                                | **48**                                                                                                               | `rm -rf .next && pnpm build:local` · `node -e "const m=require('./.next/prerender-manifest.json');console.log(Object.keys(m.routes).length)"` → 53, menos las 5 no-página |
| 2   | Rutas privadas `ƒ` en el build                                                                       | **7** (`account`, `admin`, `admin/[candidateId]`, `agency`, `onboarding`, `api/auth/callback`, `api/documents/[id]`) | salida de `pnpm build:local`                                                                                                                                              |
| 3   | Públicas con `x-nextjs-cache: HIT`, sin `x-ett-session-checked` ni `Set-Cookie` (local)              | **15 / 15**                                                                                                          | `pnpm start:local -p 3210` · `curl -sI localhost:3210<ruta>`                                                                                                              |
| 4   | Privadas con 307 y `x-ett-session-checked: 1` (local)                                                | **5 / 5**                                                                                                            | `curl -sI localhost:3210/es/cuenta`                                                                                                                                       |
| 5   | Enlaces de oportunidad en el HTML de `/es/oportunidades` (local, sin JS)                             | **5**                                                                                                                | `curl -s localhost:3210/es/oportunidades \| grep -o 'href="/es/oportunidades/[^"]*"' \| sort -u \| wc -l`                                                                 |
| 6   | Enlaces de vacante en el HTML de `/es/ofertas` — **local**                                           | **3**                                                                                                                | `curl -s localhost:3210/es/ofertas \| grep -o 'href="/es/ofertas/[^"]*"' \| sort -u \| wc -l`                                                                             |
| 7   | Enlaces de vacante en el HTML de `/es/ofertas` — **producción**                                      | **0**                                                                                                                | mismo `grep` contra `https://talpass.eu/es/ofertas`                                                                                                                       |
| 8   | La home lleva su `h1` en el HTML servido                                                             | **sí** (`<h1>` ×1; **0 `<h2>`**, 0 `<h3>`)                                                                           | `curl -s localhost:3210/es \| grep -o '<h[1-6][^>]*>' \| sed 's/ class=.*//' \| sort \| uniq -c`                                                                          |
| 9   | CTA de la home dentro del HTML                                                                       | **3 destinos**: `/es/ofertas` (×2), `/es/registro`, `/es/oportunidades`                                              | `curl -s localhost:3210/es \| grep -o 'href="[^"]*"' \| sort \| uniq -c`                                                                                                  |
| 10  | Ficheros HTML de oportunidad recorridos en el build                                                  | **12**                                                                                                               | `find .next/server/app -path '*opportunities*' -name '*.html' \| wc -l`                                                                                                   |
| 11  | De esos 12, con `JobPosting`                                                                         | **0**                                                                                                                | `find .next/server/app -path '*opportunities*' -name '*.html' -exec grep -l JobPosting {} \; \| wc -l`                                                                    |
| 12  | HTML totales del build / con `JobPosting`                                                            | **50 / 6** (los 6 son las páginas de vacante real)                                                                   | `find .next/server/app -name '*.html' \| wc -l` y el `-exec grep -l` equivalente                                                                                          |
| 13  | `JobPosting` en las 5 oportunidades de producción, `es` y `en`                                       | **0**                                                                                                                | `curl -s https://talpass.eu<ruta> \| grep -c JobPosting`                                                                                                                  |
| 14  | `pnpm test:security`                                                                                 | **64 / 64**                                                                                                          | `pnpm test:security`                                                                                                                                                      |
| 15  | `pnpm test:security:drill`                                                                           | **rojo y de vuelta al verde**, salida 0                                                                              | `pnpm test:security:drill`                                                                                                                                                |
| 16  | `pnpm typecheck` · `pnpm lint`                                                                       | **limpios** (salida 0)                                                                                               | los propios comandos                                                                                                                                                      |
| 17  | `pnpm format:check`                                                                                  | 🔴 **falla**: 1 fichero (`docs/prompts/auditoria-previa.md`)                                                         | `pnpm format:check`                                                                                                                                                       |
| 18  | Despliegue vivo en `talpass.eu`                                                                      | `dpl_14Fw5ScwWntESvy6wTGkjaEiEYJR` · Ready · región de funciones `iad1`                                              | `pnpm exec vercel inspect talpass.eu`                                                                                                                                     |
| 19  | Commits de `HEAD` que **no están** en `origin/main`                                                  | 🔴 **4**                                                                                                             | `git fetch origin && git log --oneline origin/main..HEAD`                                                                                                                 |
| 20  | URLs en `/sitemap.xml`                                                                               | **7**                                                                                                                | `curl -s https://talpass.eu/sitemap.xml \| grep -o '<loc>[^<]*</loc>' \| wc -l`                                                                                           |
| 21  | `xhtml:link` en el sitemap                                                                           | **21** (3 por entrada: `es`, `en`, `x-default`)                                                                      | `curl -s https://talpass.eu/sitemap.xml \| grep -c 'xhtml:link'`                                                                                                          |
| 22  | Destinos de los alternates que devuelven 200                                                         | **14 / 14**                                                                                                          | `grep -o 'href="[^"]*"' sitemap.xml \| sed 's/href="//;s/"//' \| sort -u \| while read u; do curl -s -o /dev/null -w '%{http_code}\n' "$u"; done`                         |
| 23  | `/robots.txt` en producción                                                                          | `Allow: /` + 15 `Disallow` privados + `Sitemap:`                                                                     | `curl -s https://talpass.eu/robots.txt`                                                                                                                                   |
| 24  | `hreflang` recíproco con `x-default` (listado y una oportunidad, `es` y `en`)                        | **4 / 4 páginas simétricas**                                                                                         | `curl -s <url> \| grep -o '<link rel="alternate" hrefLang="[^"]*" href="[^"]*"'`                                                                                          |
| 25  | Canónicas en el apex                                                                                 | **8 / 8 medidas**; 🔴 `/es/registro` **sin canónica**                                                                | `curl -s <url> \| grep -o 'rel="canonical" href="[^"]*"'`                                                                                                                 |
| 26  | `www` → apex                                                                                         | **308**                                                                                                              | `curl -s -o /dev/null -w '%{http_code} %{redirect_url}' https://www.talpass.eu/es`                                                                                        |
| 27  | Dominio antiguo `ettrecruiter.vercel.app`                                                            | 🟡 **200**, rastreable, canónica al apex                                                                             | `curl -s -o /dev/null -w '%{http_code}' https://ettrecruiter.vercel.app/es`                                                                                               |
| 28  | `/es/trabajo/**` en producción                                                                       | 🔴 **404** (0 vacantes ⇒ 0 landings, ADR-23)                                                                         | `curl -s -o /dev/null -w '%{http_code}' https://talpass.eu/es/trabajo/alemania`                                                                                           |
| 29  | Rutas legales en producción                                                                          | 🔴 **404** las tres (`/es/privacidad`, `/es/terminos`, `/es/legal`)                                                  | mismo `curl`                                                                                                                                                              |
| 30  | Migraciones: repositorio / producción                                                                | **18 / 17** — falta `20260816120000_verification`                                                                    | `ls supabase/migrations/*.sql \| wc -l` y `pnpm exec supabase migration list --linked`                                                                                    |
| 31  | Variables en Vercel `production`                                                                     | **9 existen**; 🔴 **faltan 2**: `RESEND_API_KEY`, `EMAIL_FROM`                                                       | `pnpm exec vercel env ls` y `grep -rhoE "process\.env\.[A-Z_0-9]+" src scripts next.config.ts \| sed 's/.*env\.//' \| sort -u`                                            |
| 32  | **Lighthouse móvil, local** — home / oportunidades / oportunidad / registro / ofertas / landing      | **99 / 99 / 99 / 97 / 99 / 99**                                                                                      | ver `03-rendimiento.md` para el comando exacto                                                                                                                            |
| 33  | **Lighthouse móvil, producción** — home / oportunidades / oportunidad / registro / ofertas / landing | **97 / 98 / 100 / 98 / 97 / n.d. (404)**                                                                             | ídem                                                                                                                                                                      |
| 34  | Peor LCP medido                                                                                      | **2,6 s** (`/es/registro` local y `/es/ofertas` producción) — umbral «bueno» = 2,5 s                                 | ídem                                                                                                                                                                      |
| 35  | TBT y CLS, todas las páginas                                                                         | **0–10 ms** y **0**                                                                                                  | ídem                                                                                                                                                                      |
| 36  | Tamaño de `messages/`                                                                                | `es` 33.463 B · `en` 32.248 B · 17 namespaces · **448 claves hoja en cada uno**                                      | `wc -c messages/*.json` y el script de `04-superficie-copy.md` §A.3                                                                                                       |
| 37  | Claves de `Opportunities` con cifras distintas entre `es` y `en`                                     | **0**                                                                                                                | script de `04-superficie-copy.md` §B.1                                                                                                                                    |
| 38  | Afirmaciones de `Opportunities` **no trazables o mal atribuidas**                                    | 🔴 **5**, en los dos idiomas                                                                                         | tabla `04-superficie-copy.md` §B.1                                                                                                                                        |
| 39  | Páginas de `(public)` / de `(auth)`                                                                  | **9 / 5** (+1 layout) — **ninguna es `'use client'`**                                                                | `find "src/app/[locale]/(public)" "src/app/[locale]/(auth)" -type f` y `grep -rl "'use client'" src/app`                                                                  |
| 40  | Componente cliente más grande de la superficie pública                                               | `jobs/job-browser.tsx`, **322 líneas**                                                                               | `wc -l src/components/jobs/*.tsx`                                                                                                                                         |

---

## Discrepancias entre la documentación y la realidad

### A · Lo que la documentación afirma y no he podido confirmar

| #   | Dónde lo dice                         | Qué dice                                                                       | Qué he medido                                                                                                                                                                                                                                                       |
| --- | ------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `ESTADO.md`, «Si retomas como PM» §1  | «**Git y producción quedan sincronizados**»                                    | 🔴 `origin/main` = `8ca97a4`, **4 commits por detrás**, y **no contiene la fase 4b** (`git ls-tree origin/main \| grep -c opportunities` → 0). Lo desplegado está commiteado, pero **no subido**                                                                    |
| 2   | `ESTADO.md`, «El día que haya ETT» §4 | Faltan **tres** variables en Vercel, entre ellas `SUPABASE_SERVICE_ROLE_KEY`   | 🟡 Faltan **dos**. `SUPABASE_SERVICE_ROLE_KEY` está en `production` desde hace 4 días                                                                                                                                                                               |
| 3   | `02-ROADMAP.md:238` · `ESTADO.md:478` | «Rendimiento móvil (Lighthouse, 4G): listado 97 · detalle 95 · **landing 97**» | 🔴 **No es reproducible.** No consta herramienta, versión, comando ni si fue local o producción — y la landing es **404 en producción**, así que ese 97 no se puede volver a medir donde se sirve                                                                   |
| 4   | `02-ROADMAP.md:230`                   | «**41 páginas públicas `●`**» (fase 3)                                         | 🟡 Hoy salen **48**, pero con 3 vacantes en la base local en vez de las 6 de entonces y con las 10 páginas nuevas de la 4b. Sin saber si aquel 41 contaba por idioma, **las dos cifras no son comparables**. La fila 1 de la tabla de arriba sustituye a ese número |
| 5   | `ESTADO.md`, historia de la fase 3    | «17 migraciones con `local` y `remote` idénticos y sin huecos»                 | Era cierto el 2026-08-16. Hoy son **18 locales y 17 remotas**: la fase 4 añadió una que sigue sin aplicar. La frase está en la sección marcada como foto histórica, así que **no es un error, es una foto**                                                         |

### B · Lo que es verdad y no está escrito en ninguna parte

| #   | Hallazgo                                                                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | 🔴 **Las 16 landings de `/es/trabajo/**` son 404 en producción.** Es ADR-23 funcionando (0 vacantes ⇒ 0 landings), pero **ningún documento lo dice**, y el roadmap sigue presentando las landings como parte de lo entregado por la fase 3. La superficie indexable real de producción son **7 URLs** |
| 7   | 🔴 **No existe ninguna ruta legal**, y la casilla de consentimiento obligatorio del registro **pone los Términos en negrita, no los enlaza** (`<terms>` → `<strong>`). `src/config/legal.ts` versiona con fecha `2026-08-14` unos documentos que no existen en `docs/`, `content/` ni `public/`       |
| 8   | 🔴 **Cinco afirmaciones publicadas en `Opportunities` no corresponden con su origen** — incluida «Alojamiento / Transporte: **En algunas ofertas**» sobre una fuente que dice **0/14 y 14/14 callan**. Detalle completo en `04-superficie-copy.md` §B.1                                               |
| 9   | 🟡 **Las páginas de `(auth)` no tienen metadatos propios.** `/es/registro` sirve el título y la descripción **de la home**, sin canónica, y con `hreflang` apuntando a la home. Ninguna define `generateMetadata`                                                                                     |
| 10  | 🟡 **Las funciones de Vercel corren en `iad1` (EE. UU.)** contra una base de datos en la UE. No hay `vercel.json`, `vercel.ts` ni `regions` en `next.config.ts`. No lo cubre ningún ADR y `CLAUDE.md` sitúa Supabase en región EU por un motivo que no es la latencia                                 |
| 11  | 🟡 **`ettrecruiter.vercel.app` sirve el sitio entero a 200 con `Allow: /`**, en vez de redirigir. Mitigado porque su canónica y su sitemap apuntan al apex. `ESTADO.md` dice que «sigue respondiendo», pero no que sea rastreable                                                                     |
| 12  | 🟡 **La home tiene un solo encabezado en todo el documento** (`<h1>`, cero `<h2>`) y **375 bytes de copy**, contra los 12.489 de las oportunidades. El pie entero son **47 bytes**                                                                                                                    |
| 13  | 🟡 **`pnpm format:check` falla hoy**, por un único fichero: el prompt de esta misma auditoría                                                                                                                                                                                                         |
| 14  | 🟡 **El prompt de la auditoría se equivoca en una fecha**: dice que el 2026-09-01 el convenio sube «de 15,33 a 15,87 €/h». Son dos revisiones: **15,33 € el 2026-09-01** y **15,87 € el 2027-04-01** (`ofertas-mercado.md` §2.1 y `src/lib/opportunities.ts`)                                         |

### C · Lo que la documentación dice y **he confirmado que es exacto**

- La contradicción del §0 de `docs/investigacion/ofertas-mercado.md` **sigue sin
  corregir**: línea 20 dice «**Ocho** de las catorce exigen alemán», línea 82
  dice «Idioma exigido: **11 / 14**». Ya está resuelta a favor del 11, y el
  código y el copy publicado ya usan el 11. **Anotada, no arreglada.**
- `NEXT_PUBLIC_ALLOW_INDEXING` hace efecto: `Allow: /` vivo, sitemap de 7 URLs.
- `JobPosting = 0` en las 12 páginas de oportunidad, en el build y en producción.
- ADR-11 y ADR-13 en verde en local **y** en producción: ninguna pública filtra
  sesión ni cookie; las privadas responden 307 con `x-ett-session-checked: 1`.
- `test:security` 64/64 y el simulacro en verde, igual que dejó la fase 4.
- Falta exactamente **una** migración en producción, y es la que `ESTADO.md` dice.

---

## Cinco hallazgos

### 1 · 🔴 La fase 4b no existe fuera del portátil

`origin/main` no tiene ni uno de los 6 ficheros de `opportunities`. El sitio que
está indexándose en Google ahora mismo se sirve desde un despliegue que se hizo
con `vercel --prod` desde local, sin pasar por el remoto, y **no hay copia del
código en ningún otro sitio**. Un disco que falle se lleva la fase 4b entera y,
con ella, el «antes» que esta auditoría acaba de medir. Es lo primero de la
lista y no es trabajo de rediseño: es `git push`.

### 2 · 🔴 «Alojamiento: En algunas ofertas» — la atribución falsa sobrevivió a la 4b

El PM cazó una etiqueta de procedencia falsa al cerrar la 4b y la corrigió.
**Quedaron cinco más**, y la peor está viva en producción hoy: los perfiles de
almacén, logística y producción publican «Alojamiento: En algunas ofertas» y
«Transporte: En algunas ofertas» sobre una investigación que dice
**0 de 14 y 0 de 14**, y cuyo §0 escribe literalmente «Ninguna de las tres
agencias ofrece alojamiento, ni transporte». Es la clase de promesa que el §5 del
informe reserva a la ETT que la va a cumplir. Las otras cuatro (dos franjas
salariales etiquetadas como «techo observado» sin observación, y dos
afirmaciones de la ficha de almacén que se contradicen con la de producción)
están en `04-superficie-copy.md` §B.1. **La lección del PM se confirma: en estas
páginas lo que hay que auditar no son las cifras, son las atribuciones.**

### 3 · 🔴 El registro pide un consentimiento sobre textos que no existen

La casilla obligatoria dice «He leído y acepto los **Términos de uso y la
Política de Privacidad**» — en negrita, sin enlace, y las URLs candidatas son 404. `src/config/legal.ts` graba la versión `2026-08-14` de cuatro documentos
que no están en el repositorio. El mecanismo de versionado está bien pensado; le
falta el objeto. Es el hueco más serio del embudo y cae **exactamente** en la
página que el rediseño va a tocar.

### 4 · 🔴 Producción no tiene línea base de landings, y el roadmap cree que sí

`/es/trabajo/**` es 404 entero porque no hay vacantes. Eso significa que dos de
las seis páginas que había que medir no existen donde se sirven, que el «landing
97» del roadmap no se puede reproducir, y que la superficie indexable de
producción son **7 URLs**, no las decenas que la fase 3 dejó construidas. El
rediseño debe medir **en local** para tener las seis, y esta auditoría deja las
dos tablas separadas para que no se mezclen.

### 5 · 🟡 El embudo está bien construido y se para en dos cosas nombrables

Registro, confirmación, aterrizaje del enlace y onboarding **funcionan hoy en
producción**. A partir de ahí se para en exactamente dos cosas, y las dos tienen
nombre: la migración `20260816120000_verification.sql` (sin ella la cola de
revisión está siempre vacía y el admin no puede registrar que abrió un
documento) y las variables `RESEND_API_KEY` y `EMAIL_FROM` (sin ellas no sale
ningún aviso). Ninguna de las dos es código. Y detrás de ambas está lo de
siempre: no hay ni una vacante a la que aplicar.

---

## Índice del entregable

| Fichero                 | Contenido                                                   |
| ----------------------- | ----------------------------------------------------------- |
| `00-resumen.md`         | esta tabla, las discrepancias y los 5 hallazgos             |
| `01-local.md`           | build, rutas, invariantes, HTML, seguridad y calidad        |
| `02-produccion.md`      | despliegue vivo, SEO, cabeceras, migraciones y variables    |
| `03-rendimiento.md`     | Lighthouse, con la configuración exacta                     |
| `04-superficie-copy.md` | inventario del rediseño y auditoría de atribuciones         |
| `05-embudo.md`          | el camino del candidato, dónde se para y los huecos legales |
