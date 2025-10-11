import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Round {
  id: string;
  fight_id: string;
  number: number;
  status: 'scheduled' | 'live' | 'paused' | 'ended' | 'cancelled';
  starts_at: string | null;
  ends_at: string | null;
  duration_seconds: number;
}

interface TimerState {
  timeMs: number;
  isRunning: boolean;
  isPaused: boolean;
  isRestPeriod: boolean;
  restTimeMs: number;
}

export function useOlympicTimer(fightId: string) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [state, setState] = useState<TimerState>({
    timeMs: 0,
    isRunning: false,
    isPaused: false,
    isRestPeriod: false,
    restTimeMs: 0,
  });

  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const restIntervalRef = useRef<number>();

  // Cargar rounds
  useEffect(() => {
    const fetchRounds = async () => {
      const { data } = await supabase
        .from('fight_rounds')
        .select('*')
        .eq('fight_id', fightId)
        .order('number');

      if (data) {
        setRounds(data as Round[]);
        const live = data.find(r => r.status === 'live');
        if (live) {
          setCurrentRound(live as Round);
          // Calcular tiempo transcurrido si ya está corriendo
          if (live.starts_at) {
            const elapsed = Date.now() - new Date(live.starts_at).getTime();
            startTimeRef.current = Date.now() - elapsed;
            setState(prev => ({ ...prev, timeMs: elapsed, isRunning: true }));
          }
        }
      }
    };

    fetchRounds();

    // Suscribirse a cambios
    const channel = supabase
      .channel(`timer:${fightId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fight_rounds',
          filter: `fight_id=eq.${fightId}`,
        },
        () => {
          fetchRounds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, [fightId]);

  // Loop del cronómetro
  useEffect(() => {
    if (!state.isRunning || state.isPaused || !currentRound) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const updateTimer = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = (currentRound.duration_seconds * 1000) - elapsed;

      if (remaining <= 0) {
        // Round terminado automáticamente
        setState(prev => ({ 
          ...prev, 
          timeMs: currentRound.duration_seconds * 1000, 
          isRunning: false 
        }));
        toast.success('¡Round terminado!');
        playBellSound();
        return;
      }

      setState(prev => ({ ...prev, timeMs: elapsed }));
      
      // Alertas visuales/sonoras
      if (remaining <= 10000 && remaining > 9900) {
        toast.warning('¡10 segundos!');
      } else if (remaining <= 30000 && remaining > 29900) {
        toast.info('30 segundos restantes');
      } else if (remaining <= 60000 && remaining > 59900) {
        toast.info('1 minuto restante');
      }

      animationFrameRef.current = requestAnimationFrame(updateTimer);
    };

    animationFrameRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isRunning, state.isPaused, currentRound]);

  // Periodo de descanso
  useEffect(() => {
    if (!state.isRestPeriod) return;

    const startRestTime = Date.now();
    const restDuration = 60000; // 1 minuto

    restIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startRestTime;
      const remaining = restDuration - elapsed;

      if (remaining <= 0) {
        setState(prev => ({ ...prev, isRestPeriod: false, restTimeMs: 0 }));
        if (restIntervalRef.current) clearInterval(restIntervalRef.current);
        toast.success('Descanso terminado - Listo para siguiente round');
        playBellSound();
        return;
      }

      setState(prev => ({ ...prev, restTimeMs: remaining }));

      // Alertas de descanso
      if (remaining <= 5000 && remaining > 4900) {
        toast.warning('¡5 segundos!');
      } else if (remaining <= 10000 && remaining > 9900) {
        toast.info('10 segundos de descanso');
      } else if (remaining <= 30000 && remaining > 29900) {
        toast.info('30 segundos de descanso');
      }
    }, 100);

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, [state.isRestPeriod]);

  const playBellSound = () => {
    // Audio simple de campana (opcional)
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const startRound = useCallback(async (roundId: string) => {
    const { error } = await supabase.rpc('control_round', {
      p_round_id: roundId,
      p_action: 'start',
    });

    if (error) {
      toast.error('Error al iniciar round');
      console.error(error);
      return;
    }

    const round = rounds.find(r => r.id === roundId);
    if (round) {
      setCurrentRound(round);
      startTimeRef.current = Date.now();
      setState(prev => ({ 
        ...prev, 
        timeMs: 0, 
        isRunning: true, 
        isPaused: false,
        isRestPeriod: false 
      }));
      toast.success('Round iniciado');
      playBellSound();
    }
  }, [rounds]);

  const pauseRound = useCallback(async () => {
    if (!currentRound) return;

    pausedTimeRef.current = state.timeMs;

    const { error } = await supabase.rpc('control_round', {
      p_round_id: currentRound.id,
      p_action: 'pause',
    });

    if (error) {
      toast.error('Error al pausar');
      return;
    }

    setState(prev => ({ ...prev, isPaused: true, isRunning: false }));
    toast.info('Round pausado');
  }, [currentRound, state.timeMs]);

  const resumeRound = useCallback(async () => {
    if (!currentRound) return;

    startTimeRef.current = Date.now() - pausedTimeRef.current;

    const { error } = await supabase.rpc('control_round', {
      p_round_id: currentRound.id,
      p_action: 'resume',
    });

    if (error) {
      toast.error('Error al reanudar');
      return;
    }

    setState(prev => ({ ...prev, isPaused: false, isRunning: true }));
    toast.success('Round reanudado');
  }, [currentRound]);

  const endRound = useCallback(async () => {
    if (!currentRound) return;

    const { error } = await supabase.rpc('control_round', {
      p_round_id: currentRound.id,
      p_action: 'end',
    });

    if (error) {
      toast.error('Error al finalizar round');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isRunning: false, 
      isPaused: false,
      isRestPeriod: true,
      restTimeMs: 60000 
    }));
    toast.success('Round finalizado');
    playBellSound();
  }, [currentRound]);

  const getNextRound = useCallback(() => {
    return rounds.find(r => r.status === 'scheduled');
  }, [rounds]);

  return {
    timeMs: state.timeMs,
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    isRestPeriod: state.isRestPeriod,
    restTimeMs: state.restTimeMs,
    currentRound,
    rounds,
    nextRound: getNextRound(),
    startRound,
    pauseRound,
    resumeRound,
    endRound,
  };
}
