import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FighterProfile } from '@/hooks/useFighterProfiles';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Shield } from 'lucide-react';

interface FighterCardProps {
  fighter: FighterProfile;
  onClick?: () => void;
}

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
  const totalFights = fighter.record_wins + fighter.record_losses + fighter.record_draws;
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-card border-border hover:border-professional-accent/30 touch-manipulation"
      onClick={onClick}
    >
      <CardHeader className="pb-3 p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {fighter.avatar_url ? (
            <img 
              src={fighter.avatar_url} 
              alt={`${fighter.first_name} ${fighter.last_name}`}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-professional-muted flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl font-bold text-professional-primary">
                {fighter.first_name[0]}{fighter.last_name[0]}
              </span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
              {fighter.first_name} {fighter.last_name}
            </h3>
            {fighter.nickname && (
              <p className="text-sm text-professional-accent font-medium truncate">
                "{fighter.nickname}"
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {fighter.weight_class}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {fighter.country}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm">Record</p>
            <p className="font-semibold text-foreground text-sm sm:text-base">
              {fighter.record_wins}-{fighter.record_losses}-{fighter.record_draws}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm">ELO Rating</p>
            <p className="font-semibold text-foreground text-sm sm:text-base">
              {fighter.elo_rating}
            </p>
          </div>
          {(fighter.martial_arts && fighter.martial_arts.length > 0) || fighter.discipline ? (
            <div className="col-span-2">
              <p className="text-muted-foreground">Artes Marciales</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {fighter.martial_arts && fighter.martial_arts.length > 0 
                  ? fighter.martial_arts.map(art => (
                      <Badge key={art} variant="outline" className="text-xs">
                        {art}
                      </Badge>
                    ))
                  : fighter.discipline && (
                      <Badge variant="outline" className="text-xs">
                        {fighter.discipline}
                      </Badge>
                    )
                }
              </div>
            </div>
          ) : null}
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

        {/* License Info */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-professional-accent" />
            <span className="text-sm font-medium">{fighter.license_number}</span>
          </div>
          <Badge className={`${getLicenseStatusColor(fighter.license_status)} text-white text-xs`}>
            {fighter.license_status?.toUpperCase() || 'ACTIVA'}
          </Badge>
        </div>

        {/* License Button */}
        <Button 
          variant="professional-outline" 
          size="sm" 
          className="w-full mt-3 min-h-[44px] touch-manipulation"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/fighters/license/${fighter.id}`);
          }}
        >
          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-professional-accent" />
          <span className="text-sm">Ver Licencia</span>
        </Button>
      </CardContent>
    </Card>
  );
}