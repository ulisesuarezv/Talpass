-- Fase 1 · Storage.
--
-- Convención de rutas, de la que depende toda la seguridad de esta migración:
--   candidate-documents/<candidate_id>/<uuid>.<ext>
--   candidate-audio/<candidate_id>/<uuid>.<ext>
--   agency-logos/<agency_id>/<archivo>
-- La primera carpeta identifica al dueño. `candidate_documents` lo garantiza
-- con un CHECK sobre `storage_path`, así que la ruta no es una costumbre: es
-- una restricción.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'candidate-documents',
    'candidate-documents',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  ),
  (
    'candidate-audio',
    'candidate-audio',
    false,
    10485760,
    array['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav']
  ),
  (
    'agency-logos',
    'agency-logos',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  )
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- --------------------------------------------------------------------------
-- Buckets privados del candidato
-- --------------------------------------------------------------------------

create policy candidate_files_owner_read on storage.objects
  for select to authenticated
  using (
    bucket_id in ('candidate-documents', 'candidate-audio')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy candidate_files_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('candidate-documents', 'candidate-audio')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy candidate_files_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('candidate-documents', 'candidate-audio')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('candidate-documents', 'candidate-audio')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy candidate_files_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('candidate-documents', 'candidate-audio')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy candidate_files_admin_read on storage.objects
  for select to authenticated
  using (
    bucket_id in ('candidate-documents', 'candidate-audio')
    and app.is_admin()
  );

-- ADR-05. La misma regla que en `candidate_documents`, aplicada al archivo:
-- consentimiento concedido, del tipo de documento pedido y sin vencer. Sin
-- esto, una URL firmada sería lo único que separa a la ETT del DNI de alguien.
create policy candidate_files_agency_granted_read on storage.objects
  for select to authenticated
  using (
    bucket_id in ('candidate-documents', 'candidate-audio')
    and app.agency_can_read_object(bucket_id, name)
  );

-- --------------------------------------------------------------------------
-- Logos de ETT — el único bucket público
-- --------------------------------------------------------------------------

create policy agency_logos_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'agency-logos');

create policy agency_logos_member_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'agency-logos'
    and (storage.foldername(name))[1] = app.current_agency_id()::text
  );

create policy agency_logos_member_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'agency-logos'
    and (storage.foldername(name))[1] = app.current_agency_id()::text
  )
  with check (
    bucket_id = 'agency-logos'
    and (storage.foldername(name))[1] = app.current_agency_id()::text
  );

create policy agency_logos_member_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'agency-logos'
    and (storage.foldername(name))[1] = app.current_agency_id()::text
  );

create policy agency_logos_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'agency-logos' and app.is_admin())
  with check (bucket_id = 'agency-logos' and app.is_admin());
