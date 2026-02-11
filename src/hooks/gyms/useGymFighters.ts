import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 15;

export interface GymFighter {
  membership_id: string;
  fighter_id: string;
  joined_at: string;
  coach_user_id: string | null;
  fighter: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
    weight_class: string | null;
    level: string | null;
    discipline: string | null;
    mma_record_wins: number;
    mma_record_losses: number;
    mma_record_draws: number;
    boxeo_record_wins: number;
    boxeo_record_losses: number;
    boxeo_record_draws: number;
  };
}

interface UseGymFightersOptions {
  page?: number;
  limit?: number;
}

export function useGymFighters(gymId: string, options: UseGymFightersOptions = {}) {
  const { page = 1, limit = PAGE_SIZE } = options;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return useQuery({
    queryKey: ['gym-fighters', gymId, { page, limit }],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('fighter_gym_memberships')
        .select(`
          id,
          fighter_id,
          joined_at,
          coach_user_id,
          fighter_profiles!inner(
            id, first_name, last_name, nickname, avatar_url,
            weight_class, level, discipline,
            mma_record_wins, mma_record_losses, mma_record_draws,
            boxeo_record_wins, boxeo_record_losses, boxeo_record_draws
          )
        `, { count: 'exact' })
        .eq('gym_id', gymId)
        .eq('status', 'ACTIVE')
        .order('joined_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const fighters: GymFighter[] = (data || []).map((m: any) => ({
        membership_id: m.id,
        fighter_id: m.fighter_id,
        joined_at: m.joined_at,
        coach_user_id: m.coach_user_id,
        fighter: m.fighter_profiles,
      }));

      return {
        fighters,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page,
      };
    },
    enabled: !!gymId,
    staleTime: 30_000,
  });
}
