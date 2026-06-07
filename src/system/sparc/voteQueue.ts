/**
 * SPARC Vote Queue — IndexedDB-backed offline vote store.
 * Guarantees no vote is ever lost: tap -> DRAFT (local) -> SUBMITTED -> CONFIRMED.
 */
import { openDB, type IDBPDatabase } from 'idb';
import { supabase } from '@/integrations/supabase/client';

export type VoteChoice = 'red' | 'blue' | 'draw' | 'abstain';
export type VoteStatus = 'DRAFT' | 'SUBMITTED' | 'CONFIRMED';

export interface PendingVote {
  client_vote_id: string;
  round_id: string;
  choice: VoteChoice;
  status: VoteStatus;
  created_at: number;
  attempts: number;
}

const DB_NAME = 'sparc';
const STORE = 'votes';
let dbPromise: Promise<IDBPDatabase> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) {
          d.createObjectStore(STORE, { keyPath: 'client_vote_id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueueVote(round_id: string, choice: VoteChoice): Promise<PendingVote> {
  const vote: PendingVote = {
    client_vote_id: crypto.randomUUID(),
    round_id,
    choice,
    status: 'DRAFT',
    created_at: Date.now(),
    attempts: 0,
  };
  const d = await db();
  await d.put(STORE, vote);
  return vote;
}

export async function listPending(): Promise<PendingVote[]> {
  const d = await db();
  const all = (await d.getAll(STORE)) as PendingVote[];
  return all.filter((v) => v.status !== 'CONFIRMED');
}

export async function markStatus(client_vote_id: string, status: VoteStatus) {
  const d = await db();
  const v = (await d.get(STORE, client_vote_id)) as PendingVote | undefined;
  if (!v) return;
  v.status = status;
  await d.put(STORE, v);
}

export async function bumpAttempts(client_vote_id: string) {
  const d = await db();
  const v = (await d.get(STORE, client_vote_id)) as PendingVote | undefined;
  if (!v) return;
  v.attempts += 1;
  await d.put(STORE, v);
}

export async function getVoteForRound(round_id: string): Promise<PendingVote | null> {
  const d = await db();
  const all = (await d.getAll(STORE)) as PendingVote[];
  const match = all
    .filter((v) => v.round_id === round_id)
    .sort((a, b) => b.created_at - a.created_at);
  return match[0] ?? null;
}

/** Submit a single vote to the server. Returns true on confirmed. */
export async function submitVote(v: PendingVote): Promise<boolean> {
  try {
    await bumpAttempts(v.client_vote_id);
    await markStatus(v.client_vote_id, 'SUBMITTED');
    const { error } = await supabase.rpc('sparc_submit_vote', {
      p_round_id: v.round_id,
      p_choice: v.choice,
      p_client_vote_id: v.client_vote_id,
    });
    if (error) throw error;
    await markStatus(v.client_vote_id, 'CONFIRMED');
    return true;
  } catch (e) {
    await markStatus(v.client_vote_id, 'DRAFT');
    return false;
  }
}

/** Flush all pending votes. Called on reconnect / mount / interval. */
export async function flushQueue(): Promise<{ confirmed: number; remaining: number }> {
  const pending = await listPending();
  let confirmed = 0;
  for (const v of pending) {
    const ok = await submitVote(v);
    if (ok) confirmed += 1;
  }
  const remaining = (await listPending()).length;
  return { confirmed, remaining };
}
