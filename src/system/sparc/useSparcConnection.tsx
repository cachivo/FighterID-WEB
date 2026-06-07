/**
 * SPARC Connection Manager
 * - Sends heartbeats every 5s while visible
 * - Tracks online/offline + supabase realtime channel state
 * - On reconnect: flushes the IndexedDB vote queue
 * - Boot recovery: calls sparc_recover_session() to know where the judge belongs
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { flushQueue, listPending } from './voteQueue';
import { consumeInteraction } from './hooks/useSparcInteraction';

export type ConnStatus = 'online' | 'reconnecting' | 'offline';

const SESSION_KEY = 'sparc.session_id';
const FIGHT_KEY = 'sparc.fight_id';
const ROUND_KEY = 'sparc.round_id';

export interface RecoveredSession {
  session_id: string;
  fight_id: string;
  round_id: string | null;
  role: string;
  fight_state: string;
  round_state: string | null;
  voting_closes_at: string | null;
  red_name: string;
  blue_name: string;
}

export function persistContext(p: { session_id?: string; fight_id?: string; round_id?: string | null }) {
  if (p.session_id) localStorage.setItem(SESSION_KEY, p.session_id);
  if (p.fight_id) localStorage.setItem(FIGHT_KEY, p.fight_id);
  if (p.round_id !== undefined) {
    if (p.round_id) localStorage.setItem(ROUND_KEY, p.round_id);
    else localStorage.removeItem(ROUND_KEY);
  }
}

export function readContext() {
  return {
    session_id: localStorage.getItem(SESSION_KEY),
    fight_id: localStorage.getItem(FIGHT_KEY),
    round_id: localStorage.getItem(ROUND_KEY),
  };
}

export function clearContext() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(FIGHT_KEY);
  localStorage.removeItem(ROUND_KEY);
}

export async function recoverSession(): Promise<RecoveredSession | null> {
  const { data, error } = await supabase.rpc('sparc_recover_session');
  if (error || !data || !Array.isArray(data) || data.length === 0) return null;
  return data[0] as RecoveredSession;
}

export interface UseSparcConnectionOpts {
  deviceId?: string | null;
  /** Realtime channel state callback (joined/closed) — optional. */
  onChannelState?: (state: 'joined' | 'closed' | 'error') => void;
}

export function useSparcConnection(sessionId: string | null, opts: UseSparcConnectionOpts = {}) {
  const { deviceId } = opts;
  const [status, setStatus] = useState<ConnStatus>(
    typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline'
  );
  const [pendingCount, setPendingCount] = useState(0);
  const lastOnlineRef = useRef<number>(Date.now());

  const refreshPending = useCallback(async () => {
    const list = await listPending();
    setPendingCount(list.length);
  }, []);

  const flush = useCallback(async () => {
    const r = await flushQueue();
    await refreshPending();
    return r;
  }, [refreshPending]);

  // online / offline
  useEffect(() => {
    const onOnline = async () => {
      const gap = Date.now() - lastOnlineRef.current;
      setStatus('reconnecting');
      try {
        await flush();
        if (sessionId) {
          await supabase.from('sparc_reconnections').insert({
            session_id: sessionId,
            app_user_id: (await supabase.auth.getUser()).data.user?.id,
            disconnected_at: new Date(lastOnlineRef.current).toISOString(),
            gap_ms: gap,
          } as any);
        }
      } finally {
        setStatus('online');
        lastOnlineRef.current = Date.now();
      }
    };
    const onOffline = () => {
      lastOnlineRef.current = Date.now();
      setStatus('offline');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [flush, sessionId]);

  // heartbeat
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const beat = async () => {
      if (cancelled || document.hidden || !navigator.onLine) return;
      try {
        await supabase.rpc('sparc_heartbeat', {
          p_session_id: sessionId,
          p_device_id: deviceId ?? null,
          p_interacted: consumeInteraction(8_000),
        });
      } catch {}
    };
    beat();
    const iv = window.setInterval(beat, 5000);
    const onVis = () => { if (!document.hidden) beat(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [sessionId, deviceId]);

  // initial + periodic queue check
  useEffect(() => {
    refreshPending();
    const iv = window.setInterval(() => {
      if (navigator.onLine) flush();
      else refreshPending();
    }, 8000);
    return () => clearInterval(iv);
  }, [flush, refreshPending]);

  return { status, pendingCount, flush, refreshPending };
}
