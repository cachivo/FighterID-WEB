import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FighterSearchParams {
  search: string;
  discipline: string;
  level: string;
  weightClass: string;
  gymId?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export interface FighterSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  avatar_url: string | null;
  discipline: string | null;
  level: string | null;
  weight_class: string;
  mma_record_wins: number | null;
  mma_record_losses: number | null;
  mma_record_draws: number | null;
  boxeo_record_wins: number | null;
  boxeo_record_losses: number | null;
  boxeo_record_draws: number | null;
  record_wins: number | null;
  record_losses: number | null;
  record_draws: number | null;
  active_gym_id: string | null;
  active_gym_name: string | null;
}

export function useFighterSearch({
  search,
  discipline,
  level,
  weightClass,
  gymId,
  limit = 15,
  offset = 0,
  enabled = true,
}: FighterSearchParams) {
  return useQuery({
    queryKey: ['fighter-search', { search, discipline, level, weightClass, gymId, limit, offset }],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_fighters_for_gym', {
        p_search: search || null,
        p_discipline: discipline === '__none__' ? null : discipline || null,
        p_level: level === '__none__' ? null : level || null,
        p_weight_class: weightClass === '__none__' ? null : weightClass || null,
        p_limit: limit,
        p_offset: offset,
        p_gym_id: gymId || null,
      });

      if (error) throw error;
      return (data || []) as FighterSearchResult[];
    },
    enabled,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}
