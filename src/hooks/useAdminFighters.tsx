import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminFighterProfile {
  id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  country?: string;
  weight_class: string;
  height_cm?: number;
  weight_kg?: number;
  reach_cm?: number;
  fighting_style?: string;
  gym_name?: string;
  bio?: string;
  avatar_url?: string;
  record_wins: number;
  record_losses: number;
  record_draws: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
  discipline?: 'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro';
}

export interface AdminFighterFormData {
  first_name: string;
  last_name: string;
  nickname?: string;
  country?: string;
  weight_class: string;
  height_cm?: number;
  weight_kg?: number;
  reach_cm?: number;
  fighting_style?: string;
  gym_name?: string;
  bio?: string;
  avatar_url?: string;
  record_wins?: number;
  record_losses?: number;
  record_draws?: number;
  
}

export function useAdminFighters() {
  const [fighters, setFighters] = useState<AdminFighterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFighters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fighter_profiles')
        .select(`
          *,
          fighter_licenses!fighter_licenses_fighter_id_fkey!inner(
            license_number,
            status,
            is_primary
          )
        `)
        .eq('active', true)
        .eq('fighter_licenses.is_primary', true)
        .in('fighter_licenses.status', ['ACTIVE', 'PENDING_REVIEW'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFighters(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar peleadores';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFighterProfile = async (fighterId: string, profileData: AdminFighterFormData) => {
    try {
      console.log('🔧 Admin updating fighter:', fighterId);
      console.log('🔧 Profile data being sent:', profileData);
      
      // Usar la nueva función administrativa de base de datos mejorada
      const { error } = await supabase.rpc('admin_update_fighter_profile_v8', {
        p_fighter_id: fighterId,
        p_profile_data: profileData as any
      });

      if (error) {
        console.error('🔧 Database function error:', error);
        throw error;
      }

      console.log('🔧 Database update successful');

      toast({
        title: "Éxito",
        description: "Perfil de peleador actualizado correctamente",
      });

      // Trigger custom event to refresh public fighters
      window.dispatchEvent(new CustomEvent('admin-fighter-updated'));

      // Refrescar la lista
      await fetchFighters();
      console.log('🔧 Admin fighters list refreshed');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar peleador';
      console.error('🔧 Update error:', err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteLicense = async (licenseId: string) => {
    try {
      // Usar la función de eliminación segura de base de datos
      const { error } = await supabase.rpc('delete_fighter_license', {
        p_license_id: licenseId
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Licencia eliminada correctamente",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar licencia';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchFighters();
  }, []);

  return {
    fighters,
    loading,
    error,
    fetchFighters,
    updateFighterProfile,
    deleteLicense
  };
}