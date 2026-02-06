-- Recalcular puntos con la fórmula correcta: Victoria +3, Empate +1, Derrota -1

UPDATE fighter_rankings
SET points = CASE 
  WHEN ro.discipline = 'MMA' THEN 
    (COALESCE(fp.mma_record_wins, 0) * 3) + 
    (COALESCE(fp.mma_record_draws, 0) * 1) - 
    (COALESCE(fp.mma_record_losses, 0) * 1)
  WHEN ro.discipline = 'Boxeo' THEN 
    (COALESCE(fp.boxeo_record_wins, 0) * 3) + 
    (COALESCE(fp.boxeo_record_draws, 0) * 1) - 
    (COALESCE(fp.boxeo_record_losses, 0) * 1)
  ELSE 0
END
FROM fighter_profiles fp, ranking_organizations ro
WHERE fighter_rankings.fighter_id = fp.id
  AND fighter_rankings.organization_id = ro.id
  AND fighter_rankings.is_active = true;