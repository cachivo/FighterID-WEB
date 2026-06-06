import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  type AlertSettings, loadAlertSettings, saveAlertSettings, playAlert,
} from '@/lib/timeMasterAlerts';
import type { AlertKind, BellVariant } from '@/lib/timeMasterAlerts';

export type MatchPhase = 'setup' | 'ready' | 'fighting' | 'between_rounds' | 'finished';

export type MatchResultType =
  | 'ko'
  | 'tko'
  | 'decision_unanimous'
  | 'decision_split'
  | 'decision_majority'
  | 'draw'
  | 'dq'
  | 'no_contest';

export type RoundConfig = 3 | 5 | 8;

export interface RoundResult {
  roundNumber: number;
  durationMs: number;
  knockdownsA: number;
  knockdownsB: number;
  warningsA: number;
  warningsB: number;
  scoreA: number;
  scoreB: number;
  note?: string;
}

export interface MatchResult {
  winnerId: string | null;
  resultType: MatchResultType;
  roundNumber: number;
  notes?: string;
}

export interface FighterOption {
  id: string;
  first_name: string;
  last_name: string;
  nickname?: string | null;
  displayName: string;
  record: string;
}

export function useTimeMaster() {
  const { toast } = useToast();

  const [phase, setPhase] = useState<MatchPhase>('setup');
  const [fighterAId, setFighterAId] = useState<string | null>(null);
  const [fighterBId, setFighterBId] = useState<string | null>(null);
  const [fighterAName, setFighterAName] = useState('');
  const [fighterBName, setFighterBName] = useState('');
  const [fighterAIsGuest, setFighterAIsGuest] = useState(false);
  const [fighterBIsGuest, setFighterBIsGuest] = useState(false);
  const [roundConfig, setRoundConfig] = useState<RoundConfig>(3);
  const [roundDuration, setRoundDuration] = useState(180);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeMs, setTimeMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [restTimeMs, setRestTimeMs] = useState(0);
  const [isRestPeriod, setIsRestPeriod] = useState(false);
  const [roundsCompleted, setRoundsCompleted] = useState<RoundResult[]>([]);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [fighterProfiles, setFighterProfiles] = useState<FighterOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alertSettings, setAlertSettingsState] = useState<AlertSettings>(() => loadAlertSettings());
  const [silentMode, setSilentModeState] = useState(false);
  const [silentModeRemainingSec, setSilentModeRemainingSec] = useState(0);

  const silentModeExpiryRef = useRef<number>(0);
  const silentModeIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>();
  const restIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const timeMsRef = useRef<number>(0);
  const alertsFiredRef = useRef<Set<string>>(new Set());
  const alertSettingsRef = useRef<AlertSettings>(alertSettings);
  const silentModeRef = useRef(silentMode);
  // Guards against double-pushing a RoundResult when the rAF natural-expiry
  // and the user's manual "Terminar Round" tap land in the same frame.
  const roundEndedRef = useRef(false);
  // Stable toast ref so the rAF loop isn't recreated when `toast` re-binds.
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  useEffect(() => { alertSettingsRef.current = alertSettings; }, [alertSettings]);
  useEffect(() => { silentModeRef.current = silentMode; }, [silentMode]);

  const SILENT_MODE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  const setAlertSettings = useCallback((s: AlertSettings) => {
    setAlertSettingsState(s);
    saveAlertSettings(s);
  }, []);

  const clearSilentModeTimer = useCallback(() => {
    if (silentModeIntervalRef.current) {
      clearInterval(silentModeIntervalRef.current);
      silentModeIntervalRef.current = undefined;
    }
    silentModeExpiryRef.current = 0;
    setSilentModeRemainingSec(0);
  }, []);

  const setSilentMode = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof value === 'function' ? value(silentModeRef.current) : value;
    setSilentModeState(next);
    if (next) {
      const expiry = Date.now() + SILENT_MODE_DURATION_MS;
      silentModeExpiryRef.current = expiry;
      setSilentModeRemainingSec(Math.ceil(SILENT_MODE_DURATION_MS / 1000));
      if (silentModeIntervalRef.current) clearInterval(silentModeIntervalRef.current);
      silentModeIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((silentModeExpiryRef.current - Date.now()) / 1000));
        setSilentModeRemainingSec(remaining);
        if (remaining <= 0) {
          setSilentModeState(false);
          clearSilentModeTimer();
        }
      }, 1000);
    } else {
      clearSilentModeTimer();
    }
  }, [clearSilentModeTimer]);

  const fire = useCallback((kind: AlertKind, variant: BellVariant = 'start') => {
    const base = alertSettingsRef.current;
    if (silentModeRef.current) {
      const muted: AlertSettings = {
        bell:    { ...base.bell,    sound: false },
        warning: { ...base.warning, sound: false },
        rest:    { ...base.rest,    sound: false },
      };
      playAlert(kind, muted, variant);
    } else {
      playAlert(kind, base, variant);
    }
  }, []);

  const isGuestMatch = fighterAIsGuest || fighterBIsGuest;

  const canStartMatch = useMemo(() => {
    if (phase !== 'setup') return false;
    const aReady = fighterAIsGuest ? fighterAName.trim().length > 0 : !!fighterAId;
    const bReady = fighterBIsGuest ? fighterBName.trim().length > 0 : !!fighterBId;
    if (!aReady || !bReady) return false;
    // Two registered fighters must be different.
    if (!fighterAIsGuest && !fighterBIsGuest && fighterAId === fighterBId) return false;
    return true;
  }, [fighterAId, fighterBId, fighterAIsGuest, fighterBIsGuest, fighterAName, fighterBName, phase]);

  const loadFighters = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fighter_profiles')
        .select('id, first_name, last_name, nickname, record_wins, record_losses, record_draws')
        .eq('active', true)
        .order('last_name');

      if (error) {
        toastRef.current({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      if (data) {
        setFighterProfiles(
          data.map((f) => ({
            id: f.id,
            first_name: f.first_name,
            last_name: f.last_name,
            nickname: f.nickname,
            displayName: `${f.first_name} ${f.last_name}${f.nickname ? ` "${f.nickname}"` : ''}`,
            record: `${f.record_wins || 0}-${f.record_losses || 0}-${f.record_draws || 0}`,
          }))
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectFighterA = useCallback((id: string) => {
    setFighterAIsGuest(false);
    setFighterAId(id);
    setFighterAName(fighterProfiles.find((f) => f.id === id)?.displayName || '');
  }, [fighterProfiles]);

  const selectFighterB = useCallback((id: string) => {
    setFighterBIsGuest(false);
    setFighterBId(id);
    setFighterBName(fighterProfiles.find((f) => f.id === id)?.displayName || '');
  }, [fighterProfiles]);

  const setFighterAGuest = useCallback((name: string) => {
    setFighterAIsGuest(true);
    setFighterAId(null);
    setFighterAName(name);
  }, []);

  const setFighterBGuest = useCallback((name: string) => {
    setFighterBIsGuest(true);
    setFighterBId(null);
    setFighterBName(name);
  }, []);

  const clearFighterA = useCallback(() => {
    setFighterAIsGuest(false);
    setFighterAId(null);
    setFighterAName('');
  }, []);

  const clearFighterB = useCallback(() => {
    setFighterBIsGuest(false);
    setFighterBId(null);
    setFighterBName('');
  }, []);

  const startRestPeriodInternal = useCallback(() => {
    setIsRestPeriod(true);
    setRestTimeMs(60000);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    const start = Date.now();
    // 1-second tick: display only shows whole seconds, no need for 100ms.
    restIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = 60000 - elapsed;
      if (remaining <= 0) {
        setRestTimeMs(0);
        setIsRestPeriod(false);
        if (restIntervalRef.current) clearInterval(restIntervalRef.current);
        setCurrentRound((r) => r + 1);
        setTimeMs(0);
        timeMsRef.current = 0;
        alertsFiredRef.current.clear();
        roundEndedRef.current = false;
        setPhase('ready');
        fire('rest');
        toastRef.current({ title: 'Descanso terminado', description: 'Listo para el siguiente round' });
      } else {
        setRestTimeMs(remaining);
      }
    }, 1000);
  }, [fire]);

  const timerLoop = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const totalRoundMs = roundDuration * 1000;
    const remainingMs = totalRoundMs - elapsed;

    const remainingSec = Math.floor(remainingMs / 1000);
    if (remainingSec === 60 && !alertsFiredRef.current.has('60s')) {
      alertsFiredRef.current.add('60s');
      fire('warning');
      toastRef.current({ title: '1 minuto restante' });
    }
    if (remainingSec === 30 && !alertsFiredRef.current.has('30s')) {
      alertsFiredRef.current.add('30s');
      fire('warning');
      toastRef.current({ title: '30 segundos restantes', variant: 'destructive' });
    }
    if (remainingSec === 10 && !alertsFiredRef.current.has('10s')) {
      alertsFiredRef.current.add('10s');
      fire('warning');
      toastRef.current({ title: '¡10 segundos!', variant: 'destructive' });
    }

    if (remainingMs <= 0) {
      // Natural expiry. Guard against a manual endRound landing in the same frame.
      if (roundEndedRef.current) return;
      roundEndedRef.current = true;
      setTimeMs(totalRoundMs);
      timeMsRef.current = totalRoundMs;
      setIsRunning(false);
      fire('bell', 'end');
      setRoundsCompleted((prev) => [
        ...prev,
        { roundNumber: currentRound, durationMs: totalRoundMs, knockdownsA: 0, knockdownsB: 0, warningsA: 0, warningsB: 0, scoreA: 10, scoreB: 10 },
      ]);
      if (currentRound >= roundConfig) {
        setPhase('finished');
        toastRef.current({ title: 'Pelea terminada', description: 'Todos los rounds completados.' });
      } else {
        setPhase('between_rounds');
        startRestPeriodInternal();
      }
      return;
    }

    setTimeMs(elapsed);
    timeMsRef.current = elapsed;
    animFrameRef.current = requestAnimationFrame(timerLoop);
  }, [roundDuration, currentRound, roundConfig, fire, startRestPeriodInternal]);

  useEffect(() => {
    if (!isRunning || isPaused) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    startTimeRef.current = Date.now() - timeMsRef.current;
    animFrameRef.current = requestAnimationFrame(timerLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, isPaused, timerLoop]);

  useEffect(() => () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    if (silentModeIntervalRef.current) clearInterval(silentModeIntervalRef.current);
  }, []);

  const startMatch = useCallback(() => {
    alertsFiredRef.current.clear();
    roundEndedRef.current = false;
    setPhase('ready');
    setCurrentRound(1);
    setTimeMs(0);
    timeMsRef.current = 0;
    setRoundsCompleted([]);
    setIsRunning(false);
    setIsPaused(false);
    setIsRestPeriod(false);
    setRestTimeMs(60000);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    toastRef.current({ title: 'Pelea lista', description: 'Presiona Iniciar Round cuando estés listo.' });
  }, []);

  const startRound = useCallback(() => {
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    roundEndedRef.current = false;
    setIsRunning(true);
    setIsPaused(false);
    setPhase('fighting');
    fire('bell', 'start');
  }, [fire]);

  const pauseRound = useCallback(() => {
    pausedTimeRef.current = Date.now();
    setIsPaused(true);
    setIsRunning(false);
  }, []);

  const resumeRound = useCallback(() => {
    const pauseDuration = Date.now() - pausedTimeRef.current;
    startTimeRef.current += pauseDuration;
    setIsPaused(false);
    setIsRunning(true);
  }, []);

  const endRound = useCallback(() => {
    // Guard against the rAF natural-expiry having already pushed the round.
    if (roundEndedRef.current) return;
    roundEndedRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const finalTime = timeMsRef.current;
    setRoundsCompleted((prev) => [
      ...prev,
      { roundNumber: currentRound, durationMs: finalTime, knockdownsA: 0, knockdownsB: 0, warningsA: 0, warningsB: 0, scoreA: 10, scoreB: 10 },
    ]);
    fire('bell', 'end');
    if (currentRound >= roundConfig) {
      setPhase('finished');
      toastRef.current({ title: 'Pelea terminada', description: 'Todos los rounds completados.' });
    } else {
      setPhase('between_rounds');
      startRestPeriodInternal();
    }
  }, [currentRound, roundConfig, fire, startRestPeriodInternal]);

  const resetCurrentRound = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setTimeMs(0);
    timeMsRef.current = 0;
    alertsFiredRef.current.clear();
    roundEndedRef.current = false;
    setPhase('ready');
  }, []);

  const skipRestPeriod = useCallback(() => {
    setIsRestPeriod(false);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setCurrentRound((r) => r + 1);
    setTimeMs(0);
    timeMsRef.current = 0;
    alertsFiredRef.current.clear();
    roundEndedRef.current = false;
    setPhase('ready');
  }, []);

  const finishMatch = useCallback((result: MatchResult) => {
    setMatchResult(result);
    setPhase('finished');
    setIsRunning(false);
    roundEndedRef.current = true;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
  }, []);

  const resetMatch = useCallback(() => {
    setPhase('setup');
    setFighterAId(null);
    setFighterBId(null);
    setFighterAName('');
    setFighterBName('');
    setRoundConfig(3);
    setRoundDuration(180);
    setCurrentRound(1);
    setTimeMs(0);
    timeMsRef.current = 0;
    setIsRunning(false);
    setIsPaused(false);
    setRoundsCompleted([]);
    setMatchResult(null);
    setIsRestPeriod(false);
    setRestTimeMs(60000);
    alertsFiredRef.current.clear();
    roundEndedRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    toastRef.current({ title: 'Reiniciado', description: 'Configuración eliminada.' });
  }, []);

  const setRoundScore = useCallback((roundNumber: number, partial: Partial<RoundResult>) => {
    setRoundsCompleted((prev) => prev.map((r) => r.roundNumber === roundNumber ? { ...r, ...partial } : r));
  }, []);

  // Judge already enters the post-knockdown score in the round dialog;
  // do NOT subtract knockdowns again here (would double-penalize).
  const totalScoreA = useMemo(() => roundsCompleted.reduce((s, r) => s + (r.scoreA || 0), 0), [roundsCompleted]);
  const totalScoreB = useMemo(() => roundsCompleted.reduce((s, r) => s + (r.scoreB || 0), 0), [roundsCompleted]);

  // Atomic single-RPC writer (validates auth, dedups, atomic record updates,
  // correct No-Contest handling). Falls back to legacy direct writes if the
  // RPC is unavailable (e.g. before migration deploys).
  const saveResultAtomic = useCallback(async (result: MatchResult, updateRecords: boolean) => {
    if (!fighterAId || !fighterBId) return { success: false, recordsUpdated: false, duplicate: false };
    try {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: { verdict_id?: string; records_updated?: boolean; duplicate?: boolean } | null; error: { message: string } | null }>)(
        'save_fight_result',
        {
          p_red_fighter_id: fighterAId,
          p_blue_fighter_id: fighterBId,
          p_winner_fighter_id: result.winnerId,
          p_result_type: result.resultType,
          p_round_number: result.roundNumber,
          p_round_config: roundConfig,
          p_round_duration_sec: roundDuration,
          p_rounds: roundsCompleted as unknown as Record<string, unknown>,
          p_notes: result.notes ?? null,
          p_update_records: updateRecords,
        },
      );
      if (error) {
        toastRef.current({ title: 'Error firmando veredicto', description: error.message, variant: 'destructive' });
        return { success: false, recordsUpdated: false, duplicate: false };
      }
      return {
        success: true,
        recordsUpdated: !!data?.records_updated,
        duplicate: !!data?.duplicate,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error';
      toastRef.current({ title: 'Error', description: msg, variant: 'destructive' });
      return { success: false, recordsUpdated: false, duplicate: false };
    }
  }, [fighterAId, fighterBId, roundConfig, roundDuration, roundsCompleted]);

  const insertVerdict = useCallback(async (result: MatchResult, recordsUpdated: boolean) => {
    // recordsUpdated here is advisory; the RPC computes the truthful value.
    const res = await saveResultAtomic(result, recordsUpdated);
    return { success: res.success };
  }, [saveResultAtomic]);

  const updateFighterRecords = useCallback(async (result: MatchResult) => {
    const res = await saveResultAtomic(result, true);
    if (!res.success) return { success: false, error: 'Failed to update records' };
    if (res.duplicate) {
      toastRef.current({ title: 'Veredicto ya registrado', description: 'Este resultado ya fue firmado hoy.' });
    } else if (res.recordsUpdated) {
      toastRef.current({ title: 'Récords actualizados', description: 'Veredicto firmado y sincronizado.' });
    } else {
      toastRef.current({ title: 'Veredicto firmado', description: 'Sin cambios en récords (No Contest).' });
    }
    // Refresh the in-memory fighter list so the selector reflects the new records.
    if (res.recordsUpdated) {
      await loadFighters();
    }
    return { success: true };

  }, [saveResultAtomic, loadFighters]);



  return {
    phase, fighterAId, fighterBId, fighterAName, fighterBName,
    roundConfig, roundDuration, currentRound, timeMs, isRunning, isPaused,
    restTimeMs, isRestPeriod, roundsCompleted, matchResult, fighterProfiles, isLoading,
    canStartMatch, totalScoreA, totalScoreB,
    loadFighters, selectFighterA, selectFighterB,
    setRoundConfig, setRoundDuration, setRoundScore,
    startMatch, startRound, pauseRound, resumeRound, endRound, resetCurrentRound, skipRestPeriod,
    finishMatch, resetMatch, updateFighterRecords, insertVerdict,
    alertSettings, setAlertSettings, previewAlert: fire,
    silentMode, setSilentMode, silentModeRemainingSec,
  };
}
