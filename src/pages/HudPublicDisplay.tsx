import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAIStrikeEvents } from '@/hooks/useAIStrikeEvents';
import { useSystemAssets } from '@/hooks/useSystemAssets';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface FightData {
  id: string;
  fight_number?: number;
  red_fighter?: { first_name: string; last_name: string; nickname?: string };
  blue_fighter?: { first_name: string; last_name: string; nickname?: string };
}

interface RoundData {
  id: string;
  number: number;
  starts_at?: string;
  status: string;
  duration_seconds?: number;
}

export default function HudPublicDisplay() {
  const { fightId } = useParams<{ fightId: string }>();
  const [fightData, setFightData] = useState<FightData | null>(null);
  const [round, setRound] = useState<RoundData | null>(null);
  const [clockMs, setClockMs] = useState(0);
  const { logoUrl } = useSystemAssets();

  const { events, loading } = useAIStrikeEvents(fightId || '', round?.number);

  // Load fight + active round
  useEffect(() => {
    if (!fightId) return;

    const load = async () => {
      const { data: fight } = await supabase
        .from('fights')
        .select('id, fight_number, fighter_a_id, fighter_b_id')
        .eq('id', fightId)
        .single();

      if (fight) {
        const result: FightData = { id: fight.id, fight_number: fight.fight_number ?? undefined };

        const [resA, resB] = await Promise.all([
          fight.fighter_a_id
            ? supabase.from('fighter_profiles').select('first_name, last_name, nickname').eq('id', fight.fighter_a_id).single()
            : null,
          fight.fighter_b_id
            ? supabase.from('fighter_profiles').select('first_name, last_name, nickname').eq('id', fight.fighter_b_id).single()
            : null,
        ]);

        if (resA?.data) result.red_fighter = resA.data;
        if (resB?.data) result.blue_fighter = resB.data;
        setFightData(result);
      }

      const { data: rounds } = await (supabase as any)
        .from('rounds')
        .select('id, number, starts_at, status, duration_seconds')
        .eq('fight_id', fightId)
        .eq('status', 'live')
        .limit(1);

      if (rounds && rounds.length > 0) setRound(rounds[0] as any);
    };

    load();

    // Realtime round changes
    const channel = supabase
      .channel(`hud-rounds-${fightId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'rounds',
        filter: `fight_id=eq.${fightId}`,
      }, (payload) => {
        const r = payload.new as any;
        if (r?.status === 'live') setRound(r);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fightId]);

  // Round clock
  useEffect(() => {
    if (!round?.starts_at) { setClockMs(0); return; }
    const start = new Date(round.starts_at).getTime();
    const id = setInterval(() => setClockMs(Date.now() - start), 100);
    return () => clearInterval(id);
  }, [round?.starts_at]);

  // Compute stats from AI events
  const statsA = useMemo(() => computeStats(events, 'A'), [events]);
  const statsB = useMemo(() => computeStats(events, 'B'), [events]);

  const formatTime = (ms: number, durationSec?: number) => {
    const totalSec = durationSec || 180;
    const remaining = Math.max(0, totalSec * 1000 - ms);
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!fightData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={logoUrl} alt="Fighter ID" className="h-16 mx-auto opacity-60" />
          <h1 className="text-4xl font-black tracking-tight">FIGHTER ID — LIVE</h1>
          <p className="text-gray-500 text-lg">Esperando datos de la pelea...</p>
          {loading && <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />}
        </div>
      </div>
    );
  }

  const nameA = fightData.red_fighter
    ? `${fightData.red_fighter.first_name} ${fightData.red_fighter.last_name}`
    : 'Peleador A';
  const nameB = fightData.blue_fighter
    ? `${fightData.blue_fighter.first_name} ${fightData.blue_fighter.last_name}`
    : 'Peleador B';

  const maxStrikes = Math.max(statsA.connected + statsB.connected, 1);

  return (
    <div className="min-h-screen bg-black text-white select-none overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-red-950/80 via-black to-blue-950/80 border-b border-white/10">
        <img src={logoUrl} alt="Fighter ID" className="h-8 opacity-70" />
        <div className="flex items-center gap-3">
          {round && (
            <Badge className="bg-red-600 text-white text-lg px-4 py-1 font-mono animate-pulse">
              🔴 R{round.number} — {formatTime(clockMs, round.duration_seconds)}
            </Badge>
          )}
          {!round && (
            <Badge variant="outline" className="text-gray-400 border-gray-700 text-lg px-4 py-1">
              ⏸ Esperando round
            </Badge>
          )}
        </div>
        <div className="text-xs text-gray-600 font-mono">AI Vision v2.0</div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-2 gap-0 min-h-[calc(100vh-60px)]">
        {/* Fighter A (RED) */}
        <FighterPanel
          name={nameA}
          nickname={fightData.red_fighter?.nickname}
          stats={statsA}
          color="red"
          maxStrikes={maxStrikes}
        />

        {/* Fighter B (BLUE) */}
        <FighterPanel
          name={nameB}
          nickname={fightData.blue_fighter?.nickname}
          stats={statsB}
          color="blue"
          maxStrikes={maxStrikes}
        />
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 px-6 py-2 flex justify-between items-center text-xs text-gray-600">
        <span>Eventos AI: {events.length}</span>
        <span>Powered by Fighter ID Vision Motor</span>
      </div>
    </div>
  );
}

// ─── Stats computation ───
interface StrikeStats {
  attempted: number;
  connected: number;
  accuracy: number;
  byType: Record<string, { attempted: number; connected: number }>;
  recentActivity: number; // events in last 30s
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

  // Recent activity: events in last 30 seconds
  const now = Date.now();
  const recentActivity = mine.filter(e => {
    const eventTime = new Date(e.created_at).getTime();
    return now - eventTime < 30000;
  }).length;

  return {
    attempted,
    connected,
    accuracy: attempted > 0 ? Math.round((connected / attempted) * 100) : 0,
    byType,
    recentActivity,
  };
}

// ─── Fighter Panel ───
function FighterPanel({
  name, nickname, stats, color, maxStrikes,
}: {
  name: string;
  nickname?: string;
  stats: StrikeStats;
  color: 'red' | 'blue';
  maxStrikes: number;
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
      {/* Name */}
      <div className="space-y-1">
        <div className={`text-sm font-medium ${accent} uppercase tracking-widest`}>{dot} {isRed ? 'Esquina Roja' : 'Esquina Azul'}</div>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">{name}</h2>
        {nickname && <div className="text-lg text-gray-500 italic">"{nickname}"</div>}
      </div>

      {/* Main stat */}
      <div className="space-y-6 my-8">
        <div className="text-center">
          <div className={`text-8xl md:text-9xl font-black ${accent} leading-none`}>{stats.connected}</div>
          <div className="text-gray-500 text-sm mt-1">Golpes Conectados</div>
        </div>

        {/* Precision bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Precisión</span>
            <span className={`font-bold ${accent}`}>{stats.accuracy}%</span>
          </div>
          <Progress value={stats.accuracy} className={`h-3 bg-white/10 ${progressColor}`} />
        </div>

        {/* Attempted vs Connected */}
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

      {/* Strike types */}
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
