ALTER TABLE public.fighter_profiles
  DROP CONSTRAINT IF EXISTS fighter_profiles_license_status_check;
ALTER TABLE public.fighter_profiles
  ADD CONSTRAINT fighter_profiles_license_status_check
  CHECK (license_status IS NULL OR license_status = ANY (ARRAY['active','pending','suspended','expired']));