# Talpass: propuesta pública y SEO

Primera versión local autorizada por el encargo; rama `design/talpass-logo-web`
desde `felipe-dev`, inicialmente limpia. Sin publicar ni fusionar.

## Dirección visual

Conservar petróleo, naranja, blanco, General Sans y los componentes actuales.
Integrar el logo principal mediante recorte exacto, provisional y sin redibujar,
sobre una placa clara. La única fuente disponible es la lámina PNG conservada
en `docs/brand/reference/`. Reemplazar por originales aprobados cuando existan.
No usar el mockup del letrero. No añadir fuentes ni JavaScript de presentación.

## Trabajo previsto

1. Conservar la referencia, preparar logo y favicon raster y documentar recortes.
2. Integrar `BrandLogo` en cabecera y pie. Adaptar navegación a móvil sin cambiar
   `AccountNav`, autenticación o permisos.
3. Afinar portada, botones y tarjetas con utilidades y tokens existentes.
   Copy ES/EN sobre revisión humana, preselección y consentimiento; sin garantías.
   Mantener privacidad, acompañamiento y FAQ existentes.
4. Reutilizar `seoMetadata` para compartir y alternates. Centralizar la decisión
   de indexación: noindex y sitemap vacío en entornos de prueba. Mantener rutas
   privadas fuera del sitemap y sin cambios funcionales.
5. Verificar lint, tipos, formato de archivos cambiados, contraste, build local,
   HTML/SEO e imágenes, y visualmente en móvil y escritorio. Documentar resultados
   y límites. No ejecutar reset de base ni comandos de producción.

## Criterios de revisión

Logo proporcionado y legible, sin lámina ni letrero en páginas; ausencia de
desbordamiento a 375 y 1440 px; un h1 por página; canonical y hreflang ES/EN
coherentes; previews bloqueadas; home y páginas públicas prerenderizadas.
La comparación de rendimiento requiere builds equivalentes en la misma máquina.
