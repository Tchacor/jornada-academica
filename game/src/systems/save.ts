export interface SaveData {
  character: number; // índice 0..2
  name: string;
  muted: boolean;
  volume: number; // 0..1
  unlocked: number; // quantidade de fases liberadas (1..4)
  best: Record<string, number>;
}

const KEY = 'jornada-academica:v1';

const DEFAULTS: SaveData = {
  character: 0,
  name: '',
  muted: false,
  volume: 0.7,
  unlocked: 1,
  best: {},
};

let cache: SaveData | null = null;

export function loadSave(): SaveData {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache!;
}

export function writeSave(patch: Partial<SaveData>): SaveData {
  cache = { ...loadSave(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* armazenamento indisponível: segue sem persistir */
  }
  return cache;
}

export function resetSave(): void {
  cache = { ...DEFAULTS };
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
