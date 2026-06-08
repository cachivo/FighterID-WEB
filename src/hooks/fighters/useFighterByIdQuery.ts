import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFighterByIdQuery(fighterId: string | null | undefined) {
  return useQuery({
    queryKey: ['fighter', fighterId],
    enabled: !!fighterId,
    queryFn: async () => {
      if (!fighterId) return null;

      const { data, error } = await supabase
        .from('fighter_profiles')
        .select(`
          *,
          coach:coaches(id, nombre, apellidos, avatar_url, especialidades, slug),
          gym:gyms!gym_id(id, nombre, logo_url, slug)
        `)
        .eq('id', fighterId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}
