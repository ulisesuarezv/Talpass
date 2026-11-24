'use client';

import { useEffect, useRef } from 'react';

/**
 * Añade `data-inview` al contenedor cuando entra en pantalla, una sola vez.
 * Lo usa el panel de ofertas para girar sus fichas. El HTML servido no oculta
 * nada: sin JavaScript las fichas se ven quietas.
 */
export function RevealOnView({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          node.dataset.inview = 'true';
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(node);

    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
