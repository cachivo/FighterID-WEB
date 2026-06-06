import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

export interface RoundScoreValue {
  scoreA: number;
  scoreB: number;
  knockdownsA: number;
  knockdownsB: number;
  warningsA: number;
  warningsB: number;
  note?: string;
}

interface RoundScoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (v: RoundScoreValue) => void;
  roundNumber: number;
  fighterAName: string;
  fighterBName: string;
  initial?: Partial<RoundScoreValue>;
}

type Quick = 'red' | 'blue' | 'even' | null;

export function RoundScoreDialog({
  isOpen, onClose, onSubmit, roundNumber, fighterAName, fighterBName, initial,
}: RoundScoreDialogProps) {
  const [scoreA, setScoreA] = useState(10);
  const [scoreB, setScoreB] = useState(9);
  const [kdA, setKdA] = useState(0);
  const [kdB, setKdB] = useState(0);
  const [waA, setWaA] = useState(0);
  const [waB, setWaB] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setScoreA(initial?.scoreA ?? 10);
    setScoreB(initial?.scoreB ?? 9);
    setKdA(initial?.knockdownsA ?? 0);
    setKdB(initial?.knockdownsB ?? 0);
    setWaA(initial?.warningsA ?? 0);
    setWaB(initial?.warningsB ?? 0);
    setNote(initial?.note ?? '');
  }, [isOpen, initial]);

  const applyQuick = (q: Quick) => {
    if (q === 'red') { setScoreA(10); setScoreB(9); }
    else if (q === 'blue') { setScoreA(9); setScoreB(10); }
    else if (q === 'even') { setScoreA(10); setScoreB(10); }
  };

  const num = (v: string, max = 10, min = 0) => {
    const n = parseInt(v || '0', 10);
    if (Number.isNaN(n)) return 0;
    return Math.max(min, Math.min(max, n));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" /> Resultado Round {roundNumber}
          </DialogTitle>
          <DialogDescription>Registra el puntaje 10-must del round</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-2">
            <Button type="button" variant="outline" onClick={() => applyQuick('red')} className="border-fighter-danger/40">
              10-9 Roja
            </Button>
            <Button type="button" variant="outline" onClick={() => applyQuick('even')}>
              10-10
            </Button>
            <Button type="button" variant="outline" onClick={() => applyQuick('blue')} className="border-fighter-info/40">
              10-9 Azul
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={cn("rounded-md border p-3 space-y-2", "border-fighter-danger/30 bg-fighter-danger/5")}>
              <p className="text-xs font-semibold uppercase text-fighter-danger break-words leading-tight">{fighterAName || 'Roja'}</p>
              <div>
                <Label className="text-xs">Puntaje</Label>
                <Input type="number" min={6} max={10} value={scoreA} onChange={(e) => setScoreA(num(e.target.value, 10, 6))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">KD</Label>
                  <Input type="number" min={0} max={9} value={kdA} onChange={(e) => setKdA(num(e.target.value, 9))} />
                </div>
                <div>
                  <Label className="text-xs">Amon.</Label>
                  <Input type="number" min={0} max={9} value={waA} onChange={(e) => setWaA(num(e.target.value, 9))} />
                </div>
              </div>
            </div>

            <div className={cn("rounded-md border p-3 space-y-2", "border-fighter-info/30 bg-fighter-info/5")}>
              <p className="text-xs font-semibold uppercase text-fighter-info break-words leading-tight">{fighterBName || 'Azul'}</p>
              <div>
                <Label className="text-xs">Puntaje</Label>
                <Input type="number" min={6} max={10} value={scoreB} onChange={(e) => setScoreB(num(e.target.value, 10, 6))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">KD</Label>
                  <Input type="number" min={0} max={9} value={kdB} onChange={(e) => setKdB(num(e.target.value, 9))} />
                </div>
                <div>
                  <Label className="text-xs">Amon.</Label>
                  <Input type="number" min={0} max={9} value={waB} onChange={(e) => setWaB(num(e.target.value, 9))} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Notas (opcional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Observaciones del round..." className="min-h-[60px] resize-none" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="min-h-[44px]">Cancelar</Button>
          <Button
            onClick={() => onSubmit({
              scoreA, scoreB,
              knockdownsA: kdA, knockdownsB: kdB,
              warningsA: waA, warningsB: waB,
              note: note || undefined,
            })}
            className="min-h-[44px]"
          >
            Guardar Round
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
