import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Gym, GymWithCoaches } from '@/types/gyms';

export function useGyms() {
  return useQuery({
    queryKey: ['gyms'],
    queryFn: async (): Promise<Gym[]> => {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      
      if (error) throw error;
      return data as Gym[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useGym(slug: string) {
  return useQuery({
    queryKey: ['gym', slug],
    queryFn: async (): Promise<GymWithCoaches | null> => {
      const { data: gym, error: gymError } = await supabase
        .from('gyms')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (gymError) throw gymError;
      if (!gym) return null;

      const { data: coaches, error: coachError } = await supabase
        .from('coaches')
        .select('*')
        .eq('gym_id', gym.id)
        .eq('activo', true)
        .order('nombre');
      
      if (coachError) throw coachError;

      return { ...gym, coaches: coaches || [] } as GymWithCoaches;
    },
    enabled: !!slug,
  });
}

export function useCreateGym() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (gymData: Partial<Gym>) => {
      const { data, error } = await supabase
        .from('gyms')
        .insert(gymData as any)
        .select()
        .single();
      
      if (error) throw error;
      return data as Gym;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      toast.success('Gimnasio creado exitosamente');
    },
    onError: (error: any) => {
      toast.error('Error al crear gimnasio: ' + error.message);
    },
  });
}

export function useUpdateGym(gymId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<Gym>) => {
      const { data, error } = await supabase
        .from('gyms')
        .update(updates)
        .eq('id', gymId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Gym;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      queryClient.invalidateQueries({ queryKey: ['gym'] });
      toast.success('Gimnasio actualizado');
    },
    onError: (error: any) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });
}

export function useDeleteGym() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (gymId: string) => {
      const { error } = await supabase
        .from('gyms')
        .update({ activo: false })
        .eq('id', gymId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      toast.success('Gimnasio eliminado');
    },
    onError: (error: any) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });
}
