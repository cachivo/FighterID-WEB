-- Phase 1: Fix inactive fighters with active licenses
UPDATE public.fighter_profiles 
SET active = true 
WHERE id IN (
  SELECT fp.id 
  FROM fighter_profiles fp
  JOIN fighter_licenses fl ON fp.id = fl.fighter_id 
  WHERE fp.active = false 
  AND fl.status = 'ACTIVE'
  AND fl.is_primary = true
);

-- Phase 2: Create app_user entries for fighters without auth accounts
-- Note: We'll create minimal user entries, real users should complete registration properly
INSERT INTO public.app_user (id, email, handle, auth_user_id)
SELECT 
  gen_random_uuid() as id,
  LOWER(fp.first_name || '.' || fp.last_name || '@temp.battlegyms.com') as email,
  LOWER(fp.first_name || '_' || fp.last_name) as handle,
  NULL as auth_user_id -- These will need proper auth setup later
FROM fighter_profiles fp
JOIN fighter_licenses fl ON fp.id = fl.fighter_id
WHERE fp.user_id IS NULL 
AND fl.status = 'ACTIVE'
AND fl.is_primary = true
ON CONFLICT DO NOTHING;

-- Phase 3: Link fighters to their new app_user entries
UPDATE public.fighter_profiles 
SET user_id = au.id
FROM public.app_user au
WHERE fighter_profiles.user_id IS NULL
AND au.email = LOWER(fighter_profiles.first_name || '.' || fighter_profiles.last_name || '@temp.battlegyms.com')
AND EXISTS (
  SELECT 1 FROM fighter_licenses fl 
  WHERE fl.fighter_id = fighter_profiles.id 
  AND fl.status = 'ACTIVE' 
  AND fl.is_primary = true
);