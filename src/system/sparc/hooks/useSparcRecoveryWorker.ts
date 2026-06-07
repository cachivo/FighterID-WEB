/**
 * SPARC Recovery Worker — drains the offline vote queue.
 * - Runs on reconnect.
 * - Polls every 15s while queue is non-empty.
 * - Respects per-vote backoff (1s, 2s, 5s, 10s, 30s).
 * - Never retries terminal statuses (CONFIRMED, LOCKED, REJECTED_TOO_LATE, DEVICE_REJECTED).
 */
import { useEffect, useRef, useState } from 'react';
import { flushQueue, listPending } from '../voteQueue';

const POLL_MS = 15_000;

export function useSparcRecoveryWorker(enabled: boolean) {
  const [pendingCount, setPendingCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  const refresh = async () => setPendingCount((await listPending()).length);

  const run = async () => {
    if (running.current) return;
    if (!navigator.onLine) { await refresh(); return; }
    running.current = true;
    setBusy(true);
    try {
      await flushQueue();
    } finally {
      running.current = false;
      setBusy(false);
      await refresh();
    }
  };

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const iv = window.setInterval(() => {
      listPending().then((p) => { if (p.length > 0) run(); });
    }, POLL_MS);
    const onOnline = () => run();
    window.addEventListener('online', onOnline);
    // First-pass flush on mount in case we booted with pending votes
    run();
    return () => {
      clearInterval(iv);
      window.removeEventListener('online', onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { pendingCount, busy, flushNow: run, refresh };
}
