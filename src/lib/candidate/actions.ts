'use server';

import { revalidatePath } from 'next/cache';

import { SIGNUP_CONSENT_VERSION } from '@/config/legal';
import { redirectAndStop } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/auth/actions';
import {
  checkbox,
  isEnglishLevel,
  isValidBirthDate,
  text,
  type FieldErrors,
} from '@/lib/validation';

import {
  LAST_STEP,
  isComplete,
  type EnglishLevel,
  type OnboardingDraft,
} from './onboarding';

/**
 * Server Actions del candidato: onboarding, perfil y consentimientos.
 *
 * Todo pasa por RLS con la sesión del propio candidato — no hay `service_role`
 * en ninguna de estas rutas. Si una de estas escrituras funcionara sin política
 * que la ampare, sería un fallo del schema, no de esta capa.
 */

function assertLocale(value: string): Locale {
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale;
}

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function loadDraft(userId: string): Promise<OnboardingDraft> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('candidate_onboarding_drafts')
    .select('data')
    .eq('profile_id', userId)
    .maybeSingle();

  return (data?.data ?? {}) as OnboardingDraft;
}

/** Solo lectura, para que la página pinte el formulario ya relleno. */
export async function getDraft(): Promise<OnboardingDraft> {
  const userId = await currentUserId();
  return userId ? loadDraft(userId) : {};
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

/**
 * Valida el paso que llega y lo funde con lo ya guardado.
 *
 * Se valida paso a paso y otra vez entero al final: aquí para poder señalar el
 * campo concreto, y al final porque entre un paso y el envío puede pasar
 * cualquier cosa — otra pestaña, un `?step=` a mano, una sesión recuperada.
 */
function applyStep(
  step: number,
  form: FormData,
  countryCodes: string[],
): { patch: OnboardingDraft; fieldErrors: FieldErrors } {
  const fieldErrors: FieldErrors = {};
  const patch: OnboardingDraft = {};

  if (step === 1) {
    patch.firstName = text(form, 'firstName');
    patch.lastName = text(form, 'lastName');
    patch.dateOfBirth = text(form, 'dateOfBirth');

    if (!patch.firstName) fieldErrors.firstName = 'required';
    if (!patch.lastName) fieldErrors.lastName = 'required';
    if (!isValidBirthDate(patch.dateOfBirth)) {
      fieldErrors.dateOfBirth = patch.dateOfBirth ? 'birthDate' : 'required';
    }
  }

  if (step === 2) {
    patch.nationalityCode = text(form, 'nationalityCode');
    patch.currentCountryCode = text(form, 'currentCountryCode');
    patch.currentCity = text(form, 'currentCity') || undefined;

    if (!countryCodes.includes(patch.nationalityCode)) {
      fieldErrors.nationalityCode = 'required';
    }
    if (!countryCodes.includes(patch.currentCountryCode)) {
      fieldErrors.currentCountryCode = 'required';
    }
  }

  if (step === 3) {
    const level = text(form, 'englishLevel');
    patch.hasDrivingLicense = checkbox(form, 'hasDrivingLicense');
    patch.workedInNlDe = checkbox(form, 'workedInNlDe');

    if (!isEnglishLevel(level)) {
      fieldErrors.englishLevel = 'required';
    } else {
      patch.englishLevel = level as EnglishLevel;
    }
  }

  if (step === 4) {
    patch.needsHousing = checkbox(form, 'needsHousing');
    patch.needsTransport = checkbox(form, 'needsTransport');
  }

  return { patch, fieldErrors };
}

export async function saveOnboardingStepAction(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const locale = assertLocale(text(form, 'locale'));
  const step = Number.parseInt(text(form, 'step'), 10);

  const userId = await currentUserId();
  if (!userId) return { ok: false, error: 'sessionExpired' };

  const supabase = await createClient();

  const { data: countries } = await supabase.from('countries').select('code');
  const countryCodes = (countries ?? []).map((c) => c.code);

  const { patch, fieldErrors } = applyStep(step, form, countryCodes);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: 'checkTheForm', fieldErrors };
  }

  const merged = { ...(await loadDraft(userId)), ...patch };

  const { error } = await supabase
    .from('candidate_onboarding_drafts')
    .upsert(
      { profile_id: userId, data: merged, step: Math.min(step + 1, LAST_STEP) },
      { onConflict: 'profile_id' },
    );

  if (error) return { ok: false, error: 'unexpected' };

  redirectAndStop({
    href: { pathname: '/onboarding', query: { step: String(step + 1) } },
    locale,
  });
}

export async function finishOnboardingAction(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const locale = assertLocale(text(form, 'locale'));

  const userId = await currentUserId();
  if (!userId) return { ok: false, error: 'sessionExpired' };

  const draft = await loadDraft(userId);
  if (!isComplete(draft)) {
    return { ok: false, error: 'draftIncomplete' };
  }

  const supabase = await createClient();

  // `verification_status` no se toca: nace `unverified` y solo el admin lo
  // mueve (fase 4). Mandarlo desde aquí lo rechazaría un disparador, que es
  // como debe ser.
  const { error } = await supabase.from('candidates').insert({
    profile_id: userId,
    first_name: draft.firstName!,
    last_name: draft.lastName!,
    date_of_birth: draft.dateOfBirth!,
    nationality_code: draft.nationalityCode!,
    current_country_code: draft.currentCountryCode!,
    current_city: draft.currentCity ?? null,
    english_level: draft.englishLevel!,
    has_driving_license: draft.hasDrivingLicense ?? false,
    worked_in_nl_de: draft.workedInNlDe ?? false,
    needs_housing: draft.needsHousing ?? false,
    needs_transport: draft.needsTransport ?? false,
  });

  if (error) {
    // 23505 = ya existía la ficha. Dos envíos del mismo formulario no son un
    // error que enseñar: el resultado que el candidato pidió ya se cumplió.
    if (error.code !== '23505') return { ok: false, error: 'unexpected' };
  }

  // El borrador deja de tener sentido en cuanto existe la ficha real, y son
  // datos personales duplicados: se retira en el mismo paso.
  await supabase
    .from('candidate_onboarding_drafts')
    .delete()
    .eq('profile_id', userId);

  redirectAndStop({ href: '/account', locale });
}

// ---------------------------------------------------------------------------
// Perfil
// ---------------------------------------------------------------------------

export async function updateProfileAction(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: 'sessionExpired' };

  const supabase = await createClient();
  const { data: countries } = await supabase.from('countries').select('code');
  const countryCodes = (countries ?? []).map((c) => c.code);

  const firstName = text(form, 'firstName');
  const lastName = text(form, 'lastName');
  const dateOfBirth = text(form, 'dateOfBirth');
  const nationalityCode = text(form, 'nationalityCode');
  const currentCountryCode = text(form, 'currentCountryCode');
  const englishLevel = text(form, 'englishLevel');

  const fieldErrors: FieldErrors = {};
  if (!firstName) fieldErrors.firstName = 'required';
  if (!lastName) fieldErrors.lastName = 'required';
  if (!isValidBirthDate(dateOfBirth)) {
    fieldErrors.dateOfBirth = dateOfBirth ? 'birthDate' : 'required';
  }
  if (!countryCodes.includes(nationalityCode)) {
    fieldErrors.nationalityCode = 'required';
  }
  if (!countryCodes.includes(currentCountryCode)) {
    fieldErrors.currentCountryCode = 'required';
  }
  if (!isEnglishLevel(englishLevel)) fieldErrors.englishLevel = 'required';

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: 'checkTheForm', fieldErrors };
  }

  const { error } = await supabase
    .from('candidates')
    .update({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      nationality_code: nationalityCode,
      current_country_code: currentCountryCode,
      current_city: text(form, 'currentCity') || null,
      english_level: englishLevel as EnglishLevel,
      has_driving_license: checkbox(form, 'hasDrivingLicense'),
      worked_in_nl_de: checkbox(form, 'workedInNlDe'),
      needs_housing: checkbox(form, 'needsHousing'),
      needs_transport: checkbox(form, 'needsTransport'),
      work_experience: text(form, 'workExperience') || null,
    })
    .eq('profile_id', userId);

  if (error) return { ok: false, error: 'unexpected' };

  revalidatePath('/[locale]/(private)/account', 'page');
  return { ok: true, message: 'profileSaved' };
}

/**
 * Activo/inactivo lo decide el candidato. Un candidato `inactive` desaparece de
 * la bolsa pero conserva sus candidaturas en curso (regla de negocio 6).
 */
export async function setAvailabilityAction(form: FormData): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;

  const supabase = await createClient();
  await supabase
    .from('candidates')
    .update({ status: checkbox(form, 'active') ? 'active' : 'inactive' })
    .eq('profile_id', userId);

  revalidatePath('/[locale]/(private)/account', 'page');
}

// ---------------------------------------------------------------------------
// Consentimientos (ADR-18)
// ---------------------------------------------------------------------------

/**
 * Concede o retira el consentimiento de audio.
 *
 * Retirar es marcar `revoked_at`, nunca borrar: la fila es la prueba de que
 * hubo consentimiento durante un periodo, y esa prueba tiene que sobrevivir a
 * la retirada. Volver a concederlo escribe una fila nueva, con su versión.
 */
export async function setAudioConsentAction(form: FormData): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;

  const grant = checkbox(form, 'grant');
  const supabase = await createClient();

  if (grant) {
    await supabase.from('consents').insert({
      profile_id: userId,
      type: 'audio_sharing',
      version: SIGNUP_CONSENT_VERSION,
    });
  } else {
    await supabase
      .from('consents')
      .update({ revoked_at: new Date().toISOString() })
      .eq('profile_id', userId)
      .eq('type', 'audio_sharing')
      .is('revoked_at', null);
  }

  revalidatePath('/[locale]/(private)/account', 'page');
}
