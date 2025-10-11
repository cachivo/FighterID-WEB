import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScoringEvent, Corner } from '@/lib/scoring-types';
import { calculateSimpleAggression } from '@/lib/scoring-utils';
import { toast } from 'sonner';

interface StrikeCounterState {
  strikeCount: number;
  iag: number;
  isConnected: boolean;
  currentRoundId: string | null;
}

export function useStrikeCounter(
  fightId: string,
  corner: Corner,
  judgeId: string
) {
  const [state, setState] = useState<StrikeCounterState>({
    strikeCount: 0,
    iag: 0,
    isConnected: true,
    currentRoundId: null,
  });

  const eventsRef = useRef<ScoringEvent[]>([]);
  const iagIntervalRef = useRef<number>();
  const pendingEventsRef = useRef<ScoringEvent[]>([]);

  // Obtener round actual
  useEffect(() => {
    const fetchCurrentRound = async () => {
      const { data } = await supabase
        .from('fight_rounds')
        .select('id')
        .eq('fight_id', fightId)
        .eq('status', 'live')
        .single();

      if (data) {
        setState(prev => ({ ...prev, currentRoundId: data.id }));
      }
    };

    fetchCurrentRound();

    // Suscribirse a cambios en rounds
    const channel = supabase
      .channel(`rounds:${fightId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fight_rounds',
          filter: `fight_id=eq.${fightId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).status === 'live') {
            setState(prev => ({ ...prev, currentRoundId: (payload.new as any).id }));
            // Reset contador al iniciar nuevo round
            eventsRef.current = [];
            setState(prev => ({ ...prev, strikeCount: 0, iag: 0 }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fightId]);

  // Cargar eventos existentes del round actual
  useEffect(() => {
    if (!state.currentRoundId) return;

    const loadEvents = async () => {
      const { data } = await supabase
        .from('scoring_events')
        .select('*')
        .eq('fight_id', fightId)
        .eq('round_id', state.currentRoundId)
        .eq('corner', corner)
        .order('timestamp_ms', { ascending: true });

      if (data) {
        eventsRef.current = data as ScoringEvent[];
        setState(prev => ({ ...prev, strikeCount: data.length }));
      }
    };

    loadEvents();
  }, [state.currentRoundId, fightId, corner]);

  // Calcular IAg en tiempo real cada 100ms
  useEffect(() => {
    iagIntervalRef.current = window.setInterval(() => {
      const nowMs = Date.now();
      const currentIag = calculateSimpleAggression(eventsRef.current, nowMs, 10000, corner);
      setState(prev => ({ ...prev, iag: currentIag }));
    }, 100);

    return () => {
      if (iagIntervalRef.current) {
        clearInterval(iagIntervalRef.current);
      }
    };
  }, [corner]);

  // Sincronizar eventos pendientes cuando se recupera conexión
  useEffect(() => {
    const syncPendingEvents = async () => {
      if (state.isConnected && pendingEventsRef.current.length > 0) {
        console.log('Sincronizando eventos pendientes:', pendingEventsRef.current.length);
        
        for (const event of pendingEventsRef.current) {
          try {
            await supabase.from('scoring_events').insert([event] as any);
          } catch (error) {
            console.error('Error sincronizando evento:', error);
          }
        }
        
        pendingEventsRef.current = [];
        toast.success('Eventos sincronizados');
      }
    };

    syncPendingEvents();
  }, [state.isConnected]);

  // Registrar strike
  const registerStrike = useCallback(async () => {
    if (!state.currentRoundId) {
      toast.error('No hay un round activo');
      return;
    }

    const event: any = {
      fight_id: fightId,
      round_id: state.currentRoundId,
      timestamp_ms: Date.now(),
      judge_id: judgeId,
      corner,
      type: 'punch',
    };

    // Agregar localmente de inmediato
    eventsRef.current.push(event);
    setState(prev => ({ ...prev, strikeCount: prev.strikeCount + 1 }));

    // Intentar guardar en DB
    try {
      const { error } = await supabase.from('scoring_events').insert([event] as any);
      
      if (error) {
        console.error('Error guardando strike:', error);
        pendingEventsRef.current.push(event);
        setState(prev => ({ ...prev, isConnected: false }));
        toast.error('Sin conexión - guardando localmente');
      } else {
        setState(prev => ({ ...prev, isConnected: true }));
      }
    } catch (error) {
      console.error('Error de red:', error);
      pendingEventsRef.current.push(event);
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, [state.currentRoundId, fightId, judgeId, corner]);

  return {
    strikeCount: state.strikeCount,
    iag: state.iag,
    registerStrike,
    isConnected: state.isConnected,
    currentRoundId: state.currentRoundId,
  };
}
