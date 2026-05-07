import { Enemy } from '../Enemy.js';
import { CONFIG } from '../../config.js';

export class SpiderEnemy extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'spider_idle_1');
    this.hp = 22;
    this.hpMax = 22;
    this.speed = 56;
    this.contactDamage = 12;
    this.aggroRange = 150;
    this.attackRange = 22;
    this.runeReward = CONFIG.RUNES.SPIDER;
    this.leapCooldown = 0;
    this.leaping = false;
    this.leapUntil = 0;
    this.animator.play('idle', ['spider_idle_1'], 1, true);
  }

  update(time, delta, target) {
    super.update(time, delta, target);
    if (this.dying) {
      this.animator.play('death', ['spider_death'], 1, false);
      return;
    }
    if (!target || target.isDead?.()) {
      this.setVelocity(0, 0);
      this.animator.play('idle', ['spider_idle_1'], 1, true);
      return;
    }
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (this.leaping) {
      if (time > this.leapUntil) {
        this.leaping = false;
        this.setVelocity(0, 0);
      }
      this.animator.play('leap', ['spider_leap'], 1, false);
      return;
    }

    if (dist < this.attackRange + 10 && time > this.leapCooldown) {
      this.leaping = true;
      this.leapUntil = time + 280;
      this.leapCooldown = time + 1400;
      const len = dist || 1;
      this.setVelocity((dx / len) * 160, (dy / len) * 160);
      this.animator.play('leap', ['spider_leap'], 1, false);
    } else if (dist < this.aggroRange) {
      const len = dist || 1;
      this.setVelocity((dx / len) * this.speed, (dy / len) * this.speed);
      this.animator.play('scuttle', ['spider_scuttle_1', 'spider_scuttle_2'], 8, true);
      this.setFlipX(dx < 0);
    } else {
      this.setVelocity(0, 0);
      this.animator.play('idle', ['spider_idle_1'], 1, true);
    }
  }
}
