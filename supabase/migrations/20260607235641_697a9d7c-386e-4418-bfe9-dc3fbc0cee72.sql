-- Function and trigger to keep fighter_profiles in sync with fighter_licenses
CREATE OR REPLACE FUNCTION public.sync_fighter_profile_license()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fighter_id uuid;
  v_best record;
  v_new_status text;
BEGIN
  -- Determine affected fighter_id (handle INSERT/UPDATE/DELETE)
  v_fighter_id := COALESCE(NEW.fighter_id, OLD.fighter_id);
  IF v_fighter_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Pick best license: prefer is_primary, then ACTIVE > PENDING_REVIEW > APPLIED > SUSPENDED > others, then newest
  SELECT id, license_number, status::text AS status
    INTO v_best
  FROM public.fighter_licenses
  WHERE fighter_id = v_fighter_id
  ORDER BY
    CASE WHEN is_primary THEN 0 ELSE 1 END,
    CASE status::text
      WHEN 'ACTIVE' THEN 1
      WHEN 'PENDING_REVIEW' THEN 2
      WHEN 'APPLIED' THEN 3
      WHEN 'SUSPENDED' THEN 4
      WHEN 'REVOKED' THEN 5
      WHEN 'EXPIRED' THEN 6
      ELSE 7
    END,
    created_at DESC
  LIMIT 1;

  IF v_best.id IS NULL THEN
    -- No licenses left: clear references on profile
    UPDATE public.fighter_profiles
       SET primary_license_id = NULL,
           license_status = NULL,
           license_number = NULL
     WHERE id = v_fighter_id
       AND (primary_license_id IS NOT NULL
            OR license_status IS NOT NULL
            OR license_number IS NOT NULL);
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_new_status := CASE v_best.status
    WHEN 'ACTIVE' THEN 'active'
    WHEN 'PENDING_REVIEW' THEN 'pending'
    WHEN 'APPLIED' THEN 'pending'
    WHEN 'SUSPENDED' THEN 'suspended'
    WHEN 'REVOKED' THEN 'expired'
    WHEN 'EXPIRED' THEN 'expired'
    ELSE NULL
  END;

  UPDATE public.fighter_profiles
     SET primary_license_id = v_best.id,
         license_status = v_new_status,
         license_number = v_best.license_number
   WHERE id = v_fighter_id
     AND (primary_license_id IS DISTINCT FROM v_best.id
          OR license_status IS DISTINCT FROM v_new_status
          OR license_number IS DISTINCT FROM v_best.license_number);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_fighter_profile_license ON public.fighter_licenses;
CREATE TRIGGER trg_sync_fighter_profile_license
AFTER INSERT OR UPDATE OR DELETE ON public.fighter_licenses
FOR EACH ROW EXECUTE FUNCTION public.sync_fighter_profile_license();