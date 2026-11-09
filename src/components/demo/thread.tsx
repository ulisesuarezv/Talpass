import { BusIcon, CalendarIcon, HomeIcon, MapPinIcon } from 'lucide-react';

import { ScrollToEnd } from '@/components/demo/client';
import type {
  ConversationJob,
  ConversationMessage,
  ConversationStatus,
} from '@/lib/demo/conversations';
import { cn } from '@/lib/utils';

/** ⚠️ DEMO. Piezas de la conversación compartidas por los dos lados. */

const STATUS_STYLE: Record<ConversationStatus, string> = {
  pending: 'bg-amber-100 text-amber-900',
  open: 'bg-brand-soft text-foreground',
  declined: 'bg-muted text-muted-foreground',
  hired: 'bg-emerald-100 text-emerald-900',
};

export function StatusPill({
  status,
  label,
}: {
  status: ConversationStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 type-caption font-medium',
        STATUS_STYLE[status],
      )}
    >
      {label}
    </span>
  );
}

export function formatTime(iso: string, locale: string) {
  const date = new Date(iso);
  const sameDay = new Date().toDateString() === date.toDateString();
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'Europe/Berlin',
    ...(sameDay
      ? { hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
  }).format(date);
}

export function Messages({
  messages,
  locale,
  youLabel,
  otherLabel,
}: {
  messages: ConversationMessage[];
  locale: string;
  youLabel: string;
  otherLabel: string;
}) {
  return (
    <ol className="flex flex-col gap-3">
      {messages.map((message) => (
        <li
          key={message.id}
          className={cn(
            'flex max-w-[85%] flex-col gap-1 sm:max-w-[70%]',
            message.mine ? 'items-end self-end' : 'items-start self-start',
          )}
        >
          <span className="type-caption text-muted-foreground">
            {message.mine ? youLabel : otherLabel} ·{' '}
            {formatTime(message.created_at, locale)}
          </span>
          <p
            className={cn(
              'rounded-2xl px-4 py-2.5 type-body whitespace-pre-wrap',
              message.mine
                ? 'rounded-br-sm bg-hero text-hero-foreground'
                : 'rounded-bl-sm border bg-card',
            )}
          >
            {message.body}
          </p>
        </li>
      ))}
      <ScrollToEnd count={messages.length} />
    </ol>
  );
}

export function JobCard({
  job,
  locale,
  labels,
}: {
  job: ConversationJob;
  locale: string;
  labels: {
    heading: string;
    perHour: (amount: string) => string;
    fromPerHour: (amount: string) => string;
    transport: string;
    housing: string;
    start: (date: string) => string;
  };
}) {
  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(value);

  const salary =
    job.salary_min != null
      ? job.salary_max != null
        ? labels.perHour(`${money(job.salary_min)}–${money(job.salary_max)}`)
        : labels.fromPerHour(money(job.salary_min))
      : null;

  return (
    <section className="flex flex-col gap-2 rounded-xl border-2 border-brand/30 bg-card p-4">
      <p className="type-eyebrow">{labels.heading}</p>
      <h3 className="type-h4">{job.title}</h3>
      {salary ? <p className="type-h3 text-brand-strong">{salary}</p> : null}
      {job.description ? (
        <p className="type-meta text-muted-foreground">{job.description}</p>
      ) : null}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 type-meta">
        {job.city ? (
          <li className="inline-flex items-center gap-1.5">
            <MapPinIcon aria-hidden className="size-4" />
            {job.city}
          </li>
        ) : null}
        {job.transport_provided ? (
          <li className="inline-flex items-center gap-1.5">
            <BusIcon aria-hidden className="size-4" />
            {labels.transport}
          </li>
        ) : null}
        {job.housing_provided ? (
          <li className="inline-flex items-center gap-1.5">
            <HomeIcon aria-hidden className="size-4" />
            {labels.housing}
          </li>
        ) : null}
        {job.start_date ? (
          <li className="inline-flex items-center gap-1.5">
            <CalendarIcon aria-hidden className="size-4" />
            {labels.start(
              new Intl.DateTimeFormat(locale, {
                day: 'numeric',
                month: 'long',
                timeZone: 'UTC',
              }).format(new Date(job.start_date)),
            )}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
