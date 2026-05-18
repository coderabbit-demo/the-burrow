import { Enemy } from '../Enemy.js';
import { CONFIG } from '../../config.js';
import { GrubEnemy } from './GrubEnemy.js';

const BS = {
  CHASE: 'chase',
  CLAW: 'claw',
  REAR: 'rear',
  SLAM: 'slam',
  SUMMON: 'summon',
  BURST: 'burst',
  RECOVER: 'recover',
};

export class BugBoss extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'boss_idle_1');
    this.setOrigin(0.5, 0.5);
    this.setSize(20, 16);
    this.setOffset(6, 10);
    this.setDepth(9);

    this.hp = CONFIG.BOSS.HP_MAX;
    this.hpMax = CONFIG.BOSS.HP_MAX;
    this.contactDamage = CONFIG.BOSS.CONTACT_DAMAGE;
    this.runeReward = CONFIG.RUNES.BOSS_KILL;
    this.aggroRange = 9999;
    this.phase = 1;
    this.behavior = BS.CHASE;
    this.behaviorUntil = 0;
    this.attackCooldown = 0;
    this.summonCooldown = 0;
    this.burstCooldown = 0;
    this.slamUsed = false;
    this.runeRewardOnPhase = CONFIG.RUNES.BOSS_PHASE;
    this.body.setBounce(0);

    this.animator.play('idle', ['boss_idle_1', 'boss_idle_2'], 3, true);
  }

  setPhase(p) {
    if (p <= this.phase) return;
    this.phase = p;
    if (this.scene && this.scene.cameras) {
      this.scene.cameras.main.shake(220, 0.012);
      this.scene.cameras.main.flash(140, 120, 30, 30);
    }
    if (p === 2) {
      this.animator.play('enraged', ['boss_enraged'], 1, true);
      this.contactDamage = Math.round(CONFIG.BOSS.CONTACT_DAMAGE * 1.15);
    } else if (p === 3) {
      this.animator.play('enraged', ['boss_enraged'], 1, true);
      this.contactDamage = Math.round(CONFIG.BOSS.CONTACT_DAMAGE * 1.3);
    }
    if (this.scene?.events) this.scene.events.emit('bossPhase', this.phase);
    this.scene?.events?.emit('runesAwarded', this.runeRewardOnPhase);
  }

  takeDamage(amount, fromX, fromY) {
    super.takeDamage(amount, fromX, fromY, 30);
    const ratio = this.hp / this.hpMax;
    if (this.phase < 2 && ratio <= CONFIG.BOSS.PHASE2_AT) this.setPhase(2);
    if (this.phase < 3 && ratio <= CONFIG.BOSS.PHASE3_AT) this.setPhase(3);
  }

  die() {
    super.die();
    this.animator.play('death', ['boss_death'], 1, false);
    if (this.scene?.events) this.scene.events.emit('bossDefeated', this);
  }

  update(time, delta, target) {
    super.update(time, delta, target);
    if (this.dying || !target || target.isDead?.()) {
      this.setVelocity(0, 0);
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.setFlipX(dx < 0);

    const speed = this.phase >= 3 ? CONFIG.BOSS.ENRAGED_SPEED : CONFIG.BOSS.SKITTER_SPEED;

    switch (this.behavior) {
      case BS.CHASE: {
        // pick an attack when in range or after a beat
        if (dist < 28 && time > this.attackCooldown) {
          this.behavior = BS.CLAW;
          this.behaviorUntil = time + 380;
          this.attackCooldown = time + 1500;
          this.animator.play('rear', ['boss_rear_up'], 1, false);
          this.setVelocity(0, 0);
          return;
        }
        if (dist < 90 && time > this.attackCooldown && Math.random() < 0.012) {
          // dive-slam telegraph
          this.behavior = BS.REAR;
          this.behaviorUntil = time + 820;
          this.attackCooldown = time + 2200;
          this.slamUsed = false;
          this.animator.play('rear', ['boss_rear_up'], 1, false);
          this.setVelocity(0, 0);
          return;
        }
        if (this.phase >= 2 && time > this.summonCooldown && Math.random() < 0.006) {
          this.behavior = BS.SUMMON;
          this.behaviorUntil = time + 700;
          this.summonCooldown = time + 10000;
          this.animator.play('rear', ['boss_rear_up'], 1, false);
          this.setVelocity(0, 0);
          return;
        }
        if (this.phase >= 3 && time > this.burstCooldown) {
          this.behavior = BS.BURST;
          this.behaviorUntil = time + 700;
          this.burstCooldown = time + 5500;
          this.animator.play('rear', ['boss_rear_up'], 1, false);
          this.setVelocity(0, 0);
          return;
        }
        // chase
        const len = dist || 1;
        this.setVelocity((dx / len) * speed, (dy / len) * speed);
        if (this.phase === 1) {
          this.animator.play('idle', ['boss_idle_1', 'boss_idle_2'], 4, true);
        } else {
          this.animator.play('enraged', ['boss_enraged'], 1, true);
        }
        break;
      }
      case BS.CLAW: {
        // brief lunge in target direction; damage applies via contact overlap
        const len = dist || 1;
        this.setVelocity((dx / len) * 110, (dy / len) * 110);
        if (time > this.behaviorUntil) {
          this.behavior = BS.RECOVER;
          this.behaviorUntil = time + 350;
          this.setVelocity(0, 0);
        }
        break;
      }
      case BS.REAR: {
        if (time > this.behaviorUntil) {
          this.behavior = BS.SLAM;
          this.behaviorUntil = time + 380;
          // launch in target direction
          const len = dist || 1;
          this.setVelocity((dx / len) * 220, (dy / len) * 220);
        }
        break;
      }
      case BS.SLAM: {
        if (time > this.behaviorUntil) {
          // emit shockwave: deal damage if player nearby
          if (this.scene?.events && !this.slamUsed) {
            this.scene.events.emit('bossSlam', this.x, this.y, CONFIG.BOSS.SLAM_DAMAGE);
            this.slamUsed = true;
            this.scene.cameras.main.shake(140, 0.01);
          }
          this.behavior = BS.RECOVER;
          this.behaviorUntil = time + 700;
          this.setVelocity(0, 0);
        }
        break;
      }
      case BS.SUMMON: {
        if (time > this.behaviorUntil) {
          if (this.scene?.events) {
            for (let i = 0; i < 3; i++) {
              const ang = Math.random() * Math.PI * 2;
              const sx = this.x + Math.cos(ang) * 30;
              const sy = this.y + Math.sin(ang) * 30;
              this.scene.events.emit('bossSummon', sx, sy);
            }
          }
          this.behavior = BS.RECOVER;
          this.behaviorUntil = time + 500;
        }
        break;
      }
      case BS.BURST: {
        if (time > this.behaviorUntil) {
          if (this.scene?.events) {
            const shots = 8;
            for (let i = 0; i < shots; i++) {
              const ang = (Math.PI * 2 * i) / shots;
              this.scene.events.emit('bossProjectile', this.x, this.y, Math.cos(ang), Math.sin(ang));
            }
          }
          this.behavior = BS.RECOVER;
          this.behaviorUntil = time + 700;
        }
        break;
      }
      case BS.RECOVER: {
        this.setVelocity(0, 0);
        if (time > this.behaviorUntil) {
          this.behavior = BS.CHASE;
        }
        break;
      }
    }
  }
}
