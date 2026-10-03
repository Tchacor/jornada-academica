import Phaser from 'phaser';
import { COLORS, FONT, HEX } from '../config';

const A = 'assets/';

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x2b1608);
    this.add.text(width / 2, height / 2 - 70, 'Jornada Acadêmica', { fontFamily: FONT, fontSize: '56px', fontStyle: 'bold', color: HEX.cream }).setOrigin(0.5);
    const bar = this.add.graphics();
    this.load.on('progress', (p: number) => {
      bar.clear();
      bar.fillStyle(COLORS.outline, 1).fillRoundedRect(width / 2 - 300, height / 2, 600, 36, 18);
      bar.fillStyle(COLORS.green, 1).fillRoundedRect(width / 2 - 296, height / 2 + 4, 592 * p, 28, 14);
    });
    this.load.on('loaderror', (f: Phaser.Loader.File) => console.warn('Falha ao carregar', f.key));

    // cenários (1920×1080)
    const bgs: [string, string][] = [
      ['bg-fase1', 'fase1'], ['bg-fase2', 'fase2'], ['bg-fase3', 'fase3'], ['bg-fase4', 'fase4'], ['bg-zona', 'zona-segura'],
    ];
    bgs.forEach(([k, f]) => this.load.svg(k, `${A}backgrounds/${f}.svg`, { width: 1920, height: 1080 }));

    // personagens e NPCs (renderizados em 2×, exibidos reduzidos para ficar nítidos)
    [1, 2, 3].forEach((n) => {
      this.load.svg(`char-${n}`, `${A}characters/personagem-${n}.svg`, { scale: 2 });
      this.load.svg(`char-${n}-andar`, `${A}characters/personagem-${n}-andar.svg`, { scale: 2 });
    });
    ['colega', 'professor', 'orientadora'].forEach((n) => this.load.svg(`npc-${n}`, `${A}characters/npc-${n}.svg`, { scale: 2 }));

    // UI
    this.load.svg('logo', `${A}ui/logo.svg`, { scale: 2 });
    ['pulmao', 'pulo', 'pause', 'seta-esq', 'seta-dir', 'som', 'som-mudo', 'interagir', 'editar', 'pulmao-claro', 'pulmao-verde', 'pulmao-amarelo', 'pulmao-vermelho'].forEach((n) =>
      this.load.svg(`ic-${n}`, `${A}ui/icon-${n}.svg`, { scale: 2 }),
    );

    // props
    this.load.svg('nuvem1', `${A}props/nuvem-pensamento.svg`, { scale: 2 });
    this.load.svg('nuvem2', `${A}props/nuvem-pensamento-2.svg`, { scale: 2 });
    this.load.svg('estrela', `${A}props/estrela-calma.svg`, { scale: 2 });
    this.load.svg('placa-iniciar', `${A}props/placa-iniciar.svg`, { scale: 2 });
  }

  create(): void {
    this.scene.start('Menu');
  }
}
