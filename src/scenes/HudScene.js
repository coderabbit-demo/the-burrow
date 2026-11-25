import { CONFIG } from '../config.js';

const FRAME = {
  shadow: 0x080811,
  ground: 0x151421,
  line: 0x4b405a,
  corner: 0x9a795e,
};

const HEALTH = [0x7a1f24, 0xc1474d, 0xee8d86];
const STAMINA = [0x725339, 0xc9a449, 0xf0d76a];
const BOSS_HEALTH = [0x541934, 0xa63b51, 0xe77376];

export class HudScene extends Phaser.Scene {
  constructor() { super('HudScene'); }

  create() {
    const { GAME_W, GAME_H } = CONFIG;
    const chrome = this.add.graphics();
    this.meters = this.add.graphics();
    this.boss = this.add.graphics();

    this._frame(chrome, 8, 8, 148, 40);
    this._frame(chrome, GAME_W - 87, 8, 79, 23);
    this._track(chrome, 36, 14, 111, 7);
    this._track(chrome, 36, 25, 88, 5);
    chrome.lineStyle(1, FRAME.line, 1);
    chrome.strokeRect(54.5, 34.5, 11, 9);

    this._text(15, 17, 'HP', '#e79a98');
    this._text(15, 27, 'STA', '#dfc57e');

    this.add.image(20, 39, 'item_carrot_flask');
    this.flaskText = this._text(30, 39, '×3', '#e6c697');
    this._text(60, 39, 'F', '#b8abc5').setOrigin(0.5);

    this.add.image(GAME_W - 75, 19, 'item_rune_shard');
    this.runeText = this._text(GAME_W - 14, 19, '0', '#edca88', 11).setOrigin(1, 0.5);

    this.bossLabel = this._text(GAME_W / 2, GAME_H - 30, 'THE DEVOURER', '#f0b2b1', 10)
      .setOrigin(0.5).setLetterSpacing(3).setVisible(false);

    this._render({ hp: 1, hpMax: 1, stamina: 1, staminaMax: 1, runes: 0, flasks: CONFIG.PLAYER.FLASK_MAX });
    this.game.events.on('hudUpdate', this._render, this);
    this.events.once('shutdown', () => this.game.events.off('hudUpdate', this._render, this));
  }

  _text(x, y, label, color, size = 8) {
    return this.add.text(x, y, label, {
      fontFamily: 'Courier New, monospace',
      fontSize: `${size}px`,
      color,
    }).setOrigin(0, 0.5);
  }

  _frame(g, x, y, w, h) {
    g.fillStyle(FRAME.shadow, 0.85);
    g.fillRect(x + 1, y + 2, w, h);
    g.fillStyle(FRAME.line, 1);
    g.fillRect(x + 1, y, w - 2, h);
    g.fillRect(x, y + 1, w, h - 2);
    g.fillStyle(FRAME.ground, 1);
    g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle(FRAME.corner, 1);
    g.fillRect(x + 1, y, 5, 1);
    g.fillRect(x, y + 1, 1, 3);
    g.fillRect(x + w - 6, y + h - 1, 5, 1);
    g.fillRect(x + w - 1, y + h - 4, 1, 3);
  }

  _track(g, x, y, w, h) {
    g.fillStyle(FRAME.line, 1);
    g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle(FRAME.shadow, 1);
    g.fillRect(x, y, w, h);
  }

  _meter(g, x, y, w, h, value, max, [shadow, color, glint]) {
    const fill = Math.round(w * Phaser.Math.Clamp(value / max, 0, 1));
    if (!fill) return;
    g.fillStyle(shadow, 1);
    g.fillRect(x, y, fill, h);
    g.fillStyle(color, 1);
    g.fillRect(x, y, fill, h - 1);
    g.fillStyle(glint, 1);
    g.fillRect(x, y, fill, 1);
  }

  _render(d) {
    if (!d) return;

    this.meters.clear();
    this._meter(this.meters, 36, 14, 111, 7, d.hp, d.hpMax, HEALTH);
    this._meter(this.meters, 36, 25, 88, 5, d.stamina, d.staminaMax, STAMINA);
    this.runeText.setText(String(d.runes));
    this.flaskText.setText(`×${d.flasks}`).setColor(d.flasks ? '#e6c697' : '#a99bb5');

    this.boss.clear();
    this.bossLabel.setVisible(!!d.bossActive);
    if (d.bossActive) {
      const width = 218;
      const x = (CONFIG.GAME_W - width) / 2;
      const y = CONFIG.GAME_H - 20;
      this._frame(this.boss, x - 8, y - 20, width + 16, 32);
      this._track(this.boss, x, y, width, 6);
      this._meter(this.boss, x, y, width, 6, d.bossHp, d.bossHpMax, BOSS_HEALTH);
    }
  }
}
