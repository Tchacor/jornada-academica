import Phaser from 'phaser';
import { H, W } from './config';
import { Boot } from './scenes/Boot';
import { CharacterSelect } from './scenes/CharacterSelect';
import { End } from './scenes/End';
import { Level } from './scenes/Level';
import { LevelSelect } from './scenes/LevelSelect';
import { Menu } from './scenes/Menu';
import { Settings } from './scenes/Settings';
import { audio } from './systems/audio';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#2b1608',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, roundPixels: false },
  input: { activePointers: 4 },
  scene: [Boot, Menu, CharacterSelect, Settings, LevelSelect, Level, End],
});

// políticas de autoplay: o áudio só liga após um gesto do usuário
window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
window.addEventListener('keydown', () => audio.unlock(), { once: true });

declare global {
  interface Window { __game?: Phaser.Game }
}
window.__game = game;
