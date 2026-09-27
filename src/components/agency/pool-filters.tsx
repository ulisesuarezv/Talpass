import { Button, buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ENGLISH_LEVELS, type PoolFilters } from '@/lib/agency/pool';
import type { AgencyTranslator } from '@/lib/agency/translations';
import type { SectorOption } from '@/lib/catalogs';

/**
 * Filtros de la bolsa como un formulario GET normal: **cero JavaScript**, la
 * URL guarda el filtro (se puede compartir con un compañero de la agencia) y
 * el botón atrás funciona. La página es dinámica de todas formas —es privada—,
 * así que filtrar en servidor no cuesta caché.
 *
 * Los controles son nativos (`select`, `checkbox`) y no los de shadcn, que son
 * de cliente: aquí no aportan nada que justifique mandar su JavaScript.
 */
export function PoolFiltersForm({
  filters,
  sectors,
  countryName,
  idPrefix,
  t,
}: {
  /** El formulario sale dos veces (móvil plegado y escritorio): ids únicos. */
  idPrefix: string;
  filters: PoolFilters;
  sectors: SectorOption[];
  countryName: string;
  t: AgencyTranslator;
}) {
  const selectClass =
    'h-11 w-full rounded-md border border-input bg-background px-3 type-meta shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:h-9';

  const checkboxes = [
    {
      name: 'license',
      value: '1',
      on: filters.license,
      label: t('pool.filters.license'),
    },
    {
      name: 'audio',
      value: '1',
      on: filters.audio,
      label: t('pool.filters.audio'),
    },
    {
      name: 'here',
      value: '1',
      on: filters.livesIn != null,
      label: t('pool.filters.here', { country: countryName }),
    },
    {
      name: 'housing',
      value: 'no',
      on: filters.noHousing,
      label: t('pool.filters.noHousing'),
    },
  ];

  return (
    <form method="get" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-sector`} className="type-meta font-medium">
          {t('pool.filters.sector')}
        </label>
        <select
          id={`${idPrefix}-sector`}
          name="sector"
          defaultValue={filters.sector ?? ''}
          className={selectClass}
        >
          <option value="">{t('pool.filters.anySector')}</option>
          {sectors.map((sector) => (
            <option key={sector.slug} value={sector.slug}>
              {sector.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-english`}
          className="type-meta font-medium"
        >
          {t('pool.filters.english')}
        </label>
        <select
          id={`${idPrefix}-english`}
          name="english"
          defaultValue={filters.english ?? ''}
          className={selectClass}
        >
          <option value="">{t('pool.filters.anyEnglish')}</option>
          {ENGLISH_LEVELS.filter((level) => level !== 'native').map((level) => (
            <option key={level} value={level}>
              {t('pool.filters.englishAtLeast', {
                level: t(`levels.${level}`),
              })}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col">
        {checkboxes.map((box) => (
          <label
            key={box.name}
            className="flex min-h-11 cursor-pointer items-center gap-2.5 type-meta sm:min-h-9"
          >
            <input
              type="checkbox"
              name={box.name}
              value={box.value}
              defaultChecked={box.on}
              className="size-4 accent-primary"
            />
            {box.label}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">{t('pool.filters.apply')}</Button>
        <Link href="/agency" className={buttonVariants({ variant: 'ghost' })}>
          {t('pool.filters.clear')}
        </Link>
      </div>
    </form>
  );
}
