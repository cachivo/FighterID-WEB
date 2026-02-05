 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 
 export interface FighterActiveLeague {
   id: string;
   organization_code: string;
   organization_name: string;
   organization_short_name: string;
   discipline: string;
   weight_class: string;
   level: string;
   points: number;
   ranking_position: number | null;
   is_champion: boolean;
 }
 
 export function useFighterActiveLeagues(fighterId: string | null) {
   return useQuery({
     queryKey: ['fighter-active-leagues', fighterId],
     queryFn: async (): Promise<FighterActiveLeague[]> => {
       if (!fighterId) return [];
 
       const { data, error } = await supabase
         .from('fighter_rankings')
         .select(`
           id,
           weight_class,
           level,
           points,
           ranking_position,
           is_champion,
           organization:ranking_organizations!inner(
             code,
             name,
             short_name,
             discipline
           )
         `)
         .eq('fighter_id', fighterId)
         .eq('is_active', true)
         .order('points', { ascending: false });
 
       if (error) {
         console.error('Error fetching fighter leagues:', error);
         return [];
       }
 
       return (data || []).map((item: any) => ({
         id: item.id,
         organization_code: item.organization.code,
         organization_name: item.organization.name,
         organization_short_name: item.organization.short_name,
         discipline: item.organization.discipline,
         weight_class: item.weight_class,
         level: item.level,
         points: item.points,
         ranking_position: item.ranking_position,
         is_champion: item.is_champion,
       }));
     },
     enabled: !!fighterId,
   });
 }