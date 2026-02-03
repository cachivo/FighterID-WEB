import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FighterRankingData {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  avatar_url: string | null;
  record_wins: number;
  record_losses: number;
  record_draws: number;
  discipline: string | null;
  level: string | null;
  weight_class: string;
  country: string;
  ranking_points: number;
  total_fights: number;
}

interface RankingStats {
  total_fighters: number;
  total_fights: number;
  professional_fighters: number;
  weight_classes: number;
  most_popular_discipline: string;
  undefeated_count: number;
}

export function useFighterRanking(minFights: number = 3, page: number = 1, pageSize: number = 10) {
  const { data: fighters, isLoading: loadingFighters, error: fightersError } = useQuery({
    queryKey: ['fighter-ranking', minFights, page, pageSize],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('fighter_profiles')
        .select('id, first_name, last_name, nickname, avatar_url, record_wins, record_losses, record_draws, discipline, level, weight_class, country', { count: 'exact' })
        .eq('active', true)
        .order('record_wins', { ascending: false });

      if (error) throw error;

      // Calcular estadísticas y puntos de ranking
      // Fórmula: Victoria = +3, Empate = +1, Derrota = -1
      const processed = data.map(fighter => {
        const total_fights = fighter.record_wins + fighter.record_losses + fighter.record_draws;
        const wins = fighter.record_wins || 0;
        const losses = fighter.record_losses || 0;
        const draws = fighter.record_draws || 0;
        const ranking_points = (wins * 3) + (draws * 1) - (losses * 1);
        
        return {
          ...fighter,
          total_fights,
          ranking_points,
          record_wins: wins,
          record_losses: losses,
          record_draws: draws,
        };
      });

      // Filtrar por mínimo de peleas y ordenar por puntos
      const filtered = processed
        .filter(f => f.total_fights >= minFights)
        .sort((a, b) => {
          // Primero por puntos, luego por total de victorias (desempate)
          if (b.ranking_points !== a.ranking_points) {
            return b.ranking_points - a.ranking_points;
          }
          return b.record_wins - a.record_wins;
        });

      // Paginación
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginated = filtered.slice(start, end);
      
      return {
        fighters: paginated,
        totalCount: filtered.length,
        hasMore: end < filtered.length
      };
    },
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['fighter-stats'],
    queryFn: async () => {
      // Obtener todos los peleadores activos
      const { data: allFighters, error: fightersError } = await supabase
        .from('fighter_profiles')
        .select('discipline, level, weight_class, record_wins, record_losses, record_draws')
        .eq('active', true);

      if (fightersError) throw fightersError;

      // Obtener total de peleas del historial
      const { count: fightsCount, error: fightsError } = await supabase
        .from('fights_history')
        .select('*', { count: 'exact', head: true });

      if (fightsError) throw fightsError;

      // Calcular estadísticas
      const total_fighters = allFighters?.length || 0;
      const professional_fighters = allFighters?.filter(f => f.level === 'Profesional' || f.level === 'Semi-profesional').length || 0;
      
      // Categorías de peso únicas
      const uniqueWeightClasses = new Set(allFighters?.map(f => f.weight_class).filter(Boolean));
      const weight_classes = uniqueWeightClasses.size;

      // Disciplina más popular
      const disciplineCounts: { [key: string]: number } = {};
      allFighters?.forEach(f => {
        if (f.discipline) {
          disciplineCounts[f.discipline] = (disciplineCounts[f.discipline] || 0) + 1;
        }
      });
      const most_popular_discipline = Object.entries(disciplineCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'MMA';

      // Peleadores invictos
      const undefeated_count = allFighters?.filter(f => 
        (f.record_wins > 0) && (f.record_losses === 0)
      ).length || 0;

      const stats: RankingStats = {
        total_fighters,
        total_fights: fightsCount || 0,
        professional_fighters,
        weight_classes,
        most_popular_discipline,
        undefeated_count,
      };

      return stats;
    },
  });

  return {
    fighters: (fighters as any)?.fighters as FighterRankingData[] | undefined,
    stats,
    isLoading: loadingFighters || loadingStats,
    error: fightersError,
    hasMore: (fighters as any)?.hasMore || false,
    totalCount: (fighters as any)?.totalCount || 0,
  };
}
