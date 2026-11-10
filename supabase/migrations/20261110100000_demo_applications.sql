-- ⚠️ DEMO (rama demo/hindi). NO va a producción.
--
-- El candidato también puede empezar: se postula a una oferta y eso abre la
-- conversación con la ETT que la publica. Una conversación por oferta, no por
-- pareja ETT–candidato, para que la misma persona pueda postularse a una y
-- recibir un mensaje por otra.

alter table public.demo_conversations
  add column origin text not null default 'outreach'
    check (origin in ('outreach', 'application'));

alter table public.demo_conversations
  drop constraint demo_conversations_agency_id_candidate_id_key;
alter table public.demo_conversations
  add constraint demo_conversations_one_per_job
    unique nulls not distinct (agency_id, candidate_id, job_id);

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
  on conflict on constraint demo_conversations_one_per_job do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from demo_conversations
    where agency_id = v_agency and candidate_id = p_candidate_id
      and job_id is not distinct from p_job_id;
    return v_id;
  end if;

  insert into demo_messages (conversation_id, sender, sender_id, body, body_masked)
  values (v_id, 'agency', auth.uid(), btrim(p_body), app.demo_mask_contacts(btrim(p_body)));

  return v_id;
end;
$$;

-- El candidato se postula: la conversación nace abierta (ha sido él quien ha
-- escrito), con sus contactos tapados hasta que lo contraten.
create or replace function public.demo_apply(p_job_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_agency uuid;
  v_id uuid;
begin
  if not exists (select 1 from candidates where profile_id = auth.uid()) then
    raise exception 'not a candidate';
  end if;
  select agency_id into v_agency from jobs
  where id = p_job_id and status = 'published';
  if v_agency is null then
    raise exception 'invalid job';
  end if;
  if length(btrim(coalesce(p_body, ''))) = 0 then
    raise exception 'empty message';
  end if;

  insert into demo_conversations
    (agency_id, candidate_id, job_id, status, origin, created_by)
  values (v_agency, auth.uid(), p_job_id, 'open', 'application', auth.uid())
  on conflict on constraint demo_conversations_one_per_job do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from demo_conversations
    where agency_id = v_agency and candidate_id = auth.uid() and job_id = p_job_id;
    return v_id;
  end if;

  insert into demo_messages (conversation_id, sender, sender_id, body, body_masked)
  values (v_id, 'candidate', auth.uid(), btrim(p_body), app.demo_mask_contacts(btrim(p_body)));

  return v_id;
end;
$$;

-- La conversación que el candidato que llama tiene por una oferta, si existe.
create or replace function public.demo_my_application(p_job_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, app
as $$
  select id from demo_conversations
  where candidate_id = auth.uid() and job_id = p_job_id;
$$;

-- Con varias conversaciones por candidato, la ETT va a la más reciente.
create or replace function public.demo_conversation_for(p_candidate_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, app
as $$
  select id from demo_conversations
  where agency_id = app.current_agency_id() and candidate_id = p_candidate_id
  order by updated_at desc
  limit 1;
$$;

drop function public.demo_list_conversations(text);
create or replace function public.demo_list_conversations(p_locale text)
returns table (
  id uuid,
  status text,
  origin text,
  job_id uuid,
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
    c.origin,
    c.job_id,
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
    'origin', c.origin,
    'job_id', c.job_id,
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
        'phone', cp.phone,
        'documents', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', d.id,
            'slug', dt.slug,
            'name', coalesce(
              (select tr.name from document_type_translations tr
                where tr.document_type_id = dt.id and tr.locale = p_locale),
              (select tr.name from document_type_translations tr
                where tr.document_type_id = dt.id and tr.locale = 'en')),
            'mime', d.mime_type
          ) order by dt.sort_order)
          from candidate_documents d
          join document_types dt on dt.id = d.document_type_id
          where d.candidate_id = c.candidate_id and d.status <> 'rejected'
        ), '[]'::jsonb)
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

revoke all on function
  public.demo_apply(uuid, text),
  public.demo_my_application(uuid),
  public.demo_list_conversations(text)
from public, anon;
grant execute on function
  public.demo_apply(uuid, text),
  public.demo_my_application(uuid),
  public.demo_list_conversations(text)
to authenticated;
