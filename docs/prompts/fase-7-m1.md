# PROMPT — Fase 7 · M1 · La conversación: esquema y seguridad

> Pegar en una sesión nueva y limpia. Primera de las cinco sesiones de la
> conversación ETT ↔ candidato (ADR-53). **Esta sesión no construye ni una
> pantalla**: deja la base de datos y la batería de seguridad listas para que
> M2 (lado ETT) y M3 (lado candidato) solo tengan que pintar.

---

Eres el desarrollador de este proyecto. Antes de escribir nada, lee
`CLAUDE.md`, el recuadro 🧭 de `docs/ESTADO.md`, y en `docs/00-PROJECT.md`
con atención **ADR-03** (la bolsa seudonimizada en la base), **ADR-04**
(auditoría del ciclo de vida), **ADR-05** (consentimiento documental), **ADR-17**
(local para trabajar), **ADR-51** (IBAN y dirección solo tras `hired`),
**ADR-52** (el portal de agencia y la recursión que destapó) y, entera,
**ADR-53**, que es la de esta fase. Después `docs/01-DATA-MODEL.md` (apartados
F, G y J) y `docs/CONVENTIONS.md` («Base de datos», sobre todo «Funciones
SECURITY DEFINER» y «Los tests de seguridad no son opcionales»).

Tu tarea: **el esquema de la conversación, con la seguridad impuesta en la
base y probada en `test:security`.**

## 0. Lo que ya existe y lo que no

- La bolsa (`/agency`) y la ficha seudonimizada existen desde ADR-52. Leen
  solo `candidate_directory`.
- `candidate_contact_requests` existe desde la fase 1, **sin una sola
  pantalla ni fila en producción**. ADR-53 la sustituye: la conversación en
  estado pendiente _es_ la solicitud de contacto. Retírala en tu migración
  (tabla, políticas, tipo `contact_request_status` si nadie más lo usa) y
  quítala de `01-DATA-MODEL.md`. Compruébalo con `grep` antes: hoy solo la
  nombran los tipos generados.
- `applications` tiene el estado `hired`. Es lo que dispara el revelado.

## 1. Las reglas de ADR-53, traducidas a base de datos

1. **Una conversación por pareja agencia–candidato.** La abre la ETT, nunca el
   candidato. Solo con candidatos que la ETT puede ver en la bolsa
   (verificados y activos), y solo si la agencia está `approved`
   (`current_agency_id()` ya lo resuelve).
2. **Estados:** pendiente (la ETT ha escrito su único mensaje) → abierta (el
   candidato acepta) | rechazada (el candidato rechaza). Piensa si hace falta
   «cerrada» y quién la cierra; decídelo y escríbelo.
3. **Mientras está pendiente, la ETT no puede enviar un segundo mensaje.** Si
   el candidato rechaza, no puede volver a escribir. Solo el candidato acepta
   o rechaza.
4. **Oferta adjunta, opcional, en el mensaje**: una vacante **publicada** de la
   **misma** agencia. Nunca un borrador ni una vacante de otra ETT. Solo la
   adjunta la agencia.
5. **Ocultación de contactos hasta `hired`.** Al guardar un mensaje se guardan
   el original y la versión oculta. Teléfonos (con y sin prefijo, con
   espacios, puntos y guiones), correos y enlaces (incluidos `wa.me` y
   `t.me`). Ninguna de las partes lee el original **hasta que exista una
   aplicación `hired` de ese candidato en una vacante de esa agencia**; desde
   ese momento, los dos leen el original, también el de mensajes anteriores.
   Quien escribe un mensaje sí ve su propio original. **El admin lee siempre
   el original.**
6. **Los mensajes no se editan ni se borran** por sus autores. El borrado de
   una cuenta los arrastra (ver cómo lo hacen hoy `applications` y
   `document_access_requests`, y sé coherente).
7. **Preparado para traducir, sin traducir:** cada mensaje guarda su idioma de
   origen (el `locale` del perfil de quien escribe) y hay una tabla de
   traducciones por mensaje e idioma, vacía, que solo escribe `service_role`
   y que se lee con la misma regla que el mensaje. Si un día la traducción se
   hace sobre el texto oculto o sobre el original es una decisión de
   privacidad: **traduce siempre sobre el texto que la otra parte puede ver**, y
   déjalo escrito.
8. **Leído / no leído:** lo que haga falta para que M3 sepa si avisar por
   correo y para que las bandejas marquen lo pendiente. Mínimo y sin
   exponer nada de la otra parte.
9. **Límites de texto:** mensaje no vacío y con un máximo razonable
   (decídelo y justifícalo).

## 2. Cómo se impone, y por qué así

**Ni la ETT ni el candidato tienen SELECT, INSERT, UPDATE ni DELETE sobre las
tablas base de mensajes.** Es el patrón de `candidate_directory`:

- **Leer**, por una vista (o función de lectura) que decide original u oculto
  fila a fila y que solo devuelve las conversaciones de quien pregunta.
- **Escribir**, por funciones `security definer` en el esquema `app`: abrir la
  conversación con su primer mensaje, enviar, aceptar, rechazar, marcar como
  leído. Ocultan al guardar y validan las reglas del §1.

Las reglas de CONVENTIONS para `security definer` se aplican **sin
excepción**: la identidad de quien actúa sale de `auth.uid()`, nunca de un
parámetro; devuelven un booleano o un id propio, **nunca filas**;
`set search_path = ''`. Un parámetro que diga **a quién** se escribe (el
candidato) o **en qué** conversación es aceptable, como el
`p_document_id` de `agency_can_read_document`; uno que diga **quién** escribe,
no.

**⚠️ Cuidado con la recursión de RLS**, que costó una sesión en ADR-52: una
política que consulta su propia tabla revienta, y `assertNoRows` lo da por
bueno. Usa las funciones de `20260927110000_agency_members_recursion.sql`
(`is_member_of_agency`) o las de `current_agency_id()`.

La ocultación en SQL con expresiones regulares está bien. **Escribe una
función pura de ocultación y pruébala aparte con una tabla de casos**: `+49
170 1234567`, `0034 600 111 222`, `600-111-222`, `600.111.222`,
`correo@dominio.com`, `https://…`, `wa.me/34600111222`. Y también los que no
debe tocar: una fecha, un salario («1.800 €»), unas horas («40 h»), un código
postal dentro de una frase normal. Lo que no se pueda ocultar sin romper
texto normal (un número escrito en letras, por ejemplo) se anota como límite
conocido; no se persigue.

## 3. La batería (`tests/security/run.mts`)

Una sección nueva. Como mínimo, y **cada «no puede» con su control positivo al
lado**:

- La ETT abre una conversación con un candidato de la bolsa **(control
  positivo)**; no con uno sin verificar, ni inactivo, ni siendo una ETT no
  aprobada.
- No envía un segundo mensaje mientras está pendiente; no escribe tras un
  rechazo; el candidato no abre conversaciones.
- El candidato acepta **(positivo)** y entonces los dos escriben **(positivo)**.
- La ETT no adjunta un borrador ni una vacante de otra agencia.
- **El teléfono de un mensaje no aparece en ninguna respuesta de la otra parte
  antes de `hired`**: usa `assertAbsent` sobre la respuesta entera, que es la
  red que caza la fuga que no se te ocurrió. Y **sí aparece después de
  `hired`** (positivo), también en los mensajes anteriores.
- La otra ETT no ve la conversación; otro candidato tampoco; el anónimo nada.
- Nadie escribe directamente en las tablas base, ni edita ni borra un
  mensaje.
- El admin lee el original **(positivo)**.
- La tabla de traducciones: nadie salvo `service_role` escribe; se lee con la
  regla del mensaje.

**Y el simulacro:** añade a `tests/security/drill.mts` una política o función
de las tuyas que, rota, tenga que poner la batería en rojo. Si el simulacro
sale verde, falta un test.

`seed-demo.mts` necesita lo mínimo para estos tests (una conversación en cada
estado, una aplicación `hired`); **no toques `seed-pool.mts`**, que es para
enseñar la bolsa.

## 4. Fuera de alcance

Pantallas, avisos por correo, peticiones de documentos dentro del hilo (M4),
traducción real y la política de privacidad. Si encuentras algo que falta
fuera de esto, se anota en el roadmap, no se construye.

## 5. Hecho cuando

- `pnpm db:reset && pnpm test:security && pnpm test:security:drill` en verde,
  con la sección nueva, y **cada test nuevo visto en rojo al menos una vez**
  antes de verde (di cómo: quitando la regla, no suponiéndolo).
- `pnpm db:types` regenerado; `pnpm typecheck` y `pnpm lint` en verde.
- `01-DATA-MODEL.md` describe las tablas nuevas y la matriz de acceso J tiene
  su fila; `candidate_contact_requests` ya no aparece.
- La migración **no** se aplica a producción: eso lo hace Ulises con
  `pnpm db:push:prod`, en su terminal, cuando se decida desplegar.
- `docs/ESTADO.md` (recuadro 🧭) y la fase 7 del roadmap dicen qué quedó
  hecho, qué no y por qué, sin marcar ✅ nada que no esté verificado.
- Resumen final para el PM con: tablas y funciones creadas, los casos de la
  ocultación y sus límites conocidos, los tests nuevos y cómo se vio cada uno
  en rojo, y cualquier decisión que tomaste en lugar de Ulises.
