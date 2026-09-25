'use client';

import { type ComponentType, useEffect, useState } from 'react';

/**
 * El único punto de entrada de GSAP en la home, y lo único suyo que va en el
 * JS inicial: este disparador, unos cientos de bytes.
 *
 * **GSAP no entra en la ruta crítica (ADR-47).** El LCP de la home lo mandan
 * los bytes de script, así que la librería se pide con un `import()` en un
 * chunk aparte, y solo después del evento `load` y de un hueco ocioso del hilo
 * principal. Nadie emite `preload` de ese chunk, y en servidor esto no pinta
 * nada, así que tampoco hay nada que hidratar.
 *
 * **Por qué `import()` a mano y no `next/dynamic`:** se midió. `next/dynamic`
 * mete en el JS inicial su propia maquinaria (`Loadable`, `BailoutToCSR`,
 * `PreloadChunks`), 1,7 KB gz que la home pagaría en la ruta crítica para
 * cargar algo que por diseño llega después de `load`.
 *
 * **Quién no lo descarga nunca:** quien pide menos movimiento
 * (`prefers-reduced-motion: reduce`) y quien tiene activado el ahorro de datos
 * (`Save-Data`), que es justo el candidato con datos limitados. Para ellos la
 * página es la misma, sin animación.
 *
 * **Y si no llega a cargar, no pasa nada:** el HTML y el CSS servidos no
 * esconden nada. Lo que se anima lo oculta el propio GSAP al arrancar, y solo
 * si está por debajo de la pantalla (ver `home-reveal.tsx`).
 *
 * El `useEffect` de aquí no anima: solo decide si montar y cuándo. La
 * animación vive en `useGSAP`, dentro del chunk perezoso.
 */
type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

export function HomeMotion() {
  const [Reveal, setReveal] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const connection = (navigator as { connection?: { saveData?: boolean } })
      .connection;
    if (connection?.saveData) return;

    const w = window as IdleWindow;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    let cancelled = false;
    const load = () => {
      import('./home-reveal')
        .then((mod) => {
          if (!cancelled) setReveal(() => mod.default);
        })
        // Sin red o sin chunk, la página se queda como vino: entera y quieta.
        .catch(() => {});
    };

    const schedule = () => {
      if (w.requestIdleCallback) {
        idleId = w.requestIdleCallback(load, { timeout: 3000 });
      } else {
        timeoutId = window.setTimeout(load, 200);
      }
    };

    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', schedule);
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  return Reveal ? <Reveal /> : null;
}
