import { useVisionEngineStatus } from '@/hooks/useVisionEngineStatus';
import { Activity, Users, Wifi, WifiOff, Clock, Gauge } from 'lucide-react';
import { useState, useEffect } from 'react';

interface VisionMetricsPanelProps {
  fightId: string;
}

function useRelativeTime(timestamp: string | null) {
  const [label, setLabel] = useState('—');
  useEffect(() => {
    if (!timestamp) { setLabel('—'); return; }
    const tick = () => {
      const diff = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 1000));
      setLabel(diff < 60 ? `${diff}s` : `${Math.floor(diff / 60)}m ${diff % 60}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timestamp]);
  return label;
}

function fpsColor(fps: number | null) {
  if (fps === null) return 'text-muted-foreground';
  if (fps >= 20) return 'text-fighter-success';
  if (fps >= 10) return 'text-fighter-warning';
  return 'text-fighter-danger';
}

function latencyColor(ms: number | null) {
  if (ms === null) return 'text-muted-foreground';
  if (ms <= 50) return 'text-fighter-success';
  if (ms <= 150) return 'text-fighter-warning';
  return 'text-fighter-danger';
}

export default function VisionMetricsPanel({ fightId }: VisionMetricsPanelProps) {
  const { isLive, deviceId, fps, personsDetected, latencyMs, lastHeartbeat } = useVisionEngineStatus(fightId);
  const heartbeatAgo = useRelativeTime(lastHeartbeat);

  const noSession = !isLive && !deviceId;

  return (
    <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Activity className="h-3.5 w-3.5 text-primary" />
        Vision Engine
      </div>

      {noSession ? (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <WifiOff className="h-3 w-3" />
          Sin motor conectado
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Status */}
          <MetricCard
            icon={isLive ? <Wifi className="h-3.5 w-3.5 text-fighter-success" /> : <WifiOff className="h-3.5 w-3.5 text-fighter-danger" />}
            label="Estado"
            value={isLive ? 'Conectado' : 'Offline'}
            valueClass={isLive ? 'text-fighter-success' : 'text-fighter-danger'}
            sub={deviceId && deviceId !== 'unknown' ? deviceId : undefined}
          />

          {/* FPS */}
          <MetricCard
            icon={<Gauge className="h-3.5 w-3.5" />}
            label="FPS"
            value={fps !== null ? `${Math.round(fps)}` : '—'}
            valueClass={fpsColor(fps)}
          />

          {/* Latency */}
          <MetricCard
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Latencia"
            value={latencyMs !== null ? `${Math.round(latencyMs)} ms` : '—'}
            valueClass={latencyColor(latencyMs)}
          />

          {/* Persons */}
          <MetricCard
            icon={<Users className="h-3.5 w-3.5" />}
            label="Personas"
            value={personsDetected !== null ? `${personsDetected}` : '—'}
            valueClass="text-foreground"
            sub={lastHeartbeat ? `hace ${heartbeatAgo}` : undefined}
          />
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, valueClass, sub }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
}) {
  return (
    <div className="bg-muted/50 rounded-md p-2 space-y-0.5">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase">
        {icon}
        {label}
      </div>
      <div className={`text-sm font-mono font-bold ${valueClass ?? 'text-foreground'}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}
