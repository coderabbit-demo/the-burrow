import { CONFIG } from '../config.js';

// A radial dark overlay rendered to a separate render texture. Bright spots
// (player light, lantern lights) "cut" holes in the dark by drawing additive
// gradient circles. We then draw the overlay on top of the world at high depth.

export class LightingLayer {
  constructor(scene) {
    this.scene = scene;
    this.rt = scene.add.renderTexture(0, 0, CONFIG.GAME_W, CONFIG.GAME_H);
    this.rt.setOrigin(0, 0);
    this.rt.setScrollFactor(0);
    this.rt.setDepth(900);
    this.rt.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // Pre-render gradient circles into in-memory canvases for performance.
    this._lightCanvases = new Map();
  }

  _getLightCanvas(radius, intensity = 1.0) {
    const key = `${radius}_${intensity.toFixed(2)}`;
    if (this._lightCanvases.has(key)) return this._lightCanvases.get(key);
    const size = radius * 2;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    // Bright center → grey mid → matches ambient at the rim. We never go
    // pure black so that the world remains faintly visible at the edge.
    const brightness = Math.min(255, Math.round(255 * intensity));
    g.addColorStop(0, `rgba(${brightness},${brightness},${brightness},1)`);
    g.addColorStop(0.45, `rgba(170,160,170,1)`);
    g.addColorStop(0.8, `rgba(90,80,95,1)`);
    g.addColorStop(1, 'rgba(60,55,70,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    this._lightCanvases.set(key, c);
    return c;
  }

  // lights: array of { x, y, radius, intensity } in WORLD coords.
  render(camera, lights) {
    this.rt.clear();
    // Base ambient: dim but never fully black so distant mobs remain
    // recognizable silhouettes.
    this.rt.fill(0x282030, 1);
    for (const l of lights) {
      const sx = l.x - camera.scrollX - l.radius;
      const sy = l.y - camera.scrollY - l.radius;
      const lc = this._getLightCanvas(l.radius, l.intensity ?? 1);
      const texKey = `__light_${l.radius}_${(l.intensity ?? 1).toFixed(2)}`;
      if (!this.scene.textures.exists(texKey)) {
        this.scene.textures.addCanvas(texKey, lc);
      }
      this.rt.draw(texKey, sx, sy);
    }
  }
}
