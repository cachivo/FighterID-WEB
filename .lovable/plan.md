
# Correccion de Logica de Redireccion Post-Login por Modulo Seleccionado

## Problema Identificado

Actualmente, cuando un usuario inicia sesion, el sistema usa una logica de **prioridad de roles** que ignora completamente la seleccion que hizo en la pantalla inicial:

```
1. Si tiene rol admin/super_admin → SIEMPRE va a /admin/dashboard
2. Si tiene rol gym_owner/gym_coach → SIEMPRE va a gym dashboard
3. Si tiene rol judge → SIEMPRE va a /
4. Si no tiene roles especiales → verifica licencia de peleador
```

Esto significa que si `cachivo@gmail.com` (super_admin) selecciona "Gimnasio" en la pantalla de rol, el sistema lo ignora y lo manda a `/admin/dashboard`.

El valor de `localStorage('fighter_id_selected_role')` solo se lee cuando el usuario NO tiene `app_user` (usuario completamente nuevo). Para usuarios existentes con multiples roles, se ignora por completo.

## Solucion

Cambiar la logica en 2 archivos para que el **modulo seleccionado** tenga prioridad sobre los roles de la base de datos:

### Archivo 1: `src/pages/Auth.tsx` - funcion `routeAuthenticatedUser()`

Antes de verificar roles en la BD, leer `fighter_id_selected_role` de localStorage. Si existe un valor seleccionado, enrutar directamente al modulo correspondiente:

- `'admin'` → verificar que tenga rol admin, luego ir a `/admin/dashboard`
- `'gym'` → buscar su gym_staff, ir a `/gym/:id/dashboard` (o `/gimnasios` si no tiene gym)
- `'judge'` → ir a `/judge/onboarding` o dashboard de juez
- `'fighter'` → seguir el flujo de licencia (onboarding/pending/dashboard/suspended)

Si NO hay seleccion en localStorage (ej: el usuario uso "Ya tengo cuenta" sin pasar por el selector), entonces usar la logica actual de prioridad de roles como fallback.

### Archivo 2: `src/pages/AuthCallback.tsx` - funcion `determineUserDestination()`

Aplicar la misma logica: leer `fighter_id_selected_role` primero, enrutar por modulo seleccionado, y solo usar la prioridad de roles como fallback.

## Cambios Especificos

### `Auth.tsx` - `routeAuthenticatedUser()` (lineas 117-207)

Reestructurar la funcion:

```
1. Leer savedRole de localStorage
2. Leer roles de la BD (user_roles)
3. Si savedRole existe:
   - 'admin' → si tiene rol admin/super_admin → /admin/dashboard, sino → toast error
   - 'gym' → buscar gym_staff → /gym/:id/dashboard o /gimnasios
   - 'judge' → verificar licencia de juez o /judge/onboarding
   - 'fighter' → flujo de licencia (app_user → fighter_profile → license)
4. Si NO hay savedRole (login directo):
   - Usar logica de prioridad actual como fallback
5. Limpiar localStorage al final
```

### `AuthCallback.tsx` - `determineUserDestination()` (lineas 123-191)

Misma reestructuracion:

```
1. Leer savedRole de localStorage
2. Si savedRole existe, enrutar al modulo correspondiente
3. Si no, usar fallback de prioridad de roles
4. Limpiar localStorage
```

## Detalle Tecnico

- Se mantiene la validacion de permisos: si alguien selecciona "admin" pero no tiene el rol, se le niega acceso
- La seleccion de rol solo afecta la redireccion post-login, no los permisos de acceso a las rutas (los ProtectedRoute/AdminProtectedRoute siguen funcionando igual)
- Para el flujo de "Ya tengo cuenta" (sin seleccion de rol), se mantiene el comportamiento actual de prioridad

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Auth.tsx` | Reestructurar `routeAuthenticatedUser()` (~40 lineas) |
| `src/pages/AuthCallback.tsx` | Reestructurar `determineUserDestination()` (~30 lineas) |

**Total: 2 archivos, ~70 lineas de cambio**
