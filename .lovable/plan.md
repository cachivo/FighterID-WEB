# Arquitectura Multi-Módulo por Email

## Objetivo
Un solo correo electrónico (= 1 `auth.users` = 1 `app_user`) puede tener **simultáneamente** activos cualquier combinación de los 4 módulos: **Peleador, Entrenador, Gimnasio (Owner), Juez/Oficial**. Ningún módulo debe bloquear ni requerir re-registro para activar otro.

## Estado actual
- `ProfileHub` ya muestra los 4 módulos con su status independiente ✅
- `app_user` ya es único por `auth_user_id` ✅
- `user_roles` ya permite múltiples roles por usuario ✅
- **Pero** hay inconsistencias que rompen el modelo multi-módulo:
  1. `JudgeOnboarding` usa `judges.user_id = auth.uid()` (incorrecto — debe ser `app_user.id`) y redirige fuera si ya existe registro.
  2. `GymOnboarding` crea `app_user` con `first_name=''` si no existe, sobrescribiendo identidad de un peleador previo (riesgo).
  3. `TrainerOnboarding` también crea `app_user` con datos en blanco si ya existe (insert sin upsert).
  4. Ningún flujo verifica si ya hay `app_user` previo creado por otro módulo para **reutilizar** identidad (nombre/apellido/teléfono) en vez de pedirla de nuevo.
  5. No existe una vista/función única que devuelva el estado multi-módulo del usuario — `ProfileHub` lo calcula con 4 queries sueltas y otras pantallas no comparten esa lógica.
  6. No hay rol asignado para "trainer independiente" (sin gym) ni para "fighter" — `user_roles` solo se inserta en gym/judge.

## Diseño propuesto

### 1. Modelo conceptual (sin cambios de tablas)
```
auth.users (1) ──► app_user (1) ──┬──► fighter_profiles  (módulo Peleador)
                                  ├──► gym_staff         (módulo Entrenador/Gym)
                                  ├──► gyms.owner_id     (módulo Gimnasio Owner)
                                  └──► judges            (módulo Juez)

user_roles: N filas (fighter, gym_owner, gym_coach, official_judge, …)
```
Reglas:
- `app_user` se crea **una sola vez** por email; los onboardings posteriores hacen `upsert` no destructivo (solo rellenan campos vacíos).
- Cada onboarding agrega su `user_roles` correspondiente sin tocar los demás.
- ProfileHub es el switcher universal entre módulos activos.

### 2. Hook único `useUserModules`
Nuevo hook (`src/hooks/useUserModules.ts`) que centraliza:
```ts
{
  appUser: { id, first_name, last_name, phone, … } | null,
  modules: {
    fighter:  { status: 'none'|'pending'|'active'|'suspended', profileId?, licenseStatus? },
    trainer:  { status, gymId? },
    gymOwner: { status, gymId? },
    judge:    { status, judgeId? },
  },
  loading, refetch
}
```
- Una sola query paralela; cacheada con React Query (`['user-modules', userId]`).
- Reemplaza la lógica embebida en `ProfileHub` y se reusa en cada onboarding para decidir si **prefill** datos en lugar de pedirlos.

### 3. Helper compartido `ensureAppUser(authUser, defaults?)`
Nuevo util (`src/lib/ensureAppUser.ts`):
- Busca `app_user` por `auth_user_id`.
- Si existe → devuelve el registro **sin sobrescribir**.
- Si no existe → lo crea con `defaults` (email, handle, nombre/apellido si vienen).
- Garantiza idempotencia y elimina la duplicación actual entre Gym/Trainer/Judge/License onboardings.

### 4. Cambios por flujo (aditivos, no rompen lo existente)

**LicenseOnboarding (Peleador)**
- Usa `useUserModules`: si ya hay `appUser`, prefill `firstName/lastName/phone` y permite editar.
- Solo crea fighter_profile + asigna rol `user` (fighter). No toca otros módulos.

**TrainerOnboarding (Entrenador)**
- Usa `ensureAppUser`; si ya existe con nombre, **salta el paso "perfil"** y va directo a "código de gimnasio".
- Asigna rol `gym_coach` (o `gym_assistant`) tras aprobación del gym.
- Permite continuar aunque ya exista fighter_profile o judge.

**GymOnboarding (Owner)**
- Usa `ensureAppUser` y NO sobrescribe `first_name=''` si ya hay datos.
- Asigna `gym_owner` además de cualquier rol previo.
- Permite registro aunque el usuario ya sea peleador/juez/entrenador.

**JudgeOnboarding (Juez)**
- **Fix**: usar `app_user.id` para `judges.user_id` (no `auth.uid()`), consistente con el resto del sistema y memoria del proyecto.
- Si ya existe `judges` activo → ir al panel de juez (no a `/`).
- Permite registro aunque ya tenga otros módulos.

**PostAuthRouter / ProfileSetup**
- Sin cambios estructurales. Sigue siendo "si no hay `app_user` → /profile/setup". Una vez creado por cualquier vía, no se vuelve a pedir.

**ProfileHub**
- Refactor para consumir `useUserModules` (menos código, sin duplicar lógica).
- Mantiene los 4 cards independientes con sus status.

### 5. RPC opcional (no bloqueante, mejora performance)
`get_my_user_modules()` security definer que devuelve el JSON de módulos en 1 round-trip. Si lo dejamos para una fase 2 está bien — el hook puede empezar con 4 queries paralelas.

## Archivos a modificar
- **Nuevo**: `src/hooks/useUserModules.ts`
- **Nuevo**: `src/lib/ensureAppUser.ts`
- **Editar**: `src/pages/profile/ProfileHub.tsx` (usar hook)
- **Editar**: `src/pages/license/LicenseOnboarding.tsx` (prefill, no bloquear)
- **Editar**: `src/pages/gym/TrainerOnboarding.tsx` (ensureAppUser, skip paso 1 si ya hay datos)
- **Editar**: `src/pages/gym/GymOnboarding.tsx` (ensureAppUser sin sobrescribir)
- **Editar**: `src/pages/judge/JudgeOnboarding.tsx` (usar `app_user.id`, no bloquear por otros módulos)

## Fuera de alcance
- Sin migraciones de base de datos en esta fase (el modelo ya soporta multi-módulo).
- Sin cambios al sistema de licencias ni al flujo de invitaciones de gym.
- Sin cambios al admin.

## Riesgos
- **Bajo**. Cambios son aditivos; cada módulo sigue funcionando aislado. El único fix con impacto es `JudgeOnboarding.user_id` que actualmente está mal asignado y probablemente ya causa lecturas inconsistentes en `ProfileHub` (que lee `judges` por `app_user.id`).
