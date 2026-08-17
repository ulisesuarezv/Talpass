# Evidencia en producción — fase 4b

**Contra `https://talpass.eu`, el 2026-08-17.**

Dos despliegues, en este orden y por este motivo:

| #   | Despliegue                         | Qué hizo                                                 |
| --- | ---------------------------------- | -------------------------------------------------------- |
| 1   | `dpl_C5jM3MRvPU49pSugvnusD99LowDr` | publica el contenido, con el sitio aún cerrado a Google  |
| 2   | `dpl_BTmB7MvesM7E65iDJNXvyeEbaM4U` | hornea `NEXT_PUBLIC_ALLOW_INDEXING=true` y abre el sitio |

El segundo no es opcional: `NEXT_PUBLIC_` se hornea en el build, así que añadir
la variable no cambia nada hasta redesplegar. Y se abre a Google **después** de
que el contenido esté vivo y verificado, nunca antes.

Despliegue vivo confirmado con `vercel inspect talpass.eu` antes de dar por
buena ninguna cabecera: `dpl_BTmB7MvesM7E65iDJNXvyeEbaM4U`, `● Ready`.

## Criterio central: cero `JobPosting` en producción

Comprobado en los dos despliegues, antes y después de abrir la indexación:

```
/es/oportunidades                      -> 0
/es/oportunidades/alemania/almacen     -> 0
/es/oportunidades/alemania/agricola    -> 0
/en/opportunities/germany/warehouse    -> 0
```

## `/robots.txt` — el gesto que abre el sitio

Antes: `User-Agent: *` / `Disallow: /`. Ahora:

```
User-Agent: *
Allow: /
Disallow: /es/completar-perfil … /admin   (las áreas privadas, desde el mapa de rutas)

Sitemap: https://talpass.eu/sitemap.xml
```

## `/sitemap.xml` — **7 URLs** (hasta hoy eran 2)

```
https://talpass.eu/es
https://talpass.eu/es/oportunidades
https://talpass.eu/es/oportunidades/alemania/almacen
https://talpass.eu/es/oportunidades/alemania/logistica
https://talpass.eu/es/oportunidades/alemania/produccion
https://talpass.eu/es/oportunidades/alemania/carnico
https://talpass.eu/es/oportunidades/alemania/agricola
```

Cada una con sus `xhtml:link` (`es`, `en`, `x-default`). **`/es/ofertas` no
entra**: está vacío y en `noindex`, y declarar en el sitemap una URL que luego
se bloquea es la contradicción que más rastreo gasta.

## Las oportunidades salen sin ejecutar JavaScript

5 perfiles enlazados en el HTML de `/es/oportunidades`, y las cifras y el
encuadre en el HTML del detalle:

```
15,50 € – 18,00 € por hora
Rango observado en las ofertas analizadas
Esto no es un listado de vacantes
```

## Cabeceras (ADR-11, ADR-13)

| Ruta                                 | Caché       | Sesión                                         |
| ------------------------------------ | ----------- | ---------------------------------------------- |
| `/es/oportunidades`                  | `HIT`       | sin `x-ett-session-checked`, sin `Set-Cookie`  |
| `/es/oportunidades/alemania/almacen` | `HIT`       | sin `x-ett-session-checked`, sin `Set-Cookie`  |
| `/en/opportunities`                  | `PRERENDER` | sin `x-ett-session-checked`, sin `Set-Cookie`  |
| `/es/cuenta` (control)               | —           | 307 a `/es/entrar`, `x-ett-session-checked: 1` |

## `hreflang` recíproco, en el apex

```
canonical  https://talpass.eu/es/oportunidades/alemania/almacen
es         https://talpass.eu/es/oportunidades/alemania/almacen
en         https://talpass.eu/en/opportunities/germany/warehouse
x-default  https://talpass.eu/es/oportunidades/alemania/almacen
```

Los segmentos se traducen enteros, que es la trampa que ADR-23 documenta: el
`hreflang` no reutiliza los params del idioma actual.

## `/es/ofertas` vacío

`<meta name="robots" content="noindex, follow"/>` y enlace visible a
`/es/oportunidades`. `follow` a propósito: no se indexa, pero el enlace de
salida sí se sigue.
