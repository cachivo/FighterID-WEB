
# Plan: Mostrar libras en todas las categorías de peso

## Problema Identificado

Hay inconsistencias en el manejo de categorías de peso:

| Ubicación | Estado Actual | Problema |
|-----------|--------------|----------|
| `disciplines.ts` | `WEIGHT_CLASSES` con lbs | Correcto |
| `FightersProfiles.tsx` | Lista local en INGLÉS | No usa constantes centralizadas |
| `FighterCard.tsx` | Muestra valor crudo | Sin lbs |
| `FighterMiniature.tsx` | Muestra valor crudo | Sin lbs |
| `FighterProfile.tsx` | Muestra valor crudo | Sin lbs |

---

## Solución

### 1. Agregar función helper en `disciplines.ts`

```typescript
// Helper para obtener label con libras desde el valor
export const getWeightClassLabel = (value: string | undefined | null): string => {
  if (!value) return 'Sin categoría';
  const found = WEIGHT_CLASSES.find(wc => wc.value === value);
  return found ? found.label : value;
};
```

### 2. Actualizar `FightersProfiles.tsx`

- Eliminar la lista local `WEIGHT_CLASSES` en inglés
- Importar y usar `WEIGHT_CLASSES` de `disciplines.ts`
- Usar `getWeightClassLabel()` para mostrar las categorías

### 3. Actualizar componentes de visualización

Usar `getWeightClassLabel(fighter.weight_class)` en:
- `FighterCard.tsx` (Badge de categoría)
- `FighterMiniature.tsx` (Info adicional)
- `FighterProfile.tsx` (Badge de categoría)
- `ExternalFighterForm.tsx` (ya usa WEIGHT_CLASSES correctamente)

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/lib/constants/disciplines.ts` | Agregar helper `getWeightClassLabel()` |
| `src/pages/admin/FightersProfiles.tsx` | Usar constantes centralizadas + helper |
| `src/components/FighterCard.tsx` | Usar helper para badge |
| `src/components/FighterMiniature.tsx` | Usar helper para mostrar peso |
| `src/pages/FighterProfile.tsx` | Usar helper para badge |

---

## Resultado Esperado

### Antes
```
Peso: Peso Ligero
```

### Después
```
Peso: Peso Ligero (155 lbs)
```

---

## Detalles Técnicos

### Nuevo helper en `disciplines.ts`

```typescript
/**
 * Get the full weight class label with lbs from the stored value
 * @param value - The weight class value stored in DB (e.g., "Peso Ligero")
 * @returns The full label with lbs (e.g., "Peso Ligero (155 lbs)")
 */
export const getWeightClassLabel = (value: string | undefined | null): string => {
  if (!value) return 'Sin categoría';
  const found = WEIGHT_CLASSES.find(wc => wc.value === value);
  return found ? found.label : value; // Fallback al valor crudo si no se encuentra
};
```

### Uso en componentes

```typescript
// Importar
import { getWeightClassLabel } from '@/lib/constants/disciplines';

// Usar
<Badge variant="secondary">{getWeightClassLabel(fighter.weight_class)}</Badge>
```

### Actualización del filtro en FightersProfiles.tsx

```typescript
// Importar constantes centralizadas
import { WEIGHT_CLASSES, getWeightClassLabel } from '@/lib/constants/disciplines';

// En el Select de filtro
<SelectContent>
  <SelectItem value="all">Todas las categorías</SelectItem>
  {WEIGHT_CLASSES.map(wc => (
    <SelectItem key={wc.value} value={wc.value}>
      {wc.label}
    </SelectItem>
  ))}
</SelectContent>

// En la visualización
<span className="text-sm font-medium">
  {getWeightClassLabel(fighter.weight_class)}
</span>
```

---

## Beneficios

- **Consistencia**: Todas las vistas muestran el mismo formato
- **Mantenibilidad**: Un solo lugar para cambiar las categorías
- **Información completa**: Los admins y usuarios ven las libras siempre
- **Sin breaking changes**: El valor almacenado en DB no cambia
