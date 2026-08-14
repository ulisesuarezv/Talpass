'use client';

import { useActionState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Field, FormAlert, SubmitButton } from '@/components/forms/form-parts';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { signInAction, type ActionResult } from '@/lib/auth/actions';

export function LoginForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const [state, action] = useActionState<ActionResult | null, FormData>(
    signInAction,
    null,
  );

  const failed = state && !state.ok ? state : null;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />

      {failed ? <FormAlert>{t(`errors.${failed.error}`)}</FormAlert> : null}

      <Field name="email" label={t('fields.email')}>
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

      <Field name="password" label={t('fields.password')}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <SubmitButton label={t('login.submit')} pendingLabel={t('pending')} />

      <div className="flex flex-col gap-2 text-sm">
        <Link href="/forgot-password" className="underline underline-offset-4">
          {t('login.forgot')}
        </Link>
        <p className="text-muted-foreground">
          {t('login.noAccount')}{' '}
          <Link href="/signup" className="underline underline-offset-4">
            {t('login.signupLink')}
          </Link>
        </p>
      </div>
    </form>
  );
}
