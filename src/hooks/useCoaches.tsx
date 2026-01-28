import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Coach } from '@/types/gyms';

export function useCoaches(params?: { gym_id?: string }) {
  return useQuery({
    queryKey: ['coaches', params?.gym_id ?? 'all'],
    queryFn: async (): Promise<Coach[]> => {
      let query = supabase
        .from('coaches')
        .select('*, gym:gyms(*)')
        .eq('activo', true);
      
      if (params?.gym_id) {
        query = query.eq('gym_id', params.gym_id);
      }
      
      const { data, error } = await query.order('nombre');
      
      if (error) throw error;
      return data as Coach[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCoach(slug: string) {
  return useQuery({
    queryKey: ['coach', slug],
    queryFn: async (): Promise<Coach | null> => {
      const { data, error } = await supabase
        .from('coaches')
        .select('*, gym:gyms(*)')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as Coach | null;
    },
    enabled: !!slug,
  });
}

export function useCreateCoach() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (coachData: Partial<Coach>) => {
      const { data, error } = await supabase
        .from('coaches')
        .insert(coachData as any)
        .select()
        .single();
      
      if (error) throw error;
      return data as Coach;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      toast.success('Entrenador creado exitosamente');
    },
    onError: (error: any) => {
      toast.error('Error al crear entrenador: ' + error.message);
    },
  });
}

export function useUpdateCoach(coachId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<Coach>) => {
      const { data, error } = await supabase
        .from('coaches')
        .update(updates)
        .eq('id', coachId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Coach;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      queryClient.invalidateQueries({ queryKey: ['coach'] });
      toast.success('Entrenador actualizado');
    },
    onError: (error: any) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });
}

export function useDeleteCoach() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (coachId: string) => {
      const { error } = await supabase
        .from('coaches')
        .update({ activo: false })
        .eq('id', coachId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      toast.success('Entrenador eliminado');
    },
    onError: (error: any) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });
}
