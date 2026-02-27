
-- ═══════════════════════════════════════════════════════════════════
-- BUG #3: Drop trigger duplicado en fights (race condition)
-- ═══════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trigger_update_record_on_finish ON fights;

-- ═══════════════════════════════════════════════════════════════════
-- BUG #4: Agregar columnas separadas por categoría
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE fighter_profiles 
  ADD COLUMN IF NOT EXISTS amateur_wins INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amateur_losses INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amateur_draws INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS semi_pro_wins INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS semi_pro_losses INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS semi_pro_draws INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pro_wins INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pro_losses INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pro_draws INT DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════
-- BUG #4 + #5: Reescribir update_single_fighter_record
-- - Escribe en columnas por categoría
-- - Actualiza totales agregados en record_wins/losses/draws
-- - Excluye NO_CONTEST de empates (Bug #5)
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_single_fighter_record(
  p_fighter_id UUID,
  p_fight_type TEXT
)
RETURNS VOID AS $$
DECLARE
  v_wins INT := 0;
  v_losses INT := 0;
  v_draws INT := 0;
  v_total_wins INT := 0;
  v_total_losses INT := 0;
  v_total_draws INT := 0;
BEGIN
  -- Calcular victorias para este fight_type
  SELECT COUNT(*) INTO v_wins
  FROM fights f
  WHERE f.status = 'finished'
    AND f.fight_type = p_fight_type
    AND f.winner_id = p_fighter_id
    AND (f.fighter_a_id = p_fighter_id OR f.fighter_b_id = p_fighter_id);

  -- Calcular derrotas para este fight_type
  SELECT COUNT(*) INTO v_losses
  FROM fights f
  WHERE f.status = 'finished'
    AND f.fight_type = p_fight_type
    AND f.winner_id IS NOT NULL
    AND f.winner_id != p_fighter_id
    AND (f.fighter_a_id = p_fighter_id OR f.fighter_b_id = p_fighter_id);

  -- BUG #5 FIX: Calcular empates excluyendo NO_CONTEST
  SELECT COUNT(*) INTO v_draws
  FROM fights f
  WHERE f.status = 'finished'
    AND f.fight_type = p_fight_type
    AND f.winner_id IS NULL
    AND (f.fighter_a_id = p_fighter_id OR f.fighter_b_id = p_fighter_id)
    AND NOT EXISTS (
      SELECT 1 FROM fight_results fr 
      WHERE fr.fight_id = f.id 
      AND fr.result_type = 'NO_CONTEST'
    );

  -- Escribir en columnas por categoría
  IF p_fight_type = 'AMATEUR' THEN
    UPDATE fighter_profiles SET
      amateur_wins = v_wins, amateur_losses = v_losses, amateur_draws = v_draws,
      updated_at = NOW()
    WHERE id = p_fighter_id;
  ELSIF p_fight_type = 'SEMI_PRO' THEN
    UPDATE fighter_profiles SET
      semi_pro_wins = v_wins, semi_pro_losses = v_losses, semi_pro_draws = v_draws,
      updated_at = NOW()
    WHERE id = p_fighter_id;
  ELSIF p_fight_type = 'PROFESSIONAL' THEN
    UPDATE fighter_profiles SET
      pro_wins = v_wins, pro_losses = v_losses, pro_draws = v_draws,
      updated_at = NOW()
    WHERE id = p_fighter_id;
  END IF;

  -- Actualizar totales agregados (suma de todas las categorías)
  SELECT 
    COALESCE(amateur_wins,0) + COALESCE(semi_pro_wins,0) + COALESCE(pro_wins,0),
    COALESCE(amateur_losses,0) + COALESCE(semi_pro_losses,0) + COALESCE(pro_losses,0),
    COALESCE(amateur_draws,0) + COALESCE(semi_pro_draws,0) + COALESCE(pro_draws,0)
  INTO v_total_wins, v_total_losses, v_total_draws
  FROM fighter_profiles WHERE id = p_fighter_id;

  UPDATE fighter_profiles SET
    record_wins = v_total_wins,
    record_losses = v_total_losses,
    record_draws = v_total_draws,
    record_type = p_fight_type
  WHERE id = p_fighter_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════
-- Recalcular todos los récords existentes con la nueva lógica
-- ═══════════════════════════════════════════════════════════════════
DO $$
DECLARE
  fighter_rec RECORD;
  ft TEXT;
BEGIN
  FOR ft IN SELECT UNNEST(ARRAY['AMATEUR', 'SEMI_PRO', 'PROFESSIONAL']) LOOP
    FOR fighter_rec IN 
      SELECT DISTINCT fp.id
      FROM fighter_profiles fp
      WHERE EXISTS (
        SELECT 1 FROM fights f
        WHERE f.status = 'finished' 
          AND f.fight_type = ft
          AND (f.fighter_a_id = fp.id OR f.fighter_b_id = fp.id)
      )
    LOOP
      PERFORM update_single_fighter_record(fighter_rec.id, ft);
    END LOOP;
  END LOOP;
END $$;
