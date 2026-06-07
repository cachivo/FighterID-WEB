import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FighterProfile } from '@/hooks/useFighterProfiles';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Award, Medal, Trophy, Gem, Swords, Building2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getWeightClassLabel, MARTIAL_ARTS_TRAINING } from '@/lib/constants/disciplines';

interface FighterCardProps {
  fighter: FighterProfile;
  onClick?: () => void;
}

const LEVEL_CONFIG: Record<string, { icon: LucideIcon; gradient: string; label: string }> = {
  BRONZE: { icon: Award, gradient: 'from-orange-800 to-orange-600', label: 'Bronce' },
  SILVER: { icon: Medal, gradient: 'from-gray-400 to-gray-300', label: 'Plata' },
  GOLD: { icon: Trophy, gradient: 'from-yellow-500 to-yellow-400', label: 'Oro' },
  DIAMOND: { icon: Gem, gradient: 'from-blue-500 to-cyan-400', label: 'Diamante' },
};

// Helper para obtener récord según disciplina de competencia
const getRecordForDiscipline = (fighter: FighterProfile) => {
  if (fighter.discipline === 'MMA') {
    return {
      wins: fighter.mma_record_wins || 0,
      losses: fighter.mma_record_losses || 0,
      draws: fighter.mma_record_draws || 0
    };
  } else if (fighter.discipline === 'Boxeo') {
    return {
      wins: fighter.boxeo_record_wins || 0,
      losses: fighter.boxeo_record_losses || 0,
      draws: fighter.boxeo_record_draws || 0
    };
  }
  // Fallback a campos legacy
  return {
    wins: fighter.record_wins || 0,
    losses: fighter.record_losses || 0,
    draws: fighter.record_draws || 0
  };
};

export function FighterCard({ fighter, onClick }: FighterCardProps) {
  const navigate = useNavigate();

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-professional-accent';
      case 'suspended': return 'bg-professional-danger';
      case 'expired': return 'bg-professional-muted';
      default: return 'bg-professional-muted';
    }
  };
  
  // Usar récord por disciplina
  const record = getRecordForDiscipline(fighter);
  const totalFights = record.wins + record.losses + record.draws;
  
  // Get completion level config
  const completionLevel = (fighter as any).completion_level || 'BRONZE';
  const levelConfig = LEVEL_CONFIG[completionLevel];
  const LevelIcon = levelConfig?.icon || Award;
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-card border-border hover:border-professional-accent/30 touch-manipulation relative"
      onClick={onClick}
    >
      {/* Level Badge - Only show for Silver and above */}
      {completionLevel !== 'BRONZE' && levelConfig && (
        <Badge 
          variant="outline" 
          className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm border-border/50 z-10"
        >
          <LevelIcon className="h-3 w-3 mr-1" />
          {levelConfig.label}
        </Badge>
      )}
      
      <CardHeader className="pb-3 p-3 sm:p-4 md:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {fighter.avatar_url ? (
            <img 
              src={fighter.avatar_url} 
              alt={`${fighter.first_name} ${fighter.last_name}`}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0 aspect-square"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-professional-muted flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-professional-primary">
                {fighter.first_name[0]}{fighter.last_name[0]}
              </span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3
              className="text-base sm:text-lg font-semibold text-foreground truncate leading-tight"
              title={`${fighter.first_name} ${fighter.last_name}`}
            >
              {fighter.first_name} {fighter.last_name}
            </h3>
            {fighter.nickname && (
              <p
                className="text-sm text-professional-accent font-medium truncate"
                title={`"${fighter.nickname}"`}
              >
                "{fighter.nickname}"
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {getWeightClassLabel(fighter.weight_class)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {fighter.country}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="break-words">
                {(fighter as any).gym?.nombre || fighter.gym_name || 'Independiente'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm">Récord</p>
            <p className="font-semibold text-foreground text-sm sm:text-base">
              {record.wins}-{record.losses}-{record.draws}
            </p>
          </div>
          
          {/* Disciplina de Competencia - siempre visible */}
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1">
              <Swords className="h-3 w-3" />
              Compite en
            </p>
            <Badge variant="default" className="text-xs mt-1">
              {fighter.discipline || 'N/A'}
            </Badge>
          </div>
          
          {/* Artes Marciales de Entrenamiento - separadas */}
          {fighter.martial_arts && fighter.martial_arts.length > 0 && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs sm:text-sm">Entrena</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {fighter.martial_arts.map(art => (
                  <Badge key={art} variant="outline" className="text-xs">
                    {MARTIAL_ARTS_TRAINING.find(m => m.value === art)?.label || art}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {fighter.fighting_style && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Estilo de Pelea</p>
              <p className="font-medium text-foreground">{fighter.fighting_style}</p>
            </div>
          )}
        </div>
        
        {totalFights === 0 && (
          <Badge variant="outline" className="mt-3">
            Debutante
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}