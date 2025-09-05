-- Fix the admin_update_fighter_profile function to properly handle discipline NULL/empty values
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile(p_fighter_id uuid, p_profile_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Solo admins pueden usar esta función
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update fighter profiles';
  END IF;

  -- Actualizar el perfil con manejo mejorado de valores NULL
  UPDATE public.fighter_profiles
  SET 
    first_name = COALESCE((p_profile_data->>'first_name')::text, first_name),
    last_name = COALESCE((p_profile_data->>'last_name')::text, last_name),
    nickname = COALESCE((p_profile_data->>'nickname')::text, nickname),
    country = COALESCE((p_profile_data->>'country')::text, country),
    weight_class = COALESCE((p_profile_data->>'weight_class')::text, weight_class),
    avatar_url = COALESCE((p_profile_data->>'avatar_url')::text, avatar_url),
    record_wins = COALESCE((p_profile_data->>'record_wins')::integer, record_wins),
    record_losses = COALESCE((p_profile_data->>'record_losses')::integer, record_losses),
    record_draws = COALESCE((p_profile_data->>'record_draws')::integer, record_draws),
    elo_rating = COALESCE((p_profile_data->>'elo_rating')::integer, elo_rating),
    -- Manejo mejorado para discipline: permite NULL y valida enum correctamente
    discipline = CASE 
      WHEN p_profile_data ? 'discipline' THEN
        CASE 
          WHEN p_profile_data->>'discipline' IS NULL OR p_profile_data->>'discipline' = '' OR p_profile_data->>'discipline' = 'null' THEN NULL
          WHEN p_profile_data->>'discipline' IN ('MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro') THEN 
            (p_profile_data->>'discipline')::discipline_type
          ELSE discipline -- Keep current value if invalid
        END
      ELSE discipline -- No change if discipline key not present
    END,
    updated_at = now()
  WHERE id = p_fighter_id;
  
  -- Verificar que se actualizó al menos una fila
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fighter profile not found with id: %', p_fighter_id;
  END IF;
END;
$function$