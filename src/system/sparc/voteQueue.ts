/**
 * SPARC Vote Queue — public API on top of the IndexedDB store.
 * Submits votes through sparc_submit_vote with device_id binding,
 * interprets the server response, and transitions local state.
 */
import { supabase } from '@/integrations/supabase/client';
import {
  putVote, updateVote, getVote, getAllVotes, latestVoteForRound,
  listRetryable, listPendingForUi, backoffDelay, TERMINAL_STATUSES,
  type VoteChoice, type VoteStatus, type VoteRow,
} from './storage/voteDb';

export type { VoteChoice, VoteStatus, VoteRow };
// Back-compat alias used by older callers
export type PendingVote = VoteRow;

export async function enqueueVote(
  round_id: string,
  fight_id: string,
  choice: VoteChoice,
  device_id: string,
): Promise<VoteRow> {
  const now = Date.now();
  const row: VoteRow = {
    client_vote_id: crypto.randomUUID(),
    round_id,
    fight_id,
    choice,
    status: 'DRAFT',
    device_id,
    created_at: now,
    updated_at: now,
    attempts: 0,
    next_retry_at: 0,
  };
  await putVote(row);
  return row;
}

export async function listPending(): Promise<VoteRow[]> {
  return listPendingForUi();
}

export async function getVoteForRound(round_id: string): Promise<VoteRow | null> {
  return latestVoteForRound(round_id);
}

function classifyServerResult(res: any): VoteStatus | null {
  if (!res) return null;
  const s = String(res.status ?? res.result ?? '').toUpperCase();
  if (!s) return null;
  if (s === 'CONFIRMED' || s === 'OK' || s === 'ACCEPTED' || s === 'COUNTED') return 'CONFIRMED';
  if (s === 'LOCKED') return 'LOCKED';
  if (s === 'TOO_LATE' || s === 'REJECTED_TOO_LATE' || s === 'VOTING_CLOSED' || s === 'WINDOW_CLOSED') return 'REJECTED_TOO_LATE';
  if (s === 'DEVICE_REJECTED' || s === 'DEVICE_MISMATCH' || s === 'DEVICE_TRANSFERRED' || s === 'REVOKED') return 'DEVICE_REJECTED';
  return null;
}

function classifyError(err: any): VoteStatus | null {
  const msg = String(err?.message ?? err ?? '').toLowerCase();
  if (msg.includes('voting_closed') || msg.includes('too_late') || msg.includes('window')) return 'REJECTED_TOO_LATE';
  if (msg.includes('device_mismatch') || msg.includes('device_transferred') || msg.includes('device_rejected')) return 'DEVICE_REJECTED';
  return null;
}

/** Submit a single vote. Returns the resulting status (terminal or retryable). */
export async function submitVote(v: VoteRow): Promise<VoteStatus> {
  await updateVote(v.client_vote_id, {
    status: 'SUBMITTED',
    attempts: v.attempts + 1,
  });
  try {
    const { data, error } = await supabase.rpc('sparc_submit_vote', {
      p_round_id: v.round_id,
      p_choice: v.choice,
      p_client_vote_id: v.client_vote_id,
      p_device_id: v.device_id,
    });
    if (error) throw error;
    const terminal = classifyServerResult(data) ?? 'CONFIRMED';
    await updateVote(v.client_vote_id, { status: terminal });
    return terminal;
  } catch (e: any) {
    const terminal = classifyError(e);
    if (terminal) {
      await updateVote(v.client_vote_id, { status: terminal, last_error: String(e?.message ?? e) });
      return terminal;
    }
    // transient — bump backoff and stay retryable
    const attempts = (v.attempts + 1);
    await updateVote(v.client_vote_id, {
      status: 'DRAFT',
      next_retry_at: Date.now() + backoffDelay(attempts),
      last_error: String(e?.message ?? e),
    });
    return 'DRAFT';
  }
}

export interface FlushResult {
  attempted: number;
  confirmed: number;
  locked: number;
  rejected_too_late: number;
  device_rejected: number;
  remaining: number;
}

export async function flushQueue(): Promise<FlushResult> {
  const list = await listRetryable();
  const now = Date.now();
  const r: FlushResult = {
    attempted: 0, confirmed: 0, locked: 0,
    rejected_too_late: 0, device_rejected: 0, remaining: 0,
  };
  for (const v of list) {
    if (v.next_retry_at > now) continue;
    r.attempted += 1;
    const s = await submitVote(v);
    if (s === 'CONFIRMED') r.confirmed += 1;
    else if (s === 'LOCKED') r.locked += 1;
    else if (s === 'REJECTED_TOO_LATE') r.rejected_too_late += 1;
    else if (s === 'DEVICE_REJECTED') r.device_rejected += 1;
  }
  r.remaining = (await listRetryable()).length;
  return r;
}

export async function dumpAll(): Promise<VoteRow[]> { return getAllVotes(); }
export { getVote, TERMINAL_STATUSES };
