import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  type AlertSettings, loadAlertSettings, saveAlertSettings, playAlert,
} from '@/lib/timeMasterAlerts';
import type { AlertKind } from '@/lib/timeMasterAlerts';

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

// Alert playback is handled by src/lib/timeMasterAlerts.ts

export function useTimeMaster() {
  const { toast } = useToast();

  const [phase, setPhase] = useState<MatchPhase>('setup');
  const [fighterAId, setFighterAId] = useState<string | null>(null);
  const [fighterBId, setFighterBId] = useState<string | null>(null);
  const [fighterAName, setFighterAName] = useState('');
  const [fighterBName, setFighterBName] = useState('');
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

  useEffect(() => { timeMsRef.current = timeMs; }, [timeMs]);
  useEffect(() => { alertSettingsRef.current = alertSettings; }, [alertSettings]);
  useEffect(() => { silentModeRef.current = silentMode; }, [silentMode]);

  const setAlertSettings = useCallback((s: AlertSettings) => {
    setAlertSettingsState(s);
    saveAlertSettings(s);
  }, []);

  const fire = useCallback((kind: AlertKind) => {
    const base = alertSettingsRef.current;
    if (silentModeRef.current) {
      const muted: AlertSettings = {
        bell:    { ...base.bell,    sound: false },
        warning: { ...base.warning, sound: false },
        rest:    { ...base.rest,    sound: false },
      };
      playAlert(kind, muted);
    } else {
      playAlert(kind, base);
    }
  }, []);

  const canStartMatch = useMemo(
    () => !!fighterAId && !!fighterBId && fighterAId !== fighterBId && phase === 'setup',
    [fighterAId, fighterBId, phase]
  );

  const loadFighters = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fighter_profiles')
        .select('id, first_name, last_name, nickname, record_wins, record_losses, record_draws')
        .eq('active', true)
        .order('last_name');

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
  }, [toast]);

  const selectFighterA = useCallback((id: string) => {
    setFighterAId(id);
    setFighterAName(fighterProfiles.find((f) => f.id === id)?.displayName || '');
  }, [fighterProfiles]);

  const selectFighterB = useCallback((id: string) => {
    setFighterBId(id);
    setFighterBName(fighterProfiles.find((f) => f.id === id)?.displayName || '');
  }, [fighterProfiles]);

  const startRestPeriodInternal = useCallback(() => {
    setIsRestPeriod(true);
    setRestTimeMs(60000);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    const start = Date.now();
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
        setPhase('ready');
        fire('rest');
        toast({ title: 'Descanso terminado', description: 'Listo para el siguiente round' });
      } else {
        setRestTimeMs(remaining);
      }
    }, 100);
  }, [toast]);

  const timerLoop = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const totalRoundMs = roundDuration * 1000;
    const remainingMs = totalRoundMs - elapsed;

    const remainingSec = Math.floor(remainingMs / 1000);
    if (remainingSec === 60 && !alertsFiredRef.current.has('60s')) {
      alertsFiredRef.current.add('60s');
      fire('warning');
      toast({ title: '1 minuto restante' });
    }
    if (remainingSec === 30 && !alertsFiredRef.current.has('30s')) {
      alertsFiredRef.current.add('30s');
      fire('warning');
      toast({ title: '30 segundos restantes', variant: 'destructive' });
    }
    if (remainingSec === 10 && !alertsFiredRef.current.has('10s')) {
      alertsFiredRef.current.add('10s');
      fire('warning');
      toast({ title: '¡10 segundos!', variant: 'destructive' });
    }

    if (remainingMs <= 0) {
      setTimeMs(totalRoundMs);
      timeMsRef.current = totalRoundMs;
      setIsRunning(false);
      fire('bell');
      setRoundsCompleted((prev) => [
        ...prev,
        { roundNumber: currentRound, durationMs: totalRoundMs, knockdownsA: 0, knockdownsB: 0, warningsA: 0, warningsB: 0 },
      ]);
      if (currentRound >= roundConfig) {
        setPhase('finished');
        toast({ title: 'Pelea terminada', description: 'Todos los rounds completados.' });
      } else {
        setPhase('between_rounds');
        startRestPeriodInternal();
      }
      return;
    }

    setTimeMs(elapsed);
    timeMsRef.current = elapsed;
    animFrameRef.current = requestAnimationFrame(timerLoop);
  }, [roundDuration, currentRound, roundConfig, toast, startRestPeriodInternal]);

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
  }, []);

  const startMatch = useCallback(() => {
    alertsFiredRef.current.clear();
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
    toast({ title: 'Pelea lista', description: 'Presiona Iniciar Round cuando estés listo.' });
  }, [toast]);

  const startRound = useCallback(() => {
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    setIsRunning(true);
    setIsPaused(false);
    setPhase('fighting');
    fire('bell');
  }, []);

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
    setIsRunning(false);
    setIsPaused(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const finalTime = timeMsRef.current;
    setRoundsCompleted((prev) => [
      ...prev,
      { roundNumber: currentRound, durationMs: finalTime, knockdownsA: 0, knockdownsB: 0, warningsA: 0, warningsB: 0 },
    ]);
    fire('bell');
    if (currentRound >= roundConfig) {
      setPhase('finished');
      toast({ title: 'Pelea terminada', description: 'Todos los rounds completados.' });
    } else {
      setPhase('between_rounds');
      startRestPeriodInternal();
    }
  }, [currentRound, roundConfig, toast, startRestPeriodInternal]);

  const resetCurrentRound = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setTimeMs(0);
    timeMsRef.current = 0;
    alertsFiredRef.current.clear();
    setPhase('ready');
  }, []);

  const skipRestPeriod = useCallback(() => {
    setIsRestPeriod(false);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setCurrentRound((r) => r + 1);
    setTimeMs(0);
    timeMsRef.current = 0;
    alertsFiredRef.current.clear();
    setPhase('ready');
  }, []);

  const finishMatch = useCallback((result: MatchResult) => {
    setMatchResult(result);
    setPhase('finished');
    setIsRunning(false);
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
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    toast({ title: 'Reiniciado', description: 'Configuración eliminada.' });
  }, [toast]);

  const updateFighterRecords = useCallback(async (result: MatchResult) => {
    try {
      if (result.resultType === 'draw' || result.resultType === 'no_contest') {
        const updates: Promise<unknown>[] = [];
        if (fighterAId) {
          const { data } = await supabase.from('fighter_profiles').select('record_draws').eq('id', fighterAId).single();
          updates.push(Promise.resolve(supabase.from('fighter_profiles').update({ record_draws: (data?.record_draws || 0) + 1 }).eq('id', fighterAId)));
        }
        if (fighterBId) {
          const { data } = await supabase.from('fighter_profiles').select('record_draws').eq('id', fighterBId).single();
          updates.push(Promise.resolve(supabase.from('fighter_profiles').update({ record_draws: (data?.record_draws || 0) + 1 }).eq('id', fighterBId)));
        }
        await Promise.all(updates);
      } else if (result.winnerId) {
        const loserId = result.winnerId === fighterAId ? fighterBId : fighterAId;
        const { data: winnerData } = await supabase.from('fighter_profiles').select('record_wins').eq('id', result.winnerId).single();
        await supabase.from('fighter_profiles').update({ record_wins: (winnerData?.record_wins || 0) + 1 }).eq('id', result.winnerId);
        if (loserId) {
          const { data: loserData } = await supabase.from('fighter_profiles').select('record_losses').eq('id', loserId).single();
          await supabase.from('fighter_profiles').update({ record_losses: (loserData?.record_losses || 0) + 1 }).eq('id', loserId);
        }
      }
      toast({ title: 'Récords actualizados', description: 'Sincronización exitosa.' });
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update records';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return { success: false, error: msg };
    }
  }, [fighterAId, fighterBId, toast]);

  return {
    phase, fighterAId, fighterBId, fighterAName, fighterBName,
    roundConfig, roundDuration, currentRound, timeMs, isRunning, isPaused,
    restTimeMs, isRestPeriod, roundsCompleted, matchResult, fighterProfiles, isLoading,
    canStartMatch,
    loadFighters, selectFighterA, selectFighterB,
    setRoundConfig, setRoundDuration,
    startMatch, startRound, pauseRound, resumeRound, endRound, resetCurrentRound, skipRestPeriod,
    finishMatch, resetMatch, updateFighterRecords,
    alertSettings, setAlertSettings, previewAlert: fire,
    silentMode, setSilentMode,
  };
}
