import { CONFIG } from '../config.js';

const FONT = 'Courier New, monospace';
const TYPE_INTERVAL = 24;
const BORDER_ACCENT = 0x9a795e;

export class DialogueScene extends Phaser.Scene {
  constructor() {
    super('DialogueScene');
  }

  create({ title = '', text = '' } = {}) {
    const { GAME_W, GAME_H } = CONFIG;
    const width = Math.min(380, GAME_W - 32);
    const left = Math.floor((GAME_W - width) / 2);
    const right = left + width;
    const bottom = GAME_H - 16;
    const textLeft = left + 78;
    const textRight = right - 15;

    const frame = this.add.graphics();
    const body = this.add.text(textLeft, 0, '', {
      fontFamily: FONT, fontSize: '13px', color: '#d8cfd9',
      wordWrap: { width: textRight - textLeft, useAdvancedWrap: true },
    }).setLineSpacing(3);
    const wrapped = body.getWrappedText(text).join('\n');
    body.setWordWrapWidth(0).setText(wrapped);
    const height = Math.max(104, body.height + 69);
    const top = bottom - height;
    body.setY(top + 38).setText('');

    this._drawFrame(frame, left, top, width, height, textLeft, textRight);
    this.add.image(left + 39, top + 42, 'prop_tombstone').setScale(2);
    this.add.text(textLeft, top + 10, title, {
      fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#c9a449',
    });
    const cue = this.add.text(textRight, bottom - 13, 'E / Enter  Reveal   Esc  Close', {
      fontFamily: FONT, fontSize: '10px', color: '#a89bb0',
    }).setOrigin(1, 0.5);

    const characters = Array.from(wrapped);
    let revealed = 0;
    let timer;
    let closing = false;

    const finishReveal = () => {
      timer?.remove();
      revealed = characters.length;
      body.setText(wrapped);
      cue.setText('E / Enter / Esc  Close');
    };
    const close = (event) => {
      if (event.repeat || closing) return;
      closing = true;
      this.scene.stop();
      this.scene.resume('AreaScene');
    };
    const advance = (event) => {
      if (event.repeat || closing) return;
      if (revealed < characters.length) finishReveal();
      else close(event);
    };

    if (characters.length) {
      timer = this.time.addEvent({
        delay: TYPE_INTERVAL,
        repeat: characters.length - 1,
        callback: () => {
          revealed += 1;
          if (revealed === characters.length) finishReveal();
          else body.setText(characters.slice(0, revealed).join(''));
        },
      });
    } else {
      finishReveal();
    }

    const keyboard = this.input.keyboard;
    keyboard.on('keydown-E', advance);
    keyboard.on('keydown-ENTER', advance);
    keyboard.on('keydown-ESC', close);
    this.events.once('shutdown', () => {
      keyboard.off('keydown-E', advance);
      keyboard.off('keydown-ENTER', advance);
      keyboard.off('keydown-ESC', close);
      timer?.remove();
    });
  }

  _drawFrame(frame, left, top, width, height, textLeft, textRight) {
    const { HUD_BG, HUD_FRAME } = CONFIG.COLORS;
    const right = left + width;
    const bottom = top + height;
    frame.fillStyle(0x080811, 0.85).fillRect(left + 2, top + 3, width, height);
    frame.fillStyle(HUD_FRAME).fillRect(left + 1, top, width - 2, height);
    frame.fillRect(left, top + 1, width, height - 2);
    frame.fillStyle(HUD_BG).fillRect(left + 1, top + 1, width - 2, height - 2);
    frame.fillStyle(0x151421).fillRect(left + 3, top + 3, width - 6, height - 6);
    frame.fillStyle(BORDER_ACCENT);
    frame.fillRect(left + 1, top, 10, 1);
    frame.fillRect(left, top + 1, 1, 5);
    frame.fillRect(right - 11, bottom - 1, 10, 1);
    frame.fillRect(right - 1, bottom - 6, 1, 5);

    frame.fillStyle(HUD_FRAME).fillRect(left + 14, top + 14, 50, 56);
    frame.fillStyle(HUD_BG).fillRect(left + 15, top + 15, 48, 54);
    frame.fillStyle(0x211b2b).fillRect(left + 18, top + 18, 42, 48);
    frame.fillStyle(0x332a40).fillRect(left + 21, top + 56, 36, 1);
    frame.fillStyle(HUD_FRAME).fillRect(textLeft, top + 31, textRight - textLeft, 1);
    frame.fillStyle(0x332a40).fillRect(textLeft, bottom - 24, textRight - textLeft, 1);
  }
}
