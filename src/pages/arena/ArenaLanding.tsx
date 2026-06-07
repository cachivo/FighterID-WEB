import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Radio, Calendar, Trophy, Users, Timer, Play, Eye, ArrowRight } from "lucide-react";
import { recoverSession, persistContext } from "@/system/sparc/useSparcConnection";

interface ArenaSession {
  id: string;
  event_id: string | null;
  event_name: string;
  session_name: string;
  discipline: string;
  state: "active" | "scheduled";
  active_fight_id: string | null;
  active_fight_name: string | null;
  current_round: number | null;
  judges_online: number;
  judges_registered: number;
}

const STATE_CFG: Record<ArenaSession["state"], { label: string; className: string }> = {
  active: { label: "EN VIVO", className: "border-[#DC2626] text-[#DC2626] bg-[#DC2626]/10" },
  scheduled: { label: "PROGRAMADO", className: "border-border text-muted-foreground" },
};

function parseFightName(active: any): string | null {
  if (!active) return null;
  if (typeof active === "string") return active;
  if (active.red_name || active.blue_name) {
    return `${active.red_name ?? "Rojo"} vs ${active.blue_name ?? "Azul"}`;
  }
  return active.name ?? null;
}

function parseRound(cr: any): number | null {
  if (!cr) return null;
  if (typeof cr === "number") return cr;
  return cr.number ?? cr.round_number ?? null;
}

export default function ArenaLanding() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ArenaSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Boot recovery
  useEffect(() => {
    (async () => {
      try {
        const r = await recoverSession();
        if (r?.fight_id) {
          persistContext({ session_id: r.session_id, fight_id: r.fight_id, round_id: r.round_id });
          navigate(`/arena/live/${r.fight_id}`, { replace: true });
        }
      } catch {
        /* noop */
      }
    })();
  }, [navigate]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("sparc_event_dashboard_v")
          .select(
            "session_id,event_id,event_name,session_name,discipline,active_fight_id,active_fight,current_round,judges_online,judges_registered"
          )
          .order("session_name")
          .limit(50);
        const mapped: ArenaSession[] = (data ?? []).map((r: any) => ({
          id: r.session_id,
          event_id: r.event_id,
          event_name: r.event_name ?? "Evento",
          session_name: r.session_name ?? "Sesión",
          discipline: r.discipline ?? "MMA",
          state: r.active_fight_id ? "active" : "scheduled",
          active_fight_id: r.active_fight_id,
          active_fight_name: parseFightName(r.active_fight),
          current_round: parseRound(r.current_round),
          judges_online: r.judges_online ?? 0,
          judges_registered: r.judges_registered ?? 0,
        }));
        mapped.sort((a, b) => (a.state === b.state ? 0 : a.state === "active" ? -1 : 1));
        setSessions(mapped);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const active = sessions.filter((s) => s.state === "active");
  const scheduled = sessions.filter((s) => s.state === "scheduled");
  const totalJudges = sessions.reduce((acc, s) => acc + s.judges_online, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground">
      {/* Header */}
      <header className="border-b border-border px-4 py-4 sticky top-0 bg-[#0A0A0A] z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Centro operacional
            </div>
            <h1 className="font-display text-xl sm:text-2xl tracking-tight">ARENA</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/sparc")}
              className="font-mono text-[10px] uppercase tracking-widest"
            >
              SPARC
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/sparc/admin")}
              className="bg-[#DC2626] hover:bg-[#b91c1c] text-white font-mono text-[10px] uppercase tracking-widest"
            >
              Crear sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Stat strip */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="En vivo" value={active.length} accent />
          <Stat label="Programados" value={scheduled.length} />
          <Stat label="Jueces online" value={totalJudges} />
          <Stat label="Sesiones" value={sessions.length} />
        </section>

        {/* Active sessions */}
        {active.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                Arena live
              </h2>
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                {active.length} activa{active.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {active.map((s) => (
                <SessionCard key={s.id} s={s} onOpen={() => navigate(`/arena/session/${s.id}`)} onWatch={(fid) => navigate(`/arena/watch/${fid}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Quick actions */}
        <section className="space-y-3">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Acciones rápidas
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <QuickAction icon={Play} label="Crear sesión" onClick={() => navigate("/sparc/admin")} />
            <QuickAction icon={Timer} label="Arena control" onClick={() => navigate("/time-master")} />
            <QuickAction
              icon={Radio}
              label="Reanudar"
              disabled={active.length === 0}
              onClick={() => active[0] && navigate(`/arena/session/${active[0].id}`)}
            />
            <QuickAction icon={Trophy} label="Resultados" onClick={() => navigate("/resultados")} />
          </div>
        </section>

        {/* Scheduled */}
        {scheduled.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-lg">Sesiones programadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scheduled.map((s) => (
                <SessionCard key={s.id} s={s} onOpen={() => navigate(`/arena/session/${s.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Empty */}
        {sessions.length === 0 && (
          <section className="border border-border p-8 text-center space-y-3">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground" />
            <div className="font-display text-lg">No hay sesiones activas</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              ARENA es el centro de operaciones para todas las competencias en vivo. Crea una sesión para comenzar.
            </p>
            <Button
              onClick={() => navigate("/sparc/admin")}
              className="bg-[#DC2626] hover:bg-[#b91c1c] text-white"
            >
              Crear primera sesión
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="border border-border p-3 bg-[#111111]">
      <div className={`font-display text-2xl tabular-nums ${accent ? "text-[#DC2626]" : ""}`}>{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Play;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="border border-border p-3 bg-[#111111] text-left flex items-center gap-2 hover:border-[#DC2626] transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="font-mono text-[11px] uppercase tracking-widest">{label}</span>
    </button>
  );
}

function SessionCard({
  s,
  onOpen,
  onWatch,
}: {
  s: ArenaSession;
  onOpen: () => void;
  onWatch?: (fightId: string) => void;
}) {
  const cfg = STATE_CFG[s.state];
  return (
    <div
      onClick={onOpen}
      className="border border-border bg-[#111111] p-3 cursor-pointer hover:border-[#DC2626] transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`font-mono text-[10px] uppercase tracking-widest border px-1.5 py-0.5 ${cfg.className}`}>
            {cfg.label}
          </span>
          <span className="font-mono text-[10px] uppercase text-muted-foreground">{s.discipline}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
      <div className="font-display text-base truncate">{s.session_name}</div>
      <div className="font-mono text-[11px] text-muted-foreground truncate">{s.event_name}</div>

      {s.active_fight_name && (
        <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
          <Radio className="h-3 w-3 text-[#DC2626] shrink-0" />
          <span className="text-sm truncate">{s.active_fight_name}</span>
          {s.current_round != null && (
            <span className="font-mono text-[10px] uppercase text-muted-foreground shrink-0">
              R{s.current_round}
            </span>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 font-mono text-[10px] uppercase text-muted-foreground">
          <Users className="h-3 w-3" />
          {s.judges_online}/{s.judges_registered} jueces
        </div>
        {s.active_fight_id && onWatch && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWatch(s.active_fight_id!);
            }}
            className="border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-widest hover:border-[#DC2626] flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            Ver público
          </button>
        )}
      </div>
    </div>
  );
}
