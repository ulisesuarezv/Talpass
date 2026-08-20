# Fase C2 · Sistema visual — resumen de la evidencia

> **2026-08-20.** Todo lo de aquí está medido contra el **build de producción de
> la fase servido en `localhost:3210`** con la base local (ADR-17). El árbol de
> comparación es `14d82ec`, que es lo que había justo antes de esta fase, medido
> **el mismo día y en la misma máquina** (regla de método de la C1).

## 🔴 Lo que falta, y hay que decirlo antes que nada

**Esta fase NO está desplegada.** El código está subido (`origin/main` en
`84d7615`) pero `git push` no despliega nada en este proyecto, y el
`pnpm exec vercel --prod` de esta sesión quedó **bloqueado por el clasificador
de permisos del entorno**. Lo que sirve `talpass.eu` sigue siendo la C1.

Lo que queda por comprobar es exactamente lo que solo existe en producción:
cabeceras de caché, el control negativo de `/es/cuenta` en `dub1`, y Lighthouse
**con el borde caliente**. Instrucciones en `docs/ESTADO.md`.

## Los documentos

| Documento           | Qué acredita                                                                |
| ------------------- | --------------------------------------------------------------------------- |
| `01-contraste.md`   | Los **40 pares** de color reales, con el script que los recorre y su salida |
| `02-rendimiento.md` | Que **ninguna página empeora**, y las **seis configuraciones** que costó    |
| `03-pantallas.md`   | **60 comprobaciones** de desbordamiento y las capturas, estados incluidos   |
| `capturas/`         | 11 imágenes a 390 y 1280 px                                                 |

## El veredicto, criterio a criterio

| Criterio del «hecho cuando»              | Estado                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| Texto ≥4,5:1 e interfaz ≥3:1, con script | ✅ 40 pares · `pnpm check:contrast` · el más justo, 3,58 (interfaz)          |
| El LCP no empeora en ninguna página      | ✅ mediana de 5 (7 en `landing`); las seis empatan con la línea base         |
| 390 y 1280 px sin desbordamiento         | ✅ 30 rutas × 2 anchos = 60 comprobaciones, 0 desbordan                      |
| Carga y error demostrados                | ✅ capturas de un fallo y una espera **reales**, no simulados                |
| Fuente autoalojada y preacargada         | ✅ en el HTML servido · licencia leída y escrita (ADR-39)                    |
| Decisión sobre el modo oscuro            | ✅ aplazada y razonada; el bloque `.dark` se retira (ADR-38)                 |
| Sin regresión de caché ni de sesión      | 🟡 **26 rutas prerenderizadas, las mismas que antes** — pero medido en local |
| La C1 sigue en pie                       | 🟡 comprobado en local; falta recomprobarlo contra producción                |
| Calidad                                  | ✅ `typecheck` · `lint` · `format:check` · 64/64 · `drill` · paridad 485/485 |

## 🔴 Y el precio que hay que leer, porque es decisión de Ulises

**Los `font-semibold` los emboldece el navegador**, no son la Semibold de
verdad. General Sans entra **solo con el corte Regular** porque cualquier
segundo corte cuesta entre 1 y 4 puntos de Lighthouse y 0,15 s de LCP, sobre un
sitio que ya está en 2,6–2,8 s con el umbral «bueno» en 2,5. Seis
configuraciones medidas en `02-rendimiento.md` y en ADR-39.
