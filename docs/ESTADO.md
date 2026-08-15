# Estado del proyecto — punto de retomada

> Última actualización: **2026-08-15**. Fase 2 cerrada y verificada; **fase 3 preparada pero NO lanzada**.
> Este documento dice exactamente dónde se dejó el trabajo y cuál es el siguiente paso.
> El detalle de cada fase está en `docs/02-ROADMAP.md`; las decisiones, en `docs/00-PROJECT.md`.

---

## Dónde estamos

**Fases 0, 1 y 2 cerradas.** La siguiente es la **Fase 3 — Vacantes públicas y SEO**, con su prompt en `docs/prompts/fase-3.md`.

Cierre de la fase 2 verificado por el PM el 2026-08-15: `test:security` 57/57 y el simulacro en verde ejecutados de nuevo, cruce de entornos del simulacro corregido de verdad (`.env.test`), y ningún fichero de entorno con valores de producción en el repositorio. Son **17 migraciones**, no 16.

| Fase                   | Estado                                       |
| ---------------------- | -------------------------------------------- |
| 0 · Fundaciones        | ✅ desplegada en producción                  |
| 1 · Datos y seguridad  | ✅ 36 tablas, RLS probada                    |
| 2 · Auth y onboarding  | ✅ registro real end-to-end, 57 tests verdes |
| **3 · Vacantes + SEO** | **⬜ siguiente**                             |
| 4–10                   | ⬜                                           |

**Marca:** Talpass · **dominio:** talpass.eu (registrado, aún sin conectar en Vercel) · **producción provisional:** https://ettrecruiter.vercel.app

---

## Lo primero al retomar

**La fase 3 no se ha lanzado.** Su prompt está escrito y commiteado en
`docs/prompts/fase-3.md`, listo para pegar en una sesión nueva y limpia.

Las dos llaves que la bloqueaban están resueltas o casi:

| Llave                   | Estado el 2026-08-15                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase login`        | ✅ hecho y **proyecto enlazado** (`EttRecruiter`, `zwimxgvacykmdkoxfpmw`, `eu-west-1`). Verificado: producción tiene 14 de 17 migraciones |
| Resend con `talpass.eu` | 🟡 DNS configurado, **verificación en curso**. Antes de lanzar la fase 3, confirmar en el panel de Resend que el dominio pone `Verified`  |

El estado del enlace se comprueba en cualquier momento, sin tocar nada:

```bash
supabase migration list --linked   # las 3 pendientes salen con el remoto vacío
```

Las tres que faltan en producción son `20260814090000_grants.sql`,
`20260814100000_onboarding.sql` y `20260814100100_signup_consents.sql`. **No se
empujan a mano**: aplicarlas es el punto 1 del prompt de la fase 3, que además
valida el resultado y encadena con las URLs de retorno y el SMTP en el orden
correcto.

Cuando Resend esté verificado:

```
Lee docs/prompts/fase-3.md y ejecútalo.
```

Para trabajar en local, sea cual sea la fase:

```bash
pnpm db:start        # OrbStack tiene que estar arrancado
pnpm dev:local       # Next contra la base local
```

**Se desarrolla contra la base local, no contra producción** (ADR-17). Hay dos
ficheros de entorno y no se mezclan: `.env.test` apunta a local y lo leen
`dev:local`, las semillas y los tests; `.env.local` apunta a producción. Si
falta `.env.test`, se crea con `cp .env.test.example .env.test`. Los correos de
prueba se leen en Mailpit, http://127.0.0.1:54324.

Procedimiento completo en `docs/CONVENTIONS.md`.

---

## Lo que la fase 2 dejó pendiente y hay que atender

Los tres puntos de abajo **entran en el alcance de la Fase 3** por decisión del 2026-08-15, y su prompt (`docs/prompts/fase-3.md`) arranca con ellos antes de tocar el SEO.

1. **Adelantar Resend como SMTP.** Es lo más urgente de esta lista. El límite
   de envío de producción está **medido**: el segundo correo de la misma hora
   ya devuelve `over_email_send_rate_limit`. Con eso no se puede registrar ni
   un puñado de candidatos reales, así que la configuración de Resend, hoy
   planificada en la fase 8, hay que traerla antes de mandar tráfico. Volver a
   medir cuando esté: `node --env-file=.env.local scripts/probe-email-limit.mts <correo>`.

2. **Aplicar a producción las migraciones de la fase 2.** Están validadas en
   local (`db:reset` desde cero, 57 tests y simulacro en verde) pero **no
   aplicadas**. Ya no falta el token: `supabase login` está hecho y el proyecto
   enlazado, así que `pnpm db:push:prod` funciona. Son tres:
   `20260814090000_grants.sql`, `20260814100000_onboarding.sql` y
   `20260814100100_signup_consents.sql`.

3. **Declarar las URLs de retorno en el panel de producción**
   (Authentication › URL Configuration): `site_url` y las
   `additional_redirect_urls` que ya están en `supabase/config.toml` para
   local, apuntando al dominio real. **Sin esto el registro no funciona en
   producción**: Supabase ignora el `emailRedirectTo` de la aplicación, manda
   el enlace a la home y la sesión no se canjea nunca. No da ningún error.

---

## Pendientes de Ulises (fuera del repositorio)

1. **Guardar el llavero de cifrado de `.env.local` en el gestor de contraseñas.** Es el único secreto del proyecto que **no se puede regenerar**: perderlo es perder los IBAN cifrados, por diseño. Lo más urgente de esta lista.
2. **Rotar la contraseña de la base de datos** — pasó por el chat. Está en `.env.local`, ignorado por git, así que es higiene, no urgencia.
3. **Conectar `talpass.eu` en Vercel** y actualizar allí `NEXT_PUBLIC_SITE_URL` y `NEXT_PUBLIC_SITE_NAME`. El dominio ya está comprado. Se puede conectar sin riesgo de SEO: `robots.txt` devuelve `Disallow: /` hasta que la fase 3 encienda `NEXT_PUBLIC_ALLOW_INDEXING` (ADR-16), y esa bandera no se deriva del dominio a propósito. Al cambiar el dominio, actualizar también las URLs de retorno del punto 3 de arriba.
4. **`talpass.com` queda aplazado por presupuesto.** Decisión consciente, no un olvido: es la mitigación del riesgo de ADR-12 (un `.eu` se pierde si el titular deja de estar establecido en la UE) y sigue pendiente. Revisarlo cuando haya caja.
5. **En tu bandeja hay un correo de "Confirm your email address"** con alias `+smtp-probe-…`. Es de la medición del límite de envío; la cuenta ya está borrada y se puede ignorar.

---

## Decisiones tomadas el 2026-08-15, ya reflejadas en el roadmap

- **Resend se adelanta de la fase 8 a la fase 3**, y solo el transporte SMTP; las plantillas i18n siguen en la 8. Motivo: sin correo que aguante, la máquina de tráfico que construye la fase 3 aterriza en un registro roto.
- **La bandera de indexación deja de ser automática al cerrar la fase 3.** Se enciende únicamente tras comprobar un alta real de punta a punta contra producción. Si el alta no funciona, la fase entrega el SEO con la bandera apagada y lo dice (ADR-16).

---

## Decisiones abiertas, para cuando toquen

- **ADR-06** · ¿La ETT seguirá creando vacantes sin moderación? Se decide tras ver la calidad real de las ofertas de la primera ETT.
- **ADR-04** · `documents_requested` no se puede saltar. Si estorba en la fase 6, se cambia con una decisión, no con un parche.
- **ADR-19** · Los `grant` de tabla replican los amplios de Supabase por defecto. Afinarlos por tabla y operación es endurecimiento, fase 10.
- **Fase 7** · El audio se reproduce en la bolsa con URL firmada de ≤5 min y escucha registrada (ADR-18). El consentimiento ya se recoge y se revoca; **la fase 7 tiene que leerlo antes de firmar nada**.

---

## Cosas que no deben olvidarse

- **Las rutas públicas no tocan la sesión** (ADR-11, ADR-13). Se verifica en cada fase con el procedimiento de `docs/CONVENTIONS.md`. Si la home deja de ser estática, el SEO está roto aunque la página se vea bien.
- **Nunca `db reset` ni el simulacro contra producción** (ADR-17). Los scripts ya se niegan solos.
- La marca no se escribe en el JSX: sale de `src/config/site.ts` (ADR-12).
- **Cero texto en el JSX, tampoco los errores.** Las Server Actions devuelven claves de traducción, no frases.
