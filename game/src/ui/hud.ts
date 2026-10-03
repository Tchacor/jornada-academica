import Phaser from 'phaser';
import { COLORS, HEX } from '../config';
import { bandOf, type Band } from '../systems/anxiety';
import { audio } from '../systems/audio';
import { Controls } from './controls';
import { drawRoundButton, textStyle } from './kit';

const BAR = { x: 65, y: 70, w: 715, h: 90 };
const KNOB_R = 60;
const knobX = (v: number) => BAR.x + 55 + (v / 100) * (BAR.w - 110 - 0);
const BAND_COLOR: Record<Band, number> = { verde: COLORS.green, amarelo: COLORS.yellow, vermelho: COLORS.red };
const LUNG: Record<Band, string> = { verde: 'ic-pulmao-verde', amarelo: 'ic-pulmao-amarelo', vermelho: 'ic-pulmao-vermelho' };

/** HUD fixo: medidor de ansiedade, rótulo da fase, pausa e controles (teclado/toque). */
export class Hud {
  readonly root: Phaser.GameObjects.Container;
  private bar: Phaser.GameObjects.Graphics;
  private knob: Phaser.GameObjects.Container;
  private knobLung: Phaser.GameObjects.Image;
  private knobRing: Phaser.GameObjects.Graphics;
  private shown = 0;
  private target = 0;
  private progress: Phaser.GameObjects.Graphics;
  private breathBtn!: Phaser.GameObjects.Container;
  private breathCd: Phaser.GameObjects.Graphics;
  private interactBtn!: Phaser.GameObjects.Container;
  private jumpBtn!: Phaser.GameObjects.Container;
  private hint: Phaser.GameObjects.Container;

  constructor(private scene: Phaser.Scene, private controls: Controls, label: string, onPause: () => void) {
    this.root = scene.add.container(0, 0).setDepth(100).setScrollFactor(0);
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => { this.root.add(o); return o; };

    // medidor
    const frame = add(scene.add.graphics());
    frame.fillStyle(COLORS.outline, 1).fillRoundedRect(BAR.x - 6, BAR.y - 6, BAR.w + 12, BAR.h + 12, 52);
    frame.fillStyle(COLORS.creamHud, 1).fillRoundedRect(BAR.x, BAR.y, BAR.w, BAR.h, 46);
    this.bar = add(scene.add.graphics());
    this.knobRing = scene.add.graphics();
    this.knobLung = scene.add.image(0, 0, 'ic-pulmao-verde').setScale(0.5);
    this.knob = add(scene.add.container(knobX(0), BAR.y + BAR.h / 2, [this.knobRing, this.knobLung]));

    // rótulo da fase + progresso
    const lab = add(scene.add.graphics());
    const wide = label.length > 8;
    const lw = wide ? 458 : 252;
    const lx = 1603 - lw;
    lab.fillStyle(COLORS.outline, 1).fillRoundedRect(lx - 5, 57, lw + 10, 116, 12);
    lab.fillStyle(0x8b4513, 1).fillRoundedRect(lx, 62, lw, 106, 8);
    add(scene.add.text(lx + lw / 2, 115, label, textStyle(wide ? 44 : 54, HEX.cream)).setOrigin(0.5));
    this.progress = add(scene.add.graphics());
    this.setProgress(0);
    this.progress.setVisible(!wide);

    // pausa
    const pause = add(drawRoundButton(scene, 1725, 115, 80, 'ic-pause', 0.55));
    this.bindTap(pause, onPause);

    // movimento
    const left = add(drawRoundButton(scene, 205, 903, 80, 'ic-seta-esq', 0.55));
    const right = add(drawRoundButton(scene, 467, 903, 80, 'ic-seta-dir', 0.55));
    this.bindHold(left, 'left');
    this.bindHold(right, 'right');

    // ações
    this.jumpBtn = add(drawRoundButton(scene, 1725, 683, 80, 'ic-pulo', 0.55));
    this.bindTap(this.jumpBtn, () => controls.press('jump'), true);
    this.breathBtn = add(drawRoundButton(scene, 1495, 903, 80, 'ic-pulmao', 0.55));
    this.bindTap(this.breathBtn, () => controls.press('breath'), true);
    this.breathCd = add(scene.add.graphics());
    this.interactBtn = add(drawRoundButton(scene, 1725, 903, 105, 'ic-interagir', 0.78));
    this.bindTap(this.interactBtn, () => controls.press('interact'), true);

    // dica contextual sobre o botão de interagir
    const ht = scene.add.text(0, 0, '', textStyle(30, HEX.cream, { align: 'center' })).setOrigin(0.5);
    const hb = scene.add.graphics();
    this.hint = add(scene.add.container(1560, 770, [hb, ht]).setAlpha(0).setData('t', ht).setData('b', hb));
    // filhos de container fixo precisam de scrollFactor 0 também para o input acertar o alvo
    this.root.setScrollFactor(0, 0, true);
  }

  private bindTap(btn: Phaser.GameObjects.Container, cb: () => void, down = false): void {
    btn.setInteractive({ useHandCursor: true });
    btn.on(down ? 'pointerdown' : 'pointerup', () => {
      audio.unlock();
      cb();
    });
    btn.on('pointerdown', () => btn.setScale(0.94));
    const reset = () => btn.setScale(1);
    btn.on('pointerup', reset);
    btn.on('pointerout', reset);
  }

  private bindHold(btn: Phaser.GameObjects.Container, dir: 'left' | 'right'): void {
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => { audio.unlock(); this.controls.setTouch(dir, true); btn.setScale(0.94); });
    const up = () => { this.controls.setTouch(dir, false); btn.setScale(1); };
    btn.on('pointerup', up);
    btn.on('pointerout', up);
    btn.on('pointerupoutside', up);
  }

  setAnxiety(v: number): void {
    this.target = v;
  }

  setProgress(p: number): void {
    const x = 1352, y = 186, w = 252, h = 14;
    this.progress.clear();
    this.progress.fillStyle(COLORS.outline, 1).fillRoundedRect(x - 3, y - 3, w + 6, h + 6, 10);
    this.progress.fillStyle(COLORS.creamHud, 1).fillRoundedRect(x, y, w, h, 7);
    if (p > 0.01) this.progress.fillStyle(COLORS.brown, 1).fillRoundedRect(x, y, Math.max(14, w * Math.min(1, p)), h, 7);
  }

  /** 0..1 — fração restante do tempo de recarga da respiração. */
  setBreathCooldown(frac: number): void {
    this.breathCd.clear();
    if (frac <= 0) { this.breathBtn.setAlpha(1); return; }
    this.breathBtn.setAlpha(0.55);
    this.breathCd.lineStyle(10, COLORS.brown, 1);
    this.breathCd.beginPath().arc(1495, 903, 94, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - frac), false).strokePath();
  }

  setHint(text: string | null): void {
    const ht = this.hint.getData('t') as Phaser.GameObjects.Text;
    const hb = this.hint.getData('b') as Phaser.GameObjects.Graphics;
    if (!text) { this.hint.setAlpha(0); return; }
    ht.setText(text);
    const w = ht.width + 36, h = ht.height + 18;
    hb.clear().fillStyle(COLORS.brownDark, 0.92).fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    this.hint.setAlpha(1);
    this.interactBtn.setScale(1 + Math.sin(this.scene.time.now / 160) * 0.04);
  }

  setVisible(v: boolean): void {
    this.root.setVisible(v);
  }

  update(dt: number): void {
    this.shown += (this.target - this.shown) * Math.min(1, dt * 6);
    const v = this.shown;
    const band = bandOf(v);
    const kx = knobX(v);
    this.bar.clear();
    const y = BAR.y + 6, h = BAR.h - 12, x0 = BAR.x + 6;
    const segs: [number, number, number][] = [
      [0, 33, COLORS.green],
      [33, 66, COLORS.yellow],
      [66, 100, COLORS.red],
    ];
    segs.forEach(([a, b, col], i) => {
      const xa = i === 0 ? x0 : knobX(a);
      const xb = Math.min(knobX(b), kx);
      if (v <= a || xb <= xa) return;
      this.bar.fillStyle(col, 1);
      if (i === 0) this.bar.fillRoundedRect(xa, y, xb - xa + 20, h, { tl: h / 2, bl: h / 2, tr: 0, br: 0 });
      else this.bar.fillRect(xa, y, xb - xa + (i === 2 ? 4 : 0), h);
    });
    this.knob.x = kx;
    const pulse = band === 'vermelho' ? 1 + Math.sin(this.scene.time.now / 120) * 0.05 : 1;
    this.knob.setScale(pulse);
    this.knobRing.clear();
    this.knobRing.fillStyle(COLORS.outline, 1).fillCircle(0, 0, KNOB_R + 6);
    this.knobRing.fillStyle(BAND_COLOR[band], 1).fillCircle(0, 0, KNOB_R);
    this.knobLung.setTexture(this.scene.textures.exists('ic-pulmao-claro') ? 'ic-pulmao-claro' : LUNG[band]);
  }
}
