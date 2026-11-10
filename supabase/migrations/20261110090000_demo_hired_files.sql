-- ⚠️ DEMO (rama demo/hindi). NO va a producción.
--
-- Al contratar, la ETT ve también los papeles del candidato: DNI, CV, carné y
-- la grabación en inglés. La puerta es la misma que la de los contactos: la
-- conversación en estado «hired» con esa ETT.

-- Nombres de los tipos de documento en alemán.
insert into public.document_type_translations (document_type_id, locale, name)
select dt.id, 'de', v.name
from (values
  ('id_front', 'Ausweis oder Reisepass (Vorderseite)'),
  ('id_back', 'Ausweis oder Reisepass (Rückseite)'),
  ('cv', 'Lebenslauf'),
  ('audio_en', 'Audioaufnahme auf Englisch'),
  ('driving_license', 'Führerschein'),
  ('tax_doc', 'Steuerunterlagen')
) as v(slug, name)
join public.document_types dt on dt.slug = v.slug
on conflict (document_type_id, locale) do update set name = excluded.name;

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

-- El archivo de un documento, solo si la ETT que llama ha contratado a su
-- dueño en la demo. Lo firma el servidor después de esta comprobación.
create or replace function public.demo_hired_document(p_document_id uuid)
returns table (bucket text, path text, mime text, candidate_id uuid)
language sql
stable
security definer
set search_path = public, app
as $$
  select d.storage_bucket, d.storage_path, d.mime_type, d.candidate_id
  from candidate_documents d
  where d.id = p_document_id
    and d.status <> 'rejected'
    and exists (
      select 1 from demo_conversations c
      where c.candidate_id = d.candidate_id
        and c.agency_id = app.current_agency_id()
        and c.status = 'hired'
    );
$$;

revoke all on function public.demo_hired_document(uuid) from public, anon;
grant execute on function public.demo_hired_document(uuid) to authenticated;
