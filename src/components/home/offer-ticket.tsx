import type { getHomeTranslations } from '@/lib/home';
import type { OfferView } from '@/lib/home-board';

import { IncludeIcon } from './include-icon';

type T = Awaited<ReturnType<typeof getHomeTranslations>>;

/** Código de barras decorativo y determinista a partir de la clave. */
function Barcode({ seed }: { seed: string }) {
  let x = [...seed].reduce((a, c) => a + c.charCodeAt(0), 7);
  let pos = 0;
  const bars: { x: number; w: number }[] = [];
  for (let i = 0; i < 46; i++) {
    x = (x * 9301 + 49297) % 233280;
    const w = 1 + Math.floor((x / 233280) * 3);
    if (i % 2 === 0) bars.push({ x: pos, w });
    pos += w;
  }
  return (
    <svg
      aria-hidden
      className="tp-barcode"
      viewBox={`0 0 ${pos} 30`}
      preserveAspectRatio="none"
    >
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y={0} width={b.w} height={30} />
      ))}
    </svg>
  );
}

/**
 * La tarjeta de oferta con forma de billete. La metáfora va solo en la forma
 * (perforación, talón, código de barras); el texto es el de un portal de
 * empleo normal.
 */
export function OfferTicket({
  offer,
  t,
  className,
}: {
  offer: OfferView;
  t: T;
  className?: string;
}) {
  return (
    <article className={`tp-ticket ${className ?? ''}`}>
      <span aria-hidden className="tp-perf" />
      <span aria-hidden className="tp-notch tp-notch-top" />
      <span aria-hidden className="tp-notch tp-notch-bottom" />
      <div className="tp-ticket-main">
        <div className="tp-ticket-top">
          <span>{offer.sub.split(' · ')[0]}</span>
          <span className="tp-ticket-kind">
            {offer.kind === 'job' ? t('ticket.job') : t('ticket.profile')}
          </span>
        </div>
        <div className="tp-ticket-place">
          <div>
            <small>{t('ticket.place')}</small>
            <b>{offer.place}</b>
          </div>
          <b className="tp-ticket-code">{offer.code}</b>
        </div>
        <h3 className="tp-ticket-title">{offer.title}</h3>
        <ul className="tp-includes">
          {offer.includes.map((item) => (
            <li key={item.label} data-hl={item.highlight || undefined}>
              <IncludeIcon name={item.icon} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="tp-stub">
        <div>
          <small>{t('ticket.perHour')}</small>
          <div className="tp-stub-eur">
            {offer.salaryMain}
            {offer.salaryRest ? <em>{offer.salaryRest}</em> : null}
          </div>
        </div>
        <div>
          <small>{t('ticket.starts')}</small>
          <b className="tp-stub-when">{offer.start}</b>
        </div>
        <Barcode seed={offer.key} />
      </div>
    </article>
  );
}
