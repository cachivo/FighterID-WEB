import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { FightScorecard, FightControlEvent, FightResult } from './useFightControl';

export interface FightRealtimeData {
  scorecards: FightScorecard[];
  controlEvents: FightControlEvent[];
  results: FightResult | null;
  lastUpdate: Date;
}

export function useFightRealtime(fightId: string) {
  const [realtimeData, setRealtimeData] = useState<FightRealtimeData>({
    scorecards: [],
    controlEvents: [],
    results: null,
    lastUpdate: new Date()
  });
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const handleScorecardUpdate = useCallback((payload: any) => {
    console.log('Scorecard update:', payload);
    
    setRealtimeData(prev => {
      const newScorecards = [...prev.scorecards];
      const existingIndex = newScorecards.findIndex(
        sc => sc.fight_id === payload.new.fight_id && 
              sc.judge_id === payload.new.judge_id && 
              sc.round_number === payload.new.round_number
      );

      if (existingIndex >= 0) {
        newScorecards[existingIndex] = payload.new;
      } else {
        newScorecards.push(payload.new);
      }

      return {
        ...prev,
        scorecards: newScorecards,
        lastUpdate: new Date()
      };
    });
  }, []);

  const handleControlEventUpdate = useCallback((payload: any) => {
    console.log('Control event update:', payload);
    
    setRealtimeData(prev => ({
      ...prev,
      controlEvents: [payload.new, ...prev.controlEvents],
      lastUpdate: new Date()
    }));
  }, []);

  const handleResultUpdate = useCallback((payload: any) => {
    console.log('Fight result update:', payload);
    
    setRealtimeData(prev => ({
      ...prev,
      results: payload.new,
      lastUpdate: new Date()
    }));
  }, []);

  const setupRealtimeSubscription = useCallback(() => {
    if (!fightId) return null;

    const fightChannel = supabase.channel(`fight-${fightId}`, {
      config: {
        broadcast: { self: true }
      }
    });

    // Subscribe to scorecard changes
    fightChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'fight_scorecards',
        filter: `fight_id=eq.${fightId}`
      },
      handleScorecardUpdate
    );

    // Subscribe to control event changes
    fightChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'fight_control_events',
        filter: `fight_id=eq.${fightId}`
      },
      handleControlEventUpdate
    );

    // Subscribe to fight result changes
    fightChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'fight_results',
        filter: `fight_id=eq.${fightId}`
      },
      handleResultUpdate
    );

    // Handle connection status
    fightChannel.on('system', {}, (payload) => {
      console.log('Realtime system event:', payload);
      if (payload.extension === 'postgres_changes') {
        setIsConnected(payload.status === 'ok');
      }
    });

    fightChannel.subscribe((status) => {
      console.log('Fight channel status:', status);
      setIsConnected(status === 'SUBSCRIBED');
    });

    return fightChannel;
  }, [fightId, handleScorecardUpdate, handleControlEventUpdate, handleResultUpdate]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!fightId) return;

    try {
      // Load scorecards
      const { data: scorecards } = await supabase
        .from('fight_scorecards')
        .select('*')
        .eq('fight_id', fightId)
        .order('round_number');

      // Load control events
      const { data: controlEvents } = await supabase
        .from('fight_control_events')
        .select('*')
        .eq('fight_id', fightId)
        .order('timestamp', { ascending: false });

      // Load result (may not exist until fight ends)
      const { data: results } = await supabase
        .from('fight_results')
        .select('*')
        .eq('fight_id', fightId)
        .maybeSingle();

      setRealtimeData({
        scorecards: scorecards || [],
        controlEvents: controlEvents || [],
        results: results || null,
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error('Error loading initial fight data:', error);
    }
  }, [fightId]);

  // Broadcast custom events
  const broadcastScorecardUpdate = useCallback(async (scorecard: any) => {
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'scorecard_update',
        payload: scorecard
      });
    }
  }, [channel]);

  const broadcastControlEvent = useCallback(async (controlEvent: any) => {
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'control_event',
        payload: controlEvent
      });
    }
  }, [channel]);

  // Effect to setup subscription
  useEffect(() => {
    const realtimeChannel = setupRealtimeSubscription();
    setChannel(realtimeChannel);

    // Load initial data
    loadInitialData();

    return () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
      }
    };
  }, [setupRealtimeSubscription, loadInitialData]);

  return {
    realtimeData,
    isConnected,
    broadcastScorecardUpdate,
    broadcastControlEvent,
    
    // Computed helpers
    getCurrentRound: () => {
      const startEvents = realtimeData.controlEvents.filter(
        e => e.event_type === 'ROUND_START'
      );
      return startEvents.length + 1;
    },
    
    getFightStatus: () => {
      if (realtimeData.results) return 'FINISHED';
      
      const latest = realtimeData.controlEvents[0];
      if (!latest) return 'SCHEDULED';
      
      const activeEvents = ['FIGHT_START', 'FIGHT_RESUME'];
      const pausedEvents = ['FIGHT_PAUSE', 'FIGHT_STOP'];
      
      if (activeEvents.includes(latest.event_type)) return 'ACTIVE';
      if (pausedEvents.includes(latest.event_type)) return 'PAUSED';
      
      return 'SCHEDULED';
    },
    
    getScorecardSummary: () => {
      const summary: { [judgeId: string]: { rounds: { a: number, b: number }[], total: { a: number, b: number } } } = {};
      
      realtimeData.scorecards.forEach(sc => {
        if (!summary[sc.judge_id]) {
          summary[sc.judge_id] = { rounds: [], total: { a: 0, b: 0 } };
        }
        
        summary[sc.judge_id].rounds[sc.round_number - 1] = {
          a: sc.fighter_a_score,
          b: sc.fighter_b_score
        };
        summary[sc.judge_id].total.a += sc.fighter_a_score;
        summary[sc.judge_id].total.b += sc.fighter_b_score;
      });
      
      return summary;
    }
  };
}

// Hook for broadcast/commentary team to monitor multiple fights
export function useEventRealtime(eventId: string) {
  const [eventData, setEventData] = useState<{
    fights: any[];
    lastUpdate: Date;
  }>({
    fights: [],
    lastUpdate: new Date()
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const eventChannel = supabase.channel(`event-${eventId}`);

    // Subscribe to all fight updates for this event
    eventChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'fights',
        filter: `event_id=eq.${eventId}`
      },
      (payload) => {
        console.log('Fight update in event:', payload);
        // Handle fight updates
        setEventData(prev => ({
          ...prev,
          lastUpdate: new Date()
        }));
      }
    );

    eventChannel.subscribe((status) => {
      setIsConnected(status === 'SUBSCRIBED');
    });

    return () => {
      eventChannel.unsubscribe();
    };
  }, [eventId]);

  return {
    eventData,
    isConnected
  };
}