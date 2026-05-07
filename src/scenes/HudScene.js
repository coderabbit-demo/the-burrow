import { CONFIG } from '../config.js';

export class HudScene extends Phaser.Scene {
  constructor() { super('HudScene'); }

  create() {
    this.bg = this.add.graphics().setScrollFactor(0).setDepth(1000);
    this.bars = this.add.graphics().setScrollFactor(0).setDepth(1001);
    this.bossBars = this.add.graphics().setScrollFactor(0).setDepth(1001);

    this.runeText = this.add.text(CONFIG.GAME_W - 8, 6, '0', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#c9a449',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(1002);

    this.runeIcon = this.add.image(CONFIG.GAME_W - 36, 11, 'item_rune_shard')
      .setScrollFactor(0).setDepth(1002).setOrigin(0, 0).setScale(0.9);

    this.flaskText = this.add.text(8, 28, 'x3', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#c9a449',
    }).setScrollFactor(0).setDepth(1002);

    this.flaskIcon = this.add.image(28, 32, 'item_carrot_flask')
      .setScrollFactor(0).setDepth(1002).setOrigin(0, 0.5).setScale(1);

    this.bossLabel = this.add.text(CONFIG.GAME_W / 2, CONFIG.GAME_H - 28, 'THE DEVOURER', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#c1474d',
      letterSpacing: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002).setVisible(false);

    this.bossActive = false;

    this.game.events.on('hudUpdate', (data) => this._render(data));
    this.game.events.on('bossActive', (boss) => {
      this.bossActive = !!boss;
      this.bossLabel.setVisible(!!boss);
    });
  }

  _render(d) {
    if (!d) return;

    const W = CONFIG.GAME_W;
    this.bg.clear();
    this.bars.clear();

    // HP bar
    const hpW = 120;
    this.bg.fillStyle(0x0b0a10, 0.85);
    this.bg.fillRect(6, 6, hpW + 4, 8);
    this.bg.lineStyle(1, 0x5a4a6b, 1);
    this.bg.strokeRect(6, 6, hpW + 4, 8);
    const hpFrac = Math.max(0, d.hp / d.hpMax);
    this.bars.fillStyle(0xc1474d, 1);
    this.bars.fillRect(8, 8, hpW * hpFrac, 4);
    this.bars.fillStyle(0x7a1f24, 1);
    this.bars.fillRect(8, 12, hpW * hpFrac, 1);

    // Stamina bar
    const stW = 90;
    this.bg.fillStyle(0x0b0a10, 0.85);
    this.bg.fillRect(6, 16, stW + 4, 5);
    this.bg.lineStyle(1, 0x5a4a6b, 1);
    this.bg.strokeRect(6, 16, stW + 4, 5);
    const stFrac = Math.max(0, d.stamina / d.staminaMax);
    this.bars.fillStyle(0xc9a449, 1);
    this.bars.fillRect(8, 17, stW * stFrac, 2);

    // Runes
    this.runeText.setText(String(d.runes));
    this.flaskText.setText('x' + d.flasks);

    // Boss bar
    this.bossBars.clear();
    if (d.bossActive) {
      const bw = 220;
      const bx = (W - bw) / 2;
      const by = CONFIG.GAME_H - 16;
      this.bg.fillStyle(0x0b0a10, 0.9);
      this.bg.fillRect(bx - 2, by - 2, bw + 4, 6);
      this.bg.lineStyle(1, 0x7a1f24, 1);
      this.bg.strokeRect(bx - 2, by - 2, bw + 4, 6);
      const f = Math.max(0, d.bossHp / d.bossHpMax);
      this.bossBars.fillStyle(0x7a1f24, 1);
      this.bossBars.fillRect(bx, by, bw * f, 2);
      this.bossBars.fillStyle(0xc1474d, 1);
      this.bossBars.fillRect(bx, by + 1, bw * f, 1);
    }
  }
}
