'use client';

import { useActionState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Field, FormAlert, SubmitButton } from '@/components/forms/form-parts';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import type { ActionResult } from '@/lib/auth/actions';
import {
  finishOnboardingAction,
  saveOnboardingStepAction,
} from '@/lib/candidate/actions';
import type { CountryOption } from '@/lib/catalogs';
import { LAST_STEP, type OnboardingDraft } from '@/lib/candidate/onboarding';
import { ENGLISH_LEVELS } from '@/lib/validation';

/**
 * Onboarding en cinco pantallas cortas.
 *
 * Decisiones que son de móvil y no de estética:
 *  · un `<form>` por paso, con envío real, para que el botón "atrás" del
 *    navegador haga lo que el candidato espera;
 *  · el progreso lo guarda el servidor al pasar de paso, así que recargar,
 *    quedarse sin batería o cambiar de teléfono no borra nada;
 *  · `inputMode` y `autoComplete` en cada campo, que es lo que decide qué
 *    teclado sale y si el móvil ofrece autorrellenar.
 */
export function OnboardingWizard({
  step,
  draft,
  countries,
}: {
  step: number;
  draft: OnboardingDraft;
  countries: CountryOption[];
}) {
  const t = useTranslations('Onboarding');

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t('progress', { step, total: LAST_STEP })}
        </p>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={LAST_STEP}
          aria-label={t('progressLabel')}
        >
          <div
            className="h-full bg-foreground transition-all"
            style={{ width: `${(step / LAST_STEP) * 100}%` }}
          />
        </div>
      </div>

      {step === LAST_STEP ? (
        <ReviewStep draft={draft} countries={countries} />
      ) : (
        <StepForm step={step} draft={draft} countries={countries} />
      )}
    </div>
  );
}

function useStepAction() {
  const locale = useLocale();
  const [state, action] = useActionState<ActionResult | null, FormData>(
    saveOnboardingStepAction,
    null,
  );
  const failed = state && !state.ok ? state : null;

  return { locale, action, failed };
}

function StepForm({
  step,
  draft,
  countries,
}: {
  step: number;
  draft: OnboardingDraft;
  countries: CountryOption[];
}) {
  const t = useTranslations('Onboarding');
  const tErrors = useTranslations('Auth.errors');
  const { locale, action, failed } = useStepAction();

  const err = (name: string) =>
    failed?.fieldErrors?.[name] ? tErrors(failed.fieldErrors[name]) : undefined;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="step" value={step} />

      <h1 className="text-xl font-semibold tracking-tight">
        {t(`steps.${step}.title`)}
      </h1>
      <p className="-mt-3 text-sm text-muted-foreground">
        {t(`steps.${step}.help`)}
      </p>

      {failed ? <FormAlert>{tErrors(failed.error)}</FormAlert> : null}

      {step === 1 ? <IdentityFields draft={draft} err={err} /> : null}
      {step === 2 ? (
        <OriginFields draft={draft} countries={countries} err={err} />
      ) : null}
      {step === 3 ? <EnglishFields draft={draft} err={err} /> : null}
      {step === 4 ? <NeedsFields draft={draft} /> : null}

      <SubmitButton label={t('next')} pendingLabel={t('saving')} />

      {step > 1 ? (
        <Link
          href={{ pathname: '/onboarding', query: { step: String(step - 1) } }}
          className="text-center text-sm underline underline-offset-4"
        >
          {t('back')}
        </Link>
      ) : null}
    </form>
  );
}

// --- Paso 1 ---------------------------------------------------------------

function IdentityFields({
  draft,
  err,
}: {
  draft: OnboardingDraft;
  err: (name: string) => string | undefined;
}) {
  const t = useTranslations('Onboarding.fields');

  return (
    <>
      <Field name="firstName" label={t('firstName')} error={err('firstName')}>
        <Input
          id="firstName"
          name="firstName"
          autoComplete="given-name"
          autoCapitalize="words"
          defaultValue={draft.firstName ?? ''}
          required
        />
      </Field>

      <Field name="lastName" label={t('lastName')} error={err('lastName')}>
        <Input
          id="lastName"
          name="lastName"
          autoComplete="family-name"
          autoCapitalize="words"
          defaultValue={draft.lastName ?? ''}
          required
        />
      </Field>

      <Field
        name="dateOfBirth"
        label={t('dateOfBirth')}
        hint={t('dateOfBirthHint')}
        error={err('dateOfBirth')}
      >
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          autoComplete="bday"
          defaultValue={draft.dateOfBirth ?? ''}
          required
        />
      </Field>
    </>
  );
}

// --- Paso 2 ---------------------------------------------------------------

function CountrySelect({
  name,
  label,
  countries,
  defaultValue,
  error,
  autoComplete,
}: {
  name: string;
  label: string;
  countries: CountryOption[];
  defaultValue?: string;
  error?: string;
  autoComplete?: string;
}) {
  const t = useTranslations('Onboarding.fields');

  return (
    <Field name={name} label={label} error={error}>
      {/* `<select>` nativo y no el de Radix a propósito: en móvil abre la rueda
          del sistema, que se maneja con una mano y no descarga nada. */}
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ''}
        autoComplete={autoComplete}
        required
        className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <option value="" disabled>
          {t('choose')}
        </option>
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

function OriginFields({
  draft,
  countries,
  err,
}: {
  draft: OnboardingDraft;
  countries: CountryOption[];
  err: (name: string) => string | undefined;
}) {
  const t = useTranslations('Onboarding.fields');

  return (
    <>
      <CountrySelect
        name="nationalityCode"
        label={t('nationality')}
        countries={countries}
        defaultValue={draft.nationalityCode}
        error={err('nationalityCode')}
        autoComplete="country"
      />

      <CountrySelect
        name="currentCountryCode"
        label={t('currentCountry')}
        countries={countries}
        defaultValue={draft.currentCountryCode}
        error={err('currentCountryCode')}
        autoComplete="country"
      />

      <Field name="currentCity" label={t('currentCity')}>
        <Input
          id="currentCity"
          name="currentCity"
          autoComplete="address-level2"
          autoCapitalize="words"
          defaultValue={draft.currentCity ?? ''}
        />
      </Field>
    </>
  );
}

// --- Paso 3 ---------------------------------------------------------------

function EnglishFields({
  draft,
  err,
}: {
  draft: OnboardingDraft;
  err: (name: string) => string | undefined;
}) {
  const t = useTranslations('Onboarding.fields');
  const tLevels = useTranslations('EnglishLevels');

  return (
    <>
      <Field
        name="englishLevel"
        label={t('englishLevel')}
        hint={t('englishLevelHint')}
        error={err('englishLevel')}
      >
        <select
          id="englishLevel"
          name="englishLevel"
          defaultValue={draft.englishLevel ?? ''}
          required
          className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <option value="" disabled>
            {t('choose')}
          </option>
          {ENGLISH_LEVELS.map((level) => (
            <option key={level} value={level}>
              {tLevels(level)}
            </option>
          ))}
        </select>
      </Field>

      <ToggleRow
        name="hasDrivingLicense"
        label={t('hasDrivingLicense')}
        defaultChecked={draft.hasDrivingLicense}
      />
      <ToggleRow
        name="workedInNlDe"
        label={t('workedInNlDe')}
        hint={t('workedInNlDeHint')}
        defaultChecked={draft.workedInNlDe}
      />
    </>
  );
}

// --- Paso 4 ---------------------------------------------------------------

function NeedsFields({ draft }: { draft: OnboardingDraft }) {
  const t = useTranslations('Onboarding.fields');

  return (
    <>
      <ToggleRow
        name="needsHousing"
        label={t('needsHousing')}
        hint={t('needsHousingHint')}
        defaultChecked={draft.needsHousing}
      />
      <ToggleRow
        name="needsTransport"
        label={t('needsTransport')}
        hint={t('needsTransportHint')}
        defaultChecked={draft.needsTransport}
      />
    </>
  );
}

export function ToggleRow({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-3">
        <Checkbox
          id={name}
          name={name}
          defaultChecked={defaultChecked}
          className="mt-0.5 size-5 shrink-0"
        />
        <label htmlFor={name} className="text-sm leading-snug">
          {label}
        </label>
      </div>
      {hint ? (
        <p className="pl-8 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

// --- Paso 5: resumen ------------------------------------------------------

function ReviewStep({
  draft,
  countries,
}: {
  draft: OnboardingDraft;
  countries: CountryOption[];
}) {
  const t = useTranslations('Onboarding');
  const tFields = useTranslations('Onboarding.fields');
  const tLevels = useTranslations('EnglishLevels');
  const tCommon = useTranslations('Common');
  const tErrors = useTranslations('Auth.errors');
  const locale = useLocale();

  const [state, action] = useActionState<ActionResult | null, FormData>(
    finishOnboardingAction,
    null,
  );
  const failed = state && !state.ok ? state : null;

  const countryName = (code?: string) =>
    countries.find((c) => c.code === code)?.name ?? '—';

  const yesNo = (value?: boolean) => (value ? tCommon('yes') : tCommon('no'));

  const rows: Array<[string, string]> = [
    [tFields('firstName'), draft.firstName ?? '—'],
    [tFields('lastName'), draft.lastName ?? '—'],
    [tFields('dateOfBirth'), draft.dateOfBirth ?? '—'],
    [tFields('nationality'), countryName(draft.nationalityCode)],
    [tFields('currentCountry'), countryName(draft.currentCountryCode)],
    [tFields('currentCity'), draft.currentCity || '—'],
    [
      tFields('englishLevel'),
      draft.englishLevel ? tLevels(draft.englishLevel) : '—',
    ],
    [tFields('hasDrivingLicense'), yesNo(draft.hasDrivingLicense)],
    [tFields('workedInNlDe'), yesNo(draft.workedInNlDe)],
    [tFields('needsHousing'), yesNo(draft.needsHousing)],
    [tFields('needsTransport'), yesNo(draft.needsTransport)],
  ];

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />

      <h1 className="text-xl font-semibold tracking-tight">
        {t('steps.5.title')}
      </h1>
      <p className="-mt-3 text-sm text-muted-foreground">{t('steps.5.help')}</p>

      {failed ? <FormAlert>{tErrors(failed.error)}</FormAlert> : null}

      <dl className="divide-y rounded-lg border">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-4 px-4 py-2.5"
          >
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-right text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <SubmitButton label={t('finish')} pendingLabel={t('saving')} />

      <Link
        href={{ pathname: '/onboarding', query: { step: '1' } }}
        className="text-center text-sm underline underline-offset-4"
      >
        {t('editFromStart')}
      </Link>
    </form>
  );
}
