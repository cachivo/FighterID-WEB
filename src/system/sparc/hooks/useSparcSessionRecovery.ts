/**
 * SPARC Session Recovery — on app launch / refresh / reconnect,
 * ask the server where this judge belongs and redirect to the live fight.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { persistContext } from '../useSparcConnection';

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

export async function fetchRecoveredSession(): Promise<RecoveredSession | null> {
  const { data, error } = await supabase.rpc('sparc_recover_session');
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.fight_id) return null;
  return row as RecoveredSession;
}

interface Opts {
  enabled?: boolean;
  /** Skip redirect if user is already on the live fight route. */
  skipIfPathMatches?: RegExp;
}

export function useSparcSessionRecovery(opts: Opts = {}) {
  const { enabled = true, skipIfPathMatches } = opts;
  const nav = useNavigate();
  const [checking, setChecking] = useState(true);
  const [recovered, setRecovered] = useState<RecoveredSession | null>(null);
  const ran = useRef(false);

  const run = async () => {
    setChecking(true);
    try {
      const r = await fetchRecoveredSession();
      if (r) {
        persistContext({ session_id: r.session_id, fight_id: r.fight_id, round_id: r.round_id });
        setRecovered(r);
        const here = typeof window !== 'undefined' ? window.location.pathname : '';
        const onLive = skipIfPathMatches ? skipIfPathMatches.test(here) : here === `/sparc/live/${r.fight_id}`;
        if (!onLive) nav(`/sparc/live/${r.fight_id}`, { replace: true });
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!enabled || ran.current) return;
    ran.current = true;
    run();
    const onOnline = () => run();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { checking, recovered, recheck: run };
}
