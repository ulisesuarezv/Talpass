'use client';

import { useActionState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Field, FormAlert, SubmitButton } from '@/components/forms/form-parts';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import {
  requestPasswordResetAction,
  type ActionResult,
} from '@/lib/auth/actions';

export function ForgotPasswordForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const [state, action] = useActionState<ActionResult | null, FormData>(
    requestPasswordResetAction,
    null,
  );

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-5">
        <FormAlert tone="success">{t(`messages.${state.message}`)}</FormAlert>
        <Link href="/login" className="text-sm type-link">
          {t('backToLogin')}
        </Link>
      </div>
    );
  }

  const failed = state && !state.ok ? state : null;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />

      {failed ? <FormAlert>{t(`errors.${failed.error}`)}</FormAlert> : null}

      <Field
        name="email"
        label={t('fields.email')}
        error={
          failed?.fieldErrors?.email
            ? t(`errors.${failed.fieldErrors.email}`)
            : undefined
        }
      >
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
        />
      </Field>

      <SubmitButton label={t('forgot.submit')} pendingLabel={t('pending')} />

      <Link href="/login" className="text-sm type-link">
        {t('backToLogin')}
      </Link>
    </form>
  );
}
