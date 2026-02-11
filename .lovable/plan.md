

# Agregar Peleadores a Gimnasios desde el Modulo de Gimnasios

## Resumen

Crear un modal de busqueda y asignacion de peleadores que se abre directamente desde cada tarjeta de gimnasio en el panel de admin. El patron ya existe en `EnrollFighterModal` (usado en Rankings) y se reutilizara la misma estructura visual: buscador de texto, lista scrollable de peleadores con avatar, seleccion y confirmacion.

---

## Cambios a Implementar

### 1. Nuevo componente: `AssignFighterToGymModal`

Archivo: `src/components/admin/AssignFighterToGymModal.tsx`

Un dialog que recibe el `gymId` y `gymName`, y permite:
- Buscar peleadores por nombre/apodo con un input de texto
- Mostrar lista filtrada con avatar, nombre, apodo, peso (misma estructura que `EnrollFighterModal`)
- Seleccionar un peleador (highlight + check)
- Opcionalmente asignar un entrenador del staff del gimnasio
- Boton "Vincular" que llama a `useAddMembership`
- Si el peleador ya tiene gimnasio activo, mostrar advertencia y ofrecer "Transferir" en vez de "Vincular"

Usa hooks existentes:
- `useAdminFighters` para la lista completa de peleadores
- `useAddMembership` y `useTransferFighter` de `@/hooks/gyms`
- `useGymStaff` para listar entrenadores disponibles del gimnasio

### 2. Modificar `AdminGymCard` para agregar boton "Agregar Peleador"

Archivo: `src/components/admin/AdminGymCard.tsx`

- Agregar un boton con icono `UserPlus` en la fila de acciones existente (junto a Dashboard, Editar, Eliminar)
- Al hacer click abre el `AssignFighterToGymModal` pasando `gym.id` y `gym.nombre`

### 3. Agregar conteo de peleadores en `AdminGymCard`

- Ademas del badge de staff count existente, agregar un segundo badge mostrando la cantidad de peleadores activos (query a `fighter_gym_memberships` filtrado por `gym_id` y `status = 'ACTIVE'`)

---

## Archivos a Crear/Modificar

| Archivo | Accion |
|---------|--------|
| `src/components/admin/AssignFighterToGymModal.tsx` | Nuevo - Modal de busqueda y asignacion |
| `src/components/admin/AdminGymCard.tsx` | Agregar boton "Agregar Peleador" + badge de fighter count |

---

## Detalles Tecnicos

### AssignFighterToGymModal - Estructura

```typescript
interface Props {
  open: boolean;
  onClose: () => void;
  gymId: string;
  gymName: string;
}
```

Flujo interno:
1. Carga `useAdminFighters()` para tener la lista completa
2. Filtra client-side por texto de busqueda (nombre, apellido, apodo)
3. Al seleccionar un peleador, consulta `useGymMembership(fighterId)` para ver si ya tiene gimnasio
4. Si no tiene: boton "Vincular" con `useAddMembership`
5. Si ya tiene: muestra nombre del gimnasio actual y boton "Transferir" con `useTransferFighter`
6. Selector opcional de entrenador usando `useGymStaff(gymId)`

### AdminGymCard - Cambios

Agregar query de fighter count:
```typescript
const { data: fighterCount } = useQuery({
  queryKey: ['gym-fighter-count', gym.id],
  queryFn: async () => {
    const { count } = await supabase
      .from('fighter_gym_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gym.id)
      .eq('status', 'ACTIVE');
    return count || 0;
  },
});
```

Agregar boton en la fila de acciones:
```typescript
<Button variant="outline" size="sm" onClick={() => setShowAssignModal(true)}>
  <UserPlus className="h-4 w-4" />
</Button>
```

