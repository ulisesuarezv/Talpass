import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';

/**
 * Llamada a crear cuenta, al pie de cada vacante, de cada landing y de
 * `/ofertas`.
 *
 * Ver es libre y sin cuenta (ADR-02, regla de negocio 1); la cuenta hace falta
 * para aplicar. La nota de que al candidato no se le cobra nunca no es adorno:
 * es la diferencia frente a lo que se encuentra el candidato en cualquier otro
 * sitio, y va donde se toma la decisión.
 *
 * La variante cambia **solo el copy**, no el patrón: donde hay vacante se
 * aplica, y donde solo hay perfiles de mercado no hay a dónde aplicar todavía
 * (ADR-30), así que prometer lo mismo en las dos sería mentir en una de ellas.
 * Desde ADR-49 la que elige es `/ofertas`, según tenga vacantes o no: las dos
 * situaciones ocurren ya en la misma URL.
 */
export function SignupCta({
  variant = 'jobs',
}: {
  variant?: 'jobs' | 'opportunities';
}) {
  const t = useTranslations(
    variant === 'jobs' ? 'Jobs.cta' : 'Opportunities.cta',
  );

  return (
    <aside className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-6">
      <h2 className="type-h2">{t('title')}</h2>
      <p className="type-body text-muted-foreground">
        {t('body', { brand: siteConfig.name })}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/signup">{t('signup')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">{t('login')}</Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{t('free')}</p>
    </aside>
  );
}
