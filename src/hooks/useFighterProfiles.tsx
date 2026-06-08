/**
 * @deprecated Use hooks from `@/hooks/fighters` directly instead.
 * This wrapper maintains backward compatibility with existing components.
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useFightersQuery } from '@/hooks/fighters/useFightersQuery';

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
  gym_id?: string | null;
  coach_id?: string | null;
  coach?: {
    id: string;
    nombre: string;
    apellidos?: string;
    avatar_url?: string;
    especialidades?: string[];
    slug?: string;
  };
  record_wins: number;
  record_losses: number;
  record_draws: number;
  mma_record_wins?: number;
  mma_record_losses?: number;
  mma_record_draws?: number;
  boxeo_record_wins?: number;
  boxeo_record_losses?: number;
  boxeo_record_draws?: number;
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
  phone?: string;
  boxrec_url?: string;
  tapology_url?: string;
  record_type?: string;
  stance?: string;
  level?: string;
  document_type?: string;
  document_image_url?: string;
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
  height_cm?: number | null;
  weight_kg?: number | null;
  reach_cm?: number | null;
  fighting_style?: string;
  gym_name?: string;
  gym_id?: string | null;
  coach_id?: string | null;
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
  gym_id?: string;
  discipline?: 'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro';
  martial_arts?: string[];
  record_wins?: number;
  record_losses?: number;
  record_draws?: number;
  mma_record_wins?: number;
  mma_record_losses?: number;
  mma_record_draws?: number;
  boxeo_record_wins?: number;
  boxeo_record_losses?: number;
  boxeo_record_draws?: number;
  gender?: string;
  boxrec_url?: string;
  tapology_url?: string;
  record_type?: string;
  stance?: string;
  level?: string;
  height_cm?: number;
  weight_kg?: number;
  reach_cm?: number;
  bio?: string;
  fighting_style?: string;
  gym_name?: string;
  birthdate?: string;
  birthplace?: string;
  blood_type?: string;
  medical_allergies?: string;
  medical_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  insurance_company?: string;
  insurance_policy?: string;
  document_type?: string;
  document_number?: string;
}

export function useFighterProfiles() {
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delegate list fetching to React Query hook
  const { data: queryData, isLoading, error: queryError, refetch } = useFightersQuery({ active: true });

  const fighters = (queryData?.fighters || []) as FighterProfile[];
  const loading = isLoading;
  const error = queryError?.message || null;

  const fetchFighters = useCallback(async (_includeInactive?: boolean) => {
    await refetch();
  }, [refetch]);

  const fetchFightersWithReadyStatus = useCallback(async (_includeInactive?: boolean) => {
    await refetch();
  }, [refetch]);

  const createFighterProfile = async (profileData: FighterProfileData) => {
    if (!user) throw new Error('Usuario no autenticado');

    const { data: appUser, error: userError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userError) {
      console.error('[createFighterProfile] app_user lookup error:', userError);
      throw new Error('Error al verificar tu cuenta');
    }
    if (!appUser) {
      throw new Error('Tu cuenta no está registrada en el sistema. Contacta soporte.');
    }

    const { data, error } = await supabase
      .from('fighter_profiles')
      .insert({ user_id: appUser.id, ...profileData })
      .select()
      .single();

    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['fighters'] });
    return data;
  };

  const updateFighterProfile = async (id: string, profileData: Partial<FighterProfileData>) => {
    const { data, error } = await supabase
      .from('fighter_profiles')
      .update(profileData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['fighters'] });
    queryClient.invalidateQueries({ queryKey: ['fighter', id] });
    return data;
  };

  const getUserFighterProfile = useCallback(async () => {
    if (!user) return null;
    try {
      setLoadingUserProfile(true);
      const { data: appUser, error: userError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('[getUserFighterProfile] app_user lookup error:', userError);
        return null;
      }
      if (!appUser) return null;

      const { data, error } = await supabase
        .from('fighter_profiles')
        .select(`*, primary_license:fighter_licenses!primary_license_id(*)`)
        .eq('user_id', appUser.id)
        .eq('active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching user fighter profile:', err);
      return null;
    } finally {
      setLoadingUserProfile(false);
    }
  }, [user]);

  const refreshUserProfile = async () => getUserFighterProfile();

  const getFighterById = async (id: string) => {
    const { data, error } = await supabase
      .from('fighter_profiles')
      .select(`*, coach:coaches(id, nombre, apellidos, avatar_url, especialidades, slug), gym:gyms!gym_id(id, nombre, logo_url, slug)`)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  };

  const invalidateAll = (fighterId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['fighters'] });
    queryClient.invalidateQueries({ queryKey: ['admin-fighters'] });
    queryClient.invalidateQueries({ queryKey: ['organization-ranking'] });
    queryClient.invalidateQueries({ queryKey: ['fighter-active-leagues'] });
    queryClient.invalidateQueries({ queryKey: ['fighter-ranking'] });
    queryClient.invalidateQueries({ queryKey: ['fighter-stats'] });
    queryClient.invalidateQueries({ queryKey: ['ranking-data'] });
    queryClient.invalidateQueries({ queryKey: ['userFighterProfile'] });
    queryClient.invalidateQueries({ queryKey: ['license'] });
    if (fighterId) {
      queryClient.invalidateQueries({ queryKey: ['fighter', fighterId] });
      queryClient.invalidateQueries({ queryKey: ['fighter-profile', fighterId] });
      queryClient.invalidateQueries({ queryKey: ['fighter_history', fighterId] });
    }
  };

  const adminUpdateFighterProfile = async (fighterId: string, profileData: AdminFighterFormData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa.');

      const { data: adminCheck, error: adminError } = await supabase
        .from('app_user')
        .select('is_admin, id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (adminError) throw new Error('Error verificando permisos de administrador');
      if (!adminCheck?.is_admin) throw new Error('No tienes permisos de administrador');

      if (profileData.discipline && !['MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro'].includes(profileData.discipline)) {
        throw new Error(`Disciplina inválida: ${profileData.discipline}`);
      }

      const { error } = await supabase.rpc('admin_update_fighter_profile', {
        p_fighter_id: fighterId,
        p_profile_data: profileData as any,
      });
      if (error) throw error;

      toast({ title: 'Éxito', description: 'Perfil de peleador actualizado correctamente.' });
      invalidateAll(fighterId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar peleador';
      toast({ title: 'Error', description: `Error al actualizar: ${errorMessage}`, variant: 'destructive' });
      return false;
    }
  };

  const deleteLicense = async (licenseId: string) => {
    try {
      const { error } = await supabase.rpc('delete_fighter_license', { p_license_id: licenseId });
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Licencia eliminada correctamente' });
      return true;
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al eliminar licencia', variant: 'destructive' });
      return false;
    }
  };

  const deleteFighterProfile = async (fighterId: string) => {
    try {
      const { error } = await supabase.rpc('admin_delete_fighter_profile', { p_fighter_id: fighterId });
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Perfil de peleador eliminado correctamente' });
      invalidateAll();
      return true;
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al eliminar peleador', variant: 'destructive' });
      return false;
    }
  };

  const userUpdateFighterProfile = async (fighterId: string, profileData: Partial<FighterProfileData>) => {
    try {
      const { error } = await supabase.rpc('user_update_fighter_profile', {
        p_fighter_id: fighterId,
        p_profile_data: profileData as any,
      });
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Perfil actualizado correctamente.' });
      invalidateAll(fighterId);
      return true;
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al actualizar perfil', variant: 'destructive' });
      return false;
    }
  };

  const adminCreateFighterProfile = async (profileData: Partial<FighterProfileData>): Promise<string | null> => {
    const { data, error } = await supabase.rpc('admin_create_fighter_profile', {
      p_profile_data: profileData as any,
    });
    if (error) throw error;
    invalidateAll();
    return data;
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
    userUpdateFighterProfile,
    deleteLicense,
    deleteFighterProfile,
    refreshUserProfile,
  };
}
