-- Fase 4 · Verificación de candidatos y backoffice de admin.
--
-- El schema de la fase 1 ya preveía casi todo lo de esta fase: `candidates.
-- verification_status`, `candidate_documents` con sus columnas de revisión, los
-- disparadores que impiden que el candidato se verifique a sí mismo y las
-- políticas de storage del admin. Lo único que faltaba es que **la apertura de
-- un documento por parte del admin se pueda registrar**, y eso no cabía en
-- `document_access_log` tal y como nació.

-- --------------------------------------------------------------------------
-- El registro de aperturas también vale para el admin
--
-- `request_id` era `not null` porque en la fase 1 la única apertura imaginada
-- era la de una ETT, que siempre nace de una solicitud de consentimiento
-- (ADR-05). Pero el admin abre el DNI de alguien cada vez que lo revisa, y esa
-- apertura tiene exactamente el mismo peso probatorio: es acceso de una
-- persona a un documento de identidad ajeno.
--
-- Sin este cambio quedaban dos salidas, las dos peores: no registrar las
-- aperturas del admin —dejando fuera del log justo al actor que más documentos
-- abre en el MVP— o inventar una solicitud de acceso falsa para poder apuntar
-- a ella, ensuciando la tabla que sostiene la defensa GDPR con filas que no
-- corresponden a ningún consentimiento real.
-- --------------------------------------------------------------------------

alter table public.document_access_log
  alter column request_id drop not null;

-- No se añade un CHECK del tipo "o solicitud o autor". Se probó y rompía el
-- borrado de una cuenta: `opened_by` es `on delete set null` a propósito, así
-- que al ejercer el derecho de supresión (GDPR art. 17) la fila se quedaría sin
-- ninguno de los dos y la restricción abortaría el borrado entero. La misma
-- decisión que ya tomó `email_log`: la traza sobrevive al perfil, aunque sea
-- perdiendo el nombre de quien actuó. Lo que nunca se pierde es que el
-- documento se abrió, cuándo, desde qué IP y con qué navegador.

create index document_access_log_opened_by_idx
  on public.document_access_log (opened_by, opened_at desc);

comment on column public.document_access_log.request_id is
  'Nulo cuando abre el admin durante la revisión (fase 4): esa apertura no '
  'nace de un consentimiento de ADR-05, pero se registra igual.';

-- El candidato tiene derecho a saber quién ha abierto sus documentos, y eso
-- incluye al administrador. La política de la fase 1 solo alcanzaba las
-- aperturas con solicitud detrás, así que las del backoffice quedaban
-- invisibles para él justo tras hacer nulo el `request_id`.
create policy document_access_log_candidate_read_own_documents
  on public.document_access_log
  for select to authenticated
  using (
    exists (
      select 1
      from public.candidate_documents d
      where d.id = document_access_log.document_id
        and d.candidate_id = (select auth.uid())
    )
  );

-- --------------------------------------------------------------------------
-- Subir un documento pone al candidato "en revisión"
--
-- `pending` significa exactamente "hay algo que mirar". No puede ponerlo el
-- candidato —el disparador de la fase 1 le impide tocar `verification_status`,
-- y eso no se toca— ni tiene sentido que lo ponga el admin a mano: el hecho que
-- lo dispara es la subida, y el único sitio donde ese hecho consta es aquí.
--
-- La función es SECURITY DEFINER y por eso pasa el guardarraíl (`current_user`
-- es su dueño, no el candidato). Lo que la hace segura es que **solo sabe
-- escribir `pending`**, y solo desde `unverified` o `rejected`. Verificar sigue
-- siendo un acto del admin: si esta función pudiera escribir `verified`, sería
-- la brecha que toda la fase 1 se dedicó a cerrar.
-- --------------------------------------------------------------------------

create or replace function app.mark_candidate_under_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.candidates
     set verification_status = 'pending'
   where profile_id = new.candidate_id
     and verification_status in ('unverified', 'rejected');

  return new;
end;
$$;

create trigger candidate_documents_mark_under_review
  after insert on public.candidate_documents
  for each row execute function app.mark_candidate_under_review();

revoke all on function app.mark_candidate_under_review() from public, anon, authenticated;

-- --------------------------------------------------------------------------
-- La cola de revisión ordena por antigüedad
--
-- El índice de la fase 1 (`status, created_at` where pending) sirve para
-- contar; el backoffice además lee el candidato de cada documento pendiente.
-- --------------------------------------------------------------------------

create index if not exists candidate_documents_pending_by_candidate_idx
  on public.candidate_documents (candidate_id, created_at)
  where status = 'pending';
