-- Eliminar completamente el usuario blackboxdjhn@gmail.com
DO $$
DECLARE
  v_auth_user_id uuid := '07812e67-8a28-406d-95a2-de528204ea97';
BEGIN
  -- Eliminar de user_roles
  DELETE FROM public.user_roles WHERE user_id = v_auth_user_id;

  -- Eliminar de app_user
  DELETE FROM public.app_user WHERE auth_user_id = v_auth_user_id;

  -- Eliminar de auth.users
  DELETE FROM auth.users WHERE id = v_auth_user_id;

  RAISE NOTICE 'Successfully deleted user blackboxdjhn@gmail.com';
END $$;