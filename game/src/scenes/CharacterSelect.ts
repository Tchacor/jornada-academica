import Phaser from 'phaser';
import { CHARACTERS, FONT, HEX, W } from '../config';
import { audio } from '../systems/audio';
import { loadSave, writeSave } from '../systems/save';
import { drawPanel, makeButton, textStyle } from '../ui/kit';
import { menuBackdrop, menuLogo } from './Menu';

export class CharacterSelect extends Phaser.Scene {
  private idx = 0;
  private name = '';
  private sprite!: Phaser.GameObjects.Image;
  private nameText!: Phaser.GameObjects.Text;

  constructor() {
    super('CharacterSelect');
  }

  create(): void {
    const s = loadSave();
    this.idx = s.character;
    this.name = s.name;
    menuBackdrop(this);

    drawPanel(this, 660, 230, 600, 700);
    menuLogo(this, 215);
    this.add.text(W / 2, 370, 'SELECIONE UM PERSONAGEM', textStyle(32)).setOrigin(0.5);

    this.sprite = this.add.image(W / 2, 770, CHARACTERS[this.idx].key).setOrigin(0.5, 1).setScale(0.29);
    this.arrow(735, 590, 'ic-seta-esq', -1);
    this.arrow(1185, 590, 'ic-seta-dir', 1);

    const edit = this.add.container(W / 2, 810);
    this.nameText = this.add.text(20, 0, '', textStyle(42)).setOrigin(0.5);
    const pen = this.add.image(-150, 0, 'ic-editar').setScale(0.28);
    edit.add([pen, this.nameText]).setSize(420, 70).setInteractive({ useHandCursor: true });
    edit.on('pointerup', () => { audio.click(); this.askName(); });
    this.refreshName();

    makeButton(this, W / 2, 925, 360, 100, 'CONFIRMAR', () => {
      writeSave({ character: this.idx, name: this.name.trim() });
      this.scene.start('Menu');
    }, 38).setDepth(8);

    this.cameras.main.fadeIn(250);
  }

  private arrow(x: number, y: number, key: string, dir: number): void {
    const a = this.add.image(x, y, key).setScale(0.55).setInteractive({ useHandCursor: true });
    a.on('pointerup', () => {
      audio.unlock();
      audio.click();
      this.idx = (this.idx + dir + CHARACTERS.length) % CHARACTERS.length;
      this.sprite.setTexture(CHARACTERS[this.idx].key);
      this.tweens.add({ targets: this.sprite, scale: { from: 0.27, to: 0.29 }, duration: 160 });
    });
  }

  private refreshName(): void {
    this.nameText.setText(this.name.trim() ? this.name.toUpperCase() : 'SEU NOME');
  }

  /** Campo de texto HTML sobre o jogo (funciona bem em celular). */
  private askName(): void {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:20';
    const box = document.createElement('form');
    box.style.cssText = `background:${HEX.beige};border:6px solid ${HEX.brown};border-radius:24px;padding:24px;display:flex;flex-direction:column;gap:14px;font-family:${FONT};color:${HEX.brownDark};min-width:min(80vw,380px)`;
    box.innerHTML = '<b style="font-size:22px">Como devemos te chamar?</b>';
    const input = document.createElement('input');
    input.maxLength = 14;
    input.value = this.name;
    input.placeholder = 'Seu nome';
    input.style.cssText = `font:700 24px ${FONT};padding:10px 14px;border-radius:14px;border:3px solid ${HEX.brown};background:#fff8ee;color:${HEX.brownDark}`;
    const ok = document.createElement('button');
    ok.type = 'submit';
    ok.textContent = 'OK';
    ok.style.cssText = `font:700 22px ${FONT};padding:10px;border-radius:999px;border:3px solid ${HEX.outline};background:${HEX.brown};color:${HEX.cream};cursor:pointer`;
    box.append(input, ok);
    wrap.append(box);
    document.body.append(wrap);
    input.focus();
    const close = () => wrap.remove();
    box.onsubmit = (e) => {
      e.preventDefault();
      this.name = input.value.replace(/[<>]/g, '').slice(0, 14);
      this.refreshName();
      close();
    };
    wrap.onclick = (e) => { if (e.target === wrap) close(); };
  }
}
