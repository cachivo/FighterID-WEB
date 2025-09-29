-- Eliminar la política restrictiva actual que solo permite admins
DROP POLICY IF EXISTS "Solo administradores pueden actualizar perfiles de peleadores" ON public.fighter_profiles;

-- Crear nueva política que permite a usuarios actualizar su propio perfil Y a admins actualizar cualquier perfil
CREATE POLICY "Users can update their own fighter profile"
ON public.fighter_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.app_user 
    WHERE app_user.id = fighter_profiles.user_id 
    AND app_user.auth_user_id = auth.uid()
  ) 
  OR is_admin()
);