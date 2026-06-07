import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { recoverSession, persistContext, readContext } from '@/system/sparc/useSparcConnection';

interface SparcEvent {
  id: string;
  name: string;
  discipline: string;
  starts_at: string | null;
  state: string;
}

export default function SparcHub() {
  const nav = useNavigate();
  const [events, setEvents] = useState<SparcEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Boot recovery — go straight to live fight if there's an active session
  useEffect(() => {
    (async () => {
      const r = await recoverSession();
      if (r?.fight_id) {
        persistContext({ session_id: r.session_id, fight_id: r.fight_id, round_id: r.round_id });
        nav(`/sparc/live/${r.fight_id}`, { replace: true });
      }
    })();
  }, [nav]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('sparc_events')
        .select('id, name, discipline, starts_at, state')
        .order('starts_at', { ascending: false })
        .limit(50);
      setEvents((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const ctx = readContext();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-4 py-4">
        <h1 className="font-display text-xl tracking-tight">SPARC</h1>
        <p className="font-mono text-xs uppercase text-muted-foreground">
          Sparring performance assessment &amp; ranking circuit
        </p>
      </header>

      <div className="px-4 py-4 grid grid-cols-1 gap-3">
        <Link to="/sparc/rankings" className="border border-border p-3 hover:border-primary">
          <div className="font-mono text-[11px] uppercase text-muted-foreground">Rankings</div>
          <div className="font-display">Sparring rankings</div>
        </Link>
        {ctx.fight_id && (
          <Link to={`/sparc/live/${ctx.fight_id}`} className="border border-primary p-3">
            <div className="font-mono text-[11px] uppercase text-primary">Resume</div>
            <div className="font-display">Continue active fight</div>
          </Link>
        )}
        <Link to="/sparc/admin" className="border border-border p-3 hover:border-primary">
          <div className="font-mono text-[11px] uppercase text-muted-foreground">Admin</div>
          <div className="font-display">Create event / session</div>
        </Link>
      </div>

      <section className="px-4 pb-8">
        <h2 className="font-mono text-[11px] uppercase text-muted-foreground mb-2">Events</h2>
        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!loading && events.length === 0 && (
          <div className="text-sm text-muted-foreground">No events yet.</div>
        )}
        <ul className="grid grid-cols-1 gap-2">
          {events.map((e) => (
            <li key={e.id}>
              <Link to={`/sparc/event/${e.id}`} className="block border border-border p-3 hover:border-primary">
                <div className="flex items-center justify-between">
                  <div className="font-display">{e.name}</div>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">{e.discipline}</span>
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {e.starts_at ? new Date(e.starts_at).toLocaleString() : '—'} · {e.state}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
