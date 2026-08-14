# Estado del proyecto — punto de retomada

> Última actualización: **2026-08-13, fin de jornada**.
> Este documento dice exactamente dónde se dejó el trabajo y cuál es el siguiente paso.
> El detalle de cada fase está en `docs/02-ROADMAP.md`; las decisiones, en `docs/00-PROJECT.md`.

---

## Dónde estamos

**Fases 0 y 1 cerradas y verificadas.** La siguiente es la **Fase 2 — Auth y onboarding del candidato**, con su prompt ya redactado en `docs/prompts/fase-2.md`.

| Fase                      | Estado                        |
| ------------------------- | ----------------------------- |
| 0 · Fundaciones           | ✅ desplegada en producción   |
| 1 · Datos y seguridad     | ✅ 36 tablas, 56 tests verdes |
| **2 · Auth y onboarding** | **⬜ siguiente**              |
| 3–10                      | ⬜                            |

**Marca:** Talpass · **dominio:** talpass.eu (registrado el 2026-08-14, aún sin conectar en Vercel) · **producción provisional:** https://ettrecruiter.vercel.app

---

## Lo primero al retomar

Abrir sesión nueva y limpia y lanzar:

```
Lee docs/prompts/fase-2.md y ejecútalo.
```

Ese prompt arranca con una **corrección de entorno obligatoria** (punto 0): toda la Fase 1 se ejecutó contra el proyecto Supabase de producción, incluido un `db reset` y un simulacro que desactiva políticas RLS. Hay que mover el desarrollo y los tests a la base local (ADR-17) y limpiar los datos de demostración que quedaron en el proyecto remoto. Antes de nada, arrancar OrbStack y comprobar `docker info`.

---

## Revisión previa al commit — hecha el 2026-08-14

El diff de la Fase 1 se revisó entero antes de subirlo. Sin secretos en el árbol, sin `using (true)` indebido, las 9 funciones `SECURITY DEFINER` con `set search_path`, y `typecheck`/`lint`/`format` limpios.

Encontró **un guardarraíl que no guardaba nada**: `seed-demo.mts` afirmaba negarse a escribir contra producción, pero solo comprobaba `NEXT_PUBLIC_SITE_URL` —una variable que no interviene en la conexión a la base—, así que el proyecto remoto pasaba el control. `drill.mts`, que desactiva políticas de RLS de verdad, no comprobaba nada en absoluto.

Corregido antes del commit con `assertLocalTarget()` en `scripts/lib/supabase.mts`, que mira el host real de `NEXT_PUBLIC_SUPABASE_URL` y de `SUPABASE_DB_URL`. Probado en los seis casos, incluido el peligroso de verdad: API local con `SUPABASE_DB_URL` apuntando a producción. Ver ADR-17.

El código está en **https://github.com/ulisesuarezv/Talpass** (privado).

---

## Pendientes de Ulises (fuera del repositorio)

1. **Guardar el llavero de cifrado de `.env.local` en el gestor de contraseñas.** Es el único secreto del proyecto que **no se puede regenerar**: perderlo es perder los IBAN cifrados, por diseño. Lo más urgente de esta lista.
2. **Rotar la contraseña de la base de datos** — pasó por el chat. Está en `.env.local`, ignorado por git, así que es higiene, no urgencia.
3. **Conectar `talpass.eu` en Vercel** y actualizar allí `NEXT_PUBLIC_SITE_URL` y `NEXT_PUBLIC_SITE_NAME`. El dominio ya está comprado. Se puede conectar cuando quieras y sin riesgo de SEO: `robots.txt` devuelve `Disallow: /` hasta que la Fase 3 encienda `NEXT_PUBLIC_ALLOW_INDEXING` (ADR-16), y esa bandera no se deriva del dominio a propósito.
4. **`talpass.com` queda aplazado por presupuesto.** Decisión consciente, no un olvido: es la mitigación del riesgo de ADR-12 (un `.eu` se pierde si el titular deja de estar establecido en la UE) y sigue pendiente. Revisarlo cuando haya caja; hasta entonces el riesgo es que alguien registre el `.com` de la marca antes.

---

## Decisiones abiertas, para cuando toquen

- **ADR-06** · ¿La ETT seguirá creando vacantes sin moderación? Se decide tras ver la calidad real de las ofertas de la primera ETT.
- **ADR-04** · `documents_requested` no se puede saltar. Si estorba en la Fase 6, se cambia con una decisión, no con un parche.
- **Fase 2** · Medir el límite de envío del SMTP por defecto de Supabase. Si bloquea el registro real, hay que adelantar Resend desde la Fase 8.
- **Fase 7** · El audio se reproduce en la bolsa con URL firmada de ≤5 min y escucha registrada (ADR-18). Hay que implementarlo ahí.

---

## Cosas que no deben olvidarse

- **Las rutas públicas no tocan la sesión** (ADR-11, ADR-13). Se verifica en cada fase con el procedimiento de `docs/CONVENTIONS.md`. Si la home deja de ser estática, el SEO está roto aunque la página se vea bien.
- **Nunca `db reset` ni el simulacro contra producción** (ADR-17).
- La marca no se escribe en el JSX: sale de `src/config/site.ts` (ADR-12).
