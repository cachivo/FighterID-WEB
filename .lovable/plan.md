

# Fix urgente: pestañas admin no muestran perfiles + soporte para pendientes

## Diagnóstico

Tras la migración de `moderation_status`, los hooks que alimentan los paneles admin filtran por `moderation_status = 'approved'` en el cliente, **sin excepción para administradores**. Resultado:

- Cualquier perfil/gimnasio/evento creado vía formulario público queda en `pending` y **desaparece del panel admin** (solo aparece en la nueva Cola de Aprobación).
- Hoy todos los datos existentes están `approved` (77 peleadores, 29 gimnasios, 1 evento), así que técnicamente se ven, pero apenas creen un perfil nuevo durante el demo, **no aparecerá en la pantalla principal del admin**.
- Esto rompe el flujo de demo: crearán perfiles, los admins no los verán en sus pantallas habituales y parecerá que el sistema "no carga".

El RLS ya está bien (admin ve todo). El bug está en los **filtros del cliente**.

## Solución

Los hooks admin deben pasar una bandera `includeUnapproved` que omita el filtro `moderation_status` cuando se llama desde un contexto admin. Los hooks públicos siguen igual (filtran solo `approved`).

### Cambios

| Archivo | Cambio |
|---|---|
| `src/hooks/useAdminFighters.tsx` | Pasar `includeUnapproved: true` a `useFightersQuery` |
| `src/hooks/useGyms.tsx` | Agregar parámetro opcional `includeUnapproved` a `useGyms()`. Por defecto `false` (público filtra). Cuando `true`, omite `.eq('moderation_status', 'approved')` |
| `src/pages/admin/GimnasiosAdmin.tsx` | Llamar `useGyms(discipline, { includeUnapproved: true })` |
| `src/hooks/useGymsList.ts` | Mismo patrón: parámetro `includeUnapproved` opcional |
| `src/hooks/useGymsWithFighters.ts` | Mismo patrón |

Eventos (`useEvents`) **no necesita cambios**: no filtra por moderation en cliente y el RLS ya da acceso a admin.

### Indicador visual de pendientes en paneles admin

Para que durante el demo sea claro qué perfiles están pendientes vs aprobados:

- En `FightersProfiles.tsx`, `GimnasiosAdmin.tsx` y `EventosPelea.tsx`: agregar un `Badge` de estado (Pendiente / Aprobado / Rechazado) en cada card cuando `moderation_status !== 'approved'`.
- Color: amarillo para `pending`, rojo para `rejected`, sin badge para `approved`.

### Filtro adicional (opcional pero útil para el demo)

En cada panel admin, agregar un `Select` para filtrar por estado de moderación:
- Todos (por defecto)
- Solo aprobados
- Solo pendientes
- Solo rechazados

## Lo que NO se toca

- **RLS**: ya funciona correctamente, admin ve todo.
- **Cola de Aprobación** (`/admin/cola-aprobacion`): sigue siendo el punto centralizado para aprobar/rechazar.
- **Filtros públicos** (`useFightersQuery` por defecto, `useGyms` por defecto): siguen mostrando solo aprobados.
- **`useEvents`**: ya funciona para admin sin cambios.

## Resultado esperado

1. Las pestañas admin de Peleadores y Gimnasios muestran TODOS los registros (aprobados + pendientes + rechazados).
2. Cada card pendiente lleva un badge amarillo claro indicando "Pendiente de aprobación".
3. Durante el demo, cuando un usuario cree un perfil, aparecerá inmediatamente en el panel admin marcado como pendiente, y simultáneamente en la Cola de Aprobación para aprobar con un click.
4. La web pública sigue mostrando solo perfiles aprobados (no se filtra contenido sin moderar).

## Archivos afectados

- `src/hooks/useAdminFighters.tsx`
- `src/hooks/useGyms.tsx`
- `src/hooks/useGymsList.ts`
- `src/hooks/useGymsWithFighters.ts`
- `src/pages/admin/FightersProfiles.tsx`
- `src/pages/admin/GimnasiosAdmin.tsx`
- `src/pages/admin/EventosPelea.tsx`

