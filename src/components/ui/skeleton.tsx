import { cn } from '@/lib/utils';

/**
 * Barra de esqueleto. Es adorno puro: no lleva texto, no lleva rol y el lector
 * de pantalla no la anuncia — quien la anuncia es el `role="status"` del
 * contenedor (`PageLoading`), una sola vez, en vez de doce veces.
 *
 * `motion-reduce:animate-none`: el latido se apaga para quien ha pedido menos
 * movimiento en el sistema. Una pantalla de carga es exactamente el sitio donde
 * esa preferencia importa, porque es la que más rato se mira.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-muted motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
