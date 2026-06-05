import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface FighterSelectorProps {
  fighters: Array<{ id: string; displayName: string; record: string }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  label: string;
  isLoading: boolean;
  corner: 'red' | 'blue';
  disabled?: boolean;
}

export function FighterSelector({ fighters, selectedId, onSelect, label, isLoading, corner, disabled }: FighterSelectorProps) {
  const borderL = corner === 'red' ? 'border-l-fighter-danger' : 'border-l-fighter-info';
  const bg = corner === 'red' ? 'bg-fighter-danger/10' : 'bg-fighter-info/10';
  const text = corner === 'red' ? 'text-fighter-danger' : 'text-fighter-info';

  if (isLoading) {
    return (
      <div className={cn("rounded-lg border-l-4 p-4 bg-card", borderL)}>
        <p className={cn("text-xs uppercase tracking-wider font-semibold mb-2", text)}>{label}</p>
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border border-l-4 p-4 bg-card", borderL)}>
      <div className={cn("flex items-center gap-2 mb-3 px-2 py-1 rounded", bg)}>
        <User className={cn("h-4 w-4", text)} />
        <p className={cn("text-xs uppercase tracking-wider font-semibold", text)}>{label}</p>
      </div>
      <Select value={selectedId ?? undefined} onValueChange={onSelect} disabled={disabled}>
        <SelectTrigger className="min-h-[44px]">
          <SelectValue placeholder="Selecciona peleador" />
        </SelectTrigger>
        <SelectContent>
          {fighters.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">No hay peleadores</div>
          ) : (
            fighters.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <div className="flex items-center justify-between gap-3 w-full">
                  <span>{f.displayName}</span>
                  <span className="text-xs text-muted-foreground">{f.record}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
