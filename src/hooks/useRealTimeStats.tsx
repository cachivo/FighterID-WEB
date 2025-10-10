import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealTimeStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['realtime-stats'],
    queryFn: async () => {
      const [
        fightersCount,
        activeFighters,
        activeEvents,
        totalEvents,
        recentFights,
        nextEvent
      ] = await Promise.all([
        supabase.from('fighter_profiles').select('id', { count: 'exact' }).eq('active', true),
        supabase.from('fighter_profiles')
          .select('id')
          .eq('active', true)
          .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('bdg_event').select('*').eq('state', 'live'),
        supabase.from('bdg_event').select('id', { count: 'exact' }),
        supabase.from('fights_history')
          .select('*')
          .order('event_date', { ascending: false })
          .limit(5),
        supabase.from('bdg_event')
          .select('*')
          .not('state', 'in', '("finished","live")')
          .gt('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(1)
          .maybeSingle()
      ]);

      return {
        totalFighters: fightersCount.count || 0,
        activeFighters: activeFighters.data?.length || 0,
        liveEvents: activeEvents.data || [],
        totalEvents: totalEvents.count || 0,
        recentFights: recentFights.data || [],
        nextEvent: nextEvent.data || null,
        growthRate: Math.round(((activeFighters.data?.length || 0) / (fightersCount.count || 1)) * 100)
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return { stats, isLoading };
}