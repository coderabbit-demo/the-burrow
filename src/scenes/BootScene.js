import { addSpriteTexture } from '../sprites/spriteFactory.js';
import { RABBIT, GRUB, SPIDER, BOSS, PROPS, ITEMS, TILES } from '../sprites/spriteData.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this._registerGroup('rabbit', RABBIT);
    this._registerGroup('grub', GRUB);
    this._registerGroup('spider', SPIDER);
    this._registerGroup('boss', BOSS);
    this._registerGroup('prop', PROPS);
    this._registerGroup('item', ITEMS);
    this._registerGroup('tile', TILES);

    this._buildProjectileTexture();
    this._buildFogTexture();
    this._buildSlamTexture();

    this.scene.start('TitleScene');
  }

  _registerGroup(prefix, group) {
    for (const [name, rows] of Object.entries(group)) {
      const key = `${prefix}_${name}`;
      addSpriteTexture(this, key, rows);
    }
  }

  _buildProjectileTexture() {
    addSpriteTexture(this, 'proj_ichor', [
      '........',
      '...aa...',
      '..abfa..',
      '.abffba.',
      '.abebba.',
      '..abba..',
      '...aa...',
      '........',
    ]);
  }

  _buildFogTexture() {
    const texture = this.textures.createCanvas('fog_gate', 64, 96);
    const ctx = texture.getContext();
    const bands = [
      [24, 4, 14, 0.27], [31, 7, 21, 0.31], [37, 3, 15, 0.33],
      [18, 2, 19, 0.17], [44, 3, 17, 0.22], [28, 2, 9, 0.44],
    ];
    const veil = ctx.createLinearGradient(0, 0, 64, 0);
    veil.addColorStop(0, 'rgba(50,42,77,0)');
    veil.addColorStop(0.5, 'rgba(90,76,123,0.4)');
    veil.addColorStop(1, 'rgba(50,42,77,0)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, 64, 96);

    for (const [x, width, wave, opacity] of bands) {
      for (let y = 0; y < 96; y += 2) {
        const drift = Math.round(Math.sin(y / wave + x) * 4 + Math.sin(y / 11 + x) * 2);
        const fade = Math.min(1, (y + 4) / 16, (96 - y) / 20);
        ctx.fillStyle = `rgba(156,137,184,${opacity * fade})`;
        ctx.fillRect(x + drift, y, width, 2);
        if ((y + x) % 10 < 2) {
          ctx.fillStyle = `rgba(205,188,218,${opacity * fade * 0.5})`;
          ctx.fillRect(x + drift - 1, y, 2, 1);
        }
      }
    }
    texture.refresh();
  }

  _buildSlamTexture() {
    const texture = this.textures.createCanvas('slam_ring', 64, 64);
    const ctx = texture.getContext();
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const dx = x - 31.5;
        const dy = y - 31.5;
        const radius = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const rim = 25 + 1.5 * Math.sin(angle * 9) + Math.cos(angle * 15);
        if (radius >= rim - 1 && radius < rim + 1) {
          ctx.fillStyle = radius < rim ? '#ea8b6e' : '#a83851';
        } else if (radius >= rim - 4 && radius < rim - 1) {
          ctx.fillStyle = 'rgba(148,35,62,0.55)';
        } else if (radius >= rim + 2 && radius < 32 && (x * 17 + y * 13) % 19 === 0) {
          ctx.fillStyle = '#ce6258';
        } else {
          continue;
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    texture.refresh();
  }
}
