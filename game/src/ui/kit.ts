import Phaser from 'phaser';
import { COLORS, FONT, HEX } from '../config';
import { audio } from '../systems/audio';

export function textStyle(size: number, color: string = HEX.brownDark, extra: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color, ...extra };
}

/** Painel de madeira/bege no estilo das telas do jogo. */
export function drawPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, radius = 36): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x000000, 0.25).fillRoundedRect(6, 14, w, h, radius);
  g.fillStyle(COLORS.brown, 1).fillRoundedRect(0, 0, w, h, radius);
  g.lineStyle(6, COLORS.outline, 1).strokeRoundedRect(0, 0, w, h, radius);
  g.fillStyle(COLORS.beige, 1).fillRoundedRect(12, 12, w - 24, h - 24, radius - 8);
  g.lineStyle(3, COLORS.brownLight, 1).strokeRoundedRect(12, 12, w - 24, h - 24, radius - 8);
  return g;
}

export interface Btn extends Phaser.GameObjects.Container {
  setLabel(t: string): void;
  setEnabled(on: boolean): void;
}

/** Botão pílula marrom (centro em x,y). */
export function makeButton(scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, onClick: () => void, fontSize = 40): Btn {
  const c = scene.add.container(x, y) as Btn;
  const g = scene.add.graphics();
  const draw = (fill: number) => {
    g.clear();
    g.fillStyle(0x000000, 0.28).fillRoundedRect(-w / 2 + 2, -h / 2 + 8, w, h, h / 2);
    g.fillStyle(fill, 1).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    g.fillStyle(0xffffff, 0.12).fillRoundedRect(-w / 2 + 10, -h / 2 + 6, w - 20, h / 2 - 6, (h / 2 - 6) / 2);
    g.lineStyle(4, COLORS.outline, 0.9).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  };
  draw(COLORS.brown);
  const t = scene.add.text(0, 0, label, textStyle(fontSize, HEX.cream)).setOrigin(0.5);
  c.add([g, t]);
  c.setSize(w, h);
  let enabled = true;
  c.setInteractive({ useHandCursor: true });
  c.on('pointerover', () => enabled && draw(COLORS.brownLight));
  c.on('pointerout', () => { draw(enabled ? COLORS.brown : 0x8a7a6a); c.setScale(1); });
  c.on('pointerdown', () => enabled && c.setScale(0.96));
  c.on('pointerup', () => {
    if (!enabled) return;
    c.setScale(1);
    audio.unlock();
    audio.click();
    onClick();
  });
  c.setLabel = (s) => t.setText(s);
  c.setEnabled = (on) => { enabled = on; draw(on ? COLORS.brown : 0x8a7a6a); t.setAlpha(on ? 1 : 0.6); };
  return c;
}

/** Círculo de HUD (bege com contorno escuro) com ícone. Retorna container com `zone` interativa. */
export function drawRoundButton(scene: Phaser.Scene, x: number, y: number, r: number, icon?: string, iconScale = 0.5): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.2).fillCircle(3, 6, r);
  g.fillStyle(COLORS.creamHud, 1).fillCircle(0, 0, r);
  g.lineStyle(7, COLORS.outline, 1).strokeCircle(0, 0, r);
  c.add(g);
  if (icon && scene.textures.exists(icon)) c.add(scene.add.image(0, 0, icon).setScale(iconScale));
  c.setSize(r * 2, r * 2);
  return c;
}

export function toast(scene: Phaser.Scene, text: string, y = 270, ms = 3200, color: string = HEX.cream): Phaser.GameObjects.Container {
  const t = scene.add.text(0, 0, text, textStyle(34, color, { align: 'center', wordWrap: { width: 1250 }, lineSpacing: 6 })).setOrigin(0.5);
  const pad = 30;
  const w = t.width + pad * 2;
  const h = t.height + pad;
  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.brownDark, 0.92).fillRoundedRect(-w / 2, -h / 2, w, h, 26);
  bg.lineStyle(4, COLORS.brownLight, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 26);
  const c = scene.add.container(960, y, [bg, t]).setDepth(150).setScrollFactor(0).setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, y: y + 10, duration: 250 });
  scene.tweens.add({ targets: c, alpha: 0, delay: ms, duration: 400, onComplete: () => c.destroy() });
  return c;
}

/** Placa de madeira com poste(s) (origem inferior central). */
export function drawSign(scene: Phaser.Scene, x: number, y: number, label: string, w = 250): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(0x6b3b12, 1).fillRect(-w / 2 + 28, -110, 22, 110).fillRect(w / 2 - 50, -110, 22, 110);
  g.lineStyle(4, COLORS.outline, 1).strokeRect(-w / 2 + 28, -110, 22, 110).strokeRect(w / 2 - 50, -110, 22, 110);
  g.fillStyle(0xd9873a, 1).fillRoundedRect(-w / 2, -190, w, 100, 10);
  g.lineStyle(5, COLORS.outline, 1).strokeRoundedRect(-w / 2, -190, w, 100, 10);
  g.fillStyle(0xffffff, 0.15).fillRoundedRect(-w / 2 + 8, -184, w - 16, 30, 8);
  g.fillStyle(0x5a2d0c, 1).fillCircle(-w / 2 + 16, -174, 4).fillCircle(w / 2 - 16, -174, 4).fillCircle(-w / 2 + 16, -106, 4).fillCircle(w / 2 - 16, -106, 4);
  const t = scene.add.text(0, -140, label, textStyle(40, '#fff4e3', { stroke: '#7a3d10', strokeThickness: 5 })).setOrigin(0.5);
  return scene.add.container(x, y, [g, t]);
}
