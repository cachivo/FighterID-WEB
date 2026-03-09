

## Audit: Password Reset Flow

### Current Status

The password reset flow has **two issues** that could prevent users from resetting:

**1. Error handling bug in both auth hooks**

When the edge function returns a 429 (rate limit) or 500, `supabase.functions.invoke` sets `error` to a generic `FunctionsHttpError` with message "Edge Function returned a non-2xx status code". The actual JSON body (with `retryAfter`, actual error message) is lost.

Both `useAuth.resetPassword` and `useLicenseAuth.resetPassword` do:
```tsx
const { data, error } = await supabase.functions.invoke('send-password-recovery', ...);
if (error) return { error: { message: error.message } }; // Generic message, loses details
```

The ForgotPassword pages then check `error.message.includes("Demasiados intentos")` — this will never match because the message is always generic.

**2. Edge function has no recent logs** — likely deployed but untested recently. The function itself looks correct, but the error response path (429) returns a non-2xx status which triggers the bug above.

### Routes and pages — all correct

| Entry point | ForgotPassword page | ResetPassword page | Edge function redirect |
|---|---|---|---|
| `/auth/forgot-password` | `useAuth.resetPassword` → `/auth/reset-password` | Handles tokens correctly | `SITE_URL/auth/reset-password` |
| `/license/forgot-password` | `useLicenseAuth.resetPassword` → `/license/reset-password` | Handles tokens correctly | `SITE_URL/license/reset-password` |

### Fix

**`src/hooks/useAuth.tsx` — `resetPassword` method**
- After `supabase.functions.invoke`, check if `error` exists and try to parse the response body for the actual error message and `retryAfter` value
- Use `error.context?.json()` or handle the FunctionsHttpError properly

**`src/hooks/useLicenseAuth.tsx` — `resetPassword` method**
- Same fix as above

**Both fixes follow this pattern:**
```tsx
const resetPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-password-recovery', {
      body: { email, redirectTo: `${window.location.origin}/auth/reset-password` }
    });

    if (error) {
      // Try to extract actual error body from FunctionsHttpError
      let errorMessage = 'Error al procesar la solicitud';
      let retryAfter: number | undefined;
      try {
        const errorBody = await error.context.json();
        errorMessage = errorBody.error || errorMessage;
        retryAfter = errorBody.retryAfter;
      } catch {}
      return { error: { message: errorMessage, retryAfter } };
    }

    // data may contain error even on 200 (shouldn't, but defensive)
    if (data?.error) {
      return { error: { message: data.error } };
    }

    return { error: null };
  } catch (e: any) {
    return { error: { message: 'Error de conexión. Intenta de nuevo.' } };
  }
};
```

### Files to change

| File | Change |
|---|---|
| `src/hooks/useAuth.tsx` | Fix `resetPassword` to properly parse edge function error responses |
| `src/hooks/useLicenseAuth.tsx` | Same fix for `resetPassword` |

### Impact

- Rate limit messages will now display correctly ("Demasiados intentos...")
- Cooldown timer will work properly with the `retryAfter` value
- Normal password reset flow (200 responses) is unaffected
- Both `/auth` and `/license` users can reset passwords with proper feedback

