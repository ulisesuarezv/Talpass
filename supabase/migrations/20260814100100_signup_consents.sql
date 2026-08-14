-- Fase 2 · Los consentimientos se registran en el mismo acto que crea la
-- cuenta, no después.
--
-- El motivo es legal antes que técnico: lo que hay que poder demostrar es qué
-- texto aceptó una persona y cuándo lo aceptó. Si la fila se escribiera en el
-- primer inicio de sesión, la marca de tiempo sería la de otro momento, y de
-- quien se registra y nunca confirma el correo no quedaría constancia de nada,
-- aunque sus datos ya existan.
--
-- Van en el disparador de alta y no en una llamada aparte de la aplicación
-- porque en el momento del registro todavía no hay sesión: con confirmación por
-- correo, `signUp` crea el usuario pero no devuelve JWT, así que ninguna
-- política de `consents` dejaría escribir esa fila desde el cliente.
--
-- Los valores llegan en los metadatos del registro, que los rellena la Server
-- Action con la IP y el user-agent reales. Que un usuario pueda enviar sus
-- propios metadatos a mano no es un problema aquí: falsear el registro de tu
-- propio consentimiento no da acceso a nada — el rol sigue naciendo
-- `candidate` pase lo que pase (ver `app.handle_new_user`) — y los tres
-- consentimientos obligatorios se escriben aunque no vengan.

create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_ip inet := nullif(meta ->> 'consent_ip', '')::inet;
  v_ua text := nullif(meta ->> 'consent_user_agent', '');
  v_version text := coalesce(nullif(meta ->> 'consent_version', ''), '1');
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
    (new.id, 'terms', v_version, v_ip, v_ua),
    (new.id, 'privacy', v_version, v_ip, v_ua),
    (new.id, 'data_sharing', v_version, v_ip, v_ua);

  -- Opcional y revocable por separado (ADR-18): que una agencia verificada
  -- pueda escuchar su grabación en inglés.
  if coalesce((meta ->> 'consent_audio')::boolean, false) then
    insert into public.consents (profile_id, type, version, ip, user_agent)
    values (new.id, 'audio_sharing', v_version, v_ip, v_ua);
  end if;

  return new;
end;
$$;
