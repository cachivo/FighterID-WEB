-- Función para eliminación segura de licencias (solo administradores)
CREATE OR REPLACE FUNCTION public.delete_fighter_license(p_license_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Solo admins pueden eliminar licencias
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete licenses';
  END IF;

  -- Eliminar documentos de licencia primero
  DELETE FROM public.license_documents WHERE license_id = p_license_id;
  
  -- Eliminar tokens de verificación
  DELETE FROM public.license_verification_tokens WHERE license_id = p_license_id;
  
  -- Eliminar certificaciones médicas
  DELETE FROM public.medical_certifications WHERE license_id = p_license_id;
  
  -- Eliminar reservas de peleas
  DELETE FROM public.fight_bookings WHERE license_id = p_license_id;
  
  -- Log de auditoría antes de eliminar
  INSERT INTO public.license_audit_log (
    license_id, action, reason, performed_by
  ) VALUES (
    p_license_id, 'DELETED', 'License deleted by admin', auth.uid()
  );
  
  -- Eliminar la licencia
  DELETE FROM public.fighter_licenses WHERE id = p_license_id;
END;
$function$

-- Función para actualización administrativa de perfiles de peleadores
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile(
  p_fighter_id uuid,
  p_profile_data jsonb
)
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

  -- Actualizar el perfil con los datos proporcionados
  UPDATE public.fighter_profiles
  SET 
    first_name = COALESCE((p_profile_data->>'first_name')::text, first_name),
    last_name = COALESCE((p_profile_data->>'last_name')::text, last_name),
    nickname = COALESCE((p_profile_data->>'nickname')::text, nickname),
    country = COALESCE((p_profile_data->>'country')::text, country),
    weight_class = COALESCE((p_profile_data->>'weight_class')::text, weight_class),
    height_cm = COALESCE((p_profile_data->>'height_cm')::integer, height_cm),
    weight_kg = COALESCE((p_profile_data->>'weight_kg')::numeric, weight_kg),
    reach_cm = COALESCE((p_profile_data->>'reach_cm')::integer, reach_cm),
    fighting_style = COALESCE((p_profile_data->>'fighting_style')::text, fighting_style),
    bio = COALESCE((p_profile_data->>'bio')::text, bio),
    avatar_url = COALESCE((p_profile_data->>'avatar_url')::text, avatar_url),
    record_wins = COALESCE((p_profile_data->>'record_wins')::integer, record_wins),
    record_losses = COALESCE((p_profile_data->>'record_losses')::integer, record_losses),
    record_draws = COALESCE((p_profile_data->>'record_draws')::integer, record_draws),
    elo_rating = COALESCE((p_profile_data->>'elo_rating')::integer, elo_rating),
    updated_at = now()
  WHERE id = p_fighter_id;
END;
$function$