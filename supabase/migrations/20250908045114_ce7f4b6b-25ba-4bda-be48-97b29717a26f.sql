-- Fix the admin authentication issue by bypassing RLS for admin updates
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile_v6(p_fighter_id uuid, p_profile_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  current_user_admin boolean := false;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if current user exists and is admin
  SELECT COALESCE(au.is_admin, false) INTO current_user_admin
  FROM public.app_user au 
  WHERE au.auth_user_id = current_user_id;

  -- If no user found or not admin, deny access
  IF current_user_admin IS FALSE OR current_user_admin IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update fighter profiles. Auth ID: %, Is Admin: %', current_user_id, current_user_admin;
  END IF;

  -- Disable RLS for this transaction to allow admin updates
  SET LOCAL row_security = OFF;

  -- Update the profile with record fields
  UPDATE public.fighter_profiles
  SET 
    first_name = COALESCE((p_profile_data->>'first_name')::text, first_name),
    last_name = COALESCE((p_profile_data->>'last_name')::text, last_name),
    nickname = CASE 
      WHEN p_profile_data ? 'nickname' AND p_profile_data->>'nickname' NOT IN ('', 'null') THEN
        (p_profile_data->>'nickname')::text
      WHEN p_profile_data ? 'nickname' AND p_profile_data->>'nickname' IN ('', 'null') THEN
        NULL
      ELSE nickname
    END,
    country = CASE 
      WHEN p_profile_data ? 'country' AND p_profile_data->>'country' NOT IN ('', 'null') THEN
        (p_profile_data->>'country')::text
      ELSE country
    END,
    weight_class = COALESCE((p_profile_data->>'weight_class')::text, weight_class),
    
    -- CRITICAL: Handle record fields properly
    record_wins = CASE 
      WHEN p_profile_data ? 'record_wins' THEN
        COALESCE((p_profile_data->>'record_wins')::integer, 0)
      ELSE record_wins
    END,
    record_losses = CASE 
      WHEN p_profile_data ? 'record_losses' THEN
        COALESCE((p_profile_data->>'record_losses')::integer, 0)
      ELSE record_losses
    END,
    record_draws = CASE 
      WHEN p_profile_data ? 'record_draws' THEN
        COALESCE((p_profile_data->>'record_draws')::integer, 0)
      ELSE record_draws
    END,
    
    -- Other important fields
    height_cm = CASE 
      WHEN p_profile_data ? 'height_cm' AND p_profile_data->>'height_cm' NOT IN ('0', '', 'null') THEN
        (p_profile_data->>'height_cm')::integer
      ELSE height_cm
    END,
    
    weight_kg = CASE 
      WHEN p_profile_data ? 'weight_kg' AND p_profile_data->>'weight_kg' NOT IN ('0', '', 'null') THEN
        (p_profile_data->>'weight_kg')::numeric
      ELSE weight_kg
    END,
    
    fighting_style = CASE 
      WHEN p_profile_data ? 'fighting_style' AND p_profile_data->>'fighting_style' NOT IN ('', 'null') THEN
        (p_profile_data->>'fighting_style')::text
      ELSE fighting_style
    END,
    
    gym_name = CASE 
      WHEN p_profile_data ? 'gym_name' AND p_profile_data->>'gym_name' NOT IN ('', 'null') THEN
        (p_profile_data->>'gym_name')::text
      ELSE gym_name
    END,
    
    updated_at = now()
  WHERE id = p_fighter_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fighter with ID % not found', p_fighter_id;
  END IF;
  
  RAISE NOTICE 'Successfully updated fighter % with wins: %, losses: %, draws: %', 
    p_fighter_id, 
    COALESCE((p_profile_data->>'record_wins')::integer, 0),
    COALESCE((p_profile_data->>'record_losses')::integer, 0),
    COALESCE((p_profile_data->>'record_draws')::integer, 0);
END;
$function$;