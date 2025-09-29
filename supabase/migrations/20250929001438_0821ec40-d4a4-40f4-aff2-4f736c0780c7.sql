-- Add additional profile fields and privacy settings to app_user table
ALTER TABLE public.app_user 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS profile_visibility JSONB DEFAULT '{"first_name": true, "last_name": true, "email": false, "phone": false, "birthdate": false, "bio": true, "avatar": true}'::jsonb;

-- Add comment to explain profile_visibility structure
COMMENT ON COLUMN public.app_user.profile_visibility IS 'JSON object controlling visibility of profile fields: {"field_name": boolean, ...}';

-- Update existing records to have default visibility settings
UPDATE public.app_user 
SET profile_visibility = '{"first_name": true, "last_name": true, "email": false, "phone": false, "birthdate": false, "bio": true, "avatar": true}'::jsonb
WHERE profile_visibility IS NULL;