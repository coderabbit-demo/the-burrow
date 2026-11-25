// Lock-on: pick the nearest live enemy within range; cycle on Tab.

export class LockOn {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.target = null;
    this.indicator = scene.add.graphics();
    this.indicator.setDepth(20);
    this.indicator.setScrollFactor(1);
    this.range = 160;
  }

  // enemies: live group of Enemy sprites.
  toggle(enemies) {
    if (this.target && enemies.includes(this.target) && !this.target.dying) {
      this.target = null;
      return;
    }
    this.target = this._pickNearest(enemies);
  }

  cycle(enemies) {
    if (!this.target) {
      this.target = this._pickNearest(enemies);
      return;
    }
    const valid = enemies.filter((e) => !e.dying && e !== this.target && this._dist(e) < this.range);
    if (!valid.length) return;
    valid.sort((a, b) => this._dist(a) - this._dist(b));
    this.target = valid[0];
  }

  clearIfDead() {
    if (this.target && (this.target.dying || !this.target.active)) this.target = null;
  }

  _dist(e) { return Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y); }

  _pickNearest(enemies) {
    let best = null;
    let bestD = this.range;
    for (const e of enemies) {
      if (e.dying || !e.active) continue;
      const d = this._dist(e);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  draw() {
    this.indicator.clear();
    if (!this.target || this.target.dying) return;
    const x = Math.round(this.target.x);
    const y = Math.round(this.target.y) - 4;
    const g = this.indicator;
    const corners = [
      [x - 10, y - 9, 1, 1], [x + 10, y - 9, -1, 1],
      [x - 10, y + 9, 1, -1], [x + 10, y + 9, -1, -1],
    ];

    for (const [cx, cy, dx, dy] of corners) {
      const left = dx > 0 ? cx : cx - 3;
      const top = dy > 0 ? cy : cy - 3;
      g.fillStyle(0x160d1b, 0.9);
      g.fillRect(left, cy - 1, 4, 3);
      g.fillRect(cx - 1, top, 3, 4);
      g.fillStyle(0xd06065, 1);
      g.fillRect(left, cy, 4, 1);
      g.fillRect(cx, top, 1, 4);
      g.fillStyle(0xf29b86, 1);
      g.fillRect(cx, cy, 1, 1);
    }

    g.fillStyle(0x190e1b, 1);
    g.fillRect(x - 2, y - 18, 5, 4);
    g.fillRect(x - 1, y - 14, 3, 1);
    g.fillStyle(0xd06065, 1);
    g.fillRect(x - 1, y - 17, 3, 2);
    g.fillStyle(0xffb396, 1);
    g.fillRect(x, y - 17, 1, 1);
  }
}
