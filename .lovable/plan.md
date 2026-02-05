
# Plan: Sistema de Rankings por Disciplina, Nivel y Liga

## Resumen Ejecutivo

Este plan implementa un sistema completo de rankings separados con las siguientes caracteristicas:
- Rankings independientes por organizacion (UCC MMA, BDG Pro Boxing, HHF Amateur)
- Separacion por nivel competitivo (Profesional, Semi-profesional, Amateur)
- Control administrativo exclusivo para modificar records
- Pestanas en la pagina principal para seleccionar liga y disciplina
- Auditoria completa de todos los ajustes de puntos

---

## Arquitectura de Rankings

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA DE RANKINGS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────┐   ┌───────────────────────┐                     │
│  │      MMA              │   │       BOXEO           │                     │
│  ├───────────────────────┤   ├───────────────────────┤                     │
│  │                       │   │                       │                     │
│  │  UCC HONDURAS         │   │  BDG PRO BOXING       │                     │
│  │  ┌─────────────────┐  │   │  ┌─────────────────┐  │                     │
│  │  │ Profesional     │  │   │  │ Profesional     │  │                     │
│  │  │ Semi-pro        │  │   │  │ Semi-pro        │  │                     │
│  │  │ Amateur         │  │   │  └─────────────────┘  │                     │
│  │  └─────────────────┘  │   │                       │                     │
│  │                       │   │  HHF AMATEUR          │                     │
│  └───────────────────────┘   │  ┌─────────────────┐  │                     │
│                              │  │ Amateur ONLY    │  │                     │
│                              │  └─────────────────┘  │                     │
│                              └───────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Estructura de Base de Datos

### 1.1 Crear tabla `ranking_organizations`

Define las ligas/federaciones oficiales.

```sql
CREATE TABLE public.ranking_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,           -- 'UCC_MMA', 'BDG_PRO', 'HHF_AMATEUR'
  name TEXT NOT NULL,                  -- 'UCC Honduras MMA'
  short_name TEXT NOT NULL,            -- 'UCC MMA'
  discipline TEXT NOT NULL,            -- 'MMA' o 'Boxeo'
  allowed_levels TEXT[] NOT NULL,      -- ['Profesional', 'Semi-profesional', 'Amateur']
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Datos iniciales
INSERT INTO ranking_organizations (code, name, short_name, discipline, allowed_levels, description) VALUES
('UCC_MMA', 'Ultimate Combat Championship Honduras', 'UCC MMA', 'MMA', 
 ARRAY['Profesional', 'Semi-profesional', 'Amateur'], 'Ranking oficial de MMA en Honduras'),
('BDG_PRO', 'BDG Pro Boxing', 'BDG Pro', 'Boxeo', 
 ARRAY['Profesional', 'Semi-profesional'], 'Boxeo profesional y semi-profesional'),
('HHF_AMATEUR', 'Honduras Hood Fights', 'HHF Amateur', 'Boxeo', 
 ARRAY['Amateur'], 'Boxeo amateur - eventos de barrio');
```

### 1.2 Crear tabla `fighter_rankings`

Asocia peleadores a rankings especificos con su posicion y puntos.

```sql
CREATE TABLE public.fighter_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID NOT NULL REFERENCES fighter_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES ranking_organizations(id) ON DELETE CASCADE,
  weight_class TEXT NOT NULL,
  level TEXT NOT NULL,                 -- 'Profesional', 'Semi-profesional', 'Amateur'
  ranking_position INTEGER,            -- Posicion actual (nullable si no rankeado)
  points INTEGER DEFAULT 0,
  is_champion BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,      -- Permite congelar ranking
  last_fight_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Un peleador solo puede estar una vez por organizacion + categoria + nivel
  UNIQUE(fighter_id, organization_id, weight_class, level)
);

-- Indices para performance
CREATE INDEX idx_fighter_rankings_org ON fighter_rankings(organization_id);
CREATE INDEX idx_fighter_rankings_fighter ON fighter_rankings(fighter_id);
CREATE INDEX idx_fighter_rankings_position ON fighter_rankings(organization_id, weight_class, level, ranking_position);
```

### 1.3 Crear tabla `ranking_point_adjustments`

Auditoria de todos los cambios de puntos (solo administradores).

```sql
CREATE TABLE public.ranking_point_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id UUID NOT NULL REFERENCES fighter_rankings(id) ON DELETE CASCADE,
  fighter_id UUID NOT NULL REFERENCES fighter_profiles(id),
  previous_points INTEGER NOT NULL,
  new_points INTEGER NOT NULL,
  adjustment_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,                -- 'Victoria', 'Derrota', 'Ajuste manual', 'Pelea cancelada'
  fight_id UUID REFERENCES fights(id), -- Referencia a pelea si aplica
  adjusted_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indice para historial
CREATE INDEX idx_point_adjustments_ranking ON ranking_point_adjustments(ranking_id);
CREATE INDEX idx_point_adjustments_fighter ON ranking_point_adjustments(fighter_id);
```

### 1.4 Politicas RLS

```sql
-- ranking_organizations: Lectura publica, escritura solo admin
ALTER TABLE ranking_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ranking_orgs_read" ON ranking_organizations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ranking_orgs_admin" ON ranking_organizations
  FOR ALL TO authenticated USING (public.is_admin());

-- fighter_rankings: Lectura publica, escritura solo admin
ALTER TABLE fighter_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rankings_read" ON fighter_rankings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rankings_admin" ON fighter_rankings
  FOR ALL TO authenticated USING (public.is_admin());

-- ranking_point_adjustments: Solo admin puede crear/ver
ALTER TABLE ranking_point_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "adjustments_admin" ON ranking_point_adjustments
  FOR ALL TO authenticated USING (public.is_admin());
```

---

## Fase 2: Pagina Principal - Selector de Ligas

### 2.1 Nuevo componente `LeagueSelector.tsx`

```typescript
// src/components/sections/LeagueSelector.tsx
// Tabs visuales para seleccionar disciplina y liga antes de ver el ranking
// Muestra logos de organizaciones y descripcion breve
```

**Funcionalidades:**
- Tabs principales: MMA | BOXEO
- Sub-tabs por organizacion: UCC MMA, BDG Pro, HHF Amateur
- Badge indicando niveles disponibles (Pro, Semi, Amateur)
- Estilo visual coherente con el tema urbano

### 2.2 Modificar `Ranking.tsx`

Refactorizar para:
- Recibir `organizationCode` como prop
- Filtrar peleadores por organizacion + nivel
- Mostrar subtabs por nivel (Profesional/Semi/Amateur)
- Usar la nueva tabla `fighter_rankings` en lugar de calcular en cliente

### 2.3 Actualizar `Index.tsx`

```typescript
// Agregar estado para organizacion seleccionada
const [selectedOrg, setSelectedOrg] = useState<string>('UCC_MMA');

// Renderizar
<LeagueSelector 
  value={selectedOrg} 
  onChange={setSelectedOrg} 
/>
<Ranking organizationCode={selectedOrg} />
```

---

## Fase 3: Nuevo Hook `useOrganizationRanking`

```typescript
// src/hooks/useOrganizationRanking.tsx

interface RankingEntry {
  id: string;
  fighter_id: string;
  fighter: {
    first_name: string;
    last_name: string;
    nickname: string | null;
    avatar_url: string | null;
    country: string;
  };
  weight_class: string;
  level: string;
  ranking_position: number | null;
  points: number;
  is_champion: boolean;
}

export function useOrganizationRanking(
  organizationCode: string,
  level?: string,
  weightClass?: string
) {
  // Query a ranking_organizations + fighter_rankings + fighter_profiles
  // Ordenar por points DESC, luego por is_champion
  // Retornar datos estructurados para la UI
}
```

---

## Fase 4: Administracion de Records

### 4.1 Actualizar `RankingsManagement.tsx`

Agregar funcionalidades:
- Boton "Ajustar Puntos" por peleador
- Modal de ajuste con:
  - Puntos actuales (solo lectura)
  - Nuevo puntaje o delta (+/-)
  - Razon obligatoria (select con opciones + texto libre)
  - Confirmacion con password de admin
- Historial de ajustes visible por peleador

### 4.2 Nuevo componente `PointAdjustmentModal.tsx`

```typescript
// src/components/admin/PointAdjustmentModal.tsx
// Modal para ajustar puntos manualmente
// Incluye validacion, razon obligatoria, y registro de auditoria
```

### 4.3 Funcion de Base de Datos

```sql
CREATE OR REPLACE FUNCTION public.adjust_ranking_points(
  p_ranking_id UUID,
  p_new_points INTEGER,
  p_reason TEXT,
  p_fight_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_points INTEGER;
  v_fighter_id UUID;
BEGIN
  -- Solo admins
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can adjust ranking points';
  END IF;

  -- Obtener puntos actuales
  SELECT points, fighter_id INTO v_old_points, v_fighter_id
  FROM fighter_rankings WHERE id = p_ranking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ranking entry not found';
  END IF;

  -- Actualizar puntos
  UPDATE fighter_rankings 
  SET points = p_new_points, updated_at = now()
  WHERE id = p_ranking_id;

  -- Registrar en auditoria
  INSERT INTO ranking_point_adjustments (
    ranking_id, fighter_id, previous_points, new_points, 
    adjustment_amount, reason, fight_id, adjusted_by
  ) VALUES (
    p_ranking_id, v_fighter_id, v_old_points, p_new_points,
    p_new_points - v_old_points, p_reason, p_fight_id, auth.uid()
  );
END;
$$;
```

---

## Fase 5: Migracion de Datos Existentes

Script para migrar peleadores actuales a los nuevos rankings:

```sql
-- Insertar peleadores MMA en UCC
INSERT INTO fighter_rankings (fighter_id, organization_id, weight_class, level, points)
SELECT 
  fp.id,
  (SELECT id FROM ranking_organizations WHERE code = 'UCC_MMA'),
  fp.weight_class,
  COALESCE(fp.level, 'Amateur'),
  (COALESCE(fp.mma_record_wins, 0) * 3) + COALESCE(fp.mma_record_draws, 0) - COALESCE(fp.mma_record_losses, 0)
FROM fighter_profiles fp
WHERE fp.discipline = 'MMA' AND fp.active = true
ON CONFLICT DO NOTHING;

-- Insertar peleadores Boxeo segun nivel
INSERT INTO fighter_rankings (fighter_id, organization_id, weight_class, level, points)
SELECT 
  fp.id,
  CASE 
    WHEN fp.level IN ('Profesional', 'Semi-profesional') 
      THEN (SELECT id FROM ranking_organizations WHERE code = 'BDG_PRO')
    ELSE (SELECT id FROM ranking_organizations WHERE code = 'HHF_AMATEUR')
  END,
  fp.weight_class,
  COALESCE(fp.level, 'Amateur'),
  (COALESCE(fp.boxeo_record_wins, 0) * 3) + COALESCE(fp.boxeo_record_draws, 0) - COALESCE(fp.boxeo_record_losses, 0)
FROM fighter_profiles fp
WHERE fp.discipline = 'Boxeo' AND fp.active = true
ON CONFLICT DO NOTHING;
```

---

## Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/components/sections/LeagueSelector.tsx` | Tabs de seleccion de liga para pagina principal |
| `src/components/admin/PointAdjustmentModal.tsx` | Modal para ajuste de puntos |
| `src/hooks/useOrganizationRanking.tsx` | Hook para obtener rankings por organizacion |
| `src/hooks/useRankingOrganizations.tsx` | Hook para listar organizaciones |

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Index.tsx` | Agregar LeagueSelector + estado de organizacion |
| `src/components/sections/Ranking.tsx` | Refactorizar para usar nuevo sistema |
| `src/pages/admin/RankingsManagement.tsx` | Agregar ajuste de puntos y auditoria |
| `src/lib/constants/disciplines.ts` | Agregar constantes de organizaciones |

---

## Migracion de Base de Datos

Se crearan las siguientes migraciones:
1. `create_ranking_organizations` - Tabla de organizaciones
2. `create_fighter_rankings` - Tabla de rankings
3. `create_ranking_point_adjustments` - Tabla de auditoria
4. `seed_initial_organizations` - Datos iniciales de ligas
5. `migrate_existing_fighters` - Migrar peleadores existentes

---

## Flujo de Usuario Final

### Usuario Normal (Pagina Principal)
1. Ve tabs: **MMA** | **BOXEO**
2. Selecciona disciplina
3. Ve sub-tabs de organizaciones disponibles
4. Selecciona nivel: Profesional | Semi-pro | Amateur
5. Ve ranking actualizado con peleadores de esa categoria

### Administrador (Panel Admin)
1. Accede a /admin/rankings
2. Selecciona organizacion y categoria
3. Ve tabla de peleadores con puntos
4. Click en "Ajustar Puntos" en cualquier peleador
5. Ingresa nuevo puntaje + razon obligatoria
6. Sistema registra cambio en auditoria
7. Ranking se actualiza automaticamente

---

## Seccion Tecnica

### Formula de Puntos
Los puntos se calculan automaticamente cuando se registra un resultado:
- Victoria: +3 puntos
- Empate: +1 punto
- Derrota: -1 punto

Los ajustes manuales solo pueden ser realizados por administradores y quedan registrados en `ranking_point_adjustments`.

### Recalculo de Posiciones
Cuando se actualiza un puntaje, las posiciones se recalculan automaticamente ordenando por:
1. Puntos (descendente)
2. Victorias totales (desempate)
3. Fecha de ultima pelea (mas reciente primero)

### Congelamiento de Ranking
Un administrador puede "congelar" un ranking (is_active = false) para:
- Peleadores inactivos por mas de 9 meses
- Suspensiones administrativas
- Cambio de categoria de peso

---

## Metricas de Exito

| Metrica | Objetivo |
|---------|----------|
| Rankings por organizacion | 3 (UCC, BDG, HHF) |
| Niveles soportados | 3 (Pro, Semi, Amateur) |
| Tiempo de carga ranking | < 500ms |
| Auditoria de ajustes | 100% registrados |
| UX movil | Tabs deslizables |
