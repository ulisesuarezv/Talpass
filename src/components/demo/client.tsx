'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangleIcon } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useRouter } from '@/i18n/navigation';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * ⚠️ DEMO. Refresca la página cada pocos segundos para que lo que escribe un
 * lado aparezca en la ventana del otro sin recargar a mano.
 */
export function AutoRefresh({ ms = 2500 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), ms);
    return () => clearInterval(id);
  }, [router, ms]);
  return null;
}

/** Baja al último mensaje al cargar y cuando llega uno nuevo. */
export function ScrollToEnd({ count }: { count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'end' });
  }, [count]);
  return <div ref={ref} />;
}

function SubmitButton({
  label,
  variant,
  size = 'lg',
  name,
  value,
}: {
  label: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'lg';
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size={size}
      variant={variant}
      disabled={pending}
      name={name}
      value={value}
    >
      {label}
    </Button>
  );
}

export { SubmitButton };

/**
 * Caja de escribir: se vacía al enviar, y Enter envía (Mayús+Enter salta de
 * línea), como en cualquier chat.
 */
export function Composer({
  action,
  hidden,
  placeholder,
  sendLabel,
  defaultValue,
  rows = 2,
}: {
  action: (form: FormData) => Promise<void>;
  hidden: Record<string, string>;
  placeholder: string;
  sendLabel: string;
  defaultValue?: string;
  rows?: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (form) => {
        await action(form);
        if (!defaultValue) formRef.current?.reset();
      }}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Textarea
        name="body"
        required
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="min-h-12 flex-1 text-base"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
      />
      <SubmitButton label={sendLabel} />
    </form>
  );
}

/**
 * Botón de contratar con aviso: los datos se piden solo cuando la ETT está
 * segura, porque desde ese momento cuenta como contratado y se factura.
 */
export function HireButton({
  action,
  conversationId,
  labels,
}: {
  action: (form: FormData) => Promise<void>;
  conversationId: string;
  labels: {
    trigger: string;
    title: string;
    body: string;
    confirm: string;
    cancel: string;
  };
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <Button type="button" size="lg" onClick={() => setOpen(true)}>
        {labels.trigger}
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="hire-title"
            aria-describedby="hire-body"
            className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <AlertTriangleIcon aria-hidden className="size-5" />
              </span>
              <div className="flex flex-col gap-2">
                <h2 id="hire-title" className="type-h4">
                  {labels.title}
                </h2>
                <p id="hire-body" className="type-body text-muted-foreground">
                  {labels.body}
                </p>
              </div>
            </div>
            <form
              action={action}
              className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
            >
              <input
                type="hidden"
                name="conversationId"
                value={conversationId}
              />
              <Button
                type="button"
                variant="outline"
                size="lg"
                autoFocus
                onClick={() => setOpen(false)}
              >
                {labels.cancel}
              </Button>
              <SubmitButton label={labels.confirm} />
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
