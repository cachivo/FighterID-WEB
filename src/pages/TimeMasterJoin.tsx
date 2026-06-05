import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Swords, Timer as TimerIcon, Gavel } from "lucide-react";
import { TimeMasterLayout, TimerDisplay } from "@/components/time-master";
import { PresenceBar } from "@/components/time-master/PresenceBar";
import { JudgeVerdictPanel } from "@/components/time-master/JudgeVerdictPanel";
import { useTimeMasterMatch, type TmRole } from "@/hooks/useTimeMasterMatch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FighterLite { id: string; displayName: string; }

export default function TimeMasterJoin() {
  const { toast } = useToast();
  const tm = useTimeMasterMatch();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});

  const fetchNames = async (ids: string[]) => {
    const { data } = await supabase
      .from('fighter_profiles')
      .select('id, first_name, last_name, nickname')
      .in('id', ids);
    const map: Record<string, string> = {};
    (data || []).forEach((f) => {
      map[f.id] = `${f.first_name} ${f.last_name}${f.nickname ? ` "${f.nickname}"` : ''}`;
    });
    setNames(map);
  };

  const join = async (chosen: TmRole) => {
    setLoading(true);
    try {
      const row = await tm.joinByCode(code.trim().toUpperCase(), chosen);
      await fetchNames([row.red_fighter_id, row.blue_fighter_id, row.judge_fighter_id]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error';
      toast({ title: 'No se pudo unir', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!tm.match || !tm.role) {
    return (
      <TimeMasterLayout>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Swords className="h-5 w-5" /> Unirse a una pelea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Código de pelea</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="6 caracteres"
                maxLength={6}
                className="uppercase tracking-widest text-center font-mono text-lg"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button disabled={!code || loading} onClick={() => join('red')} className="bg-fighter-danger hover:bg-fighter-danger/90">Red</Button>
              <Button disabled={!code || loading} onClick={() => join('blue')} className="bg-fighter-info hover:bg-fighter-info/90">Blue</Button>
              <Button disabled={!code || loading} onClick={() => join('judge')} variant="outline"><Gavel className="h-4 w-4 mr-1" />Juez</Button>
            </div>
            {loading && <Loader2 className="h-4 w-4 animate-spin mx-auto" />}
          </CardContent>
        </Card>
      </TimeMasterLayout>
    );
  }

  const m = tm.match;
  const redName = names[m.red_fighter_id] || 'Red';
  const blueName = names[m.blue_fighter_id] || 'Blue';
  const judgeName = names[m.judge_fighter_id] || 'Juez';
  const t = tm.remoteTimer;
  const isFinished = m.phase === 'finished' || !!m.records_updated || !!m.result_type;

  return (
    <TimeMasterLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Swords className="h-6 w-6 text-primary" /> {tm.role.toUpperCase()}</h1>
            <p className="text-xs text-muted-foreground font-mono">Código: {m.code}</p>
          </div>
          <Badge variant="outline" className="uppercase tracking-wider">{m.phase}</Badge>
        </div>

        <PresenceBar presence={tm.presence} redName={redName} blueName={blueName} judgeName={judgeName} />

        <Card>
          <CardContent className="pt-6">
            {t ? (
              <TimerDisplay
                timeMs={t.timeMs}
                roundDuration={m.round_duration_sec}
                isRunning={t.isRunning}
                isPaused={t.isPaused}
                currentRound={t.currentRound}
                totalRounds={m.round_config}
                phase={t.phase as 'setup' | 'ready' | 'fighting' | 'between_rounds' | 'finished'}
                restTimeMs={t.restTimeMs}
              />
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <TimerIcon className="h-5 w-5 animate-pulse" />
                Esperando al operador…
              </div>
            )}
          </CardContent>
        </Card>

        {tm.role === 'judge' && isFinished && (
          <JudgeVerdictPanel
            redName={redName}
            blueName={blueName}
            redId={m.red_fighter_id}
            blueId={m.blue_fighter_id}
            alreadyFinalized={!!m.result_type}
            recordsUpdated={m.records_updated}
            finalWinnerId={m.winner_fighter_id}
            finalResultType={m.result_type}
            onSubmit={tm.submitVerdict}
          />
        )}

        {tm.role !== 'judge' && m.result_type && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Veredicto final</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div>Ganador: <span className="font-semibold">{m.winner_fighter_id === m.red_fighter_id ? redName : m.winner_fighter_id === m.blue_fighter_id ? blueName : '—'}</span></div>
              <div>Resultado: <span className="font-mono">{m.result_type}</span></div>
              <Badge variant={m.records_updated ? 'default' : 'secondary'}>
                {m.records_updated ? 'Récords actualizados' : 'Récords NO actualizados'}
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </TimeMasterLayout>
  );
}
