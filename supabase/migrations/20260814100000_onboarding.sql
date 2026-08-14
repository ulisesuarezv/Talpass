-- Fase 2 · Lo que el registro y el onboarding del candidato necesitan del
-- schema. Nada más: los documentos son de la fase 4 y las candidaturas de la 5.

-- --------------------------------------------------------------------------
-- Consentimiento propio para el audio (ADR-18)
-- --------------------------------------------------------------------------
--
-- Que una agencia pueda escuchar la voz del candidato no se puede colar dentro
-- de "acepto los términos": es un tratamiento distinto, con una finalidad
-- distinta, y el candidato tiene que poder retirarlo sin darse de baja. Por eso
-- es un tipo propio y no una casilla más del texto legal.
--
-- El valor se añade aquí y no se usa hasta la aplicación: Postgres no deja
-- utilizar un valor de enum en la misma transacción en la que se añade.
alter type public.consent_type add value if not exists 'audio_sharing';

-- --------------------------------------------------------------------------
-- Borrador del onboarding
-- --------------------------------------------------------------------------
--
-- `candidates` exige nombre, apellidos, fecha de nacimiento y dos países, y
-- hace bien: una ficha a medias no es un candidato y no debe poder existir.
-- Pero el onboarding se rellena desde un móvil, de pie, con datos justos y con
-- interrupciones, así que el progreso tiene que sobrevivir a un cierre de
-- pestaña.
--
-- Se resuelve con una tabla aparte y no relajando aquellos `not null`: mientras
-- el formulario está a medias, lo que existe es un borrador. Al terminarlo se
-- crea la fila de `candidates` y el borrador se borra. Que el borrador viva en
-- el servidor y no en el navegador es deliberado: el candidato puede empezar en
-- el móvil y acabar en otro sitio, y un `localStorage` perdido es un candidato
-- perdido.
--
-- El contenido es `jsonb` a propósito: son datos aún sin validar, de un
-- formulario que cambiará. Validarlos es trabajo de la aplicación en el paso
-- final, contra el schema de verdad.
create table public.candidate_onboarding_drafts (
  profile_id uuid primary key
    references public.profiles (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  step smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidate_onboarding_drafts_step_range
    check (step between 1 and 20),
  constraint candidate_onboarding_drafts_data_is_object
    check (jsonb_typeof(data) = 'object')
);

comment on table public.candidate_onboarding_drafts is
  'Progreso a medias del formulario de alta. Datos personales sin validar: '
  'nadie salvo su dueño tiene una política aquí, ni siquiera el admin.';

create trigger candidate_onboarding_drafts_set_updated_at
  before update on public.candidate_onboarding_drafts
  for each row execute function app.set_updated_at();

alter table public.candidate_onboarding_drafts enable row level security;

-- Una sola política, y solo para el dueño. El admin no la tiene: un borrador
-- sin terminar no es material de backoffice, y la fase 4 revisa documentos
-- entregados, no formularios a medio escribir.
create policy candidate_onboarding_drafts_owner_all
  on public.candidate_onboarding_drafts
  for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

revoke all on public.candidate_onboarding_drafts from anon;

-- --------------------------------------------------------------------------
-- El candidato mantiene su `last_activity_at` al día
-- --------------------------------------------------------------------------
--
-- Lo consume el ciclo de inactividad de la fase 8 (regla de negocio 5). Se
-- pone aquí porque desde esta fase ya hay sesiones reales que lo alimentan.
create or replace function public.touch_last_activity()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.candidates
  set last_activity_at = now()
  where profile_id = (select auth.uid());
$$;

comment on function public.touch_last_activity() is
  'Marca actividad del candidato autenticado. Sin parámetros a propósito: la '
  'identidad sale de auth.uid(), nunca de quien llama.';

revoke all on function public.touch_last_activity() from public, anon;
grant execute on function public.touch_last_activity()
  to authenticated, service_role;
