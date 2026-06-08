import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/** Shared invalidation logic after any fighter mutation */
function useInvalidateFighterQueries() {
  const queryClient = useQueryClient();

  return (fighterId?: string) => {
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
}

/** Admin update fighter profile via RPC */
export function useAdminUpdateFighter() {
  const { toast } = useToast();
  const invalidate = useInvalidateFighterQueries();

  return useMutation({
    mutationFn: async ({ fighterId, profileData }: { fighterId: string; profileData: any }) => {
      const { error } = await supabase.rpc('admin_update_fighter_profile', {
        p_fighter_id: fighterId,
        p_profile_data: profileData,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ title: 'Éxito', description: 'Perfil de peleador actualizado correctamente' });
      invalidate(variables.fighterId);
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

/** User update their own fighter profile via RPC */
export function useUserUpdateFighter() {
  const { toast } = useToast();
  const invalidate = useInvalidateFighterQueries();

  return useMutation({
    mutationFn: async ({ fighterId, profileData }: { fighterId: string; profileData: any }) => {
      const { error } = await supabase.rpc('user_update_fighter_profile', {
        p_fighter_id: fighterId,
        p_profile_data: profileData,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ title: 'Éxito', description: 'Perfil actualizado correctamente.' });
      invalidate(variables.fighterId);
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

/** Admin create a fighter profile via RPC */
export function useAdminCreateFighter() {
  const invalidate = useInvalidateFighterQueries();

  return useMutation({
    mutationFn: async (profileData: any) => {
      const { data, error } = await supabase.rpc('admin_create_fighter_profile', {
        p_profile_data: profileData,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

/** Delete fighter license via RPC */
export function useDeleteFighterLicense() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (licenseId: string) => {
      const { error } = await supabase.rpc('delete_fighter_license', {
        p_license_id: licenseId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Éxito', description: 'Licencia eliminada correctamente' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

/** Delete fighter profile via RPC */
export function useDeleteFighterProfile() {
  const { toast } = useToast();
  const invalidate = useInvalidateFighterQueries();

  return useMutation({
    mutationFn: async (fighterId: string) => {
      const { error } = await supabase.rpc('admin_delete_fighter_profile', {
        p_fighter_id: fighterId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Éxito', description: 'Perfil de peleador eliminado correctamente' });
      invalidate();
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}
