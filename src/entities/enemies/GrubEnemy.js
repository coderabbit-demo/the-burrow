import { Enemy } from '../Enemy.js';
import { CONFIG } from '../../config.js';

export class GrubEnemy extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'grub_idle_1');
    this.hp = 30;
    this.hpMax = 30;
    this.speed = 32;
    this.contactDamage = 8;
    this.aggroRange = 110;
    this.attackRange = 14;
    this.runeReward = CONFIG.RUNES.GRUB;
    this.lungeCooldown = 0;
    this.lunging = false;
    this.lungeUntil = 0;
    this.animator.play('idle', ['grub_idle_1', 'grub_idle_2'], 2, true);
  }

  update(time, delta, target) {
    super.update(time, delta, target);
    if (this.dying) {
      this.animator.play('death', ['grub_death'], 1, false);
      return;
    }
    if (!target || target.isDead?.()) {
      this.setVelocity(0, 0);
      this.animator.play('idle', ['grub_idle_1', 'grub_idle_2'], 2, true);
      return;
    }
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (this.lunging) {
      if (time > this.lungeUntil) {
        this.lunging = false;
        this.setVelocity(0, 0);
      }
      this.animator.play('bite', ['grub_bite'], 1, false);
      return;
    }

    if (dist < this.attackRange && time > this.lungeCooldown) {
      this.lunging = true;
      this.lungeUntil = time + 220;
      this.lungeCooldown = time + 1100;
      const len = dist || 1;
      this.setVelocity((dx / len) * 90, (dy / len) * 90);
      this.animator.play('bite', ['grub_bite'], 1, false);
    } else if (dist < this.aggroRange) {
      const len = dist || 1;
      this.setVelocity((dx / len) * this.speed, (dy / len) * this.speed);
      this.animator.play('crawl', ['grub_crawl_1', 'grub_crawl_2'], 4, true);
      this.setFlipX(dx < 0);
    } else {
      this.setVelocity(0, 0);
      this.animator.play('idle', ['grub_idle_1', 'grub_idle_2'], 2, true);
    }
  }
}
