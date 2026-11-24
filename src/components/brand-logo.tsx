import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

/**
 * Logo de Talpass, vectorial y con fondo transparente.
 *
 * Sale de la lámina aprobada (`docs/brand/reference/talpass-logo-board.png`):
 * se vectorizó por capas de color con potrace (2026-11-24, Kayao), así que
 * conserva forma y proporciones del original y ya no lleva la caja blanca del
 * recorte raster. `onDark` cambia el petróleo por blanco y deja el naranja,
 * como la versión sobre fondo oscuro de la lámina.
 *
 * Se pinta con `<img>` y no con `next/image`: es un SVG estático, no hay nada
 * que optimizar y así no entra JavaScript en la cabecera.
 *
 * Pendiente: sustituir por el original vectorial del autor si aparece.
 */
export function BrandLogo({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={
        onDark ? '/brand/talpass-logo-on-dark.svg' : '/brand/talpass-logo.svg'
      }
      alt={siteConfig.name}
      width={4529}
      height={1177}
      className={cn('block h-7 w-auto sm:h-8', className)}
    />
  );
}
