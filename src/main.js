import { CONFIG } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { AreaScene } from './scenes/AreaScene.js';
import { HudScene } from './scenes/HudScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: CONFIG.GAME_W,
  height: CONFIG.GAME_H,
  zoom: CONFIG.SCALE,
  pixelArt: true,
  backgroundColor: '#06050a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, AreaScene, HudScene],
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
