import { addSpriteTexture } from '../sprites/spriteFactory.js';
import { RABBIT, GRUB, SPIDER, BOSS, PROPS, ITEMS, TILES } from '../sprites/spriteData.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // No external assets — everything is generated.
  }

  create() {
    // Register all sprites as canvas textures under predictable keys.
    this._registerGroup('rabbit', RABBIT);
    this._registerGroup('grub', GRUB);
    this._registerGroup('spider', SPIDER);
    this._registerGroup('boss', BOSS);
    this._registerGroup('prop', PROPS);
    this._registerGroup('item', ITEMS);
    this._registerGroup('tile', TILES);

    // Procedural single-pixel and small textures for projectiles, fog, etc.
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
    const c = document.createElement('canvas');
    c.width = 8; c.height = 8;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, '#f0d76a');
    g.addColorStop(0.5, '#7a1f24');
    g.addColorStop(1, 'rgba(122,31,36,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(4, 4, 4, 0, Math.PI * 2);
    ctx.fill();
    this.textures.addCanvas('proj_ichor', c);
  }

  _buildFogTexture() {
    const c = document.createElement('canvas');
    const w = 64, h = 96;
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(50,30,80,0.0)');
    g.addColorStop(0.5, 'rgba(80,50,120,0.6)');
    g.addColorStop(1, 'rgba(50,30,80,0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    this.textures.addCanvas('fog_gate', c);
  }

  _buildSlamTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,200,100,0.9)');
    g.addColorStop(0.5, 'rgba(193,71,77,0.5)');
    g.addColorStop(1, 'rgba(193,71,77,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();
    this.textures.addCanvas('slam_ring', c);
  }
}
