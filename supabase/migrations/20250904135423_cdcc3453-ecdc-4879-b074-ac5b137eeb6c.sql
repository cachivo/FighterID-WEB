-- Update RLS policy to only allow admins to edit fighter profiles
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil de peleador" ON public.fighter_profiles;

CREATE POLICY "Solo administradores pueden actualizar perfiles de peleadores" 
ON public.fighter_profiles 
FOR UPDATE 
USING (is_admin());