'use client';

import { useEffect, useRef } from 'react';
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
