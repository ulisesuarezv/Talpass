@AGENTS.md

# Talpass

Marketplace de dos lados: candidatos hispanohablantes/lusófonos ↔ ETTs de Europa Central. MVP: Alemania.

**Estado actual y siguiente paso: `docs/ESTADO.md`.** Léelo primero.

## Antes de trabajar, leer

1. `docs/00-PROJECT.md` — negocio, roles, decisiones cerradas (ADR-01…32), reglas de negocio
2. `docs/01-DATA-MODEL.md` — schema y matriz de acceso
3. `docs/02-ROADMAP.md` — fases y estado actual
4. `docs/CONVENTIONS.md` — naming, organización de carpetas, patrón servidor/cliente

## Reglas no negociables

- **La ETT nunca ve documentos, IBAN, dirección, email ni teléfono de un candidato** sin consentimiento explícito del candidato para esa ETT concreta. La bolsa es seudonimizada, y la seudonimización se aplica en la base de datos (vista + RLS), nunca filtrando en el cliente.
- **Al candidato no se le cobra nunca.** Regulación UE.
- **Lo que varía por país es catálogo en base de datos**, no enums ni condicionales. La expansión a más países es el plan, no una hipótesis.
- **Mobile-first y rápido.** El candidato entra desde el móvil con datos limitados.
- **i18n desde el día 1**: nada de texto hardcodeado. MVP en `es` y `en`.
- Todo dato sensible en buckets privados con URLs firmadas de vida corta, y cada apertura queda registrada.
- **Las rutas públicas no tocan la sesión** (ni proxy de sesión, ni lectura de cookies en servidor). Volverlas dinámicas mata ISR y el caché de CDN, y con ello el SEO. Ver ADR-11 y ADR-13.
- **El nombre y el dominio son provisionales**: nada de marca hardcodeada, todo desde config e i18n.

## Alcance

Se construye solo el alcance de la fase en curso. Lo que aparezca fuera de alcance se anota en el roadmap, no se implementa.

## Stack

Next.js 16 App Router · TypeScript · Tailwind v4 + shadcn/ui · next-intl · Supabase (región EU) · Resend · Vercel
