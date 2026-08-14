import type { Database } from '@/lib/supabase/database.types';

/**
 * Forma del borrador del onboarding y reparto en pasos.
 *
 * Los pasos son cortos a propósito: el candidato rellena esto desde el móvil,
 * probablemente de pie y con datos justos. Una pantalla con diez campos se
 * abandona; cuatro pantallas de dos o tres se terminan. Y como cada paso se
 * guarda al pasar al siguiente, una llamada entrante no cuesta empezar de cero.
 */

export type EnglishLevel = Database['public']['Enums']['language_level'];

export type OnboardingDraft = {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationalityCode?: string;
  currentCountryCode?: string;
  currentCity?: string;
  englishLevel?: EnglishLevel;
  hasDrivingLicense?: boolean;
  workedInNlDe?: boolean;
  needsHousing?: boolean;
  needsTransport?: boolean;
};

export const ONBOARDING_STEPS = [
  'identity',
  'origin',
  'english',
  'needs',
  'review',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const LAST_STEP = ONBOARDING_STEPS.length;

/** Normaliza el `?step=` de la URL: siempre cae dentro del rango. */
export function stepFromParam(raw: string | undefined, draft: OnboardingDraft) {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (Number.isNaN(parsed)) return 1;
  return Math.min(Math.max(parsed, 1), furthestAllowed(draft));
}

/**
 * Hasta dónde puede saltar sin haber rellenado lo anterior. Evita que un
 * `?step=5` a mano llegue al resumen con media ficha vacía.
 */
export function furthestAllowed(draft: OnboardingDraft): number {
  if (!draft.firstName || !draft.lastName || !draft.dateOfBirth) return 1;
  if (!draft.nationalityCode || !draft.currentCountryCode) return 2;
  if (!draft.englishLevel) return 3;
  return LAST_STEP;
}

export function isComplete(draft: OnboardingDraft): boolean {
  return furthestAllowed(draft) === LAST_STEP;
}
