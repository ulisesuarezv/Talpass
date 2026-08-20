# 02 · Producción — desplegado, aliased y verificado

> **Medición: 2026-08-20.** Desplegado con `pnpm exec vercel --prod`.
>
> **`dpl_64afKgpF4rDcxSRGVvfkKUMXzKFv`** · Ready · aliased a `talpass.eu`,
> `www.talpass.eu` y `ettrecruiter.vercel.app` · funciones en **`dub1`**.
>
> El identificador está leído de `pnpm exec vercel inspect talpass.eu`, **no del
> que devolvió el despliegue**, y se leyó **antes** de mirar ninguna cabecera.
>
> ⚠️ **Y acredita esta verificación con fecha, no lo que se sirve hoy.** En
> cuanto alguien redespliegue, el alias se mueve. Para saber cuál está vivo se
> ejecuta el comando; escribir aquí «el que sirve es X» ha envejecido mal tres
> veces en dos días.
>
> 📝 El log del build dice `Running build in Washington, D.C. – iad1`. **Eso es
> la máquina que compila, no dónde corren las funciones**, que salen en `dub1`
> en el `inspect`. ADR-32 sigue en pie.

---

## A · Lo que ve el candidato

| Qué                            | Antes                                      | Ahora                                                   |
| ------------------------------ | ------------------------------------------ | ------------------------------------------------------- |
| Encabezados de la home         | 1 `h1`, **0 `h2`**                         | **1 `h1`, 5 `h2`, 6 `h3`**                              |
| «Fase de construcción»         | presente, y era **lo primero que se leía** | **0 apariciones**                                       |
| Botón primario                 | «Ver ofertas» → `/es/ofertas` (**vacía**)  | «Ver qué se paga en Alemania» → **`/es/oportunidades`** |
| `/es/ofertas` en el HTML       | **×2** en el cuerpo + 1 en la cabecera     | **×1**, y es la de la cabecera                          |
| `/es/oportunidades` en el HTML | ×1, como enlace secundario                 | **×3**: cabecera, botón primario y enlace del estado    |

La jerarquía está invertida respecto a como estaba, que es exactamente lo que
decide ADR-36. Y el párrafo que cuenta el estado dice, en el sitio vivo:

> «Hoy no hay ninguna vacante publicada en Talpass: se están cerrando los
> primeros acuerdos con agencias en Alemania. Está escrito aquí, y no escondido,
> porque enterarte después sería peor.»

No lo dice un `if` de copy: lo dice porque `listPublishedJobs` devuelve 0
(ADR-35). En local, con 3 vacantes sembradas, la misma home dice «Hoy hay 3
vacantes publicadas» y el botón primario apunta a `/ofertas`.

**Ancho a 390×844 contra el sitio vivo:** `scrollWidth` **390** = `clientWidth`
**390**, cabecera **57 px** en una sola fila. Captura:
`capturas/390-home-es-produccion.png`.

## B · Las diez páginas de `(auth)`

Las diez sirven **título y descripción propios** en `es` y `en`, **con canónica
al apex** y **conservando el `noindex`**. Antes servían el título y la
descripción de la home y ninguna tenía canónica (hallazgo 7).

| Ruta                   | `<title>`                                            |
| ---------------------- | ---------------------------------------------------- |
| `/es/registro`         | Crear tu cuenta en Talpass                           |
| `/es/entrar`           | Entrar en Talpass                                    |
| `/es/recuperar-acceso` | Recuperar el acceso a tu cuenta de Talpass           |
| `/es/nueva-contrasena` | Elegir una contraseña nueva en Talpass               |
| `/es/revisa-tu-correo` | Confirma tu correo para activar tu cuenta de Talpass |
| `/en/signup`           | Create your Talpass account                          |
| `/en/login`            | Sign in to Talpass                                   |
| `/en/forgot-password`  | Recover access to your Talpass account               |
| `/en/reset-password`   | Choose a new password on Talpass                     |
| `/en/check-email`      | Confirm your email to activate your Talpass account  |

## C · Caché y sesión: ADR-11 y ADR-13 sin regresión

**15 / 15 públicas** con `x-vercel-cache` + `x-nextjs-prerender: 1`, **sin**
`x-ett-session-checked` y **sin** `Set-Cookie`. Incluida la home, que ahora
consulta la base de datos: la lectura va por `lib/supabase/public`, que no toca
cookies.

**Control negativo intacto:** `/es/cuenta` responde **307** con
`x-ett-session-checked: 1` y `x-vercel-id: fra1::dub1::…` — la función en
Dublín.

Justo después de desplegar casi todas dieron `PRERENDER` en vez de `HIT`, que es
el borde frío y no una regresión. A los pocos minutos, `HIT`.

## D · SEO sin cambios no buscados

| Qué                           | Antes                      | Ahora                        |
| ----------------------------- | -------------------------- | ---------------------------- |
| URLs en el sitemap            | 13                         | **13**                       |
| `xhtml:link`                  | 39                         | **39**                       |
| `robots.txt`                  | `Allow: /` + 14 `Disallow` | **igual**                    |
| Canónicas del apex            | 8 / 8                      | **8 / 8**                    |
| `hreflang` con `x-default`    | 4 / 4                      | **4 / 4**                    |
| `www` → apex                  | 308                        | **308**                      |
| `JobPosting` en oportunidades | 0                          | **0** (10 / 10 páginas)      |
| `/es/trabajo/**`              | 404                        | **404** — ADR-23, 0 vacantes |

## E · Lighthouse móvil en producción — mediana de 3, con el borde caliente

| Página                | 2026-08-18 | **Hoy**    | FCP   | LCP   | TBT   | CLS   |
| --------------------- | ---------- | ---------- | ----- | ----- | ----- | ----- |
| Home `/es`            | 97         | **100**    | 1,0 s | 1,8 s | 9 ms  | 0,001 |
| Listado oportunidades | 98         | **100**    | 1,0 s | 1,5 s | 6 ms  | 0,000 |
| Una oportunidad       | 100        | **100**    | 1,0 s | 1,7 s | 9 ms  | 0,001 |
| Registro              | 98         | **98**     | 1,0 s | 2,4 s | 10 ms | 0,001 |
| `/es/ofertas`         | 97         | **99**     | 0,9 s | 2,1 s | 13 ms | 0,001 |
| Landing               | n.d. (404) | n.d. (404) | —     | —     | —     | —     |

**Ninguna empeora. Cuatro mejoran**, incluida la home, que es la que se
reescribió entera.

### 🔴 Y aquí hay una segunda trampa de método, que la C2 hereda

La primera tanda salió con `/es/oportunidades` en **93**, cinco puntos por debajo
de la línea base, y con las tres pasadas de acuerdo entre sí (93/93/94), o sea
que no parecía ruido.

**Era el borde frío.** El prompt de esta fase avisaba de que justo después de
desplegar se ve `PRERENDER` en vez de `HIT`, y resulta que **eso también se
paga en Lighthouse**. Las ocho pasadas seguidas de esa página, en orden:

```
93, 94, 93, 96, 100, 98, 100, 100
```

Las tres primeras son el borde frío. Con el borde ya caliente la mediana es
**100** y el LCP baja de 2,9 s a 1,5 s.

👉 **Para la C2 y para cualquier medición de producción: calentar el borde antes
de medir** —tres `curl` bastan— y comprobar que responde `HIT`. Medir a los diez
segundos de desplegar produce una regresión que no existe.
