export type ArenaBoutType = 'sparring' | 'official';

export function shouldUpdateArenaRecord(boutType: ArenaBoutType, resultType: string) {
  return boutType === 'official' && resultType !== 'no_contest';
}

export function snapshotArenaRounds<T extends { roundNumber: number }>(
  completed: T[], activeRound: T | null,
): T[] {
  return activeRound && !completed.some(r => r.roundNumber === activeRound.roundNumber)
    ? [...completed, activeRound] : [...completed];
}

export function parseArenaRounds(value: unknown): Array<{ roundNumber: number; durationMs: number; knockdownsA: number; knockdownsB: number; scoreA: number; scoreB: number }> {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.filter(r => r && typeof r.roundNumber === 'number') : [];
  } catch { return []; }
}