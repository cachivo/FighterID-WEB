import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VisionEngineStatus {
  isLive: boolean;
  deviceId: string | null;
  lastHeartbeat: string | null;
  status: string | null;
  fps: number | null;
  personsDetected: number | null;
}

const HEARTBEAT_THRESHOLD_MS = 10_000;
const POLL_INTERVAL_MS = 3_000;

interface SessionRow {
  device_id: string | null;
  last_heartbeat: string | null;
  status: string | null;
  metadata: Record<string, unknown> | null;
}

function extractMetrics(metadata: Record<string, unknown> | null) {
  return {
    fps: typeof metadata?.fps === 'number' ? metadata.fps : null,
    personsDetected: typeof metadata?.persons === 'number' ? metadata.persons : null,
    latencyMs: typeof metadata?.latency_ms === 'number' ? metadata.latency_ms : null,
  };
}

export function useVisionEngineStatus(fightId: string | undefined): VisionEngineStatus {
  const [session, setSession] = useState<SessionRow | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!fightId) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('fight_telemetry_sessions')
        .select('device_id, last_heartbeat, status, metadata')
        .eq('fight_id', fightId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle() as any;

      if (data) setSession(data as SessionRow);
    };

    fetch();
  }, [fightId]);

  useEffect(() => {
    if (!fightId) return;

    const channel = supabase
      .channel(`vision-status-${fightId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fight_telemetry_sessions',
          filter: `fight_id=eq.${fightId}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row) {
            setSession({
              device_id: row.device_id,
              last_heartbeat: row.last_heartbeat,
              status: row.status,
              metadata: row.metadata,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fightId]);

  const evaluate = useCallback(() => {
    if (!session?.last_heartbeat) {
      setIsLive(false);
      return;
    }
    const diff = Date.now() - new Date(session.last_heartbeat).getTime();
    setIsLive(diff < HEARTBEAT_THRESHOLD_MS && session.status === 'connected');
  }, [session]);

  useEffect(() => {
    evaluate();
    const interval = setInterval(evaluate, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [evaluate]);

  const metrics = extractMetrics(session?.metadata ?? null);

  return {
    isLive,
    deviceId: session?.device_id ?? null,
    lastHeartbeat: session?.last_heartbeat ?? null,
    status: session?.status ?? null,
    fps: metrics.fps,
    personsDetected: metrics.personsDetected,
  };
}
