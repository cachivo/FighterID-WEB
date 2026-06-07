/**
 * SPARC Admin — minimal: create event, create session, add fight, control rounds.
 * Mobile-first single column.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function SparcAdmin() {
  const [discipline, setDiscipline] = useState<'MMA' | 'BOXING'>('MMA');
  const [eventName, setEventName] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<string>('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<string>('');
  const [fights, setFights] = useState<any[]>([]);
  const [redName, setRedName] = useState('');
  const [blueName, setBlueName] = useState('');

  const loadEvents = async () => {
    const { data } = await supabase
      .from('sparc_events').select('id,name,discipline,state').order('created_at',{ascending:false}).limit(50);
    setEvents((data as any) ?? []);
  };
  useEffect(() => { loadEvents(); }, []);

  const loadSessions = async (eventId: string) => {
    const { data } = await supabase
      .from('sparc_sessions').select('id,name,state').eq('event_id', eventId).order('created_at');
    setSessions((data as any) ?? []);
  };
  useEffect(() => { if (activeEvent) loadSessions(activeEvent); }, [activeEvent]);

  const loadFights = async (sessionId: string) => {
    const { data } = await supabase
      .from('sparc_fights').select('id,red_name,blue_name,state,current_round')
      .eq('session_id', sessionId).order('order_idx');
    setFights((data as any) ?? []);
  };
  useEffect(() => { if (activeSession) loadFights(activeSession); }, [activeSession]);

  const createEvent = async () => {
    if (!eventName.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { data: au } = await supabase.from('app_user').select('id').eq('auth_user_id', u.user?.id ?? '').maybeSingle();
    await supabase.from('sparc_events').insert({
      name: eventName.trim(), discipline, created_by: au?.id ?? null,
    } as any);
    setEventName('');
    loadEvents();
  };

  const createSession = async () => {
    if (!activeEvent) return;
    await supabase.from('sparc_sessions').insert({ event_id: activeEvent, name: `Session ${sessions.length + 1}` } as any);
    loadSessions(activeEvent);
  };

  const createFight = async () => {
    if (!activeSession || !redName.trim() || !blueName.trim()) return;
    await supabase.from('sparc_fights').insert({
      session_id: activeSession, discipline,
      red_name: redName.trim(), blue_name: blueName.trim(),
      order_idx: fights.length,
    } as any);
    setRedName(''); setBlueName('');
    loadFights(activeSession);
  };

  const openRound = async (fightId: string) => {
    await supabase.rpc('sparc_open_round', { p_fight_id: fightId });
    loadFights(activeSession);
  };
  const openVoting = async (fightId: string) => {
    const { data: r } = await supabase.from('sparc_rounds').select('id').eq('fight_id', fightId).order('idx',{ascending:false}).limit(1).maybeSingle();
    if (r?.id) await supabase.rpc('sparc_open_voting', { p_round_id: r.id });
  };
  const closeVoting = async (fightId: string) => {
    const { data: r } = await supabase.from('sparc_rounds').select('id').eq('fight_id', fightId).order('idx',{ascending:false}).limit(1).maybeSingle();
    if (r?.id) await supabase.rpc('sparc_close_voting', { p_round_id: r.id });
    loadFights(activeSession);
  };
  const computeResult = async (fightId: string) => {
    await supabase.rpc('sparc_compute_result', { p_fight_id: fightId });
    loadFights(activeSession);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-8">
      <header className="border-b border-border px-4 py-4">
        <div className="font-mono text-[11px] uppercase text-muted-foreground">SPARC</div>
        <h1 className="font-display text-xl">Admin</h1>
      </header>

      <section className="px-4 py-4 grid grid-cols-1 gap-3 border-b border-border">
        <div className="font-mono text-[11px] uppercase text-muted-foreground">New event</div>
        <div className="flex gap-2">
          {(['MMA','BOXING'] as const).map(d=>(
            <button key={d} onClick={()=>setDiscipline(d)}
              className={`border px-3 py-1 font-mono text-[11px] uppercase ${discipline===d?'border-primary text-primary':'border-border'}`}>{d}</button>
          ))}
        </div>
        <input value={eventName} onChange={e=>setEventName(e.target.value)} placeholder="Event name"
          className="bg-background border border-border px-3 py-2 text-sm" />
        <button onClick={createEvent} className="border border-primary text-primary px-3 py-2 font-mono text-xs uppercase">Create event</button>
      </section>

      <section className="px-4 py-4 border-b border-border">
        <div className="font-mono text-[11px] uppercase text-muted-foreground mb-2">Events</div>
        <ul className="grid grid-cols-1 gap-2">
          {events.map(e=>(
            <li key={e.id}>
              <button onClick={()=>{setActiveEvent(e.id); setActiveSession('');}}
                className={`w-full text-left border px-3 py-2 ${activeEvent===e.id?'border-primary':'border-border'}`}>
                <div className="font-display">{e.name}</div>
                <div className="font-mono text-[10px] uppercase text-muted-foreground">{e.discipline} · {e.state}</div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {activeEvent && (
        <section className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="font-mono text-[11px] uppercase text-muted-foreground">Sessions</div>
            <button onClick={createSession} className="border border-border px-2 py-1 font-mono text-[10px] uppercase">+ Session</button>
          </div>
          <ul className="grid grid-cols-1 gap-2">
            {sessions.map(s=>(
              <li key={s.id}>
                <button onClick={()=>setActiveSession(s.id)}
                  className={`w-full text-left border px-3 py-2 ${activeSession===s.id?'border-primary':'border-border'}`}>
                  <div className="font-display">{s.name}</div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeSession && (
        <section className="px-4 py-4">
          <div className="font-mono text-[11px] uppercase text-muted-foreground mb-2">Add fight</div>
          <div className="grid grid-cols-1 gap-2 mb-3">
            <input value={redName} onChange={e=>setRedName(e.target.value)} placeholder="Red corner"
              className="bg-background border border-border px-3 py-2 text-sm" />
            <input value={blueName} onChange={e=>setBlueName(e.target.value)} placeholder="Blue corner"
              className="bg-background border border-border px-3 py-2 text-sm" />
            <button onClick={createFight} className="border border-primary text-primary px-3 py-2 font-mono text-xs uppercase">Add fight</button>
          </div>

          <div className="font-mono text-[11px] uppercase text-muted-foreground mb-2">Fights</div>
          <ul className="grid grid-cols-1 gap-3">
            {fights.map(f=>(
              <li key={f.id} className="border border-border p-3">
                <div className="font-display">{f.red_name} <span className="text-muted-foreground">vs</span> {f.blue_name}</div>
                <div className="font-mono text-[10px] uppercase text-muted-foreground mb-2">R{f.current_round} · {f.state}</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={()=>openRound(f.id)} className="border border-border px-2 py-2 font-mono text-[10px] uppercase">Open round</button>
                  <button onClick={()=>openVoting(f.id)} className="border border-border px-2 py-2 font-mono text-[10px] uppercase">Open voting</button>
                  <button onClick={()=>closeVoting(f.id)} className="border border-border px-2 py-2 font-mono text-[10px] uppercase">Close voting</button>
                  <button onClick={()=>computeResult(f.id)} className="border border-primary text-primary px-2 py-2 font-mono text-[10px] uppercase">Confirm result</button>
                </div>
                <a href={`/sparc/live/${f.id}`} className="block mt-2 font-mono text-[10px] uppercase text-primary">Open judge view →</a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
