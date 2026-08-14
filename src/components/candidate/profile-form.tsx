'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';

import { ToggleRow } from '@/components/candidate/onboarding-wizard';
import { Field, FormAlert, SubmitButton } from '@/components/forms/form-parts';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/lib/auth/actions';
import { updateProfileAction } from '@/lib/candidate/actions';
import type { CountryOption } from '@/lib/catalogs';
import type { Database } from '@/lib/supabase/database.types';
import { ENGLISH_LEVELS } from '@/lib/validation';

type Candidate = Database['public']['Tables']['candidates']['Row'];

const selectClass =
  'h-11 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none';

export function ProfileForm({
  candidate,
  countries,
}: {
  candidate: Candidate;
  countries: CountryOption[];
}) {
  const t = useTranslations('Onboarding.fields');
  const tAccount = useTranslations('Account');
  const tErrors = useTranslations('Auth.errors');
  const tLevels = useTranslations('EnglishLevels');

  const [state, action] = useActionState<ActionResult | null, FormData>(
    updateProfileAction,
    null,
  );

  const failed = state && !state.ok ? state : null;
  const err = (name: string) =>
    failed?.fieldErrors?.[name] ? tErrors(failed.fieldErrors[name]) : undefined;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state?.ok ? (
        <FormAlert tone="success">
          {tAccount(`messages.${state.message}`)}
        </FormAlert>
      ) : null}
      {failed ? <FormAlert>{tErrors(failed.error)}</FormAlert> : null}

      <Field name="firstName" label={t('firstName')} error={err('firstName')}>
        <Input
          id="firstName"
          name="firstName"
          autoComplete="given-name"
          defaultValue={candidate.first_name}
          required
        />
      </Field>

      <Field name="lastName" label={t('lastName')} error={err('lastName')}>
        <Input
          id="lastName"
          name="lastName"
          autoComplete="family-name"
          defaultValue={candidate.last_name}
          required
        />
      </Field>

      <Field
        name="dateOfBirth"
        label={t('dateOfBirth')}
        error={err('dateOfBirth')}
      >
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          defaultValue={candidate.date_of_birth}
          required
        />
      </Field>

      <Field
        name="nationalityCode"
        label={t('nationality')}
        error={err('nationalityCode')}
      >
        <select
          id="nationalityCode"
          name="nationalityCode"
          defaultValue={candidate.nationality_code}
          className={selectClass}
          required
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        name="currentCountryCode"
        label={t('currentCountry')}
        error={err('currentCountryCode')}
      >
        <select
          id="currentCountryCode"
          name="currentCountryCode"
          defaultValue={candidate.current_country_code}
          className={selectClass}
          required
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field name="currentCity" label={t('currentCity')}>
        <Input
          id="currentCity"
          name="currentCity"
          autoComplete="address-level2"
          defaultValue={candidate.current_city ?? ''}
        />
      </Field>

      <Field
        name="englishLevel"
        label={t('englishLevel')}
        error={err('englishLevel')}
      >
        <select
          id="englishLevel"
          name="englishLevel"
          defaultValue={candidate.english_level ?? ''}
          className={selectClass}
          required
        >
          {ENGLISH_LEVELS.map((level) => (
            <option key={level} value={level}>
              {tLevels(level)}
            </option>
          ))}
        </select>
      </Field>

      <Field
        name="workExperience"
        label={t('workExperience')}
        hint={t('workExperienceHint')}
      >
        <Textarea
          id="workExperience"
          name="workExperience"
          rows={5}
          defaultValue={candidate.work_experience ?? ''}
        />
      </Field>

      <div className="flex flex-col gap-4 border-t pt-5">
        <ToggleRow
          name="hasDrivingLicense"
          label={t('hasDrivingLicense')}
          defaultChecked={candidate.has_driving_license}
        />
        <ToggleRow
          name="workedInNlDe"
          label={t('workedInNlDe')}
          defaultChecked={candidate.worked_in_nl_de}
        />
        <ToggleRow
          name="needsHousing"
          label={t('needsHousing')}
          defaultChecked={candidate.needs_housing}
        />
        <ToggleRow
          name="needsTransport"
          label={t('needsTransport')}
          defaultChecked={candidate.needs_transport}
        />
      </div>

      <SubmitButton
        label={tAccount('save')}
        pendingLabel={tAccount('saving')}
      />
    </form>
  );
}
