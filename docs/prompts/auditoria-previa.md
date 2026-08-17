# PROMPT — Auditoría previa al rediseño

> Pegar en una sesión nueva y limpia. **No es una fase del roadmap** y **no toca
> nada**: ni `src/`, ni `messages/`, ni migraciones, ni producción. Entrega un
> retrato con cifras.
>
> Existe porque después viene un rediseño que toca todas las páginas públicas, y
> sin este retrato no habrá forma de demostrar que no rompió nada.

---

Eres auditor de este proyecto. Lee `CLAUDE.md`, `docs/00-PROJECT.md`,
`docs/01-DATA-MODEL.md`, `docs/02-ROADMAP.md`, `docs/CONVENTIONS.md` y
`docs/ESTADO.md`. Los vas a necesitar enteros: parte de tu trabajo es
**comprobar si lo que dicen sigue siendo verdad**.

## Por qué existe esta auditoría

El proyecto va a hacer un pase de credibilidad sobre las páginas públicas: home,
registro y oportunidades, que es donde está el embudo del candidato. Ese trabajo
toca **exactamente la superficie donde viven ADR-11 y ADR-13**, y este proyecto
ya se ha llevado dos mordiscos silenciosos ahí:

- un `Suspense` con `useSearchParams` dentro dejó el HTML del listado **sin una
  sola vacante**, y la página se veía perfecta en el navegador;
- salir `●` en el build se dio por bueno como prueba de que la página tenía
  contenido, y no lo es.

Los dos fallos tienen la misma forma: **rompen algo que no se ve en pantalla**.
Por eso la comparación no puede ser una impresión, tiene que ser un número.

Tu entregable es el **antes**. La misma batería se vuelve a pasar después, y lo
que no puedas medir hoy no se podrá defender mañana.

## Reglas, sin excepción

1. **No arregles nada.** Vas a encontrar cosas mal —es el objetivo—. Se anotan,
   no se tocan. Un arreglo dentro de la auditoría contamina la línea base: el
   "antes" dejaría de ser el estado real desde el que se parte.
2. **No escribas en producción.** Ni base de datos, ni despliegues, ni variables.
   Contra `https://talpass.eu` solo se lee: `curl`, y `vercel inspect` / `env ls`,
   que no escriben.
3. **Local para medir.** El build, los tests y Lighthouse van contra la base
   local (`pnpm db:start`, `.env.test`). ADR-17 no se relaja para auditar.
4. **Mide, no cites.** Si `docs/ESTADO.md` dice que el sitemap tiene 7 URLs, tu
   trabajo es contarlas. La documentación es la hipótesis; tu salida es el dato.
5. **Ninguna cifra sin el comando que la produjo.** Cada número del entregable
   lleva al lado cómo se obtuvo, o no sirve para repetir la medición después.

## Tres trampas conocidas — caer en ellas invalida la auditoría

- **Un `next start` viejo pegado al puerto sirve un build anterior**, y
  `pkill -f "next start"` no siempre lo mata. Antes de creerte una cabecera:
  `lsof -ti tcp:3210 | xargs -r kill -9`, comprobar que el puerto queda libre,
  `rm -rf .next && pnpm build:local`.
- **Comprueba qué despliegue está vivo antes de medir producción**
  (`pnpm exec vercel inspect talpass.eu`). Si mides contra un despliegue distinto
  del que está en `origin`, estás auditando código que nadie sirve.
- **Las variables del proyecto de Vercel son _Sensitive_**, también las
  `NEXT_PUBLIC_`: su valor no se lee ni en el panel ni con `env pull`. Se
  verifica que existen con `vercel env ls`, y su **efecto** mirando el HTML
  desplegado. Y no des por buena la pantalla de un panel: Vercel llegó a marcar
  "Valid Configuration" con el DNS roto.

---

## 1. Local — build, rutas e invariantes

- `next build` completo: **cuántas rutas públicas salen `●` y cuáles**, y que
  `account`, `agency`, `admin` y `onboarding` siguen `ƒ`. La lista entera, ruta
  por ruta, no el total.
- Las cabeceras de ADR-11 sobre `pnpm start:local`, con el procedimiento de
  `docs/CONVENTIONS.md`: públicas con `x-nextjs-cache: HIT` y **sin**
  `x-ett-session-checked` ni `Set-Cookie`; `/es/cuenta` con `1`.
- **El HTML, no la letra del build.** Sin ejecutar JavaScript: cuántos enlaces de
  oportunidad hay en `/es/oportunidades`, cuántos de vacante en `/es/ofertas`
  (hoy el catálogo está vacío: apunta lo que salga, incluido el cero), y que la
  home lleva su `h1` y sus CTA dentro del HTML servido.
- **`JobPosting` en las oportunidades: cero.** Sobre los ficheros del build, no
  sobre el código. Di cuántos ficheros HTML has recorrido para poder repetirlo.
- `pnpm test:security` y `pnpm test:security:drill`. El número exacto, y que el
  simulacro se pone rojo y vuelve al verde.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`.

## 2. Producción — lo que sirve hoy `https://talpass.eu`

- Despliegue vivo (`vercel inspect`) y **si coincide con el `HEAD` de `origin`**.
  Este proyecto no tiene integración con GitHub y ya pasó un día entero con la
  fase 3 en `origin` sin desplegar.
- `/robots.txt` completo · `/sitemap.xml`: **número de URLs** y si cada entrada
  lleva sus `xhtml:link`.
- `hreflang` recíproco con `x-default` en una oportunidad y en el listado:
  comprueba que la URL del otro idioma **existe y devuelve 200**, no solo que
  esté escrita. Un recíproco roto invalida el emparejamiento entero.
- Canónicas: todas en el apex, `www` redirigiendo (ADR-12).
- `JobPosting` = 0 en las cinco oportunidades, en `es` y en `en`.
- Cabeceras: públicas cacheadas y sin sesión; `/es/cuenta` con 307 y
  `x-ett-session-checked: 1`.
- **Migraciones**: `pnpm exec supabase migration list --linked`. Cuántas locales,
  cuántas remotas, **y cuáles faltan por nombre**.
- **Variables en Vercel**: `vercel env ls`. Cuáles existen en `production` y
  cuáles de las que el código necesita no están.

## 3. Rendimiento — la cifra que el rediseño no puede empeorar

Lighthouse móvil con **la misma configuración con la que se midió la fase 3**
(móvil, 4G con estrangulamiento). Deja escrita la configuración exacta: una cifra
medida en otras condiciones no se puede comparar y no sirve para nada.

Mide **seis** páginas, no tres:

| Página                        | Por qué                                              |
| ----------------------------- | ---------------------------------------------------- |
| Home                          | la toca el rediseño y **no tiene línea base**        |
| `/es/oportunidades`           | ídem — es la puerta de entrada del embudo            |
| Una oportunidad concreta      | ídem                                                 |
| `/es/registro`                | ídem — es donde convierte o se pierde                |
| `/es/ofertas`                 | línea base **97**                                    |
| Una landing de `/es/trabajo/` | línea base **97**                                    |

Anota FCP, LCP, TBT y CLS además de la nota. La nota sola esconde justo lo que un
rediseño empeora.

## 4. La superficie del rediseño, y el copy que la sostiene

**Inventario de lo que se va a tocar**, para que el alcance sea un hecho y no una
estimación: rutas de `(public)` y `(auth)`, componentes que usan, y qué
namespaces de `messages/{es,en}.json` alimentan cada una, con su tamaño. Marca
cuáles son Server Components y cuáles ya son `'use client'`, y por qué lo son.

**Y la auditoría de atribuciones, que es la parte que más importa.** El fallo que
dejó la fase 4b no fue una cifra equivocada: fue una **etiqueta que afirmaba una
procedencia falsa** —"rango observado en las ofertas analizadas" sobre un dato
que salía del convenio—. Las cinco oportunidades están vivas y su premisa entera
es que cada dato es verificable.

Recorre el namespace `Opportunities` en `es` y en `en` y monta una tabla:
**afirmación publicada → de dónde sale → verificada sí/no**, contra
`docs/investigacion/ofertas-mercado.md` y las fuentes del convenio. Marca en rojo:

- toda cifra que no puedas trazar a una fila del informe o a una fuente citada;
- toda etiqueta de procedencia (_"observado"_, _"según el convenio"_, _"de las
  ofertas analizadas"_) que no corresponda con el origen real del dato;
- toda promesa que solo pueda hacer la ETT que la vaya a cumplir (alojamiento con
  precio, meses gratis, transporte) — la sección 5 del informe lo avisa;
- **y `es` contra `en`**: la misma afirmación tiene que decir lo mismo en los dos
  idiomas.

Anota también qué textos **caducan el 2026-09-01**, cuando el convenio de la
Zeitarbeit sube de 15,33 a 15,87 €/h, y en qué claves exactas están.

> Hay una contradicción conocida en `docs/investigacion/ofertas-mercado.md`: el
> §0 dice "ocho de las catorce exigen alemán" y la tabla de recuento dice
> `11 / 14`. **Ya está resuelta a favor del 11** —releídas las 14 fichas: 5 de
> Randstad, 2 de Adecco (A1 y A5) y 4 de Tempton; las mudas son A2, A3 y A4—,
> pero el §0 **sigue sin corregir**. Compruébalo tú y déjalo anotado como
> discrepancia; no lo arregles.

## 5. El embudo del candidato — qué puede hacer hoy, y dónde se para

Recorre el camino completo **sobre el código y sobre lo medido en el punto 2**,
sin registrar a nadie en producción: registro → confirmación → onboarding →
subida de documentos → revisión del admin → `verified` → aviso.

Para cada paso: **¿funciona hoy en producción, y si no, qué le falta
exactamente?** Nómbralo con precisión (una migración concreta, una variable
concreta, una ruta que no existe), porque de esa lista sale el trabajo siguiente.

Incluye los huecos de confianza y legales, que son parte del embudo aunque no
estén en ninguna fase activa:

- qué rutas legales existen en `src/i18n/routing.ts` y cuáles no;
- si la casilla de consentimiento del registro **enlaza** a algo o solo lo pone
  en negrita;
- si las versiones de `src/config/legal.ts` apuntan a documentos que existan.

## 6. Discrepancias entre la documentación y la realidad

Una lista explícita. Todo lo que `ESTADO.md`, `02-ROADMAP.md` o un ADR afirmen y
tú no hayas podido confirmar, y todo lo que sea verdad y no esté escrito en
ninguna parte.

Es la sección más valiosa del entregable: el método de este proyecto es
**verificar los cierres en vez de fiarse del resumen**, y esta es la primera vez
que se pasa esa vara por el proyecto entero de una sentada.

---

## Entregable

En `docs/evidencia/auditoria-previa/`, con la fecha de la medición en cada uno:

| Fichero                 | Contenido                                                      |
| ----------------------- | -------------------------------------------------------------- |
| `00-resumen.md`         | **La tabla de cifras a batir**, las discrepancias y 5 hallazgos |
| `01-local.md`           | build, rutas, invariantes, HTML, seguridad y calidad           |
| `02-produccion.md`      | despliegue vivo, SEO, cabeceras, migraciones y variables       |
| `03-rendimiento.md`     | Lighthouse, con la configuración exacta                        |
| `04-superficie-copy.md` | inventario del rediseño y auditoría de atribuciones            |
| `05-embudo.md`          | el camino del candidato, dónde se para y los huecos legales    |

`00-resumen.md` abre con **una sola tabla**, pensada para volver a rellenarla
después del rediseño: métrica · valor hoy · comando que lo mide. Esa tabla es el
contrato de la auditoría posterior, así que ninguna fila puede depender de que
alguien se acuerde de cómo se midió.

**No toques `docs/ESTADO.md` ni `docs/02-ROADMAP.md`.** Las discrepancias que
encuentres se anotan en el entregable; quien decide qué se corrige y en qué orden
es el PM, con Ulises.

Al terminar, resume en cinco líneas lo que el PM tiene que saber antes de
redactar el plan del rediseño — empezando por lo que hayas encontrado y no
estuviera escrito en ningún sitio.
