CREATE OR REPLACE FUNCTION public.sync_official_record()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE d text := NEW.discipline::text;
BEGIN
  IF d NOT IN ('Boxeo','MMA') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF d = 'Boxeo' THEN
      NEW.boxeo_record_wins := greatest(coalesce(NEW.boxeo_record_wins,0), coalesce(NEW.record_wins,0));
      NEW.boxeo_record_losses := greatest(coalesce(NEW.boxeo_record_losses,0), coalesce(NEW.record_losses,0));
      NEW.boxeo_record_draws := greatest(coalesce(NEW.boxeo_record_draws,0), coalesce(NEW.record_draws,0));
    ELSE
      NEW.mma_record_wins := greatest(coalesce(NEW.mma_record_wins,0), coalesce(NEW.record_wins,0));
      NEW.mma_record_losses := greatest(coalesce(NEW.mma_record_losses,0), coalesce(NEW.record_losses,0));
      NEW.mma_record_draws := greatest(coalesce(NEW.mma_record_draws,0), coalesce(NEW.record_draws,0));
    END IF;
  ELSE
    -- Discipline columns are the source of truth; if only legacy columns changed, push them to the discipline.
    IF d = 'Boxeo' THEN
      IF (NEW.boxeo_record_wins, NEW.boxeo_record_losses, NEW.boxeo_record_draws) IS NOT DISTINCT FROM (OLD.boxeo_record_wins, OLD.boxeo_record_losses, OLD.boxeo_record_draws)
         AND (NEW.record_wins, NEW.record_losses, NEW.record_draws) IS DISTINCT FROM (OLD.record_wins, OLD.record_losses, OLD.record_draws)
         AND NEW.discipline IS NOT DISTINCT FROM OLD.discipline THEN
        NEW.boxeo_record_wins := NEW.record_wins; NEW.boxeo_record_losses := NEW.record_losses; NEW.boxeo_record_draws := NEW.record_draws;
      END IF;
    ELSE
      IF (NEW.mma_record_wins, NEW.mma_record_losses, NEW.mma_record_draws) IS NOT DISTINCT FROM (OLD.mma_record_wins, OLD.mma_record_losses, OLD.mma_record_draws)
         AND (NEW.record_wins, NEW.record_losses, NEW.record_draws) IS DISTINCT FROM (OLD.record_wins, OLD.record_losses, OLD.record_draws)
         AND NEW.discipline IS NOT DISTINCT FROM OLD.discipline THEN
        NEW.mma_record_wins := NEW.record_wins; NEW.mma_record_losses := NEW.record_losses; NEW.mma_record_draws := NEW.record_draws;
      END IF;
    END IF;
  END IF;
  IF d = 'Boxeo' THEN
    NEW.record_wins := coalesce(NEW.boxeo_record_wins,0); NEW.record_losses := coalesce(NEW.boxeo_record_losses,0); NEW.record_draws := coalesce(NEW.boxeo_record_draws,0);
  ELSE
    NEW.record_wins := coalesce(NEW.mma_record_wins,0); NEW.record_losses := coalesce(NEW.mma_record_losses,0); NEW.record_draws := coalesce(NEW.mma_record_draws,0);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_sync_official_record ON public.fighter_profiles;
CREATE TRIGGER trg_sync_official_record BEFORE INSERT OR UPDATE ON public.fighter_profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_official_record();

-- Backfill: take the higher value per field into the discipline record (trigger mirrors it to legacy).
UPDATE public.fighter_profiles SET
  boxeo_record_wins = greatest(coalesce(boxeo_record_wins,0), coalesce(record_wins,0)),
  boxeo_record_losses = greatest(coalesce(boxeo_record_losses,0), coalesce(record_losses,0)),
  boxeo_record_draws = greatest(coalesce(boxeo_record_draws,0), coalesce(record_draws,0))
WHERE discipline::text = 'Boxeo';
UPDATE public.fighter_profiles SET
  mma_record_wins = greatest(coalesce(mma_record_wins,0), coalesce(record_wins,0)),
  mma_record_losses = greatest(coalesce(mma_record_losses,0), coalesce(record_losses,0)),
  mma_record_draws = greatest(coalesce(mma_record_draws,0), coalesce(record_draws,0))
WHERE discipline::text = 'MMA';