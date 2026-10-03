export type Band = 'verde' | 'amarelo' | 'vermelho';

export const LIMITS = { verde: 33, amarelo: 66 } as const;
export const RETREAT_SECONDS = 5;

export function bandOf(value: number): Band {
  if (value <= LIMITS.verde) return 'verde';
  if (value <= LIMITS.amarelo) return 'amarelo';
  return 'vermelho';
}

/** Medidor de ansiedade (0–100). Lógica pura, sem dependência do Phaser. */
export class AnxietyMeter {
  value: number;
  redTime = 0;

  constructor(start = 25) {
    this.value = clamp(start);
  }

  get band(): Band {
    return bandOf(this.value);
  }

  add(delta: number): void {
    this.value = clamp(this.value + delta);
  }

  /**
   * @param dt segundos
   * @param stress true quando o jogador está numa zona de tensão
   * @param baseline valor para o qual a ansiedade tende a voltar sozinha
   */
  update(dt: number, stress: boolean, baseline = 22): void {
    if (stress) this.add(2.4 * dt);
    else if (this.value > baseline) this.add(-0.6 * dt);
    this.redTime = this.band === 'vermelho' ? this.redTime + dt : 0;
  }

  /** O jogo conduz o jogador à Zona Segura quando fica tempo demais no vermelho. */
  get needsRetreat(): boolean {
    return this.redTime >= RETREAT_SECONDS;
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}
