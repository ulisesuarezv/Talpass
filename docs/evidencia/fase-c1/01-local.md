# 01 · Local — build, HTML, cabeceras, ancho a 390 px y rendimiento

> **Medición: 2026-08-20.** Commit `72136a4`, árbol limpio salvo esta carpeta.
> Base de `pnpm db:start` + `pnpm seed:demo` (3 vacantes publicadas,
> determinista) y `.env.test` (ADR-17). Servidor: `pnpm start:local -p 3210`
> sobre `rm -rf .next && pnpm build:local`.
>
> ⚠️ **Una trampa de método que hay que dejar escrita**, porque me costó dos
> mediciones falsas: `pkill -f "next start"` **no mata** el servidor que arranca
> `pnpm start:local`, así que el puerto 3210 se queda con el proceso anterior y
> el nuevo `start` falla en silencio. Durante un rato estuve midiendo el build
> viejo creyendo que era el nuevo. La forma que funciona es
> `kill -9 $(lsof -ti tcp:3210)`, y la comprobación barata es un `grep` de algo
> que solo esté en el build que se quiere medir.

---

## A · El build

| Qué                             | Antes (2026-08-18) | Ahora      | Comando                                                                   |
| ------------------------------- | ------------------ | ---------- | ------------------------------------------------------------------------- |
| Rutas en `prerender-manifest`   | 53                 | **65**     | `node -e "…Object.keys(m.routes).length"`                                 |
| Menos las 5 que no son página   | 48                 | **60**     | `_global-error`, `_not-found`, `favicon.ico`, `robots.txt`, `sitemap.xml` |
| Rutas privadas `ƒ`              | 7                  | **7**      | salida de `pnpm build:local`                                              |
| HTML de oportunidad             | 12                 | **12**     | `find .next/server/app -path '*opportunities*' -name '*.html' \| wc -l`   |
| De esos, con `JobPosting`       | 0                  | **0**      | el `-exec grep -l` equivalente                                            |
| HTML totales / con `JobPosting` | 50 / 6             | **62 / 6** | los 6 siguen siendo las páginas de vacante real                           |

**Las 12 páginas nuevas no las trae esta fase**: son las 12 rutas legales
publicadas el 2026-08-19 (`/legal` y `/legal/[documento]`, en `es` y `en`), que
son posteriores a la línea base del 18. La C1 **no añade ni una ruta**.

## B · La home, en el HTML servido y sin ejecutar JavaScript

| Qué                               | Antes                      | Ahora                          |
| --------------------------------- | -------------------------- | ------------------------------ |
| Encabezados                       | 1 `h1`, **0 `h2`**, 0 `h3` | 1 `h1`, **5 `h2`**, **6 `h3`** |
| Bytes del namespace `Home` (`es`) | **536**                    | **3.791**                      |
| Bytes del HTML de `/es`           | 58.972                     | **72.355**                     |

```bash
curl -s localhost:3210/es | grep -o '<h[1-6][^>]*>' | sed 's/ class=.*//' | sort | uniq -c
```

**Las cinco preguntas, respondidas en el HTML servido** (`curl` sin navegador,
así que sin una línea de JavaScript ejecutada):

| Pregunta                                     | Dónde la responde                                                              | `grep` |
| -------------------------------------------- | ------------------------------------------------------------------------------ | ------ |
| ¿Quién responde de este sitio?               | §«Quién responde de este sitio», con el nombre y la ciudad del responsable     | 3      |
| ¿Qué hace Talpass?                           | hero + §«Cómo funciona», cuatro pasos                                          | 2      |
| ¿Me van a cobrar?                            | nota del hero + §«Qué te cuesta esto»                                          | 3      |
| ¿Qué pasa con mis documentos y quién los ve? | §«Qué ve una agencia de ti, y qué no», dos listas + enlace al legal            | 2      |
| ¿A dónde lleva cada botón?                   | los rótulos dicen el destino: «Ver qué se paga en Alemania», «Crear mi cuenta» | —      |

El nombre del responsable (`José Ulises Suárez Victoria`) sale **3 veces** en el
HTML: la home, el pie y el enlace al Impressum. Sale de `config/controller.ts`,
no del copy.

## C · Cabeceras: caché y sesión sin regresión (ADR-11, ADR-13)

**15 / 15 públicas** con `x-nextjs-cache: HIT`, **sin** `x-ett-session-checked`
y **sin** `Set-Cookie`:

```
/es /en /es/ofertas /en/jobs /es/oportunidades /en/opportunities
/es/oportunidades/alemania/logistica /en/opportunities/germany/logistics
/es/trabajo/alemania /en/work/germany /es/trabajo/alemania/logistica
/es/trabajo/ciudad/berlin /es/legal /es/legal/privacidad
/es/ofertas/logistica-hamburgo
```

**5 / 5 privadas** en 307 con `x-ett-session-checked: 1`: `/es/cuenta`,
`/es/completar-perfil`, `/es/admin`, `/es/agency`, `/en/account`.

La home sigue siendo estática **aunque ahora consulte la base de datos**: la
lectura va por `lib/supabase/public`, que no toca cookies, y la página declara
`revalidate = 3600` como el resto de `(public)`.

## D · Las cinco páginas de `(auth)`

| Ruta                   | `<title>`                                            | Canónica | `robots`            |
| ---------------------- | ---------------------------------------------------- | -------- | ------------------- |
| `/es/registro`         | Crear tu cuenta en Talpass                           | sí       | `noindex, nofollow` |
| `/es/entrar`           | Entrar en Talpass                                    | sí       | `noindex, nofollow` |
| `/es/recuperar-acceso` | Recuperar el acceso a tu cuenta de Talpass           | sí       | `noindex, nofollow` |
| `/es/nueva-contrasena` | Elegir una contraseña nueva en Talpass               | sí       | `noindex, nofollow` |
| `/es/revisa-tu-correo` | Confirma tu correo para activar tu cuenta de Talpass | sí       | `noindex, nofollow` |
| `/en/signup`           | Create your Talpass account                          | sí       | `noindex, nofollow` |
| `/en/login`            | Sign in to Talpass                                   | sí       | `noindex, nofollow` |
| `/en/forgot-password`  | Recover access to your Talpass account               | sí       | `noindex, nofollow` |
| `/en/reset-password`   | Choose a new password on Talpass                     | sí       | `noindex, nofollow` |
| `/en/check-email`      | Confirm your email to activate your Talpass account  | sí       | `noindex, nofollow` |

Antes, las diez servían el título y la descripción de la home y **ninguna tenía
canónica**.

📝 **Anotado, no arreglado:** el prompt y la auditoría dicen que el layout de
`(auth)` fija `noindex, follow`. Lo que fija de verdad es
`robots: { index: false, follow: false }`, o sea `noindex, nofollow`, y así se
servía ya antes de esta fase. No se toca aquí porque cambiarlo altera cómo
rastrea Google unas páginas que esta fase no viene a tocar, pero **la
documentación dice una cosa y el código otra** y alguien tiene que decidirlo.

## E · 390×844 sin desbordamiento horizontal

Medido comparando `document.documentElement.scrollWidth` con
`clientWidth`, no a ojo:

| Página                                 | Antes            | Ahora            |
| -------------------------------------- | ---------------- | ---------------- |
| `/es`                                  | **453 / 390** 🔴 | **390 / 390** ✅ |
| `/es/registro`                         | —                | **390 / 390** ✅ |
| `/es/oportunidades/alemania/logistica` | —                | **390 / 390** ✅ |

**La causa estaba localizada y era una sola:** el `div` de la cabecera
(`flex items-center gap-4`) medía 365 px de contenido y llegaba a `right: 453`.
De esos, **135 px eran el selector de idioma** escribiendo «Español» y
«English» enteros.

El arreglo son dos cosas, y ninguna es un menú desplegable: la fila envuelve
(`flex-wrap` + `min-h-14` en vez de `h-14`) y el selector enseña `ES`/`EN` con
el nombre completo en `sr-only` para quien navega con lector de pantalla. Un
menú habría exigido JavaScript y estado en la cabecera de **todas** las páginas
públicas, que son estáticas a propósito (ADR-11).

**Comprobado también a 320 px**, que es más estrecho que cualquier móvil del
mercado: `320 / 320`, sin desbordamiento; la cabecera envuelve a tres filas y
mide 97 px. A 390 px cabe en una sola fila y mide **57 px**, uno más que antes.

Capturas en `capturas/`: `390-home-es.png`, `390-registro-es.png`,
`390-oportunidad-es.png`. Están tomadas contra el **build de producción**
(`start:local`), no contra `next dev`, para que no salga el indicador de
desarrollo encima del contenido.

## F · Calidad

| Comprobación                                   | Resultado                                |
| ---------------------------------------------- | ---------------------------------------- |
| `pnpm typecheck`                               | limpio                                   |
| `pnpm lint`                                    | limpio                                   |
| `pnpm format:check`                            | **limpio** (antes fallaba por 1 fichero) |
| `pnpm test:security`                           | **64 / 64**                              |
| `pnpm test:security:drill`                     | rojo y de vuelta al verde, salida 0      |
| `parity.mjs messages/es.json messages/en.json` | 479 claves, 0 divergencias               |
| `parity.mjs messages/home/es.json …/en.json`   | **43 claves, 0 divergencias**            |
| `parity.mjs messages/legal/es.json …/en.json`  | 188 claves, 0 divergencias               |
