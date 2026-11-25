const SHADE = 0x0c0d1d;
const FALLOFF = [[0, 1], [0.35, 0.85], [0.65, 0.45], [0.88, 0.10], [1, 0]];
const GLOWS = {
  player: { color: '245,181,102', alpha: 0.13 },
  lantern: { color: '255,171,80', alpha: 0.26 },
  fungus: { color: '141,166,101', alpha: 0.17 },
};

export class LightingLayer {
  constructor(scene) {
    this.textures = scene.textures;
    const { width, height } = scene.cameras.main;
    this.rt = scene.add.renderTexture(0, 0, width, height)
      .setOrigin(0).setScrollFactor(0).setDepth(900);
    this.rt.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  _texture(key, radius, color, stops) {
    if (this.textures.exists(key)) return;

    const size = radius * 2;
    const texture = this.textures.createCanvas(key, size, size);
    const ctx = texture.getContext();
    const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    for (const [stop, alpha] of stops) {
      gradient.addColorStop(stop, `rgba(${color},${alpha})`);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    texture.refresh();
  }

  // Each entry describes a light in world coordinates.
  render(camera, lights) {
    this.rt.clear();
    this.rt.fill(SHADE, 0.92);

    const visible = [];
    for (const { x, y, radius, intensity = 1 } of lights) {
      const sx = x - camera.scrollX - radius;
      const sy = y - camera.scrollY - radius;
      if (sx >= camera.width || sy >= camera.height || sx + 2 * radius <= 0 || sy + 2 * radius <= 0) continue;

      const key = `${radius}_${intensity}`;
      const mask = `__light_mask_${key}`;
      const glow = `__light_glow_${key}`;
      if (!this.textures.exists(mask)) {
        this._texture(mask, radius, '255,255,255', FALLOFF.map(([stop, power]) => [stop, power * intensity]));
      }
      if (!this.textures.exists(glow)) {
        // The smaller lights are fungus pods (40 px) and Grace lanterns (60 px).
        const { color, alpha } = radius <= 40 ? GLOWS.fungus : radius <= 60 ? GLOWS.lantern : GLOWS.player;
        const peak = alpha * intensity;
        this._texture(glow, radius, color, [[0, peak], [0.3, peak * 0.55], [0.74, 0]]);
      }

      this.rt.erase(mask, sx, sy);
      visible.push({ glow, sx, sy });
    }

    // Lay the glow over all the cutouts so overlapping lights keep their color.
    for (const { glow, sx, sy } of visible) {
      this.rt.draw(glow, sx, sy);
    }
  }
}
