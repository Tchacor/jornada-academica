import Phaser from 'phaser';
import { COLORS, DISCLAIMER, FONT, HEX, W } from '../config';
import { audio } from '../systems/audio';
import { loadSave } from '../systems/save';
import { drawPanel, makeButton, drawRoundButton } from '../ui/kit';

/** Fundo desfocado: reduz o cenário num canvas pequeno (barato, sem postFX) e amplia suavizado. */
export function menuBackdrop(scene: Phaser.Scene): void {
  const key = 'bg-menu-blur';
  if (!scene.textures.exists(key)) {
    const src = scene.textures.get('bg-fase1').getSourceImage() as CanvasImageSource;
    const c = scene.textures.createCanvas(key, 384, 216);
    if (c) {
      const ctx = c.getContext();
      ctx.filter = 'blur(2px)';
      ctx.drawImage(src, 0, 0, 384, 216);
      c.refresh();
    }
  }
  scene.add.image(W / 2, 540, key).setDisplaySize(W, 1080);
  scene.add.rectangle(W / 2, 540, W, 1080, 0xffffff, 0.12);
}

export function menuLogo(scene: Phaser.Scene, y: number): Phaser.GameObjects.Image {
  const logo = scene.add.image(W / 2, y, 'logo').setScale(0.4).setDepth(5);
  scene.tweens.add({ targets: logo, y: y + 6, yoyo: true, repeat: -1, duration: 2200, ease: 'Sine.inOut' });
  return logo;
}

export class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    menuBackdrop(this);
    audio.setAmbience('campus');
    const s = loadSave();

    drawPanel(this, 660, 240, 600, 660);
    menuLogo(this, 230);

    const labels: [string, () => void][] = [
      [s.unlocked > 1 ? 'CONTINUAR' : 'INICIAR', () => (s.unlocked > 1 ? this.scene.start('LevelSelect') : this.scene.start('Level', { level: 0 }))],
      ['PERSONAGEM', () => this.scene.start('CharacterSelect')],
      ['CONFIGURAÇÕES', () => this.scene.start('Settings')],
    ];
    labels.forEach(([t, cb], i) => makeButton(this, W / 2, 440 + i * 130, 480, 96, t, cb, t.length > 10 ? 36 : 42));

    this.addMute(W / 2, 925);

    this.add
      .text(W / 2, 1030, DISCLAIMER, { fontFamily: FONT, fontSize: '22px', color: '#fff7ea', align: 'center', wordWrap: { width: 1500 }, stroke: HEX.outline, strokeThickness: 4 })
      .setOrigin(0.5);

    this.cameras.main.fadeIn(350);
  }

  private addMute(x: number, y: number): void {
    const btn = drawRoundButton(this, x, y, 46);
    const icon = this.add.image(0, 0, audio.muted ? 'ic-som-mudo' : 'ic-som').setScale(0.4);
    btn.add(icon);
    btn.setDepth(6).setInteractive({ useHandCursor: true });
    btn.on('pointerup', () => {
      audio.unlock();
      audio.setMuted(!audio.muted);
      icon.setTexture(audio.muted ? 'ic-som-mudo' : 'ic-som');
      audio.click();
    });
    void COLORS;
  }
}
