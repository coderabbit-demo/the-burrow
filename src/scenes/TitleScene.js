import { CONFIG } from '../config.js';
import { Audio } from '../systems/audio.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    const { GAME_W, GAME_H } = CONFIG;
    this.cameras.main.setBackgroundColor('#04030a');

    // Vignette
    const g = this.add.graphics();
    for (let i = 0; i < 30; i++) {
      g.lineStyle(1, 0x000000, 0.05);
      g.strokeRect(i, i, GAME_W - i * 2, GAME_H - i * 2);
    }

    // Title
    this.add.text(GAME_W / 2, GAME_H / 2 - 40, 'THE BURROW', {
      fontFamily: 'Courier New, monospace',
      fontSize: '32px',
      color: '#c9a449',
      stroke: '#0b0a10',
      strokeThickness: 4,
      letterSpacing: 6,
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, GAME_H / 2 - 12, 'a coderabbit tale', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#7d6b8a',
      letterSpacing: 4,
    }).setOrigin(0.5);

    const prompt = this.add.text(GAME_W / 2, GAME_H / 2 + 30, '[ENTER] to descend', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#a89bb0',
    }).setOrigin(0.5);

    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 900, yoyo: true, repeat: -1 });

    this.add.text(GAME_W / 2, GAME_H - 26, 'WASD move  ·  J light  ·  K heavy  ·  Shift roll  ·  L lock-on  ·  F flask  ·  E rest', {
      fontFamily: 'Courier New, monospace',
      fontSize: '8px',
      color: '#5a4a6b',
    }).setOrigin(0.5);

    // Render rabbit + boss tiny icons
    this.add.image(GAME_W / 2 - 80, GAME_H / 2 + 70, 'rabbit_idle_down_1').setScale(2);
    this.add.image(GAME_W / 2 + 80, GAME_H / 2 + 70, 'boss_idle_1').setScale(0.8);

    // Decorative grace lantern
    this.gItem = this.add.image(GAME_W / 2, GAME_H / 2 + 70, 'item_grace_1').setScale(1.2);
    this.time.addEvent({ delay: 220, loop: true, callback: () => {
      const f = (this.gFrame = (this.gFrame || 0) + 1);
      this.gItem.setTexture(`item_grace_${(f % 3) + 1}`);
    }});

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
