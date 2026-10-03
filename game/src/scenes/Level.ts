import Phaser from 'phaser';
import { CHARACTERS, COLORS, FONT, GROUND_Y, H, HEX, W } from '../config';
import { LEVELS, SAFE_MESSAGES, worldWidth, type Choice, type LevelDef, type NpcDef, type SpotDef } from '../data/levels';
import { AnxietyMeter, bandOf } from '../systems/anxiety';
import { audio } from '../systems/audio';
import { carePoints, newStats, stars, tickStats, type RunStats } from '../systems/score';
import { loadSave, writeSave } from '../systems/save';
import { BreathingOverlay } from '../ui/breathing';
import { Controls } from '../ui/controls';
import { Hud } from '../ui/hud';
import { drawPanel, drawSign, makeButton, textStyle, toast } from '../ui/kit';

const SPEED = 380;
const JUMP_V = -1250;
const GRAVITY = 3200;
const PLAYER_SCALE = 0.34;
const REACH = 170;
const BREATH_COOLDOWN = 20;
const INVULN = 1.2;

export interface RunState {
  cleared: number[];
  npcDone: number[];
  spotDone: number[];
  stats: RunStats;
  breathCd: number;
  introDone: boolean;
}

interface InitData {
  level?: number;
  safe?: boolean;
  run?: RunState;
  startX?: number;
  anxiety?: number;
}

type Mode = 'intro' | 'play' | 'dialogue' | 'breath' | 'pause' | 'end' | 'moving';

interface Cloud { i: number; s: Phaser.GameObjects.Image; x: number; baseY: number; alive: boolean }
interface Interactable {
  kind: 'npc' | 'spot' | 'pavilion' | 'return';
  x: number;
  label: string;
  done: () => boolean;
  marker?: Phaser.GameObjects.Container;
  open: () => void;
}

const SAFE_DEF: LevelDef = {
  id: 0,
  title: 'Zona Segura',
  focus: 'Um espaço para respirar e se acolher',
  intro: '',
  bg: 'bg-zona',
  screens: 1,
  startAnxiety: 40,
  clouds: [],
  thoughts: [],
  stress: [],
  npcs: [],
  spots: [],
  ending: '',
};

export class Level extends Phaser.Scene {
  private levelIndex = 0;
  private safe = false;
  private def!: LevelDef;
  private worldW = W;
  private run!: RunState;
  private meter = new AnxietyMeter();
  private mode: Mode = 'intro';
  private controls!: Controls;
  private hud!: Hud;

  private player!: Phaser.GameObjects.Image;
  private px = 360;
  private py = GROUND_Y;
  private vy = 0;
  private facing = 1;
  private stepT = 0;
  private invuln = 0;
  private clouds: Cloud[] = [];
  private things: Interactable[] = [];
  private vignette!: Phaser.GameObjects.Image;
  private overlay: Phaser.GameObjects.Container | null = null;
  private breath: BreathingOverlay | null = null;
  private thoughtToast: Phaser.GameObjects.Container | null = null;
  private heartT = 0;
  private safeMsgT = 0;
  private returnX = 0;
  private startX = 360;
  private startAnxiety?: number;
  private charIdx = 0;
  private playerName = '';

  constructor() {
    super('Level');
  }

  init(data: InitData): void {
    this.safe = !!data.safe;
    this.levelIndex = data.level ?? 0;
    this.def = this.safe ? SAFE_DEF : LEVELS[this.levelIndex];
    this.worldW = worldWidth(this.def);
    this.run = data.run ?? { cleared: [], npcDone: [], spotDone: [], stats: newStats(), breathCd: 0, introDone: false };
    this.startX = data.startX ?? 360;
    this.startAnxiety = data.anxiety;
    this.returnX = data.startX ?? 360;
    this.clouds = [];
    this.things = [];
    this.overlay = null;
    this.breath = null;
    this.thoughtToast = null;
    this.invuln = 0;
    this.vy = 0;
    this.heartT = 0;
    this.safeMsgT = 0;
  }

  create(): void {
    const save = loadSave();
    this.charIdx = save.character;
    this.playerName = save.name || 'Estudante';
    this.meter = new AnxietyMeter(this.startAnxiety ?? this.def.startAnxiety);
    this.controls = new Controls(this);
    this.mode = this.safe || this.run.introDone ? 'play' : 'intro';
    this.px = this.safe ? 400 : this.startX;
    this.py = GROUND_Y;

    this.buildWorld();
    this.buildPlayer();
    this.buildVignette();
    this.hud = new Hud(this, this.controls, this.safe ? 'Zona Segura' : `Fase ${this.def.id}`, () => this.openPause());
    this.hud.setAnxiety(this.meter.value);
    this.cameras.main.setBounds(0, 0, this.worldW, H);
    this.updateCamera(true);
    this.cameras.main.fadeIn(500);

    audio.setAmbience(this.safe ? 'safe' : 'campus');
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this.controls.clear());

    if (this.mode === 'intro') this.openIntro();
    else if (this.safe) this.time.delayedCall(700, () => this.sayCalm('Você está na Zona Segura. Respire. Aqui não há pressa.', 5200));
  }

  // ───────────────────────── mundo ─────────────────────────

  private buildWorld(): void {
    for (let i = 0; i < this.def.screens; i++) this.add.image(i * W + W / 2, H / 2, this.def.bg).setDepth(0);

    if (!this.safe && this.def.id === 1 && this.textures.exists('placa-iniciar')) {
      this.add.image(240, 905, 'placa-iniciar').setOrigin(0.5, 1).setScale(0.5).setDepth(5);
    }

    // zonas de tensão
    this.def.stress.forEach((z) => {
      const r = this.add.rectangle((z.from + z.to) / 2, H / 2, z.to - z.from, H, 0x3b1d08, 0.14).setDepth(2);
      this.tweens.add({ targets: r, alpha: { from: 0.08, to: 0.2 }, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.inOut' });
      this.add.text((z.from + z.to) / 2, 230, z.label, textStyle(26, '#fff4e3', { stroke: HEX.outline, strokeThickness: 6, align: 'center' })).setOrigin(0.5).setDepth(3);
    });

    // nuvens de pensamento
    this.def.clouds.forEach((x, i) => {
      const s = this.add.image(x, GROUND_Y - 40, i % 2 ? 'nuvem2' : 'nuvem1').setOrigin(0.5, 1).setScale(0.3).setDepth(8);
      const c: Cloud = { i, s, x, baseY: GROUND_Y - 40, alive: !this.run.cleared.includes(i) };
      if (!c.alive) s.setVisible(false);
      this.tweens.add({ targets: s, y: c.baseY - 14, yoyo: true, repeat: -1, duration: 1300 + i * 90, ease: 'Sine.inOut' });
      this.clouds.push(c);
    });

    // NPCs
    this.def.npcs.forEach((n, i) => {
      this.add.image(n.x, GROUND_Y - 6, n.sprite).setOrigin(0.5, 1).setScale(0.33).setDepth(6).setFlipX(true);
      this.things.push({
        kind: 'npc', x: n.x, label: `Conversar com ${n.name}`,
        done: () => this.run.npcDone.includes(i),
        marker: this.makeMarker(n.x, GROUND_Y - 440, this.run.npcDone.includes(i)),
        open: () => this.openDialogue(n, i),
      });
    });

    // pontos de interação
    this.def.spots.forEach((sp, i) => {
      this.things.push({
        kind: 'spot', x: sp.x, label: sp.label,
        done: () => this.run.spotDone.includes(i),
        marker: this.makeMarker(sp.x, GROUND_Y - 330, this.run.spotDone.includes(i)),
        open: () => this.useSpot(sp, i),
      });
    });

    if (this.safe) {
      this.things.push({
        kind: 'pavilion', x: 1450, label: 'Respirar no pavilhão', done: () => false,
        marker: this.makeMarker(1450, GROUND_Y - 330, false),
        open: () => this.startBreath(true),
      });
      drawSign(this, 250, 905, 'VOLTAR', 230).setDepth(5);
      this.things.push({
        kind: 'return', x: 250, label: 'Voltar à jornada', done: () => false,
        marker: this.makeMarker(250, GROUND_Y - 270, false),
        open: () => this.leaveSafe(),
      });
    } else {
      drawSign(this, this.worldW - 300, 905, 'SEGUIR ▶', 270).setDepth(5);
    }
  }

  private makeMarker(x: number, y: number, hidden: boolean): Phaser.GameObjects.Container {
    const g = this.add.graphics();
    g.fillStyle(COLORS.outline, 1).fillCircle(0, 0, 30).fillTriangle(-10, 24, 10, 24, 0, 40);
    g.fillStyle(COLORS.yellow, 1).fillCircle(0, 0, 25);
    const t = this.add.text(0, -2, '!', textStyle(36, HEX.brownDark)).setOrigin(0.5);
    const c = this.add.container(x, y, [g, t]).setDepth(9).setVisible(!hidden);
    this.tweens.add({ targets: c, y: y - 12, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
    return c;
  }

  private buildPlayer(): void {
    this.player = this.add.image(this.px, this.py, CHARACTERS[this.charIdx].key).setOrigin(0.5, 1).setScale(PLAYER_SCALE).setDepth(10);
  }

  private buildVignette(): void {
    if (!this.textures.exists('vignette')) {
      const c = this.textures.createCanvas('vignette', 512, 288);
      if (c) {
        const ctx = c.getContext();
        const g = ctx.createRadialGradient(256, 144, 130, 256, 144, 300);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(1, 'rgba(255,255,255,1)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 288);
        c.refresh();
      }
    }
    this.vignette = this.add.image(W / 2, H / 2, 'vignette').setDisplaySize(W, H).setScrollFactor(0).setDepth(90).setAlpha(0);
  }

  // ───────────────────────── loop ─────────────────────────

  update(_t: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    this.breath?.update(dt);
    if (this.mode === 'play') this.updatePlay(dt);
    else if (this.mode === 'breath') this.hud.setHint(null);
    this.updateVignette();
    this.hud.update(dt);
  }

  private updatePlay(dt: number): void {
    if (this.controls.consume('pause')) { this.openPause(); return; }

    // movimento
    const dir = (this.controls.right ? 1 : 0) - (this.controls.left ? 1 : 0);
    this.px = Phaser.Math.Clamp(this.px + dir * SPEED * dt, 90, this.worldW - 90);
    if (dir !== 0) this.facing = dir;
    const onGround = this.py >= GROUND_Y && this.vy >= 0;
    if (this.controls.consume('jump') && onGround) { this.vy = JUMP_V; audio.jump(); }
    if (this.py < GROUND_Y || this.vy < 0) {
      this.vy += GRAVITY * dt;
      this.py = Math.min(GROUND_Y, this.py + this.vy * dt);
      if (this.py >= GROUND_Y) this.vy = 0;
    }
    this.animatePlayer(dir, dt);
    this.updateCamera(false);

    // ansiedade
    const inZone = this.def.stress.some((z) => this.px >= z.from && this.px <= z.to);
    this.meter.update(dt, inZone, this.safe ? 0 : 22);
    if (this.safe) this.meter.add(-3 * dt);
    tickStats(this.run.stats, this.meter.band, dt);
    this.hud.setAnxiety(this.meter.value);
    if (!this.safe) this.hud.setProgress((this.px - 90) / (this.worldW - 400));

    this.heartT -= dt;
    if (this.heartT <= 0 && (inZone || this.meter.band === 'vermelho')) { audio.heartbeat(); this.heartT = inZone ? 0.85 : 1.2; }

    this.invuln = Math.max(0, this.invuln - dt);
    this.checkClouds();

    // recarga da respiração
    if (!this.safe) {
      this.run.breathCd = Math.max(0, this.run.breathCd - dt);
      this.hud.setBreathCooldown(this.run.breathCd / BREATH_COOLDOWN);
    }
    const grounded = this.py >= GROUND_Y;
    if (this.controls.consume('breath') && grounded) {
      if (this.safe) this.startBreath(true);
      else if (this.run.breathCd <= 0) this.startBreath(false);
      else toast(this, 'Respire normalmente por alguns instantes antes de repetir.', 270, 1800);
    }

    // interação
    const near = this.nearest();
    this.hud.setHint(near ? near.label : null);
    if (this.safe) {
      const ret = this.things.find((t) => t.kind === 'return');
      ret?.marker?.setVisible(this.meter.value <= 25);
    }
    if (this.controls.consume('interact') && near && grounded) {
      if (near.kind === 'return' && this.meter.value > 25) {
        toast(this, 'Respire mais um pouco. Quando se sentir calmo(a), é só voltar.', 270, 2600);
      } else {
        near.open();
      }
    }

    // mensagens de acolhimento
    if (this.safe) {
      this.safeMsgT += dt;
      if (this.safeMsgT > 11) { this.safeMsgT = 0; this.sayCalm(Phaser.Utils.Array.GetRandom(SAFE_MESSAGES)); }
    }

    // transições
    if (!this.safe && this.meter.needsRetreat) { this.goSafe(); return; }
    if (!this.safe && this.px >= this.worldW - 330) this.completeLevel();
  }

  private animatePlayer(dir: number, dt: number): void {
    const key = CHARACTERS[this.charIdx].key;
    const air = this.py < GROUND_Y - 2;
    this.player.setFlipX(this.facing < 0);
    this.player.x = this.px;
    this.player.y = this.py;
    if (air) {
      this.player.setTexture(`${key}-andar`);
      this.player.setAngle(this.facing * 4);
      return;
    }
    this.player.setAngle(0);
    if (dir !== 0) {
      this.stepT += dt;
      this.player.setTexture(Math.floor(this.stepT / 0.18) % 2 ? `${key}-andar` : key);
      this.player.y = this.py - Math.abs(Math.sin(this.stepT * 17)) * 7;
      if (Math.floor(this.stepT / 0.18) !== Math.floor((this.stepT - dt) / 0.18)) audio.step();
    } else {
      this.player.setTexture(key);
      this.stepT = 0;
      this.player.setScale(PLAYER_SCALE, PLAYER_SCALE * (1 + Math.sin(this.time.now / 600) * 0.008));
    }
    if (this.invuln > 0) this.player.setAlpha(Math.floor(this.invuln * 12) % 2 ? 0.45 : 1);
    else this.player.setAlpha(1);
  }

  private updateCamera(snap: boolean): void {
    const target = Phaser.Math.Clamp(this.px - 760, 0, this.worldW - W);
    const cam = this.cameras.main;
    cam.scrollX = snap ? target : cam.scrollX + (target - cam.scrollX) * 0.2;
  }

  private updateVignette(): void {
    const b = this.meter.band;
    if (b === 'vermelho') {
      this.vignette.setTint(COLORS.red).setAlpha(0.22 + Math.sin(this.time.now / 260) * 0.08);
    } else if (b === 'amarelo') {
      this.vignette.setTint(COLORS.yellow).setAlpha(0.07);
    } else {
      this.vignette.setAlpha(0);
    }
  }

  private checkClouds(): void {
    for (const c of this.clouds) {
      if (!c.alive) continue;
      const dx = Math.abs(c.x - this.px);
      if (dx < 55 && this.py > c.baseY - 80 && this.invuln <= 0) {
        c.alive = false;
        this.run.cleared.push(c.i);
        this.run.stats.hits++;
        this.invuln = INVULN;
        this.meter.add(this.def.id === 3 ? 13 : 11);
        audio.hit();
        this.cameras.main.shake(120, 0.003);
        this.tweens.killTweensOf(c.s);
        this.tweens.add({ targets: c.s, scale: 0.5, alpha: 0, duration: 450, onComplete: () => c.s.setVisible(false) });
        this.showThought();
      }
    }
  }

  private showThought(): void {
    const th = this.def.thoughts;
    if (!th.length) return;
    const t = Phaser.Utils.Array.GetRandom(th);
    this.thoughtToast?.destroy();
    this.thoughtToast = toast(this, `${t.negative}\n${t.reframe}`, 250, 4800);
  }

  private nearest(): Interactable | null {
    let best: Interactable | null = null;
    let bd = REACH;
    for (const t of this.things) {
      if (t.done()) continue;
      const d = Math.abs(t.x - this.px);
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }

  private sayCalm(msg: string, ms = 4200): void {
    toast(this, msg, 250, ms);
  }

  // ───────────────────────── respiração ─────────────────────────

  private startBreath(long: boolean): void {
    this.mode = 'breath';
    this.controls.clear();
    const o = long ? { cycles: 3, inhale: 4, hold: 2, exhale: 6 } : { cycles: 2, inhale: 3, hold: 2, exhale: 4 };
    this.breath = new BreathingOverlay(this, this.controls, {
      ...o,
      onTick: (ok, dt) => { if (ok) this.meter.add(-(long ? 2.2 : 1.7) * dt); this.hud.setAnxiety(this.meter.value); },
      onDone: (acc) => {
        this.breath = null;
        this.run.stats.breaths++;
        if (acc > 0.7) { this.meter.add(-6); audio.good(); }
        if (!this.safe) this.run.breathCd = BREATH_COOLDOWN;
        this.hud.setAnxiety(this.meter.value);
        this.mode = 'play';
        this.sayCalm(acc > 0.7 ? 'Muito bem. Respirar devagar acalma o corpo.' : 'Boa tentativa. Com a prática, o ritmo fica mais natural.', 3200);
      },
      onCancel: () => { this.breath = null; this.mode = 'play'; },
    });
  }

  // ───────────────────────── interações ─────────────────────────

  private useSpot(sp: SpotDef, i: number): void {
    this.run.spotDone.push(i);
    this.things.find((t) => t.kind === 'spot' && t.x === sp.x)?.marker?.setVisible(false);
    this.meter.add(sp.delta);
    this.run.stats.healthy++;
    audio.good();
    this.hud.setAnxiety(this.meter.value);
    toast(this, sp.message, 250, 4200);
  }

  private openDialogue(n: NpcDef, i: number): void {
    this.mode = 'dialogue';
    this.controls.clear();
    this.hud.setHint(null);
    const c = this.add.container(0, 0).setDepth(200).setScrollFactor(0);
    const dim = this.add.rectangle(960, 540, W, H, 0x000000, 0.25).setInteractive();
    c.add(dim);
    const x = 210, y = 250, w = 1500, h = 640;
    c.add(drawPanel(this, x, y, w, h));
    const tabW = Math.max(280, n.name.length * 28 + 80);
    const tab = this.add.graphics();
    tab.fillStyle(COLORS.outline, 1).fillRoundedRect(x + 60, y - 38, tabW + 10, 84, 22);
    tab.fillStyle(COLORS.brown, 1).fillRoundedRect(x + 65, y - 33, tabW, 74, 18);
    c.add([tab, this.add.text(x + 65 + tabW / 2, y + 4, n.name.toUpperCase(), textStyle(36, HEX.cream)).setOrigin(0.5)]);

    const line = this.add.text(x + 70, y + 90, n.line.replace('{nome}', this.playerName), textStyle(38, HEX.brownDark, { wordWrap: { width: w - 140 }, lineSpacing: 8 }));
    c.add(line);
    this.overlay = c;

    const choiceY0 = y + 270;
    const buttons: Phaser.GameObjects.GameObject[] = [];
    n.choices.forEach((ch, k) => {
      const b = makeButton(this, x + w / 2, choiceY0 + k * 112, w - 160, 96, ch.text, () => {
        buttons.forEach((bb) => bb.destroy());
        this.resolveChoice(n, i, ch, c, line);
      }, 29);
      c.add(b);
      buttons.push(b);
    });
    c.setScrollFactor(0, 0, true);
  }

  private resolveChoice(n: NpcDef, i: number, ch: Choice, c: Phaser.GameObjects.Container, line: Phaser.GameObjects.Text): void {
    this.run.npcDone.push(i);
    this.things.find((t) => t.kind === 'npc' && t.x === n.x)?.marker?.setVisible(false);
    this.meter.add(ch.delta);
    if (ch.healthy) { this.run.stats.healthy++; audio.good(); } else audio.hit();
    this.hud.setAnxiety(this.meter.value);
    line.setText(`${ch.healthy ? '✔ ' : ''}${ch.feedback}`).setColor(ch.healthy ? '#2f5d0a' : HEX.brownDark);
    const next = makeButton(this, 960, 250 + 520, 360, 96, 'CONTINUAR', () => {
      c.destroy();
      this.overlay = null;
      this.mode = 'play';
    }, 36);
    c.add(next);
    c.setScrollFactor(0, 0, true);
  }

  // ───────────────────────── fluxo ─────────────────────────

  private openIntro(): void {
    this.hud.setVisible(false);
    const c = this.add.container(0, 0).setDepth(250).setScrollFactor(0);
    c.add(this.add.rectangle(960, 540, W, H, 0x000000, 0.35).setInteractive());
    c.add(drawPanel(this, 260, 190, 1400, 700));
    c.add(this.add.text(960, 285, this.def.title.toUpperCase(), textStyle(46, HEX.brownDark, { align: 'center' })).setOrigin(0.5));
    c.add(this.add.text(960, 360, `Foco: ${this.def.focus}`, textStyle(30, HEX.brown, { align: 'center', wordWrap: { width: 1200 } })).setOrigin(0.5));
    c.add(this.add.text(960, 560, this.def.intro, { fontFamily: FONT, fontSize: '34px', color: HEX.brownDark, align: 'center', wordWrap: { width: 1180 }, lineSpacing: 12 }).setOrigin(0.5));
    c.add(makeButton(this, 960, 810, 380, 100, 'COMEÇAR', () => {
      c.destroy();
      this.hud.setVisible(true);
      this.run.introDone = true;
      this.mode = 'play';
      this.controls.clear();
    }, 40));
    c.setScrollFactor(0, 0, true);
    this.overlay = c;
  }

  private openPause(): void {
    if (this.mode !== 'play') return;
    this.mode = 'pause';
    this.controls.clear();
    const c = this.add.container(0, 0).setDepth(260).setScrollFactor(0);
    c.add(this.add.rectangle(960, 540, W, H, 0x000000, 0.45).setInteractive());
    c.add(drawPanel(this, 660, 190, 600, this.safe ? 640 : 770));
    c.add(this.add.text(960, 285, 'PAUSADO', textStyle(50)).setOrigin(0.5));
    let y = 410;
    const add = (label: string, cb: () => void) => { c.add(makeButton(this, 960, y, 480, 96, label, cb, 36)); y += 125; };
    add('CONTINUAR', () => { c.destroy(); this.overlay = null; this.mode = 'play'; });
    if (!this.safe) add('ZONA SEGURA', () => { c.destroy(); this.overlay = null; this.mode = 'play'; this.goSafe(true); });
    const snd = makeButton(this, 960, y, 480, 96, audio.muted ? 'SOM: DESLIGADO' : 'SOM: LIGADO', () => { audio.setMuted(!audio.muted); snd.setLabel(audio.muted ? 'SOM: DESLIGADO' : 'SOM: LIGADO'); }, 32);
    c.add(snd); y += 125;
    add('MENU PRINCIPAL', () => { this.scene.start('Menu'); });
    c.setScrollFactor(0, 0, true);
    this.overlay = c;
  }

  private goSafe(voluntary = false): void {
    if (this.mode === 'moving') return;
    this.mode = 'moving';
    this.run.stats.safeVisits++;
    toast(this, voluntary ? 'Vamos fazer uma pausa na Zona Segura.' : 'Você precisa de uma pausa. Vamos para a Zona Segura.', 250, 2200);
    this.cameras.main.fadeOut(900);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Level', { safe: true, level: this.levelIndex, run: this.run, startX: this.px, anxiety: this.meter.value });
    });
  }

  private leaveSafe(): void {
    if (this.mode === 'moving') return;
    this.mode = 'moving';
    this.cameras.main.fadeOut(700);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Level', { level: this.levelIndex, run: this.run, startX: Math.max(360, this.returnX - 350), anxiety: Math.min(this.meter.value, 28) });
    });
  }

  private completeLevel(): void {
    this.mode = 'end';
    this.hud.setHint(null);
    audio.complete();
    const s = this.run.stats;
    const pts = carePoints(s);
    const st = stars(s);
    const prev = loadSave();
    const best = { ...prev.best, [String(this.levelIndex)]: Math.max(prev.best[String(this.levelIndex)] ?? 0, pts) };
    writeSave({ unlocked: Math.min(LEVELS.length, Math.max(prev.unlocked, this.levelIndex + 2)), best });

    const last = this.levelIndex >= LEVELS.length - 1;
    const c = this.add.container(0, 0).setDepth(270).setScrollFactor(0);
    c.add(this.add.rectangle(960, 540, W, H, 0x000000, 0.45).setInteractive());
    c.add(drawPanel(this, 300, 150, 1320, 780));
    c.add(this.add.text(960, 250, `FASE ${this.def.id} CONCLUÍDA!`, textStyle(56)).setOrigin(0.5));
    c.add(this.add.text(960, 350, '★'.repeat(st) + '☆'.repeat(3 - st), { fontFamily: FONT, fontSize: '84px', color: '#d99a00', stroke: HEX.outline, strokeThickness: 6 }).setOrigin(0.5));
    c.add(this.add.text(960, 440, `Pontos de cuidado: ${pts}`, textStyle(44)).setOrigin(0.5));
    c.add(this.add.text(960, 520, `Respirações: ${s.breaths}   ·   Apoio e pausas: ${s.healthy}   ·   Zona Segura: ${s.safeVisits}`, textStyle(28, HEX.brown)).setOrigin(0.5));
    c.add(this.add.text(960, 640, this.def.ending, { fontFamily: FONT, fontSize: '34px', color: HEX.brownDark, align: 'center', wordWrap: { width: 1100 }, lineSpacing: 10 }).setOrigin(0.5));
    c.add(makeButton(this, 760, 835, 420, 100, last ? 'FINALIZAR' : 'PRÓXIMA FASE', () => {
      this.scene.start(last ? 'End' : 'Level', last ? {} : { level: this.levelIndex + 1 });
    }, 36));
    c.add(makeButton(this, 1180, 835, 340, 100, 'MENU', () => this.scene.start('Menu'), 36));
    c.setScrollFactor(0, 0, true);
    this.overlay = c;
  }
}
