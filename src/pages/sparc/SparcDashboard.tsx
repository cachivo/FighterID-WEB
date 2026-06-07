/**
 * SPARC Time Master Dashboard — operational control center.
 * Consumes sparc_event_dashboard_v + sparc_session_quorum + sparc_audit_log
 * via realtime; all mutations through RPCs only.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUuidParam } from '@/hooks/useUuidParam';
import { useAdmin } from '@/hooks/useAdmin';
import { useSparcServerClock, serverNow, getOffset } from '@/system/sparc/hooks/useSparcServerClock';

// ---------- helpers ----------
const fmt = (ms: number) => {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const fmtTime = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const PRESENCE_COLOR: Record<string, string> = {
  online: 'bg-emerald-500',
  idle: 'bg-yellow-500',
  away: 'bg-orange-500',
  reconnecting: 'bg-blue-500',
  offline: 'bg-red-600',
};

// ---------- types ----------
interface DashboardRow {
  session_id: string;
  event_id: string;
  event_name: string;
  discipline: 'MMA' | 'BOXING';
  session_name: string;
  min_quorum_pct: number;
  min_quorum_absolute: number | null;
  active_fight_id: string | null;
  active_fight: any;
  current_round: any;
  next_fight: any;
  judges_registered: number;
  judges_online: number;
  judges_idle: number;
  judges_away: number;
  judges_offline: number;
  last_vote_at: string | null;
  server_now: string;
}

interface Judge {
  app_user_id: string;
  role: string;
  active_device_label: string | null;
  presence_status: string;
  last_seen: string | null;
  display_name: string;
}

interface AuditEvent {
  id: string;
  action: string;
  payload: any;
  at: string;
  actor_id: string | null;
}

interface Quorum {
  connected: number;
  required: number;
  pct: number;
  met: boolean;
}

// ---------- main page ----------
export default function SparcDashboard() {
  const sessionId = useUuidParam('sessionId');
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { synced, latency } = useSparcServerClock();

  const [row, setRow] = useState<DashboardRow | null>(null);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [quorum, setQuorum] = useState<Quorum | null>(null);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [fightQueue, setFightQueue] = useState<any[]>([]);
  const [voteStats, setVoteStats] = useState<{ confirmed: number; pending: number; abstain: number; nonresp: number }>({
    confirmed: 0, pending: 0, abstain: 0, nonresp: 0,
  });
  const [dbReachable, setDbReachable] = useState(true);
  const [rtState, setRtState] = useState<'GOOD' | 'DEGRADED' | 'DISCONNECTED'>('GOOD');
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [, force] = useState(0); // tick

  // ----- refetchers -----
  const fetchDashboard = useCallback(async () => {
    if (!sessionId) return;
    const { data, error } = await supabase
      .from('sparc_event_dashboard_v')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
    if (error) { setDbReachable(false); return; }
    setDbReachable(true);
    setRow((data as any) ?? null);
  }, [sessionId]);

  const fetchJudges = useCallback(async () => {
    if (!sessionId) return;
    const { data: members } = await supabase
      .from('sparc_session_members')
      .select('app_user_id, role, active_device_label')
      .eq('session_id', sessionId);
    if (!members || members.length === 0) { setJudges([]); return; }
    const ids = members.map((m: any) => m.app_user_id);
    const [{ data: pres }, { data: users }] = await Promise.all([
      supabase.from('sparc_presence').select('app_user_id, status, last_seen').eq('session_id', sessionId).in('app_user_id', ids),
      supabase.from('app_user').select('id, first_name, last_name').in('id', ids),
    ]);
    const pMap = new Map((pres ?? []).map((p: any) => [p.app_user_id, p]));
    const uMap = new Map((users ?? []).map((u: any) => [u.id, u]));
    setJudges(members.map((m: any) => {
      const p = pMap.get(m.app_user_id);
      const u = uMap.get(m.app_user_id);
      return {
        app_user_id: m.app_user_id,
        role: m.role,
        active_device_label: m.active_device_label,
        presence_status: (p?.status as string) ?? 'offline',
        last_seen: p?.last_seen ?? null,
        display_name: u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || '—' : '—',
      };
    }));
  }, [sessionId]);

  const fetchQuorum = useCallback(async () => {
    if (!sessionId) return;
    const { data, error } = await supabase.rpc('sparc_session_quorum', { p_session_id: sessionId });
    if (error || !data) return;
    const r: any = Array.isArray(data) ? data[0] : data;
    if (!r) return;
    setQuorum({
      connected: Number(r.connected ?? r.online ?? 0),
      required: Number(r.required ?? 0),
      pct: Number(r.pct ?? 0),
      met: Boolean(r.met),
    });
  }, [sessionId]);

  const fetchAudit = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await supabase
      .from('sparc_audit_log')
      .select('id, action, payload, at, actor_id')
      .eq('session_id', sessionId)
      .order('at', { ascending: false })
      .limit(100);
    setAudit((data as any) ?? []);
  }, [sessionId]);

  const fetchQueue = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await supabase
      .from('sparc_fights')
      .select('id, red_name, blue_name, state, order_idx, current_round, rounds_planned, weight_class')
      .eq('session_id', sessionId)
      .order('order_idx');
    setFightQueue((data as any) ?? []);
  }, [sessionId]);

  const fetchVoteStats = useCallback(async () => {
    if (!row?.current_round?.id) {
      setVoteStats({ confirmed: 0, pending: 0, abstain: 0, nonresp: 0 });
      return;
    }
    const roundId = row.current_round.id;
    const [{ data: votes }, { count: registered }] = await Promise.all([
      supabase.from('sparc_votes').select('status, choice').eq('round_id', roundId),
      supabase.from('sparc_session_members').select('app_user_id', { count: 'exact', head: true }).eq('session_id', sessionId!).eq('role', 'judge' as any),
    ]);
    const list = (votes as any[]) ?? [];
    const confirmed = list.filter(v => v.status === 'CONFIRMED' || v.status === 'LOCKED').length;
    const pending = list.filter(v => v.status === 'SUBMITTED' || v.status === 'DRAFT').length;
    const abstain = list.filter(v => v.choice === 'ABSTAIN').length;
    const total = registered ?? 0;
    const nonresp = Math.max(0, total - confirmed - pending - abstain);
    setVoteStats({ confirmed, pending, abstain, nonresp });
  }, [row?.current_round?.id, sessionId]);

  // ----- initial + realtime -----
  useEffect(() => {
    if (!sessionId) return;
    fetchDashboard(); fetchJudges(); fetchQuorum(); fetchAudit(); fetchQueue();
  }, [sessionId, fetchDashboard, fetchJudges, fetchQuorum, fetchAudit, fetchQueue]);

  useEffect(() => { fetchVoteStats(); }, [fetchVoteStats]);

  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase.channel(`sparc-dash-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sparc_presence', filter: `session_id=eq.${sessionId}` }, () => { fetchJudges(); fetchQuorum(); fetchDashboard(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sparc_session_members', filter: `session_id=eq.${sessionId}` }, () => { fetchJudges(); fetchQuorum(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sparc_fights', filter: `session_id=eq.${sessionId}` }, () => { fetchDashboard(); fetchQueue(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sparc_rounds' }, () => { fetchDashboard(); fetchVoteStats(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sparc_votes' }, () => { fetchDashboard(); fetchVoteStats(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sparc_audit_log', filter: `session_id=eq.${sessionId}` }, (msg: any) => {
        setAudit(prev => [msg.new, ...prev].slice(0, 100));
      })
      .subscribe(s => {
        if (s === 'SUBSCRIBED') setRtState('GOOD');
        else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setRtState('DEGRADED');
        else if (s === 'CLOSED') setRtState('DISCONNECTED');
      });
    return () => { supabase.removeChannel(ch); };
  }, [sessionId, fetchJudges, fetchQuorum, fetchDashboard, fetchQueue, fetchVoteStats]);

  // ----- countdown tick -----
  useEffect(() => {
    const iv = window.setInterval(() => force(t => t + 1), 250);
    return () => clearInterval(iv);
  }, []);

  // ----- guards -----
  if (adminLoading) {
    return <Shell><div className="font-mono text-xs uppercase text-muted-foreground p-6">Verifying…</div></Shell>;
  }
  if (!isAdmin) {
    return <Shell><div className="p-6 border border-border">
      <div className="font-mono text-[11px] uppercase text-muted-foreground">403</div>
      <div className="font-display text-2xl mt-1">Access denied</div>
      <p className="text-sm text-muted-foreground mt-2">Admin role required to view this dashboard.</p>
    </div></Shell>;
  }
  if (!sessionId) {
    return <Shell><div className="p-6 font-mono text-xs uppercase text-muted-foreground">Invalid session id.</div></Shell>;
  }
  if (!dbReachable) {
    return <Shell><DegradedBanner />{row && <SessionOverview row={row} />}</Shell>;
  }
  if (!row) {
    return <Shell><div className="p-6 font-mono text-xs uppercase text-muted-foreground">Loading session…</div></Shell>;
  }

  // ----- derived: countdown -----
  const cr = row.current_round;
  const fightState = (row.active_fight?.state as string) ?? 'READY';
  const roundState = (cr?.state as string) ?? null;
  const votingClosesAt = cr?.voting_closes_at ? new Date(cr.voting_closes_at).getTime() : null;
  const roundEndsAt = cr?.started_at && row.active_fight?.round_duration_s
    ? new Date(cr.started_at).getTime() + Number(row.active_fight.round_duration_s) * 1000
    : null;

  let countdownLabel = 'IDLE';
  let countdownMs: number | null = null;
  let countdownColor = 'text-foreground';
  if (roundState === 'VOTING_OPEN' && votingClosesAt) {
    countdownLabel = 'Voting time';
    countdownMs = votingClosesAt - serverNow();
    countdownColor = countdownMs < 5000 ? 'text-[#DC2626]' : 'text-foreground';
  } else if (roundState === 'ACTIVE' && roundEndsAt) {
    countdownLabel = 'Round time';
    countdownMs = roundEndsAt - serverNow();
  }

  const sessionState: string =
    fightState === 'FINISHED' ? 'FINISHED'
    : roundState === 'VOTING_OPEN' ? 'VOTING_OPEN'
    : roundState === 'VOTING_CLOSED' ? 'VOTING_CLOSED'
    : roundState === 'ACTIVE' ? 'ACTIVE'
    : roundState === 'BREAK' ? 'ROUND_BREAK'
    : 'READY';

  const currentIdx = fightQueue.findIndex(f => f.id === row.active_fight_id);
  const prevFight = currentIdx > 0 ? fightQueue[currentIdx - 1] : null;
  const nextFight = currentIdx >= 0 && currentIdx < fightQueue.length - 1 ? fightQueue[currentIdx + 1] : null;
  const remaining = currentIdx >= 0 ? fightQueue.slice(currentIdx + 1) : fightQueue;

  return (
    <Shell>
      {/* Top bar */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 bg-background z-10">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">SPARC · Time Master</div>
          <div className="font-display text-base sm:text-lg">{row.session_name}</div>
        </div>
        <div className="flex items-center gap-3">
          <SyncBadge synced={synced} latency={latency} offset={getOffset()} />
          <button
            onClick={() => setOverrideOpen(true)}
            className="border border-[#DC2626] text-[#DC2626] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest"
          >
            Override
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-3">
        {/* Section 1: Session Overview */}
        <Card className="lg:col-span-3" title="Session">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Field label="Event" value={row.event_name} />
            <Field label="Discipline" value={row.discipline} />
            <Field label="State" value={<StateChip state={sessionState} />} />
            <Field label="Server now" value={fmtTime(new Date(serverNow()).toISOString())} mono />
          </div>
        </Card>

        {/* Section 2: Active Fight */}
        <Card title="Active fight">
          {row.active_fight ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="font-display text-lg">{row.active_fight.red_name}</div>
                <div className="font-mono text-[10px] uppercase text-muted-foreground">vs</div>
                <div className="font-display text-lg text-right">{row.active_fight.blue_name}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                <Field label="Weight" value={row.active_fight.weight_class ?? '—'} mono />
                <Field label="Fight #" value={String((row.active_fight.order_idx ?? 0) + 1)} mono />
                <Field label="Round" value={`${row.active_fight.current_round}/${row.active_fight.rounds_planned}`} mono />
              </div>
              <SparcRecordPair redId={row.active_fight.red_fighter_id} blueId={row.active_fight.blue_fighter_id} />
            </div>
          ) : <Empty>No active fight</Empty>}
        </Card>

        {/* Section 3: Countdown */}
        <Card title="Countdown">
          <div className="text-center py-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{countdownLabel}</div>
            <div className={`font-mono text-5xl sm:text-6xl tabular-nums my-2 ${countdownColor}`}>
              {countdownMs !== null ? fmt(countdownMs) : '—:—'}
            </div>
            {!synced && (
              <div className="font-mono text-[10px] uppercase text-[#DC2626] border border-[#DC2626] px-2 py-1 inline-block">
                Clock sync warning
              </div>
            )}
          </div>
        </Card>

        {/* Section 5: Quorum */}
        <Card title="Quorum">
          {quorum ? (
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-display text-3xl tabular-nums">
                    {quorum.connected}<span className="text-muted-foreground">/{quorum.required}</span>
                  </div>
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">connected · required</div>
                </div>
                <div className={`font-mono text-xs uppercase border px-2 py-1 ${quorum.met ? 'border-emerald-500 text-emerald-500' : 'border-[#DC2626] text-[#DC2626]'}`}>
                  {quorum.met ? 'Met' : 'Not met'}
                </div>
              </div>
              <div className="h-1 bg-border w-full">
                <div className={`h-full ${quorum.met ? 'bg-emerald-500' : 'bg-[#DC2626]'}`} style={{ width: `${Math.min(100, quorum.pct)}%` }} />
              </div>
              <div className="font-mono text-[10px] uppercase text-muted-foreground">{quorum.pct}%</div>
            </div>
          ) : <Empty>—</Empty>}
        </Card>

        {/* Section 4: Judges */}
        <Card className="lg:col-span-2" title={`Judges · ${judges.length}`}>
          {judges.length === 0 ? <Empty>No judges registered</Empty> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {judges.map(j => (
                <div key={j.app_user_id} className="border border-border p-2 flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-none mt-2 ${PRESENCE_COLOR[j.presence_status] ?? 'bg-muted'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-sm truncate">{j.display_name}</div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground truncate">
                      {j.role} · {j.active_device_label ?? 'no device'}
                    </div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground">
                      {j.presence_status} · {fmtTime(j.last_seen)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Section 6: Voting Monitor */}
        <Card title="Voting monitor">
          <div className="grid grid-cols-4 gap-2 text-center">
            <Stat label="Confirmed" value={voteStats.confirmed} />
            <Stat label="Pending" value={voteStats.pending} />
            <Stat label="Abstain" value={voteStats.abstain} />
            <Stat label="No-resp." value={voteStats.nonresp} />
          </div>
          <div className="mt-3 pt-2 border-t border-border font-mono text-[10px] uppercase text-muted-foreground">
            Last vote: {fmtTime(row.last_vote_at)}
          </div>
        </Card>

        {/* Section 7: Fight queue */}
        <Card className="lg:col-span-2" title="Fight queue">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <QueueSlot label="Previous" fight={prevFight} onOpen={f => navigate(`/sparc/live/${f.id}`)} />
            <QueueSlot label="Current" fight={fightQueue[currentIdx]} active onOpen={f => navigate(`/sparc/live/${f.id}`)} />
            <QueueSlot label="Next" fight={nextFight} onOpen={f => navigate(`/sparc/live/${f.id}`)} />
          </div>
          {remaining.length > 1 && (
            <div className="mt-3 pt-2 border-t border-border">
              <div className="font-mono text-[10px] uppercase text-muted-foreground mb-1">Remaining ({remaining.length - 1})</div>
              <ul className="grid grid-cols-1 gap-1 max-h-40 overflow-auto">
                {remaining.slice(1).map(f => (
                  <li key={f.id}>
                    <button onClick={() => navigate(`/sparc/live/${f.id}`)} className="w-full text-left border border-border px-2 py-1 hover:border-[#DC2626]">
                      <span className="font-display text-xs">{f.red_name} vs {f.blue_name}</span>
                      <span className="font-mono text-[10px] uppercase text-muted-foreground ml-2">{f.state}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Section 8: Session Health */}
        <Card title="Session health">
          <HealthList
            heartbeat={rtState === 'GOOD' ? 'Healthy' : rtState === 'DEGRADED' ? 'Warning' : 'Critical'}
            reconnect={'Stable'}
            judgeAvail={quorum?.met ? 'Healthy' : (quorum && quorum.pct >= 50 ? 'Warning' : 'Critical')}
            voteDelivery={voteStats.pending === 0 ? 'Healthy' : voteStats.pending < 3 ? 'Warning' : 'Critical'}
          />
        </Card>

        {/* Section 9: Sync monitor */}
        <Card title="Synchronization">
          <SyncMonitor synced={synced} latency={latency} offset={getOffset()} rt={rtState} db={dbReachable} />
        </Card>

        {/* Section 10: Ranking impact preview */}
        <Card title="Ranking impact preview">
          <div className="grid grid-cols-3 gap-2 text-center">
            <ImpactBox label="If Red" value="+3 / -2" />
            <ImpactBox label="If Draw" value="+1 / +1" />
            <ImpactBox label="If Blue" value="-2 / +3" />
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase text-muted-foreground">
            Preview only — points applied after result confirmation.
          </div>
        </Card>

        {/* Section 12: Audit feed */}
        <Card className="lg:col-span-3" title={`Audit feed · ${audit.length}`}>
          <ul className="grid grid-cols-1 divide-y divide-border max-h-72 overflow-auto">
            {audit.length === 0 && <li className="py-2 font-mono text-[10px] uppercase text-muted-foreground">No events yet</li>}
            {audit.map(e => (
              <li key={e.id} className="py-1.5 flex items-baseline gap-3">
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground w-20 shrink-0">{fmtTime(e.at)}</span>
                <span className="font-mono text-[10px] uppercase border border-border px-1 shrink-0">{e.action}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {e.payload ? JSON.stringify(e.payload).slice(0, 120) : ''}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Section 11: Override drawer */}
      {overrideOpen && row.active_fight_id && (
        <OverrideDrawer
          fightId={row.active_fight_id}
          onClose={() => setOverrideOpen(false)}
          onExecuted={fetchAudit}
        />
      )}
    </Shell>
  );
}

// ---------- subcomponents ----------
function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#0A0A0A] text-foreground font-sans">{children}</div>;
}

function Card({ children, title, className = '' }: { children: React.ReactNode; title: string; className?: string }) {
  return (
    <section className={`border border-border bg-background rounded-[2px] ${className}`}>
      <div className="px-3 py-2 border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function Field({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-0.5 ${mono ? 'font-mono' : 'font-display'} text-sm`}>{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border p-2">
      <div className="font-display text-2xl tabular-nums">{value}</div>
      <div className="font-mono text-[10px] uppercase text-muted-foreground">{label}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[10px] uppercase text-muted-foreground py-4 text-center">{children}</div>;
}

function StateChip({ state }: { state: string }) {
  const color =
    state === 'VOTING_OPEN' ? 'border-[#DC2626] text-[#DC2626]'
    : state === 'ACTIVE' ? 'border-emerald-500 text-emerald-500'
    : state === 'FINISHED' ? 'border-muted-foreground text-muted-foreground'
    : 'border-border text-foreground';
  return <span className={`font-mono text-[10px] uppercase border px-2 py-0.5 ${color}`}>{state}</span>;
}

function SyncBadge({ synced, latency, offset }: { synced: boolean; latency: number; offset: number }) {
  return (
    <div className={`font-mono text-[10px] uppercase border px-2 py-1 flex items-center gap-1.5 ${synced ? 'border-border text-muted-foreground' : 'border-[#DC2626] text-[#DC2626]'}`}>
      <span className={`w-1.5 h-1.5 ${synced ? 'bg-emerald-500' : 'bg-[#DC2626]'}`} />
      Sync {synced ? 'OK' : '...'} · {Math.round(latency)}ms · {offset >= 0 ? '+' : ''}{Math.round(offset)}ms
    </div>
  );
}

function SyncMonitor({ synced, latency, offset, rt, db }: { synced: boolean; latency: number; offset: number; rt: string; db: boolean }) {
  const Row = ({ label, value, ok }: { label: string; value: string; ok: 'GOOD' | 'DEGRADED' | 'DISCONNECTED' }) => (
    <div className="flex items-center justify-between border-b border-border last:border-b-0 py-1.5">
      <span className="font-mono text-[10px] uppercase text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-xs">{value}</span>
        <span className={`w-1.5 h-1.5 ${ok === 'GOOD' ? 'bg-emerald-500' : ok === 'DEGRADED' ? 'bg-yellow-500' : 'bg-[#DC2626]'}`} />
      </span>
    </div>
  );
  return (
    <div>
      <Row label="Clock offset" value={`${offset >= 0 ? '+' : ''}${Math.round(offset)}ms`} ok={synced ? (Math.abs(offset) < 2000 ? 'GOOD' : 'DEGRADED') : 'DISCONNECTED'} />
      <Row label="Latency" value={`${Math.round(latency)}ms`} ok={latency < 300 ? 'GOOD' : latency < 1000 ? 'DEGRADED' : 'DISCONNECTED'} />
      <Row label="Realtime" value={rt} ok={rt as any} />
      <Row label="Database" value={db ? 'GOOD' : 'DISCONNECTED'} ok={db ? 'GOOD' : 'DISCONNECTED'} />
    </div>
  );
}

function HealthList(props: { heartbeat: string; reconnect: string; judgeAvail: string; voteDelivery: string }) {
  const Row = ({ k, v }: { k: string; v: string }) => {
    const color = v === 'Healthy' ? 'bg-emerald-500' : v === 'Warning' ? 'bg-yellow-500' : v === 'Critical' ? 'bg-[#DC2626]' : 'bg-muted';
    return (
      <div className="flex items-center justify-between border-b border-border last:border-b-0 py-1.5">
        <span className="font-mono text-[10px] uppercase text-muted-foreground">{k}</span>
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs">{v}</span>
          <span className={`w-1.5 h-1.5 ${color}`} />
        </span>
      </div>
    );
  };
  return (
    <div>
      <Row k="Heartbeat" v={props.heartbeat} />
      <Row k="Reconnects" v={props.reconnect} />
      <Row k="Judge avail." v={props.judgeAvail} />
      <Row k="Vote delivery" v={props.voteDelivery} />
    </div>
  );
}

function QueueSlot({ label, fight, onOpen, active }: { label: string; fight: any; onOpen: (f: any) => void; active?: boolean }) {
  return (
    <div className={`border p-2 ${active ? 'border-[#DC2626]' : 'border-border'}`}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      {fight ? (
        <button onClick={() => onOpen(fight)} className="w-full text-left mt-1">
          <div className="font-display text-sm">{fight.red_name} <span className="text-muted-foreground">vs</span> {fight.blue_name}</div>
          <div className="font-mono text-[10px] uppercase text-muted-foreground">{fight.state} · R{fight.current_round}/{fight.rounds_planned}</div>
        </button>
      ) : <div className="font-mono text-[10px] uppercase text-muted-foreground mt-1">—</div>}
    </div>
  );
}

function ImpactBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border p-2">
      <div className="font-mono text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-mono text-sm mt-1">{value}</div>
    </div>
  );
}

function DegradedBanner() {
  return (
    <div className="bg-[#DC2626] text-white px-4 py-2 font-mono text-[10px] uppercase tracking-widest">
      Degraded mode — database unreachable. Retrying…
    </div>
  );
}

function SparcRecordPair({ redId, blueId }: { redId: string | null; blueId: string | null }) {
  const [recs, setRecs] = useState<Record<string, { w: number; l: number; d: number }>>({});
  useEffect(() => {
    const ids = [redId, blueId].filter(Boolean) as string[];
    if (ids.length === 0) return;
    (async () => {
      const { data } = await supabase.from('sparc_records').select('fighter_id, wins, losses, draws').in('fighter_id', ids);
      const m: Record<string, { w: number; l: number; d: number }> = {};
      (data ?? []).forEach((r: any) => { m[r.fighter_id] = { w: r.wins ?? 0, l: r.losses ?? 0, d: r.draws ?? 0 }; });
      setRecs(m);
    })();
  }, [redId, blueId]);
  const fmtR = (id: string | null) => {
    if (!id || !recs[id]) return '0-0-0';
    const r = recs[id];
    return `${r.w}-${r.l}-${r.d}`;
  };
  return (
    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
      <div>
        <div className="font-mono text-[10px] uppercase text-muted-foreground">SPARC record (red)</div>
        <div className="font-mono text-sm">{fmtR(redId)}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[10px] uppercase text-muted-foreground">SPARC record (blue)</div>
        <div className="font-mono text-sm">{fmtR(blueId)}</div>
      </div>
    </div>
  );
}

// ---------- Override drawer ----------
function OverrideDrawer({ fightId, onClose, onExecuted }: { fightId: string; onClose: () => void; onExecuted: () => void }) {
  const [action, setAction] = useState<'force_close_round' | 'force_close_voting' | 'force_confirm_result' | 'force_advance_fight'>('force_close_voting');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (!reason.trim()) { setErr('Reason is required.'); return; }
    setBusy(true);
    const { error } = await supabase.rpc('sparc_admin_override', {
      p_fight_id: fightId, p_action: action, p_reason: reason.trim(),
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onExecuted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-background border border-[#DC2626] rounded-[2px] m-2" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#DC2626]">Emergency override</div>
            <div className="font-display text-base">Force action on active fight</div>
          </div>
          <button onClick={onClose} className="font-mono text-[10px] uppercase text-muted-foreground">Close</button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="font-mono text-[10px] uppercase text-muted-foreground">Action</label>
            <div className="grid grid-cols-1 gap-1 mt-1">
              {([
                ['force_close_round', 'Force close round'],
                ['force_close_voting', 'Force close voting'],
                ['force_confirm_result', 'Force confirm result'],
                ['force_advance_fight', 'Force advance fight'],
              ] as const).map(([k, lbl]) => (
                <button key={k} onClick={() => setAction(k)}
                  className={`text-left border px-3 py-2 font-mono text-[11px] uppercase ${action === k ? 'border-[#DC2626] text-[#DC2626]' : 'border-border'}`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase text-muted-foreground">Reason (required)</label>
            <textarea
              value={reason} onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Explain why this override is necessary…"
              className="w-full mt-1 bg-background border border-border px-3 py-2 text-sm rounded-[2px]"
            />
          </div>
          {err && <div className="font-mono text-[10px] uppercase text-[#DC2626] border border-[#DC2626] px-2 py-1">{err}</div>}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 border border-border px-3 py-2 font-mono text-[11px] uppercase">Cancel</button>
            <button onClick={submit} disabled={busy || !reason.trim()}
              className="flex-1 border border-[#DC2626] bg-[#DC2626] text-white px-3 py-2 font-mono text-[11px] uppercase disabled:opacity-50">
              {busy ? 'Executing…' : 'Execute override'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
