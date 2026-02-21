import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Official } from '@/hooks/useOfficials';

export interface EventOfficial {
  id: string;
  event_id: string;
  official_id: string;
  role: string;
  assigned_by: string | null;
  assigned_at: string;
  confirmed: boolean;
  confirmed_at: string | null;
  notes: string | null;
  official?: Official;
}

export function useEventOfficials(eventId: string | null) {
  const [eventOfficials, setEventOfficials] = useState<EventOfficial[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEventOfficials = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_officials')
        .select('*, official:officials(*)')
        .eq('event_id', eventId)
        .order('role', { ascending: true });

      if (error) throw error;
      setEventOfficials((data || []) as unknown as EventOfficial[]);
    } catch (err) {
      console.error('Error fetching event officials:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const assignOfficial = async (officialId: string, role: string): Promise<boolean> => {
    if (!eventId) return false;
    try {
      const { error } = await supabase.from('event_officials').insert({
        event_id: eventId,
        official_id: officialId,
        role,
      });
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Oficial asignado al evento' });
      await fetchEventOfficials();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al asignar oficial';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    }
  };

  const removeOfficial = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('event_officials').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Oficial removido del evento' });
      await fetchEventOfficials();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al remover oficial';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    }
  };

  const confirmOfficial = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('event_officials')
        .update({ confirmed: true, confirmed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Oficial confirmado' });
      await fetchEventOfficials();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al confirmar oficial';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    fetchEventOfficials();
  }, [fetchEventOfficials]);

  return {
    eventOfficials,
    loading,
    fetchEventOfficials,
    assignOfficial,
    removeOfficial,
    confirmOfficial,
  };
}
