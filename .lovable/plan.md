
# Auditoría Completa del Sistema de Rankings

## DIAGNÓSTICO

### Problema Principal Encontrado

El ranking de Boxeo aparece vacío en la página principal porque el sistema selecciona automáticamente el primer nivel de la lista (`Profesional`), pero no hay ningún peleador profesional activo en BDG_PRO.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                    FLUJO ACTUAL (PROBLEMÁTICO)                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Usuario selecciona "BOXEO"                                                  │
│         │                                                                    │
│         ▼                                                                    │
│  LeagueSelector selecciona primera org → BDG_PRO                            │
│         │                                                                    │
│         ▼                                                                    │
│  Ranking.tsx auto-selecciona primer nivel de allowed_levels                 │
│  allowed_levels = [Profesional, Semi-profesional] → "Profesional"           │
│         │                                                                    │
│         ▼                                                                    │
│  Query: WHERE organization = BDG_PRO AND level = "Profesional"              │
│         │                                                                    │
│         ▼                                                                    │
│  RESULTADO: 0 peleadores (aunque hay 1 Semi-profesional)                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Estado Actual de la Base de Datos

| Organización | Disciplina | Nivel | Peleadores Activos |
|--------------|------------|-------|-------------------|
| UCC_MMA | MMA | Amateur | 39 |
| UCC_MMA | MMA | Profesional | 9 |
| UCC_MMA | MMA | Semi-profesional | 7 |
| BDG_PRO | Boxeo | Semi-profesional | 1 |
| BDG_PRO | Boxeo | Profesional | 0 |
| HHF_AMATEUR | Boxeo | Amateur | 1 |

### Problema de Coherencia Identificado

El componente `Ranking.tsx` (líneas 38-42) tiene esta lógica:

```tsx
// Auto-select first available level when levels load
useEffect(() => {
  if (availableLevels.length > 0 && !selectedLevel) {
    setSelectedLevel(availableLevels[0]); // ← PROBLEMA: Selecciona el primero, no el que tiene datos
  }
}, [availableLevels, selectedLevel]);
```

---

## SOLUCIÓN PROPUESTA

### Cambio en Ranking.tsx: Selección Inteligente de Nivel

Modificar la lógica para que auto-seleccione el nivel con más peleadores activos en lugar del primer nivel de la lista.

```tsx
// ANTES (problemático):
useEffect(() => {
  if (availableLevels.length > 0 && !selectedLevel) {
    setSelectedLevel(availableLevels[0]);
  }
}, [availableLevels, selectedLevel]);

// DESPUÉS (inteligente):
useEffect(() => {
  if (rankingData && availableLevels.length > 0 && !selectedLevel) {
    // Obtener conteo de peleadores por nivel
    const levelCounts = rankingData.levels.reduce((acc, level) => {
      const count = rankingData.rankings.filter(r => r.level === level).length;
      acc[level] = count;
      return acc;
    }, {} as Record<string, number>);
    
    // Seleccionar el nivel con más peleadores
    const sortedLevels = availableLevels.sort((a, b) => 
      (levelCounts[b] || 0) - (levelCounts[a] || 0)
    );
    
    setSelectedLevel(sortedLevels[0] || availableLevels[0]);
  }
}, [availableLevels, selectedLevel, rankingData]);
```

### Alternativa más simple: Modificar useOrganizationRanking

Añadir información de conteo por nivel directamente en el hook para que el componente pueda tomar decisiones inteligentes:

```tsx
// En useOrganizationRanking.tsx, añadir:
levelCounts: Record<string, number>; // { "Amateur": 39, "Profesional": 9, ... }
```

---

## ARCHIVOS A MODIFICAR

| Archivo | Cambio | Impacto |
|---------|--------|---------|
| `src/hooks/useOrganizationRanking.tsx` | Añadir `levelCounts` al resultado | Provee datos para selección inteligente |
| `src/components/sections/Ranking.tsx` | Auto-seleccionar nivel con más datos | Resuelve ranking vacío de Boxeo |

---

## FLUJO CORREGIDO

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                    FLUJO CORREGIDO                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Usuario selecciona "BOXEO"                                                  │
│         │                                                                    │
│         ▼                                                                    │
│  LeagueSelector selecciona primera org → BDG_PRO                            │
│         │                                                                    │
│         ▼                                                                    │
│  Ranking.tsx consulta levelCounts = { Semi-profesional: 1, Profesional: 0 } │
│         │                                                                    │
│         ▼                                                                    │
│  Auto-selecciona nivel con más datos → "Semi-profesional"                   │
│         │                                                                    │
│         ▼                                                                    │
│  RESULTADO: 1 peleador mostrado (Moises Cardenas)                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## VERIFICACIÓN POST-IMPLEMENTACIÓN

### Test 1: Ranking de Boxeo en Página Principal
1. Ir a la página principal como usuario autenticado
2. Hacer scroll hasta el selector de ligas
3. Seleccionar "BOXEO"
4. Verificar que aparece "Moises Cardenas" en BDG Pro (Semi-profesional)
5. Cambiar a HHF Amateur → Verificar que aparece "Willis Yang"

### Test 2: Coherencia con Admin Panel
1. Ir a `/admin/rankings`
2. Seleccionar Boxeo → BDG Pro
3. Verificar que muestra los mismos datos que la página principal

### Test 3: Cambio de Disciplina
1. Editar un peleador de MMA y cambiar a Boxeo
2. Verificar que aparece inmediatamente en el ranking de Boxeo correcto
3. Verificar que ya no aparece en UCC MMA

---

## RESUMEN DE CAMBIOS

1. **useOrganizationRanking.tsx**: Añadir `levelCounts` para exponer conteo de peleadores por nivel
2. **Ranking.tsx**: Implementar selección inteligente basada en datos disponibles
3. Sin cambios en base de datos (los datos ya están correctos)
