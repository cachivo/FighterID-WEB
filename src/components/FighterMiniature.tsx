import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, MapPin, Calendar } from 'lucide-react';
import { getWeightClassLabel } from '@/lib/constants/disciplines';

interface FighterMiniatureProps {
  fighter: {
    id: string;
    first_name: string;
    last_name: string;
    nickname?: string;
    avatar_url?: string;
    country?: string;
    weight_class?: string;
    record_wins?: number;
    record_losses?: number;
    record_draws?: number;
    
    martial_arts?: string[];
    fighting_style?: string;
    boxrec_url?: string;
    tapology_url?: string;
  };
}

export const FighterMiniature = ({ fighter }: FighterMiniatureProps) => {
  const totalFights = (fighter.record_wins || 0) + (fighter.record_losses || 0) + (fighter.record_draws || 0);
  const winPercentage = totalFights > 0 ? Math.round(((fighter.record_wins || 0) / totalFights) * 100) : 0;

  return (
    <Card className="w-[420px] border-border/50 bg-gradient-to-br from-background to-background/95 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {fighter.avatar_url ? (
              <img 
                src={fighter.avatar_url} 
                alt={`${fighter.first_name} ${fighter.last_name}`}
                className="w-24 h-24 rounded-full object-cover border-3 border-primary/30 shadow-lg hover:shadow-primary/20 transition-all duration-300"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center border-3 border-primary/30 shadow-lg">
                <span className="text-2xl font-bold text-muted-foreground">
                  {fighter.first_name?.[0]}{fighter.last_name?.[0]}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="mb-3">
              <h3 className="font-bold text-lg leading-tight text-foreground">
                {fighter.first_name} {fighter.last_name}
              </h3>
              {fighter.nickname && (
                <p className="text-base text-muted-foreground font-medium mt-1">
                  "{fighter.nickname}"
                </p>
              )}
            </div>

            {/* Record and Rating */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2 bg-card/50 rounded-lg px-3 py-1.5">
                <span className="text-fighter-success font-bold text-base">
                  {fighter.record_wins || 0}W
                </span>
                <span className="text-destructive font-bold text-base">
                  {fighter.record_losses || 0}L
                </span>
                {(fighter.record_draws || 0) > 0 && (
                  <span className="text-muted-foreground font-bold text-base">
                    {fighter.record_draws}D
                  </span>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2">
              {fighter.country && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{fighter.country}</span>
                  {fighter.weight_class && (
                    <>
                      <span className="text-border">•</span>
                      <span className="font-medium">{getWeightClassLabel(fighter.weight_class)}</span>
                    </>
                  )}
                </div>
              )}

              {fighter.martial_arts && fighter.martial_arts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {fighter.martial_arts.slice(0, 3).map((art, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-sm py-1 px-2 hover:bg-primary/10 transition-colors cursor-default"
                    >
                      {art}
                    </Badge>
                  ))}
                  {fighter.martial_arts.length > 3 && (
                    <Badge 
                      variant="outline" 
                      className="text-sm py-1 px-2 hover:bg-primary/10 transition-colors cursor-default"
                    >
                      +{fighter.martial_arts.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {fighter.fighting_style && (
                <p className="text-sm text-muted-foreground mt-2 font-medium">
                  Estilo: <span className="text-foreground">{fighter.fighting_style}</span>
                </p>
              )}

              {totalFights > 0 && (
                <div className="mt-3 p-2 bg-card/30 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Efectividad:</span>
                    <span className="font-bold text-foreground">{winPercentage}%</span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-2 mt-1">
                    <div 
                      className="bg-gradient-to-r from-fighter-success to-fighter-success/80 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${winPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {totalFights} peleas totales
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};