import type { ScoringEvent, ScoringWeights } from './scoring-types';

/**
 * Calcula el puntaje de un evento individual según los pesos configurados
 */
export function scoreEvent(event: ScoringEvent, weights: ScoringWeights): number {
  const baseWeights: Record<string, number> = {
    punch: weights.punch_weight,
    kick: weights.kick_weight ?? 1.3,
    defense: weights.defense_weight,
  };

  const base = baseWeights[event.type] || 1.0;
  
  const targetMultiplier = event.target 
    ? {
        head: weights.head_multiplier,
        body: weights.body_multiplier,
        leg: 1.0
      }[event.target]
    : 1.0;

  return base * targetMultiplier;
}

/**
 * Calcula agresividad simplificada (solo cuenta strikes) en ventana temporal
 */
export function calculateSimpleAggression(
  events: ScoringEvent[],
  nowMs: number,
  windowMs: number = 10000,
  corner: 'red' | 'blue'
): number {
  const fromMs = nowMs - windowMs;
  return events.filter(
    e => e.corner === corner && 
         e.timestamp_ms >= fromMs && 
         e.timestamp_ms <= nowMs
  ).length;
}

/**
 * Calcula el Índice de Agresividad (IAg) en una ventana temporal
 * @param events - Todos los eventos del round
 * @param nowMs - Timestamp actual en milisegundos
 * @param windowMs - Ventana de tiempo en milisegundos (default: 10000 = 10 segundos)
 * @param corner - Esquina a calcular ('red' o 'blue')
 * @param weights - Pesos configurables
 */
export function calculateAggression(
  events: ScoringEvent[],
  nowMs: number,
  windowMs: number = 10000,
  corner: 'red' | 'blue',
  weights: ScoringWeights
): number {
  const fromMs = nowMs - windowMs;
  
  return events
    .filter(e => e.corner === corner && e.timestamp_ms >= fromMs && e.timestamp_ms <= nowMs)
    .reduce((sum, e) => sum + scoreEvent(e, weights), 0);
}

/**
 * Formatea el tiempo en formato MM:SS
 */
export function formatRoundTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calcula estadísticas agregadas por esquina
 */
export function calculateCornerStats(events: ScoringEvent[], corner: 'red' | 'blue') {
  const cornerEvents = events.filter(e => e.corner === corner);
  
  return {
    totalStrikes: cornerEvents.filter(e => e.type !== 'defense' && e.type !== 'foul').length,
    punches: cornerEvents.filter(e => e.type === 'punch').length,
    kicks: cornerEvents.filter(e => e.type === 'kick').length,
    defenses: cornerEvents.filter(e => e.type === 'defense').length,
    knockdowns: cornerEvents.filter(e => e.type === 'knockdown').length,
    fouls: cornerEvents.filter(e => e.type === 'foul').length,
    headStrikes: cornerEvents.filter(e => e.target === 'head').length,
    bodyStrikes: cornerEvents.filter(e => e.target === 'body').length,
    legStrikes: cornerEvents.filter(e => e.target === 'leg').length,
  };
}
