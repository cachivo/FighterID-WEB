import { useMemo, useState, useEffect } from 'react';
import { useSystemAssets } from '@/hooks/useSystemAssets';
import { useHudDemoMode } from '@/hooks/useHudDemoMode';
import { useVisionSyncSession } from '@/hooks/useVisionSyncSession';
import VisionSyncStatus from '@/components/VisionSyncStatus';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface StrikeStats {
  attempted: number;
  connected: number;
  accuracy: number;
  byType: Record<string, { attempted: number; connected: number }>;
  recentActivity: number;
}

function computeStats(events: any[], fighter: string): StrikeStats {
  const mine = events.filter(e => e.fighter === fighter);
  const attempted = mine.filter(e => e.event_type === 'strike_attempted').length;
  const connected = mine.filter(e => e.event_type === 'strike_connected').length;

  const byType: Record<string, { attempted: number; connected: number }> = {};
  for (const e of mine) {
    const t = e.strike_type || 'other';
    if (!byType[t]) byType[t] = { attempted: 0, connected: 0 };
    if (e.event_type === 'strike_attempted') byType[t].attempted++;
    if (e.event_type === 'strike_connected') byType[t].connected++;
  }

  const now = Date.now();
  const recentActivity = mine.filter(e => {
    const eventTime = new Date(e.created_at).getTime();
    return now - eventTime < 30000;
  }).length;

  return { attempted, connected, accuracy: attempted > 0 ? Math.round((connected / attempted) * 100) : 0, byType, recentActivity };
}

function FighterPanel({ name, nickname, stats, color }: {
  name: string; nickname?: string; stats: StrikeStats; color: 'red' | 'blue';
}) {
  const isRed = color === 'red';
  const accent = isRed ? 'text-red-400' : 'text-blue-400';
  const bg = isRed ? 'bg-red-950/20' : 'bg-blue-950/20';
  const border = isRed ? 'border-red-800/40' : 'border-blue-800/40';
  const progressColor = isRed ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500';
  const dot = isRed ? '🔴' : '🔵';

  const topTypes = Object.entries(stats.byType)
    .sort((a, b) => b[1].connected - a[1].connected)
    .slice(0, 4);

  return (
    <div className={`${bg} border-r ${border} p-6 md:p-10 flex flex-col justify-between`}>
      <div className="space-y-1">
        <div className={`text-sm font-medium ${accent} uppercase tracking-widest`}>{dot} {isRed ? 'Esquina Roja' : 'Esquina Azul'}</div>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">{name}</h2>
        {nickname && <div className="text-lg text-gray-500 italic">"{nickname}"</div>}
      </div>

      <div className="space-y-6 my-8">
        <div className="text-center">
          <div className={`text-8xl md:text-9xl font-black ${accent} leading-none`}>{stats.connected}</div>
          <div className="text-gray-500 text-sm mt-1">Golpes Conectados</div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Precisión</span>
            <span className={`font-bold ${accent}`}>{stats.accuracy}%</span>
          </div>
          <Progress value={stats.accuracy} className={`h-3 bg-white/10 ${progressColor}`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-white/5">
            <div className="text-3xl font-bold text-white">{stats.attempted}</div>
            <div className="text-xs text-gray-500">Intentados</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5">
            <div className="text-3xl font-bold text-white">{stats.recentActivity}</div>
            <div className="text-xs text-gray-500">Últimos 30s</div>
          </div>
        </div>
      </div>

      {topTypes.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-600 uppercase tracking-wider">Tipos de Golpe</div>
          <div className="grid grid-cols-2 gap-2">
            {topTypes.map(([type, data]) => (
              <div key={type} className="flex items-center justify-between px-3 py-1.5 rounded bg-white/5 text-sm">
                <span className="text-gray-400 capitalize">{type.replace('_', ' ')}</span>
                <span className="font-mono text-white">{data.connected}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HudDemoDisplay() {
  const { logoUrl } = useSystemAssets();
  const { events, round, isRunning, reset, togglePause } = useHudDemoMode();
  const [tick, setTick] = useState(0);
  const { status: visionStatus, hudConnected, visionConnected, shortSession } = useVisionSyncSession();

  // Clock ticker for time display
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  const statsA = useMemo(() => computeStats(events, 'A'), [events, tick]);
  const statsB = useMemo(() => computeStats(events, 'B'), [events, tick]);

  const formatTime = (startIso: string, durationSec: number) => {
    const elapsed = Date.now() - new Date(startIso).getTime();
    const remaining = Math.max(0, durationSec * 1000 - elapsed);
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white select-none overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-red-950/80 via-black to-blue-950/80 border-b border-white/10">
        <img src={logoUrl} alt="Fighter ID" className="h-8 opacity-70" />
        <div className="flex items-center gap-3">
          <Badge className="bg-amber-600 text-white text-xs px-2 py-0.5 font-mono">
            DEMO
          </Badge>
          {round.status === 'live' && (
            <Badge className="bg-red-600 text-white text-lg px-4 py-1 font-mono animate-pulse">
              🔴 R{round.number} — {formatTime(round.startsAt, round.durationSeconds)}
            </Badge>
          )}
          {round.status === 'rest' && (
            <Badge variant="outline" className="text-yellow-400 border-yellow-700 text-lg px-4 py-1">
              ⏸ Descanso — Siguiente: R{round.number + 1}
            </Badge>
          )}
          {round.status === 'finished' && (
            <Badge variant="outline" className="text-green-400 border-green-700 text-lg px-4 py-1">
              ✅ Pelea Finalizada
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={togglePause} className="p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors">
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={reset} className="p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-2 gap-0 min-h-[calc(100vh-60px)]">
        <FighterPanel name="Carlos «El Toro» Méndez" nickname="El Toro" stats={statsA} color="red" />
        <FighterPanel name="Miguel «Relámpago» Cruz" nickname="Relámpago" stats={statsB} color="blue" />
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 px-6 py-2 flex justify-between items-center text-xs text-gray-600">
        <span>Eventos AI: {events.length} (simulados)</span>
        <span>MODO DEMO — Fighter ID Vision Motor</span>
      </div>
    </div>
  );
}
