/**
 * SPARC Server Clock — single source of truth for all countdowns.
 * Never use Date.now() for business logic; use serverNow() from this hook.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const RESYNC_MS = 30_000;

interface SyncState {
  offset: number;   // serverEpoch - clientEpoch at sync moment (ms)
  latency: number;  // round-trip-time / 2 (ms)
  lastSync: number; // client epoch ms of last successful sync
  synced: boolean;
}

const state: SyncState = { offset: 0, latency: 0, lastSync: 0, synced: false };

export async function syncClockOnce(): Promise<boolean> {
  const t0 = Date.now();
  const { data, error } = await supabase.rpc('sparc_server_time');
  const t1 = Date.now();
  if (error || !data) return false;
  const row = Array.isArray(data) ? data[0] : data;
  const serverEpoch = Number((row as any)?.server_epoch_ms);
  if (!serverEpoch) return false;
  const rtt = t1 - t0;
  // Approximate server time at t1: serverEpoch + rtt/2
  state.offset = (serverEpoch + rtt / 2) - t1;
  state.latency = rtt / 2;
  state.lastSync = t1;
  state.synced = true;
  return true;
}

export function serverNow(): number {
  return Date.now() + state.offset;
}
export function getOffset() { return state.offset; }
export function getLatency() { return state.latency; }
export function isSynced() { return state.synced; }

export function useSparcServerClock() {
  const [synced, setSynced] = useState(state.synced);
  const [latency, setLatency] = useState(state.latency);
  const timer = useRef<number | null>(null);

  const run = useCallback(async () => {
    const ok = await syncClockOnce();
    setSynced(state.synced);
    setLatency(state.latency);
    return ok;
  }, []);

  useEffect(() => {
    run();
    timer.current = window.setInterval(run, RESYNC_MS);
    const onVis = () => { if (!document.hidden) run(); };
    const onOnline = () => run();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onOnline);
    return () => {
      if (timer.current) clearInterval(timer.current);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onOnline);
    };
  }, [run]);

  return { serverNow, getOffset, getLatency, isSynced, synced, latency, resync: run };
}
