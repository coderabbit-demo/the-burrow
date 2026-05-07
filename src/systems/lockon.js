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
    this.indicator.lineStyle(1, 0xc1474d, 0.9);
    this.indicator.strokeCircle(this.target.x, this.target.y - 4, 10);
    this.indicator.fillStyle(0xc1474d, 0.9);
    this.indicator.fillTriangle(
      this.target.x, this.target.y - 18,
      this.target.x - 3, this.target.y - 22,
      this.target.x + 3, this.target.y - 22,
    );
  }
}
