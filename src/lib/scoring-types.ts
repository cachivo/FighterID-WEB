// Tipos para Sistema de Scoring en Vivo
export type StrikeType = 'strike' | 'punch' | 'kick' | 'elbow' | 'knee' | 'takedown' | 'knockdown' | 'defense' | 'foul';
export type Corner = 'red' | 'blue';
export type StrikeTarget = 'head' | 'body' | 'leg' | null;

export interface StationSession {
  stationNumber: number;
  judgeId: string;
  judgeName: string;
  fightId: string;
  fighterId: string;
  fighterName: string;
  corner: Corner;
  stationIp?: string;
  loginAt: string;
}

export interface ScoringEvent {
  id?: number;
  fight_id: string;
  round_id: string;
  timestamp_ms: number;
  judge_id: string;
  corner: Corner;
  type: StrikeType;
  target?: StrikeTarget;
  power?: number;
  created_at?: string;
}

export interface Round {
  id: string;
  fight_id: string;
  number: number;
  starts_at?: string;
  ends_at?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  duration_seconds: number;
}

export interface FightJudge {
  id: string;
  fight_id: string;
  judge_id: string;
  role: 'scorer' | 'referee' | 'supervisor';
  station_number?: number;
  station_ip?: string;
  confirmed: boolean;
}

export interface ScoringWeights {
  punch_weight: number;
  kick_weight: number;
  defense_weight: number;
  head_multiplier: number;
  body_multiplier: number;
}
