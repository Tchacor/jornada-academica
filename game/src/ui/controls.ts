import Phaser from 'phaser';

export type Action = 'jump' | 'interact' | 'breath' | 'pause';

/** Entrada unificada: teclado + botões de toque. */
export class Controls {
  private held = { left: false, right: false };
  private touch = { left: false, right: false };
  private queued: Record<Action, boolean> = { jump: false, interact: false, breath: false, pause: false };
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};

  constructor(private scene: Phaser.Scene) {
    scene.input.addPointer(3);
    const kb = scene.input.keyboard;
    if (!kb) return;
    const K = Phaser.Input.Keyboard.KeyCodes;
    const add = (n: string, code: number) => (this.keys[n] = kb.addKey(code, true, false));
    add('left', K.LEFT); add('a', K.A); add('right', K.RIGHT); add('d', K.D);
    add('up', K.UP); add('w', K.W); add('space', K.SPACE);
    add('e', K.E); add('enter', K.ENTER);
    add('b', K.B); add('r', K.R);
    add('p', K.P); add('esc', K.ESC);

    const on = (names: string[], a: Action) =>
      names.forEach((n) => this.keys[n].on('down', () => (this.queued[a] = true)));
    on(['up', 'w', 'space'], 'jump');
    on(['e', 'enter'], 'interact');
    on(['b', 'r'], 'breath');
    on(['p', 'esc'], 'pause');
  }

  get left(): boolean {
    return this.touch.left || !!(this.keys.left?.isDown || this.keys.a?.isDown);
  }
  get right(): boolean {
    return this.touch.right || !!(this.keys.right?.isDown || this.keys.d?.isDown);
  }
  /** Segurar espaço no minijogo de respiração. */
  get spaceHeld(): boolean {
    return !!this.keys.space?.isDown;
  }

  setTouch(dir: 'left' | 'right', down: boolean): void {
    this.touch[dir] = down;
  }

  press(a: Action): void {
    this.queued[a] = true;
  }

  consume(a: Action): boolean {
    const v = this.queued[a];
    this.queued[a] = false;
    return v;
  }

  clear(): void {
    this.queued = { jump: false, interact: false, breath: false, pause: false };
    this.touch = { left: false, right: false };
  }
}
