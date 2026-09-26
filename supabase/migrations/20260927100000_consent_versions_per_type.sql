-- Cada consentimiento del alta se registra con la versión de SU texto.
--
-- Hasta hoy el disparador recibía una sola versión (`consent_version`) y la
-- escribía en las cuatro filas. Valía mientras los cuatro textos se publicaban
-- a la vez. El 2026-09-27 (ADR-51) se reescriben la política de privacidad y
-- «Cómo se comparte tu perfil» y los términos no: con una sola versión, o los
-- términos se apuntaban con una fecha que no es la de su texto, o privacidad y
-- cesión se apuntaban con la del texto viejo, que decía lo contrario. Las dos
-- cosas estropean justo lo que la fila tiene que probar.
--
-- Ahora la aplicación manda `consent_versions`, un objeto con una versión por
-- tipo, y el disparador toma la de cada fila. `consent_version` se sigue
-- aceptando como respaldo para no depender del orden exacto de despliegue, y
-- `'1'` queda como último recurso, igual que antes.
--
-- Esta migración va a producción ANTES que el código que manda
-- `consent_versions`: con el disparador viejo y el código nuevo, las filas
-- saldrían con versión `'1'`.

create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_versions jsonb := coalesce(meta -> 'consent_versions', '{}'::jsonb);
  v_fallback text := coalesce(nullif(meta ->> 'consent_version', ''), '1');
  v_ip inet := nullif(meta ->> 'consent_ip', '')::inet;
  v_ua text := nullif(meta ->> 'consent_user_agent', '');
begin
  insert into public.profiles (id, email, locale)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(new.raw_user_meta_data ->> 'locale', ''), 'es')
  )
  on conflict (id) do nothing;

  -- Obligatorios: sin ellos no hay cuenta, así que no se condicionan a nada.
  -- Términos y privacidad son dos documentos, con su propia versión cada uno,
  -- aunque el formulario los acepte en una sola casilla.
  insert into public.consents (profile_id, type, version, ip, user_agent)
  values
    (new.id, 'terms',
      coalesce(nullif(v_versions ->> 'terms', ''), v_fallback), v_ip, v_ua),
    (new.id, 'privacy',
      coalesce(nullif(v_versions ->> 'privacy', ''), v_fallback), v_ip, v_ua),
    (new.id, 'data_sharing',
      coalesce(nullif(v_versions ->> 'data_sharing', ''), v_fallback), v_ip, v_ua);

  -- Opcional y revocable por separado (ADR-18): que una agencia verificada
  -- pueda escuchar su grabación en inglés.
  if coalesce((meta ->> 'consent_audio')::boolean, false) then
    insert into public.consents (profile_id, type, version, ip, user_agent)
    values (new.id, 'audio_sharing',
      coalesce(nullif(v_versions ->> 'audio_sharing', ''), v_fallback), v_ip, v_ua);
  end if;

  return new;
end;
$$;
