import { supabase } from '@/integrations/supabase/client';
import { getAppUserIdFromAuth } from '@/hooks/useAppUserId';
import { getSessionEvents } from '../events/event.logger';
import {
  extractCompletedTasks,
  generateSummary,
  getNextActions,
} from '../workflow/workflow.adapter';
import { generateEmbedding } from '../rag/embedding.service';
import type { SessionContext, WorkSession, CloseSessionResult } from './session.types';

interface StartSessionInput {
  authUserId: string;
  context: SessionContext | string;
  fighterProfileId?: string | null;
  clientMeta?: Record<string, unknown>;
}

export async function startSession(input: StartSessionInput): Promise<WorkSession | null> {
  const appUserId = await getAppUserIdFromAuth(input.authUserId);

  if (!appUserId) {
    console.warn('[session.service] No app_user found for auth user:', input.authUserId);
    return null;
  }

  const meta = {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    viewport:
      typeof window !== 'undefined'
        ? { w: window.innerWidth, h: window.innerHeight }
        : null,
    route: typeof window !== 'undefined' ? window.location.pathname : null,
    ...(input.clientMeta ?? {}),
  };

  const { data, error } = await supabase
    .from('work_sessions')
    .insert({
      app_user_id: appUserId,
      fighter_profile_id: input.fighterProfileId ?? null,
      context: input.context,
      client_meta: meta,
    })
    .select('*')
    .single();

  if (error) {
    console.warn('[session.service] startSession insert error', error.message);
    return null;
  }
  return data as WorkSession;
}

/**
 * Cierra una sesión atómicamente:
 * 1. Lee eventos.
 * 2. Llama RPC close_work_session (idempotente) que crea el work_update.
 * 3. Si hay summary no vacío, dispara generación de embedding via edge function.
 *
 * Nunca lanza — devuelve null en error para no romper UX.
 */
export async function endSession(sessionId: string): Promise<CloseSessionResult | null> {
  if (!sessionId) return null;

  try {
    const events = await getSessionEvents(sessionId).catch(() => []);
    const tasks = extractCompletedTasks(events as any);
    const summary = generateSummary(tasks);

    // Determine current phase + can_advance via read-only adapter
    const { data: sess } = await supabase
      .from('work_sessions')
      .select('fighter_profile_id')
      .eq('id', sessionId)
      .maybeSingle();

    const next = await getNextActions(sess?.fighter_profile_id ?? null).catch(
      () => ({ can_advance: false, blocking: [], current_phase: null }),
    );

    const { data, error } = await supabase.rpc('close_work_session' as any, {
      p_session_id: sessionId,
      p_summary: summary,
      p_current_phase: next.current_phase,
      p_can_advance: next.can_advance,
      p_blocking_reasons: next.blocking,
    });

    if (error) {
      console.warn('[session.service] close_work_session error', error.message);
      return null;
    }

    const result = Array.isArray(data) && data[0] ? (data[0] as CloseSessionResult) : null;

    // RAG: only embed when there is meaningful content
    if (result && summary.trim().length > 0) {
      // fire-and-forget; do not await user-facing teardown
      generateEmbedding({
        source_type: 'work_update',
        source_id: result.work_update_id,
        fighter_profile_id: result.fighter_profile_id,
        content: summary,
      }).catch(() => {});
    }

    return result;
  } catch (e) {
    console.warn('[session.service] endSession exception', e);
    return null;
  }
}

export async function getOpenSessionFor(authUserId: string, context: string) {
  const appUserId = await getAppUserIdFromAuth(authUserId);
  if (!appUserId) return null;
  const { data } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('app_user_id', appUserId)
    .eq('context', context)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as WorkSession | null) ?? null;
}
