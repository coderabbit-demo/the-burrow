import { Animator } from '../sprites/animator.js';
import { Audio } from '../systems/audio.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 0.7);
    this.setSize(8, 8);
    this.setOffset(4, 8);
    this.setDepth(8);

    this.animator = new Animator(this);
    this.hp = 30;
    this.hpMax = 30;
    this.contactDamage = 8;
    this.contactCooldown = 0;
    this.invulnUntil = 0;
    this.dying = false;
    this.runeReward = 8;
    this.aggroRange = 130;
    this.attackRange = 14;
    this.speed = 30;
  }

  takeDamage(amount, fromX, fromY, knockback = 80) {
    if (this.dying) return;
    const now = this.scene.time.now;
    if (now < this.invulnUntil) return;
    this.hp -= amount;
    this.invulnUntil = now + 120;
    this.setTint(0xc1474d);
    this.scene.time.delayedCall(80, () => { if (!this.dying) this.clearTint(); });
    Audio.play('hit_enemy');
    if (typeof fromX === 'number') {
      const dx = this.x - fromX;
      const dy = this.y - fromY;
      const len = Math.hypot(dx, dy) || 1;
      this.setVelocity((dx / len) * knockback, (dy / len) * knockback);
    }
    if (this.hp <= 0) this.die();
  }

  die() {
    this.dying = true;
    this.setVelocity(0, 0);
    this.body.enable = false;
    Audio.play('enemy_death');
    this.scene.events.emit('enemyDied', this);
  }

  // Subclasses implement.
  update(time, delta, target) {
    this.animator.update(delta);
  }
}
