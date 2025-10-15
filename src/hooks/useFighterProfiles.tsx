import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getPublicFighterFieldsSelect } from '@/lib/fighterDataFilter';

export interface FighterProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  country: string;
  weight_class: string;
  height_cm?: number;
  weight_kg?: number;
  reach_cm?: number;
  fighting_style?: string;
  gym_name?: string;
  record_wins: number;
  record_losses: number;
  record_draws: number;
  avatar_url?: string;
  bio?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  license_number?: string;
  license_issued_date?: string;
  license_expires_date?: string;
  license_status?: string;
  primary_license_id?: string;
  discipline?: 'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro';
  martial_arts?: string[];
  organization_id?: string | null;
  gender?: string;
  boxrec_url?: string;
  tapology_url?: string;
  record_type?: string;
  stance?: string;
  level?: string;
  // Phase 1: Critical Safety Information
  document_type?: string;
  document_number?: string;
  birthdate?: string;
  birthplace?: string;
  blood_type?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  medical_allergies?: string;
  medical_conditions?: string;
  insurance_company?: string;
  insurance_policy?: string;
}

export interface FighterProfileData {
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
  discipline?: 'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro';
  martial_arts?: string[];
  organization_id?: string | null;
  gender?: string;
  boxrec_url?: string;
  tapology_url?: string;
  record_type?: string;
  stance?: string;
  level?: string;
  // Phase 1: Critical Safety Information
  document_type?: string;
  document_number?: string;
  birthdate?: string;
  birthplace?: string;
  blood_type?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  medical_allergies?: string;
  medical_conditions?: string;
  insurance_company?: string;
  insurance_policy?: string;
}

export interface AdminFighterFormData {
  first_name: string;
  last_name: string;
  nickname?: string;
  country?: string;
  weight_class: string;
  avatar_url?: string;
  discipline?: 'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro';
  martial_arts?: string[];
  record_wins?: number;
  record_losses?: number;
  record_draws?: number;
  
  gender?: string;
  boxrec_url?: string;
  tapology_url?: string;
  record_type?: string;
  stance?: string;
  level?: string;
  // Physical attributes
  height_cm?: number;
  weight_kg?: number;
  reach_cm?: number;
  // Bio and background
  bio?: string;
  fighting_style?: string;
  gym_name?: string;
  birthdate?: string;
  birthplace?: string;
  // Medical and emergency
  blood_type?: string;
  medical_allergies?: string;
  medical_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  // Insurance
  insurance_company?: string;
  insurance_policy?: string;
  // Documents
  document_type?: string;
  document_number?: string;
}

export function useFighterProfiles() {
  const [fighters, setFighters] = useState<FighterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFighters = useCallback(async (includeInactive = false) => {
    try {
      setLoading(true);
      console.log('[FIGHTERS] Fetching public fighters...');
      
      // RLS policies ensure only authorized users see sensitive data
      // Public users: see basic fields only (RLS enforced)
      // Owners/Admins: see complete profile (RLS enforced)
      let query = supabase
        .from('fighter_profiles')
        .select('*');
      
      if (!includeInactive) {
        query = query.eq('active', true);
      }
      
      const { data: fightersData, error: fightersError } = await query.order('created_at', { ascending: false });

      if (fightersError) {
        console.error('[FIGHTERS] Fighters query error:', fightersError);
        throw fightersError;
      }
      
      console.log('[FIGHTERS] Raw fighters fetched:', fightersData?.length, 'fighters');
      
      if (!fightersData || fightersData.length === 0) {
        console.log('[FIGHTERS] No fighters found in database');
        setFighters([]);
        return;
      }

      // Optional: Get licenses separately if needed (for now just use the data we have)
      const fightersWithLicenses = fightersData.map(fighter => ({
        ...fighter,
        // Use existing license fields from fighter_profiles table
        martial_arts: fighter.martial_arts || [],
      }));
      
      console.log('[FIGHTERS] Processed fighters:', fightersWithLicenses.length, 'fighters');
      const moises = fightersWithLicenses.find(f => f.first_name === 'Moises' && f.last_name === 'Cardenas');
      if (moises) {
        console.log('[FIGHTERS] Moises record:', { wins: moises.record_wins, losses: moises.record_losses, draws: moises.record_draws });
      }
      
      setFighters(fightersWithLicenses);
    } catch (err) {
      console.error('[FIGHTERS] Public fighters fetch error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      // Set empty array on error so UI shows "no fighters" instead of loading forever
      setFighters([]);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setFighters, setError]);

  const fetchFightersWithReadyStatus = useCallback(async (includeInactive = false) => {
    try {
      setLoading(true);
      // RLS policies ensure only authorized users see sensitive data
      let query = supabase
        .from('fighter_profiles')
        .select(`
          *,
          martial_arts,
          license_number,
          license_issued_date,
          license_expires_date,
          license_status,
          fighter_status_updates!inner(
            ready_to_fight,
            created_at
          )
        `);
      
      if (!includeInactive) {
        query = query.eq('active', true);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Process data to get latest ready_to_fight status
      const processedData = data?.map(fighter => {
        const latestStatus = fighter.fighter_status_updates?.[0];
        return {
          ...fighter,
          ready_to_fight: latestStatus?.ready_to_fight || false
        };
      }) || [];
      
      setFighters(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setFighters, setError]);

  const createFighterProfile = async (profileData: FighterProfileData) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      // Get user_id from app_user table
      const { data: appUser, error: userError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) throw userError;
      if (!appUser) throw new Error('Perfil de usuario no encontrado');

      const { data, error } = await supabase
        .from('fighter_profiles')
        .insert({
          user_id: appUser.id,
          ...profileData
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh fighters list
      await fetchFighters();
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  const updateFighterProfile = async (id: string, profileData: Partial<FighterProfileData>) => {
    try {
      const { data, error } = await supabase
        .from('fighter_profiles')
        .update(profileData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh fighters list
      await fetchFighters();
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  const getUserFighterProfile = useCallback(async () => {
    if (!user) return null;

    try {
      setLoadingUserProfile(true);
      // Get user_id from app_user table
      const { data: appUser, error: userError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !appUser) return null;

      const { data, error } = await supabase
        .from('fighter_profiles')
        .select(`
          *,
          primary_license:fighter_licenses!primary_license_id(*)
        `)
        .eq('user_id', appUser.id)
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      console.error('Error fetching user fighter profile:', err);
      return null;
    } finally {
      setLoadingUserProfile(false);
    }
  }, [user]);

  // Add function to refresh current user profile
  const refreshUserProfile = async () => {
    return await getUserFighterProfile();
  };

  const getFighterById = async (id: string) => {
    try {
      // RLS policies ensure only authorized users see sensitive data
      const { data, error } = await supabase
        .from('fighter_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  const adminUpdateFighterProfile = async (fighterId: string, profileData: AdminFighterFormData) => {
    try {
      console.log('Actualizando peleador:', fighterId, profileData);
      
      // Verificar autenticación antes de proceder
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Estado de sesión:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        accessToken: session?.access_token ? 'presente' : 'ausente'
      });
      
      if (!session) {
        throw new Error('No hay sesión activa. Por favor inicia sesión nuevamente.');
      }

      // Verificar si el usuario es admin consultando directamente
      const { data: adminCheck, error: adminError } = await supabase
        .from('app_user')
        .select('is_admin, id')
        .eq('auth_user_id', session.user.id)
        .single();

      if (adminError) {
        console.error('Error verificando permisos de admin:', adminError);
        throw new Error('Error verificando permisos de administrador');
      }

      if (!adminCheck?.is_admin) {
        throw new Error('No tienes permisos de administrador para realizar esta acción');
      }

      // Validate discipline before sending if present
      if (profileData.discipline && !['MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro'].includes(profileData.discipline)) {
        throw new Error(`Disciplina inválida: ${profileData.discipline}`);
      }

      console.log('Usuario verificado como admin:', adminCheck);
      
      // Usar la función administrativa de base de datos con valores en español
      const { error } = await supabase.rpc('admin_update_fighter_profile', {
        p_fighter_id: fighterId,
        p_profile_data: profileData as any
      });

      if (error) {
        console.error('Error en RPC admin_update_fighter_profile_v3:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Perfil de peleador actualizado correctamente.",
      });

      // Refrescar la lista para mostrar los cambios
      await fetchFighters();

      // Notificar a otras vistas para refrescar
      window.dispatchEvent(new CustomEvent('admin-fighter-updated'));
      return true;
    } catch (err) {
      console.error('Error completo:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar peleador';
      toast({
        title: "Error",
        description: `Error al actualizar: ${errorMessage}`,
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

  const deleteFighterProfile = async (fighterId: string) => {
    try {
      // Usar la función administrativa de base de datos
      const { error } = await supabase.rpc('admin_delete_fighter_profile', {
        p_fighter_id: fighterId
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Perfil de peleador eliminado correctamente",
      });

      // Refrescar la lista
      await fetchFighters();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar peleador';
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

  // Add a window listener to refresh public fighters when admin makes changes
  useEffect(() => {
    const handleAdminUpdate = () => {
      console.log('[FIGHTERS] Admin update detected, refreshing public fighters...');
      setTimeout(() => fetchFighters(), 1000); // Delay to ensure DB update is complete
    };
    
    window.addEventListener('admin-fighter-updated', handleAdminUpdate);
    
    return () => {
      window.removeEventListener('admin-fighter-updated', handleAdminUpdate);
    };
  }, [fetchFighters]);

  /**
   * Admin creates a new fighter profile (no user_id required)
   */
  const adminCreateFighterProfile = async (profileData: Partial<FighterProfileData>): Promise<string | null> => {
    try {
      console.log('Admin creating fighter profile:', profileData);
      
      const { data, error } = await supabase.rpc('admin_create_fighter_profile', {
        p_profile_data: profileData as any
      });

      if (error) {
        console.error('Error creating fighter profile:', error);
        throw error;
      }

      console.log('Fighter profile created successfully:', data);
      
      // Refresh fighters list
      await fetchFighters();
      
      return data;
    } catch (error) {
      console.error('Exception in adminCreateFighterProfile:', error);
      throw error;
    }
  };

  return {
    fighters,
    loading,
    loadingUserProfile,
    error,
    createFighterProfile,
    updateFighterProfile,
    getUserFighterProfile,
    getFighterById,
    fetchFighters,
    fetchFightersWithReadyStatus,
    adminUpdateFighterProfile,
    adminCreateFighterProfile,
    deleteLicense,
    deleteFighterProfile,
    refreshUserProfile
  };
}