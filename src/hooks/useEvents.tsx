import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BdgEvent {
  id: string;
  name: string;
  description?: string;
  discipline: string;
  venue?: string;
  state: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  meta: any;
}

export interface Fight {
  id: string;
  event_id: string;
  fight_number: number;
  fight_type: string;
  fighter_a_id: string;
  fighter_b_id: string;
  weight_class: string;
  scheduled_time?: string;
  status: string;
  winner_id?: string;
  finish_method?: string;
  finish_round?: number;
  finish_time?: string;
  created_at: string;
  updated_at: string;
  fighter_a?: any;
  fighter_b?: any;
}

export function useEvents() {
  const [events, setEvents] = useState<BdgEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bdg_event')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: {
    name: string;
    description?: string;
    discipline: string;
    venue?: string;
    start_time?: string;
    end_time?: string;
  }) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      // Prepare data with proper timestamp handling
      const insertData = {
        name: eventData.name,
        description: eventData.description || null,
        discipline: eventData.discipline,
        venue: eventData.venue || null,
        start_time: eventData.start_time ? new Date(eventData.start_time).toISOString() : null,
        end_time: eventData.end_time ? new Date(eventData.end_time).toISOString() : null,
        created_by: user.id // Use auth.uid() directly for RLS policy
      };

      const { data, error } = await supabase
        .from('bdg_event')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      await fetchEvents();
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  const updateEventState = async (eventId: string, state: string) => {
    try {
      const { error } = await supabase
        .from('bdg_event')
        .update({ state })
        .eq('id', eventId);

      if (error) throw error;
      await fetchEvents();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEventState,
    refreshEvents: fetchEvents
  };
}

export function useFights(eventId?: string) {
  const [fights, setFights] = useState<Fight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFights = async () => {
    try {
      setLoading(true);
      console.log('useFights - Fetching fights for eventId:', eventId);
      
      let query = supabase
        .from('fights')
        .select(`
          *,
          fighter_a:fighter_profiles!fights_fighter_a_id_fkey(*),
          fighter_b:fighter_profiles!fights_fighter_b_id_fkey(*)
        `)
        .order('fight_number', { ascending: true });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      console.log('useFights - About to execute query');
      const { data, error } = await query;

      console.log('useFights - Query result:', { data, error, eventId });

      if (error) throw error;
      setFights(data || []);
      setError(null);
    } catch (err) {
      console.error('useFights - Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const createFight = async (fightData: {
    event_id: string;
    fight_number: number;
    fight_type: string;
    fighter_a_id: string;
    fighter_b_id: string;
    weight_class: string;
    scheduled_time?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('fights')
        .insert(fightData)
        .select()
        .single();

      if (error) throw error;
      
      await fetchFights();
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  useEffect(() => {
    fetchFights();
  }, [eventId]);

  return {
    fights,
    loading,
    error,
    createFight,
    refreshFights: fetchFights
  };
}