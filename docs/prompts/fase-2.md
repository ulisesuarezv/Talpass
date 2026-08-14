# PROMPT — Fase 2 · Auth y onboarding del candidato

> Pegar en una sesión nueva y limpia. Fases 0 y 1 cerradas.

---

Eres el desarrollador de este proyecto. Antes de escribir nada, lee `CLAUDE.md`, `docs/00-PROJECT.md` (ADRs 01–18), `docs/01-DATA-MODEL.md`, `docs/CONVENTIONS.md` y la ficha de la Fase 2 en `docs/02-ROADMAP.md`.

Tu tarea es **únicamente la Fase 2: autenticación y onboarding del candidato**, más una corrección de entorno que va **antes que todo lo demás**.

## 0. CORRECCIÓN DE ENTORNO — hazla primero, no negociable (ADR-17)

La Fase 1 se ejecutó entera contra el proyecto Supabase **de producción**: un `db reset` que borró la base y un simulacro que desactiva tres políticas RLS a propósito. No hubo daño porque no había datos reales. A partir de la Fase 4 los habrá.

La máquina **sí tiene** Docker (OrbStack, ya arrancado al empezar esta sesión) y la CLI de Supabase 2.114. Confirma con `docker info` de todos modos: si falla, para y avisa, no sigas contra el remoto.

**Ya hecho antes de esta sesión, no lo repitas:** `seed-demo.mts` y
`tests/security/drill.mts` ya llaman a `assertLocalTarget()`
(`scripts/lib/supabase.mts`), que aborta si el host de `NEXT_PUBLIC_SUPABASE_URL`
o de `SUPABASE_DB_URL` no es local. No lo debilites ni lo puentees con la
variable de escape: si un script se niega a arrancar, el destino está mal, y eso
es justo lo que tienes que arreglar.

1. `supabase start` y confirma que la base local levanta.
2. Aplica las 14 migraciones en local desde cero y verifica que siguen limpias.
3. **Reapunta a local** todo lo que hoy usa `.env.local` (que mira a producción): semillas y ambas baterías de tests deben correr contra la base local. Usa un fichero de entorno propio para tests, no el de producción.
4. Verifica que `pnpm test:security` (56) y `pnpm test:security:drill` pasan **en local**.
5. Deja `supabase/config.toml` y los scripts de forma que el camino cómodo sea el local y el destructivo contra producción exija intención explícita. `db:reset` ya apunta a local; no lo devuelvas a `--linked`.
6. **Limpia producción**: los datos de demostración creados en la Fase 1 están en el proyecto remoto. Déjalo solo con el schema y los catálogos, sin candidatos, ETTs ni vacantes falsas.
7. Documenta el flujo en `docs/CONVENTIONS.md`: local para desarrollar y testear, `db:push:prod` solo con migraciones validadas.

Si algo de esto no se puede completar, **detente y avisa** antes de seguir con la fase.

## Alcance de la fase

**1. Autenticación**

- Email + contraseña con confirmación por email. Login, logout, recuperación de contraseña, reenvío de confirmación.
- Al crearse un usuario, se crea su `profile` con rol `candidate`. Los roles `agency_member` y `admin` **no se pueden obtener por registro público** — eso ya lo garantiza la Fase 1, no lo debilites.
- Protección de rutas por rol y redirecciones coherentes: un candidato que entra en `/agency` no ve un error feo, va a donde le corresponde.
- **Respeta ADR-11 y ADR-13**: las rutas públicas siguen sin tocar la sesión. Si al terminar la home deja de ser estática, la fase está mal.

**2. Onboarding — información básica**

Los campos del scope: nombre completo, nacionalidad, fecha de nacimiento, nivel de inglés, carné de conducir, si ha trabajado en NL/DE, ubicación actual, email, necesidad de alojamiento, necesidad de transporte.

- **Mobile-first de verdad**: el candidato rellena esto desde el móvil, con datos limitados y probablemente de pie. Pasos cortos, teclados correctos por tipo de campo, progreso guardado, sin perder datos al recargar.
- Nacionalidad y país salen de los **catálogos** (ADR-07), nunca de listas escritas en el código.
- Al terminar: puede ver ofertas, **no puede aplicar** — está `unverified`.

**3. Consentimientos versionados (GDPR + ADR-18)**

Registra en `consents`, con versión y marca de tiempo, y **por separado**:

- Términos y política de privacidad
- Compartición de datos con agencias verificadas
- **Audio**: que su grabación en inglés será **audible** por agencias verificadas (ADR-18). Casilla propia, explicada en lenguaje claro, revocable desde el perfil. No lo escondas dentro de los términos.

**4. Perfil del candidato**

Ver y editar sus datos, el campo de experiencia laboral en texto libre, y el estado de verificación de cada documento en **solo lectura** (la subida es Fase 4). Estado activo/inactivo visible.

**5. i18n**

Todo el copy nuevo en `es` y `en`. Cero texto en el JSX, incluidos errores de validación y mensajes de los formularios.

## Fuera de alcance — no lo hagas

Subida de documentos y audio (Fase 4), listado y detalle de vacantes (Fase 3), aplicar a una vacante (Fase 5), portal de ETT (Fase 6), plantillas de email bonitas (Fase 8), backoffice de admin (Fase 4).

## Riesgo conocido que debes verificar y reportar

El SMTP por defecto de Supabase tiene un límite de envíos muy bajo y no sirve para producción. Comprueba cuál es el límite real del proyecto y **repórtalo**: si bloquea el registro de candidatos reales, hay que adelantar la configuración de Resend como SMTP (hoy planificada en la Fase 8). No lo resuelvas por tu cuenta; mídelo y avisa.

## Verificación antes de cerrar

1. Registro completo end-to-end **probado en viewport móvil**: alta, confirmación, onboarding, perfil.
2. `pnpm test:security` y `:drill` siguen en verde **en local**, sin políticas debilitadas.
3. Las rutas públicas siguen estáticas: repite el procedimiento de `docs/CONVENTIONS.md`. Adjunta la evidencia.
4. Un candidato autenticado sigue sin poder leer datos de otro candidato ni la bolsa.
5. Los tres consentimientos quedan registrados con versión, y el de audio se puede revocar.
6. `next build` limpio.

## Al terminar

- Marca la Fase 2 como ✅ en `docs/02-ROADMAP.md` y añade los ADR nuevos que hayas tomado.
- Actualiza `docs/ESTADO.md`: dónde queda el trabajo y cuál es el siguiente paso.
- Reporta el límite de envío de emails que hayas medido.
- Resume qué debe saber la sesión de la Fase 3.
- **Commitea tu trabajo** en `main` y súbelo a `origin` (https://github.com/ulisesuarezv/Talpass). La Fase 1 dejó 19 ficheros sin commitear y sin remoto, con todo el proyecto en un solo disco; no lo repitas. Antes de commitear, comprueba que no se cuela ningún `.env` ni ninguna clave.
