import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import type { GymFighter } from '@/hooks/gyms/useGymFighters';

interface GymFighterCardProps {
  fighter: GymFighter;
}

const levelLabels: Record<string, string> = {
  Amateur: 'Amateur',
  'Semi-profesional': 'Semi-Pro',
  Profesional: 'Profesional',
};

export function GymFighterCard({ fighter }: GymFighterCardProps) {
  const navigate = useNavigate();
  const f = fighter.fighter;
  const name = [f.first_name, f.last_name].filter(Boolean).join(' ') || 'Sin nombre';

  // Show record based on discipline
  const isBoxeo = f.discipline === 'Boxeo';
  const wins = isBoxeo ? f.boxeo_record_wins : f.mma_record_wins;
  const losses = isBoxeo ? f.boxeo_record_losses : f.mma_record_losses;
  const draws = isBoxeo ? f.boxeo_record_draws : f.mma_record_draws;
  const record = `${wins || 0}-${losses || 0}-${draws || 0}`;

  return (
    <button
      onClick={() => navigate(`/fighter/${f.id}`)}
      className="w-full flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/50 active:scale-[0.98] transition-all touch-manipulation text-left"
    >
      <Avatar className="h-12 w-12 flex-shrink-0">
        <AvatarImage src={f.avatar_url || undefined} alt={name} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
          {(f.first_name?.[0] || '') + (f.last_name?.[0] || '')}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate">{name}</p>
          {f.nickname && (
            <span className="text-xs text-muted-foreground truncate">"{f.nickname}"</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-sm font-mono font-bold">{record}</span>
          {f.discipline && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">{f.discipline}</Badge>
          )}
          {f.weight_class && (
            <span className="text-xs text-muted-foreground">• {f.weight_class}</span>
          )}
        </div>
      </div>

      {f.level && (
        <Badge variant="outline" className="flex-shrink-0 text-xs">
          {levelLabels[f.level] || f.level}
        </Badge>
      )}
    </button>
  );
}
