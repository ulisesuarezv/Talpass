# 03 · Rendimiento — la cifra que el rediseño no puede empeorar

> **Medición: 2026-08-18.**

---

## La configuración exacta, para que se pueda repetir

Lighthouse **no está instalado en el proyecto**. Se ha usado la CLI oficial vía
`pnpm dlx`, sin añadir dependencia al repositorio:

```bash
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

pnpm dlx lighthouse@12 "<URL>" \
  --only-categories=performance \
  --form-factor=mobile \
  --screenEmulation.mobile \
  --throttling-method=simulate \
  --output=json --output-path=lh.json \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu" --quiet
```

| Parámetro              | Valor                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Lighthouse             | **12.8.2**                                                                                                          |
| Chrome                 | Google Chrome de escritorio, `--headless=new`                                                                       |
| Categoría              | solo `performance`                                                                                                  |
| Form factor            | **mobile**, con emulación de pantalla móvil                                                                         |
| Estrangulamiento       | **`simulate`** — el preset móvil por defecto de Lighthouse: RTT 150 ms, 1.638,4 kbps, CPU ×4 (equivale a «Slow 4G») |
| Ejecuciones por página | **1** (sin mediana de varias pasadas)                                                                               |
| Máquina                | macOS, la del desarrollo                                                                                            |

### 🔴 Aviso sobre la comparabilidad con la fase 3

La instrucción era «la misma configuración con la que se midió la fase 3». **Esa
configuración no está escrita en ninguna parte.** `docs/02-ROADMAP.md:238` y
`docs/ESTADO.md:478` dicen solo «Lighthouse, 4G» y dan las notas 97/95/97 con
FCP 0,8 s · LCP 2,6 s · TBT 10 ms · CLS 0,001 — sin herramienta, sin versión,
sin comando y sin decir si fue contra local o contra producción.

Es exactamente lo que la regla 5 de esta auditoría prohíbe, y por eso **la
configuración de arriba pasa a ser la línea base oficial**: es la primera que se
puede repetir. Los números de la fase 3 se conservan abajo como referencia
histórica, no como término de comparación estricto.

> Pista de que la fase 3 midió con este mismo preset: el CLS de 0,001 y el TBT
> de 10 ms coinciden con lo que sale hoy, y el FCP de 0,8–0,9 s también.

---

## Las seis páginas, en local (`pnpm start:local -p 3210`)

Es la única medición que cubre **las seis**, porque dos de las seis no existen
en producción. Es también la que el rediseño debe repetir: mismo build, misma
máquina, sin varianza de red.

| #   | Página                    | URL                                                | Nota   | FCP   | LCP       | TBT   | CLS |
| --- | ------------------------- | -------------------------------------------------- | ------ | ----- | --------- | ----- | --- |
| 1   | **Home**                  | `localhost:3210/es`                                | **99** | 0,9 s | 2,0 s     | 10 ms | 0   |
| 2   | **Listado oportunidades** | `localhost:3210/es/oportunidades`                  | **99** | 0,9 s | 2,0 s     | 10 ms | 0   |
| 3   | **Una oportunidad**       | `localhost:3210/es/oportunidades/alemania/almacen` | **99** | 0,9 s | 2,0 s     | 10 ms | 0   |
| 4   | **Registro**              | `localhost:3210/es/registro`                       | **97** | 0,9 s | **2,6 s** | 10 ms | 0   |
| 5   | `/es/ofertas`             | `localhost:3210/es/ofertas`                        | **99** | 0,9 s | 2,1 s     | 10 ms | 0   |
| 6   | Landing `/es/trabajo/…`   | `localhost:3210/es/trabajo/alemania`               | **99** | 0,9 s | 2,0 s     | 10 ms | 0   |

> Las páginas 5 y 6 tienen contenido en local (3 vacantes sembradas) y no lo
> tienen en producción. Por eso esta tabla no es equivalente a la de abajo.

## Las cuatro que existen en producción (`https://talpass.eu`)

| Página                    | URL                                                    | Nota           | FCP   | LCP       | TBT   | CLS |
| ------------------------- | ------------------------------------------------------ | -------------- | ----- | --------- | ----- | --- |
| **Home**                  | `https://talpass.eu/es`                                | **97**         | 1,0 s | 2,5 s     | 10 ms | 0   |
| **Listado oportunidades** | `https://talpass.eu/es/oportunidades`                  | **98**         | 1,0 s | 2,4 s     | 10 ms | 0   |
| **Una oportunidad**       | `https://talpass.eu/es/oportunidades/alemania/almacen` | **100**        | 0,9 s | **1,4 s** | 10 ms | 0   |
| **Registro**              | `https://talpass.eu/es/registro`                       | **98**         | 1,0 s | 2,4 s     | 0 ms  | 0   |
| `/es/ofertas` (vacío)     | `https://talpass.eu/es/ofertas`                        | **97**         | 0,9 s | 2,6 s     | 10 ms | 0   |
| Landing `/es/trabajo/…`   | —                                                      | **no medible** | —     | —         | —     | —   |

### 🔴 Por qué la landing no tiene medición en producción

`https://talpass.eu/es/trabajo/alemania` devuelve **404**. Las landings de
ADR-23 se derivan de las vacantes vivas y en producción no hay ninguna, así que
las 16 landings no existen. La línea base «landing 97» del roadmap **solo se
puede reproducir en local**, y ahí está: **99**.

---

## Contra qué se compara el rediseño

| Métrica                        | Valor hoy | Dónde se midió          |
| ------------------------------ | --------- | ----------------------- |
| Home                           | 99 / 97   | local / producción      |
| Listado de oportunidades       | 99 / 98   | local / producción      |
| Una oportunidad                | 99 / 100  | local / producción      |
| Registro                       | 97 / 98   | local / producción      |
| `/es/ofertas`                  | 99 / 97   | local / producción      |
| Landing `/es/trabajo/alemania` | 99 / n.d. | local / **404** en prod |

**Peor nota medida hoy: 97.** Ninguna página del rediseño debería quedar por
debajo, y las tres que hoy no tenían línea base (home, oportunidades, registro)
ya la tienen.

**Y lo que hay que vigilar no es la nota, es el LCP.** Todas las páginas están
entre 1,4 y 2,6 s, y el umbral «bueno» de Core Web Vitals es 2,5 s: la home de
producción (2,5 s), el registro local (2,6 s) y `/es/ofertas` en producción
(2,6 s) están **justo en el borde**. Un tipo nuevo, una imagen de héroe o una
fuente adicional los cruza sin que la nota baje mucho. TBT (0–10 ms) y CLS (0)
están tan bajos que cualquier animación o carga diferida se verá al instante.
