## Diagnóstico

De 77 perfiles, solo **3** tienen inconsistencia entre `fighter_profiles.license_status` y la licencia real:

| Perfil | Problema |
|---|---|
| `dcde47b4…` (Boxeo) | Perfil dice `active`, licencia primaria está `PENDING_REVIEW` |
| `fb24308d…` (Boxeo) | Igual |
| `82bb63ea…` Miguel Á. Calderón (`angelmonse777@gmail.com`, MMA, `FGT-2025-039`) | Perfil dice `active` desde Oct 2025, número de licencia asignado en el perfil, pero **no existe fila** en `fighter_licenses` |

Causas raíz:
1. `fighter_licenses` y `fighter_profiles.license_status` se actualizan en lugares distintos sin trigger que los sincronice → derivan.
2. La UI (`ProfileHub`, `useLicenseAuth`) mira a veces el perfil y a veces la licencia, así que un usuario con licencia `PENDING_REVIEW` puede ver "Solicitar licencia" en vez de "Pendiente de revisión".

## Cambios

### 1. Migración de datos (one-shot)

- Para los 2 perfiles `dcde47b4` y `fb24308d`: bajar `fighter_profiles.license_status` de `active` → `pending` para que coincida con su licencia `PENDING_REVIEW`. (No tocan número de licencia ni `primary_license_id`.)
- Para `82bb63ea` (Miguel Á. Calderón): **crear** fila en `fighter_licenses` con:
  - `fighter_id` = `82bb63ea…`
  - `license_number` = `FGT-2025-039` (el que ya tenía en el perfil)
  - `discipline` = `MMA`
  - `status` = `ACTIVE`
  - `is_primary` = `true`
  - `issued_at` = `created_at` del perfil (2025-10-02)
  - `expires_at` = `issued_at + 1 año`
  - `notes` = `'Reconciliación de auditoría 2026-06-07'`
  
  Luego: `UPDATE fighter_profiles SET primary_license_id = <nueva licencia>` para `82bb63ea`.

### 2. Trigger de consistencia permanente

Crear función `sync_fighter_profile_license()` + trigger `AFTER INSERT/UPDATE/DELETE ON fighter_licenses` que para cada `fighter_id` afectado:

1. Encuentra la mejor licencia (prioriza `is_primary=true`, luego `ACTIVE > PENDING_REVIEW > SUSPENDED > REVOKED`, luego más reciente).
2. Actualiza `fighter_profiles.primary_license_id` = id de esa licencia (o `NULL`).
3. Actualiza `fighter_profiles.license_status` siguiendo este mapeo:
   - `ACTIVE` → `'active'`
   - `PENDING_REVIEW` / `APPLIED` → `'pending'`
   - `SUSPENDED` → `'suspended'`
   - `REVOKED` / `EXPIRED` / `NULL` → `'expired'` (o `NULL` si no hay licencia)
4. Sincroniza `license_number` desde la licencia primaria.

Esto evita que vuelvan a derivar en el futuro. Idempotente: si los valores ya coinciden, no escribe.

### 3. UI: respetar el estado real

- **`src/pages/profile/ProfileHub.tsx`**: el switch que decide `fighterStatus` ya mapea `PENDING_REVIEW`→pending, pero la ruta para `pending` actualmente lleva a `/license/pending` solo si hay licencia. Si la licencia existe en cualquier estado (`PENDING_REVIEW`, `APPLIED`, `SUSPENDED`) no debe ofrecer "/license/onboarding" (re-solicitar). Ajustar la lógica para que únicamente vaya a `onboarding` cuando **no** existe fila en `fighter_licenses`.
- **`src/hooks/useLicenseAuth.tsx`** (líneas 129-181, bloque `no_license` con profile que tiene `primary_license_id`): hoy construye una "minimal license data" con `status: 'ACTIVE'` aunque la licencia real esté `PENDING_REVIEW` — lo cual es engañoso. Cambiar para que use el `status` real consultado en la `fighter_licenses` directa; si no es `ACTIVE`, marcar `hasActiveLicense=false` y redirigir según el status (pending → `/license/pending`, suspended → `/license/suspended`). Eliminar el shortcut "ACTIVE forzado".

### 4. Verificación final

Después de migración + trigger:
- Re-correr el query de auditoría; debe devolver **0 filas inconsistentes**.
- Verificar que `useLicenseAuth` para Miguel Á. Calderón reporta `active_license` y para los 2 boxeadores reporta `pending_license`.

## Detalles técnicos

- Cambios de datos van en `supabase--insert` (los UPDATE + INSERT). El trigger y la función van en `supabase--migration`.
- Trigger se llama con `AFTER` para evitar recursión; agregar guarda `WHEN (pg_trigger_depth() = 0)` o usar `SET LOCAL` para prevenir loop si el UPDATE en `fighter_profiles` dispara otros triggers.
- No tocamos `check_user_license_status` RPC; sigue funcionando porque ahora `primary_license_id` y `license_status` siempre serán coherentes.
- Sin cambios de schema en columnas existentes, solo función + trigger nuevos.

## Fuera de alcance

- No se re-emiten licencias para los 2 boxeadores pendientes (siguen en cola de aprobación admin).
- No se modifica el flujo de aprobación admin existente.
- No se cambian RLS.
