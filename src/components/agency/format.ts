import type { AgencyTranslator } from '@/lib/agency/translations';

/**
 * Meses de experiencia como los diría una persona: «8 meses», «3 años». Por
 * debajo del año se cuentan meses; por encima, años enteros, porque «2 años»
 * se lee de un vistazo y «30 meses» obliga a dividir.
 */
export function formatExperience(t: AgencyTranslator, months: number) {
  return months < 12
    ? t('duration.months', { count: months })
    : t('duration.years', { count: Math.floor(months / 12) });
}

/** «Activo hoy» / «Activo hace 3 días», en días de calendario completos. */
export function formatActivity(t: AgencyTranslator, iso: string | null) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? t('card.activeToday') : t('card.activeDaysAgo', { days });
}
