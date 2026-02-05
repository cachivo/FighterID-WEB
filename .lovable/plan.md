
# Plan: Separar Disciplina de Competencia de Artes Marciales de Entrenamiento

## Problema Identificado

En el panel de administracion (`FighterEditModal.tsx`), la seccion "Disciplinas y Estilo" mezcla dos conceptos diferentes:

**Estado actual (incorrecto):**
```
Disciplinas y Estilo
├── Nivel (Amateur/Semi/Pro)
└── Artes Marciales (checkbox multiple)
    ├── MMA          ← Disciplina de COMPETENCIA
    ├── Boxeo        ← Disciplina de COMPETENCIA  
    ├── Judo         ← Arte de ENTRENAMIENTO
    ├── JiuJitsu     ← Arte de ENTRENAMIENTO
    └── ...
```

**Estado correcto (propuesto):**
```
CARD 1: Disciplina de Competencia
├── Disciplina: [MMA ▼] o [Boxeo ▼]  ← SELECT unico
└── Nivel: [Amateur/Semi/Pro ▼]

CARD 2: Artes Marciales de Entrenamiento
└── Checkboxes multiples:
    ├── Muay Thai
    ├── Jiu-Jitsu Brasileño
    ├── Judo
    ├── Kickboxing
    ├── Grappling
    ├── Lucha Libre
    ├── Karate
    └── Tae Kwon Do
```

---

## Solucion Tecnica

### Archivo: `src/components/admin/FighterEditModal.tsx`

**Cambio 1:** Eliminar la constante local `MARTIAL_ARTS` (linea 24-26) y usar las constantes centralizadas

```typescript
// ANTES (linea 24-26)
const MARTIAL_ARTS = [
  'MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro'
];

// DESPUES - Importar desde disciplines.ts
import { 
  ENABLED_DISCIPLINES, 
  MARTIAL_ARTS_TRAINING,  // AGREGAR
  WEIGHT_CLASSES, 
  FIGHTER_LEVELS, 
  STANCES 
} from '@/lib/constants/disciplines';
```

**Cambio 2:** Separar en DOS cards distintas (lineas 635-689)

```
CARD 1: "Disciplina de Competencia"
├── Select: Disciplina (MMA o Boxeo) - OBLIGATORIO
└── Select: Nivel (Amateur/Semi/Pro)

CARD 2: "Artes Marciales de Entrenamiento"  
└── Checkboxes: MARTIAL_ARTS_TRAINING (sin MMA ni Boxeo)
    - Solo artes de entrenamiento complementarias
```

**Cambio 3:** Actualizar la logica de manejo

```typescript
// La disciplina principal (MMA/Boxeo) se guarda en field 'discipline'
// Las artes de entrenamiento se guardan en field 'martial_arts'
// Ya NO se mezclan
```

---

## Estructura Visual Propuesta

```text
┌─────────────────────────────────────────────────────────────┐
│  DISCIPLINA DE COMPETENCIA                                  │
├─────────────────────────────────────────────────────────────┤
│  Disciplina *            Nivel Competitivo                  │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ MMA           ▼│    │ Amateur       ▼│                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
│  Define en que ranking aparece el peleador                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ARTES MARCIALES DE ENTRENAMIENTO                           │
├─────────────────────────────────────────────────────────────┤
│  ☑ Muay Thai        ☐ Judo         ☑ Wrestling            │
│  ☑ Jiu-Jitsu        ☐ Kickboxing   ☐ Karate               │
│  ☐ Grappling        ☐ Tae Kwon Do                          │
│                                                             │
│  Artes que practica para su preparacion (informativo)       │
└─────────────────────────────────────────────────────────────┘
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/admin/FighterEditModal.tsx` | Separar en 2 cards, usar constantes correctas |
| `src/lib/constants/disciplines.ts` | Remover MMA y Boxeo de MARTIAL_ARTS_TRAINING |

---

## Cambio en disciplines.ts

Actualmente `MARTIAL_ARTS_TRAINING` incluye MMA y Boxeo, lo cual es redundante si ya tenemos `ENABLED_DISCIPLINES`. Se propone limpiar:

```typescript
// ANTES
export const MARTIAL_ARTS_TRAINING = [
  { value: 'MMA', label: 'MMA' },           // REMOVER
  { value: 'Boxeo', label: 'Boxeo' },       // REMOVER
  { value: 'MuayThai', label: 'Muay Thai' },
  // ...
];

// DESPUES - Solo artes de entrenamiento
export const MARTIAL_ARTS_TRAINING = [
  { value: 'MuayThai', label: 'Muay Thai' },
  { value: 'JiuJitsu', label: 'Jiu-Jitsu Brasileño' },
  { value: 'Judo', label: 'Judo' },
  { value: 'Kickboxing', label: 'Kickboxing' },
  { value: 'Grappling', label: 'Grappling' },
  { value: 'Wrestling', label: 'Lucha Libre' },
  { value: 'Karate', label: 'Karate' },
  { value: 'TaeKwonDo', label: 'Tae Kwon Do' },
];
```

---

## Beneficios

1. **Claridad conceptual**: Disciplina de competencia separada de artes de entrenamiento
2. **Consistencia con rankings**: El campo `discipline` define en que liga aparece
3. **Mejor UX**: El admin entiende que MMA/Boxeo es para rankings, el resto es informativo
4. **Dato limpio**: `martial_arts[]` contendra solo artes de entrenamiento, no disciplinas

---

## Seccion Tecnica

### Mapeo de campos en base de datos

| Campo | Uso |
|-------|-----|
| `discipline` | Disciplina de competencia (MMA o Boxeo) - Define ranking |
| `martial_arts` | Array de artes marciales de entrenamiento (informativo) |
| `level` | Nivel competitivo (Amateur/Semi/Pro) |

### Logica de Records

Los records de combate se muestran segun el valor de `discipline`:
- Si `discipline = 'MMA'` → Mostrar campos `mma_record_*`
- Si `discipline = 'Boxeo'` → Mostrar campos `boxeo_record_*`

Esto ya funciona correctamente, solo necesitamos asegurar que la seleccion de disciplina sea clara y separada.
