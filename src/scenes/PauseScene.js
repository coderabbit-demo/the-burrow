import { CONFIG } from '../config.js';
import { Audio } from '../systems/audio.js';

const FONT = 'Courier New, monospace';
const GOLD = '#c9a449';
const MUTED_TEXT = '#a89bb0';

export class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create() {
    const { GAME_W, GAME_H } = CONFIG;
    const x = GAME_W / 2;
    const y = GAME_H / 2;

    this.add.rectangle(x, y, GAME_W, GAME_H, 0x06050a, 0.68);
    this._addFrame(x, y, 230, 156, CONFIG.COLORS.HUD_FRAME, CONFIG.COLORS.HUD_BG);
    this.add.text(x, y - 53, 'PAUSED', {
      fontFamily: FONT, fontSize: '23px', color: GOLD, letterSpacing: 5,
    }).setOrigin(0.5);
    this.add.rectangle(x, y - 31, 176, 1, CONFIG.COLORS.HUD_FRAME);

    this.highlight = this._addFrame(x, y - 11, 176, 22, CONFIG.COLORS.RUNE, 0x282035);
    this.options = ['Resume', Audio.isMuted() ? 'Audio off' : 'Audio on'].map((label, index) => (
      this.add.text(x, y - 11 + index * 26, label, {
        fontFamily: FONT, fontSize: '13px', color: MUTED_TEXT,
      }).setOrigin(0.5)
    ));
    this._select(0);

    this.add.text(x, y + 51, '↑ ↓ Move   Enter Select   Esc Resume', {
      fontFamily: FONT, fontSize: '9px', color: MUTED_TEXT,
    }).setOrigin(0.5);

    const keyboard = this.input.keyboard;
    keyboard.on('keydown-UP', () => this._select(0));
    keyboard.on('keydown-DOWN', () => this._select(1));
    keyboard.on('keydown-ENTER', (event) => {
      if (event.repeat) return;
      if (this.selected === 0) {
        this._resume();
        return;
      }
      this.options[1].setText(Audio.toggleMute() ? 'Audio off' : 'Audio on');
      Audio.play('menu_select');
    });
    keyboard.on('keydown-ESC', (event) => {
      if (!event.repeat) this._resume();
    });
  }

  _addFrame(x, y, width, height, borderColor, fillColor) {
    const left = -width / 2;
    const top = -height / 2;
    return this.add.graphics().setPosition(x, y)
      .fillStyle(borderColor).fillRect(left, top, width, height)
      .fillStyle(fillColor).fillRect(left + 1, top + 1, width - 2, height - 2);
  }

  _select(index) {
    this.selected = index;
    this.highlight.setY(this.options[index].y);
    this.options.forEach((option, i) => option.setColor(i === index ? GOLD : MUTED_TEXT));
  }

  _resume() {
    Audio.play('menu_select');
    this.scene.resume('AreaScene');
    this.scene.stop();
  }
}
