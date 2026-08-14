'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { setAvailabilityAction } from '@/lib/candidate/actions';

/**
 * Activo / inactivo. Un candidato inactivo desaparece de la bolsa pero
 * conserva sus candidaturas en curso (regla de negocio 6), y eso se dice aquí
 * en vez de dejar que lo suponga.
 */
export function AvailabilityPanel({ active }: { active: boolean }) {
  const t = useTranslations('Account.availability');

  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="font-medium">{t('title')}</h2>

      <p className="text-sm">
        <span className="text-muted-foreground">{t('state')}: </span>
        <span className="font-medium">
          {active ? t('active') : t('inactive')}
        </span>
      </p>

      <p className="text-sm text-muted-foreground">
        {active ? t('activeHelp') : t('inactiveHelp')}
      </p>

      <form action={setAvailabilityAction}>
        <input type="hidden" name="active" value={active ? 'false' : 'true'} />
        <Button type="submit" variant="outline">
          {active ? t('pause') : t('resume')}
        </Button>
      </form>
    </section>
  );
}
