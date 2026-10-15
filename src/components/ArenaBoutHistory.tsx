import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { parseArenaRounds } from '@/lib/arenaBout';

const METHODS: Record<string, string> = { ko: 'KO', tko: 'TKO', decision_unanimous: 'Decisión unánime', decision_split: 'Decisión dividida', decision_majority: 'Decisión mayoritaria', draw: 'Empate', no_contest: 'Sin resultado', dq: 'Descalificación' };
const OUTCOMES: Record<string, string> = { win: 'Victoria', loss: 'Derrota', draw: 'Empate', no_contest: 'Sin resultado' };

export default function ArenaBoutHistory({ fighterId }: { fighterId: string }) {
  const history = useInfiniteQuery({
    queryKey: ['fighter-profile', fighterId, 'arena-history'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('get_arena_history', { p_fighter_id: fighterId, p_offset: pageParam, p_limit: 20 });
      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: (last, pages) => last.length === 20 ? pages.length * 20 : undefined,
  });
  const entries = history.data?.pages.flat() ?? [];
  const sparring = useQuery({
    queryKey: ['fighter-profile', fighterId, 'sparring-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sparring_summary', { p_fighter_id: fighterId });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
  const sp = sparring.data;
  return (
    <section className="py-4 space-y-4" aria-label="Historial de Arena Control">
      <h2 className="text-lg font-semibold">Historial de Arena Control</h2>
      {sp && Number(sp.total) > 0 && (
        <div className="border border-border rounded-sm p-3 space-y-1" aria-label="Récord de sparrings">
          <p className="text-xs font-mono text-muted-foreground">Récord de sparrings · no cuenta para el récord oficial</p>
          <p className="text-2xl font-semibold font-mono">{Number(sp.wins)}-{Number(sp.losses)}-{Number(sp.draws)}</p>
          <p className="text-sm text-muted-foreground">{Number(sp.total)} sparrings · {Number(sp.rounds)} rounds · {Number(sp.finishes)} KO/TKO</p>
        </div>
      )}
      {history.isPending && <p className="text-sm text-muted-foreground">Cargando historial…</p>}
      {history.isError && <div className="space-y-2"><p className="text-sm text-destructive">No se pudo cargar el historial.</p><Button variant="outline" onClick={() => history.refetch()}>Reintentar</Button></div>}
      {!history.isPending && !history.isError && !entries.length && <p className="text-sm text-muted-foreground">Sin sesiones registradas.</p>}
      <div className="divide-y divide-border">
        {entries.map(entry => {
          const rounds = parseArenaRounds(entry.rounds);
          return <article key={entry.verdict_id} className="py-4 space-y-2 min-w-0">
            <div className="flex flex-wrap gap-2 items-center"><Badge variant={entry.bout_type === 'official' ? 'default' : 'outline'}>{entry.bout_type === 'official' ? 'Pelea oficial' : 'Sparring'}</Badge><time className="text-xs text-muted-foreground">{new Date(entry.signed_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</time></div>
            <p className="font-medium break-words">vs. {entry.opponent_id ? <Link className="underline underline-offset-4" to={`/fighter/${entry.opponent_id}`}>{entry.opponent_name}</Link> : entry.opponent_name}</p>
            <p className="text-sm">{OUTCOMES[entry.outcome]} · {METHODS[entry.result_type] ?? entry.result_type} · {entry.round_count} rounds · {entry.result_type === 'ko' ? 'Con KO' : entry.result_type === 'tko' ? 'Con TKO' : 'Sin KO'}</p>
            {rounds.length > 0 && <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Rounds</summary><ul className="mt-2 space-y-1 font-mono text-xs">{rounds.map(r => <li key={r.roundNumber}>R{r.roundNumber} · {Math.floor(r.durationMs / 60000)}:{String(Math.floor(r.durationMs / 1000) % 60).padStart(2, '0')} · {r.scoreA}–{r.scoreB} · KD {r.knockdownsA}–{r.knockdownsB}</li>)}</ul></details>}
          </article>;
        })}
      </div>
      {history.hasNextPage && <Button variant="outline" disabled={history.isFetchingNextPage} onClick={() => history.fetchNextPage()}>Ver más</Button>}
    </section>
  );
}