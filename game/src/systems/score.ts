import type { Band } from './anxiety';

export interface RunStats {
  green: number;
  yellow: number;
  red: number;
  hits: number;
  healthy: number;
  breaths: number;
  safeVisits: number;
}

export function newStats(): RunStats {
  return { green: 0, yellow: 0, red: 0, hits: 0, healthy: 0, breaths: 0, safeVisits: 0 };
}

export function tickStats(s: RunStats, band: Band, dt: number): void {
  if (band === 'verde') s.green += dt;
  else if (band === 'amarelo') s.yellow += dt;
  else s.red += dt;
}

/** Pontuação simbólica de cuidado emocional: valoriza estratégias saudáveis, não velocidade. */
export function carePoints(s: RunStats): number {
  const raw = s.green * 4 + s.yellow * 2 + s.healthy * 25 + s.breaths * 15 + s.safeVisits * 10;
  return Math.round(raw);
}

/** 1 a 3 estrelas pelo equilíbrio emocional ao longo da fase. */
export function stars(s: RunStats): number {
  const total = s.green + s.yellow + s.red || 1;
  const calm = (s.green + s.yellow * 0.5) / total;
  if (calm >= 0.6) return 3;
  if (calm >= 0.35) return 2;
  return 1;
}
