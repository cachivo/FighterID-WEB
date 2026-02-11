

# Restriccion de Acceso + Asignacion de Administrador de Gimnasio

## Estado Actual

- `cachivo@gmail.com` ya tiene rol `super_admin` en `user_roles` (unico usuario con este rol)
- El panel admin esta protegido por `AdminProtectedRoute` que verifica rol `admin` (6 usuarios lo tienen)
- `gym_staff` tiene roles OWNER, HEAD_COACH, ASSISTANT_COACH pero NO tiene restriccion de un solo OWNER por gimnasio
- `useMyGymStaff` ya detecta staff activo y muestra "Mi Gimnasio" en el Header
- `GymDashboard` ya verifica permisos via `useGymStaffRole` (OWNER/HEAD_COACH pueden gestionar peleadores)

## Cambios Necesarios

### 1. Migracion SQL: Un solo OWNER por gimnasio

Crear indice parcial unico que impida mas de un OWNER activo por gimnasio:

```text
CREATE UNIQUE INDEX unique_active_gym_owner 
ON gym_staff (gym_id) 
WHERE role = 'OWNER' AND active = true;
```

Esto garantiza a nivel de base de datos que solo puede existir un administrador activo por gimnasio.

### 2. Restringir edicion de gimnasios a super_admin

**Archivo: `src/pages/admin/GimnasiosAdmin.tsx`**

Agregar `useSuperAdmin()` hook. Si el usuario NO es super_admin:
- Ocultar boton "Crear Gimnasio"
- Las tarjetas de gimnasio mostraran solo informacion (sin botones de editar/eliminar/asignar)

**Archivo: `src/components/admin/AdminGymCard.tsx`**

Agregar prop `readOnly?: boolean`. Cuando es `true`, ocultar los botones de edicion, eliminacion y asignacion de peleadores. Solo mostrar el boton "Dashboard" para navegar.

### 3. Funcionalidad "Asignar Administrador de Gimnasio"

**Archivo: `src/components/admin/AdminGymCard.tsx`**

Agregar boton "Asignar Admin" (icono Crown) junto a los botones existentes, visible solo cuando `readOnly` es `false`.

**Nuevo archivo: `src/components/admin/AssignGymOwnerModal.tsx`**

Modal que permite buscar perfiles de Fighter ID y asignar como OWNER del gimnasio:

- Campo de busqueda que consulta `app_user` (nombre, email)
- Muestra si el usuario ya tiene perfil de peleador (consulta `fighter_profiles`)
- Muestra si ya es staff de otro gimnasio (consulta `gym_staff`)
- Al seleccionar: inserta en `gym_staff` con role = 'OWNER'
- Si el gimnasio ya tiene OWNER activo, muestra advertencia y permite reemplazar (desactiva el anterior)
- Invalida cache de `gym-staff`, `gym-dashboard`, `my-gym-staff`

Flujo del modal:
```text
1. Admin busca usuario por nombre o email
2. Lista muestra: avatar, nombre, email, badge "Peleador" si tiene fighter_profiles
3. Admin selecciona usuario
4. Sistema verifica: ya hay OWNER activo en este gimnasio?
   SI -> Confirmar reemplazo (desactivar anterior)
   NO -> Insertar directamente
5. Resultado: usuario ahora ve "Mi Gimnasio" en su celular
```

### 4. Permisos de eliminacion de peleadores para HEAD_COACH

**Archivo: `src/pages/gym/GymFighters.tsx`**

Verificar que HEAD_COACH pueda eliminar (desvincular) peleadores del gimnasio. Actualmente `canManageFighters` ya incluye HEAD_COACH, asi que solo hay que asegurar que el boton de remover este visible.

### 5. Dashboard visible en pagina principal movil

Ya implementado: `useMyGymStaff()` en el Header detecta al usuario como staff activo y muestra el enlace "Mi Gimnasio" que lleva a `/gym/{gymId}/dashboard`. No se requieren cambios adicionales.

---

## Resumen de Archivos

| Archivo | Accion |
|---------|--------|
| Migracion SQL | Indice unico parcial: un OWNER activo por gimnasio |
| `src/pages/admin/GimnasiosAdmin.tsx` | Verificar super_admin para mostrar/ocultar acciones de edicion |
| `src/components/admin/AdminGymCard.tsx` | Agregar prop `readOnly`, agregar boton "Asignar Admin" |
| `src/components/admin/AssignGymOwnerModal.tsx` | **Nuevo** - Modal para buscar y asignar OWNER |

## Lo que NO se modifica (ya funciona)

- Header con "Mi Gimnasio" condicional (ya implementado)
- GymDashboard con permisos por rol (ya implementado)
- HEAD_COACH con capacidad de gestionar peleadores (ya implementado)
- No se duplican roles en `app_role` (gym_staff es la unica fuente de verdad)
