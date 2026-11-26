# Marca de Talpass: qué se usa y de dónde sale

Fuente recibida: `logo/logo.png`, conservada sin alteración en
`reference/talpass-logo-board.png`. Es una lámina raster: no hay original
vectorial del autor.

## Lo que sirve la web (desde el 2026-11-24, ADR-54)

| Fichero                                     | Uso                                                               | Origen                      |
| ------------------------------------------- | ----------------------------------------------------------------- | --------------------------- |
| `public/brand/talpass-logo.svg`             | Cabecera (fondo claro)                                            | Vectorizado por Kayao       |
| `public/brand/talpass-logo-on-dark.svg`     | Pie (fondo petróleo): el verde pasa a blanco, el naranja se queda | Vectorizado por Kayao       |
| `public/brand/talpass-symbol.svg`           | Solo el símbolo; hoy sin uso en el código                         | Vectorizado por Kayao       |
| `public/brand/talpass-icon-provisional.png` | Icono de la tarjeta de ejemplo de la home                         | Recorte raster de la lámina |
| `src/app/favicon.ico`                       | Favicon                                                           | Recorte raster de la lámina |

Los SVG salen de la lámina vectorizada **por capas de color** con potrace
(verde `#0B584F`, naranja `#FE7A1C`, oscuro `#093838`), con fondo
transparente. Conservan forma y proporciones; las coordenadas se redondearon a
una unidad del `viewBox` para que pesen menos (9,6 KB con brotli) y son
indistinguibles del trazado completo incluso a 10× el tamaño de la cabecera.
Se pintan con `<img>` desde `src/components/brand-logo.tsx`.

## Lo que queda del logo provisional

`public/brand/talpass-logo-provisional.webp` (recorte raster con fondo claro)
ya **no se pinta en la web**. Solo lo usa `prepare-assets.mjs`, que lo
reproduce y genera las tarjetas para compartir `share-<locale>.png`:

```sh
node docs/brand/prepare-assets.mjs
```

Esas tarjetas no están publicadas todavía (se dejaron fuera en `7b3491c`
porque llevan copy nuevo). Si se publican, conviene rehacerlas con el SVG.

## Pendiente

- Pedir al autor los originales vectoriales (SVG o PDF). Si llegan,
  sustituyen a los vectorizados de Kayao, y el favicon y el icono dejan de ser
  raster.
