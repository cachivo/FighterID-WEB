import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Gavel, CheckCircle2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RESULT_TYPES = [
  { value: 'ko', label: 'KO' },
  { value: 'tko', label: 'TKO' },
  { value: 'decision_unanimous', label: 'Decisión unánime' },
  { value: 'decision_split', label: 'Decisión dividida' },
  { value: 'decision_majority', label: 'Decisión mayoritaria' },
  { value: 'draw', label: 'Empate' },
  { value: 'dq', label: 'Descalificación' },
  { value: 'no_contest', label: 'Sin resultado' },
];

interface Props {
  redName: string;
  blueName: string;
  redId: string;
  blueId: string;
  alreadyFinalized: boolean;
  recordsUpdated: boolean;
  finalWinnerId: string | null;
  finalResultType: string | null;
  onSubmit: (v: { winner_fighter_id: string | null; result_type: string; notes: string; update_records: boolean }) => Promise<void>;
}

export function JudgeVerdictPanel({
  redName, blueName, redId, blueId,
  alreadyFinalized, recordsUpdated, finalWinnerId, finalResultType,
  onSubmit,
}: Props) {
  const { toast } = useToast();
  const [winner, setWinner] = useState<'red' | 'blue' | 'none'>('red');
  const [resultType, setResultType] = useState('decision_unanimous');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isDrawLike = resultType === 'draw' || resultType === 'no_contest';

  const handleSubmit = async (update_records: boolean) => {
    setSubmitting(true);
    try {
      const winnerId = isDrawLike ? null : (winner === 'red' ? redId : winner === 'blue' ? blueId : null);
      await onSubmit({ winner_fighter_id: winnerId, result_type: resultType, notes, update_records });
      toast({
        title: 'Veredicto enviado',
        description: update_records ? 'Récords actualizados.' : 'Resultado guardado sin afectar récords.',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (alreadyFinalized) {
    const winnerName = finalWinnerId === redId ? redName : finalWinnerId === blueId ? blueName : null;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Veredicto final
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Ganador: </span>
            <span className="font-semibold">{winnerName ?? '—'}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Resultado: </span>
            <span className="font-mono">{finalResultType}</span>
          </div>
          <div>
            <Badge variant={recordsUpdated ? 'default' : 'secondary'}>
              {recordsUpdated ? 'Récords actualizados' : 'Récords NO actualizados'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gavel className="h-5 w-5 text-primary" /> Decisión del Juez
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isDrawLike && (
          <div className="space-y-2">
            <Label>Ganador</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={winner === 'red' ? 'default' : 'outline'}
                className={winner === 'red' ? 'bg-fighter-danger hover:bg-fighter-danger/90' : ''}
                onClick={() => setWinner('red')}
              >
                {redName || 'Red'}
              </Button>
              <Button
                type="button"
                variant={winner === 'blue' ? 'default' : 'outline'}
                className={winner === 'blue' ? 'bg-fighter-info hover:bg-fighter-info/90' : ''}
                onClick={() => setWinner('blue')}
              >
                {blueName || 'Blue'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Tipo de resultado</Label>
          <Select value={resultType} onValueChange={setResultType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RESULT_TYPES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Notas (opcional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <Button
            variant="outline"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="min-h-[48px]"
          >
            <FileText className="h-4 w-4 mr-2" />
            Guardar solo veredicto
          </Button>
          <Button
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="min-h-[48px]"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Guardar y actualizar récords
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
