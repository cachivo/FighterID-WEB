/**
 * SPARC Vote IndexedDB store (v2).
 * Schema mirrors the spec: client_vote_id PK, round_id, fight_id, choice,
 * status, device_id, created_at, updated_at, attempts, next_retry_at.
 * Statuses cover the full lifecycle including terminal failure modes.
 */
import { openDB, type IDBPDatabase } from 'idb';

export type VoteChoice = 'red' | 'blue' | 'draw' | 'abstain';

export type VoteStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CONFIRMED'
  | 'LOCKED'
  | 'REJECTED_TOO_LATE'
  | 'DEVICE_REJECTED';

export const TERMINAL_STATUSES: VoteStatus[] = [
  'CONFIRMED', 'LOCKED', 'REJECTED_TOO_LATE', 'DEVICE_REJECTED',
];

export const RETRYABLE_STATUSES: VoteStatus[] = ['DRAFT', 'SUBMITTED'];

export interface VoteRow {
  client_vote_id: string;
  round_id: string;
  fight_id: string;
  choice: VoteChoice;
  status: VoteStatus;
  device_id: string;
  created_at: number;
  updated_at: number;
  attempts: number;
  next_retry_at: number; // epoch ms; 0 = retry immediately
  last_error?: string;
}

const DB_NAME = 'sparc';
const DB_VERSION = 2;
const STORE = 'votes';
let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(d, oldVersion) {
        if (!d.objectStoreNames.contains(STORE)) {
          const s = d.createObjectStore(STORE, { keyPath: 'client_vote_id' });
          s.createIndex('round_id', 'round_id', { unique: false });
          s.createIndex('fight_id', 'fight_id', { unique: false });
          s.createIndex('status', 'status', { unique: false });
        } else if (oldVersion < 2) {
          // best-effort index add for migrated stores
          try {
            const s = d.transaction(STORE, 'versionchange').objectStore(STORE);
            if (!s.indexNames.contains('round_id')) s.createIndex('round_id', 'round_id');
            if (!s.indexNames.contains('fight_id')) s.createIndex('fight_id', 'fight_id');
            if (!s.indexNames.contains('status')) s.createIndex('status', 'status');
          } catch {}
        }
      },
    });
  }
  return dbPromise;
}

export async function putVote(v: VoteRow): Promise<void> {
  const d = await getDb();
  await d.put(STORE, v);
}

export async function getVote(id: string): Promise<VoteRow | undefined> {
  const d = await getDb();
  return (await d.get(STORE, id)) as VoteRow | undefined;
}

export async function getAllVotes(): Promise<VoteRow[]> {
  const d = await getDb();
  return (await d.getAll(STORE)) as VoteRow[];
}

export async function getVotesForRound(round_id: string): Promise<VoteRow[]> {
  const all = await getAllVotes();
  return all.filter((v) => v.round_id === round_id);
}

export async function latestVoteForRound(round_id: string): Promise<VoteRow | null> {
  const list = await getVotesForRound(round_id);
  list.sort((a, b) => b.updated_at - a.updated_at);
  return list[0] ?? null;
}

export async function updateVote(id: string, patch: Partial<VoteRow>): Promise<VoteRow | null> {
  const d = await getDb();
  const cur = (await d.get(STORE, id)) as VoteRow | undefined;
  if (!cur) return null;
  const next: VoteRow = { ...cur, ...patch, updated_at: Date.now() };
  await d.put(STORE, next);
  return next;
}

export async function listRetryable(): Promise<VoteRow[]> {
  const all = await getAllVotes();
  return all.filter((v) => RETRYABLE_STATUSES.includes(v.status));
}

export async function listPendingForUi(): Promise<VoteRow[]> {
  const all = await getAllVotes();
  return all.filter((v) => v.status === 'DRAFT' || v.status === 'SUBMITTED');
}

export async function markRoundRejectedTooLate(round_id: string): Promise<number> {
  const all = await getVotesForRound(round_id);
  let n = 0;
  for (const v of all) {
    if (RETRYABLE_STATUSES.includes(v.status)) {
      await updateVote(v.client_vote_id, { status: 'REJECTED_TOO_LATE' });
      n += 1;
    }
  }
  return n;
}

export async function markRoundLocked(round_id: string): Promise<number> {
  const all = await getVotesForRound(round_id);
  let n = 0;
  for (const v of all) {
    if (v.status === 'CONFIRMED') {
      await updateVote(v.client_vote_id, { status: 'LOCKED' });
      n += 1;
    } else if (RETRYABLE_STATUSES.includes(v.status)) {
      await updateVote(v.client_vote_id, { status: 'REJECTED_TOO_LATE' });
      n += 1;
    }
  }
  return n;
}

// Backoff: 1s, 2s, 5s, 10s, 30s, ... (capped at 30s)
const BACKOFF_LADDER = [1_000, 2_000, 5_000, 10_000, 30_000];
export function backoffDelay(attempts: number): number {
  const idx = Math.min(attempts, BACKOFF_LADDER.length - 1);
  return BACKOFF_LADDER[idx];
}
