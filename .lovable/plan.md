# Diagnóstico — "Los usuarios no pueden iniciar sesión"

## Lo que revisé

- `auth_logs` últimos 30 eventos (Supabase)
- `src/hooks/useAuth.tsx` (`signIn` → `supabase.auth.signInWithPassword`)
- `src/pages/Auth.tsx` (`handleSignIn`, `handleResendEmail`, `checkEmailExists`)
- `supabase/functions/check-email-exists/index.ts`
- Migraciones recientes (audit trail de récord, `save_fight_result`, índice único de `tm_verdict`) — **ninguna toca auth/RLS de login**

## Lo que NO está roto

- No hay errores `/token` (login) en los logs de auth.
- El último signup terminó **200 OK** y el correo de confirmación se envió correctamente (Resend id `d777c2bf…`, hook `send-signup-confirmation` OK).
- El cliente Supabase, `AuthProvider`, y `signInWithPassword` funcionan normal.
- Las migraciones del historial de récord (`get_fighter_record_history`, índice único en `tm_verdict`) no afectan login.

## Causa real del síntoma

El único error real en logs es:

```
POST /resend  →  429  over_email_send_rate_limit
"For security purposes, you can only request this after 46 seconds."
```

Es decir: el usuario `migulalbertogonzalesmena934@gmail.com` se registró, **no confirmó el correo**, intentó re-enviar la confirmación, y chocó con el rate limit de Supabase Auth. Sin confirmar, no puede iniciar sesión.

Hay además **3 problemas UX en `src/pages/Auth.tsx`** que hacen que el usuario perciba "no puedo entrar" sin saber por qué:

1. **`handleSignIn` solo distingue "Invalid login credentials"**. Si Supabase devuelve `email_not_confirmed`, se muestra el mensaje crudo en inglés en un `toast.error`, y el usuario no ve ningún CTA para reenviar el correo desde la pantalla de login.
2. **El bloque "Reenviar correo" solo aparece tras un signup nuevo en la misma sesión** (depende de `registrationSuccess` + `registeredEmail`). Si el usuario vuelve al día siguiente e intenta login, no tiene cómo reenviar.
3. **`checkEmailExists` devuelve `true` también para usuarios no confirmados**, entonces el flujo los manda al paso `login` (no a `register`), donde fallan silenciosamente con "Credenciales incorrectas" si escriben mal o con un mensaje confuso si Supabase responde `email_not_confirmed`.

## Plan de corrección (cuando apruebes pasar a build)

### 1. `src/hooks/useAuth.tsx` — propagar tipo de error
- En `signIn`, además del `error`, devolver `errorCode: 'email_not_confirmed' | 'invalid_credentials' | 'other'` basado en `error.code` / `error.message` de Supabase.

### 2. `src/pages/Auth.tsx` — manejo claro de "email no confirmado"
- En `handleSignIn`, si `errorCode === 'email_not_confirmed'`:
  - `toast.warning('Tu correo aún no está confirmado. Te enviamos el enlace de nuevo.')`
  - Setear `registeredEmail = email` y `registrationSuccess = true` para que se muestre el bloque "Reenviar correo".
  - Si `resendCooldown === 0`, disparar `handleResendEmail()` automáticamente.
- Traducir mensajes comunes al español (`Email not confirmed`, `Invalid login credentials`, `Too many requests`).

### 3. Cooldown coordinado con el rate limit real de Supabase (60s)
- Hoy `setResendCooldown(60)` ya existe; añadir un guard que, si la respuesta es `over_email_send_rate_limit`, leer `retryAfter` (ya viene en `useAuth.resetPassword`, replicar en `resendConfirmation`) y respetarlo.

### 4. (Opcional) `check-email-exists` — devolver `confirmed`
- Extender la RPC `check_email_exists_fn` para devolver `{ exists, confirmed }` (lee `email_confirmed_at`). Así `Auth.tsx` puede mostrar directamente la pantalla de "reenviar confirmación" sin esperar a que falle el login.

## Acciones inmediatas para el usuario afectado (sin código)

Puedo hacerlas yo desde Supabase si me confirmas:

1. **Confirmar manualmente el email** del usuario `migulalbertogonzalesmena934@gmail.com` (UPDATE `auth.users.email_confirmed_at = now()`).
2. O **eliminar el usuario** para que pueda volver a registrarse limpio.

## Fuera de alcance

- Cambios en el sistema de historial de récord recién creado.
- Cambios en políticas RLS, OAuth de Google, o flujo PKCE (todo funciona).
- Tocar `auth.users` o esquemas reservados de Supabase fuera de las acciones puntuales de arriba.

## Pregunta para ti

¿Quieres que (a) **solo arregle el UX** para que ningún usuario quede atrapado en este estado en el futuro, (b) **además confirme manualmente** al usuario afectado, o (c) **ambas**?
