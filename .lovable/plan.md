
# Plan: Sistema de Ranking por Puntos - Fighter ID

## Resumen Ejecutivo

Implementar un sistema de ranking profesional basado **exclusivamente en puntos** con trazabilidad completa por pelea. Sin porcentajes, sin win rates, solo puntos acumulados.

---

## Arquitectura del Sistema

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        RANKINGS ACTIVOS                             │
├─────────────────────────────────────────────────────────────────────┤
│  UCC_MMA          │  BDG_PRO_BOX       │  HHF_AMATEUR               │
│  MMA Profesional  │  Boxeo Profesional │  Boxeo Amateur             │
│  UCC Honduras     │  BDG Pro Box       │  Honduras Hood Fights      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     FLUJO DE PUNTOS                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   1. PELEA FINALIZADA                                               │
│         ↓                                                           │
│   2. calculate_fight_points() → Calcula puntos según reglas         │
│         ↓                                                           │
│   3. INSERT → fighter_points_log (inmutable)                        │
│         ↓                                                           │
│   4. TRIGGER → update_fighter_points_balance()                      │
│         ↓                                                           │
│   5. Actualiza fighter_points_balance (para queries rápidas)        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Schema de Base de Datos

### 1.1 Tabla `rankings` - Los 3 rankings activos

```sql
CREATE TABLE IF NOT EXISTS public.rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  discipline text NOT NULL,
  organization text,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Datos iniciales
INSERT INTO public.rankings (code, name, discipline, organization, description) VALUES
  ('UCC_MMA', 'UCC MMA Profesional', 'MMA', 'UCC Honduras', 'Ranking oficial de MMA profesional'),
  ('BDG_PRO_BOX', 'BDG Boxeo Profesional', 'Boxeo', 'BDG Pro Box', 'Ranking oficial de boxeo profesional'),
  ('HHF_AMATEUR', 'Honduras Hood Fights', 'Boxeo', 'HHF', 'Ranking de boxeo amateur callejero');
```

### 1.2 Tabla `ranking_point_rules` - Reglas configurables por admin

```sql
CREATE TABLE IF NOT EXISTS public.ranking_point_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id uuid REFERENCES public.rankings(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  
  -- Puntos base
  participation_points int NOT NULL DEFAULT 5,
  win_points int NOT NULL DEFAULT 10,
  loss_points int NOT NULL DEFAULT 0,
  draw_points int NOT NULL DEFAULT 3,
  
  -- Bonos por tipo de finalización
  ko_tko_bonus int NOT NULL DEFAULT 5,
  submission_bonus int NOT NULL DEFAULT 5,
  decision_bonus int NOT NULL DEFAULT 0,
  
  -- Multiplicadores por nivel de oponente
  opponent_pro_multiplier numeric(4,2) DEFAULT 1.5,
  opponent_semipro_multiplier numeric(4,2) DEFAULT 1.2,
  opponent_amateur_multiplier numeric(4,2) DEFAULT 1.0,
  
  -- Penalidades
  inactivity_months int DEFAULT 9,
  inactivity_penalty_percent int DEFAULT 10,
  
  -- Auditoría
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  UNIQUE(ranking_id, version)
);
```

### 1.3 Tabla `fighter_points_log` - Log inmutable de puntos

```sql
CREATE TABLE IF NOT EXISTS public.fighter_points_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id uuid NOT NULL REFERENCES public.fighter_profiles(id) ON DELETE CASCADE,
  ranking_id uuid NOT NULL REFERENCES public.rankings(id) ON DELETE CASCADE,
  fight_id uuid REFERENCES public.fights(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  
  -- Desglose de puntos
  participation_points int NOT NULL DEFAULT 0,
  result_points int NOT NULL DEFAULT 0,
  bonus_points int NOT NULL DEFAULT 0,
  opponent_multiplier numeric(4,2) DEFAULT 1.0,
  total_points numeric(8,2) NOT NULL,
  
  -- Contexto
  opponent_id uuid REFERENCES public.fighter_profiles(id),
  opponent_level text,
  result_type text NOT NULL, -- 'win' | 'loss' | 'draw' | 'nc' | 'penalty'
  finish_method text,
  reason text, -- Para penalidades o ajustes manuales
  
  -- Auditoría
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Índices para queries rápidas
CREATE INDEX idx_points_log_fighter ON public.fighter_points_log(fighter_id);
CREATE INDEX idx_points_log_ranking ON public.fighter_points_log(ranking_id);
CREATE INDEX idx_points_log_fight ON public.fighter_points_log(fight_id);
CREATE INDEX idx_points_log_created ON public.fighter_points_log(created_at DESC);
```

### 1.4 Tabla `fighter_points_balance` - Balance actual (para ranking queries)

```sql
CREATE TABLE IF NOT EXISTS public.fighter_points_balance (
  fighter_id uuid NOT NULL REFERENCES public.fighter_profiles(id) ON DELETE CASCADE,
  ranking_id uuid NOT NULL REFERENCES public.rankings(id) ON DELETE CASCADE,
  
  -- Balance
  total_points numeric(10,2) DEFAULT 0,
  fights_count int DEFAULT 0,
  wins_count int DEFAULT 0,
  losses_count int DEFAULT 0,
  draws_count int DEFAULT 0,
  
  -- Estado
  status text DEFAULT 'ACTIVE', -- ACTIVE | INACTIVE | FROZEN | SUSPENDED
  last_fight_date date,
  last_points_update timestamptz,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (fighter_id, ranking_id)
);

CREATE INDEX idx_balance_ranking_points ON public.fighter_points_balance(ranking_id, total_points DESC);
CREATE INDEX idx_balance_status ON public.fighter_points_balance(status);
```

### 1.5 Columna `fighter_level` en fighter_profiles

```sql
-- Agregar nivel de peleador (1=Amateur, 2=Semi-Pro, 3=Profesional)
ALTER TABLE public.fighter_profiles 
ADD COLUMN IF NOT EXISTS fighter_level int NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.fighter_profiles.fighter_level IS 
'1=Amateur, 2=Semi-profesional, 3=Profesional';
```

---

## Fase 2: Funciones de Base de Datos

### 2.1 Función de cálculo de puntos

```sql
CREATE OR REPLACE FUNCTION calculate_fight_points(
  p_ranking_id uuid,
  p_result_type text,
  p_finish_method text,
  p_opponent_level int
) RETURNS TABLE (
  participation_points int,
  result_points int,
  bonus_points int,
  opponent_multiplier numeric,
  total_points numeric
) AS $$
DECLARE
  v_rules record;
  v_participation int;
  v_result int;
  v_bonus int;
  v_multiplier numeric;
BEGIN
  -- Obtener reglas activas del ranking
  SELECT * INTO v_rules
  FROM public.ranking_point_rules
  WHERE ranking_id = p_ranking_id AND is_active = true
  ORDER BY version DESC
  LIMIT 1;

  IF v_rules IS NULL THEN
    RAISE EXCEPTION 'No active rules found for ranking %', p_ranking_id;
  END IF;

  -- Puntos de participación (siempre)
  v_participation := v_rules.participation_points;

  -- Puntos por resultado
  v_result := CASE p_result_type
    WHEN 'win' THEN v_rules.win_points
    WHEN 'loss' THEN v_rules.loss_points
    WHEN 'draw' THEN v_rules.draw_points
    ELSE 0
  END;

  -- Bonos por finalización (solo si ganó)
  v_bonus := 0;
  IF p_result_type = 'win' THEN
    v_bonus := CASE 
      WHEN p_finish_method IN ('KO', 'TKO') THEN v_rules.ko_tko_bonus
      WHEN p_finish_method = 'Submission' THEN v_rules.submission_bonus
      ELSE v_rules.decision_bonus
    END;
  END IF;

  -- Multiplicador por nivel de oponente
  v_multiplier := CASE p_opponent_level
    WHEN 3 THEN v_rules.opponent_pro_multiplier
    WHEN 2 THEN v_rules.opponent_semipro_multiplier
    ELSE v_rules.opponent_amateur_multiplier
  END;

  RETURN QUERY SELECT 
    v_participation,
    v_result,
    v_bonus,
    v_multiplier,
    (v_participation + v_result + v_bonus)::numeric * v_multiplier;
END;
$$ LANGUAGE plpgsql;
```

### 2.2 Trigger para actualizar balance

```sql
CREATE OR REPLACE FUNCTION update_fighter_points_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.fighter_points_balance (
    fighter_id, 
    ranking_id, 
    total_points, 
    fights_count,
    wins_count,
    losses_count,
    draws_count,
    last_fight_date,
    last_points_update,
    status
  )
  VALUES (
    NEW.fighter_id,
    NEW.ranking_id,
    NEW.total_points,
    CASE WHEN NEW.fight_id IS NOT NULL THEN 1 ELSE 0 END,
    CASE WHEN NEW.result_type = 'win' THEN 1 ELSE 0 END,
    CASE WHEN NEW.result_type = 'loss' THEN 1 ELSE 0 END,
    CASE WHEN NEW.result_type = 'draw' THEN 1 ELSE 0 END,
    CASE WHEN NEW.fight_id IS NOT NULL THEN CURRENT_DATE ELSE NULL END,
    NOW(),
    'ACTIVE'
  )
  ON CONFLICT (fighter_id, ranking_id)
  DO UPDATE SET
    total_points = fighter_points_balance.total_points + NEW.total_points,
    fights_count = fighter_points_balance.fights_count + 
      CASE WHEN NEW.fight_id IS NOT NULL THEN 1 ELSE 0 END,
    wins_count = fighter_points_balance.wins_count + 
      CASE WHEN NEW.result_type = 'win' THEN 1 ELSE 0 END,
    losses_count = fighter_points_balance.losses_count + 
      CASE WHEN NEW.result_type = 'loss' THEN 1 ELSE 0 END,
    draws_count = fighter_points_balance.draws_count + 
      CASE WHEN NEW.result_type = 'draw' THEN 1 ELSE 0 END,
    last_fight_date = CASE 
      WHEN NEW.fight_id IS NOT NULL THEN CURRENT_DATE 
      ELSE fighter_points_balance.last_fight_date 
    END,
    last_points_update = NOW(),
    status = 'ACTIVE',
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_points_balance
AFTER INSERT ON public.fighter_points_log
FOR EACH ROW
EXECUTE FUNCTION update_fighter_points_balance();
```

### 2.3 Función para aplicar penalidad por inactividad

```sql
CREATE OR REPLACE FUNCTION apply_inactivity_penalties()
RETURNS void AS $$
DECLARE
  v_ranking record;
  v_rules record;
  v_affected_count int;
BEGIN
  FOR v_ranking IN SELECT * FROM public.rankings WHERE active = true LOOP
    -- Obtener reglas activas
    SELECT * INTO v_rules
    FROM public.ranking_point_rules
    WHERE ranking_id = v_ranking.id AND is_active = true
    ORDER BY version DESC
    LIMIT 1;

    IF v_rules IS NOT NULL THEN
      -- Aplicar penalidad a peleadores inactivos
      WITH frozen_fighters AS (
        UPDATE public.fighter_points_balance
        SET 
          status = 'FROZEN',
          total_points = total_points * (1 - v_rules.inactivity_penalty_percent::numeric / 100),
          updated_at = NOW()
        WHERE 
          ranking_id = v_ranking.id
          AND status = 'ACTIVE'
          AND last_fight_date < CURRENT_DATE - (v_rules.inactivity_months || ' months')::interval
        RETURNING fighter_id
      )
      SELECT count(*) INTO v_affected_count FROM frozen_fighters;

      -- Registrar en log si hubo cambios
      IF v_affected_count > 0 THEN
        INSERT INTO public.fighter_points_log (
          fighter_id, ranking_id, total_points, result_type, reason, created_at
        )
        SELECT 
          fighter_id, 
          v_ranking.id,
          -total_points * v_rules.inactivity_penalty_percent::numeric / 100,
          'penalty',
          'Penalidad por inactividad (' || v_rules.inactivity_months || ' meses)',
          NOW()
        FROM public.fighter_points_balance
        WHERE ranking_id = v_ranking.id AND status = 'FROZEN';
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## Fase 3: Políticas RLS

```sql
-- Rankings: lectura pública
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY rankings_read ON public.rankings FOR SELECT USING (true);
CREATE POLICY rankings_admin_write ON public.rankings 
  FOR ALL USING (public.is_admin());

-- Reglas de puntos: lectura pública, escritura admin
ALTER TABLE public.ranking_point_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY rules_read ON public.ranking_point_rules FOR SELECT USING (true);
CREATE POLICY rules_admin_write ON public.ranking_point_rules 
  FOR ALL USING (public.is_admin());

-- Log de puntos: lectura pública (transparencia), escritura admin
ALTER TABLE public.fighter_points_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY points_log_read ON public.fighter_points_log FOR SELECT USING (true);
CREATE POLICY points_log_admin_write ON public.fighter_points_log 
  FOR INSERT WITH CHECK (public.is_admin());

-- Balance: lectura pública
ALTER TABLE public.fighter_points_balance ENABLE ROW LEVEL SECURITY;
CREATE POLICY balance_read ON public.fighter_points_balance FOR SELECT USING (true);
CREATE POLICY balance_admin_write ON public.fighter_points_balance 
  FOR ALL USING (public.is_admin());
```

---

## Fase 4: Hooks en Frontend

### 4.1 Hook `useRankingSystem.tsx`

| Función | Descripción |
|---------|-------------|
| `useRankings()` | Lista los 3 rankings activos |
| `useRankingLeaderboard(code)` | Obtiene el leaderboard de un ranking específico |
| `useFighterPointsHistory(fighterId)` | Historial de puntos de un peleador |
| `useRecordFightPoints()` | Mutation para registrar puntos post-pelea |

### 4.2 Actualizar `useFighterRanking.tsx`

Modificar el hook existente para usar el nuevo sistema:

```typescript
// ANTES (basado en récord del perfil)
const ranking_points = (wins * 3) + (draws * 1) - (losses * 1);

// DESPUÉS (basado en fighter_points_balance)
const { data } = await supabase
  .from('fighter_points_balance')
  .select(`
    fighter_id,
    total_points,
    fights_count,
    status,
    fighter_profiles!inner (
      first_name, last_name, nickname, avatar_url, 
      weight_class, fighter_level
    )
  `)
  .eq('ranking_id', rankingId)
  .eq('status', 'ACTIVE')
  .order('total_points', { ascending: false });
```

---

## Fase 5: Edge Function para Inactividad

### `apply-inactivity-penalties/index.ts`

Edge function programada (CRON) para ejecutar mensualmente:

```typescript
// Llamar a la función de DB
const { error } = await supabase.rpc('apply_inactivity_penalties');
```

---

## Fase 6: UI Components

### 6.1 Componentes Nuevos

| Componente | Descripción |
|------------|-------------|
| `RankingSelector.tsx` | Tabs para seleccionar ranking (UCC, BDG, HHF) |
| `RankingLeaderboard.tsx` | Lista de peleadores ordenados por puntos |
| `FighterPointsCard.tsx` | Muestra desglose de puntos de un peleador |
| `PointsHistoryTable.tsx` | Historial de todas las transacciones de puntos |
| `AdminPointRulesEditor.tsx` | Panel admin para editar reglas de puntos |

### 6.2 Actualizar `Ranking.tsx` (Homepage)

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     RANKINGS OFICIALES                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │
│  │   UCC MMA     │  │  BDG PRO BOX  │  │  HHF AMATEUR  │          │
│  │   (activo)    │  │               │  │               │          │
│  └───────────────┘  └───────────────┘  └───────────────┘          │
│                                                                     │
│  #1 🏆 Juan Pérez        250.5 pts    Pro                          │
│  #2    María López       198.0 pts    Pro                          │
│  #3    Pedro Rodríguez   175.5 pts    Semi                         │
│  #4    Ana García        150.0 pts    Amateur                      │
│                                                                     │
│  ▼ Ver historial de puntos                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| Migration SQL | CREATE | Tablas, funciones, triggers, RLS |
| `src/hooks/useRankingSystem.tsx` | CREATE | Nuevo hook para sistema de puntos |
| `src/hooks/useFighterRanking.tsx` | MODIFY | Usar balance de puntos en vez de récord |
| `src/components/ranking/RankingSelector.tsx` | CREATE | Selector de los 3 rankings |
| `src/components/ranking/RankingLeaderboard.tsx` | CREATE | Leaderboard por puntos |
| `src/components/ranking/PointsHistoryTable.tsx` | CREATE | Historial de puntos |
| `src/components/sections/Ranking.tsx` | MODIFY | Integrar nuevo sistema |
| `src/pages/admin/RankingManagement.tsx` | CREATE | Admin para gestionar rankings |
| `supabase/functions/apply-inactivity-penalties/` | CREATE | CRON para penalidades |
| `supabase/config.toml` | MODIFY | Agregar nueva edge function |

---

## Query Final de Ranking (LA ÚNICA VÁLIDA)

```sql
SELECT 
  f.first_name,
  f.last_name,
  f.nickname,
  f.avatar_url,
  f.fighter_level,
  b.total_points,
  b.fights_count,
  b.wins_count,
  b.status
FROM public.fighter_points_balance b
JOIN public.fighter_profiles f ON f.id = b.fighter_id
WHERE 
  b.ranking_id = :ranking_id
  AND b.status = 'ACTIVE'
ORDER BY b.total_points DESC;
```

**Si el ORDER BY no es por `total_points`, el sistema está MAL implementado.**

---

## Reglas de Puntos por Defecto

| Concepto | UCC MMA | BDG Pro | HHF Amateur |
|----------|---------|---------|-------------|
| Participación | 5 | 5 | 3 |
| Victoria | 10 | 10 | 8 |
| Derrota | 0 | 0 | 0 |
| Empate | 3 | 3 | 2 |
| Bonus KO/TKO | 5 | 5 | 3 |
| Bonus Submission | 5 | 0 | 0 |
| Mult. vs Pro | 1.5x | 1.5x | 1.0x |
| Mult. vs Semi | 1.2x | 1.2x | 1.0x |
| Inactividad | 9 meses | 9 meses | 6 meses |
| Penalidad | -10% | -10% | -5% |

---

## Criterios de Éxito

- [ ] NO existe win rate en ninguna parte del código
- [ ] Todos los puntos tienen referencia a `fight_id`
- [ ] Balance se actualiza automáticamente via trigger
- [ ] Admin puede modificar reglas sin tocar código
- [ ] Penalidad de inactividad se ejecuta automáticamente
- [ ] Rankings separados por disciplina/organización
- [ ] Historial de puntos 100% auditable
