import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useHasFighterLicense() {
  const { user } = useAuth();
  const [hasLicense, setHasLicense] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fighterProfileId, setFighterProfileId] = useState<string | null>(null);

  useEffect(() => {
    async function checkLicense() {
      if (!user) {
        setHasLicense(false);
        setLoading(false);
        return;
      }

      try {
        // Obtener el app_user_id del usuario autenticado
        const { data: appUser } = await supabase
          .from('app_user')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (!appUser) {
          setHasLicense(false);
          setLoading(false);
          return;
        }

        // Verificar si tiene perfil de peleador
        const { data: fighterProfile } = await supabase
          .from('fighter_profiles')
          .select('id, active')
          .eq('user_id', appUser.id)
          .eq('active', true)
          .maybeSingle();

        setHasLicense(!!fighterProfile);
        setFighterProfileId(fighterProfile?.id || null);
      } catch (error) {
        console.error('Error checking fighter license:', error);
        setHasLicense(false);
      } finally {
        setLoading(false);
      }
    }

    checkLicense();
  }, [user]);

  return { hasLicense, loading, fighterProfileId };
}
