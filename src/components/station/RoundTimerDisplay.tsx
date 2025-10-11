import { cn } from '@/lib/utils';
import { formatRoundTime } from '@/lib/scoring-utils';

interface RoundTimerDisplayProps {
  timeMs: number;
  durationSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  className?: string;
}

export function RoundTimerDisplay({
  timeMs,
  durationSeconds,
  isRunning,
  isPaused,
  className,
}: RoundTimerDisplayProps) {
  const remainingMs = (durationSeconds * 1000) - timeMs;
  const progress = (timeMs / (durationSeconds * 1000)) * 100;

  // Determinar color según tiempo restante
  const getColor = () => {
    if (!isRunning) return 'text-muted-foreground';
    if (remainingMs <= 10000) return 'text-red-500';
    if (remainingMs <= 60000) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressColor = () => {
    if (remainingMs <= 10000) return 'bg-red-500';
    if (remainingMs <= 60000) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Tiempo */}
      <div className={cn(
        'text-9xl font-mono font-bold text-center transition-colors duration-300',
        getColor(),
        isPaused && 'animate-pulse'
      )}>
        {formatRoundTime(remainingMs)}
      </div>

      {/* Barra de progreso */}
      <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-100',
            getProgressColor()
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Estado */}
      <div className="text-center text-xl font-medium text-muted-foreground">
        {isPaused && '⏸️ PAUSADO'}
        {isRunning && !isPaused && '▶️ EN CURSO'}
        {!isRunning && !isPaused && '⏱️ DETENIDO'}
      </div>
    </div>
  );
}
