
-- Repair Jonathan Mejia and other affected fighters
-- Fix Boxeo fighters with missing discipline records
UPDATE public.fighter_profiles
SET 
  boxeo_record_wins = record_wins,
  boxeo_record_losses = record_losses,
  boxeo_record_draws = record_draws
WHERE discipline = 'Boxeo' 
  AND COALESCE(boxeo_record_wins, 0) = 0 
  AND record_wins > 0;

-- Fix MMA fighters with missing discipline records
UPDATE public.fighter_profiles
SET 
  mma_record_wins = record_wins,
  mma_record_losses = record_losses,
  mma_record_draws = record_draws
WHERE discipline = 'MMA' 
  AND COALESCE(mma_record_wins, 0) = 0 
  AND record_wins > 0;

-- Recalculate ranking points for repaired fighters
UPDATE public.fighter_rankings fr
SET points = GREATEST(0,
  CASE 
    WHEN fp.discipline = 'MMA' THEN 
      (COALESCE(fp.mma_record_wins, 0) * 3) + (COALESCE(fp.mma_record_draws, 0)) + (COALESCE(fp.mma_record_losses, 0) * -1)
    WHEN fp.discipline = 'Boxeo' THEN 
      (COALESCE(fp.boxeo_record_wins, 0) * 3) + (COALESCE(fp.boxeo_record_draws, 0)) + (COALESCE(fp.boxeo_record_losses, 0) * -1)
    ELSE 
      (COALESCE(fp.record_wins, 0) * 3) + (COALESCE(fp.record_draws, 0)) + (COALESCE(fp.record_losses, 0) * -1)
  END
)
FROM public.fighter_profiles fp
WHERE fr.fighter_id = fp.id
  AND fr.is_active = true
  AND fr.points = 0
  AND (fp.record_wins > 0 OR fp.mma_record_wins > 0 OR fp.boxeo_record_wins > 0);
