# Textos legales · verificación local

> Sesión del 2026-08-19, punto 3 del orden acordado. Base local (ADR-17), ni una
> escritura contra producción. Commit `79e6291`.

## 0. Lo primero que se comprobó, porque condicionaba lo que se podía escribir

La política de privacidad solo puede afirmar que el tratamiento ocurre en la UE
si las funciones corren allí. Se comprobó **antes** de escribir la frase, contra
producción y sin fiarse del párrafo del prompt:

```
$ curl -sS -D - -o /dev/null https://talpass.eu/es/cuenta | grep -i x-vercel-id
x-vercel-id: fra1::dub1::bj8xs-1787151329676-50e90ab6f86f
```

`dub1`, no `iad1`. ADR-32 está vivo, así que la afirmación se escribe.

## 1. La medición que decidió dónde vive el copy

`NextIntlClientProvider` se usa sin prop `messages`, así que serializa el
fichero **entero** en el HTML de todas las páginas. Comprobado sobre el HTML
construido de la home, buscando cadenas que solo existen en namespaces que la
home no usa:

```
$ grep -c "Cola de revisión" .next/server/app/es.html   # namespace Admin
1
$ grep -c "ya está verificado" .next/server/app/es.html # namespace Emails
1
```

Los cinco documentos pesan **24,6 KB por idioma**. Sobre una home de 52.444 B,
meterlos en `messages/` la habría dejado en ~77 KB: **+47 % en el camino crítico
de todas las páginas**, para un candidato con 4G, y para que los lea una visita
de cada mil. Contra ADR-10. De ahí ADR-33.

Resultado del reparto elegido (títulos en `messages/`, cuerpo en
`messages/legal/`):

| Medida                                | Antes    | Después  |
| ------------------------------------- | -------- | -------- |
| `.next/server/app/es.html` (la home)  | 52.444 B | 58.889 B |
| ¿el cuerpo legal aparece en esa home? | —        | **no**   |

```
$ grep -c "seudonimizada" .next/server/app/es.html    # cuerpo de la política
0
$ grep -c "Theodor-Heuss" .next/server/app/es.html    # domicilio del responsable
0
```

Los 6,4 KB que sí sube son el namespace `Legal` (títulos y metadatos) y los
cinco enlaces del pie: eso tiene que estar en todas las páginas, porque el pie
está en todas las páginas.

## 2. Las doce rutas

`pnpm build:local` — las doce salen `●` (SSG), y las privadas siguen `ƒ`:

```
├   /[locale]/legal
│ ├ ● /es/legal                    1h  1y
│ └ ● /en/legal                    1h  1y
├   /[locale]/legal/[document]
│ ├ ● /es/legal/impressum          1h  1y
│ ├ ● /es/legal/privacidad         1h  1y
│ ├ ● /es/legal/terminos           1h  1y
│ └ ● [+7 more paths]
...
├ ƒ /[locale]/account
├ ƒ /[locale]/admin
├ ƒ /[locale]/agency
├ ƒ /[locale]/onboarding
```

Servidas con `pnpm start:local -p 3210`, con el puerto liberado y `.next`
borrado antes de construir (la trampa que ya mordió en la fase 4):

| Ruta                          | HTTP | `x-nextjs-cache` | `x-ett-session-checked` | `Set-Cookie` |
| ----------------------------- | ---- | ---------------- | ----------------------- | ------------ |
| `/es/legal`                   | 200  | HIT              | —                       | —            |
| `/es/legal/impressum`         | 200  | HIT              | —                       | —            |
| `/es/legal/privacidad`        | 200  | HIT              | —                       | —            |
| `/es/legal/terminos`          | 200  | HIT              | —                       | —            |
| `/es/legal/datos-y-agencias`  | 200  | HIT              | —                       | —            |
| `/es/legal/audio-en-ingles`   | 200  | HIT              | —                       | —            |
| `/en/legal`                   | 200  | HIT              | —                       | —            |
| `/en/legal/impressum`         | 200  | HIT              | —                       | —            |
| `/en/legal/privacy`           | 200  | HIT              | —                       | —            |
| `/en/legal/terms`             | 200  | HIT              | —                       | —            |
| `/en/legal/data-and-agencies` | 200  | HIT              | —                       | —            |
| `/en/legal/english-audio`     | 200  | HIT              | —                       | —            |

Control negativo intacto: `/es/cuenta` → **307** con `x-ett-session-checked: 1`.
Y un segmento inventado (`/es/legal/inventado`) → **404**, que es lo que hace
`dynamicParams = false`.

## 3. Los datos del responsable, en el HTML y sin ejecutar JavaScript

`curl -s localhost:3210/es/legal/impressum`, quitando etiquetas:

```
OK  José Ulises Suárez Victoria
OK  Theodor-Heuss-Straße 16
OK  37075
OK  Göttingen
OK  kayaosv@gmail.com
OK  50232706S
```

Con la `ß` y la diéresis. Salen de `src/config/controller.ts`; no hay ni un dato
del responsable escrito en el copy ni en el JSX.

## 4. Metadatos propios, que es donde falló `(auth)`

```
/es/legal/privacidad   <title>Política de privacidad · Talpass</title>
/es/legal/terminos     <title>Términos de uso · Talpass</title>
/es/legal/impressum    <title>Aviso legal (Impressum) · Talpass</title>
/en/legal/impressum    <title>Legal notice (Impressum) · Talpass</title>
/es  (la home)         <title>Talpass — Empleo en Europa para hispanohablantes</title>
```

Distintos de la home, que es el fallo del hallazgo 7. `hreflang` recíproco y
cruzando de idioma correctamente, que es lo que la ruta con parámetro podía
haber roto:

```html
<link rel="canonical" href=".../es/legal/privacidad" />
<link rel="alternate" hreflang="es" href=".../es/legal/privacidad" />
<link rel="alternate" hreflang="en" href=".../en/legal/privacy" />
<link rel="alternate" hreflang="x-default" href=".../es/legal/privacidad" />
```

> **Un fallo cazado aquí:** la primera versión servía el título con el hueco
> `{brand}` **sin interpolar**, porque a `t()` no se le pasaba `brand`. Arreglado y vuelto a medir. Es exactamente por qué se mira
> el HTML y no el código.

## 5. Los enlaces

Desde el HTML servido, sin JavaScript:

- **El registro**, dentro del bloque de consentimientos: **cuatro enlaces**, uno
  por documento.
  ```
  /es/legal/terminos          -> Términos de uso
  /es/legal/privacidad        -> Política de Privacidad
  /es/legal/datos-y-agencias  -> Cómo se comparte tu perfil
  /es/legal/audio-en-ingles   -> Tu grabación en inglés
  ```
- **El pie**, en una página pública cualquiera (`/es/oportunidades`): los cinco.
- **La home**: enlaza el Impressum, además del pie.

## 6. El alta completa desde el móvil (390 × 844)

Con Playwright, sesión real contra la base local.

1. Formulario relleno: correo, contraseña, casilla de términos, casilla de
   compartir perfil.
2. **Clic en «Política de Privacidad» dentro del consentimiento.** Se abre una
   pestaña nueva y la pestaña del formulario conserva **todo**:
   ```json
   {
     "email": "legales-e2e-20260819@example.com",
     "passwordLen": 17,
     "terms": "checked",
     "dataSharing": "checked"
   }
   ```
   Que es lo que compra el `target="_blank"`: en un móvil, volver atrás es
   exactamente donde se pierde a la gente.
3. Alta enviada con las tres casillas obligatorias más la del audio →
   redirección a `/es/revisa-tu-correo?email=…`.
4. Las cuatro filas de `consents`, con la versión nueva, la IP y el navegador:

   | type            | version    | ip  | user_agent             |
   | --------------- | ---------- | --- | ---------------------- |
   | `terms`         | 2026-08-19 | ::1 | Mozilla/5.0 (Macintosh |
   | `privacy`       | 2026-08-19 | ::1 | Mozilla/5.0 (Macintosh |
   | `data_sharing`  | 2026-08-19 | ::1 | Mozilla/5.0 (Macintosh |
   | `audio_sharing` | 2026-08-19 | ::1 | Mozilla/5.0 (Macintosh |

### Lo que el móvil sí encontró, y no es de esta sesión

A 390 px **la página desborda en horizontal**: `documentElement.scrollWidth` es
**453** contra un `clientWidth` de 390. El culpable es la **cabecera**, no los
legales:

```
HEADER.sticky top-0 z-40 …            w=453
DIV.mx-auto flex h-14 max-w-5xl …     w=453
```

Comprobado que **ya ocurría en la home**, que esta sesión no toca: mismo 453.
El pie nuevo, con sus cinco enlaces, mide **390** y envuelve bien. Va anotado
para el rediseño (punto 6), no se arregla aquí.

## 7. Paridad `es`/`en`

Reutilizando `docs/evidencia/correccion-copy/parity.mjs`, generalizado para
aceptar el par de ficheros por argumento en vez de escribir un segundo script:

```
$ node docs/evidencia/correccion-copy/parity.mjs
comparando: messages/es.json ↔ messages/en.json
claves hoja: es=477 en=477
solo en es: 0
solo en en: 0
divergencias numéricas: 0

$ node docs/evidencia/correccion-copy/parity.mjs messages/legal/es.json messages/legal/en.json
comparando: messages/legal/es.json ↔ messages/legal/en.json
claves hoja: es=188 en=188
solo en es: 0
solo en en: 0
divergencias numéricas: 0
```

> **El script encontró algo de verdad en la primera pasada**: 8 divergencias en
> las citas del RGPD, `art. 6.1.b` en castellano contra `Art. 6(1)(b)` en
> inglés. No era un error de fondo —las dos formas son correctas en su idioma—
> pero dejar ocho divergencias fijas en la salida habría escondido la novena, la
> que sí importara algún día. Se unificó la numeración a `6.1(b)`, que es válida
> en los dos, sin tocar el fondo de la cita.

Y la estructura, sección a sección: los cinco documentos tienen el **mismo
número de epígrafes** en los dos idiomas (6, 12, 11, 8 y 5), y cada epígrafe el
mismo número de párrafos y de puntos.

## 8. Lo demás del criterio

```
$ pnpm typecheck     ✓ limpio
$ pnpm lint          ✓ limpio
$ pnpm format:check  ✓ All matched files use Prettier code style
$ pnpm test:security ✓ 64 comprobaciones superadas
$ pnpm test:security:drill ✓ todo restaurado y en verde
```

`JobPosting` sobre el HTML de `/es/oportunidades` (ADR-30): **0**.

Sitemap local: 25 URLs, de las que **6 son legales** (`/legal` y sus cinco
documentos). En producción, donde no hay vacantes y por tanto no hay landings,
las 7 de hoy pasan a **13**.
