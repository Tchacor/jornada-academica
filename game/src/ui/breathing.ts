import Phaser from 'phaser';
import { COLORS, HEX } from '../config';
import { audio } from '../systems/audio';
import { Controls } from './controls';
import { makeButton, textStyle } from './kit';

export interface BreathOpts {
  cycles: number;
  inhale: number;
  hold: number;
  exhale: number;
  /** chamado todo frame com dt (s) e se o jogador está no ritmo certo */
  onTick: (correct: boolean, dt: number) => void;
  onDone: (accuracy: number) => void;
  onCancel: () => void;
}

type Phase = 'inhale' | 'hold' | 'exhale';
const LABEL: Record<Phase, string> = { inhale: 'INSPIRE', hold: 'SEGURE', exhale: 'EXPIRE' };
const R_MIN = 125;
const R_MAX = 250;

/** Minijogo de respiração guiada: segure (toque/clique/Espaço) ao inspirar e segurar; solte ao expirar. */
export class BreathingOverlay {
  private root: Phaser.GameObjects.Container;
  private circle: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private sub: Phaser.GameObjects.Text;
  private dots: Phaser.GameObjects.Graphics;
  private phase: Phase = 'inhale';
  private t = 0;
  private cycle = 0;
  private total = 0;
  private good = 0;
  private done = false;

  constructor(private scene: Phaser.Scene, private controls: Controls, private o: BreathOpts) {
    const dim = scene.add.rectangle(960, 540, 1920, 1080, 0x1b2a22, 0.86).setInteractive();
    this.circle = scene.add.graphics();
    this.label = scene.add.text(960, 470, '', textStyle(52, HEX.cream, { stroke: HEX.outline, strokeThickness: 8 })).setOrigin(0.5);
    this.sub = scene.add.text(960, 850, 'Mantenha pressionado (toque, clique ou Espaço) para inspirar e segurar.\nSolte para expirar.', textStyle(34, HEX.cream, { align: 'center', lineSpacing: 8 })).setOrigin(0.5);
    this.dots = scene.add.graphics();
    const exit = makeButton(scene, 960, 975, 240, 80, 'SAIR', () => this.cancel(), 34);
    this.root = scene.add.container(0, 0, [dim, this.circle, this.label, this.sub, this.dots, exit]).setDepth(300).setAlpha(0);
    this.root.setScrollFactor(0, 0, true);
    scene.tweens.add({ targets: this.root, alpha: 1, duration: 300 });
    this.enter('inhale');
  }

  private holding(): boolean {
    const i = this.scene.input;
    return this.controls.spaceHeld || i.activePointer.isDown || [i.pointer1, i.pointer2, i.pointer3].some((p) => p?.isDown);
  }

  private dur(p: Phase): number {
    return this.o[p];
  }

  private enter(p: Phase): void {
    this.phase = p;
    this.t = 0;
    this.label.setText(LABEL[p]);
    if (p === 'inhale') audio.inhale(this.o.inhale);
    if (p === 'exhale') audio.exhale(this.o.exhale);
  }

  update(dt: number): void {
    if (this.done) return;
    this.t += dt;
    const d = this.dur(this.phase);
    const k = Math.min(1, this.t / d);
    const eased = Phaser.Math.Easing.Sine.InOut(k);
    let r = R_MAX;
    if (this.phase === 'inhale') r = R_MIN + (R_MAX - R_MIN) * eased;
    else if (this.phase === 'hold') r = R_MAX + Math.sin(this.t * 6) * 4;
    else r = R_MAX - (R_MAX - R_MIN) * eased;

    const expected = this.phase !== 'exhale';
    const correct = this.holding() === expected;
    this.total += dt;
    if (correct) this.good += dt;
    this.o.onTick(correct, dt);

    const col = correct ? COLORS.green : COLORS.yellow;
    this.circle.clear();
    this.circle.fillStyle(col, 0.18).fillCircle(960, 470, r + 40);
    this.circle.fillStyle(COLORS.cream, 0.88).fillCircle(960, 470, r);
    this.circle.lineStyle(14, col, 1).strokeCircle(960, 470, r);
    this.label.setColor(correct ? HEX.brownDark : HEX.brownDark).setStroke('#f3e5d0', 8);

    this.dots.clear();
    for (let i = 0; i < this.o.cycles; i++) {
      this.dots.fillStyle(i < this.cycle ? COLORS.green : COLORS.cream, i < this.cycle ? 1 : 0.5).fillCircle(960 + (i - (this.o.cycles - 1) / 2) * 44, 775, 14);
    }

    if (this.t >= d) {
      if (this.phase === 'inhale') this.enter('hold');
      else if (this.phase === 'hold') this.enter('exhale');
      else {
        this.cycle++;
        if (this.cycle >= this.o.cycles) this.finish();
        else this.enter('inhale');
      }
    }
  }

  private finish(): void {
    this.done = true;
    const acc = this.total > 0 ? this.good / this.total : 0;
    this.destroy();
    this.o.onDone(acc);
  }

  private cancel(): void {
    if (this.done) return;
    this.done = true;
    this.destroy();
    this.o.onCancel();
  }

  destroy(): void {
    this.root.destroy();
  }
}
