
# Plan: Sincronizar Cambios de Perfil con Gestión de Rankings

## Problema Identificado

Existe una **desconexión entre dos sistemas**:

```text
GESTIÓN DE PERFILES                    GESTIÓN DE RANKINGS
┌─────────────────────┐               ┌─────────────────────┐
│ fighter_profiles    │               │ fighter_rankings    │
│ ├── discipline: MMA │ ──NO SYNC──→ │ ├── organization_id │
│ └── level: Amateur  │               │ └── level: Amateur  │
└─────────────────────┘               └─────────────────────┘
```

**Cuando cambias disciplina de MMA a Boxeo en el perfil:**
- Se actualiza `fighter_profiles.discipline` = 'Boxeo'
- Las membresías en `fighter_rankings` quedan sin cambios
- El cache de React Query (`organization-ranking`) no se invalida
- El peleador sigue apareciendo en ranking de MMA

---

## Solución Propuesta

### Opción A: Invalidar Cache de Rankings (Mínimo)

Después de actualizar un perfil, invalidar los queries de rankings para forzar refetch.

**Archivo:** `src/hooks/useFighterProfiles.tsx`

```typescript
// Importar queryClient
import { useQueryClient } from '@tanstack/react-query';

const adminUpdateFighterProfile = async (...) => {
  // ... código existente ...
  
  // NUEVO: Invalidar queries de rankings
  queryClient.invalidateQueries({ queryKey: ['organization-ranking'] });
  queryClient.invalidateQueries({ queryKey: ['fighter-active-leagues'] });
  
  return true;
};
```

### Opción B: Sincronización Automática (Recomendada)

Cuando se cambia la disciplina del perfil, **migrar automáticamente las membresías de ranking** a la nueva disciplina/organización.

**Lógica:**
1. Si disciplina cambia de MMA → Boxeo:
   - Desactivar membresías en organizaciones MMA (UCC_MMA)
   - Crear/reactivar membresías en organizaciones Boxeo (BDG_PRO, HHF_AMATEUR)
   - Mantener el nivel y categoría de peso

**Nuevo archivo:** `src/utils/syncDisciplineToRankings.ts`

```typescript
export async function syncDisciplineToRankings(
  fighterId: string,
  newDiscipline: 'MMA' | 'Boxeo',
  weightClass: string,
  level: string
) {
  // 1. Obtener membresías actuales
  // 2. Desactivar las de disciplina anterior
  // 3. Crear/activar en disciplina nueva
}
```

---

## Cambios Requeridos

### Archivo 1: `src/hooks/useFighterProfiles.tsx`

**Cambios:**
1. Importar `useQueryClient` de React Query
2. Después de `adminUpdateFighterProfile` exitoso:
   - Invalidar `['organization-ranking']`
   - Invalidar `['fighter-active-leagues']`
   - Invalidar `['admin-fighters']` si existe

### Archivo 2: `src/hooks/useAdminFighters.tsx`

**Cambios:**
1. Convertir a React Query para mejor manejo de cache
2. O agregar invalidación de otros queries después de update

### Archivo 3: `src/components/admin/FighterEditModal.tsx`

**Cambios:**
1. Agregar advertencia visual cuando se cambia disciplina:
   ```
   ⚠️ Cambiar la disciplina NO actualiza automáticamente las membresías de ranking.
   Ve a la pestaña "Ligas" del peleador para ajustar sus membresías.
   ```

### Archivo 4: `src/pages/admin/RankingsManagement.tsx`

**Cambios:**
1. Escuchar evento `admin-fighter-updated`
2. Invalidar query de rankings cuando se recibe el evento

---

## Implementación Detallada

### Paso 1: Invalidación de Cache (Inmediato)

```typescript
// En useFighterProfiles.tsx
import { useQueryClient } from '@tanstack/react-query';

export function useFighterProfiles() {
  const queryClient = useQueryClient();
  
  const adminUpdateFighterProfile = async (fighterId, profileData) => {
    // ... código existente ...
    
    // Después de éxito:
    queryClient.invalidateQueries({ queryKey: ['organization-ranking'] });
    queryClient.invalidateQueries({ queryKey: ['fighter-active-leagues', fighterId] });
    
    return true;
  };
}
```

### Paso 2: Advertencia en UI

```tsx
// En FighterEditModal.tsx, sección de disciplina
{formData.discipline !== fighter.discipline && (
  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
    <p className="font-medium text-amber-800">
      ⚠️ Cambio de disciplina detectado
    </p>
    <p className="text-amber-700">
      Las membresías de ranking existentes no se modificarán automáticamente.
      Utiliza la pestaña "Ligas" para gestionar los rankings del peleador.
    </p>
  </div>
)}
```

### Paso 3: Listener en RankingsManagement

```tsx
// En RankingsManagement.tsx
import { useQueryClient } from '@tanstack/react-query';

export default function RankingsManagement() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const handleFighterUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['organization-ranking'] });
    };
    
    window.addEventListener('admin-fighter-updated', handleFighterUpdate);
    return () => window.removeEventListener('admin-fighter-updated', handleFighterUpdate);
  }, [queryClient]);
}
```

---

## Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/hooks/useFighterProfiles.tsx` | Invalidar queries de rankings | Alta |
| `src/pages/admin/RankingsManagement.tsx` | Listener para refrescar datos | Alta |
| `src/components/admin/FighterEditModal.tsx` | Advertencia visual de cambio de disciplina | Media |

---

## Flujo Corregido

```text
ANTES (Problema):
1. Admin cambia disciplina MMA → Boxeo en perfil
2. Se guarda en fighter_profiles
3. RankingsManagement muestra cache viejo
4. Peleador sigue en ranking MMA

DESPUÉS (Solución):
1. Admin cambia disciplina MMA → Boxeo en perfil
2. Se guarda en fighter_profiles
3. Se invalida cache de organization-ranking
4. RankingsManagement hace refetch
5. Admin ve advertencia de ajustar membresías
6. Admin va a tab "Ligas" y ajusta manualmente
```

---

## Aclaración Arquitectónica

El campo `discipline` en `fighter_profiles` es **informativo/preferencia**. El sistema real de rankings se basa en `fighter_rankings.organization_id`.

**Esto significa:**
- Un peleador puede tener `discipline: 'MMA'` pero estar inscrito en rankings de Boxeo
- El cambio de disciplina del perfil es una preferencia, no una migración automática
- Las membresías de ranking se gestionan independientemente en el tab "Ligas"

Esta separación es intencional para permitir flexibilidad (peleadores en múltiples disciplinas).
