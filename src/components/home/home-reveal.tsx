'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

/**
 * El revelado al hacer scroll de la home. Vive en un chunk que solo pide
 * `home-motion.tsx`, tras `load` y en ocioso: GSAP no está en el JS inicial.
 *
 * **Qué se anima y qué no.** Solo lo marcado con `data-reveal` que, en el
 * momento de arrancar, está ENTERO por debajo de la pantalla. Lo que ya se ve
 * no se toca nunca —ni el hero, ni la cabecera de ofertas, ni la tarjeta del
 * LCP—, y lo que el usuario ya dejó atrás tampoco. Así nada visible parpadea y
 * el HTML servido no oculta nada: si GSAP no carga, todo está ahí.
 *
 * **El tono es sobrio a propósito:** 16 px de subida y un fundido de 0,55 s,
 * una sola vez. Es un portal de empleo que tiene que parecer serio; la
 * animación acompaña el scroll, no lo protagoniza.
 *
 * **El único gesto con intención** son las barras de la ficha de privacidad
 * (`data-redact`): se trazan de izquierda a derecha, como un rotulador que
 * tacha. Es `clip-path` `inset → inset`, así que el redondeo no se deforma.
 *
 * **Sin ScrollTrigger, y se midió.** Para un revelado de una sola vez, sin
 * `scrub` ni `pin`, el `IntersectionObserver` del navegador hace lo mismo y
 * ahorra ~17 KB gz a cada visitante, que en esta página es alguien con datos
 * limitados. Además sigue la geometría en vivo: abrir una pregunta del FAQ no
 * obliga a recalcular nada. Los lotes que entrega el observador son los
 * `batch` de ScrollTrigger, y el `stagger` va dentro de cada lote.
 *
 * **CLS 0:** solo `opacity`, `transform` y `clip-path`, que no mueven el
 * layout. Al terminar se limpian los estilos en línea.
 */
export default function HomeReveal() {
  useGSAP((_context, contextSafe) => {
    const fold = window.innerHeight;
    const below = (el: HTMLElement) => el.getBoundingClientRect().top > fold;

    const items = gsap.utils
      .toArray<HTMLElement>('[data-reveal]')
      .filter(below);
    const bars = gsap.utils.toArray<HTMLElement>('[data-redact]').filter(below);
    if (items.length === 0 && bars.length === 0) return;

    gsap.set(items, { opacity: 0, y: 16 });
    gsap.set(bars, { clipPath: 'inset(0% 100% 0% 0% round 999px)' });

    /**
     * El escalonado entre piezas de un mismo lote, con techo: 80 ms entre una
     * y otra, pero nunca más de 0,3 s en total. Sin techo, un lote grande
     * dejaba la última pieza en blanco más de medio segundo.
     */
    const stagger = (count: number, each: number) =>
      count > 1 ? Math.min(each, 0.3 / (count - 1)) : 0;

    const revealItems = contextSafe!((batch: Element[]) => {
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: stagger(batch.length, 0.08),
        overwrite: true,
        clearProps: 'opacity,transform',
      });
    });

    const drawBars = contextSafe!((batch: Element[]) => {
      gsap.to(batch, {
        clipPath: 'inset(0% 0% 0% 0% round 999px)',
        duration: 0.5,
        delay: 0.2,
        ease: 'power2.inOut',
        stagger: stagger(batch.length, 0.12),
        clearProps: 'clipPath',
      });
    });

    /** Lo que ya quedó atrás no se anima: se deja como vino, sin esperar turno. */
    const showNow = contextSafe!((passed: Element[]) => {
      gsap.set(passed, { clearProps: 'opacity,transform,clipPath' });
    });

    /**
     * Un observador que entrega en lote lo que entra y lo suelta después.
     *
     * El margen de arriba es enorme a propósito: cuenta como «dentro» todo lo
     * que queda por ENCIMA de la pantalla. Sin él, un salto largo —un toque en
     * la barra, un enlace a un ancla, la tecla Fin— puede llevar un elemento
     * de debajo a encima sin pasar nunca por la pantalla, y el observador no
     * avisa: se quedaba oculto para siempre (visto en la verificación). Con
     * él, dejarlo atrás también lo revela.
     *
     * Y lo que se dejó atrás se muestra al instante, fuera del escalonado. Si
     * entrara en el lote, un salto metía ahí las diez piezas saltadas y lo
     * que sí estaba en pantalla esperaba su turno: medido, 550 ms en blanco.
     * La posición sale de la propia entrada, sin leer el layout.
     */
    const observe = (
      targets: HTMLElement[],
      bottomInset: string,
      onEnter: (batch: Element[]) => void,
    ) => {
      const observer = new IntersectionObserver(
        (entries) => {
          const entered = entries.filter((entry) => entry.isIntersecting);
          if (entered.length === 0) return;
          entered.forEach((entry) => observer.unobserve(entry.target));

          const passed = entered.filter(
            (entry) => entry.boundingClientRect.bottom <= 0,
          );
          const onScreen = entered.filter(
            (entry) => entry.boundingClientRect.bottom > 0,
          );
          if (passed.length > 0) showNow(passed.map((entry) => entry.target));
          if (onScreen.length > 0)
            onEnter(onScreen.map((entry) => entry.target));
        },
        { rootMargin: `100000px 0px -${bottomInset} 0px` },
      );
      targets.forEach((el) => observer.observe(el));
      return observer;
    };

    const itemObserver = observe(items, '8%', revealItems);
    const barObserver = observe(bars, '15%', drawBars);

    // Quien llega con el tabulador a algo aún oculto lo ve al instante: el
    // foco no puede caer en un elemento invisible.
    const onFocus = contextSafe!((event: FocusEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(
        '[data-reveal]',
      );
      if (!target || !items.includes(target)) return;
      itemObserver.unobserve(target);
      gsap.to(target, {
        opacity: 1,
        y: 0,
        duration: 0.2,
        overwrite: true,
        clearProps: 'opacity,transform',
      });
    });

    document.addEventListener('focusin', onFocus);
    return () => {
      itemObserver.disconnect();
      barObserver.disconnect();
      document.removeEventListener('focusin', onFocus);
    };
  });

  return null;
}
