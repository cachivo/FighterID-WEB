import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeScoring } from '@/hooks/useRealtimeScoring';
import { useRoundClock } from '@/hooks/useRoundClock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HudPublicDisplay() {
  const { fightId } = useParams<{ fightId: string }>();
  const [round, setRound] = useState<any>(null);
  const [fightData, setFightData] = useState<any>(null);
  const { events } = useRealtimeScoring(round?.id || '');
  const { nowMs } = useRoundClock(round?.starts_at);

  useEffect(() => {
    if (!fightId) return;

    const loadData = async () => {
      // Obtener fight data
      const { data: fight } = await supabase
        .from('fights')
        .select(`
          id,
          fight_number,
          red_fighter:fighter_a_id(first_name, last_name, nickname),
          blue_fighter:fighter_b_id(first_name, last_name, nickname)
        `)
        .eq('id', fightId)
        .single();

      if (fight) setFightData(fight);

      // Obtener round activo
      const roundQuery = await (supabase as any)
        .from('rounds')
        .select('id, fight_id, number, starts_at, status, duration_seconds')
        .eq('fight_id', fightId)
        .eq('status', 'live')
        .limit(1);

      if (roundQuery.data && roundQuery.data.length > 0) {
        setRound(roundQuery.data[0]);
      }
    };

    loadData();
  }, [fightId]);

  if (!round || !fightData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Fighter ID - Live Scoring</h1>
          <p className="text-muted-foreground">Esperando que inicie la pelea...</p>
        </div>
      </div>
    );
  }

  // Calcular stats
  const redStats = {
    punches: events.filter(e => e.corner === 'red' && e.type === 'punch').length,
    defenses: events.filter(e => e.corner === 'red' && e.type === 'defense').length,
    knockdowns: events.filter(e => e.corner === 'red' && e.type === 'knockdown').length,
  };

  const blueStats = {
    punches: events.filter(e => e.corner === 'blue' && e.type === 'punch').length,
    defenses: events.filter(e => e.corner === 'blue' && e.type === 'defense').length,
    knockdowns: events.filter(e => e.corner === 'blue' && e.type === 'knockdown').length,
  };

  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold">Fighter ID - Live Scoring</h1>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="destructive" className="text-xl px-6 py-2">
              🔴 ROUND {round.number} - {formatTime(nowMs)}
            </Badge>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-8">
          {/* ROJO */}
          <Card className="bg-red-950/30 border-red-600 border-4">
            <CardHeader>
              <CardTitle className="text-center text-3xl text-red-400">
                🔴 {fightData.red_fighter?.first_name} {fightData.red_fighter?.last_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-7xl font-bold text-red-400">{redStats.punches}</div>
                <div className="text-sm text-muted-foreground">Golpes Efectivos</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-semibold">{redStats.defenses}</div>
                  <div className="text-xs text-muted-foreground">Defensas</div>
                </div>
                <div>
                  <div className="text-3xl font-semibold">{redStats.knockdowns}</div>
                  <div className="text-xs text-muted-foreground">Knockdowns</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AZUL */}
          <Card className="bg-fighter-info/10 border-fighter-info border-4">
            <CardHeader>
              <CardTitle className="text-center text-3xl text-fighter-info">
                🔵 {fightData.blue_fighter?.first_name} {fightData.blue_fighter?.last_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-7xl font-bold text-fighter-info">{blueStats.punches}</div>
                <div className="text-sm text-muted-foreground">Golpes Efectivos</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-semibold">{blueStats.defenses}</div>
                  <div className="text-xs text-muted-foreground">Defensas</div>
                </div>
                <div>
                  <div className="text-3xl font-semibold">{blueStats.knockdowns}</div>
                  <div className="text-xs text-muted-foreground">Knockdowns</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Actualización en tiempo real vía Supabase Realtime</p>
          <p className="mt-1">Total de eventos registrados: {events.length}</p>
        </div>
      </div>
    </div>
  );
}
