import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import {
  ArrowRight,
  Check,
  ChevronDown,
  House,
  Languages,
  Play,
  Sparkles,
} from 'lucide-react';

import { DeparturesBoard } from '@/components/home/departures-board';
import { FlapText } from '@/components/home/flap-text';
import { HomeMotion } from '@/components/home/home-motion';
import { OfferTicket } from '@/components/home/offer-ticket';
import { legalLink } from '@/config/legal';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getHomeTranslations } from '@/lib/home';
import { getHomeBoard } from '@/lib/home-board';
import { seoMetadata } from '@/lib/seo';

import heroPhoto from '../../../../public/home/hero-nave.webp';
import './home.css';

/**
 * Home pública — rediseño de Kayao (2026-11-24, rama `design/home-candidato`).
 *
 * Portal de empleo enfocado al candidato: buscador y billete en el hero,
 * panel de ofertas, cómo funciona en cuatro pasos, el perfil verificado,
 * las ciudades (solo cuando hay vacantes con ciudad) y el FAQ de siempre.
 *
 * Sigue estática y revalidada cada hora: no lee sesión ni cookies (ADR-11,
 * ADR-13). Lee las vacantes publicadas y los perfiles de mercado, y cada fila
 * dice cuál de las dos cosas es (ADR-30).
 *
 * La metáfora de billete/estación va solo en la forma. El texto habla como un
 * portal de empleo normal (decisión de Ulises, 2026-11-24).
 */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return seoMetadata({
    locale,
    href: '/',
    title: t('title', { brand: siteConfig.name }),
    description: t('description'),
  });
}

/** Las seis preguntas del FAQ, en el orden que fijó Ulises. */
const FAQ = ['cost', 'who', 'eu', 'travel', 'pay', 'data'] as const;

/** Los cuatro pasos, en el orden en que le ocurren al candidato. */
const STEPS = ['offer', 'apply', 'chat', 'sign'] as const;

/** Fotos de ciudad disponibles. Las demás usan una genérica de equipo. */
const CITY_PHOTOS: Record<string, string> = {
  berlin: '/home/berlin.webp',
  hamburg: '/home/hamburg.webp',
  leipzig: '/home/leipzig.webp',
  nuremberg: '/home/nuremberg.webp',
  nurnberg: '/home/nuremberg.webp',
  munich: '/home/munich.webp',
  munchen: '/home/munich.webp',
  cologne: '/home/cologne.webp',
  koln: '/home/cologne.webp',
  frankfurt: '/home/frankfurt.webp',
  'frankfurt am main': '/home/frankfurt.webp',
};

function cityPhoto(city: string) {
  const key = city.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return CITY_PHOTOS[key] ?? '/home/ciudad.webp';
}

/** Barras de la onda del audio de ejemplo: decorativas y deterministas. */
const WAVE = Array.from({ length: 44 }, (_, k) =>
  Math.round(
    (Math.abs(Math.sin(k * 0.55) * Math.cos(k * 0.21)) * 0.85 + 0.15) * 100,
  ),
);

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, board] = await Promise.all([
    getHomeTranslations(locale),
    getHomeBoard(locale),
  ]);

  const brand = siteConfig.name;
  const heroOffer = board.offers[0];
  const flapWords = board.jobCities.length
    ? board.jobCities.map((c) => c.city)
    : (t.raw('hero.flapWords') as string[]);
  const ticker = [...board.offers, ...board.offers];

  return (
    <div className="tp-home">
      <div className="tp-container tp-hero-wrap">
        {/* ---------------- Hero ---------------- */}
        <section className="tp-hero" aria-labelledby="home-title">
          {/* Es el LCP de la home: <img> con prioridad y tamaños por pantalla,
              no fondo CSS, para que el navegador lo pida desde el HTML. */}
          <Image
            src={heroPhoto}
            alt={t('hero.photoAlt')}
            fill
            priority
            sizes="(max-width: 760px) 60vw, (max-width: 1280px) 100vw, 1208px"
            placeholder="blur"
            className="tp-hero-bg"
          />
          <div className="tp-hero-l">
            {/* «El primero»: reclamo publicado a sabiendas por decisión de
                Ulises (ADR-45), y reforzado en el rediseño a petición suya. */}
            <p className="tp-badge">
              <i aria-hidden>{t('hero.badgeMark')}</i>
              {t('hero.badge')}
            </p>
            <h1 id="home-title" className="tp-h1">
              {t('hero.title')}{' '}
              <span className="tp-accent">{t('hero.titleAccent')}</span>
            </h1>
            <p className="tp-sub">{t('hero.subtitle')}</p>

            {/* El buscador lleva al listado completo: los filtros viven en
                `/ofertas` (ADR-24). Pendiente: pasar los filtros por URL. */}
            <Link
              href="/jobs"
              className="tp-search tp-rise tp-d3"
              aria-label={t('hero.search.label')}
            >
              <span className="tp-field">
                <small>{t('hero.search.what')}</small>
                <b>{t('hero.search.whatValue')}</b>
              </span>
              <span className="tp-field">
                <small>{t('hero.search.where')}</small>
                <b>
                  <FlapText words={flapWords} />
                </b>
              </span>
              <span className="tp-field tp-field-wide">
                <small>{t('hero.search.include')}</small>
                <b>{t('hero.search.includeValue')}</b>
              </span>
              <span className="tp-btn tp-btn-or tp-search-go">
                {t('hero.search.submit')}
              </span>
            </Link>

            <div className="tp-quick tp-rise tp-d4">
              <span>{t('hero.popularLabel')}</span>
              <Link href="/jobs" className="tp-qchip">
                <House aria-hidden />
                {t('hero.popular.housing')}
              </Link>
              <Link href="/jobs" className="tp-qchip">
                <Sparkles aria-hidden />
                {t('hero.popular.noExperience')}
              </Link>
              <Link href="/jobs" className="tp-qchip">
                <Languages aria-hidden />
                {t('hero.popular.english')}
              </Link>
            </div>
          </div>

          <div className="tp-hero-r">
            {heroOffer ? (
              <div className="tp-hero-ticket" aria-hidden>
                <div className="tp-ghost" />
                <OfferTicket offer={heroOffer} t={t} />
                <div className="tp-stamp">
                  <span>{t('hero.stamp.title')}</span>
                  <small>{t('hero.stamp.sub')}</small>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="tp-ticker" aria-hidden>
          <div className="tp-ticker-track">
            {ticker.map((offer, i) => (
              <span key={`${offer.key}-${i}`}>
                <b>{offer.code}</b>
                {offer.place} · {offer.title}
                <em>
                  {offer.salaryMain}
                  {offer.salaryRest} €/h
                </em>
              </span>
            ))}
          </div>
        </div>

        {/* ---------------- Ofertas ---------------- */}
        <section id="ofertas" className="tp-s" aria-labelledby="home-offers">
          <div className="tp-s-head">
            <div>
              <p className="tp-kicker">
                {board.hasJobs ? t('board.kicker') : t('board.kickerProfiles')}
              </p>
              <h2 id="home-offers" className="tp-h2">
                {board.hasJobs ? t('board.title') : t('board.titleProfiles')}
              </h2>
            </div>
            <Link href="/jobs" className="tp-link">
              {t('board.seeAll')}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <DeparturesBoard
            offers={board.offers}
            t={t}
            note={
              board.hasJobs
                ? t('board.jobsNote')
                : t('board.note', { date: board.sourceDate })
            }
          />
          <p className="tp-list-foot">
            {board.hasJobs ? t('board.foot') : t('board.footProfiles')}
          </p>
        </section>

        {/* ---------------- Cómo funciona ---------------- */}
        <section id="como-funciona" className="tp-s" aria-labelledby="home-how">
          <div className="tp-s-head">
            <div>
              <p className="tp-kicker">{t('how.kicker')}</p>
              <h2 id="home-how" className="tp-h2">
                {t('how.title')}
              </h2>
            </div>
            <div className="tp-legend">
              <span>
                <i className="tp-lg-solid" />
                {t('how.legendApply')}
              </span>
              <span>
                <i className="tp-lg-dash" />
                {t('how.legendFound')}
              </span>
            </div>
          </div>

          <ol className="tp-metro">
            {STEPS.map((step, index) => (
              <li
                key={step}
                className="tp-stop"
                data-join={step === 'chat' || undefined}
                data-end={step === 'sign' || undefined}
              >
                <div className="tp-vig" aria-hidden>
                  {step === 'offer'
                    ? board.offers.slice(0, 2).map((offer, i) => (
                        <div
                          key={offer.key}
                          className="tp-v-row"
                          data-dim={i > 0 || undefined}
                        >
                          <span className="tp-tiles tp-tiles-sm">
                            {offer.code.split('').map((l, j) => (
                              <span key={j}>{l}</span>
                            ))}
                          </span>
                          <span className="tp-v-job">
                            <b>{offer.title}</b>
                            <small>{offer.place}</small>
                          </span>
                          <b className="tp-v-eur">
                            {offer.salaryMain}
                            {offer.salaryRest} €
                          </b>
                        </div>
                      ))
                    : null}
                  {step === 'apply' ? (
                    <div className="tp-v-apply">
                      <div className="tp-v-offer">
                        <div>
                          <small>{t('how.vignette.offerSub')}</small>
                          <b>{t('how.vignette.offerTitle')}</b>
                        </div>
                        <b className="tp-v-offer-eur">
                          {t('how.vignette.offerSalary')}
                        </b>
                      </div>
                      <div className="tp-v-me">
                        <span className="tp-av tp-av-sm">CM</span>
                        <div>
                          <small>{t('how.vignette.applyAs')}</small>
                          <b>{t('profile.card.name')}</b>
                        </div>
                        <span className="tp-v-ok">
                          {t('how.vignette.verified')}
                        </span>
                      </div>
                      <span className="tp-v-btn">
                        {t('how.vignette.applyCta')}
                      </span>
                    </div>
                  ) : null}
                  {step === 'chat' ? (
                    <div className="tp-v-chat">
                      <p data-from="them">
                        <small>{t('how.vignette.agency')}</small>
                        {t('how.vignette.chat1')}
                      </p>
                      <p data-from="me">{t('how.vignette.chat2')}</p>
                      <p data-from="them">{t('how.vignette.chat3')}</p>
                    </div>
                  ) : null}
                  {step === 'sign' ? (
                    <div className="tp-v-sign">
                      <div className="tp-v-ph" />
                      <div className="tp-v-sign-tx">
                        <small>{t('how.vignette.contract')}</small>
                        <b>{t('how.vignette.contractWith')}</b>
                        <span>{t('how.vignette.signed')}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="tp-node">
                  <span>{index + 1}</span>
                </div>
                <div className="tp-step-tx">
                  <small>{t('how.step', { n: String(index + 1) })}</small>
                  <h3>{t(`how.steps.${step}.title`)}</h3>
                  <p>{t(`how.steps.${step}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="tp-branch" data-reveal>
            <div className="tp-br-line" aria-hidden>
              <span className="tp-br-dot">{t('how.branch.tag')}</span>
              <span className="tp-br-dash" />
              <span className="tp-br-dot tp-br-dot-o">3</span>
            </div>
            <div>
              <h3 className="tp-h4">{t('how.branch.title')}</h3>
              <p>{t('how.branch.body')}</p>
            </div>
          </div>
        </section>

        {/* ---------------- Tu perfil ---------------- */}
        <section
          id="perfil"
          className="tp-s tp-profile-sec"
          aria-labelledby="home-profile"
        >
          <div className="tp-profile-copy">
            <p className="tp-kicker">{t('profile.kicker')}</p>
            <h2 id="home-profile" className="tp-h2">
              {t('profile.title1')}
              <br />
              {t('profile.title2')}
            </h2>
            <p className="tp-lead">{t('profile.lead')}</p>
            <div className="tp-sees">
              <div>
                <h3>{t('profile.seesTitle')}</h3>
                <ul>
                  {(t.raw('profile.sees') as string[]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div data-no>
                <h3>{t('profile.hiddenTitle')}</h3>
                <ul>
                  {(t.raw('profile.hidden') as string[]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="tp-profile-actions">
              <Link href="/signup" className="tp-btn tp-btn-or">
                {t('profile.cta')}
              </Link>
              <Link
                href={legalLink('data_sharing', locale)}
                className="tp-link"
              >
                {t('faq.items.data.link')}
              </Link>
            </div>
          </div>

          <div className="tp-pass-stage" data-reveal>
            <article className="tp-pass" aria-label={t('profile.card.note')}>
              <div className="tp-pass-top">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/talpass-icon-provisional.png"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <b>{brand.toUpperCase()}</b>
                  <small>{t('profile.card.label')}</small>
                </div>
              </div>
              <div className="tp-pass-id">
                <span className="tp-av">CM</span>
                <div className="tp-who">
                  <small>{t('profile.card.candidate')}</small>
                  <b>{t('profile.card.name')}</b>
                  <span>{t('profile.card.meta')}</span>
                </div>
                <span className="tp-ok">
                  <Check aria-hidden className="size-3.5" />
                  {t('profile.card.verified')}
                </span>
              </div>
              <ul className="tp-seals">
                {(
                  t.raw('profile.card.seals') as {
                    label: string;
                    value: string;
                  }[]
                ).map((seal) => (
                  <li key={seal.label}>
                    <small>{seal.label}</small>
                    <b>{seal.value}</b>
                    <i>{t('profile.card.reviewed')}</i>
                  </li>
                ))}
              </ul>
              <div className="tp-audio">
                <span className="tp-play" title={t('profile.card.play')}>
                  <Play aria-hidden className="size-4" fill="currentColor" />
                </span>
                <span className="tp-wave" aria-hidden>
                  {WAVE.map((h, k) => (
                    <i
                      key={k}
                      data-p={k < 17 || undefined}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </span>
                <span className="tp-lvl">
                  <small>{t('profile.card.english')}</small>
                  <b>B1</b>
                </span>
              </div>
              <dl className="tp-pass-grid">
                <div>
                  <dt>{t('profile.card.available')}</dt>
                  <dd>{t('profile.card.availableValue')}</dd>
                </div>
                <div>
                  <dt>{t('profile.card.needs')}</dt>
                  <dd>{t('profile.card.needsValue')}</dd>
                </div>
                <div data-hidden>
                  <dt>
                    {t('profile.card.phone')} ·{' '}
                    <span>{t('profile.card.hiddenTag')}</span>
                  </dt>
                  <dd aria-label={t('profile.card.hiddenTag')}>••• •• •• ••</dd>
                </div>
                <div data-hidden>
                  <dt>
                    {t('profile.card.surname')} ·{' '}
                    <span>{t('profile.card.hiddenTag')}</span>
                  </dt>
                  <dd aria-label={t('profile.card.hiddenTag')}>••••••••</dd>
                </div>
              </dl>
            </article>
            <p className="tp-pass-note">{t('profile.card.note')}</p>
          </div>
        </section>

        {/* ---------------- Ciudades (solo con vacantes reales) ---------------- */}
        {board.jobCities.length ? (
          <section className="tp-s" aria-labelledby="home-cities">
            <div className="tp-s-head">
              <div>
                <p className="tp-kicker">{t('cities.kicker')}</p>
                <h2 id="home-cities" className="tp-h2">
                  {t('cities.title')}
                </h2>
              </div>
            </div>
            <ul className="tp-cities">
              {board.jobCities.map(({ city, count }) => (
                <li key={city}>
                  <Link href="/jobs" className="tp-city" data-reveal>
                    <span
                      aria-hidden
                      className="tp-city-ph"
                      style={{ backgroundImage: `url(${cityPhoto(city)})` }}
                    />
                    <h3>{city}</h3>
                    <span className="tp-city-row">
                      {t('cities.count', { count })}
                      <ArrowRight aria-hidden className="size-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ---------------- FAQ (copy de Ulises, sin cambios) ---------------- */}
        <section className="tp-s tp-faq" aria-labelledby="home-faq">
          <div className="tp-faq-head">
            <h2 id="home-faq" className="tp-h2">
              {t('faq.title')}
            </h2>
            <p className="tp-lead">{t('faq.hook')}</p>
          </div>
          <div className="tp-faq-list">
            {FAQ.map((key) => (
              <details key={key} data-reveal className="group">
                <summary>
                  <h3>{t(`faq.items.${key}.q`, { brand })}</h3>
                  <ChevronDown
                    aria-hidden
                    className="size-5 shrink-0 group-open:rotate-180"
                  />
                </summary>
                <p>{t(`faq.items.${key}.a`, { brand })}</p>
                {key === 'data' ? (
                  <p>
                    <Link
                      href={legalLink('data_sharing', locale)}
                      className="tp-link"
                    >
                      {t('faq.items.data.link')}
                    </Link>
                  </p>
                ) : null}
              </details>
            ))}
          </div>
        </section>

        {/* ---------------- Cierre ---------------- */}
        <section className="tp-cta" aria-labelledby="home-cta" data-reveal>
          <div>
            <p className="tp-kicker">{t('cta.kicker')}</p>
            <h2 id="home-cta" className="tp-h2">
              {t('cta.title')}
            </h2>
            <p>{t('cta.body')}</p>
          </div>
          <div className="tp-cta-btns">
            <Link href="/jobs" className="tp-btn tp-btn-or">
              {t('cta.jobs')}
            </Link>
            <Link href="/signup" className="tp-btn tp-btn-dark">
              {t('cta.signup')}
            </Link>
          </div>
        </section>
      </div>

      <HomeMotion />
    </div>
  );
}
