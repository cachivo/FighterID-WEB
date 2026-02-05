 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 
 export interface RankingEntry {
   id: string;
   fighter_id: string;
   fighter: {
     first_name: string;
     last_name: string;
     nickname: string | null;
     avatar_url: string | null;
     country: string | null;
    mma_record_wins: number | null;
    mma_record_losses: number | null;
    mma_record_draws: number | null;
    boxeo_record_wins: number | null;
    boxeo_record_losses: number | null;
    boxeo_record_draws: number | null;
   };
   weight_class: string;
   level: string;
   ranking_position: number | null;
   points: number;
   is_champion: boolean;
   is_active: boolean;
   last_fight_date: string | null;
 }
 
 export interface OrganizationRankingResult {
   rankings: RankingEntry[];
   totalCount: number;
   hasMore: boolean;
   weightClasses: string[];
   levels: string[];
  discipline: 'MMA' | 'Boxeo';
 }
 
 export function useOrganizationRanking(
   organizationCode: string,
   level?: string,
   weightClass?: string,
   page: number = 1,
   pageSize: number = 10
 ) {
   return useQuery({
     queryKey: ['organization-ranking', organizationCode, level, weightClass, page, pageSize],
     queryFn: async (): Promise<OrganizationRankingResult> => {
       // First get the organization ID
       const { data: org, error: orgError } = await supabase
         .from('ranking_organizations')
        .select('id, allowed_levels, discipline')
         .eq('code', organizationCode)
         .single();
 
       if (orgError) throw orgError;
 
       // Build query for rankings
       let query = supabase
         .from('fighter_rankings')
         .select(`
           id,
           fighter_id,
           weight_class,
           level,
           ranking_position,
           points,
           is_champion,
           is_active,
           last_fight_date,
           fighter_profiles!inner (
             first_name,
             last_name,
             nickname,
             avatar_url,
            country,
            mma_record_wins,
            mma_record_losses,
            mma_record_draws,
            boxeo_record_wins,
            boxeo_record_losses,
            boxeo_record_draws
           )
         `, { count: 'exact' })
         .eq('organization_id', org.id)
         .eq('is_active', true)
         .order('points', { ascending: false })
         .order('is_champion', { ascending: false });
 
       // Apply filters
       if (level) {
         query = query.eq('level', level);
       }
       if (weightClass) {
         query = query.eq('weight_class', weightClass);
       }
 
       const { data: rankingsData, error: rankingsError, count } = await query;
 
       if (rankingsError) throw rankingsError;
 
       // Get unique weight classes and levels for filters
       const { data: filtersData } = await supabase
         .from('fighter_rankings')
         .select('weight_class, level')
         .eq('organization_id', org.id)
         .eq('is_active', true);
 
       const weightClasses = [...new Set(filtersData?.map(r => r.weight_class) || [])].sort();
       const levels = [...new Set(filtersData?.map(r => r.level) || [])].filter(
         l => org.allowed_levels.includes(l)
       );
 
       // Transform data to match interface
       const rankings: RankingEntry[] = (rankingsData || []).map((r: any) => ({
         id: r.id,
         fighter_id: r.fighter_id,
         fighter: {
           first_name: r.fighter_profiles.first_name,
           last_name: r.fighter_profiles.last_name,
           nickname: r.fighter_profiles.nickname,
           avatar_url: r.fighter_profiles.avatar_url,
           country: r.fighter_profiles.country,
          mma_record_wins: r.fighter_profiles.mma_record_wins,
          mma_record_losses: r.fighter_profiles.mma_record_losses,
          mma_record_draws: r.fighter_profiles.mma_record_draws,
          boxeo_record_wins: r.fighter_profiles.boxeo_record_wins,
          boxeo_record_losses: r.fighter_profiles.boxeo_record_losses,
          boxeo_record_draws: r.fighter_profiles.boxeo_record_draws,
         },
         weight_class: r.weight_class,
         level: r.level,
         ranking_position: r.ranking_position,
         points: r.points,
         is_champion: r.is_champion,
         is_active: r.is_active,
         last_fight_date: r.last_fight_date,
       }));
 
       // Paginate
       const start = (page - 1) * pageSize;
       const end = start + pageSize;
       const paginatedRankings = rankings.slice(start, end);
 
       return {
         rankings: paginatedRankings,
         totalCount: count || 0,
         hasMore: end < (count || 0),
         weightClasses,
         levels,
        discipline: org.discipline as 'MMA' | 'Boxeo',
       };
     },
     enabled: !!organizationCode,
   });
 }