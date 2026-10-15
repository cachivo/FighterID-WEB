import { describe, expect, it } from 'vitest';
import { shouldUpdateArenaRecord, snapshotArenaRounds, parseArenaRounds } from './arenaBout';

describe('Arena bout rules', () => {
  it('official KO changes the record', () => expect(shouldUpdateArenaRecord('official', 'ko')).toBe(true));
  it('sparring KO never changes the record', () => expect(shouldUpdateArenaRecord('sparring', 'ko')).toBe(false));
  it('sparring without KO never changes the record', () => expect(shouldUpdateArenaRecord('sparring', 'draw')).toBe(false));
  it('official No Contest does not count as a draw', () => expect(shouldUpdateArenaRecord('official', 'no_contest')).toBe(false));
  it('captures a KO in the active second round', () => {
    expect(snapshotArenaRounds([{ roundNumber: 1, durationMs: 180000 }], { roundNumber: 2, durationMs: 12000 }))
      .toEqual([{ roundNumber: 1, durationMs: 180000 }, { roundNumber: 2, durationMs: 12000 }]);
  });
  it('does not add an unstarted round or duplicate a completed round', () => {
    expect(snapshotArenaRounds([{ roundNumber: 1 }], null)).toEqual([{ roundNumber: 1 }]);
    expect(snapshotArenaRounds([{ roundNumber: 1 }], { roundNumber: 1 })).toHaveLength(1);
  });
  it('reads saved rounds from mobile string JSON', () => {
    expect(parseArenaRounds('[{"roundNumber":1,"durationMs":1000}]')).toEqual([{ roundNumber: 1, durationMs: 1000 }]);
    expect(parseArenaRounds('invalid')).toEqual([]);
  });
});