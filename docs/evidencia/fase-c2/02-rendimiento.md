# 02 · Rendimiento — la puerta dura, y las seis configuraciones que hubo que medir

> **Medición: 2026-08-20.** Mismo método que la C1: CLI oficial vía
> `pnpm dlx lighthouse@12`, solo `performance`, `--form-factor=mobile`,
> `--screenEmulation.mobile`, `--throttling-method=simulate`, Chrome de
> escritorio en `--headless=new`. Build de producción contra la base local, en
> `localhost:3210`. **Misma máquina y mismo día** para las dos columnas.

## El resultado, primero

**Ninguna página empeora, ni en nota ni en LCP.** Mediana de **3 pasadas** en la
línea base y de **5** en la C2; `landing` se remidió con **7** por la razón que
se explica más abajo.

| Página                  | Antes de la C2 (`14d82ec`) | **C2**              | Veredicto |
| ----------------------- | -------------------------- | ------------------- | --------- |
| Home `/es`              | 97 · LCP **2,63 s**        | **97 · 2,62 s**     | igual     |
| Listado oportunidades   | 97 · LCP **2,62 s**        | **97 · 2,62 s**     | igual     |
| Una oportunidad         | 96 · LCP **2,77 s**        | **96 · 2,77 s**     | igual     |
| Registro                | 96 · LCP **2,77 s**        | **96 · 2,77 s**     | igual     |
| `/es/ofertas`           | 96 · LCP **2,80 s**        | **96 · 2,78 s**     | igual     |
| Landing `/es/trabajo/…` | 96 · LCP **2,77 s**        | **96 · 2,78 s** (7) | igual     |

Y **la fuente entra abaratando la ruta crítica**: la petición de tipografía
preacargada pasa de **29.288 B** (Geist `latin`) a **23.904 B** (General Sans
Regular).

## 🔴 Pero la primera versión de la fase suspendía, y por 3–4 puntos

Con todo lo que la fase quería —el color, la escala tipográfica, los 15 px, los
botones grandes, el naranja, la tipografía variable y los estados de carga y
error— el resultado fue este:

| Página                | Antes       | Primera versión C2 |
| --------------------- | ----------- | ------------------ |
| Home                  | 97 · 2,63 s | **93 · 2,78 s**    |
| Listado oportunidades | 97 · 2,62 s | **93 · 2,78 s**    |
| Una oportunidad       | 96 · 2,77 s | **93 · 2,78 s**    |
| Registro              | 96 · 2,77 s | **92 · 2,93 s**    |
| `/es/ofertas`         | 96 · 2,80 s | **92 · 2,93 s**    |
| Landing               | 96 · 2,77 s | **93 · 2,79 s**    |

**Y no era ruido.** Las tres pasadas de cada página estaban de acuerdo entre sí
y las distribuciones no se solapaban con las de la línea base. El total de red
subía de **378.535 a 393.292 B** y las peticiones de **27 a 30**.

## Bisección: qué costaba y qué no

Se midieron las piezas por separado, **mediana de 5 pasadas** cada una, sobre
`/es` y `/es/registro`, que son la página más importante y la más pesada.

| #   | Configuración                                                | Home            | Registro        |
| --- | ------------------------------------------------------------ | --------------- | --------------- |
| —   | **Línea base** (Geist, sin estados)                          | 97 · 2,63 s     | 96 · 2,77 s     |
| A   | C2 completa, fuente variable **sin preacargar**              | 93 · 2,77 s     | **86** · 2,93 s |
| B   | C2 con fuente variable, **sin `loading.tsx` ni `error.tsx`** | 93 · 2,77 s     | 93 · 2,77 s     |
| C   | C2 **con Geist**, sin estados                                | **97 · 2,62 s** | **96 · 2,77 s** |
| D   | C2 con **General Sans Regular** (23,9 KB), sin estados       | **97 · 2,62 s** | **96 · 2,77 s** |
| E   | Regular + Semibold, **las dos preacargadas** (48,2 KB)       | 93 · 2,78 s     | 92 · 2,92 s     |
| F   | Regular preacargada + **Semibold diferida**                  | 96 · 2,77 s     | 95 · 2,93 s     |
| —   | **D + los estados, versión de cliente**                      | 96 · 2,77 s     | 96 · 2,77 s     |
| ✅  | **D + los estados sin JavaScript** ← lo que se despliega     | **97 · 2,62 s** | **96 · 2,78 s** |

### Lo que enseña, y no es lo que uno supone

**1. El color, la escala tipográfica, los 15 px de cuerpo, los botones de 44 px
y los acentos de marca cuestan exactamente cero.** La fila C es la C2 entera
—paleta, tipografía de escala, componentes, acentos— con la fuente vieja, y da
**el número de la línea base, clavado**. Todo el coste de la fase venía de dos
sitios, y ninguno era el diseño.

**2. Lo que cuesta puntos son los bytes en la ruta crítica, no las peticiones.**
Un fichero variable de **38 KB** (primera versión) cuesta lo mismo que **dos**
ficheros que suman 48 KB (fila E). El umbral cae **entre los 29 KB de Geist y
los 38 del variable**. Diferir la Semibold (fila F) recupera parte pero **sigue
empeorando el LCP en las dos páginas**.

**3. Quitar el `preload` de la fuente lo empeora, no lo mejora.** Fila A:
`registro` se desploma a **86**. La fuente se descubre tarde y el texto tarda
más en asentarse. La intuición de «si la saco del camino crítico irá más
rápido» es falsa aquí.

**4. Un `loading.tsx` se paga en todas las páginas, se vea o no.** Ver §
siguiente.

## 🔴 Los dos costes de los ficheros de convención

`loading.tsx` y `error.tsx` cuelgan del árbol `[locale]`, así que entran en el
paquete de **todas** las páginas. Las dos versiones obvias costaron algo.

**Versión 1 — `PageLoading` como Server Component con `getTranslations`:**
el build pasó de **26 rutas prerenderizadas a 0**. Un `loading.tsx` no recibe
`params`, así que no puede llamar a `setRequestLocale`; sin eso `getTranslations`
lee cabeceras, y leer cabeceras ahí vuelve dinámico todo el árbol. Se fueron el
ISR, el caché del CDN y el SEO (ADR-11, ADR-13). **Esto no lo caza el LCP: se ve
mirando la tabla de rutas del build y encontrando `ƒ` donde había `●`.**

**Versión 2 — `PageLoading` como Client Component con `useTranslations`:**
vuelven las 26 rutas, pero el fichero se lleva un `chunk` propio al paquete de
todas las páginas. Medido en la home: **el JavaScript pasa de 257.250 a 261.384 B
y las peticiones de 28 a 30**. Coste: **1 punto y 0,14 s de LCP** (fila «versión
de cliente» de la tabla: home 96 · 2,77 frente a 97 · 2,62).

**Versión 3, la que va — sin JavaScript ninguno.** La región de estado toma su
nombre accesible con `aria-labelledby` de una etiqueta que pinta el **layout**,
que sí tiene el idioma. El lector de pantalla sigue diciendo «Cargando…» en su
idioma y el componente vuelve a ser Server Component puro. La home recupera
**97 · 2,62 s**. Y `error.tsx` —que sí tiene que ser cliente, es el contrato de
Next— deja de importar el `Link` de `@/i18n/navigation` y usa un `<a>` pelado,
que además es lo correcto al recuperarse de un fallo. **ADR-40.**

## La regla de la mediana, otra vez, y otra vez hizo falta

En la tanda de 5 pasadas de la C2, `landing` salió `88,88,88,96,96` con el LCP
saltando entre **2,77 y 3,77 s**. Es la misma distribución bimodal que documentó
la C1, y en esa misma tanda `oportunidades`, `una oportunidad` y `ofertas` dieron
pasadas sueltas de **77 y 78** — señal de que la máquina tenía ruido.

Remedida con **7 pasadas**: `87,88,95,96,96,96,96` → **mediana 96**, con LCP
`2,77 · 2,77 · 2,77 · 2,78 · 2,87 · 3,78 · 3,83` → **mediana 2,78 s**. Empata
con la línea base.

👉 **Sigue valiendo la regla de la C1, reforzada:** mediana de 3 como mínimo, y
cuando dos versiones parezcan diferir, 7 y se enseña la distribución. Una pasada
no vale para nada.

## Lo que hay que seguir vigilando

**El LCP sigue en 2,6–2,8 s con el umbral «bueno» de Core Web Vitals en 2,5**, y
esta fase no lo ha movido en ninguna dirección. **El sitio sigue justo en el
borde y ya lo estaba antes de la C1.** No es un problema que traiga el diseño: es
el coste base del árbol de JavaScript que se sirve: el bloque más gordo con
diferencia son los **257 KB de `Script`** que salen en la tabla de red, cuatro
veces lo que pesa todo lo demás junto.

👉 **Para quien venga después:** el siguiente punto de rendimiento no está en el
CSS ni en la tipografía, está en acotar qué se serializa al cliente. Los 37 KB
de `messages/<locale>.json` que viajan enteros a todas las páginas (anotado en
ADR-37 y sin resolver) son el hilo del que tirar.
