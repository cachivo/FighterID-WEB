
-- Eliminar usuario de prueba blackboxdjhm@gmail.com
-- Esto eliminará en cascada todos los registros relacionados

DO $$
DECLARE
  v_auth_user_id uuid := '8e759783-530f-453b-80c8-bc5819af5af2';
  v_app_user_id uuid := '50778d5a-568a-4222-8be5-65b4d9519be1';
BEGIN
  -- Eliminar perfiles de fighter asociados (si existen)
  DELETE FROM public.fighter_profiles WHERE user_id = v_app_user_id;
  
  -- Eliminar roles de usuario
  DELETE FROM public.user_roles WHERE user_id = v_auth_user_id;
  
  -- Eliminar de app_user
  DELETE FROM public.app_user WHERE id = v_app_user_id;
  
  -- Eliminar de auth.users (esto eliminará automáticamente otros registros relacionados)
  DELETE FROM auth.users WHERE id = v_auth_user_id;
  
  RAISE NOTICE 'Usuario blackboxdjhm@gmail.com eliminado exitosamente';
END $$;
