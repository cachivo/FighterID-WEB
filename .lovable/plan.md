## Goal
Make `/auth` reliable for existing accounts like `cachivo@gmail.com`: login and account creation should be clearly separated, and the form must not stay loading after entering a password.

## Plan
1. **Separate login and signup modes in `/auth`**
   - Add clear “Iniciar sesión” and “Crear cuenta” choices instead of relying only on automatic email detection.
   - Respect URL params like `?mode=signin` and `?mode=signup` so buttons from the landing page open the correct flow.
   - Keep email lookup as a helper, but do not let a failed lookup silently send an existing user into signup.

2. **Fix stuck loading on password submit**
   - Add a timeout-safe wrapper around the sign-in submit so the local button loading state always resets if Supabase/network stalls.
   - Disable duplicate submits while a login is in progress.
   - Show a clear error/toast if login takes too long instead of spinning forever.

3. **Improve existing-account handling**
   - For `cachivo@gmail.com`, ensure the screen remains in login mode when the account exists.
   - If credentials are wrong, show “Credenciales incorrectas” and offer password recovery.
   - If the email check fails due to network/CORS, show an error and let the user choose login manually instead of defaulting to registration.

4. **Remove auth route confusion**
   - Align `/license/auth` redirects and forgot-password links to the unified `/auth` flow where appropriate.
   - Fix the resend confirmation redirect currently pointing back to `/license/auth` from the shared auth hook.

## Technical details
- Update `src/pages/Auth.tsx` to support explicit auth mode state and safer submit handling.
- Update `src/hooks/useAuth.tsx` to use `/auth/callback` consistently for confirmation resend and add a timeout guard for `signIn` if needed.
- Keep database/auth schema unchanged; this is a frontend/auth-flow fix only.