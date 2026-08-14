'use client';

import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Piezas comunes de los formularios. Ninguna contiene texto: todo lo que se lee
 * llega por props ya traducido desde el componente que las usa (ADR-01).
 */

export function Field({
  name,
  label,
  hint,
  error,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const describedBy =
    [hint ? `${name}-hint` : null, error ? `${name}-error` : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>

      {/* `aria-describedby` se inyecta aquí para no repetirlo en cada input. */}
      <div data-slot="control" aria-describedby={describedBy}>
        {children}
      </div>

      {hint ? (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormAlert({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'success';
  children: ReactNode;
}) {
  return (
    <Alert
      role={tone === 'error' ? 'alert' : 'status'}
      variant={tone === 'error' ? 'destructive' : 'default'}
      className={cn(tone === 'success' && 'border-foreground/20')}
    >
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

/**
 * Botón que se deshabilita mientras la acción está en vuelo. En una conexión
 * móvil lenta, esa ventana es de segundos y sin esto el candidato pulsa dos
 * veces y se registra dos veces.
 */
export function SubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      aria-busy={pending}
      className={cn('w-full', className)}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
