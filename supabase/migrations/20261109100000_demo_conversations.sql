-- ⚠️ DEMO (rama demo/hindi). NO va a producción ni se fusiona en main.
--
-- Versión mínima de la conversación ETT ↔ candidato (ADR-53) para la demo con
-- Hindi Personalmanagement. La versión de verdad es la fase 7 · M1…M5, con su
-- batería de seguridad. Aquí: todo por RPC SECURITY DEFINER, las tablas sin
-- lectura ni escritura directa para nadie que no sea el servicio.

-- --------------------------------------------------------------------------
-- Alemán: activo y con catálogo traducido
-- --------------------------------------------------------------------------

update public.locales set is_active = true where code = 'de';

insert into public.sector_translations (sector_id, locale, name)
select s.id, 'de', v.name
from (values
  ('logistics', 'Logistik'),
  ('warehouse', 'Lager'),
  ('production', 'Produktion'),
  ('meat-processing', 'Fleischverarbeitung'),
  ('agriculture', 'Landwirtschaft'),
  ('construction', 'Bau'),
  ('cleaning', 'Reinigung'),
  ('hospitality', 'Gastronomie & Hotellerie')
) as v(slug, name)
join public.sectors s on s.slug = v.slug
on conflict do nothing;

insert into public.country_translations (country_code, locale, name)
select v.code, 'de', v.name
from (values
  ('DE', 'Deutschland'), ('NL', 'Niederlande'), ('BE', 'Belgien'),
  ('NO', 'Norwegen'), ('AT', 'Österreich'), ('BG', 'Bulgarien'),
  ('CY', 'Zypern'), ('CZ', 'Tschechien'), ('DK', 'Dänemark'),
  ('EE', 'Estland'), ('ES', 'Spanien'), ('FI', 'Finnland'),
  ('FR', 'Frankreich'), ('GR', 'Griechenland'), ('HR', 'Kroatien'),
  ('HU', 'Ungarn'), ('IE', 'Irland'), ('IT', 'Italien'),
  ('LT', 'Litauen'), ('LU', 'Luxemburg'), ('LV', 'Lettland'),
  ('MT', 'Malta'), ('PL', 'Polen'), ('PT', 'Portugal'),
  ('RO', 'Rumänien'), ('SE', 'Schweden'), ('SI', 'Slowenien'),
  ('SK', 'Slowakei')
) as v(code, name)
join public.countries c on c.code = v.code
on conflict do nothing;

-- --------------------------------------------------------------------------
-- Tablas
-- --------------------------------------------------------------------------

create table public.demo_conversations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  candidate_id uuid not null
    references public.candidates (profile_id) on delete cascade,
  job_id uuid references public.jobs (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'open', 'declined', 'hired')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agency_id, candidate_id)
);

create table public.demo_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.demo_conversations (id) on delete cascade,
  sender text not null check (sender in ('agency', 'candidate')),
  sender_id uuid references public.profiles (id) on delete set null,
  body text not null check (length(btrim(body)) > 0),
  body_masked text not null,
  created_at timestamptz not null default now()
);

create index demo_messages_conversation_idx
  on public.demo_messages (conversation_id, created_at);

alter table public.demo_conversations enable row level security;
alter table public.demo_messages enable row level security;
revoke all on public.demo_conversations, public.demo_messages
  from anon, authenticated;

-- --------------------------------------------------------------------------
-- Ocultación de contactos
-- --------------------------------------------------------------------------

create or replace function app.demo_mask_contacts(input text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    regexp_replace(
      regexp_replace(
        input,
        '(https?://|www\.|wa\.me/|t\.me/)\S+', '[•••]', 'gi'),
      '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[•••]', 'g'),
    '\+?\d[\d\s().-]{6,}\d', '[•••]', 'g');
$$;

-- --------------------------------------------------------------------------
-- RPC
-- --------------------------------------------------------------------------

-- La ETT abre la conversación con su primer mensaje y, opcional, una oferta.
create or replace function public.demo_start_conversation(
  p_candidate_id uuid,
  p_body text,
  p_job_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_agency uuid := app.current_agency_id();
  v_id uuid;
begin
  if v_agency is null then
    raise exception 'not an agency member';
  end if;
  if p_job_id is not null and not exists (
    select 1 from jobs j
    where j.id = p_job_id and j.agency_id = v_agency and j.status = 'published'
  ) then
    raise exception 'invalid job';
  end if;

  insert into demo_conversations (agency_id, candidate_id, job_id, created_by)
  values (v_agency, p_candidate_id, p_job_id, auth.uid())
  on conflict (agency_id, candidate_id) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from demo_conversations
    where agency_id = v_agency and candidate_id = p_candidate_id;
    return v_id;
  end if;

  insert into demo_messages (conversation_id, sender, sender_id, body, body_masked)
  values (v_id, 'agency', auth.uid(), btrim(p_body), app.demo_mask_contacts(btrim(p_body)));

  return v_id;
end;
$$;

-- Quién es el que llama respecto de una conversación: 'agency', 'candidate',
-- 'admin' o null.
create or replace function app.demo_side(p_conversation_id uuid)
returns text
language sql
stable
security definer
set search_path = public, app
as $$
  select case
    when c.agency_id = app.current_agency_id() then 'agency'
    when c.candidate_id = auth.uid() then 'candidate'
    when app.is_admin() then 'admin'
  end
  from demo_conversations c where c.id = p_conversation_id;
$$;

create or replace function public.demo_send_message(
  p_conversation_id uuid,
  p_body text
) returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_side text := app.demo_side(p_conversation_id);
  v_status text;
begin
  if v_side not in ('agency', 'candidate') then
    raise exception 'forbidden';
  end if;
  select status into v_status from demo_conversations where id = p_conversation_id;
  if v_status not in ('open', 'hired') then
    raise exception 'conversation not open';
  end if;

  insert into demo_messages (conversation_id, sender, sender_id, body, body_masked)
  values (p_conversation_id, v_side, auth.uid(), btrim(p_body), app.demo_mask_contacts(btrim(p_body)));

  update demo_conversations set updated_at = now() where id = p_conversation_id;
end;
$$;

create or replace function public.demo_respond(
  p_conversation_id uuid,
  p_accept boolean
) returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if app.demo_side(p_conversation_id) is distinct from 'candidate' then
    raise exception 'forbidden';
  end if;
  update demo_conversations
  set status = case when p_accept then 'open' else 'declined' end,
      updated_at = now()
  where id = p_conversation_id and status = 'pending';
end;
$$;

create or replace function public.demo_hire(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if app.demo_side(p_conversation_id) is distinct from 'agency' then
    raise exception 'forbidden';
  end if;
  update demo_conversations
  set status = 'hired', updated_at = now()
  where id = p_conversation_id and status = 'open';
end;
$$;

-- Lista de conversaciones del que llama (ETT o candidato).
create or replace function public.demo_list_conversations(p_locale text)
returns table (
  id uuid,
  status text,
  candidate_id uuid,
  candidate_name text,
  agency_name text,
  job_title text,
  last_body text,
  last_sender text,
  last_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, app
as $$
  select
    c.id,
    c.status,
    c.candidate_id,
    case when c.status = 'hired' or c.candidate_id = auth.uid()
      then ca.first_name || ' ' || ca.last_name
      else ca.first_name || ' ' || left(ca.last_name, 1) || '.' end,
    a.name,
    coalesce(
      (select jt.title from job_translations jt where jt.job_id = c.job_id and jt.locale = p_locale),
      (select jt.title from job_translations jt where jt.job_id = c.job_id and jt.locale = 'en')),
    case when c.status = 'hired' or m.sender_id = auth.uid() then m.body else m.body_masked end,
    m.sender,
    m.created_at,
    c.updated_at
  from demo_conversations c
  join candidates ca on ca.profile_id = c.candidate_id
  join agencies a on a.id = c.agency_id
  left join lateral (
    select * from demo_messages dm
    where dm.conversation_id = c.id
    order by dm.created_at desc limit 1
  ) m on true
  where c.agency_id = app.current_agency_id()
     or c.candidate_id = auth.uid()
     or app.is_admin()
  order by coalesce(m.created_at, c.updated_at) desc;
$$;

-- Una conversación con sus mensajes. Los contactos se ven solo tras «hired»,
-- salvo los propios.
create or replace function public.demo_get_conversation(
  p_conversation_id uuid,
  p_locale text
) returns jsonb
language plpgsql
stable
security definer
set search_path = public, app
as $$
declare
  v_side text := app.demo_side(p_conversation_id);
  v jsonb;
begin
  if v_side is null then
    return null;
  end if;

  select jsonb_build_object(
    'id', c.id,
    'side', v_side,
    'status', c.status,
    'candidate_id', c.candidate_id,
    'candidate_name', case when c.status = 'hired' or v_side <> 'agency'
      then ca.first_name || ' ' || ca.last_name
      else ca.first_name || ' ' || left(ca.last_name, 1) || '.' end,
    'agency_name', a.name,
    'job', case when j.id is null then null else jsonb_build_object(
      'id', j.id,
      'slug', j.slug,
      'city', j.city,
      'salary_min', j.salary_min,
      'salary_max', j.salary_max,
      'salary_period', j.salary_period,
      'shifts', j.shifts,
      'weekly_hours', j.weekly_hours,
      'housing_provided', j.housing_provided,
      'transport_provided', j.transport_provided,
      'start_date', j.start_date,
      'title', coalesce(
        (select jt.title from job_translations jt where jt.job_id = j.id and jt.locale = p_locale),
        (select jt.title from job_translations jt where jt.job_id = j.id and jt.locale = 'en')),
      'description', coalesce(
        (select jt.description from job_translations jt where jt.job_id = j.id and jt.locale = p_locale),
        (select jt.description from job_translations jt where jt.job_id = j.id and jt.locale = 'en'))
    ) end,
    'contact', case when c.status = 'hired' and v_side in ('agency', 'admin')
      then jsonb_build_object(
        'email', p.email,
        'phone', cp.phone
      ) end,
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'sender', m.sender,
        'mine', m.sender_id = auth.uid(),
        'body', case when c.status = 'hired' or v_side = 'admin' or m.sender_id = auth.uid()
          then m.body else m.body_masked end,
        'masked', not (c.status = 'hired' or v_side = 'admin' or m.sender_id = auth.uid())
          and m.body <> m.body_masked,
        'created_at', m.created_at
      ) order by m.created_at)
      from demo_messages m where m.conversation_id = c.id
    ), '[]'::jsonb)
  ) into v
  from demo_conversations c
  join candidates ca on ca.profile_id = c.candidate_id
  join agencies a on a.id = c.agency_id
  join profiles p on p.id = c.candidate_id
  left join candidate_private cp on cp.candidate_id = c.candidate_id
  left join jobs j on j.id = c.job_id
  where c.id = p_conversation_id;

  return v;
end;
$$;

-- La conversación que esta ETT tiene con un candidato, si existe.
create or replace function public.demo_conversation_for(p_candidate_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, app
as $$
  select id from demo_conversations
  where agency_id = app.current_agency_id() and candidate_id = p_candidate_id;
$$;

-- Las ofertas publicadas de la agencia del que llama, para adjuntarlas.
create or replace function public.demo_agency_jobs(p_locale text)
returns table (id uuid, title text, city text)
language sql
stable
security definer
set search_path = public, app
as $$
  select j.id,
    coalesce(
      (select jt.title from job_translations jt where jt.job_id = j.id and jt.locale = p_locale),
      (select jt.title from job_translations jt where jt.job_id = j.id and jt.locale = 'en')),
    j.city
  from jobs j
  where j.agency_id = app.current_agency_id() and j.status = 'published'
  order by j.created_at;
$$;

revoke all on function
  public.demo_start_conversation(uuid, text, uuid),
  public.demo_send_message(uuid, text),
  public.demo_respond(uuid, boolean),
  public.demo_hire(uuid),
  public.demo_list_conversations(text),
  public.demo_get_conversation(uuid, text),
  public.demo_conversation_for(uuid),
  public.demo_agency_jobs(text)
from public, anon;

grant execute on function
  public.demo_start_conversation(uuid, text, uuid),
  public.demo_send_message(uuid, text),
  public.demo_respond(uuid, boolean),
  public.demo_hire(uuid),
  public.demo_list_conversations(text),
  public.demo_get_conversation(uuid, text),
  public.demo_conversation_for(uuid),
  public.demo_agency_jobs(text)
to authenticated;

-- Solo para la semilla: inserta un mensaje con fecha y su versión oculta.
create or replace function public.demo_seed_message(
  p_conversation_id uuid,
  p_sender text,
  p_sender_id uuid,
  p_body text,
  p_created_at timestamptz
) returns void
language sql
security definer
set search_path = public, app
as $$
  insert into demo_messages (conversation_id, sender, sender_id, body, body_masked, created_at)
  values (p_conversation_id, p_sender, p_sender_id, p_body, app.demo_mask_contacts(p_body), p_created_at);
$$;

revoke all on function public.demo_seed_message(uuid, text, uuid, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.demo_seed_message(uuid, text, uuid, text, timestamptz)
  to service_role;
