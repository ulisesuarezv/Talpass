'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { FormAlert, SubmitButton } from '@/components/forms/form-parts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  resendConfirmationAction,
  type ActionResult,
} from '@/lib/auth/actions';

/**
 * "Revisa tu correo", con la posibilidad de reenviar.
 *
 * El correo llega en la query desde el alta, pero el campo es editable y no
 * oculto: el motivo más común para no recibir nada es haberlo tecleado mal en
 * el móvil, y sin poder corregirlo la única salida sería crear otra cuenta.
 */
export function ResendConfirmationForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const emailFromSignup = useSearchParams().get('email') ?? '';

  const [state, action] = useActionState<ActionResult | null, FormData>(
    resendConfirmationAction,
    null,
  );

  const failed = state && !state.ok ? state : null;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />

      {state?.ok ? (
        <FormAlert tone="success">{t(`messages.${state.message}`)}</FormAlert>
      ) : null}
      {failed ? <FormAlert>{t(`errors.${failed.error}`)}</FormAlert> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t('fields.email')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          defaultValue={emailFromSignup}
          required
        />
      </div>

      <SubmitButton
        label={t('checkEmail.resend')}
        pendingLabel={t('pending')}
      />
    </form>
  );
}
