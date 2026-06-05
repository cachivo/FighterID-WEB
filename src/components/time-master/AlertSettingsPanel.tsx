import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Volume2, Vibrate, Play, Bell } from "lucide-react";
import {
  type AlertSettings, type AlertKind, ALERT_LABELS, DEFAULT_ALERT_SETTINGS,
} from "@/lib/timeMasterAlerts";

interface AlertSettingsPanelProps {
  settings: AlertSettings;
  onChange: (s: AlertSettings) => void;
  onPreview: (kind: AlertKind) => void;
}

const KINDS: AlertKind[] = ['bell', 'warning', 'rest'];

export function AlertSettingsPanel({ settings, onChange, onPreview }: AlertSettingsPanelProps) {
  const update = (kind: AlertKind, patch: Partial<AlertSettings[AlertKind]>) => {
    onChange({ ...settings, [kind]: { ...settings[kind], ...patch } });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5" /> Sonido y Vibración
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_ALERT_SETTINGS)}>
          Restablecer
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {KINDS.map((kind) => {
          const cfg = settings[kind];
          return (
            <div key={kind} className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{ALERT_LABELS[kind]}</p>
                <Button variant="outline" size="sm" onClick={() => onPreview(kind)} className="shrink-0">
                  <Play className="h-3.5 w-3.5 mr-1" /> Probar
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-3 py-2">
                  <Label htmlFor={`${kind}-sound`} className="flex items-center gap-2 cursor-pointer">
                    <Volume2 className="h-4 w-4" /> Sonido
                  </Label>
                  <Switch
                    id={`${kind}-sound`}
                    checked={cfg.sound}
                    onCheckedChange={(v) => update(kind, { sound: v })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-3 py-2">
                  <Label htmlFor={`${kind}-vibrate`} className="flex items-center gap-2 cursor-pointer">
                    <Vibrate className="h-4 w-4" /> Vibración
                  </Label>
                  <Switch
                    id={`${kind}-vibrate`}
                    checked={cfg.vibrate}
                    onCheckedChange={(v) => update(kind, { vibrate: v })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Volumen</span>
                  <span className="font-mono">{Math.round(cfg.volume * 100)}%</span>
                </div>
                <Slider
                  value={[Math.round(cfg.volume * 100)]}
                  min={0}
                  max={100}
                  step={5}
                  disabled={!cfg.sound}
                  onValueChange={([v]) => update(kind, { volume: v / 100 })}
                />
              </div>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">
          La vibración solo funciona en dispositivos móviles compatibles. Las preferencias se guardan en este dispositivo.
        </p>
      </CardContent>
    </Card>
  );
}
