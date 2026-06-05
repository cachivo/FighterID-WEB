import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from './useAuth';

export type TmRole = 'red' | 'blue' | 'judge';

export interface TmMatchRow {
  id: string;
  code: string;
  created_by: string | null;
  red_fighter_id: string;
  blue_fighter_id: string;
  judge_fighter_id: string;
  round_config: number;
  round_duration_sec: number;
  phase: string;
  winner_fighter_id: string | null;
  result_type: string | null;
  notes: string | null;
  records_updated: boolean;
}

export interface TimerSnapshot {
  phase: string;
  currentRound: number;
  timeMs: number;
  isRunning: boolean;
  isPaused: boolean;
  restTimeMs: number;
  isRestPeriod: boolean;
}

export type PresenceMap = Partial<Record<TmRole, { online: boolean; at: number }>>;

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function useTimeMasterMatch() {
  const { user } = useAuth();
  const [match, setMatch] = useState<TmMatchRow | null>(null);
  const [role, setRole] = useState<TmRole | null>(null);
  const [presence, setPresence] = useState<PresenceMap>({});
  const [remoteTimer, setRemoteTimer] = useState<TimerSnapshot | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const subscribe = useCallback((m: TmMatchRow, r: TmRole) => {
    cleanup();
    const ch = supabase.channel(`tm:${m.code}`, {
      config: { presence: { key: r } },
    });
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, Array<{ at?: number }>>;
      const next: PresenceMap = {};
      (['red', 'blue', 'judge'] as TmRole[]).forEach((k) => {
        if (state[k] && state[k].length) {
          next[k] = { online: true, at: state[k][0].at ?? Date.now() };
        }
      });
      setPresence(next);
    });
    ch.on('broadcast', { event: 'timer' }, ({ payload }) => {
      setRemoteTimer(payload as TimerSnapshot);
    });
    ch.on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'tm_match', filter: `id=eq.${m.id}`,
    }, ({ new: row }) => {
      setMatch(row as TmMatchRow);
    });
    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ at: Date.now() });
      }
    });
    channelRef.current = ch;
  }, [cleanup]);

  const createMatch = useCallback(async (input: {
    red_fighter_id: string; blue_fighter_id: string; judge_fighter_id: string;
    round_config: number; round_duration_sec: number;
  }) => {
    if (!user) throw new Error('Not authenticated');
    const code = randomCode();
    const { data, error } = await supabase
      .from('tm_match')
      .insert({ ...input, code, created_by: user.id })
      .select('*')
      .single();
    if (error) throw error;
    const row = data as TmMatchRow;
    setMatch(row);
    setRole('red'); // operator runs from creator screen but doesn't take a role slot by default
    return row;
  }, [user]);

  const joinByCode = useCallback(async (code: string, chosenRole: TmRole) => {
    const { data, error } = await supabase
      .from('tm_match')
      .select('*')
      .eq('code', code.toUpperCase())
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Match not found');
    const row = data as TmMatchRow;
    setMatch(row);
    setRole(chosenRole);
    subscribe(row, chosenRole);
    return row;
  }, [subscribe]);

  const attachAsOperator = useCallback((m: TmMatchRow) => {
    // operator subscribes but uses a synthetic 'red' presence slot only if they choose to;
    // here we subscribe without tracking a role — use a separate key.
    cleanup();
    const ch = supabase.channel(`tm:${m.code}`, {
      config: { presence: { key: 'operator' } },
    });
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, Array<{ at?: number }>>;
      const next: PresenceMap = {};
      (['red', 'blue', 'judge'] as TmRole[]).forEach((k) => {
        if (state[k] && state[k].length) next[k] = { online: true, at: state[k][0].at ?? Date.now() };
      });
      setPresence(next);
    });
    ch.on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'tm_match', filter: `id=eq.${m.id}`,
    }, ({ new: row }) => setMatch(row as TmMatchRow));
    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await ch.track({ at: Date.now(), op: true });
    });
    channelRef.current = ch;
  }, [cleanup]);

  const broadcastTimer = useCallback((snap: TimerSnapshot) => {
    if (!channelRef.current) return;
    channelRef.current.send({ type: 'broadcast', event: 'timer', payload: snap });
  }, []);

  const submitVerdict = useCallback(async (input: {
    winner_fighter_id: string | null;
    result_type: string;
    notes?: string;
    update_records: boolean;
  }) => {
    if (!match) throw new Error('No match');
    const { error } = await supabase.rpc('tm_submit_verdict', {
      _match_id: match.id,
      _winner: input.winner_fighter_id,
      _result_type: input.result_type,
      _notes: input.notes ?? null,
      _update_records: input.update_records,
    });
    if (error) throw error;
  }, [match]);

  const leave = useCallback(() => {
    cleanup();
    setMatch(null);
    setRole(null);
    setPresence({});
    setRemoteTimer(null);
  }, [cleanup]);

  return {
    match, role, presence, remoteTimer,
    createMatch, joinByCode, attachAsOperator,
    broadcastTimer, submitVerdict, leave,
  };
}
