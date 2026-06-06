import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, History, Trophy, Skull, Minus, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RecordHistoryRow {
  verdict_id: string;
  signed_at: string;
  result_type: string;
  outcome: "win" | "loss" | "draw" | "no_contest";
  round_number: number | null;
  round_config: number | null;
  opponent_id: string | null;
  opponent_name: string | null;
  judge_user_id: string | null;
  judge_email: string | null;
}

interface Props {
  fighterId: string;
}

const RESULT_LABEL: Record<string, string> = {
  ko: "KO",
  tko: "TKO",
  decision_unanimous: "Decisión unánime",
  decision_split: "Decisión dividida",
  decision_majority: "Decisión mayoritaria",
  draw: "Empate",
  dq: "Descalificación",
  no_contest: "Sin resultado",
};

function OutcomeBadge({ outcome }: { outcome: RecordHistoryRow["outcome"] }) {
  if (outcome === "win") {
    return (
      <Badge className="bg-fighter-success text-white hover:bg-fighter-success">
        <Trophy className="h-3 w-3 mr-1" /> Victoria
      </Badge>
    );
  }
  if (outcome === "loss") {
    return (
      <Badge variant="destructive">
        <Skull className="h-3 w-3 mr-1" /> Derrota
      </Badge>
    );
  }
  if (outcome === "draw") {
    return (
      <Badge variant="secondary">
        <Minus className="h-3 w-3 mr-1" /> Empate
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      <Ban className="h-3 w-3 mr-1" /> Sin resultado
    </Badge>
  );
}

export function FighterRecordHistory({ fighterId }: Props) {
  const [rows, setRows] = useState<RecordHistoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRows(null);
      setError(null);
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: RecordHistoryRow[] | null; error: { message: string } | null }>)(
        "get_fighter_record_history",
        { p_fighter_id: fighterId },
      );
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setRows([]);
        return;
      }
      setRows(data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [fighterId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de récord
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Trazabilidad completa: cada cambio en el récord firmado por un juez oficial.
        </p>
      </CardHeader>
      <CardContent>
        {rows === null ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">No se pudo cargar el historial: {error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Sin cambios registrados en el récord.
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => {
              const date = new Date(r.signed_at);
              return (
                <li key={r.verdict_id} className="py-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <OutcomeBadge outcome={r.outcome} />
                    <time
                      dateTime={r.signed_at}
                      className="text-xs font-mono text-muted-foreground"
                      title={date.toISOString()}
                    >
                      {date.toLocaleString()}
                    </time>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">
                      {RESULT_LABEL[r.result_type] ?? r.result_type}
                    </span>
                    {r.round_number != null && r.round_config != null && (
                      <span className="text-muted-foreground">
                        {" "}· Round {r.round_number}/{r.round_config}
                      </span>
                    )}
                  </div>

                  {r.opponent_name && (
                    <div className="text-sm text-muted-foreground">
                      Oponente:{" "}
                      {r.opponent_id ? (
                        <Link
                          to={`/fighters/${r.opponent_id}`}
                          className="text-primary hover:underline"
                        >
                          {r.opponent_name}
                        </Link>
                      ) : (
                        r.opponent_name
                      )}
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-xs text-muted-foreground border-l-2 border-primary/30 pl-2 mt-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div>
                        Firmado por:{" "}
                        <span className="font-mono break-all">
                          {r.judge_email ?? "Juez desconocido"}
                        </span>
                      </div>
                      <div className="font-mono opacity-60 break-all">ID: {r.verdict_id}</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default FighterRecordHistory;
