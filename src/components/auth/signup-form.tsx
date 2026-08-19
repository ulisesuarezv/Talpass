'use client';

import { useActionState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Field, FormAlert, SubmitButton } from '@/components/forms/form-parts';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { legalLink, type LegalDocument } from '@/config/legal';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { signUpAction, type ActionResult } from '@/lib/auth/actions';
import { MIN_PASSWORD_LENGTH } from '@/lib/validation';

/**
 * Alta de candidato. Los tres consentimientos son casillas separadas y
 * ninguna viene marcada (GDPR: el consentimiento es un acto, no un ajuste por
 * defecto).
 *
 * El del audio va aparte y explicado en una frase, no escondido dentro de los
 * términos (ADR-18): es el único que se puede retirar después sin cerrar la
 * cuenta, y el candidato tiene que saber qué está concediendo — que su voz sea
 * audible por agencias verificadas.
 *
 * **Los documentos se enlazan de verdad, uno a uno** (ADR-34). Hasta el
 * 2026-08-19 el marcador `<terms>` se renderizaba como `<strong>`: el texto
 * salía en negrita y no llevaba a ninguna parte, y las direcciones a las que
 * habría llevado eran 404. Se pedía un consentimiento sobre unos documentos
 * que nadie podía leer.
 *
 * Los enlaces abren en una pestaña nueva a propósito. Leer un texto legal a
 * mitad del alta no puede costarte el formulario que ya has rellenado, y en un
 * móvil volver atrás es exactamente donde se pierde a la gente.
 */
export function SignupForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const [state, action] = useActionState<ActionResult | null, FormData>(
    signUpAction,
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

      {failed ? <FormAlert>{t(`errors.${failed.error}`)}</FormAlert> : null}

      <Field name="email" label={t('fields.email')} error={fieldError('email')}>
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

      <Field
        name="password"
        label={t('fields.password')}
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

      <fieldset className="flex flex-col gap-4 border-t pt-5">
        <legend className="sr-only">{t('consents.legend')}</legend>

        <ConsentBox
          name="acceptTerms"
          error={fieldError('acceptTerms')}
          label={t.rich('consents.terms', {
            brand: siteConfig.name,
            terms: (chunks) => (
              <LegalLink document="terms" locale={locale as Locale}>
                {chunks}
              </LegalLink>
            ),
            privacy: (chunks) => (
              <LegalLink document="privacy" locale={locale as Locale}>
                {chunks}
              </LegalLink>
            ),
          })}
        />

        <ConsentBox
          name="acceptDataSharing"
          error={fieldError('acceptDataSharing')}
          label={t.rich('consents.dataSharing', {
            brand: siteConfig.name,
            dataSharing: (chunks) => (
              <LegalLink document="data_sharing" locale={locale as Locale}>
                {chunks}
              </LegalLink>
            ),
          })}
        />

        <ConsentBox
          name="acceptAudio"
          label={t.rich('consents.audio', {
            audio: (chunks) => (
              <LegalLink document="audio_sharing" locale={locale as Locale}>
                {chunks}
              </LegalLink>
            ),
          })}
          hint={t('consents.audioHint')}
        />

        <p className="text-xs text-muted-foreground">
          {t('consents.openInNewTab')}
        </p>
      </fieldset>

      <SubmitButton label={t('signup.submit')} pendingLabel={t('pending')} />

      <p className="text-sm text-muted-foreground">
        {t('signup.haveAccount')}{' '}
        <Link href="/login" className="underline underline-offset-4">
          {t('signup.loginLink')}
        </Link>
      </p>
    </form>
  );
}

/**
 * El enlace a un documento legal desde una frase de consentimiento.
 *
 * `target="_blank"` no es una preferencia: si leer los Términos te devuelve al
 * formulario vacío, nadie los lee. Va con `rel="noopener noreferrer"`, que es
 * lo que impide que la pestaña abierta pueda tocar a la que la abrió.
 */
function LegalLink({
  document,
  locale,
  children,
}: {
  document: LegalDocument;
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={legalLink(document, locale)}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-4"
    >
      {children}
    </Link>
  );
}

function ConsentBox({
  name,
  label,
  hint,
  error,
}: {
  name: string;
  label: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-3">
        {/* El área táctil es la etiqueta entera: en un móvil, una casilla de
            16 px es un objetivo que se falla. */}
        <Checkbox id={name} name={name} className="mt-0.5 size-5 shrink-0" />
        <label htmlFor={name} className="text-sm leading-snug">
          {label}
        </label>
      </div>

      {hint ? (
        <p className="pl-8 text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {error ? <p className="pl-8 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
