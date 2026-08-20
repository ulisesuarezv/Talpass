'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { Field, FormAlert, SubmitButton } from '@/components/forms/form-parts';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { updatePasswordAction, type ActionResult } from '@/lib/auth/actions';
import { MIN_PASSWORD_LENGTH } from '@/lib/validation';

/**
 * Se llega aquí desde el enlace del correo, ya con sesión: la ruta de callback
 * canjeó el código y escribió las cookies antes de redirigir.
 *
 * Si el enlace venía caducado, `authError` lo dice y la acción lo vuelve a
 * comprobar en servidor antes de tocar nada.
 */
export function ResetPasswordForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const linkError = useSearchParams().get('authError');

  const [state, action] = useActionState<ActionResult | null, FormData>(
    updatePasswordAction,
    null,
  );

  const failed = state && !state.ok ? state : null;
  const fieldError = (name: string) =>
    failed?.fieldErrors?.[name]
      ? t(`errors.${failed.fieldErrors[name]}`)
      : undefined;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />

      {linkError && !failed ? (
        <FormAlert>{t('errors.linkExpired')}</FormAlert>
      ) : null}
      {failed ? <FormAlert>{t(`errors.${failed.error}`)}</FormAlert> : null}

      <Field
        name="password"
        label={t('fields.newPassword')}
        hint={t('fields.passwordHint', { min: MIN_PASSWORD_LENGTH })}
        error={fieldError('password')}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </Field>

      <Field
        name="passwordConfirmation"
        label={t('fields.passwordConfirmation')}
        error={fieldError('passwordConfirmation')}
      >
        <Input
          id="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      <SubmitButton label={t('reset.submit')} pendingLabel={t('pending')} />

      <Link href="/forgot-password" className="text-sm type-link">
        {t('reset.requestAnother')}
      </Link>
    </form>
  );
}
