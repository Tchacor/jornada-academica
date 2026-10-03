import Phaser from 'phaser';
import { DISCLAIMER, FONT, HEX, W } from '../config';
import { audio } from '../systems/audio';
import { loadSave } from '../systems/save';
import { drawPanel, makeButton, textStyle } from '../ui/kit';
import { menuBackdrop } from './Menu';

export class End extends Phaser.Scene {
  constructor() {
    super('End');
  }

  create(): void {
    menuBackdrop(this);
    audio.setAmbience('safe');
    const s = loadSave();
    const total = Object.values(s.best).reduce((a, b) => a + b, 0);
    drawPanel(this, 340, 130, 1240, 820);
    this.add.text(W / 2, 240, 'JORNADA CONCLUÍDA!', textStyle(60)).setOrigin(0.5);
    this.add.text(W / 2, 360, `Parabéns${s.name ? ', ' + s.name : ''}!`, textStyle(44, HEX.brown)).setOrigin(0.5);
    this.add
      .text(
        W / 2,
        520,
        'Você atravessou o primeiro dia, a apresentação, o TCC e a formatura.\n' +
          'A ansiedade pode voltar em outros momentos — e agora você conhece formas de cuidar dela:\n' +
          'respirar, fazer pausas, dividir tarefas e pedir apoio.',
        { fontFamily: FONT, fontSize: '32px', color: HEX.brownDark, align: 'center', wordWrap: { width: 1050 }, lineSpacing: 12 },
      )
      .setOrigin(0.5);
    this.add.text(W / 2, 685, `Pontos de cuidado: ${total}`, textStyle(42)).setOrigin(0.5);
    this.add.text(W / 2, 770, DISCLAIMER, { fontFamily: FONT, fontSize: '22px', color: HEX.brown, align: 'center', wordWrap: { width: 1050 } }).setOrigin(0.5);
    makeButton(this, W / 2, 880, 420, 100, 'MENU PRINCIPAL', () => this.scene.start('Menu'), 36);
    audio.complete();
    this.cameras.main.fadeIn(500);
  }
}
