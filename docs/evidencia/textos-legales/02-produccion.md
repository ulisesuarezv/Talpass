# Textos legales · verificación en producción

> Sesión del 2026-08-19, punto 3 del orden acordado. **Vivo en
> `https://talpass.eu`.**

> ⚠️ **Nota del PM, 2026-08-20 — este fichero es una foto.** Todo lo que se mide
> aquí se midió contra `dpl_2vHfuQdbqKGdAJwxjjcZ41CMJbSd` y era cierto. El alias
> de `talpass.eu` se movió quince minutos después, y **varias veces más desde
> entonces**, siempre a despliegues del mismo código: el último commit que toca
> `src`, `messages` o `vercel.json` es `79e6291`, de las 17:18.
>
> **Ninguna medición de las de abajo cambia**, y por eso no se reescribe una sola
> cifra. Se recomprobaron el 2026-08-20 contra el despliegue vivo de ese momento:
> 12 rutas legales a 200, cuatro enlaces reales en el registro, funciones en
> `dub1`.
>
> **Cuál está vivo no se lee aquí** —ningún documento puede saberlo—; se pregunta
> con `pnpm exec vercel inspect talpass.eu`.
>
> **La lección, y va para la próxima sesión que cierre algo:** un `dpl_` escrito
> en un documento **acredita una medición con fecha**, no dice qué se sirve. La
> fila «ID del despliegue» de la tabla de cierre es correcta como acta de lo que
> se midió; sería falsa si se leyera como «lo que está vivo».

## El despliegue, y de qué despliegue hablamos

| Despliegue                         | Qué publica                                         |
| ---------------------------------- | --------------------------------------------------- |
| `dpl_2vHfuQdbqKGdAJwxjjcZ41CMJbSd` | los cinco textos legales y su ruta (ADR-33, ADR-34) |

```
$ vercel inspect talpass.eu
id      dpl_2vHfuQdbqKGdAJwxjjcZ41CMJbSd
name    ettrecruiter
target  production
status  ● Ready
```

Es el mismo ID que devolvió el `vercel --prod`, y el alias del apex apunta a él.
**Se comprobó antes de leer una sola cabecera**, que es lo que impide dar por
buena una medición del despliegue anterior.

> ℹ️ El log de construcción vuelve a decir `Running build in Washington – iad1`.
> Es la **máquina que compila**, no dónde corre el código: `regions` no la
> cambia y no trata datos de nadie. Ya está razonado en ADR-32; no es una
> regresión y no se vuelve a investigar.

## 1. Las doce rutas responden 200

| Ruta                         | HTTP | Ruta                          | HTTP |
| ---------------------------- | ---- | ----------------------------- | ---- |
| `/es/legal`                  | 200  | `/en/legal`                   | 200  |
| `/es/legal/impressum`        | 200  | `/en/legal/impressum`         | 200  |
| `/es/legal/privacidad`       | 200  | `/en/legal/privacy`           | 200  |
| `/es/legal/terminos`         | 200  | `/en/legal/terms`             | 200  |
| `/es/legal/datos-y-agencias` | 200  | `/en/legal/data-and-agencies` | 200  |
| `/es/legal/audio-en-ingles`  | 200  | `/en/legal/english-audio`     | 200  |

## 2. Estáticas, cacheadas y sin tocar la sesión

Recordatorio que no hay que redescubrir: **en producción `x-nextjs-cache` no
existe**. Next 16 sobre Vercel lo expresa como `x-vercel-cache` +
`x-nextjs-prerender: 1` (razonado en `docs/evidencia/correccion-copy/02-produccion.md`).

| Ruta                      | Cabeceras                                      | Y lo que NO trae                              |
| ------------------------- | ---------------------------------------------- | --------------------------------------------- |
| `/es/legal`               | `x-vercel-cache: HIT`, `x-nextjs-prerender: 1` | sin `x-ett-session-checked`, sin `Set-Cookie` |
| `/es/legal/impressum`     | `x-vercel-cache: HIT`, `x-nextjs-prerender: 1` | sin `x-ett-session-checked`, sin `Set-Cookie` |
| `/es/legal/privacidad`    | `x-vercel-cache: HIT`, `x-nextjs-prerender: 1` | sin `x-ett-session-checked`, sin `Set-Cookie` |
| `/en/legal/terms`         | `x-vercel-cache: HIT`, `x-nextjs-prerender: 1` | sin `x-ett-session-checked`, sin `Set-Cookie` |
| `/en/legal/english-audio` | `x-vercel-cache: HIT`, `x-nextjs-prerender: 1` | sin `x-ett-session-checked`, sin `Set-Cookie` |

Su `x-vercel-id` es **`fra1::`** a secas —las sirve el borde, sin llegar a
ejecutar función—, que es la forma más directa de ver que son estáticas de
verdad y no una dinámica bien cacheada.

**Control negativo, intacto:**

```
$ curl -sI https://talpass.eu/es/cuenta
HTTP/2 307
x-ett-session-checked: 1
x-vercel-id: fra1::dub1::vwtmq-1787160869166-0274f19bfbfb
```

307, **con** la cabecera de sesión, y la función en **`dub1`**: ADR-11, ADR-13 y
ADR-32 siguen los tres en pie después de este despliegue.

## 3. El sitemap: de 7 a 13

```
$ curl -s https://talpass.eu/sitemap.xml | grep -c "<url>"
13
```

Las seis nuevas son `/es/legal` y sus cinco documentos. Cada una declara sus
`alternates.languages`, así que el `hreflang` viaja en el propio sitemap.

## 4. El Impressum, sin ejecutar JavaScript

```
$ curl -s https://talpass.eu/es/legal/impressum | (sin etiquetas)
OK    José Ulises Suárez Victoria
OK    Theodor-Heuss-Straße 16
OK    37075
OK    Göttingen
OK    kayaosv@gmail.com
OK    50232706S
```

Los cuatro campos del §5 DDG —nombre, calle, código postal y ciudad, contacto—
más el NIF, que identifica al responsable y **no** sustituye a la USt-IdNr, que
no existe y no se inventa. Con la `ß` y la diéresis.

## 5. Lo que motivaba toda la sesión

El consentimiento del registro, en producción y sin JavaScript:

```
/es/legal/terminos          -> Términos de uso
/es/legal/privacidad        -> Política de Privacidad
/es/legal/datos-y-agencias  -> Cómo se comparte tu perfil
/es/legal/audio-en-ingles   -> Tu grabación en inglés

¿queda algún <strong> en el consentimiento? no
```

**Cuatro enlaces reales, uno por documento, y ni un `<strong>`.** El hallazgo 3
de la auditoría del 2026-08-18 está cerrado donde importa, que es donde se
sirve.

La home enlaza el Impressum **dos veces** (el pie y su propio bloque), y el pie
lleva los cinco en todas las páginas.

## 6. Metadatos propios, y ADR-30 intacto

```
/es/legal/privacidad   <title>Política de privacidad · Talpass</title>
/en/legal/impressum    <title>Legal notice (Impressum) · Talpass</title>
```

Distintos de la home, que es el hallazgo 7 y no se repite aquí.

```
$ curl -s https://talpass.eu/es/oportunidades | grep -ci "JobPosting"
0
```

## Tabla de cierre

| Comprobación                        | Esperado                                        | Resultado                             |
| ----------------------------------- | ----------------------------------------------- | ------------------------------------- |
| ID del despliegue                   | el nuevo, confirmado con `vercel inspect`       | ✅ `dpl_2vHfuQdbqKGdAJwxjjcZ41CMJbSd` |
| 12 rutas legales, `es` y `en`       | 200                                             | ✅ 12/12                              |
| Cabeceras de una ruta legal         | `x-vercel-cache: HIT` + `x-nextjs-prerender: 1` | ✅                                    |
| Cabeceras de una ruta legal         | sin `x-ett-session-checked`, sin `Set-Cookie`   | ✅                                    |
| Control negativo `/es/cuenta`       | 307 **con** `x-ett-session-checked: 1`          | ✅ (y `dub1`)                         |
| `/sitemap.xml`                      | 13 URLs (antes 7)                               | ✅ 13                                 |
| Impressum sin JavaScript            | nombre + calle + CP + ciudad + correo           | ✅ 6/6                                |
| Enlaces del consentimiento          | uno por documento, ningún `<strong>`            | ✅ 4/4                                |
| `JobPosting` en `/es/oportunidades` | 0                                               | ✅ 0                                  |

## Lo que sigue SIN comprobar, para que nadie lo dé por hecho

- **El alta end-to-end contra producción.** Se hizo a 390×844 **contra la base
  local** (`01-local.md` §6), no contra producción, así que las cuatro filas de
  `consents` con la versión `2026-08-19` están demostradas en local y no en el
  remoto. La migración de la fase 4 y las dos variables de Vercel siguen siendo
  el punto 4, y ahí es donde toca ejercitar el alta real.
- **Cuántas cuentas reales hay en producción** con consentimientos de la versión
  vieja. Es la comprobación que decide si el reconsentimiento de ADR-34 hay que
  construirlo o basta con borrar cuentas de prueba.
