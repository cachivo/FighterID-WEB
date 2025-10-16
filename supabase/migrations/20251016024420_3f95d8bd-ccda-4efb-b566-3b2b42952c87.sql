
-- Eliminar completamente el usuario blackbldjhn@gmail.com y todos sus datos relacionados

DO $$
DECLARE
  v_auth_user_id uuid;
  v_app_user_id uuid;
  v_fighter_profile_id uuid;
BEGIN
  -- Buscar el auth_user_id en auth.users
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = 'blackbldjhn@gmail.com';
  
  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE 'No se encontró usuario con email blackbldjhn@gmail.com en auth.users';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Usuario encontrado: %', v_auth_user_id;
  
  -- Obtener app_user_id si existe
  SELECT id, id INTO v_app_user_id, v_app_user_id
  FROM public.app_user 
  WHERE auth_user_id = v_auth_user_id;
  
  IF v_app_user_id IS NOT NULL THEN
    RAISE NOTICE 'app_user encontrado: %', v_app_user_id;
    
    -- Buscar fighter_profile_id
    SELECT id INTO v_fighter_profile_id
    FROM public.fighter_profiles
    WHERE user_id = v_app_user_id;
    
    IF v_fighter_profile_id IS NOT NULL THEN
      RAISE NOTICE 'fighter_profile encontrado: %', v_fighter_profile_id;
      
      -- Eliminar usando la función admin_delete_fighter_profile
      PERFORM public.admin_delete_fighter_profile(v_fighter_profile_id);
      RAISE NOTICE 'Perfil de peleador eliminado';
    END IF;
    
    -- Eliminar invitaciones
    DELETE FROM public.fighter_invitations WHERE invited_by = v_auth_user_id;
    
    -- Eliminar posts sociales
    DELETE FROM public.social_posts WHERE user_id = v_app_user_id;
    
    -- Eliminar comentarios
    DELETE FROM public.social_comments WHERE user_id = v_app_user_id;
    
    -- Eliminar likes
    DELETE FROM public.social_post_likes WHERE user_id = v_app_user_id;
    
    -- Eliminar amistades
    DELETE FROM public.friendships WHERE user_id = v_app_user_id OR friend_id = v_app_user_id;
    
    -- Eliminar solicitudes de amistad
    DELETE FROM public.friend_requests WHERE sender_id = v_app_user_id OR receiver_id = v_app_user_id;
    
    -- Eliminar notificaciones
    DELETE FROM public.notifications WHERE user_id = v_app_user_id;
    
    -- Eliminar roles
    DELETE FROM public.user_roles WHERE user_id = v_auth_user_id;
    
    -- Eliminar wallets
    DELETE FROM public.wallet WHERE user_id = v_app_user_id;
    
    -- Eliminar de app_user
    DELETE FROM public.app_user WHERE id = v_app_user_id;
    RAISE NOTICE 'app_user eliminado';
  END IF;
  
  -- Finalmente eliminar de auth.users
  DELETE FROM auth.users WHERE id = v_auth_user_id;
  RAISE NOTICE 'Usuario eliminado de auth.users';
  
  RAISE NOTICE 'Proceso completado exitosamente';
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error al eliminar usuario: %', SQLERRM;
END $$;