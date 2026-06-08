import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFighterHistory, RecordType, FighterRecord } from '@/hooks/useFighterHistory';

export interface CombinedFighterRecord extends FighterRecord {
  source: 'manual' | 'fights' | 'combined';
  manualRecord?: FighterRecord;
  fightRecord?: FighterRecord;
}

export function useCombinedFighterRecord(fighterId: string | null) {
  const { fightHistory, calculateRecord: calculateFightRecord, isLoading: isLoadingFights } = useFighterHistory(fighterId);
  
  const { data: fighterProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['fighter-profile', 'combined-record', fighterId],
    enabled: !!fighterId,
    queryFn: async () => {
      if (!fighterId) return null;
      
      const { data, error } = await supabase
        .from('fighter_profiles')
        .select(`
          record_wins, record_losses, record_draws, record_type, discipline, level,
          mma_record_wins, mma_record_losses, mma_record_draws,
          boxeo_record_wins, boxeo_record_losses, boxeo_record_draws
        `)
        .eq('id', fighterId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Calcular récord basado en disciplina de competencia
  const calculateRecordByDiscipline = (): CombinedFighterRecord => {
    if (!fighterProfile) {
      return {
        wins: 0,
        losses: 0,
        draws: 0,
        totalFights: 0,
        winPercentage: 0,
        source: 'manual'
      };
    }

    let wins = 0, losses = 0, draws = 0;

    // Seleccionar campos según disciplina de competencia
    if (fighterProfile.discipline === 'MMA') {
      wins = fighterProfile.mma_record_wins || 0;
      losses = fighterProfile.mma_record_losses || 0;
      draws = fighterProfile.mma_record_draws || 0;
    } else if (fighterProfile.discipline === 'Boxeo') {
      wins = fighterProfile.boxeo_record_wins || 0;
      losses = fighterProfile.boxeo_record_losses || 0;
      draws = fighterProfile.boxeo_record_draws || 0;
    } else {
      // Fallback a campos legacy
      wins = fighterProfile.record_wins || 0;
      losses = fighterProfile.record_losses || 0;
      draws = fighterProfile.record_draws || 0;
    }

    const totalFights = wins + losses + draws;
    const winPercentage = totalFights > 0 ? Math.round((wins / totalFights) * 100) : 0;

    return {
      wins,
      losses,
      draws,
      totalFights,
      winPercentage,
      source: 'manual',
      manualRecord: { wins, losses, draws, totalFights, winPercentage }
    };
  };

  // Mantener compatibilidad con el método anterior (para Amateur/Pro si se necesita)
  const calculateCombinedRecord = (recordType: RecordType): CombinedFighterRecord => {
    const fightRecord = calculateFightRecord(recordType);
    
    // Manual record from fighter profile
    let manualRecord: FighterRecord = {
      wins: 0,
      losses: 0,
      draws: 0,
      totalFights: 0,
      winPercentage: 0
    };

    if (fighterProfile) {
      // Check if the manual record matches the requested type
      const profileRecordType = fighterProfile.record_type?.toLowerCase();
      const requestedType = recordType.toLowerCase();
      
      // Map Spanish to English for comparison
      const isMatchingType = 
        (profileRecordType === 'profesional' && requestedType === 'professional') ||
        (profileRecordType === 'amateur' && requestedType === 'amateur') ||
        (profileRecordType === requestedType);

      if (isMatchingType) {
        const wins = fighterProfile.record_wins || 0;
        const losses = fighterProfile.record_losses || 0;
        const draws = fighterProfile.record_draws || 0;
        const totalFights = wins + losses + draws;
        
        manualRecord = {
          wins,
          losses,
          draws,
          totalFights,
          winPercentage: totalFights > 0 ? Math.round((wins / totalFights) * 100) : 0
        };
      }
    }

    // Combine records: manual + fights
    const combinedWins = manualRecord.wins + fightRecord.wins;
    const combinedLosses = manualRecord.losses + fightRecord.losses;
    const combinedDraws = manualRecord.draws + fightRecord.draws;
    const combinedTotal = combinedWins + combinedLosses + combinedDraws;
    const combinedWinPercentage = combinedTotal > 0 ? Math.round((combinedWins / combinedTotal) * 100) : 0;

    // Determine source
    let source: 'manual' | 'fights' | 'combined' = 'manual';
    if (fightRecord.totalFights > 0 && manualRecord.totalFights > 0) {
      source = 'combined';
    } else if (fightRecord.totalFights > 0) {
      source = 'fights';
    } else if (manualRecord.totalFights > 0) {
      source = 'manual';
    }

    return {
      wins: combinedWins,
      losses: combinedLosses,
      draws: combinedDraws,
      totalFights: combinedTotal,
      winPercentage: combinedWinPercentage,
      source,
      manualRecord,
      fightRecord
    };
  };

  return {
    calculateCombinedRecord,
    calculateRecordByDiscipline,
    isLoading: isLoadingFights || isLoadingProfile,
    fightHistory,
    fighterProfile,
    // Helper methods for each record type
    getAmateurRecord: () => calculateCombinedRecord('AMATEUR'),
    getProfessionalRecord: () => calculateCombinedRecord('PROFESSIONAL'),
    // Nuevo: Récord según disciplina de competencia
    getDisciplineRecord: () => calculateRecordByDiscipline(),
  };
}