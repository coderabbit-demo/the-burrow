// Static (or lightly animated) decoration. Some are solid, some are decals.
import { Animator } from '../sprites/animator.js';

const SOLID_PROPS = new Set(['tombstone', 'tombstone_cracked', 'dead_tree', 'pillar', 'fungus_pod', 'mushroom', 'spike_trap']);
const HAZARD_PROPS = new Set(['spike_trap']);

export class Prop extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, name, opts = {}) {
    super(scene, x, y, `prop_${name}`);
    scene.add.existing(this);
    this.name = name;
    this.decoration = !!opts.decoration;
    const solid = !this.decoration && SOLID_PROPS.has(name);
    if (solid) {
      scene.physics.add.existing(this, true); // static body
    }
    this.setOrigin(0.5, 0.85);
    this.setDepth(this.decoration ? 2 : 7);
    if (solid) {
      // tighten body to base
      const tex = scene.textures.get(`prop_${name}`).getSourceImage();
      const w = Math.min(tex.width - 2, 12);
      const h = Math.min(8, tex.height - 2);
      this.body.setSize(w, h);
      this.body.setOffset((tex.width - w) / 2, tex.height - h - 1);
    }
    this.hazard = !!opts.hazard || HAZARD_PROPS.has(name);
  }
}

export class GraceLantern extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, id) {
    super(scene, x, y, 'item_grace_1');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.id = id;
    this.setOrigin(0.5, 0.85);
    this.setDepth(7);
    this.body.setSize(10, 8);
    this.body.setOffset(7, 14);
    this.body.updateFromGameObject();
    this.animator = new Animator(this);
    this.animator.play('flame', ['item_grace_1', 'item_grace_2', 'item_grace_3'], 5, true);
  }
  update(time, delta) { this.animator.update(delta); }
}

export class Switch extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, id) {
    super(scene, x, y, 'prop_switch_off');
    scene.add.existing(this);
    this.id = id;
    this.pressed = false;
    this.setOrigin(0.5, 0.7);
    this.setDepth(6);
  }
  press() {
    if (this.pressed) return false;
    this.pressed = true;
    this.setTexture('prop_switch_on');
    this.setDepth(7);
    return true;
  }
}

export class ItemPickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, kind) {
    super(scene, x, y, `item_${kind}`);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.kind = kind;
    this.setOrigin(0.5, 0.5);
    this.setDepth(6);
    this.body.setSize(8, 8);
    this.body.setOffset(4, 4);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    // gentle bobbing
    this.tween = scene.tweens.add({
      targets: this,
      y: y - 2,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
