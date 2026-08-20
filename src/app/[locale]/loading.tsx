import { PageLoading } from '@/components/page-loading';

/**
 * Carga por defecto de todo el árbol de idioma.
 *
 * En las rutas públicas, que son estáticas y llegan del CDN, esto casi no se ve
 * en la primera visita —el HTML ya viene entero— pero **sí se ve al navegar**
 * entre páginas dentro del sitio, que es cuando el App Router va a buscar el
 * siguiente segmento. En `(private)`, que es `force-dynamic`, se ve siempre.
 *
 * Que exista aquí y no en cada carpeta es lo que hace que **ninguna pantalla se
 * quede sin estado de carga por olvido**; las áreas que necesiten un esqueleto
 * con otra forma ponen el suyo y este deja de aplicar.
 *
 * ⚠️ `PageLoading` es Client Component por una razón medida: ver ADR-40.
 */
export default function Loading() {
  return <PageLoading />;
}
