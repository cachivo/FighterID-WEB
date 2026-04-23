import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type QueueEntity = 'gym' | 'fighter' | 'event';

const TABLE_BY_ENTITY: Record<QueueEntity, 'gyms' | 'fighter_profiles' | 'bdg_event'> = {
  gym: 'gyms',
  fighter: 'fighter_profiles',
  event: 'bdg_event',
};

export interface PendingGym {
  id: string;
  nombre: string;
  ciudad: string | null;
  pais: string | null;
  disciplinas: string[] | null;
  logo_url: string | null;
  email: string | null;
  telefono: string | null;
  created_at: string | null;
  submitted_by: string | null;
  moderation_status: ModerationStatus;
  moderation_notes: string | null;
}

export interface PendingFighter {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  discipline: string | null;
  weight_class: string | null;
  level: string | null;
  avatar_url: string | null;
  created_at: string | null;
  submitted_by: string | null;
  moderation_status: ModerationStatus;
  moderation_notes: string | null;
}

export interface PendingEvent {
  id: string;
  name: string;
  description: string | null;
  discipline: string;
  venue: string | null;
  city: string | null;
  country: string | null;
  start_time: string | null;
  poster_url: string | null;
  created_at: string | null;
  created_by: string | null;
  moderation_status: ModerationStatus;
  moderation_notes: string | null;
}

export function usePendingGyms() {
  return useQuery({
    queryKey: ['approval-queue', 'gyms'],
    queryFn: async (): Promise<PendingGym[]> => {
      const { data, error } = await supabase
        .from('gyms')
        .select('id, nombre, ciudad, pais, disciplinas, logo_url, email, telefono, created_at, submitted_by, moderation_status, moderation_notes')
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PendingGym[];
    },
    staleTime: 30_000,
  });
}

export function usePendingFighters() {
  return useQuery({
    queryKey: ['approval-queue', 'fighters'],
    queryFn: async (): Promise<PendingFighter[]> => {
      const { data, error } = await supabase
        .from('fighter_profiles')
        .select('id, first_name, last_name, nickname, discipline, weight_class, level, avatar_url, created_at, submitted_by, moderation_status, moderation_notes')
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PendingFighter[];
    },
    staleTime: 30_000,
  });
}

export function usePendingEvents() {
  return useQuery({
    queryKey: ['approval-queue', 'events'],
    queryFn: async (): Promise<PendingEvent[]> => {
      const { data, error } = await supabase
        .from('bdg_event')
        .select('id, name, description, discipline, venue, city, country, start_time, poster_url, created_at, created_by, moderation_status, moderation_notes')
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PendingEvent[];
    },
    staleTime: 30_000,
  });
}

export function useApprovalCounts() {
  const gyms = usePendingGyms();
  const fighters = usePendingFighters();
  const events = usePendingEvents();
  return {
    gyms: gyms.data?.length ?? 0,
    fighters: fighters.data?.length ?? 0,
    events: events.data?.length ?? 0,
    total: (gyms.data?.length ?? 0) + (fighters.data?.length ?? 0) + (events.data?.length ?? 0),
    isLoading: gyms.isLoading || fighters.isLoading || events.isLoading,
  };
}

interface ModerationParams {
  entity: QueueEntity;
  id: string;
  notes?: string;
}

export function useApproveItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entity, id, notes }: ModerationParams) => {
      const { data: userData } = await supabase.auth.getUser();
      const reviewerId = userData.user?.id;
      const table = TABLE_BY_ENTITY[entity];
      const updates: Record<string, unknown> = {
        moderation_status: 'approved',
        moderation_reviewed_by: reviewerId,
        moderation_reviewed_at: new Date().toISOString(),
        moderation_notes: notes ?? null,
      };
      // Auto-publish events when approving
      if (entity === 'event') {
        updates.published = true;
      }
      const { error } = await supabase.from(table).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      queryClient.invalidateQueries({ queryKey: ['fighters'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(`${labelOf(vars.entity)} aprobado`);
    },
    onError: (err: Error) => {
      toast.error(`Error al aprobar: ${err.message}`);
    },
  });
}

export function useRejectItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entity, id, notes }: ModerationParams) => {
      if (!notes || !notes.trim()) {
        throw new Error('Las notas son obligatorias para rechazar.');
      }
      const { data: userData } = await supabase.auth.getUser();
      const reviewerId = userData.user?.id;
      const table = TABLE_BY_ENTITY[entity];
      const { error } = await supabase
        .from(table)
        .update({
          moderation_status: 'rejected',
          moderation_reviewed_by: reviewerId,
          moderation_reviewed_at: new Date().toISOString(),
          moderation_notes: notes.trim(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
      toast.success(`${labelOf(vars.entity)} rechazado`);
    },
    onError: (err: Error) => {
      toast.error(`Error al rechazar: ${err.message}`);
    },
  });
}

function labelOf(entity: QueueEntity) {
  switch (entity) {
    case 'gym': return 'Gimnasio';
    case 'fighter': return 'Peleador';
    case 'event': return 'Evento';
  }
}

/** Realtime subscription that refreshes the queue */
export function useApprovalQueueRealtime() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('approval-queue-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gyms' }, () => {
        queryClient.invalidateQueries({ queryKey: ['approval-queue', 'gyms'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fighter_profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['approval-queue', 'fighters'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bdg_event' }, () => {
        queryClient.invalidateQueries({ queryKey: ['approval-queue', 'events'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
