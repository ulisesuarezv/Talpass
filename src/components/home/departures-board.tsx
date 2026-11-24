import { ArrowRight } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { getHomeTranslations } from '@/lib/home';
import type { OfferView } from '@/lib/home-board';

import { IncludeIcon } from './include-icon';
import { RevealOnView } from './reveal-on-view';

type T = Awaited<ReturnType<typeof getHomeTranslations>>;

/**
 * El listado de ofertas de la home con aspecto de panel de salidas: el código
 * de tres letras en fichas que giran al entrar en pantalla. Es una tabla
 * (role="table") porque es lo que es: filas que se comparan por columnas.
 */
export function DeparturesBoard({
  offers,
  t,
  note,
}: {
  offers: OfferView[];
  t: T;
  note: string;
}) {
  return (
    <RevealOnView className="tp-board">
      <div role="table" aria-label={t('board.label')}>
        <div role="row" className="tp-board-head">
          <span role="columnheader">{t('board.cols.place')}</span>
          <span role="columnheader">{t('board.cols.job')}</span>
          <span role="columnheader" className="tp-col-inc">
            {t('board.cols.includes')}
          </span>
          <span role="columnheader" className="tp-col-eur">
            {t('board.cols.salary')}
          </span>
          <span role="columnheader" className="tp-col-when">
            {t('board.cols.start')}
          </span>
          <span aria-hidden />
        </div>
        {offers.map((offer, row) => (
          <Link
            key={offer.key}
            href={offer.href}
            role="row"
            className="tp-board-row"
          >
            <span role="cell" className="tp-board-place">
              <span aria-hidden className="tp-tiles">
                {offer.code.split('').map((letter, i) => (
                  <span
                    key={i}
                    style={{ animationDelay: `${(row * 3 + i) * 45}ms` }}
                  >
                    {letter}
                  </span>
                ))}
              </span>
              <small>{offer.place}</small>
            </span>
            <span role="cell" className="tp-board-job">
              <b>{offer.title}</b>
              <span>{offer.sub}</span>
            </span>
            <span role="cell" className="tp-col-inc">
              <span className="tp-includes tp-includes-dark">
                {offer.includes.slice(0, 2).map((item) => (
                  <span key={item.label} data-hl={item.highlight || undefined}>
                    <IncludeIcon name={item.icon} />
                    {item.label}
                  </span>
                ))}
              </span>
            </span>
            <span role="cell" className="tp-col-eur">
              <b>
                {offer.salaryMain}
                {offer.salaryRest}
              </b>
              <small>{offer.salaryNote}</small>
            </span>
            <span role="cell" className="tp-col-when">
              {offer.start}
              {offer.startNote ? <small>{offer.startNote}</small> : null}
            </span>
            <span aria-hidden className="tp-board-cta">
              {offer.kind === 'job'
                ? t('board.viewJob')
                : t('board.viewProfile')}
              <ArrowRight className="size-3.5" />
            </span>
          </Link>
        ))}
      </div>
      <p className="tp-board-foot">
        <span>
          <i aria-hidden className="tp-live" />
          {note}
        </span>
      </p>
    </RevealOnView>
  );
}
