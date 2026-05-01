# System Polish — Round 1: Seguridad real + arreglos arquitectónicos

Filtré los 14 puntos del audit. Ataco los **arreglos reales y de alto valor** + auditoría RLS profunda (que es lo único realmente crítico, porque la anon key publishable es pública por diseño).

---

## Parte A — Seguridad RLS (CRÍTICO, lo único urgente del audit)

El scan encontró **291 hallazgos** (gran parte ruido del linter), pero **8 errores críticos reales** de RLS que sí permiten ataques. Estos son los que arreglo en migraciones SQL:

### A1. `fighter_profiles` expone datos médicos al público
Policy actual `Anonymous can view basic fighter info` (`USING active = true`) deja leer `medical_conditions`, `medical_allergies`, `blood_type`, `birthdate`, `document_number`, `document_image_url`, `emergency_contact_*`, `insurance_*` a cualquier visitante anónimo. Confirmado con datos reales (ej. "Bipolaridad afectiva").

**Fix**: Crear vista `public.fighter_profiles_public` con `security_invoker=on` que solo expone campos no-sensibles (id, names, nickname, avatar, weight_class, level, records, gym_id). Reemplazar el policy anónimo por `USING (false)` en las columnas sensibles via revoke + nueva policy auth-only para owner/admin. Migrar todas las queries públicas a la vista.

### A2. `fights` permite write sin ownership
Policies INSERT/UPDATE/DELETE con `USING true` para cualquier authenticated. Cualquier usuario logueado puede inventar peleas, sobrescribir resultados, borrar registros.

**Fix**: Restringir INSERT/UPDATE/DELETE a `has_role(auth.uid(),'admin')` OR `has_role(auth.uid(),'super_admin')` OR `event_id IN (SELECT id FROM bdg_event WHERE created_by = auth.uid())`.

### A3. `license_verification_tokens` enumeración pública
SELECT con `USING true` permite a anónimos enumerar todos los tokens y suplantar verificaciones de licencia.

**Fix**: Eliminar el policy público. Crear edge function `verify-license-token` que recibe el token, valida server-side y devuelve solo el resultado (válida/inválida + datos públicos del fighter).

### A4. `bet_delay_queue` manipulable por cualquier user
Policy `auth.uid() IS NOT NULL` para ALL operations. Cualquier authenticated borra/modifica settlements pendientes.

**Fix**: Restringir ALL ops a `has_role(auth.uid(),'admin')` o service_role solamente.

### A5. `judges` / `officials` exponen email + teléfono + document_id
Policies públicas o authenticated leen contactos privados de oficiales.

**Fix**: Crear vistas `judges_public` / `officials_public` (solo nombre, certificación, foto). Restringir tabla base a admin o self.

### A6. `coaches` y `gyms` exponen email/telefono/whatsapp públicamente
Mismo patrón que A5 pero con severidad warn.

**Fix**: Vistas públicas sin contacto. Contacto solo para auth users con relación legítima (ej. fighter con membresía en ese gym).

### A7. `post_comments` UPDATE sin ownership check
Policy verifica que existe app_user pero no que `user_id = post_comments.user_id`. Cualquier user reescribe comentarios de otros.

**Fix**: Cambiar `USING` a `app_user.id = post_comments.user_id AND app_user.auth_user_id = auth.uid()`.

### A8. `station_rate_limits` borrable por anónimos (rate limit bypass)
Policy `ALL USING true` para anon. Atacante bloqueado por intentos de PIN borra su registro y reanuda brute-force.

**Fix**: Anon solo puede INSERT. UPDATE/DELETE solo service_role.

### A9. Telemetry session tokens públicos (`fight_telemetry_sessions`, `vision_sync_sessions`)
Tokens leíbles por cualquiera, permiten inyectar telemetría falsa.

**Fix**: Restringir SELECT del campo `session_token` a service_role. Crear vistas sin el token para reads públicos.

### A10. Realtime channels sin authorization
`realtime.messages` sin RLS — cualquier authenticated se suscribe a `fighter_licenses`, `doping_tests`, `audit_log`, `notifications`.

**Fix**: Agregar RLS a `realtime.messages` scopeada por topic + auth.uid().

### A11. `configuracion_sitio`, `servicios`, `testimonios`, `partners` writables por todos
Policies `WITH CHECK true` para authenticated.

**Fix**: Restringir write a `has_role(auth.uid(),'admin')`.

### A12. `station_access_log` writable por anon con PIN en claro
PINs intentados se loggean sin sanitización; anon puede flood el log.

**Fix**: INSERT solo via edge function con service_role; hashear `pin_attempted` antes de guardar.

---

## Parte B — Arreglos arquitectónicos reales

### B1. Refactor `App.tsx`: extraer `<AdminDisciplineRoutes />`
Las rutas `/admin/mma` y `/admin/boxeo` son copy-paste idénticos (~35 líneas duplicadas).

**Fix**: Crear `src/routes/AdminDisciplineRoutes.tsx` que recibe `discipline: 'MMA'|'Boxeo'` y renderiza el bloque `<Route>...children</Route>`. Reduce ~70 líneas en App.tsx.

### B2. Limpiar lockfiles duplicados
`bun.lock` + `bun.lockb` + `package-lock.json` coexisten. Lovable usa Bun.

**Fix**: Borrar `package-lock.json` y `bun.lockb` (legacy binary). Mantener solo `bun.lock`.

### B3. `package.json` identity
Cambiar `"name": "vite_react_shadcn_ts"` → `"fighter-id"` y `"version": "0.0.0"` → `"1.0.0"`.

### B4. Quitar import React redundante en App.tsx
Línea 17: `import React from 'react';` no se usa (Vite SWC + JSX runtime). Borrar.

### B5. Mejorar global error handler
Actual silencia rejections con `event.preventDefault()` sin reportar.

**Fix**: Mantener `preventDefault` para evitar crash, pero loggear a tabla `client_error_log` (con RLS append-only) via edge function fire-and-forget. Toast genérico si error es de UI.

### B6. Vitest + tests base
No hay testing. Usuario confirmó en memory que el standard es Vitest + RTL.

**Fix**: Instalar `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`. Configurar `vitest.config.ts`. Añadir 3 tests seed:
- `src/system/events/event.logger.test.ts` — whitelist enforcement
- `src/lib/scoring-utils.test.ts` — cálculo puntos
- `src/lib/fighterDataFilter.test.ts` — filter sensitive fields

### B7. Validación de route params (zod)
Rutas `/fighter/:id`, `/evento/:eventId` no validan UUID.

**Fix**: Helper `useUuidParam(name)` que valida con `z.string().uuid()` y redirige a `/404` si inválido. Aplicar en `FighterProfile`, `EventDetail`, `LicenseDashboard`, `GymDashboard`, todas las páginas de station/judge.

---

## Parte C — Lo que NO toco y por qué

| Punto audit | Razón |
|---|---|
| #1 Anon key en .env / client.ts | Es publishable key, **diseñada** para ir al browser. Seguridad real está en RLS (Parte A). Rotarla no aporta nada. |
| #1 .env en git | Lovable gestiona el repo y `.env` solo contiene claves públicas. |
| #4 Bundle bloat (Radix, transformers) | Ronda separada — requiere análisis de bundle real con `rollup-plugin-visualizer`. No es seguridad. |
| #5 Lockfiles | Sí lo arreglo (B2). |
| #7 Commit messages | Lovable los autogenera. Fuera de scope. |
| #11 sw.js falta | Verificado: **sí existe** `public/sw.js` (lo vi). Falsa alarma. |
| #12 lovable-tagger | Necesario mientras estés en Lovable. |
| #13 AI Vision README | Es doc aspiracional, fuera de scope code. |
| #14 Provider nesting | 5 providers anidados es estándar React. Cosmético. |

---

## Detalle técnico — orden de ejecución

1. **Migración SQL** con todos los fixes A1–A12 (un solo migration file por atomicidad)
2. **Edge function** `verify-license-token` para reemplazar enumeración pública
3. **Vistas públicas** seguras (`fighter_profiles_public`, `judges_public`, `officials_public`, `coaches_public`, `gyms_public`)
4. **Refactor frontend**: actualizar todos los `from('fighter_profiles')` públicos → `from('fighter_profiles_public')`
5. **Refactor App.tsx** (B1, B4) + nuevo `AdminDisciplineRoutes.tsx`
6. **Cleanup** lockfiles + package.json (B2, B3)
7. **Vitest setup** + 3 tests seed (B6)
8. **`useUuidParam` hook** + aplicar en páginas (B7)
9. **Error logger** mejorado (B5)
10. **Update memory**: nueva entrada `mem://security/rls-hardening-round-1` + actualizar security-memory

## Archivos afectados (estimado)

**Nuevos**:
- `supabase/migrations/<ts>_rls_hardening_round1.sql`
- `supabase/functions/verify-license-token/index.ts`
- `src/routes/AdminDisciplineRoutes.tsx`
- `src/hooks/useUuidParam.ts`
- `vitest.config.ts`, `src/test/setup.ts`
- 3 archivos de test
- `mem://security/rls-hardening-round-1`

**Editados**:
- `src/App.tsx` (refactor rutas + import React + error handler)
- `package.json` (name, version, devDeps vitest)
- ~15 archivos de hooks/pages que consultan tablas afectadas (cambio de tabla → vista)
- `.gitignore` (sumar `bun.lockb` ya borrado)

**Borrados**:
- `package-lock.json`
- `bun.lockb`
