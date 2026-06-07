import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook centralizado para obtener el app_user.id desde auth_user_id
 * 
 * ARQUITECTURA CRÍTICA:
 * - auth.users (Supabase Auth) usa auth_user_id (UUID)
 * - app_user (nuestra tabla) usa id (UUID) con FK a auth_user_id
 * - Todas las tablas del sistema (profile_change_requests, fighter_profiles, etc.) 
 *   referencian app_user.id, NO auth.uid()
 * 
 * Este hook centraliza la conversión auth_user_id → app_user.id para mantener
 * consistencia en toda la aplicación y evitar errores de Foreign Key.
 */
export function useAppUserId() {
  const { user } = useAuth();
  const [appUserId, setAppUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppUserId() {
      if (!user) {
        setAppUserId(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: appUser, error: fetchError } = await supabase
          .from('app_user')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('[useAppUserId] Error fetching app_user:', fetchError);
          setError('No se pudo obtener la información del usuario');
          setAppUserId(null);
          return;
        }

        setAppUserId(appUser?.id ?? null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[useAppUserId] Error:', errorMessage);
        setError(errorMessage);
        setAppUserId(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAppUserId();
  }, [user]);

  return { appUserId, loading, error };
}

/**
 * Función helper para obtener app_user.id de forma síncrona cuando ya tienes auth_user_id
 * Útil dentro de funciones async que ya tienen el contexto de autenticación
 * 
 * @param authUserId - El auth.uid() de Supabase Auth
 * @returns Promise con el app_user.id
 * @throws Error si no se encuentra el usuario o hay un error de DB
 */
export async function getAppUserIdFromAuth(authUserId: string): Promise<string | null> {
  if (!authUserId) return null;

  const { data: appUser, error } = await supabase
    .from('app_user')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) {
    console.error('[getAppUserIdFromAuth] Error:', error);
    return null;
  }

  return appUser?.id ?? null;
}
