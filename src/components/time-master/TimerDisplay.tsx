import { Badge } from "@/components/ui/badge";
import { formatRoundTime } from "@/lib/scoring-utils";
import { cn } from "@/lib/utils";
import { Timer, Pause, Play, CheckCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TimerDisplayProps {
  timeMs: number;
  roundDuration: number;
  isRunning: boolean;
  isPaused: boolean;
  currentRound: number;
  totalRounds: number;
  phase: string;
  restTimeMs?: number;
  fighterAName?: string;
  fighterBName?: string;
}

export function TimerDisplay({
  timeMs, roundDuration, isRunning, isPaused, currentRound, totalRounds, phase, restTimeMs = 0,
  fighterAName, fighterBName,
}: TimerDisplayProps) {
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

  // Responsive size based on container width — only constrained by horizontal space
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(280);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const next = Math.max(200, Math.min(360, w - 32));
      setSize(Math.round(next));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const strokeWidth = Math.max(6, Math.round(size * 0.03));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  const displayMs = isRest ? restTimeMs : elapsedMs;
  const displayLabel = isRest ? 'DESCANSO' : 'TRANSCURRIDO';

  const FighterTag = ({ name, corner }: { name?: string; corner: 'red' | 'blue' }) => (
    <div className={cn(
      "min-w-0 flex flex-col items-center text-center px-3 py-2 rounded border-2",
      corner === 'red' ? 'border-fighter-danger/60 bg-fighter-danger/5' : 'border-blue-500/60 bg-blue-500/5'
    )}>
      <span className={cn(
        "text-[10px] uppercase tracking-widest font-semibold",
        corner === 'red' ? 'text-fighter-danger' : 'text-blue-400'
      )}>
        {corner === 'red' ? 'Esquina Roja' : 'Esquina Azul'}
      </span>
      <span className="text-sm sm:text-base font-bold leading-tight break-words line-clamp-2 mt-0.5">
        {name || '—'}
      </span>
    </div>
  );

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center gap-4">
      {/* Phase + Round headline */}
      <div className="flex flex-col items-center gap-2 w-full">
        <Badge variant="outline" className="px-3 py-1 gap-1.5">
          <PhaseIcon className="h-3.5 w-3.5" />
          {p.label}
        </Badge>
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Round</div>
          <div className="text-5xl sm:text-6xl font-black tabular-nums leading-none text-primary">
            {currentRound}
            <span className="text-2xl sm:text-3xl text-muted-foreground font-bold"> / {totalRounds}</span>
          </div>
        </div>
      </div>

      {/* Timer circle centered */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
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
          <div
            className={cn("font-mono font-bold tabular-nums", getTimerColor())}
            style={{ fontSize: Math.round(size * 0.22) }}
          >
            {formatRoundTime(displayMs)}
          </div>
          <div className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mt-1">
            {displayLabel}
          </div>
        </div>
      </div>

      {/* Fighter names below the timer */}
      <div className="w-full grid grid-cols-2 gap-3">
        <FighterTag name={fighterAName} corner="red" />
        <FighterTag name={fighterBName} corner="blue" />
      </div>
    </div>
  );
}
