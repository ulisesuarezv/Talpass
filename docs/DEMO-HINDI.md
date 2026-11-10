# Demo para Hindi Personalmanagement

> ⚠️ Rama `demo/hindi`. **No se fusiona en `main`**: la conversación de aquí es
> una versión de demo, sin la batería de seguridad ni lo legal de la fase 7.
> Todo corre en local, con datos inventados. No toca producción.

## 1. Preparar el portátil (hoy, no mañana)

Requisitos: lo de `docs/ONBOARDING.md` (Node 24, pnpm, Docker u OrbStack, CLI
de Supabase) y `.env.test` copiado de `.env.test.example`.

```bash
git fetch && git switch demo/hindi
pnpm install
pnpm db:start            # Docker tiene que estar arrancado
pnpm demo:setup          # base desde cero + bolsa + Hindi + conversaciones
pnpm build:local
pnpm start:local -p 3210
```

Probar entero el recorrido de abajo **una vez hoy**. Mañana, antes de la
reunión, `pnpm demo:setup` otra vez para que todo empiece limpio (no hace
falta volver a hacer el build).

**No hace falta internet en la reunión**: todo corre en el portátil.

## 2. Las dos ventanas

| Ventana                                                  | URL                             | Cuenta                    |
| -------------------------------------------------------- | ------------------------------- | ------------------------- |
| **Hindi** (Chrome normal, pantalla grande)               | http://localhost:3210/de/login  | `demo@hindi.test`         |
| **Candidato** (Chrome incógnito, estrecha, tamaño móvil) | http://localhost:3210/es/entrar | `pool-pablo@talpass.test` |

Contraseña de las dos: `Talpass-Demo-2026!`

Para la ventana del candidato: incógnito, F12 → icono de móvil (o la ventana
estrecha a mano). Deja las dos con la sesión ya abierta antes de empezar.

El portal de agencia está en alemán (`DE`) y en inglés (`EN`), con el selector
de la cabecera. Cambia de idioma en directo si Basil prefiere inglés.

## 3. El guion (10 minutos)

1. **La bolsa.** «Necesitas mozos de almacén para Göttingen». Filtros:
   Branche = Lager, **Wohnt bereits in Deutschland**, **Braucht keine
   Unterkunft** → salen los que ya viven cerca (Göttingen, Kassel, Hannover,
   Northeim). Señalar los sellos: documentos revisados por Talpass y
   grabación en inglés.
2. **La ficha de Pablo H.** (Göttingen, almacén, carné, sin alojamiento).
   Nombre seudonimizado: la ETT no ve apellido, email ni teléfono todavía.
3. **Escribir.** En el recuadro de la derecha, la oferta de Hindi ya va
   adjunta (Lagerhelfer, desde 15,33 €/h, Fahrdienst). Mensaje con plantilla →
   **Nachricht senden**.
4. **Pasar a la ventana del candidato.** En unos segundos aparece «Tienes 1
   mensaje nuevo» → ver mensajes → la oferta con sueldo y transporte →
   **Aceptar y responder** → escribir, por ejemplo: «Hi! Yes, I live in
   Göttingen and can start next week. My phone is +49 1520 4417 382».
5. **Volver a Hindi.** El mensaje llega solo, **con el teléfono tapado**
   (`[•••]`). Es el argumento: nadie se salta la plataforma.
6. **Als eingestellt markieren.** Sale un aviso: pedir los datos solo cuando
   esté seguro de contratar, porque desde ahí cuenta como contratado y se
   paga por él. **Ja, einstellen** → aparecen el nombre completo, el teléfono,
   el email, **la grabación en inglés** (darle al play) y **los documentos**
   (DNI y CV, se abren en otra pestaña; son de muestra, marcados «MUSTER»), y
   el mensaje sin tapar.
7. **Nachrichten.** Hay dos conversaciones más ya empezadas: Elena R.
   (esperando respuesta de Hindi) y Tiago Ferreira Lopes (ya contratado).

## 4. Lo que preguntará y aún no está

Decirlo como «lo siguiente», no esconderlo:

- **Traducción.** La ficha muestra la experiencia en el idioma del candidato
  (español o portugués). Está previsto traducirla automáticamente.
- **Publicar sus propias ofertas** desde el portal. Hoy las publicamos
  nosotros por ellos.
- **Avisos por correo** a los dos lados cuando llega un mensaje.

## 5. Si algo falla

- **Pantalla de error o datos raros:** `pnpm demo:setup` y volver a entrar
  con las dos cuentas.
- **Puerto ocupado:** `lsof -ti tcp:3210 | xargs kill` y arrancar otra vez.
- **Docker caído:** arrancar Docker u OrbStack, luego `pnpm db:start`.
- **Plan B:** grabar hoy un vídeo del recorrido entero (QuickTime →
  Nueva grabación de pantalla) y llevarlo en el portátil.

Al acabar: `pnpm db:stop`.
