/**
 * SPARC Judge Live View — the critical screen.
 * Single screen, no nav, large buttons, mobile-first 320–390px.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  persistContext,
  useSparcConnection,
  type ConnStatus,
} from '@/system/sparc/useSparcConnection';
import {
  enqueueVote,
  getVoteForRound,
  submitVote,
  type VoteChoice,
  type PendingVote,
} from '@/system/sparc/voteQueue';

interface FightRow {
  id: string;
  session_id: string;
  red_name: string;
  blue_name: string;
  state: string;
  current_round: number;
  vote_window_s: number;
  round_duration_s: number;
}

interface RoundRow {
  id: string;
  fight_id: string;
  idx: number;
  state: string;
  started_at: string | null;
  voting_closes_at: string | null;
}

function statusChip(s: ConnStatus) {
  const map: Record<ConnStatus, string> = {
    online: 'bg-emerald-600',
    reconnecting: 'bg-amber-500',
    offline: 'bg-zinc-600',
  };
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase">
      <span className={`inline-block size-2 rounded-full ${map[s]}`} />
      {s}
    </span>
  );
}

export default function SparcLiveFight() {
  const { fightId = '' } = useParams<{ fightId: string }>();
  const [fight, setFight] = useState<FightRow | null>(null);
  const [round, setRound] = useState<RoundRow | null>(null);
  const [localVote, setLocalVote] = useState<PendingVote | null>(null);
  const [now, setNow] = useState(Date.now());
  const { status, pendingCount, flush } = useSparcConnection(fight?.session_id ?? null);

  // tick
  useEffect(() => {
    const iv = window.setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, []);

  // initial load + realtime
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: f } = await supabase
        .from('sparc_fights')
        .select('id, session_id, red_name, blue_name, state, current_round, vote_window_s, round_duration_s')
        .eq('id', fightId)
        .maybeSingle();
      if (cancelled || !f) return;
      setFight(f as any);
      persistContext({ session_id: (f as any).session_id, fight_id: f.id });

      const { data: r } = await supabase
        .from('sparc_rounds')
        .select('id, fight_id, idx, state, started_at, voting_closes_at')
        .eq('fight_id', fightId)
        .order('idx', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setRound((r as any) ?? null);
      if (r) {
        persistContext({ round_id: (r as any).id });
        const existing = await getVoteForRound((r as any).id);
        setLocalVote(existing);
      }
    };
    load();

    const ch = supabase
      .channel(`sparc-fight-${fightId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sparc_fights', filter: `id=eq.${fightId}` },
        (p) => setFight((cur) => ({ ...(cur as any), ...(p.new as any) })))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sparc_rounds', filter: `fight_id=eq.${fightId}` },
        async (p) => {
          const nr = p.new as any;
          setRound(nr);
          if (nr?.id) {
            persistContext({ round_id: nr.id });
            const existing = await getVoteForRound(nr.id);
            setLocalVote(existing);
          }
        })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [fightId]);

  const votingOpen = round?.state === 'VOTING_OPEN';
  const remainingMs = useMemo(() => {
    if (!round?.voting_closes_at) return 0;
    return Math.max(0, new Date(round.voting_closes_at).getTime() - now);
  }, [round?.voting_closes_at, now]);
  const remainingS = Math.ceil(remainingMs / 1000);
  const totalS = fight?.vote_window_s ?? 30;
  const pct = Math.max(0, Math.min(100, (remainingMs / (totalS * 1000)) * 100));

  const voteDisabled = !votingOpen || !!localVote || remainingMs <= 0;

  const cast = useCallback(async (choice: VoteChoice) => {
    if (!round || voteDisabled) return;
    const v = await enqueueVote(round.id, choice);
    setLocalVote(v);
    const ok = await submitVote(v);
    const updated = await getVoteForRound(round.id);
    setLocalVote(updated);
    if (!ok) flush();
  }, [round, voteDisabled, flush]);

  if (!fight) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-mono text-xs uppercase">Loading fight…</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border px-3 py-2 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase text-muted-foreground">
          Round {fight.current_round || '—'} · {fight.state}
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="font-mono text-[10px] uppercase text-amber-500">
              {pendingCount} pending
            </span>
          )}
          {statusChip(status)}
        </div>
      </div>

      {/* Countdown bar */}
      <div className="h-2 w-full bg-muted">
        <div
          className={`h-full ${votingOpen ? 'bg-primary' : 'bg-muted-foreground/30'}`}
          style={{ width: `${pct}%`, transition: 'width 200ms linear' }}
        />
      </div>

      {/* Fighters */}
      <div className="grid grid-cols-2 border-b border-border">
        <div className="p-4 border-r border-border">
          <div className="font-mono text-[10px] uppercase text-red-500">Red</div>
          <div className="font-display text-lg leading-tight break-words">{fight.red_name}</div>
        </div>
        <div className="p-4">
          <div className="font-mono text-[10px] uppercase text-blue-500">Blue</div>
          <div className="font-display text-lg leading-tight break-words">{fight.blue_name}</div>
        </div>
      </div>

      {/* Status line */}
      <div className="px-4 py-3 text-center font-mono text-xs uppercase text-muted-foreground">
        {votingOpen ? `Voting · ${remainingS}s` :
          round?.state === 'FINALIZED' ? 'Round closed' :
          round?.state === 'ACTIVE' ? 'Fight in progress' : 'Waiting'}
      </div>

      {/* Vote buttons */}
      <div className="flex-1 grid grid-cols-1 gap-3 p-3">
        <button
          onClick={() => cast('red')}
          disabled={voteDisabled}
          className="h-24 border-2 border-red-600 bg-red-600/10 disabled:opacity-40 active:bg-red-600/30 font-display text-2xl"
        >
          Red wins
        </button>
        <button
          onClick={() => cast('draw')}
          disabled={voteDisabled}
          className="h-20 border-2 border-border disabled:opacity-40 active:bg-muted font-display text-xl"
        >
          Draw
        </button>
        <button
          onClick={() => cast('blue')}
          disabled={voteDisabled}
          className="h-24 border-2 border-blue-600 bg-blue-600/10 disabled:opacity-40 active:bg-blue-600/30 font-display text-2xl"
        >
          Blue wins
        </button>
      </div>

      {/* Vote status */}
      {localVote && (
        <div className="border-t border-border px-3 py-2 font-mono text-[11px] uppercase text-center">
          Your vote: <span className="text-foreground">{localVote.choice}</span> ·{' '}
          <span className={
            localVote.status === 'CONFIRMED' ? 'text-emerald-500' :
            localVote.status === 'SUBMITTED' ? 'text-amber-500' : 'text-muted-foreground'
          }>{localVote.status}</span>
        </div>
      )}
    </div>
  );
}
