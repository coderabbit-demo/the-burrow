import { CONFIG } from '../config.js';
import { Animator } from '../sprites/animator.js';
import { Audio } from '../systems/audio.js';

const STATES = {
  IDLE: 'idle',
  WALK: 'walk',
  ATTACK: 'attack',
  ROLL: 'roll',
  HURT: 'hurt',
  DEAD: 'dead',
  REST: 'rest',
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'rabbit_idle_down_1');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.7);
    this.setSize(8, 8);
    this.setOffset(4, 8);
    this.setDepth(10);

    this.animator = new Animator(this);

    this.hp = CONFIG.PLAYER.HP_MAX;
    this.hpMax = CONFIG.PLAYER.HP_MAX;
    this.stamina = CONFIG.PLAYER.STAMINA_MAX;
    this.staminaMax = CONFIG.PLAYER.STAMINA_MAX;
    this.flasks = CONFIG.PLAYER.FLASK_MAX;
    this.potions = 0;
    this.runes = 0;
    this.droppedRunes = null; // { mapKey, x, y, amount } or null
    this.lightRadius = CONFIG.PLAYER.LIGHT_RADIUS;
    this.hasKey = false;
    this.hasEmber = false;
    this.flags = new Set();

    this.facing = 'down';
    this.state = STATES.IDLE;
    this.invulnUntil = 0;
    this.attackUntil = 0;
    this.rollUntil = 0;
    this.staminaRegenAt = 0;
    this.lastDamageBy = null;
    this.attackHitTargets = new Set();

    this.lockTarget = null;

    this.animator.play('idle_down', ['rabbit_idle_down_1', 'rabbit_idle_down_2'], 3, true);
  }

  isInvuln(now) { return now < this.invulnUntil; }
  isAttacking(now) { return now < this.attackUntil; }
  isRolling(now) { return now < this.rollUntil; }
  isDead() { return this.state === STATES.DEAD; }
  isResting() { return this.state === STATES.REST; }

  // Attempt to begin an attack (light or heavy).
  tryAttack(heavy = false) {
    if (this.isDead() || this.isResting()) return false;
    const now = this.scene.time.now;
    if (this.isAttacking(now) || this.isRolling(now)) return false;
    const cost = CONFIG.PLAYER.ATTACK_COST + (heavy ? 12 : 0);
    if (this.stamina < cost) return false;
    this.stamina -= cost;
    this.staminaRegenAt = now + CONFIG.PLAYER.STAMINA_REGEN_DELAY;
    this.attackUntil = now + CONFIG.PLAYER.ATTACK_DURATION;
    this.attackHeavy = heavy;
    Audio.play(heavy ? 'swing_heavy' : 'swing_light');
    this.attackHitTargets.clear();
    this.state = STATES.ATTACK;
    this.setVelocity(0, 0);
    const dir = this.facing;
    const animKey = `attack_${dir === 'left' || dir === 'right' ? 'side' : dir}`;
    const frame = `rabbit_attack_${dir === 'left' || dir === 'right' ? 'side' : dir}`;
    this.animator.play(animKey, [frame], 6, false);
    if (dir === 'left') this.setFlipX(true);
    else if (dir === 'right') this.setFlipX(false);
    return true;
  }

  // Attempt to roll in the given direction vector.
  tryRoll(vx, vy) {
    if (this.isDead() || this.isResting()) return false;
    const now = this.scene.time.now;
    if (this.isRolling(now)) return false;
    if (this.stamina < CONFIG.PLAYER.ROLL_COST) return false;
    if (vx === 0 && vy === 0) {
      // roll in facing direction
      ({ vx, vy } = this._facingVec());
    }
    const len = Math.hypot(vx, vy) || 1;
    vx /= len; vy /= len;
    this.stamina -= CONFIG.PLAYER.ROLL_COST;
    this.staminaRegenAt = now + CONFIG.PLAYER.STAMINA_REGEN_DELAY;
    this.rollUntil = now + CONFIG.PLAYER.ROLL_DURATION;
    this.invulnUntil = Math.max(this.invulnUntil, now + CONFIG.PLAYER.ROLL_IFRAMES);
    this.state = STATES.ROLL;
    this.setVelocity(vx * CONFIG.PLAYER.ROLL_SPEED, vy * CONFIG.PLAYER.ROLL_SPEED);
    this.animator.play('roll', ['rabbit_roll_1', 'rabbit_roll_2'], 14, true);
    Audio.play('roll');
    return true;
  }

  drinkFlask() {
    if (this.isDead() || this.flasks <= 0 || this.hp >= this.hpMax) return false;
    this.flasks--;
    this.hp = Math.min(this.hpMax, this.hp + CONFIG.PLAYER.FLASK_HEAL);
    this.scene.cameras.main.flash(120, 200, 100, 60);
    Audio.play('flask');
    return true;
  }

  drinkPotion() {
    if (this.isDead() || this.potions <= 0 || this.hp >= this.hpMax) return false;
    this.potions--;
    this.hp = Math.min(this.hpMax, this.hp + CONFIG.PLAYER.POTION_HEAL);
    this.scene.cameras.main.flash(120, 200, 100, 60);
    Audio.play('flask');
    return true;
  }

  takeDamage(amount, fromX, fromY) {
    if (this.isDead()) return;
    const now = this.scene.time.now;
    if (this.isInvuln(now)) return;
    this.hp -= amount;
    this.invulnUntil = now + CONFIG.PLAYER.INVULN_HIT;
    this.scene.cameras.main.shake(120, 0.005);
    this.scene.cameras.main.flash(80, 80, 0, 0);
    Audio.play('hit_player');
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
      return;
    }
    // brief hurt visual
    this.state = STATES.HURT;
    this.animator.play('hurt', ['rabbit_hurt'], 6, false, () => {
      if (this.state === STATES.HURT) this.state = STATES.IDLE;
    });
    if (typeof fromX === 'number') {
      const dx = this.x - fromX;
      const dy = this.y - fromY;
      const len = Math.hypot(dx, dy) || 1;
      this.setVelocity((dx / len) * 90, (dy / len) * 90);
    }
  }

  die() {
    this.state = STATES.DEAD;
    this.setVelocity(0, 0);
    this.animator.play('death', ['rabbit_death_1', 'rabbit_death_2'], 3, false);
    Audio.play('player_death');
    this.scene.events.emit('playerDied', this);
  }

  enterRest() {
    if (this.isDead()) return;
    this.state = STATES.REST;
    this.setVelocity(0, 0);
    this.facing = 'down';
    this.animator.play('rest', ['rabbit_idle_down_1', 'rabbit_idle_down_2'], 2, true);
    this.hp = this.hpMax;
    this.flasks = CONFIG.PLAYER.FLASK_MAX;
    this.stamina = this.staminaMax;
  }

  exitRest() {
    if (this.state === STATES.REST) this.state = STATES.IDLE;
  }

  pickupRunes(amount) { this.runes += amount; }
  pickupFlask() { this.flasks = Math.min(CONFIG.PLAYER.FLASK_MAX, this.flasks + 1); }
  pickupPotion() {
    if (this.potions >= CONFIG.PLAYER.POTION_MAX) return false;
    this.potions++;
    return true;
  }
  pickupKey() { this.hasKey = true; }
  pickupEmber() {
    this.hasEmber = true;
    this.lightRadius = CONFIG.PLAYER.LIGHT_RADIUS_EMBER;
  }

  _facingVec() {
    switch (this.facing) {
      case 'up':    return { vx: 0, vy: -1 };
      case 'down':  return { vx: 0, vy: 1 };
      case 'left':  return { vx: -1, vy: 0 };
      case 'right': return { vx: 1, vy: 0 };
    }
    return { vx: 0, vy: 1 };
  }

  // Returns the player's current attack hitbox AABB in world coords, or null.
  getAttackHitbox() {
    const now = this.scene.time.now;
    if (!this.isAttacking(now)) return null;
    const reach = CONFIG.COMBAT.HITBOX_REACH;
    const w = CONFIG.COMBAT.HITBOX_W;
    let cx = this.x, cy = this.y;
    let bw = w, bh = w;
    switch (this.facing) {
      case 'up':    cy -= reach * 0.7; bh = reach; break;
      case 'down':  cy += reach * 0.5; bh = reach; break;
      case 'left':  cx -= reach * 0.6; bw = reach; break;
      case 'right': cx += reach * 0.6; bw = reach; break;
    }
    return new Phaser.Geom.Rectangle(cx - bw / 2, cy - bh / 2, bw, bh);
  }

  update(time, delta, input) {
    this.animator.update(delta);

    if (this.isDead() || this.isResting()) {
      this.setVelocity(0, 0);
      return;
    }

    // stamina regen
    if (time >= this.staminaRegenAt && this.stamina < this.staminaMax) {
      this.stamina = Math.min(this.staminaMax, this.stamina + CONFIG.PLAYER.STAMINA_REGEN * (delta / 1000));
    }

    // attack lockout
    if (this.isAttacking(time)) return;
    if (this.isRolling(time)) return;

    // movement
    const vx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const vy = (input.down ? 1 : 0) - (input.up ? 1 : 0);

    // facing
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.facing = vx > 0 ? 'right' : 'left';
      } else {
        this.facing = vy > 0 ? 'down' : 'up';
      }
    }

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      const speed = CONFIG.PLAYER.SPEED;
      this.setVelocity((vx / len) * speed, (vy / len) * speed);
      this.state = STATES.WALK;
      const dir = this.facing;
      if (dir === 'down') {
        this.animator.play('walk_down', ['rabbit_walk_down_1', 'rabbit_walk_down_2', 'rabbit_walk_down_3', 'rabbit_walk_down_2'], 8, true);
        this.setFlipX(false);
      } else if (dir === 'up') {
        this.animator.play('walk_up', ['rabbit_walk_up_1', 'rabbit_walk_up_2'], 6, true);
        this.setFlipX(false);
      } else {
        this.animator.play('walk_side', ['rabbit_walk_side_1', 'rabbit_walk_side_2'], 6, true);
        this.setFlipX(dir === 'left');
      }
    } else {
      this.setVelocity(0, 0);
      this.state = STATES.IDLE;
      const dir = this.facing;
      if (dir === 'down') {
        this.animator.play('idle_down', ['rabbit_idle_down_1', 'rabbit_idle_down_2'], 3, true);
        this.setFlipX(false);
      } else if (dir === 'up') {
        this.animator.play('idle_up', ['rabbit_idle_up_1'], 1, true);
        this.setFlipX(false);
      } else {
        this.animator.play('idle_side', ['rabbit_idle_side_1'], 1, true);
        this.setFlipX(dir === 'left');
      }
    }
  }
}
