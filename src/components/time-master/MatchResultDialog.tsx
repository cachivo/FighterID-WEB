import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Trophy, FileText, Swords } from "lucide-react";

export type MatchResultType =
  | 'ko' | 'tko'
  | 'decision_unanimous' | 'decision_split' | 'decision_majority'
  | 'draw' | 'dq' | 'no_contest';

interface RoundSummary {
  roundNumber: number;
  scoreA: number;
  scoreB: number;
  knockdownsA: number;
  knockdownsB: number;
}

interface MatchResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: { winnerId: string | null; resultType: MatchResultType; notes?: string }) => void;
  fighterA: { id: string; name: string };
  fighterB: { id: string; name: string };
  currentRound: number;
  rounds?: RoundSummary[];
  totalScoreA?: number;
  totalScoreB?: number;
}

const RESULT_OPTIONS: Array<{ value: MatchResultType; label: string }> = [
  { value: 'ko', label: 'KO (Knockout)' },
  { value: 'tko', label: 'TKO (Technical Knockout)' },
  { value: 'decision_unanimous', label: 'Decisión Unánime' },
  { value: 'decision_split', label: 'Decisión Dividida' },
  { value: 'decision_majority', label: 'Decisión Mayoritaria' },
  { value: 'draw', label: 'Empate (Draw)' },
  { value: 'dq', label: 'Descalificación (DQ)' },
  { value: 'no_contest', label: 'No Contest' },
];

export function MatchResultDialog({ isOpen, onClose, onSubmit, fighterA, fighterB, currentRound, rounds = [], totalScoreA = 0, totalScoreB = 0 }: MatchResultDialogProps) {
  const [resultType, setResultType] = useState<MatchResultType>('decision_unanimous');
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Auto-suggest based on totals
      if (rounds.length > 0 && totalScoreA !== totalScoreB) {
        setResultType('decision_unanimous');
        setWinnerId(totalScoreA > totalScoreB ? fighterA.id : fighterB.id);
      } else if (rounds.length > 0 && totalScoreA === totalScoreB) {
        setResultType('draw');
        setWinnerId(null);
      } else {
        setResultType('decision_unanimous');
        setWinnerId(null);
      }
      setNotes('');
    }
  }, [isOpen, rounds.length, totalScoreA, totalScoreB, fighterA.id, fighterB.id]);

  useEffect(() => {
    if (resultType === 'draw' || resultType === 'no_contest') setWinnerId(null);
  }, [resultType]);

  const needsWinner = resultType !== 'draw' && resultType !== 'no_contest';
  const canSubmit = !needsWinner || winnerId !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Swords className="h-5 w-5" /> Resultado de la Pelea</DialogTitle>
          <DialogDescription>Registra el resultado para la pelea terminada en Round {currentRound}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Trophy className="h-4 w-4" /> Tipo de Resultado</Label>
            <RadioGroup value={resultType} onValueChange={(v) => setResultType(v as MatchResultType)} className="space-y-1">
              {RESULT_OPTIONS.map((o) => (
                <div
                  key={o.value}
                  className={cn(
                    "flex items-center gap-2 rounded-md border border-border p-2 cursor-pointer hover:bg-muted/50",
                    resultType === o.value && "border-primary bg-primary/5"
                  )}
                  onClick={() => setResultType(o.value)}
                >
                  <RadioGroupItem value={o.value} id={o.value} />
                  <Label htmlFor={o.value} className="cursor-pointer flex-1 text-sm">{o.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {needsWinner && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Trophy className="h-4 w-4" /> Ganador</Label>
              <RadioGroup value={winnerId ?? ''} onValueChange={setWinnerId}>
                {[
                  { id: fighterA.id, name: fighterA.name, corner: 'Esquina Roja', color: 'fighter-danger' },
                  { id: fighterB.id, name: fighterB.name, corner: 'Esquina Azul', color: 'fighter-info' },
                ].map((f) => (
                  <div
                    key={f.id}
                    className={cn(
                      "flex items-center gap-2 rounded-md border border-border p-3 cursor-pointer hover:bg-muted/50",
                      winnerId === f.id && "border-primary bg-primary/5"
                    )}
                    onClick={() => setWinnerId(f.id)}
                  >
                    <RadioGroupItem value={f.id} id={`w-${f.id}`} />
                    <Label htmlFor={`w-${f.id}`} className="cursor-pointer flex-1">
                      <div className="font-medium">{f.name || 'Sin nombre'}</div>
                      <div className={cn("text-xs", `text-${f.color}`)}>{f.corner}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." className="min-h-[80px] resize-none" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="min-h-[44px]">Cancelar</Button>
          <Button onClick={() => onSubmit({ winnerId, resultType, notes: notes || undefined })} disabled={!canSubmit} className="min-h-[44px]">
            <Trophy className="h-4 w-4 mr-2" /> Confirmar Resultado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
