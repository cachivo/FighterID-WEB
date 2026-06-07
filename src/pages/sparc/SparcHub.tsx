import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { recoverSession } from "@/system/sparc/useSparcConnection";
import { Trophy, Calendar, Award, Building2, Users, Radio, ArrowRight } from "lucide-react";

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

  // Boot recovery → ARENA live fight
  useEffect(() => {
    (async () => {
      try {
        const r = await recoverSession();
        if (r?.fight_id) nav(`/arena/live/${r.fight_id}`, { replace: true });
      } catch {
        /* noop */
      }
    })();
  }, [nav]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("sparc_events")
        .select("id, name, discipline, starts_at, state")
        .order("starts_at", { ascending: false })
        .limit(50);
      setEvents((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground">
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-baseline justify-between gap-3">
          <div>
            <h1 className="font-display text-xl tracking-tight">SPARC</h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Sparring performance assessment &amp; ranking circuit
            </p>
          </div>
          <Link
            to="/arena"
            className="border border-[#DC2626] text-[#DC2626] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:bg-[#DC2626]/10"
          >
            ARENA live
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Desarrollo */}
        <section className="space-y-3">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Desarrollo
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <HubTile to="/resultados" icon={Trophy} label="Records" sub="Atletas y resultados" />
            <HubTile to="/sparc/rankings" icon={Award} label="Rankings" sub="Circuito SPARC" />
            <HubTile to="/gimnasios" icon={Building2} label="Gyms" sub="Escuelas afiliadas" />
            <HubTile to="/entrenadores" icon={Users} label="Coaches" sub="Entrenadores" />
          </div>
        </section>

        {/* Competencia */}
        <section className="space-y-3">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Competencia
          </h2>
          <Link
            to="/arena"
            className="block border border-border bg-[#111111] p-4 hover:border-[#DC2626] transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Radio className="h-5 w-5 text-[#DC2626] shrink-0" />
                <div className="min-w-0">
                  <div className="font-display text-lg">ARENA</div>
                  <div className="font-mono text-[11px] text-muted-foreground truncate">
                    Centro de competencia en vivo
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </Link>
        </section>

        {/* Eventos */}
        <section className="space-y-3">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Eventos
          </h2>
          {loading && <div className="text-sm text-muted-foreground">Cargando…</div>}
          {!loading && events.length === 0 && (
            <div className="text-sm text-muted-foreground">Sin eventos.</div>
          )}
          <ul className="grid grid-cols-1 gap-2">
            {events.map((e) => (
              <li key={e.id}>
                <Link
                  to={`/sparc/event/${e.id}`}
                  className="block border border-border p-3 hover:border-[#DC2626] bg-[#111111]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display truncate">{e.name}</div>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground shrink-0">
                      {e.discipline}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {e.starts_at ? new Date(e.starts_at).toLocaleString() : "—"} · {e.state}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function HubTile({
  to,
  icon: Icon,
  label,
  sub,
}: {
  to: string;
  icon: typeof Trophy;
  label: string;
  sub: string;
}) {
  return (
    <Link
      to={to}
      className="border border-border p-3 bg-[#111111] hover:border-[#DC2626] transition-colors block min-h-[72px]"
    >
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="font-display text-sm">{label}</div>
          <div className="font-mono text-[10px] uppercase text-muted-foreground truncate">{sub}</div>
        </div>
      </div>
    </Link>
  );
}
