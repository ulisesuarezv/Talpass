# PROMPT — Fase 4 · Verificación y backoffice admin

> Pegar en una sesión nueva y limpia. Fases 0, 1 y 2 cerradas; la 3 construida y verificada en local, pendiente de su bloque de producción.

---

Eres el desarrollador de este proyecto. Antes de escribir nada, lee `CLAUDE.md`, `docs/ESTADO.md`, `docs/00-PROJECT.md` (ADRs 01–24), `docs/01-DATA-MODEL.md`, `docs/CONVENTIONS.md` y la ficha de la Fase 4 en `docs/02-ROADMAP.md`.

Tu tarea es la **Fase 4: verificación de candidatos y backoffice de admin**.

## 0. Entorno y límites

```bash
pnpm db:start        # OrbStack arrancado
pnpm dev:local       # Next contra la base local
```

Todo esta fase se construye **contra la base local** (ADR-17).

**No toques producción.** `docs/ESTADO.md` tiene un bloque de cuatro pasos de producción pendientes de la fase 3 (migraciones, SMTP de Resend, URLs de retorno, bandera de indexación). **Son de Ulises y los está haciendo por su cuenta en paralelo.** No los ejecutes, no los des por hechos y no construyas nada que dependa de que estén hechos. Si te topas con algo que los necesita, anótalo y sigue.

Aviso de la fase 0 que ahora aplica: el cliente `service_role` **se crea en esta fase**, que es cuando el backoffice lo necesita. Nace con las mismas cautelas que el resto: solo servidor, nunca `NEXT_PUBLIC_`, y solo donde la RLS no baste para lo que legítimamente tiene que hacer un admin.

## 1. Subida de documentos — el candidato

- Subida **desde el móvil, con cámara**: DNI o pasaporte (ambas caras), CV, y el carné de conducir si lo declaró. Los documentos obligatorios salen del **catálogo por país** (ADR-07), no de una lista en el código.
- **Grabación de audio en inglés en el navegador**, con fallback a subir un archivo. Es el activo comercial de la bolsa (ADR-18), así que la grabación tiene que ser fácil de repetir: escuchar, descartar, volver a grabar.
- Estado por documento visible para el candidato: pendiente, en revisión, aprobado, rechazado con motivo.
- Todo a **buckets privados**. Nada de URLs públicas, nunca. Lo que el propio candidato ve de sus documentos va con URL firmada de vida corta emitida por el servidor.
- Límites de tamaño y validación de tipo de archivo desde el principio. El endurecimiento fino es de la fase 10, pero un endpoint de subida sin límite es un problema hoy.

## 2. Backoffice del admin

- **Cola de revisión**: los documentos pendientes, los más antiguos primero.
- Aprobar / rechazar **con motivo**, y el motivo llega al candidato en su idioma.
- Ficha del candidato con su estado de verificación y sus documentos.
- Cuando el conjunto obligatorio del país está aprobado, el candidato pasa a `verified` **y recibe aviso**. En local se comprueba con Mailpit.
- Cada apertura de un documento por el admin **queda registrada**, igual que la de una ETT. El log ya existe desde la fase 1; úsalo.

**Lo que no debes debilitar:** el disparador que impide a un candidato marcarse como verificado o tocar las columnas de revisión de sus propios documentos. Es lo que el simulacro de brecha rompe a propósito para comprobar que la batería lo caza. Si te estorba, es que estás escribiendo desde el sitio equivocado.

## 3. Publicar vacantes reales en producción

Hoy **no existe ninguna forma** de meter una vacante en producción: el CRUD es de la fase 6 y `seed:demo` se niega —con razón— a tocar producción. El resultado es que el SEO de la fase 3 está construido sobre un catálogo vacío, y su criterio de aceptación (validar una vacante en el Google Rich Results Test) necesita una URL pública real.

Hace falta **lo mínimo que funcione**, no un CRUD completo: eso es la fase 6 y ahí lo hará la propia ETT (ADR-06). Elige la solución más simple que resuelva esto y **razona la elección**:

- Una vacante real tiene contenido **traducible** (`es` y `en`), sector, ciudad, salario con moneda y periodo, y las banderas de alojamiento/transporte/carné que usan los filtros.
- Ulises va a redactar las ofertas a mano. Lo que le des tiene que ser cómodo de rellenar y **repetible sin ti**: si publicar la sexta vacante exige abrir una sesión de Claude, no sirve.
- Tiene que ser **idempotente**: volver a lanzarlo con la misma oferta la actualiza, no la duplica.
- Publicar contra producción es una escritura deliberada. Que exija intención explícita, como `db:push:prod`, y que **por defecto vaya a local**.
- Las landings son `dynamicParams = false` y se derivan de las vacantes vivas (ADR-23): documenta que publicar una vacante en una ciudad nueva **exige un redespliegue** para que su landing exista. Si no, quien publique la séptima oferta no entenderá por qué no aparece.

Deja escrito en `docs/CONVENTIONS.md` cómo se publica una vacante, con un ejemplo completo.

## 4. Fuera de alcance — no lo hagas

Aplicar a una vacante (fase 5), portal de ETT y su CRUD de vacantes (fase 6), la bolsa y el consentimiento documental (fase 7), plantillas de email i18n bonitas (fase 8), OCR o verificación automática (fuera del MVP), textos legales (fase 9).

**El aviso al candidato de esta fase es funcional, no bonito.** Que llegue y esté traducido; el diseño de plantillas es de la fase 8.

## 5. Verificación antes de cerrar

1. **Ciclo completo en viewport móvil**: el candidato sube sus documentos y graba su audio, el admin los aprueba, el candidato pasa a `verified` y le llega el aviso (Mailpit). Adjunta la evidencia.
2. Rechazo con motivo: el candidato lo ve, en su idioma, y puede volver a subir.
3. **Un candidato no puede verificarse a sí mismo** ni tocar las columnas de revisión. `pnpm test:security` y `:drill` en verde, sin políticas ni disparadores debilitados. Si has añadido tablas o columnas, **añade comprobaciones nuevas a la batería**: la fase 1 dejó dicho que una tabla sin RLS es una brecha, no un descuido.
4. Los documentos no son accesibles sin permiso: compruébalo con un usuario que no debería verlos, no razonándolo.
5. Las rutas públicas siguen estáticas: procedimiento de `docs/CONVENTIONS.md`, **incluida la comprobación del HTML**, no solo la letra del build. Esa trampa ya mordió en la fase 3.
6. Publicar una vacante funciona **contra local**, es idempotente y aparece en el listado y en su landing.
7. `typecheck`, `lint`, `format:check` y `build` limpios.

## 6. Al terminar

- Marca la Fase 4 en `docs/02-ROADMAP.md` **solo si su criterio de "hecho cuando" está cumplido y verificado**. Si algo quedó sin comprobar, déjala en 🟡 y dilo: la fase 3 se marcó ✅ con dos criterios sin verificar y hubo que corregirlo.
- Añade los ADR nuevos que hayas tomado.
- Actualiza `docs/ESTADO.md` **sin borrar el bloque de producción de la fase 3** si sigue abierto.
- Explica en dos líneas, para Ulises, cómo publicar una vacante real.
- Resume qué debe saber la sesión de la Fase 5.
- **Commitea y sube a `origin`** (https://github.com/ulisesuarezv/Talpass). Antes de commitear, comprueba que no se cuela ningún `.env` ni credencial.
