import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUuidParam } from "@/hooks/useUuidParam";
import { useSparcServerClock, serverNow } from "@/system/sparc/hooks/useSparcServerClock";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Radio } from "lucide-react";
import { fmt } from "./arenaHelpers";

interface PublicState {
  session_id: string;
  session_name: string;
  event_name: string;
  discipline: string;
  red_name: string | null;
  blue_name: string | null;
  round_number: number | null;
  round_started_at_ms: number | null;
  round_duration_s: number | null;
  voting_open: boolean;
  voting_closes_at_ms: number | null;
  fight_state: string | null;
}

function parseActive(a: any): { red: string | null; blue: string | null; round_duration_s: number | null; state: string | null } {
  if (!a || typeof a !== "object") return { red: null, blue: null, round_duration_s: null, state: null };
  return {
    red: a.red_name ?? null,
    blue: a.blue_name ?? null,
    round_duration_s: a.round_duration_s ?? null,
    state: a.state ?? null,
  };
}

function parseRound(cr: any): { number: number | null; started_at_ms: number | null; voting_closes_at_ms: number | null; state: string | null } {
  if (!cr || typeof cr !== "object") return { number: null, started_at_ms: null, voting_closes_at_ms: null, state: null };
  return {
    number: cr.number ?? cr.round_number ?? null,
    started_at_ms: cr.started_at ? new Date(cr.started_at).getTime() : null,
    voting_closes_at_ms: cr.voting_closes_at ? new Date(cr.voting_closes_at).getTime() : null,
    state: cr.state ?? null,
  };
}

export default function ArenaPublicWatch() {
  const { value: fightId, redirect } = useUuidParam("fightId");
  useSparcServerClock();
  const [state, setState] = useState<PublicState | null>(null);
  const [, force] = useState(0);

  const load = async () => {
    if (!fightId) return;
    const { data } = await supabase
      .from("sparc_event_dashboard_v")
      .select("session_id,session_name,event_name,discipline,active_fight,current_round")
      .eq("active_fight_id", fightId)
      .maybeSingle();
    if (!data) {
      setState(null);
      return;
    }
    const af = parseActive((data as any).active_fight);
    const cr = parseRound((data as any).current_round);
    setState({
      session_id: (data as any).session_id,
      session_name: (data as any).session_name ?? "",
      event_name: (data as any).event_name ?? "",
      discipline: (data as any).discipline ?? "",
      red_name: af.red,
      blue_name: af.blue,
      round_number: cr.number,
      round_started_at_ms: cr.started_at_ms,
      round_duration_s: af.round_duration_s,
      voting_open: cr.state === "VOTING_OPEN",
      voting_closes_at_ms: cr.voting_closes_at_ms,
      fight_state: af.state,
    });
  };

  useEffect(() => {
    if (!fightId) return;
    load();
    const iv = window.setInterval(load, 2000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fightId]);

  // Realtime nudge
  useEffect(() => {
    if (!fightId) return;
    const ch = supabase
      .channel(`arena-watch-${fightId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sparc_rounds" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "sparc_fights", filter: `id=eq.${fightId}` }, () =>
        load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fightId]);

  // Tick for countdown
  useEffect(() => {
    const iv = window.setInterval(() => force((t) => t + 1), 250);
    return () => clearInterval(iv);
  }, []);

  if (redirect) return redirect;

  if (!state) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Countdown logic
  let label = "ESPERANDO";
  let ms: number | null = null;
  if (state.voting_open && state.voting_closes_at_ms) {
    label = "VOTACIÓN";
    ms = state.voting_closes_at_ms - serverNow();
  } else if (state.round_started_at_ms && state.round_duration_s) {
    label = `ROUND ${state.round_number ?? ""}`;
    const endAt = state.round_started_at_ms + state.round_duration_s * 1000;
    ms = endAt - serverNow();
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 border border-[#DC2626] text-[#DC2626] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest">
            <Radio className="h-3 w-3" />
            En vivo
          </span>
          <span className="font-mono text-[10px] uppercase text-muted-foreground">{state.discipline}</span>
        </div>
        <div className="font-mono text-[10px] uppercase text-muted-foreground truncate max-w-[60%]">
          {state.event_name}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8">
        {/* Fighters */}
        <div className="w-full max-w-3xl grid grid-cols-3 items-center gap-4">
          <div className="text-center sm:text-right">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#DC2626]">Rojo</div>
            <div className="font-display text-xl sm:text-3xl mt-1 break-words">{state.red_name ?? "—"}</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">vs</div>
          </div>
          <div className="text-center sm:text-left">
            <div className="font-mono text-[10px] uppercase tracking-widest text-blue-400">Azul</div>
            <div className="font-display text-xl sm:text-3xl mt-1 break-words">{state.blue_name ?? "—"}</div>
          </div>
        </div>

        {/* Countdown */}
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
          <div
            className={`font-mono text-6xl sm:text-8xl tabular-nums mt-2 ${
              ms !== null && ms < 5000 && state.voting_open ? "text-[#DC2626]" : "text-foreground"
            }`}
          >
            {ms !== null ? fmt(ms) : "—:—"}
          </div>
        </div>

        {/* Status */}
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {state.voting_open ? "Votación abierta" : "Votación cerrada"} · Sesión {state.session_name}
        </div>
      </main>
    </div>
  );
}
