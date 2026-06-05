import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchConfigProps {
  roundConfig: 3 | 5 | 8;
  onRoundConfigChange: (rounds: 3 | 5 | 8) => void;
  roundDuration: number;
  onRoundDurationChange: (seconds: number) => void;
  disabled: boolean;
}

const ROUND_OPTIONS: Array<{ value: 3 | 5 | 8; label: string }> = [
  { value: 3, label: '3 Rounds' },
  { value: 5, label: '5 Rounds' },
  { value: 8, label: '8 Rounds' },
];

const DURATION_OPTIONS = [
  { value: 120, label: '2 min' },
  { value: 180, label: '3 min' },
];

export function MatchConfig({ roundConfig, onRoundConfigChange, roundDuration, onRoundDurationChange, disabled }: MatchConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="h-5 w-5" />
          Configuración
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Número de Rounds</p>
          <div className="grid grid-cols-3 gap-2">
            {ROUND_OPTIONS.map((o) => (
              <Button
                key={o.value}
                variant={roundConfig === o.value ? "default" : "outline"}
                onClick={() => onRoundConfigChange(o.value)}
                disabled={disabled}
                className={cn("min-h-[44px] font-semibold", roundConfig === o.value && "ring-2 ring-primary ring-offset-1")}
              >
                {o.label}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Duración por Round</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DURATION_OPTIONS.map((o) => (
              <Button
                key={o.value}
                variant={roundDuration === o.value ? "default" : "outline"}
                onClick={() => onRoundDurationChange(o.value)}
                disabled={disabled}
                className={cn("min-h-[44px] font-semibold", roundDuration === o.value && "ring-2 ring-primary ring-offset-1")}
              >
                {o.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
