import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

const METHODS: Record<string, string> = { ko: 'KO', tko: 'TKO', decision_unanimous: 'Decisión unánime', decision_split: 'Decisión dividida', decision_majority: 'Decisión mayoritaria', draw: 'Empate', no_contest: 'Sin resultado', dq: 'Descalificación' };

type LiveScore = { round?: number; roundNumber?: number; red?: number; blue?: number; scoreA?: number; scoreB?: number };

/** Live round, scorecards and result for one event fight, synced from Arena Control. */
export function EventFightLive({ fightId, fighterAId, nameA, nameB }: { fightId: string; fighterAId?: string | null; nameA: string; nameB: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['event-fight-live', fightId],
    queryFn: async () => {
      const { data, error } = await supabase.from('fights')
        .select('status, live_round, live_scores, winner_id, finish_method, finish_round, number_of_rounds')
        .eq('id', fightId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase.channel(`event-fight-${fightId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fights', filter: `id=eq.${fightId}` },
        () => qc.invalidateQueries({ queryKey: ['event-fight-live', fightId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fightId, qc]);

  if (!data || (data.status !== 'live' && data.status !== 'completed')) return null;
  const scores = (Array.isArray(data.live_scores) ? data.live_scores : []) as LiveScore[];
  const rows = scores.map((s) => ({ round: s.round ?? s.roundNumber ?? 0, red: s.red ?? s.scoreA ?? 0, blue: s.blue ?? s.scoreB ?? 0 }));
  const totalRed = rows.reduce((a, r) => a + r.red, 0);
  const totalBlue = rows.reduce((a, r) => a + r.blue, 0);
  const winnerName = data.winner_id ? (data.winner_id === fighterAId ? nameA : nameB) : null;

  return (
    <div className="mt-4 border border-border rounded-sm p-3 space-y-2 text-sm w-full max-w-md mx-auto">
      {data.status === 'live' ? (
        <div className="flex items-center gap-2"><Badge variant="destructive" className="animate-pulse">En vivo</Badge><span>Round {data.live_round ?? 1}{data.number_of_rounds ? ` de ${data.number_of_rounds}` : ''}</span></div>
      ) : (
        <div className="space-y-1">
          <Badge>Finalizada</Badge>
          <p className="font-medium break-words">{winnerName ? `Ganador: ${winnerName}` : 'Sin ganador'} · {METHODS[data.finish_method ?? ''] ?? data.finish_method} · R{data.finish_round}</p>
        </div>
      )}
      {rows.length > 0 && (
        <table className="w-full font-mono text-xs">
          <thead><tr className="text-muted-foreground"><th className="text-left font-normal">Round</th><th className="text-right font-normal break-words">{nameA}</th><th className="text-right font-normal break-words">{nameB}</th></tr></thead>
          <tbody>
            {rows.map((r) => <tr key={r.round}><td>R{r.round}</td><td className="text-right">{r.red}</td><td className="text-right">{r.blue}</td></tr>)}
            <tr className="border-t border-border font-semibold"><td>Total</td><td className="text-right">{totalRed}</td><td className="text-right">{totalBlue}</td></tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
