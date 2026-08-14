'use server';

import { headers } from 'next/headers';
import type { AuthError } from '@supabase/supabase-js';

import { siteConfig } from '@/config/site';
import { SIGNUP_CONSENT_VERSION } from '@/config/legal';
import { getPathname, redirectAndStop } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import {
  checkbox,
  isEmail,
  isStrongEnough,
  text,
  type FieldErrors,
} from '@/lib/validation';

/**
 * Server Actions de autenticación.
 *
 * Todas devuelven CLAVES de traducción, nunca frases: el mensaje se compone en
 * el componente, que sabe el idioma (ADR-01).
 */

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

/**
 * Traducción de los códigos de error de Supabase Auth a claves de copy.
 *
 * Se mapea por `code` y no por el texto del mensaje: el texto es inglés fijo
 * del proveedor y cambia sin avisar.
 */
const ERROR_KEYS: Record<string, string> = {
  invalid_credentials: 'invalidCredentials',
  email_not_confirmed: 'emailNotConfirmed',
  user_already_exists: 'emailTaken',
  email_exists: 'emailTaken',
  weak_password: 'weakPassword',
  same_password: 'samePassword',
  over_email_send_rate_limit: 'emailRateLimit',
  over_request_rate_limit: 'tooManyRequests',
  otp_expired: 'linkExpired',
  validation_failed: 'invalidInput',
};

function errorKey(error: AuthError): string {
  if (error.code && ERROR_KEYS[error.code]) return ERROR_KEYS[error.code];
  if (error.status === 429) return 'tooManyRequests';
  return 'unexpected';
}

function assertLocale(value: string): Locale {
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale;
}

/**
 * URL absoluta a la que Supabase devuelve al usuario tras pulsar el enlace del
 * correo. Pasa por `/api/auth/callback`, fuera del árbol de idioma, porque el
 * canje del código toca cookies y no debe atravesar el proxy de i18n.
 */
function callbackUrl(locale: Locale, next: '/onboarding' | '/reset-password') {
  const target = getPathname({ href: next, locale });
  const url = new URL('/api/auth/callback', siteConfig.url);
  url.searchParams.set('next', target);
  return url.toString();
}

async function requestContext() {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');

  return {
    ip: forwarded?.split(',')[0]?.trim() || null,
    userAgent: headerList.get('user-agent'),
  };
}

// ---------------------------------------------------------------------------

export async function signUpAction(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const locale = assertLocale(text(form, 'locale'));
  const email = text(form, 'email').toLowerCase();
  const password = text(form, 'password');

  const fieldErrors: FieldErrors = {};
  if (!isEmail(email)) fieldErrors.email = 'emailInvalid';
  if (!isStrongEnough(password)) fieldErrors.password = 'passwordTooShort';
  if (!checkbox(form, 'acceptTerms')) fieldErrors.acceptTerms = 'required';
  if (!checkbox(form, 'acceptDataSharing')) {
    fieldErrors.acceptDataSharing = 'required';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: 'checkTheForm', fieldErrors };
  }

  const { ip, userAgent } = await requestContext();
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl(locale, '/onboarding'),
      // Los lee `app.handle_new_user` para escribir `consents` en el mismo acto
      // que crea la cuenta. `locale` decide el idioma del perfil.
      data: {
        locale,
        consent_version: SIGNUP_CONSENT_VERSION,
        consent_audio: checkbox(form, 'acceptAudio'),
        consent_ip: ip,
        consent_user_agent: userAgent,
      },
    },
  });

  if (error) return { ok: false, error: errorKey(error) };

  redirectAndStop({
    href: { pathname: '/check-email', query: { email } },
    locale,
  });
}

export async function signInAction(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const locale = assertLocale(text(form, 'locale'));
  const email = text(form, 'email').toLowerCase();
  const password = text(form, 'password');

  if (!email || !password) {
    return { ok: false, error: 'checkTheForm' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { ok: false, error: errorKey(error) };

  // A `/account` siempre: es esa página la que sabe el rol y reencamina. Así
  // el destino por rol se decide en un solo sitio (`lib/auth/roles.ts`).
  redirectAndStop({ href: '/account', locale });
}

export async function signOutAction(formData: FormData): Promise<void> {
  const locale = assertLocale(text(formData, 'locale'));

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirectAndStop({ href: '/', locale });
}

export async function resendConfirmationAction(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const locale = assertLocale(text(form, 'locale'));
  const email = text(form, 'email').toLowerCase();

  if (!isEmail(email)) {
    return {
      ok: false,
      error: 'checkTheForm',
      fieldErrors: { email: 'emailInvalid' },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: callbackUrl(locale, '/onboarding') },
  });

  if (error) return { ok: false, error: errorKey(error) };

  return { ok: true, message: 'confirmationResent' };
}

export async function requestPasswordResetAction(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const locale = assertLocale(text(form, 'locale'));
  const email = text(form, 'email').toLowerCase();

  if (!isEmail(email)) {
    return {
      ok: false,
      error: 'checkTheForm',
      fieldErrors: { email: 'emailInvalid' },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl(locale, '/reset-password'),
  });

  // Un 429 sí se cuenta: callar ahí haría creer que el correo va en camino
  // cuando el proveedor lo ha rechazado.
  if (error && error.status === 429) {
    return { ok: false, error: errorKey(error) };
  }

  // El resto de errores no se distinguen del éxito a propósito: responder
  // "ese correo no existe" convierte el formulario en un comprobador de
  // cuentas para cualquiera.
  return { ok: true, message: 'resetLinkSent' };
}

export async function updatePasswordAction(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const locale = assertLocale(text(form, 'locale'));
  const password = text(form, 'password');
  const confirmation = text(form, 'passwordConfirmation');

  const fieldErrors: FieldErrors = {};
  if (!isStrongEnough(password)) fieldErrors.password = 'passwordTooShort';
  if (password !== confirmation) {
    fieldErrors.passwordConfirmation = 'passwordsDoNotMatch';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: 'checkTheForm', fieldErrors };
  }

  const supabase = await createClient();

  // Sin sesión no hay nada que cambiar: el enlace ha caducado o ya se usó.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'linkExpired' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: errorKey(error) };

  redirectAndStop({ href: '/account', locale });
}
