'use client';

import { useEffect, useState } from 'react';

/**
 * Texto que va cambiando con un giro de panel de estación (las ciudades del
 * buscador del hero). Sin JavaScript, o con `prefers-reduced-motion`, se queda
 * en la primera palabra.
 */
export function FlapText({
  words,
  interval = 2800,
}: {
  words: string[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const [flip, setFlip] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = window.setInterval(() => {
      setFlip((f) => f + 1);
      window.setTimeout(() => setIndex((i) => (i + 1) % words.length), 260);
    }, interval);

    return () => window.clearInterval(id);
  }, [words.length, interval]);

  return (
    <span className="tp-flap" aria-live="off">
      <span key={flip} className={flip ? 'tp-flap-on' : undefined}>
        {words[index]}
      </span>
    </span>
  );
}
