# Evidencia local — fase 4b

Build local con `pnpm seed:demo` (3 vacantes), servidor `start:local -p 3210`.

## Criterio central: cero JobPosting en /oportunidades

```
$ grep -ril "JobPosting" .next/server/app/{es,en}/opportunities
(sin resultados)

/es/oportunidades -> 0 coincidencias
/es/oportunidades/alemania/almacen -> 0 coincidencias
/en/opportunities -> 0 coincidencias
/en/opportunities/germany/warehouse -> 0 coincidencias

control positivo — /es/ofertas/almacen-berlin-turnos -> 1 (una vacante real SÍ lo lleva)
```

## Compatibilidad de slugs con las landings de ADR-23

Mismos segmentos, otro árbol de rutas: el 301 del día que se retiren es mecánico.

| Oportunidad                           | Landing equivalente (ya existe en este build) |
| ------------------------------------- | --------------------------------------------- |
| /es/oportunidades/alemania/almacen    | /es/trabajo/alemania/almacen -> 200           |
| /es/oportunidades/alemania/logistica  | /es/trabajo/alemania/logistica -> 200         |
| /es/oportunidades/alemania/produccion | /es/trabajo/alemania/produccion -> 200        |
| /en/opportunities/germany/warehouse   | /en/work/germany/warehouse -> 200             |

## Cabeceras (ADR-11, ADR-13)

```
/es/oportunidades
  x-nextjs-cache: HIT
/es/oportunidades/alemania/almacen
  x-nextjs-cache: HIT
/en/opportunities
  x-nextjs-cache: HIT
/es/cuenta (control)
  x-ett-session-checked: 1
```

## hreflang recíproco

```
<link rel="canonical" href="http://localhost:3000/es/oportunidades/alemania/almacen"/>
<link rel="alternate" hrefLang="es" href="http://localhost:3000/es/oportunidades/alemania/almacen"/>
<link rel="alternate" hrefLang="en" href="http://localhost:3000/en/opportunities/germany/warehouse"/>
<link rel="alternate" hrefLang="x-default" href="http://localhost:3000/es/oportunidades/alemania/almacen"/>

<link rel="canonical" href="http://localhost:3000/en/opportunities/germany/warehouse"/>
<link rel="alternate" hrefLang="es" href="http://localhost:3000/es/oportunidades/alemania/almacen"/>
<link rel="alternate" hrefLang="en" href="http://localhost:3000/en/opportunities/germany/warehouse"/>
<link rel="alternate" hrefLang="x-default" href="http://localhost:3000/es/oportunidades/alemania/almacen"/>
```

## Contenido en el HTML estático, sin ejecutar JavaScript

```
enlaces a perfiles en /es/oportunidades: 5
href="/es/oportunidades/alemania/agricola"
href="/es/oportunidades/alemania/almacen"
href="/es/oportunidades/alemania/carnico"
href="/es/oportunidades/alemania/logistica"
href="/es/oportunidades/alemania/produccion"
enlaces en /en/opportunities: 5
```

## `/ofertas` vacío (base local reseteada — es el estado de producción)

```
$ curl -s localhost:3210/es/ofertas | grep -o '<meta name="robots"[^>]*>'
<meta name="robots" content="noindex, follow"/>

$ curl -s localhost:3210/es/ofertas | grep -o 'href="/es/oportunidades"'
href="/es/oportunidades"          ← el enlace de salida, visible en el HTML

$ curl -s localhost:3210/en/jobs  | grep -o '<meta name="robots"[^>]*>'
<meta name="robots" content="noindex, follow"/>
```

`follow` a propósito: la página no se indexa, pero el enlace a las
oportunidades sí se sigue. Y la condición es **el contenido**: en cuanto haya
una vacante publicada, `/ofertas` vuelve sola al índice y al sitemap.

## Sitemap con la base vacía

7 URLs: portada + listado de oportunidades + los 5 perfiles. Cada una con sus
`xhtml:link` (21 en total: 3 por URL, `es`, `en` y `x-default`).
`/ofertas` **no entra mientras esté vacío**.

## `next build`

Con la base vacía: las 12 rutas de oportunidades (listado + 5 perfiles, × 2
idiomas) salen `●`. `account`, `admin`, `agency` y `onboarding` siguen `ƒ`.

## Registro desde una oportunidad, en móvil 390×844

Recorrido real con Playwright, sin atajos:

1. `/es/oportunidades/alemania/almacen` → «Crear mi cuenta»
2. alta con `fase4b@talpass.test`, correo de confirmación leído en Mailpit
3. canje del enlace → `/es/completar-perfil`, sesión hecha
4. los 5 pasos del onboarding
5. termina en `/es/cuenta`

```
$ select first_name, last_name, verification_status from public.candidates …
 Lucía      | Fernández Ruiz | unverified   ← la fila existe
```

Capturas: `oportunidad-movil.png`, `listado-movil.png`.

## Seguridad y calidad

```
pnpm test:security         64/64
pnpm test:security:drill   rompe 3 políticas, la batería las caza, restaura
pnpm typecheck             limpio
pnpm lint                  limpio
pnpm format:check          limpio
```

Esta fase **no toca la base de datos**: ni migración, ni tabla, ni política.
Los 64/64 son los mismos de la fase 4.
