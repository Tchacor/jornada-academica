import { describe, expect, it } from 'vitest';
import { AnxietyMeter, bandOf, RETREAT_SECONDS } from '../src/systems/anxiety';
import { carePoints, newStats, stars, tickStats } from '../src/systems/score';

describe('AnxietyMeter', () => {
  it('classifica as faixas de cor', () => {
    expect(bandOf(0)).toBe('verde');
    expect(bandOf(33)).toBe('verde');
    expect(bandOf(34)).toBe('amarelo');
    expect(bandOf(66)).toBe('amarelo');
    expect(bandOf(67)).toBe('vermelho');
  });

  it('limita o valor entre 0 e 100', () => {
    const m = new AnxietyMeter(95);
    m.add(50);
    expect(m.value).toBe(100);
    m.add(-500);
    expect(m.value).toBe(0);
  });

  it('sobe em zona de tensão e cai devagar fora dela', () => {
    const m = new AnxietyMeter(50);
    m.update(1, true);
    expect(m.value).toBeGreaterThan(50);
    const alto = m.value;
    m.update(1, false);
    expect(m.value).toBeLessThan(alto);
  });

  it('pede retirada à Zona Segura após tempo contínuo no vermelho', () => {
    const m = new AnxietyMeter(90);
    for (let i = 0; i < RETREAT_SECONDS - 1; i++) m.update(1, false);
    expect(m.needsRetreat).toBe(false);
    m.update(1.5, false);
    expect(m.needsRetreat).toBe(true);
  });

  it('zera o tempo no vermelho ao sair da faixa', () => {
    const m = new AnxietyMeter(90);
    m.update(3, false);
    m.add(-50);
    m.update(1, false);
    expect(m.redTime).toBe(0);
  });
});

describe('pontuação simbólica', () => {
  it('valoriza estratégias saudáveis', () => {
    const a = newStats();
    const b = newStats();
    tickStats(a, 'verde', 10);
    tickStats(b, 'verde', 10);
    b.healthy = 2;
    b.breaths = 1;
    expect(carePoints(b)).toBeGreaterThan(carePoints(a));
  });

  it('dá estrelas conforme o equilíbrio', () => {
    const s = newStats();
    tickStats(s, 'verde', 10);
    expect(stars(s)).toBe(3);
    const r = newStats();
    tickStats(r, 'vermelho', 10);
    expect(stars(r)).toBe(1);
  });
});
