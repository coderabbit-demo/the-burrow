import { CONFIG } from '../config.js';
import { Audio } from '../systems/audio.js';
import { paintTitleIllustration } from './titleIllustration.js';

import { animateDevourer } from './titleDevourer.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    const { GAME_W, GAME_H } = CONFIG;
    this.cameras.main.setBackgroundColor('#0d0c17');
    paintTitleIllustration(this.textures);
    this.add.image(0, 0, 'title_illustration').setOrigin(0).setDisplaySize(GAME_W, GAME_H);

    animateDevourer(this);
    this.add.image(0, 0, 'title_foreground').setOrigin(0).setDisplaySize(GAME_W, GAME_H);

    const inks = this.add.graphics();
    inks.fillStyle(0x0d0c17, 1);
    inks.fillRect(0, 282, GAME_W, GAME_H - 282);
    inks.fillStyle(0x3d3146, 1);
    inks.fillRect(16, 282, GAME_W - 32, 1);
    inks.fillStyle(0x8a6556, 1);
    inks.fillRect(38, 99, 34, 1);
    inks.fillRect(38, 159, 16, 1);
    inks.fillStyle(0x3d3146, 1);
    inks.fillRect(58, 159, 118, 1);

    const type = { fontFamily: 'Courier New, monospace' };
    this.add.text(38, 78, 'T H E', { ...type, fontSize: '14px', color: '#dcc499' });
    this.add.text(38, 143, 'A CODERABBIT TALE', {
      ...type, fontSize: '10px', color: '#a395b3', letterSpacing: 2,
    });

    inks.fillStyle(0x0a0912, 1);
    inks.fillRect(38, 190, 48, 18);
    inks.lineStyle(1, 0x9b7858, 1);
    inks.strokeRect(38.5, 190.5, 47, 17);
    this.add.text(62, 199, 'ENTER', {
      ...type, fontSize: '10px', color: '#f0d5a5',
    }).setOrigin(0.5);
    this.add.text(95, 199, 'Descend', {
      ...type, fontSize: '12px', color: '#ddd0d6',
    }).setOrigin(0, 0.5);

    this.add.text(GAME_W / 2, 292, 'WASD / arrows move   J light   K heavy   Shift roll   L lock-on', {
      ...type, fontSize: '10px', color: '#c4b5cb',
    }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 305, 'Tab cycle target   F flask   E interact   M mute', {
      ...type, fontSize: '10px', color: '#b8aac4',
    }).setOrigin(0.5);

    const embers = [[432, 200], [423, 190], [439, 187], [419, 178], [429, 169]];
    for (const [i, [x, y]] of embers.entries()) {
      const ember = this.add.rectangle(x, y, 2, 2, i % 2 ? 0xc09264 : 0xf3cc84)
        .setOrigin(0).setAlpha(0);
      this.tweens.add({
        targets: ember, y: y - 8, alpha: 0.75, duration: 950 + i * 110,
        delay: i * 270, hold: 90, yoyo: true, repeat: -1,
      });
    }

    this.input.keyboard.on('keydown-ENTER', () => this._begin());
    this.input.keyboard.on('keydown-SPACE', () => this._begin());
  }

  _begin() {
    Audio.init();
    Audio.play('menu_select');
    this.scene.start('AreaScene', { mapKey: 'area1' });
    this.scene.launch('HudScene');
  }
}
