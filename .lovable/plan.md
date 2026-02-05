

# Plan: Uniformidad de Base de Datos - Fighter ID

## Resumen de Cambios

Normalizar todos los datos de peleadores para establecer uniformidad y preparar el sistema de rankings.

---

## Estructura de Rankings Definida

```text
┌────────────────────────────────────────────────────────────────────┐
│                      DISCIPLINAS OFICIALES                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   ┌──────────────────────┐      ┌──────────────────────┐         │
│   │        MMA           │      │       BOXEO          │         │
│   ├──────────────────────┤      ├──────────────────────┤         │
│   │                      │      │                      │         │
│   │   Ranking: UCC HN    │      │   Pro: BDG Pro Box   │         │
│   │   (Todos los niveles)│      │   Amateur: HHF       │         │
│   │                      │      │   (Rankings separados)│         │
│   └──────────────────────┘      └──────────────────────┘         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Limpieza de Datos (SQL Updates)

### 1.1 Normalizar Países

```sql
-- Cambiar códigos de país a nombres completos
UPDATE fighter_profiles SET country = 'Honduras' WHERE country IN ('HN', 'Honduras ');
UPDATE fighter_profiles SET country = 'Guatemala' WHERE country = 'GUATEMALA';
UPDATE fighter_profiles SET country = 'Panamá' WHERE country = 'PANAMA';
UPDATE fighter_profiles SET country = 'Nicaragua' WHERE country = 'NICARAGUA';
UPDATE fighter_profiles SET country = 'México' WHERE country = 'MEXICO';
UPDATE fighter_profiles SET country = 'Canadá' WHERE country = 'CANADA';
UPDATE fighter_profiles SET country = 'El Salvador' WHERE country = 'EL SALVADOR';
```

**Registros afectados: 55**

### 1.2 Normalizar Niveles

```sql
-- Estandarizar valores de nivel
UPDATE fighter_profiles SET level = 'Amateur' WHERE level = 'AMATEUR';
UPDATE fighter_profiles SET level = 'Semi-profesional' WHERE level IN ('SEMI_PRO', 'Semi-Profesional');
UPDATE fighter_profiles SET level = 'Amateur' WHERE level IS NULL;
```

**Registros afectados: 14**

### 1.3 Limpiar Espacios en Nombres

```sql
-- Eliminar espacios al inicio y final de nombres
UPDATE fighter_profiles SET first_name = TRIM(first_name) WHERE first_name != TRIM(first_name);
UPDATE fighter_profiles SET last_name = TRIM(last_name) WHERE last_name != TRIM(last_name);
```

**Registros afectados: ~20**

### 1.4 Migrar Disciplina MuayThai

```sql
-- Willis Yang: cambiar MuayThai → MMA (asumiendo que compite en MMA)
UPDATE fighter_profiles 
SET discipline = 'MMA', 
    martial_arts = ARRAY['MuayThai', 'MMA']
WHERE id = 'b9701ce3-909b-41a7-ae7a-9a0217cf6846';
```

**Registros afectados: 1**

---

## Fase 2: Agregar BDG Pro Boxing a Partners

```sql
-- Insertar BDG Pro Boxing como organización de boxeo profesional
INSERT INTO partners (nombre, tipo, descripcion, orden, activo)
VALUES (
  'BDG Pro Boxing',
  'Organización',
  'Organización oficial de boxeo profesional en Honduras',
  2,
  true
);
```

---

## Fase 3: Actualizar Constantes en Frontend

### Archivo: `src/lib/constants/disciplines.ts`

Agregar lista de países estandarizados:

```typescript
// Países de Centroamérica y región (estandarizados)
export const COUNTRIES = [
  { value: 'Honduras', label: 'Honduras' },
  { value: 'Guatemala', label: 'Guatemala' },
  { value: 'El Salvador', label: 'El Salvador' },
  { value: 'Nicaragua', label: 'Nicaragua' },
  { value: 'Panamá', label: 'Panamá' },
  { value: 'Costa Rica', label: 'Costa Rica' },
  { value: 'México', label: 'México' },
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'Canadá', label: 'Canadá' },
  { value: 'Otro', label: 'Otro' },
] as const;
```

### Agregar Artes Marciales de Perfil

```typescript
// Artes marciales para perfil de entrenamiento (NO son disciplinas de competencia)
export const MARTIAL_ARTS_TRAINING = [
  { value: 'MMA', label: 'MMA' },
  { value: 'Boxeo', label: 'Boxeo' },
  { value: 'MuayThai', label: 'Muay Thai' },
  { value: 'JiuJitsu', label: 'Jiu-Jitsu Brasileño' },
  { value: 'Judo', label: 'Judo' },
  { value: 'Kickboxing', label: 'Kickboxing' },
  { value: 'Grappling', label: 'Grappling' },
  { value: 'Wrestling', label: 'Lucha Libre' },
  { value: 'Karate', label: 'Karate' },
  { value: 'TaeKwonDo', label: 'Tae Kwon Do' },
] as const;
```

---

## Fase 4: Crear Estructura de Rankings

Cuando se apruebe la migración del sistema de puntos, los rankings quedarán así:

| Código | Nombre | Disciplina | Organización |
|--------|--------|------------|--------------|
| `UCC_MMA` | UCC MMA Honduras | MMA | UCC |
| `BDG_PRO_BOX` | BDG Boxeo Profesional | Boxeo | BDG Pro Boxing |
| `HHF_AMATEUR` | Honduras Hood Fights | Boxeo | HHF |

---

## Resumen de Cambios por Archivo

| Archivo/Recurso | Acción | Descripción |
|-----------------|--------|-------------|
| Base de datos | UPDATE | Normalizar 55 países |
| Base de datos | UPDATE | Normalizar 14 niveles |
| Base de datos | UPDATE | Limpiar ~20 nombres con espacios |
| Base de datos | UPDATE | Migrar 1 peleador MuayThai → MMA |
| Base de datos | INSERT | Agregar BDG Pro Boxing a partners |
| `disciplines.ts` | MODIFY | Agregar constantes COUNTRIES y MARTIAL_ARTS_TRAINING |

---

## Validaciones Post-Actualización

```sql
-- Query de verificación final
SELECT 
  'Disciplinas' as check_type,
  discipline::text as value,
  COUNT(*) as count
FROM fighter_profiles WHERE active = true
GROUP BY discipline
UNION ALL
SELECT 
  'Niveles' as check_type,
  level as value,
  COUNT(*) as count
FROM fighter_profiles WHERE active = true
GROUP BY level
UNION ALL
SELECT 
  'Países' as check_type,
  country as value,
  COUNT(*) as count
FROM fighter_profiles WHERE active = true
GROUP BY country
ORDER BY check_type, count DESC;
```

---

## Resultado Esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Disciplinas únicas | 3 (MMA, Boxeo, MuayThai) | 2 (MMA, Boxeo) |
| Formatos de país | 9 variaciones | Nombres completos estandarizados |
| Formatos de nivel | 5 variaciones | 3 valores estándar |
| Nombres con espacios | 20+ | 0 |
| Organizaciones de Boxeo | 1 (HHF) | 2 (HHF Amateur, BDG Pro) |

