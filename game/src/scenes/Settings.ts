import Phaser from 'phaser';
import { W } from '../config';
import { audio } from '../systems/audio';
import { loadSave, resetSave } from '../systems/save';
import { drawPanel, makeButton, textStyle } from '../ui/kit';
import { menuBackdrop, menuLogo } from './Menu';

export class Settings extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  create(): void {
    menuBackdrop(this);
    drawPanel(this, 610, 230, 700, 720);
    menuLogo(this, 215);
    this.add.text(W / 2, 380, 'CONFIGURAÇÕES', textStyle(36)).setOrigin(0.5);

    const vol = this.add.text(W / 2, 500, '', textStyle(40)).setOrigin(0.5);
    const refresh = () => vol.setText(`Volume: ${Math.round(loadSave().volume * 100)}%`);
    refresh();
    makeButton(this, 760, 500, 90, 90, '−', () => { audio.setVolume(loadSave().volume - 0.1); refresh(); }, 52);
    makeButton(this, 1160, 500, 90, 90, '+', () => { audio.setVolume(loadSave().volume + 0.1); refresh(); }, 52);

    const mute = makeButton(this, W / 2, 620, 480, 90, '', () => { audio.setMuted(!audio.muted); mute.setLabel(audio.muted ? 'SOM: DESLIGADO' : 'SOM: LIGADO'); }, 34);
    mute.setLabel(audio.muted ? 'SOM: DESLIGADO' : 'SOM: LIGADO');

    let armed = false;
    const reset = makeButton(this, W / 2, 735, 480, 90, 'APAGAR PROGRESSO', () => {
      if (!armed) { armed = true; reset.setLabel('CLIQUE DE NOVO'); return; }
      resetSave();
      this.scene.start('Menu');
    }, 32);

    makeButton(this, W / 2, 860, 360, 90, 'VOLTAR', () => this.scene.start('Menu'), 38);
    this.cameras.main.fadeIn(250);
  }
}
