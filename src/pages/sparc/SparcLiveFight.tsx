/**
 * SPARC Judge Live View — single-screen, low-end Android optimized.
 * Integrates server clock, device claim/revocation, vote queue, recovery worker.
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
  submitVote,
  getVoteForRound,
  type VoteChoice,
  type VoteRow,
} from '@/system/sparc/voteQueue';
import {
  markRoundLocked,
  markRoundRejectedTooLate,
} from '@/system/sparc/storage/voteDb';
import { useSparcServerClock } from '@/system/sparc/hooks/useSparcServerClock';
import { useSparcDevice } from '@/system/sparc/hooks/useSparcDevice';
import { useSparcRecoveryWorker } from '@/system/sparc/hooks/useSparcRecoveryWorker';
import { useSparcInteractionTracker } from '@/system/sparc/hooks/useSparcInteraction';

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

function StatusChip({ s }: { s: ConnStatus }) {
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

function VoteStateLabel({ v }: { v: VoteRow }) {
  const map: Record<VoteRow['status'], { txt: string; cls: string }> = {
    DRAFT:              { txt: 'Saved · will retry',  cls: 'text-muted-foreground' },
    SUBMITTED:          { txt: 'Vote submitted',      cls: 'text-amber-500' },
    CONFIRMED:          { txt: 'Vote confirmed',      cls: 'text-emerald-500' },
    LOCKED:             { txt: 'Vote locked',         cls: 'text-emerald-400' },
    REJECTED_TOO_LATE:  { txt: 'Voting window closed. Vote not counted.', cls: 'text-zinc-400' },
    DEVICE_REJECTED:    { txt: 'Rejected — device transferred', cls: 'text-rose-500' },
  };
  const m = map[v.status];
  return (
    <span className={`font-mono text-[11px] uppercase ${m.cls}`}>{m.txt}</span>
  );
}

function DeviceLockScreen({ onReclaim }: { onReclaim: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col items-center justify-center px-6 text-center gap-4">
      <div className="font-mono text-[10px] uppercase text-rose-500 tracking-widest">Session transferred</div>
      <h1 className="font-display text-2xl leading-tight">
        This judge account is active on another device.
      </h1>
      <p className="font-mono text-[11px] uppercase text-muted-foreground max-w-xs">
        Voting is disabled on this device. Reload and reclaim manually to take over.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 h-12 px-6 border-2 border-foreground font-mono text-xs uppercase"
      >
        Reload
      </button>
      <button
        onClick={onReclaim}
        className="h-10 px-4 border border-border font-mono text-[11px] uppercase text-muted-foreground"
      >
        Reclaim on this device
      </button>
    </div>
  );
}

export default function SparcLiveFight() {
  const { fightId = '' } = useParams<{ fightId: string }>();
  const [fight, setFight] = useState<FightRow | null>(null);
  const [round, setRound] = useState<RoundRow | null>(null);
  const [localVote, setLocalVote] = useState<VoteRow | null>(null);
  const [tick, setTick] = useState(0);

  // 1. Server clock (drives all countdowns)
  const { serverNow, synced } = useSparcServerClock();

  // 2. Interaction tracker (feeds heartbeat)
  useSparcInteractionTracker();

  // 3. Device claim (depends on session id, which we get from the fight row)
  const sessionId = fight?.session_id ?? null;
  const device = useSparcDevice(sessionId);

  // 4. Connection + heartbeat (with device id)
  const { status, pendingCount } = useSparcConnection(sessionId, { deviceId: device.deviceId });

  // 5. Recovery worker (drains queue while alive)
  useSparcRecoveryWorker(true);

  // 1Hz tick driven by RAF-friendly setInterval for countdowns
  useEffect(() => {
    const iv = window.setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(iv);
  }, []);

  // initial load + realtime subscriptions
  useEffect(() => {
    if (!fightId) return;
    let cancelled = false;

    const loadVoteForRound = async (round_id: string) => {
      const existing = await getVoteForRound(round_id);
      if (!cancelled) setLocalVote(existing);
    };

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
        await loadVoteForRound((r as any).id);
      }
    };
    load();

    const ch = supabase
      .channel(`sparc-fight-${fightId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sparc_fights', filter: `id=eq.${fightId}` },
        (p) => setFight((cur) => ({ ...(cur as any), ...(p.new as any) })))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sparc_rounds', filter: `fight_id=eq.${fightId}` },
        async (p) => {
          const nr = p.new as any;
          const prev = (p.old as any);
          setRound(nr);
          if (nr?.id) {
            persistContext({ round_id: nr.id });
            // Round state transitions → reconcile local vote storage
            if (prev?.state === 'VOTING_OPEN' && nr.state !== 'VOTING_OPEN') {
              if (nr.state === 'FINALIZED' || nr.state === 'LOCKED') {
                await markRoundLocked(nr.id);
              } else {
                await markRoundRejectedTooLate(nr.id);
              }
            }
            await loadVoteForRound(nr.id);
          }
        })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [fightId]);

  const votingOpen = round?.state === 'VOTING_OPEN';
  const remainingMs = useMemo(() => {
    if (!round?.voting_closes_at) return 0;
    const closes = new Date(round.voting_closes_at).getTime();
    return Math.max(0, closes - serverNow());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.voting_closes_at, tick, synced]);
  const remainingS = Math.ceil(remainingMs / 1000);
  const totalS = fight?.vote_window_s ?? 30;
  const pct = Math.max(0, Math.min(100, (remainingMs / (totalS * 1000)) * 100));

  const voteLocked = !!localVote && (
    localVote.status === 'CONFIRMED' ||
    localVote.status === 'LOCKED' ||
    localVote.status === 'SUBMITTED'
  );
  const voteDead = !!localVote && (
    localVote.status === 'REJECTED_TOO_LATE' ||
    localVote.status === 'DEVICE_REJECTED'
  );
  const voteDisabled =
    !votingOpen ||
    voteLocked ||
    voteDead ||
    remainingMs <= 0 ||
    device.revoked ||
    device.state === 'claiming';

  const cast = useCallback(async (choice: VoteChoice) => {
    if (!round || !fight || voteDisabled) return;
    const v = await enqueueVote(round.id, fight.id, choice, device.deviceId);
    setLocalVote(v);
    await submitVote(v);
    const updated = await getVoteForRound(round.id);
    setLocalVote(updated);
  }, [round, fight, voteDisabled, device.deviceId]);

  if (!fight) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-mono text-xs uppercase">
        Loading fight…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {device.revoked && <DeviceLockScreen onReclaim={device.reclaim} />}

      {/* Top bar */}
      <div className="border-b border-border px-3 py-2 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase text-muted-foreground">
          Round {fight.current_round || '—'} · {fight.state}
        </div>
        <div className="flex items-center gap-3">
          {!synced && (
            <span className="font-mono text-[10px] uppercase text-muted-foreground">clock…</span>
          )}
          {pendingCount > 0 && (
            <span className="font-mono text-[10px] uppercase text-amber-500">
              {pendingCount} pending
            </span>
          )}
          <StatusChip s={status} />
        </div>
      </div>

      {/* Countdown bar — solid colors only, transform-friendly */}
      <div className="h-2 w-full bg-muted">
        <div
          className={`h-full ${votingOpen ? 'bg-primary' : 'bg-muted-foreground/30'}`}
          style={{ width: `${pct}%` }}
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
        {votingOpen
          ? `Voting · ${remainingS}s`
          : round?.state === 'FINALIZED' || round?.state === 'LOCKED'
            ? 'Round closed'
            : round?.state === 'ACTIVE'
              ? 'Fight in progress'
              : 'Waiting'}
      </div>

      {/* Vote buttons (≥56px) */}
      <div className="flex-1 grid grid-cols-1 gap-3 p-3">
        <button
          onClick={() => cast('red')}
          disabled={voteDisabled}
          className="min-h-[56px] h-24 border-2 border-red-600 bg-red-600/10 disabled:opacity-40 active:bg-red-600/30 font-display text-2xl"
        >
          Red wins
        </button>
        <button
          onClick={() => cast('draw')}
          disabled={voteDisabled}
          className="min-h-[56px] h-20 border-2 border-border disabled:opacity-40 active:bg-muted font-display text-xl"
        >
          Draw
        </button>
        <button
          onClick={() => cast('blue')}
          disabled={voteDisabled}
          className="min-h-[56px] h-24 border-2 border-blue-600 bg-blue-600/10 disabled:opacity-40 active:bg-blue-600/30 font-display text-2xl"
        >
          Blue wins
        </button>
      </div>

      {/* Vote status */}
      {localVote && (
        <div className="border-t border-border px-3 py-2 text-center">
          <div className="font-mono text-[11px] uppercase">
            Your vote: <span className="text-foreground">{localVote.choice}</span>
          </div>
          <div className="mt-1"><VoteStateLabel v={localVote} /></div>
        </div>
      )}
    </div>
  );
}
