-- Fase 1 · Cimientos: esquema de utilidades, tipos y disparador de updated_at.
--
-- Nota sobre enums vs catálogos (ADR-07): aquí solo hay enums de cosas que
-- NO varían por país (estados de un flujo, roles). Todo lo que cambia al abrir
-- un país nuevo — países, sectores, documentos, identificadores fiscales — es
-- catálogo en tablas, y vive en la migración siguiente.

create schema if not exists app;

comment on schema app is
  'Funciones de apoyo a RLS. Nada de datos: solo predicados booleanos.';

-- `public` no puede ejecutar nada aquí por defecto; cada función concede
-- EXECUTE explícitamente al rol que la necesita.
revoke all on schema app from public;
grant usage on schema app to anon, authenticated, service_role;

-- --------------------------------------------------------------------------
-- Tipos
-- --------------------------------------------------------------------------

create type public.user_role as enum ('candidate', 'agency_member', 'admin');

create type public.agency_member_role as enum ('owner', 'recruiter');

create type public.agency_status as enum ('pending', 'approved', 'suspended');

create type public.candidate_status as enum ('active', 'inactive');

create type public.verification_status as enum (
  'unverified',
  'pending',
  'verified',
  'rejected'
);

create type public.document_status as enum ('pending', 'verified', 'rejected');

create type public.job_status as enum (
  'draft',
  'published',
  'paused',
  'closed'
);

create type public.salary_period as enum ('hour', 'month');

create type public.shift_type as enum (
  'morning',
  'afternoon',
  'night',
  'rotating'
);

-- ADR-04. `rejected` es alcanzable desde cualquier estado.
create type public.application_status as enum (
  'pending',
  'in_review',
  'documents_requested',
  'hired',
  'rejected'
);

-- ADR-05.
create type public.access_request_status as enum (
  'pending',
  'granted',
  'denied',
  'expired',
  'revoked'
);

create type public.contact_request_status as enum (
  'pending',
  'accepted',
  'declined',
  'expired'
);

create type public.consent_type as enum ('terms', 'privacy', 'data_sharing');

create type public.email_status as enum (
  'queued',
  'sent',
  'delivered',
  'bounced',
  'failed'
);

create type public.deletion_request_status as enum (
  'pending',
  'processing',
  'completed',
  'rejected'
);

-- Marco Común Europeo. No varía por país: enum.
create type public.language_level as enum (
  'a1',
  'a2',
  'b1',
  'b2',
  'c1',
  'c2',
  'native'
);

-- --------------------------------------------------------------------------
-- updated_at
-- --------------------------------------------------------------------------

create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function app.set_updated_at() is
  'Disparador BEFORE UPDATE. No es SECURITY DEFINER: no lo necesita.';
