

## Fix: AuthCallback no-session redirect

**Problem**: Lines 44-52 assume a role from `localStorage` when no session exists after email confirmation. This fails cross-device and can route users to the wrong onboarding.

**Solution**: When `type === 'signup'` or `type === 'email'` but no session, redirect to `/auth` so the user can log in and select their module.

### Change in `src/pages/AuthCallback.tsx` (lines 44-52)

Replace the localStorage-based routing with a redirect to `/auth`:

```tsx
if (!session) {
  if (type === 'signup' || type === 'email') {
    setStatus('success');
    setMessage('¡Email confirmado exitosamente! Inicia sesión para continuar.');
    setTimeout(() => navigate('/auth', { replace: true }), 2000);
    return;
  }
  throw new Error('No se pudo establecer la sesión');
}
```

This removes the `localStorage` dependency entirely for the no-session path. The user will land on `/auth`, log in, and `determineUserDestination()` will handle routing using Supabase metadata and DB roles.

**1 file, 3 lines changed.**

