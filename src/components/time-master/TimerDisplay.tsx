import { Badge } from "@/components/ui/badge";
import { formatRoundTime } from "@/lib/scoring-utils";
import { cn } from "@/lib/utils";
import { Timer, Pause, Play, CheckCircle } from "lucide-react";

interface TimerDisplayProps {
  timeMs: number;
  roundDuration: number;
  isRunning: boolean;
  isPaused: boolean;
  currentRound: number;
  totalRounds: number;
  phase: string;
  restTimeMs?: number;
}

export function TimerDisplay({ timeMs, roundDuration, isRunning, isPaused, currentRound, totalRounds, phase, restTimeMs = 0 }: TimerDisplayProps) {
  const totalMs = roundDuration * 1000;
  const elapsedMs = Math.min(timeMs, totalMs);
  const remainingMs = totalMs - elapsedMs;
  const isRest = phase === 'between_rounds';
  const progress = isRest
    ? (60000 - restTimeMs) / 60000
    : (totalMs > 0 ? elapsedMs / totalMs : 0);
  const remainingSeconds = Math.floor(remainingMs / 1000);

  const getTimerColor = () => {
    if (phase === 'finished') return 'text-muted-foreground';
    if (isRest) return 'text-amber-400';
    if (isPaused) return 'text-yellow-400';
    if (isRunning && remainingSeconds <= 10) return 'text-destructive animate-pulse';
    if (isRunning && remainingSeconds <= 30) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getStrokeColor = () => {
    if (phase === 'finished') return 'hsl(var(--muted-foreground))';
    if (isRest) return '#f59e0b';
    if (isPaused) return '#fbbf24';
    if (isRunning && remainingSeconds <= 10) return 'hsl(var(--destructive))';
    if (isRunning && remainingSeconds <= 30) return '#f59e0b';
    return '#10b981';
  };

  const getPhase = () => {
    switch (phase) {
      case 'setup': return { label: 'CONFIGURAR', icon: Timer };
      case 'ready': return { label: 'LISTO', icon: Timer };
      case 'fighting': return { label: isPaused ? 'PAUSA' : 'PELEANDO', icon: isPaused ? Pause : Play };
      case 'between_rounds': return { label: 'DESCANSO', icon: Pause };
      case 'finished': return { label: 'TERMINADO', icon: CheckCircle };
      default: return { label: phase.toUpperCase(), icon: Timer };
    }
  };

  const p = getPhase();
  const PhaseIcon = p.icon;

  const size = 320;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  const displayMs = isRest ? restTimeMs : elapsedMs;
  const displayLabel = isRest ? 'TIEMPO DE DESCANSO' : 'TIEMPO TRANSCURRIDO';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <Badge variant="outline" className="px-3 py-1 gap-1.5">
          <PhaseIcon className="h-3.5 w-3.5" />
          {p.label}
        </Badge>
        <p className="text-sm text-muted-foreground font-medium">
          Round {currentRound} de {totalRounds}
        </p>
      </div>

      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.2s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn("text-6xl md:text-7xl font-mono font-bold tabular-nums", getTimerColor())}>
            {formatRoundTime(displayMs)}
          </div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
            {displayLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
