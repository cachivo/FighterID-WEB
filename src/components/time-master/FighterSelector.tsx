import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { User, ChevronsUpDown, Check } from "lucide-react";
import { memo, useMemo, useState } from "react";

interface FighterSelectorProps {
  fighters: Array<{ id: string; displayName: string; record: string }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  label: string;
  isLoading: boolean;
  corner: 'red' | 'blue';
  disabled?: boolean;
}

function FighterSelectorImpl({ fighters, selectedId, onSelect, label, isLoading, corner, disabled }: FighterSelectorProps) {
  const [open, setOpen] = useState(false);
  const borderL = corner === 'red' ? 'border-l-fighter-danger' : 'border-l-fighter-info';
  const bg = corner === 'red' ? 'bg-fighter-danger/10' : 'bg-fighter-info/10';
  const text = corner === 'red' ? 'text-fighter-danger' : 'text-fighter-info';

  const selectedFighter = useMemo(
    () => fighters.find((f) => f.id === selectedId),
    [fighters, selectedId],
  );

  if (isLoading) {
    return (
      <div className={cn("rounded-lg border-l-4 p-4 bg-card", borderL)}>
        <p className={cn("text-xs uppercase tracking-wider font-semibold mb-2", text)}>{label}</p>
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border border-l-4 p-4 bg-card min-w-0", borderL)}>
      <div className={cn("flex items-center gap-2 mb-3 px-2 py-1 rounded", bg)}>
        <User className={cn("h-4 w-4", text)} />
        <p className={cn("text-xs uppercase tracking-wider font-semibold", text)}>{label}</p>
      </div>
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex min-h-[44px] w-full min-w-0 items-start justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left",
              !selectedId && "text-muted-foreground items-center",
            )}
          >
            {selectedFighter ? (
              <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="break-words leading-tight">{selectedFighter.displayName}</span>
                <span className="text-xs text-muted-foreground">{selectedFighter.record}</span>
              </span>
            ) : (
              <span>Selecciona peleador</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 mt-1" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar peleador..." />
            <CommandList>
              <CommandEmpty>No hay peleadores</CommandEmpty>
              <CommandGroup>
                {fighters.map((f) => (
                  <CommandItem
                    key={f.id}
                    value={f.displayName + " " + f.record}
                    onSelect={() => {
                      onSelect(f.id);
                      setOpen(false);
                    }}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="break-words leading-tight">{f.displayName}</span>
                      <span className="text-xs text-muted-foreground">{f.record}</span>
                    </span>
                    {selectedId === f.id && <Check className="h-4 w-4 shrink-0 mt-1" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Memoize: parent re-renders ~60Hz during a round; nothing here depends on `timeMs`.
export const FighterSelector = memo(FighterSelectorImpl);
