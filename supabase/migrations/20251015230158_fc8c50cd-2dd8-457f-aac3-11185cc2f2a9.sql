-- Modificar trigger handle_new_user para crear solo usuarios básicos (no fighters automáticamente)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Nueva función simplificada: crear solo app_user, sin fighter_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert into app_user table when a new auth user is created
  INSERT INTO public.app_user (
    auth_user_id,
    email,
    handle,
    first_name,
    last_name,
    country,
    birthdate,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'handle', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'country', 'HN'),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'birthdate' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'birthdate')::date 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data ->> 'avatar_url',
    NOW(),
    NOW()
  );
  
  -- Los fighter_profiles se crearán solo cuando el usuario solicite su Fighter ID
  -- NO crear automáticamente fighter_profiles
  
  RETURN NEW;
END;
$$;

-- Recrear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();