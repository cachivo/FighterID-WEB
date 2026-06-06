import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Check, Clock, Zap } from "lucide-react";
import { memo } from "react";

interface RoundTrackerProps {
  totalRounds: number;
  currentRound: number;
  roundsCompleted: Array<{ roundNumber: number; durationMs: number; scoreA?: number; scoreB?: number; knockdownsA?: number; knockdownsB?: number }>;
  isRestPeriod: boolean;
  restTimeMs: number;
  onEditRound?: (roundNumber: number) => void;
}

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
};

function RoundTrackerImpl({ totalRounds, currentRound, roundsCompleted, isRestPeriod, restTimeMs, onEditRound }: RoundTrackerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5" />
          Rounds
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isRestPeriod && (
          <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
              <Clock className="h-4 w-4" />
              Descanso
            </div>
            <span className="font-mono text-amber-400 tabular-nums">{fmt(restTimeMs)}</span>
          </div>
        )}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {Array.from({ length: totalRounds }, (_, i) => {
              const n = i + 1;
              const done = roundsCompleted.find((r) => r.roundNumber === n);
              const current = n === currentRound && !done;
              return (
                <button
                  type="button"
                  key={n}
                  onClick={() => done && onEditRound?.(n)}
                  disabled={!done}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[60px] h-16 rounded-lg border text-xs font-semibold transition",
                    done && "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 cursor-pointer",
                    current && "bg-primary/10 border-primary text-primary ring-2 ring-primary/30",
                    !done && !current && "bg-muted/30 border-border text-muted-foreground cursor-default",
                  )}
                >
                  <div>{done ? <Check className="h-4 w-4" /> : `R${n}`}</div>
                  <div className="text-[10px] mt-0.5">{done ? 'Listo' : current ? 'Actual' : 'Pendiente'}</div>
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        {roundsCompleted.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Rounds completados</p>
            <div className="space-y-1">
              {roundsCompleted.map((r) => {
                // No double-subtraction: judge already entered post-KD scores.
                const a = r.scoreA ?? 10;
                const b = r.scoreB ?? 10;
                return (
                  <button
                    type="button"
                    key={r.roundNumber}
                    onClick={() => onEditRound?.(r.roundNumber)}
                    className="w-full flex items-center justify-between gap-2 text-sm hover:bg-muted/40 rounded px-2 py-3 min-h-[44px]"
                  >
                    <Badge variant="outline">Round {r.roundNumber}</Badge>
                    <span className="font-mono tabular-nums">
                      <span className={cn(a > b && "text-fighter-danger font-bold")}>{a}</span>
                      <span className="text-muted-foreground mx-1">-</span>
                      <span className={cn(b > a && "text-fighter-info font-bold")}>{b}</span>
                    </span>
                    <span className="font-mono tabular-nums text-xs text-muted-foreground">
                      {fmt(r.durationMs)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Memoize: parent re-renders every animation frame during a round; nothing here uses `timeMs`.
export const RoundTracker = memo(RoundTrackerImpl);
