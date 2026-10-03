import Phaser from 'phaser';
import { W } from '../config';
import { LEVELS } from '../data/levels';
import { loadSave } from '../systems/save';
import { drawPanel, makeButton, textStyle } from '../ui/kit';
import { menuBackdrop, menuLogo } from './Menu';

export class LevelSelect extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create(): void {
    menuBackdrop(this);
    const s = loadSave();
    drawPanel(this, 560, 230, 800, 740);
    menuLogo(this, 215);
    this.add.text(W / 2, 380, 'ESCOLHA A FASE', textStyle(36)).setOrigin(0.5);

    LEVELS.forEach((l, i) => {
      const unlocked = i < s.unlocked;
      const y = 470 + i * 105;
      const b = makeButton(this, W / 2, y, 620, 88, `${l.title.replace(' · ', ' — ')}${unlocked ? '' : ' (bloqueada)'}`, () => this.scene.start('Level', { level: i }), 28);
      b.setEnabled(unlocked);
      const best = s.best[String(i)];
      if (best !== undefined) this.add.text(1290, y, `${best}`, textStyle(26)).setOrigin(1, 0.5).setDepth(9);
    });
    makeButton(this, W / 2, 905, 320, 80, 'VOLTAR', () => this.scene.start('Menu'), 34);
    this.cameras.main.fadeIn(250);
  }
}
