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