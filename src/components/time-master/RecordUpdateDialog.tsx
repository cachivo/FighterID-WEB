import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Database, X } from "lucide-react";

interface RecordUpdateDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onDecline: () => void;
  fighterAName: string;
  fighterBName: string;
  winnerName: string | null;
  resultType: string;
}

const LABELS: Record<string, string> = {
  ko: 'KO', tko: 'TKO',
  decision_unanimous: 'Decisión Unánime',
  decision_split: 'Decisión Dividida',
  decision_majority: 'Decisión Mayoritaria',
  draw: 'Empate', dq: 'Descalificación', no_contest: 'No Contest',
};

export function RecordUpdateDialog({ isOpen, onConfirm, onDecline, fighterAName, fighterBName, winnerName, resultType }: RecordUpdateDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onDecline()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" /> ¿Actualizar récords oficiales?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>¿Deseas actualizar permanentemente los récords oficiales de los peleadores con este resultado?</p>
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{fighterAName || 'Peleador A'}</span>
                  <span className="text-muted-foreground text-xs">vs</span>
                  <span className="font-medium">{fighterBName || 'Peleador B'}</span>
                </div>
                <p className="text-xs text-muted-foreground">Resultado: <span className="font-semibold text-foreground">{LABELS[resultType] || resultType}</span></p>
                {winnerName ? (
                  <p className="text-xs">Ganador: <span className="font-semibold text-emerald-500">{winnerName}</span></p>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin ganador declarado</p>
                )}
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-amber-500">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">Esta acción actualizará los récords de ganadas/perdidas/empates de forma permanente.</p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDecline} className="min-h-[44px]">
            <X className="h-4 w-4 mr-2" /> No, fue sparring
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="min-h-[44px]">
            <Database className="h-4 w-4 mr-2" /> Sí, actualizar récords
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
