/** Toda a arte SVG vai embutida no bundle (texto) e é rasterizada em tempo de execução,
 *  sem requisições de rede: funciona em qualquer hospedagem, inclusive em página única. */
const raw = import.meta.glob('../public/assets/**/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export interface AssetSpec {
  key: string;
  file: string; // caminho relativo a public/assets
  scale?: number; // multiplicador sobre o tamanho intrínseco do SVG (padrão 1)
}

const chars: AssetSpec[] = [1, 2, 3].flatMap((n) => [
  { key: `char-${n}`, file: `characters/personagem-${n}.svg`, scale: 2 },
  { key: `char-${n}-andar`, file: `characters/personagem-${n}-andar.svg`, scale: 2 },
]);

export const ASSETS: AssetSpec[] = [
  { key: 'bg-fase1', file: 'backgrounds/fase1.svg' },
  { key: 'bg-fase2', file: 'backgrounds/fase2.svg' },
  { key: 'bg-fase3', file: 'backgrounds/fase3.svg' },
  { key: 'bg-fase4', file: 'backgrounds/fase4.svg' },
  { key: 'bg-zona', file: 'backgrounds/zona-segura.svg' },
  ...chars,
  ...['colega', 'professor', 'orientadora'].map((n) => ({ key: `npc-${n}`, file: `characters/npc-${n}.svg`, scale: 2 })),
  { key: 'logo', file: 'ui/logo.svg', scale: 2 },
  ...['pulmao', 'pulo', 'pause', 'seta-esq', 'seta-dir', 'som', 'som-mudo', 'interagir', 'editar', 'pulmao-claro', 'pulmao-verde', 'pulmao-amarelo', 'pulmao-vermelho'].map((n) => ({
    key: `ic-${n}`,
    file: `ui/icon-${n}.svg`,
    scale: 2,
  })),
  { key: 'nuvem1', file: 'props/nuvem-pensamento.svg', scale: 2 },
  { key: 'nuvem2', file: 'props/nuvem-pensamento-2.svg', scale: 2 },
  { key: 'estrela', file: 'props/estrela-calma.svg', scale: 2 },
  { key: 'placa-iniciar', file: 'props/placa-iniciar.svg', scale: 2 },
];

function svgText(file: string): string | undefined {
  return raw[`../public/assets/${file}`];
}

function intrinsicSize(svg: string): { w: number; h: number } {
  const vb = svg.match(/viewBox="([\d.\s-]+)"/);
  if (vb) {
    const p = vb[1].trim().split(/\s+/).map(Number);
    if (p.length === 4 && p[2] > 0 && p[3] > 0) return { w: p[2], h: p[3] };
  }
  return { w: 256, h: 256 };
}

/** Rasteriza um SVG num canvas no tamanho pedido (vetor nítido, qualquer resolução). */
export function rasterize(spec: AssetSpec): Promise<HTMLCanvasElement | null> {
  const svg = svgText(spec.file);
  if (!svg) return Promise.resolve(null);
  const { w, h } = intrinsicSize(svg);
  const cw = Math.round(w * (spec.scale ?? 1));
  const ch = Math.round(h * (spec.scale ?? 1));
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = cw;
      c.height = ch;
      c.getContext('2d')!.drawImage(img, 0, 0, cw, ch);
      resolve(c);
    };
    img.onerror = () => {
      console.warn('Falha ao rasterizar', spec.key);
      resolve(null);
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}
