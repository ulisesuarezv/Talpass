# 03 · Rendimiento — la puerta dura, y por qué hubo que cambiar el método

> **Medición: 2026-08-20.** Misma configuración de Lighthouse que la línea base
> del 2026-08-18 (`03-rendimiento.md` de la auditoría previa): CLI oficial vía
> `pnpm dlx lighthouse@12`, solo `performance`, `--form-factor=mobile`,
> `--screenEmulation.mobile`, `--throttling-method=simulate`, Chrome de
> escritorio en `--headless=new`. Misma máquina.

---

## 🔴 Lo primero: una pasada por página no sirve para cerrar esta fase

La línea base se midió con **1 ejecución por página**. Con ese método esta fase
no se puede cerrar, y no es una opinión: **midiendo el mismo build dos veces
seguidas salen notas distintas**.

La primera vuelta de esta sesión, una pasada por página, dio esto:

| Build              | home | oport. | una oport. | registro | ofertas | landing |
| ------------------ | ---- | ------ | ---------- | -------- | ------- | ------- |
| C1, primera pasada | 97   | 97     | 96         | 96       | 96      | 99      |
| C1, segunda pasada | 99   | 97     | 96         | 98       | 99      | 96      |

La misma página, el mismo build, la misma máquina: **`landing` 99 y luego 96**,
`ofertas` 96 y luego 99. El LCP salta entre 2,0 s y 2,8 s en valores discretos.
La banda de ruido es de **±3 puntos**, o sea más ancha que cualquier diferencia
que esta fase pudiera provocar.

**Consecuencia:** todas las cifras de abajo son **mediana de 3 pasadas**, y las
dos páginas donde la diferencia parecía real se remiden con **7 pasadas**. El
método de una pasada de la auditoría queda **desautorizado para comparar**; sus
números siguen valiendo como orden de magnitud, no como término de comparación
exacto.

## Y lo segundo: contra qué se compara

La línea base es del **2026-08-18**, y entre esa fecha y hoy entró la fase de
textos legales (2026-08-19), que añadió 12 rutas y engordó `messages/`. Comparar
la C1 contra el 18 mezclaría dos fases en una cifra.

Así que se mide **la misma máquina, el mismo día y el mismo método** en dos
árboles: `d324cab` (lo que había justo antes de esta fase) y `72136a4` (la C1).
Esa es la comparación que decide si la fase empeora algo.

## Mediana de 3 pasadas, local (`localhost:3210`)

| Página                  | 2026-08-18 | **Antes de C1** (`d324cab`) | **C1** (`72136a4`) | Veredicto |
| ----------------------- | ---------- | --------------------------- | ------------------ | --------- |
| Home `/es`              | 99         | **97** (97/97/97)           | **97** (97/97/99)  | igual     |
| Listado oportunidades   | 99         | **97** (97/97/99)           | **97** (97/97/99)  | igual     |
| Una oportunidad         | 99         | **98** (96/98/99)           | **99** (96/99/99)  | +1        |
| Registro                | 97         | **98** (96/98/98)           | **96** (96/96/96)  | ver abajo |
| `/es/ofertas`           | 99         | **98** (96/98/98)           | **96** (96/96/96)  | ver abajo |
| Landing `/es/trabajo/…` | 99         | **96** (96/96/99)           | **96** (96/96/99)  | igual     |

Entre paréntesis, las tres pasadas ordenadas. TBT **6–9 ms** y CLS **0,001** en
todas, las dos versiones.

**Ninguna página de la columna de hoy llega a la de la auditoría del 18** — ni
siquiera las que esta fase no toca, y el árbol de antes de la C1 tampoco. Eso no
lo ha hecho la C1: o es la máquina, o es lo que entró el 19.

## Las dos dudosas, con 7 pasadas

| Página         | Antes de C1 (`d324cab`)               | C1 (`72136a4`)                            |
| -------------- | ------------------------------------- | ----------------------------------------- |
| `/es/registro` | mediana **98** — 96,96,96,98,98,98,98 | mediana **98** — 96,96,96,98,98,98,**99** |
| `/es/ofertas`  | mediana **96** — 96,96,96,96,98,98,98 | mediana **98** — 96,96,96,98,98,98,98     |

**La misma distribución bimodal en 96/98 en las dos versiones.** La caída de dos
puntos de la tabla anterior era la mediana de tres muestras cayendo del lado
malo; con siete, `registro` empata y `ofertas` sale **mejor** con la C1.

**Veredicto: ninguna página de rendimiento empeora.** Y no es que salga por los
pelos: la home, que es la página que esta fase reescribe entera, mide igual.

## Por qué mide igual una home que pesa 13 KB más

El HTML de `/es` pasa de **58.972 a 72.355 bytes**. Que eso no cueste puntos no
es suerte, es una decisión que hubo que tomar **a mitad de la fase y porque la
medición la obligó**.

En la primera versión, el copy nuevo de la home vivía en
`messages/<locale>.json`. `NextIntlClientProvider` serializa ese fichero
**entero** en el HTML de **todas** las páginas (el problema que ADR-33 dejó
anotado y sin resolver), así que 3,8 KB de argumentario de confianza viajaban
también a `/es/ofertas`, a cada oportunidad y a cada landing, donde nadie los
pinta.

El copy se movió a `messages/home/`, cargado con `createTranslator` desde un
módulo `server-only` (`src/lib/home.ts`), igual que los textos legales. La home
es un Server Component entero: nada de eso necesita llegar al navegador. Es
**ADR-37**.

| Página              | HTML antes de C1 | HTML con C1 |
| ------------------- | ---------------- | ----------- |
| `/es`               | 58.972           | **72.355**  |
| `/es/oportunidades` | 102.941          | 103.615     |
| `/es/registro`      | 61.109           | 63.914      |

Las dos últimas crecen ~1–3 KB y no 4: lo que suman los metadatos nuevos de
`(auth)` y el marcado de la cabecera, menos lo que deja de viajar el copy de la
home.

## Lo que hay que seguir vigilando, y es lo mismo que decía la auditoría

**No es la nota, es el LCP.** La mediana está en 2,4–2,8 s y el umbral «bueno»
de Core Web Vitals es **2,5 s**: casi todo el sitio está justo en el borde, y ya
lo estaba antes de esta fase. La C2 trae **una fuente nueva** (General Sans,
local, que no está en Google Fonts). Una fuente en el camino crítico es
exactamente lo que cruza ese borde sin que la nota baje mucho.

👉 **Para la sesión de la C2:** medir con mediana de 3 como mínimo, y mirar el
LCP antes que la nota.
