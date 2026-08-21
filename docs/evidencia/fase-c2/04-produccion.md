# 04 · Producción — desplegada, y el primer despliegue rompió el 307

> **2026-08-21.** Desplegado con `pnpm exec vercel --prod`.
>
> **`dpl_Anm4HViZFm9NMxdX6sDc5TSBjSrp`** · Ready · aliased a `talpass.eu`,
> `www.talpass.eu` y `ettrecruiter.vercel.app` · funciones en **`dub1`**.
>
> Leído de `pnpm exec vercel inspect talpass.eu`, **no del que devolvió el
> despliegue**, y **antes** de mirar ninguna cabecera.
>
> ⚠️ Acredita esta verificación con fecha, **no lo que se sirve hoy**. En cuanto
> alguien redespliegue, el alias se mueve.

---

## 🔴 A · Hubo que desplegar dos veces, y esto es lo importante de la sesión

**El primer despliegue (`dpl_E4dYQr1PmY8mWnZ4EoYK8Sf8YQ3f`) pasó todas las
comprobaciones locales y aun así rompió el control negativo de ADR-11 y
ADR-13.**

| Qué                     | C1      | Primer despliegue C2                         | Tras el arreglo |
| ----------------------- | ------- | -------------------------------------------- | --------------- |
| `/es/cuenta` sin sesión | **307** | **200** 🔴 + `meta refresh`, 57 KB de cuerpo | **307** ✅      |

**La causa.** El `loading.tsx` que traía esta fase estaba en `[locale]`, por
encima de todo `(private)`. Una frontera de `Suspense` hace que Next **confirme
el 200 y empiece a emitir el cuerpo antes de ejecutar la página**, así que el
`redirect()` de `requireCandidate` —que vive dentro de la página— ya no podía
fijar un código de estado y degradaba a
`<meta http-equiv="refresh" content="1;url=/es/entrar">`.

**No hubo fuga de datos.** Lo que viajaba en esos 57 KB eran las **plantillas**
de `messages/es.json` que `NextIntlClientProvider` serializa en todas las
páginas (el problema conocido de ADR-37): cadenas como `Hola, {name}` con el
marcador literal, no datos de nadie. El `noindex, nofollow` estaba intacto.

**El daño real** era otro: un visitante sin sesión se llevaba 57 KB y **un
segundo mirando el esqueleto de una pantalla que no iba a ver**, y la
redirección pasaba a depender del cuerpo en vez de la capa HTTP.

**Arreglado** moviendo el estado de carga a `(public)/loading.tsx`, donde
ninguna ruta redirige. **ADR-41**, con el arreglo de verdad anotado y el coste
asumido: `(private)` se queda sin estado de carga.

👉 **La lección de método:** esto **no se caza mirando la pantalla** —el usuario
acababa en el mismo sitio— ni con una prueba, ni con el LCP, ni con las 60
comprobaciones de maquetación. Se caza mirando el **código de estado**, y solo
apareció al verificar contra producción.

## B · Caché y sesión, tras el arreglo

**15 / 15 públicas** a 200 con `x-vercel-cache` + `x-nextjs-prerender: 1`,
**sin** `x-ett-session-checked` y **sin** `Set-Cookie`. En `es` y `en`:
home, oportunidades, un perfil, ofertas, los legales y las de `(auth)`.

**Control negativo intacto en las tres rutas privadas:**

| Ruta          | Código  | `x-ett-session-checked` | Región   |
| ------------- | ------- | ----------------------- | -------- |
| `/es/cuenta`  | **307** | 1                       | **dub1** |
| `/es/admin`   | **307** | 1                       | **dub1** |
| `/en/account` | **307** | 1                       | **dub1** |

`meta refresh` en el cuerpo de `/es/cuenta`: **0**. ADR-11, ADR-13 y ADR-32 en
pie.

## C · La tipografía, servida desde el borde

```
<link rel="preload" href="/_next/static/immutable/media/GeneralSans_Regular-s.p.25yjfdw5omr67.woff2"
      as="font" crossorigin="" type="font/woff2"/>
```

| Qué                             | Valor                                    |
| ------------------------------- | ---------------------------------------- |
| Peticiones de fuente en el HTML | **1**                                    |
| `content-length`                | **23.904 B** — el fichero oficial exacto |
| `cache-control`                 | `public,max-age=31536000,immutable`      |
| `x-vercel-cache` del `.woff2`   | **HIT**                                  |
| Rastros de Geist en el HTML     | **0**                                    |

Y los tokens de marca, en el CSS que sirve el borde:
`--brand:#0d9488` · `--brand-strong:#0f766e` · `--brand-soft:#f0fdfa` ·
`--brand-accent:#f97316` · `--brand-accent-ink:#0f172a` ·
`--brand-accent-strong:#c2410c` · `--brand-accent-soft:#fff7ed`.
**Colores en línea dentro del HTML: 0.** ADR-12 y ADR-38 en pie.

Medido en el navegador contra el sitio vivo a 390 px: `scrollWidth` **390** =
`clientWidth` **390**, botón principal de **44 px** de alto, cuerpo a **16 px**
resuelto, y `font-family` resuelto a `generalSans`. Captura:
`capturas/390-home-produccion.png`.

## D · La C1 sigue en pie, y el SEO no se ha movido

| Qué                           | C1    | Ahora                        |
| ----------------------------- | ----- | ---------------------------- |
| Encabezados de la home        | 1/5/6 | **1 `h1`, 5 `h2`, 6 `h3`**   |
| «Fase de construcción»        | 0     | **0**                        |
| `/es/ofertas` en el cuerpo    | ×1    | **×1**                       |
| `/es/oportunidades`           | ×3    | **×3**                       |
| `JobPosting` en oportunidades | 0     | **0** (5 páginas `es`)       |
| URLs en el sitemap            | 13    | **13**                       |
| `xhtml:link`                  | 39    | **39**                       |
| `robots.txt` con `Disallow`   | 14    | **14**                       |
| `www` → apex                  | 308   | **308**                      |
| `(auth)` título + canónica    | 10/10 | **con `noindex, nofollow`**  |
| `/es/trabajo/**`              | 404   | **404** — ADR-23, 0 vacantes |

Y **ADR-35 funcionando contra la base real**: en producción hay 0 vacantes, así
que la home dice «Hoy no hay ninguna vacante publicada» y el botón primario va a
`/oportunidades`. En local, con 3 sembradas, la misma home dice «Hoy hay 3
vacantes publicadas» y el primario va a `/ofertas`. Nadie ha tocado el copy.

## ⚠️ E · Rendimiento en producción: medido, pero esta noche no es concluyente

Con el **borde caliente** (`HIT` comprobado en las seis antes de la primera
pasada), mediana de 3, y en las dos dudosas mediana de **7**:

| Página                | C1 (2026-08-20) | C2, 7 pasadas | Distribución           |
| --------------------- | --------------- | ------------- | ---------------------- |
| Home `/es`            | 100             | **98**        | 96,98,98,98,98,100,100 |
| Una oportunidad       | 100             | **86**        | 83,83,86,86,94,99,100  |
| Listado oportunidades | 100             | 98 (3)        | 98,98,98               |
| Registro              | 98              | **98** (3)    | 98,98,98               |
| `/es/ofertas`         | 99              | 98 (3)        | 93,98,98               |

**🔴 Esta tabla no permite concluir nada, y hay que decirlo en vez de
maquillarlo.** Dos motivos:

1. **La columna de la C1 es de otro día y de otra sesión de red.** El método de
   §6 del prompt exige comparar contra el árbol de justo antes **medido el mismo
   día y en la misma máquina**, y eso contra producción no se pudo hacer: los
   despliegues anteriores están tras la protección de Vercel y responden **302**
   a una petición anónima, así que Lighthouse no los puede medir.
2. **El instrumento tiene demasiado ruido esta noche.** `una-oportunidad` da un
   rango de **17 puntos sobre el mismo build y la misma URL**. Desglosando las
   siete pasadas, **FCP (0,94 s) y TTFB (19 ms) son constantes** y lo único que
   oscila es el LCP, entre 1,71 y 2,88 s. Con el servidor respondiendo igual en
   todas, la varianza está en la **estimación de ancho de banda de Lighthouse**,
   no en el sitio.

👉 **El veredicto de rendimiento de esta fase se apoya en la medición local**,
que es la que cumple §6: mismo día, misma máquina, los dos árboles, mediana de 5
(7 en `landing`), y **las seis páginas empatan**. Está en `02-rendimiento.md`.

👉 **Pendiente, y es barato:** volver a pasar Lighthouse contra producción en
una hora tranquila. Si `una-oportunidad` sigue en 86 con FCP y TTFB constantes,
entonces sí hay algo que mirar; si sube a 98–100 como la home, era la red.
