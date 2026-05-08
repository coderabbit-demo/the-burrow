import { CONFIG } from '../config.js';

// Darkness overlay rendered to a screen-aligned RenderTexture. We start with
// an opaque dark fill, then ERASE soft circular holes wherever a light is.
// The overlay is then drawn on top of the world with normal alpha blending —
// holes reveal the world clearly, the rest stays dim.
//
// Key insight: drawing a square canvas with MULTIPLY blend forces the canvas
// corners to render as black (since MULTIPLY treats transparent as black),
// which produces the squared light look. Using ERASE on a circular alpha
// mask avoids that — only the disc carves into the darkness.

export class LightingLayer {
  constructor(scene) {
    this.scene = scene;
    this.rt = scene.add.renderTexture(0, 0, CONFIG.GAME_W, CONFIG.GAME_H);
    this.rt.setOrigin(0, 0);
    this.rt.setScrollFactor(0);
    this.rt.setDepth(900);
    // Normal alpha blend — the overlay's own transparency does the dimming.
    this.rt.setBlendMode(Phaser.BlendModes.NORMAL);

    // Smooth-sample the darkness overlay so the circular alpha mask keeps
    // its round falloff. Without this, the global `pixelArt: true` flag
    // forces NEAREST sampling on the gradient and the rim stair-steps into
    // visible L-shaped artifacts that read as square corners.
    if (this.rt.texture && typeof this.rt.texture.setFilter === 'function') {
      this.rt.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }

    // Pre-built radial alpha masks, keyed by radius+intensity.
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

    // The mask is white with a radial alpha falloff. Erase consumes the
    // destination proportionally to the source's alpha — opaque white at
    // center erases fully, fully-transparent at the rim erases nothing.
    const a = intensity;
    const g = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    g.addColorStop(0.00, `rgba(255,255,255,${a})`);
    g.addColorStop(0.35, `rgba(255,255,255,${a * 0.85})`);
    g.addColorStop(0.65, `rgba(255,255,255,${a * 0.45})`);
    g.addColorStop(0.88, `rgba(255,255,255,${a * 0.10})`);
    g.addColorStop(1.00, `rgba(255,255,255,0)`);

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    this._lightCanvases.set(key, c);
    return c;
  }

  // lights: array of { x, y, radius, intensity } in WORLD coords.
  render(camera, lights) {
    this.rt.clear();
    // Opaque dark layer. Alpha < 1 lets a sliver of the world show through
    // even outside any light, so distant silhouettes remain readable.
    this.rt.fill(0x05050a, 0.92);

    for (const l of lights) {
      const sx = l.x - camera.scrollX - l.radius;
      const sy = l.y - camera.scrollY - l.radius;
      const lc = this._getLightCanvas(l.radius, l.intensity ?? 1);
      const texKey = `__light_${l.radius}_${(l.intensity ?? 1).toFixed(2)}`;
      if (!this.scene.textures.exists(texKey)) {
        this.scene.textures.addCanvas(texKey, lc);
      }
      // Erase carves the alpha mask out of the dark overlay using
      // destination-out blending — soft circular holes, no square edges.
      this.rt.erase(texKey, sx, sy);
    }
  }
}
