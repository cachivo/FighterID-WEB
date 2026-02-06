
# Plan de Coherencia: Categorias de Peso con Libras

## Diagnostico

La plataforma ya tiene una funcion centralizada `getWeightClassLabel()` en `src/lib/constants/disciplines.ts` que convierte valores como "Peso Ligero" a "Peso Ligero (155 lbs)". Sin embargo, **7 archivos** no la utilizan.

---

## Estado Actual vs Esperado

| Muestra actual | Deberia mostrar |
|----------------|-----------------|
| Peso Ligero | Peso Ligero (155 lbs) |
| Peso Mosca | Peso Mosca (125 lbs) |
| Peso Gallo | Peso Gallo (135 lbs) |

---

## Archivos que YA Usan `getWeightClassLabel()` (correcto)

| Archivo | Ubicacion |
|---------|-----------|
| FighterProfile.tsx | Linea 210 |
| FighterLeaguesTab.tsx | Linea 135 |
| FighterCard.tsx | Linea 109 |
| FighterMiniature.tsx | Linea 89 |

---

## Archivos a Corregir

### 1. LicenseDashboard.tsx (Dashboard del Usuario)

**Ubicacion:** Linea 295

**Cambio:**
- Actual: `{fighterProfile.weight_class}`
- Corregido: `{getWeightClassLabel(fighterProfile?.weight_class)}`

Agregar import: `import { getWeightClassLabel } from '@/lib/constants/disciplines';`

---

### 2. EnhancedFighterID.tsx (Tarjeta Fighter ID)

**Ubicacion:** Linea 93

**Cambio:**
- Actual: `{profile.weight_class}`
- Corregido: `{getWeightClassLabel(profile.weight_class)}`

Agregar import al inicio del archivo.

---

### 3. Ranking.tsx (Listado de Rankings)

**Ubicacion:** Linea 236

**Cambio:**
- Actual: `{ranking.weight_class}`
- Corregido: `{getWeightClassLabel(ranking.weight_class)}`

Agregar import al inicio del archivo.

---

### 4. UserProfile.tsx (Perfil Social)

**Ubicacion:** Linea 270

**Cambio:**
- Actual: `{fighterProfile.weight_class}`
- Corregido: `{getWeightClassLabel(fighterProfile.weight_class)}`

Agregar import al inicio del archivo.

---

### 5. FighterDetailModal.tsx (Modal Admin)

**Ubicacion:** Linea 151

**Cambio:**
- Actual: `{data.profile?.weight_class}`
- Corregido: `{getWeightClassLabel(data.profile?.weight_class)}`

Agregar import al inicio del archivo.

---

### 6. EnrollFighterModal.tsx (Inscripcion a Ligas)

**Ubicacion:** Linea 149

**Cambio:**
- Actual: `{selectedFighterData.weight_class}`
- Corregido: `{getWeightClassLabel(selectedFighterData.weight_class)}`

Agregar import (ya importa `WEIGHT_CLASSES`, agregar `getWeightClassLabel`).

---

### 7. RefereeControlRoom.tsx (Sala de Arbitraje)

**Ubicaciones:** Lineas 238 y 257

**Cambio en ambas lineas:**
- Actual: `{fight.weight_class}`
- Corregido: `{getWeightClassLabel(fight.weight_class)}`

Agregar import al inicio del archivo.

---

## Resumen de Archivos a Modificar

| Archivo | Cambio | Impacto Visual |
|---------|--------|----------------|
| `src/pages/license/LicenseDashboard.tsx` | Agregar import + usar funcion | Dashboard usuario |
| `src/components/EnhancedFighterID.tsx` | Agregar import + usar funcion | Tarjeta ID |
| `src/components/sections/Ranking.tsx` | Agregar import + usar funcion | Listado rankings |
| `src/pages/social/UserProfile.tsx` | Agregar import + usar funcion | Perfil social |
| `src/components/admin/FighterDetailModal.tsx` | Agregar import + usar funcion | Modal admin |
| `src/components/admin/EnrollFighterModal.tsx` | Ampliar import + usar funcion | Modal inscripcion |
| `src/pages/referee/RefereeControlRoom.tsx` | Agregar import + usar funcion (2 lugares) | Sala arbitraje |

---

## Compatibilidad Movil

Todos los cambios son puramente de texto. No se modifican:
- Clases de Tailwind
- Estructura de layout
- Breakpoints responsivos
- Tamanos de fuente

El texto "Peso Ligero (155 lbs)" ocupa el mismo espacio visual que "Peso Ligero" gracias al uso de `truncate` y `min-w-0` ya implementados en los badges.

---

## Resultado Final

Despues de implementar estos cambios, en TODA la plataforma se mostrara:

```text
Peso Paja (115 lbs)
Peso Mosca (125 lbs)
Peso Gallo (135 lbs)
Peso Pluma (145 lbs)
Peso Ligero (155 lbs)
Peso Welter (170 lbs)
Peso Medio (185 lbs)
Peso Semipesado (205 lbs)
Peso Pesado (265 lbs)
Peso Superpesado (+265 lbs)
```

Garantizando claridad total para todos los usuarios sobre el limite de peso de cada categoria.
