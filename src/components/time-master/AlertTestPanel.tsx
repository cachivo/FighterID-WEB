import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, Bell, Activity, Zap } from "lucide-react";
import { type AlertKind, ALERT_LABELS } from "@/lib/timeMasterAlerts";

interface AlertTestPanelProps {
  onPreview: (kind: AlertKind) => void;
  settings: Record<AlertKind, { sound: boolean; vibrate: boolean }>;
}

const TESTS: { kind: AlertKind; icon: React.ReactNode; color: string }[] = [
  { kind: "bell", icon: <Bell className="h-5 w-5" />, color: "bg-primary text-primary-foreground" },
  { kind: "warning", icon: <Activity className="h-5 w-5" />, color: "bg-amber-600 text-white" },
  { kind: "rest", icon: <Zap className="h-5 w-5" />, color: "bg-emerald-600 text-white" },
];

export function AlertTestPanel({ onPreview, settings }: AlertTestPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Volume2 className="h-5 w-5" /> Probar Sonido y Vibración
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TESTS.map(({ kind, icon, color }) => {
            const cfg = settings[kind];
            const active = cfg.sound || cfg.vibrate;
            return (
              <Button
                key={kind}
                variant={active ? "default" : "secondary"}
                className={`h-auto py-4 flex flex-col items-center gap-2 ${active ? color : ""}`}
                onClick={() => onPreview(kind)}
                disabled={!active}
              >
                {icon}
                <span className="text-sm font-semibold">{ALERT_LABELS[kind]}</span>
                <div className="flex gap-1 mt-1">
                  {cfg.sound && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Sonido</Badge>}
                  {cfg.vibrate && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Vibra</Badge>}
                  {!cfg.sound && !cfg.vibrate && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Desactivado</Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Presiona cada botón para verificar que funciona en este dispositivo. Si un botón está desactivado, activa sonido o vibración en la configuración de abajo.
        </p>
      </CardContent>
    </Card>
  );
}
