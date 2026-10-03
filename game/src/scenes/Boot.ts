import Phaser from 'phaser';
import { ASSETS, rasterize } from '../assets';
import { COLORS, FONT, HEX } from '../config';

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x2b1608);
    this.add.text(width / 2, height / 2 - 70, 'Jornada Acadêmica', { fontFamily: FONT, fontSize: '56px', fontStyle: 'bold', color: HEX.cream }).setOrigin(0.5);
    const bar = this.add.graphics();
    const draw = (p: number) => {
      bar.clear();
      bar.fillStyle(COLORS.outline, 1).fillRoundedRect(width / 2 - 300, height / 2, 600, 36, 18);
      bar.fillStyle(COLORS.green, 1).fillRoundedRect(width / 2 - 296, height / 2 + 4, Math.max(28, 592 * p), 28, 14);
    };
    draw(0);

    let done = 0;
    void Promise.all(
      ASSETS.map(async (spec) => {
        const canvas = await rasterize(spec);
        if (canvas && !this.textures.exists(spec.key)) this.textures.addCanvas(spec.key, canvas);
        draw(++done / ASSETS.length);
      }),
    ).then(() => this.scene.start('Menu'));
  }
}
