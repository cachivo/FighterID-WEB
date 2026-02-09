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
  published: boolean;
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
  fighter_a_external_id?: string;
  fighter_b_external_id?: string;
  fighter_a_event_image_url?: string;
  fighter_b_event_image_url?: string;
  weight_class: string;
  card_position?: string;
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
  fighter_a_external?: any;
  fighter_b_external?: any;
}

export function useEvents() {
  const [events, setEvents] = useState<BdgEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchEvents = async () => {
    try {
      console.log('[EVENTS] Fetching events...');
      setLoading(true);
      const { data, error } = await supabase
        .from('bdg_event')
        .select('*')
        .order('start_time', { ascending: true });

      console.log('[EVENTS] Query result:', { data, error, count: data?.length });
      
      if (error) throw error;
      setEvents(data || []);
      console.log('[EVENTS] Events state updated with', data?.length, 'events');
    } catch (err) {
      console.error('[EVENTS] Error fetching:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      console.log('[EVENTS] Loading set to false');
    }
  };

  const createEvent = async (eventData: {
    name: string;
    description?: string;
    discipline: string;
    venue?: string;
    start_time?: string;
    end_time?: string;
    meta?: any;
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
        created_by: user.id,
        meta: eventData.meta || null
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

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel('bdg_event_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bdg_event'
        },
        (payload) => {
          console.log('[EVENTS] Realtime change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newEvent = payload.new as BdgEvent;
            // Verificar si el evento es visible para el usuario actual
            if (newEvent.published || newEvent.created_by === user?.id) {
              setEvents(prev => [...prev, newEvent].sort((a, b) => 
                new Date(a.start_time || 0).getTime() - new Date(b.start_time || 0).getTime()
              ));
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedEvent = payload.new as BdgEvent;
            setEvents(prev => {
              // Si el evento ya está en la lista, actualizarlo
              const exists = prev.some(e => e.id === updatedEvent.id);
              if (exists) {
                return prev.map(event => 
                  event.id === updatedEvent.id ? updatedEvent : event
                );
              }
              // Si no está y ahora es visible, agregarlo
              if (updatedEvent.published || updatedEvent.created_by === user?.id) {
                return [...prev, updatedEvent].sort((a, b) => 
                  new Date(a.start_time || 0).getTime() - new Date(b.start_time || 0).getTime()
                );
              }
              return prev;
            });
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(event => event.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('bdg_event')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      await fetchEvents();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  const togglePublishEvent = async (eventId: string, shouldPublish: boolean) => {
    try {
      const { error } = await supabase
        .from('bdg_event')
        .update({ published: shouldPublish })
        .eq('id', eventId);

      if (error) throw error;
      await fetchEvents();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  const updateEventMeta = async (eventId: string, meta: any) => {
    try {
      const { error } = await supabase
        .from('bdg_event')
        .update({ meta })
        .eq('id', eventId);

      if (error) throw error;
      await fetchEvents();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<BdgEvent>) => {
    try {
      const { error } = await supabase
        .from('bdg_event')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;
      await fetchEvents();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    updateEventState,
    updateEventMeta,
    togglePublishEvent,
    deleteEvent,
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
          fighter_b:fighter_profiles!fights_fighter_b_id_fkey(*),
          fighter_a_external:external_fighters!fights_fighter_a_external_id_fkey(*),
          fighter_b_external:external_fighters!fights_fighter_b_external_id_fkey(*)
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