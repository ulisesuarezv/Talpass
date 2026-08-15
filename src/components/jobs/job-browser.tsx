'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';

import { JobCard } from '@/components/jobs/job-card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { CatalogOption } from '@/lib/catalogs';
import type { JobSummary } from '@/lib/jobs';

/**
 * Listado con filtros, **en cliente a propósito** (ADR-11).
 *
 * Filtrar en servidor obligaría a leer `searchParams`, y eso convierte
 * `/es/ofertas` en una ruta dinámica: fuera del CDN, TTFB arriba en 4G y sin
 * ISR. Así la página se prerenderiza con todas las vacantes dentro del HTML
 * —que es lo que ve el crawler y lo que ve el candidato sin esperar a ningún
 * JavaScript— y el filtro solo esconde tarjetas.
 *
 * Las superficies filtradas que sí queremos indexadas no son estas
 * combinaciones: son las landings, que son rutas estáticas de verdad (ADR-23).
 *
 * La URL se sincroniza con `history.replaceState` en vez de con el router: un
 * filtro no es una navegación, y no hace falta volver a pedir nada al servidor.
 */

export const SHIFTS = ['morning', 'afternoon', 'night', 'rotating'] as const;

type Filters = {
  country: string;
  sector: string;
  language: string;
  shift: string;
  housing: boolean;
  transport: boolean;
  drivingLicense: boolean;
};

function fromSearchParams(params: URLSearchParams): Filters {
  return {
    country: params.get('country') ?? '',
    sector: params.get('sector') ?? '',
    language: params.get('language') ?? '',
    shift: params.get('shift') ?? '',
    housing: params.get('housing') === '1',
    transport: params.get('transport') === '1',
    drivingLicense: params.get('license') === '1',
  };
}

function toSearchParams(filters: Filters): string {
  const params = new URLSearchParams();

  if (filters.country) params.set('country', filters.country);
  if (filters.sector) params.set('sector', filters.sector);
  if (filters.language) params.set('language', filters.language);
  if (filters.shift) params.set('shift', filters.shift);
  if (filters.housing) params.set('housing', '1');
  if (filters.transport) params.set('transport', '1');
  if (filters.drivingLicense) params.set('license', '1');

  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * La query de la URL es el ÚNICO estado del filtro, leída como lo que es: un
 * sistema externo a React.
 *
 * Se hace así y no con `useSearchParams` porque ese hook obliga a un
 * `Suspense`, y en una página prerenderizada Next deja ese subárbol para el
 * cliente: el HTML estático saldría **sin una sola vacante dentro**. Justo lo
 * contrario de lo que busca esta fase, tanto para el rastreador como para el
 * móvil con 4G que todavía no ha ejecutado el JavaScript.
 *
 * El `snapshot` de servidor es la cadena vacía, así que el servidor pinta la
 * lista entera y la hidratación no discute. `replaceState` no dispara ningún
 * evento por su cuenta, de ahí el evento propio.
 */
const SEARCH_CHANGED = 'talpass:search';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  window.addEventListener(SEARCH_CHANGED, onChange);

  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(SEARCH_CHANGED, onChange);
  };
}

const clientSearch = () => window.location.search;
const serverSearch = () => '';

function write(url: string) {
  window.history.replaceState(null, '', url);
  window.dispatchEvent(new Event(SEARCH_CHANGED));
}

function matches(job: JobSummary, filters: Filters): boolean {
  if (filters.country && job.countryCode !== filters.country) return false;
  if (filters.sector && job.sectorId !== filters.sector) return false;
  if (filters.language && job.requiredLanguageCode !== filters.language) {
    return false;
  }
  if (filters.shift && !job.shifts.includes(filters.shift as never)) {
    return false;
  }
  if (filters.housing && !job.housingProvided) return false;
  if (filters.transport && !job.transportProvided) return false;
  if (filters.drivingLicense && !job.requiresDrivingLicense) return false;

  return true;
}

export function JobBrowser({
  jobs,
  countries,
  sectors,
  languages,
}: {
  jobs: JobSummary[];
  countries: CatalogOption[];
  sectors: CatalogOption[];
  languages: CatalogOption[];
}) {
  const t = useTranslations('Jobs');

  const search = useSyncExternalStore(subscribe, clientSearch, serverSearch);
  const filters = useMemo(
    () => fromSearchParams(new URLSearchParams(search)),
    [search],
  );

  function update(patch: Partial<Filters>) {
    write(
      `${window.location.pathname}${toSearchParams({ ...filters, ...patch })}`,
    );
  }

  const visible = useMemo(
    () => jobs.filter((job) => matches(job, filters)),
    [jobs, filters],
  );

  const active =
    filters.country !== '' ||
    filters.sector !== '' ||
    filters.language !== '' ||
    filters.shift !== '' ||
    filters.housing ||
    filters.transport ||
    filters.drivingLicense;

  return (
    <div className="flex flex-col gap-6">
      <form
        className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"
        // El filtro no envía nada: todo ocurre en el cliente sobre datos que ya
        // están en la página.
        onSubmit={(event) => event.preventDefault()}
      >
        <Select
          id="filter-country"
          label={t('filters.country')}
          value={filters.country}
          placeholder={t('filters.any')}
          options={countries.map((c) => ({ value: c.id, label: c.name }))}
          onChange={(country) => update({ country })}
        />
        <Select
          id="filter-sector"
          label={t('filters.sector')}
          value={filters.sector}
          placeholder={t('filters.any')}
          options={sectors.map((s) => ({ value: s.id, label: s.name }))}
          onChange={(sector) => update({ sector })}
        />
        <Select
          id="filter-language"
          label={t('filters.language')}
          value={filters.language}
          placeholder={t('filters.any')}
          options={languages.map((l) => ({ value: l.id, label: l.name }))}
          onChange={(language) => update({ language })}
        />
        <Select
          id="filter-shift"
          label={t('filters.shift')}
          value={filters.shift}
          placeholder={t('filters.any')}
          options={SHIFTS.map((shift) => ({
            value: shift,
            label: t(`shifts.${shift}`),
          }))}
          onChange={(shift) => update({ shift })}
        />

        <fieldset className="flex flex-col gap-3 sm:col-span-2">
          <legend className="mb-2 text-sm font-medium">
            {t('filters.perks')}
          </legend>

          <Toggle
            id="filter-housing"
            label={t('filters.housing')}
            checked={filters.housing}
            onChange={(housing) => update({ housing })}
          />
          <Toggle
            id="filter-transport"
            label={t('filters.transport')}
            checked={filters.transport}
            onChange={(transport) => update({ transport })}
          />
          <Toggle
            id="filter-license"
            label={t('filters.drivingLicense')}
            checked={filters.drivingLicense}
            onChange={(drivingLicense) => update({ drivingLicense })}
          />
        </fieldset>

        {active ? (
          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => write(window.location.pathname)}
            >
              {t('filters.clear')}
            </Button>
          </div>
        ) : null}
      </form>

      <p aria-live="polite" className="text-sm text-muted-foreground">
        {t('results', { count: visible.length })}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <div className="grid gap-3">
          {visible.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * `<select>` nativo en vez del de shadcn: en móvil abre la rueda del sistema,
 * que es más rápida de usar con una mano y no arrastra JavaScript extra a una
 * página cuyo argumento entero es cargar rápido con 4G (ADR-10).
 */
function Select({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(state) => onChange(state === true)}
      />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  );
}
