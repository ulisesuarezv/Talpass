# Fase C2 · Sistema visual — resumen de la evidencia

> **2026-08-20.** Todo lo de aquí está medido contra el **build de producción de
> la fase servido en `localhost:3210`** con la base local (ADR-17). El árbol de
> comparación es `14d82ec`, que es lo que había justo antes de esta fase, medido
> **el mismo día y en la misma máquina** (regla de método de la C1).

## Desplegada y verificada — y el primer despliegue rompió algo

**`dpl_Anm4HViZFm9NMxdX6sDc5TSBjSrp`**, vivo en `https://talpass.eu` y leído de
`pnpm exec vercel inspect talpass.eu` **antes** de mirar ninguna cabecera.

⚠️ Ese identificador acredita esta verificación con fecha, no lo que se sirve
hoy. Para saber cuál está vivo se ejecuta el comando.

🔴 **Y hubo que desplegar dos veces.** El primero
(`dpl_E4dYQr1PmY8mWnZ4EoYK8Sf8YQ3f`) pasó todas las comprobaciones locales y aun
así **rompió el control negativo de ADR-11 y ADR-13**: `/es/cuenta` sin sesión
devolvía **200** con un `meta refresh` dentro, en vez de **307**. Lo causaba el
`loading.tsx` de la propia fase. Diagnóstico, arreglo y regla en **ADR-41** y en
`03-pantallas.md` §C-bis. **Solo se caza mirando el código de estado**, no la
pantalla: el usuario acababa en el mismo sitio.

## Los documentos

| Documento           | Qué acredita                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `01-contraste.md`   | Los **40 pares** de color reales, con el script que los recorre y su salida                    |
| `02-rendimiento.md` | Que **ninguna página empeora**, y las **seis configuraciones** que costó                       |
| `03-pantallas.md`   | **60 comprobaciones** de desbordamiento y las capturas, estados incluidos                      |
| `04-produccion.md`  | El despliegue, el 307 que rompió el primero, y por qué el Lighthouse de producción no concluye |
| `capturas/`         | 12 imágenes a 390 y 1280 px, producción incluida                                               |

## El veredicto, criterio a criterio

| Criterio del «hecho cuando»              | Estado                                                                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Texto ≥4,5:1 e interfaz ≥3:1, con script | ✅ 40 pares · `pnpm check:contrast` · el más justo, 3,58 (interfaz)                                                                 |
| El LCP no empeora en ninguna página      | ✅ en local, que es el método de §6; las seis empatan. En producción el instrumento tuvo demasiado ruido — §E de `04-produccion.md` |
| 390 y 1280 px sin desbordamiento         | ✅ 30 rutas × 2 anchos = 60 comprobaciones, 0 desbordan                                                                             |
| Carga y error demostrados                | ✅ capturas de un fallo y una espera **reales**, no simulados                                                                       |
| Fuente autoalojada y preacargada         | ✅ en producción: 1 petición, **23.904 B**, `immutable`, `HIT` · licencia escrita (ADR-39)                                          |
| Decisión sobre el modo oscuro            | ✅ aplazada y razonada; el bloque `.dark` se retira (ADR-38)                                                                        |
| Sin regresión de caché ni de sesión      | ✅ en producción: 15/15 sin cookie · `/es/cuenta` **307** desde `dub1` (al segundo intento)                                         |
| La C1 sigue en pie                       | ✅ contra producción: 1/5/6 encabezados, `JobPosting` 0, sitemap 13, SEO intacto                                                    |
| Calidad                                  | ✅ `typecheck` · `lint` · `format:check` · 64/64 · `drill` · paridad 485/485                                                        |

## 🔴 Y el precio que hay que leer, porque es decisión de Ulises

**Los `font-semibold` los emboldece el navegador**, no son la Semibold de
verdad. General Sans entra **solo con el corte Regular** porque cualquier
segundo corte cuesta entre 1 y 4 puntos de Lighthouse y 0,15 s de LCP, sobre un
sitio que ya está en 2,6–2,8 s con el umbral «bueno» en 2,5. Seis
configuraciones medidas en `02-rendimiento.md` y en ADR-39.
