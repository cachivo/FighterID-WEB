import { cn } from "@/lib/utils";
import type { PresenceMap, TmRole } from "@/hooks/useTimeMasterMatch";

interface Props {
  presence: PresenceMap;
  redName: string;
  blueName: string;
  judgeName: string;
}

const ROLES: { key: TmRole; label: string; color: string }[] = [
  { key: 'red', label: 'Red', color: 'bg-fighter-danger' },
  { key: 'blue', label: 'Blue', color: 'bg-fighter-info' },
  { key: 'judge', label: 'Judge', color: 'bg-primary' },
];

export function PresenceBar({ presence, redName, blueName, judgeName }: Props) {
  const names: Record<TmRole, string> = { red: redName, blue: blueName, judge: judgeName };
  return (
    <div className="flex flex-wrap gap-2">
      {ROLES.map(({ key, label, color }) => {
        const online = !!presence[key]?.online;
        return (
          <div
            key={key}
            className={cn(
              "flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 min-w-[140px]",
              online ? "opacity-100" : "opacity-60"
            )}
          >
            <span className={cn("w-2.5 h-2.5 rounded-full", color)} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
              <span className="text-sm font-medium truncate max-w-[160px]">{names[key] || '—'}</span>
            </div>
            <span
              className={cn(
                "ml-auto w-2 h-2 rounded-full",
                online ? "bg-emerald-500 animate-pulse" : "bg-muted"
              )}
              title={online ? 'Online' : 'Offline'}
            />
          </div>
        );
      })}
    </div>
  );
}
