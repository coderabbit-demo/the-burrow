import { CONFIG } from '../config.js';
import { MAPS } from '../world/maps.js';
import { TILE_TYPES } from '../world/tilesets.js';
import { Player } from '../entities/Player.js';
import { GrubEnemy } from '../entities/enemies/GrubEnemy.js';
import { SpiderEnemy } from '../entities/enemies/SpiderEnemy.js';
import { BugBoss } from '../entities/enemies/BugBoss.js';
import { Prop, GraceLantern, ItemPickup, Switch } from '../entities/Prop.js';
import { LightingLayer } from '../systems/lighting.js';
import { LockOn } from '../systems/lockon.js';
import { GraceState } from '../systems/grace.js';
import { Audio } from '../systems/audio.js';

const TILE = CONFIG.TILE;

export class AreaScene extends Phaser.Scene {
  constructor() { super('AreaScene'); }

  init(data) {
    this.mapKey = data?.mapKey || 'area1';
    this.toX = data?.toX;
    this.toY = data?.toY;
    this.preserveState = data?.preserveState;
  }

  create() {
    const map = MAPS[this.mapKey];
    if (!map) {
      console.error('Missing map', this.mapKey);
      return;
    }
    this.map = map;
    this.isBoss = !!map.isBoss;

    // Build static layers (player first so entities can read its persisted flags)
    this._buildTiles(map);
    this._buildPlayer(map);
    this._buildEntities(map);
    this._wireCollisions();
    this._wireInput();
    this._wireBossEvents();

    // Lighting
    this.lighting = new LightingLayer(this);

    // Lock-on
    this.lockOn = new LockOn(this, this.player);

    // Camera
    const w = map.tiles[0].length * TILE;
    const h = map.tiles.length * TILE;
    this.cameras.main.setBounds(0, 0, w, h);
    this.cameras.main.startFollow(this.player, true, 0.18, 0.18);
    this.cameras.main.setBackgroundColor('#04030a');
    this.physics.world.setBounds(0, 0, w, h);

    // HUD broadcast
    this.game.events.emit('hudUpdate', this._hudPayload());

    // Drop zone for runes-on-death
    if (this.player.droppedRunes && this.player.droppedRunes.mapKey === this.mapKey) {
      this._spawnRuneDrop(this.player.droppedRunes.x, this.player.droppedRunes.y, this.player.droppedRunes.amount);
    }

    // Map name flash
    this._flashMapName();

    // Boss UI
    if (this.isBoss) {
      this.game.events.emit('bossActive', this.boss);
      this._spawnFogGate();
    } else {
      this.game.events.emit('bossActive', null);
    }

    // Music
    Audio.startMusic(this.isBoss ? 'boss' : 'area');
  }

  _buildTiles(map) {
    this.tileGroup = this.add.group();
    this.solidTiles = this.physics.add.staticGroup();
    for (let ty = 0; ty < map.tiles.length; ty++) {
      const row = map.tiles[ty];
      for (let tx = 0; tx < row.length; tx++) {
        const ch = row[tx];
        const def = TILE_TYPES[ch];
        if (!def) continue;
        const wx = tx * TILE + TILE / 2;
        const wy = ty * TILE + TILE / 2;
        const img = this.add.image(wx, wy, def.key);
        img.setDepth(def.solid ? 1 : 0);
        if (def.solid) {
          const body = this.physics.add.staticImage(wx, wy, def.key);
          body.refreshBody();
          this.solidTiles.add(body);
          img.setVisible(false); // body sprite already shows it
        } else {
          this.tileGroup.add(img);
        }
      }
    }
  }

  _buildEntities(map) {
    this.enemies = [];
    this.props = [];
    this.lanterns = [];
    this.pickups = [];
    this.transitions = [];
    this.gates = [];
    this.switches = [];
    this.boss = null;
    // Reset per-map state — these scene-instance flags persist across scene.restart.
    this._roomEverHadMobs = false;
    this._roomCleared = false;
    this._transitioning = false;
    this._lockedHintAt = 0;

    for (const e of map.entities) {
      const wx = e.x * TILE + TILE / 2;
      const wy = e.y * TILE + TILE / 2;
      switch (true) {
        case e.type === 'grub': {
          const en = new GrubEnemy(this, wx, wy);
          this.enemies.push(en);
          this._roomEverHadMobs = true;
          break;
        }
        case e.type === 'spider': {
          const en = new SpiderEnemy(this, wx, wy);
          this.enemies.push(en);
          this._roomEverHadMobs = true;
          break;
        }
        case e.type === 'boss': {
          const b = new BugBoss(this, wx, wy);
          this.boss = b;
          this.enemies.push(b);
          this._roomEverHadMobs = true;
          break;
        }
        case e.type === 'grace': {
          const g = new GraceLantern(this, wx, wy, e.id);
          this.lanterns.push(g);
          break;
        }
        case e.type === 'flask': {
          const p = new ItemPickup(this, wx, wy, 'carrot_flask');
          p.kind = 'flask';
          this.pickups.push(p);
          break;
        }
        case e.type === 'key': {
          const p = new ItemPickup(this, wx, wy, 'bone_key');
          p.kind = 'key';
          this.pickups.push(p);
          break;
        }
        case e.type === 'ember': {
          const p = new ItemPickup(this, wx, wy, 'ember');
          p.kind = 'ember';
          this.pickups.push(p);
          break;
        }
        case e.type === 'tooth': {
          const p = new ItemPickup(this, wx, wy, 'tooth');
          p.kind = 'tooth';
          this.pickups.push(p);
          break;
        }
        case e.type === 'gate': {
          const sprite = this.add.image(wx, wy, 'prop_door_locked').setDepth(6);
          this.gates.push({ ...e, wx, wy, opened: false, sprite });
          break;
        }
        case e.type === 'transition': {
          const sprite = this.add.image(wx, wy, 'prop_door_open').setDepth(6);
          this._pulseDoor(sprite);
          this.transitions.push({ ...e, wx, wy, sprite });
          break;
        }
        case e.type === 'switch': {
          const s = new Switch(this, wx, wy, e.id);
          if (this.player?.flags?.has(e.id)) s.press();
          this.switches.push(s);
          break;
        }
        case e.type.startsWith('prop:'): {
          const name = e.type.slice(5);
          const p = new Prop(this, wx, wy, name, { decoration: e.decoration, hazard: e.hazard });
          this.props.push(p);
          break;
        }
      }
    }
  }

  _buildPlayer(map) {
    let sx, sy;
    if (this.toX !== undefined) {
      sx = this.toX * TILE + TILE / 2;
      sy = this.toY * TILE + TILE / 2;
    } else {
      sx = map.spawn.x * TILE + TILE / 2;
      sy = map.spawn.y * TILE + TILE / 2;
    }
    const oldState = this.preserveState;
    this.player = new Player(this, sx, sy);
    if (oldState) {
      this.player.hp = oldState.hp;
      this.player.stamina = oldState.stamina;
      this.player.flasks = oldState.flasks;
      this.player.runes = oldState.runes;
      this.player.hasKey = oldState.hasKey;
      this.player.hasEmber = oldState.hasEmber;
      this.player.lightRadius = oldState.lightRadius;
      this.player.droppedRunes = oldState.droppedRunes;
      if (oldState.flags) this.player.flags = new Set(oldState.flags);
    }
  }

  _wireCollisions() {
    this.physics.add.collider(this.player, this.solidTiles);
    for (const en of this.enemies) {
      this.physics.add.collider(en, this.solidTiles);
    }
    for (const p of this.props) {
      if (p.body && p.body.immovable !== undefined) {
        this.physics.add.collider(this.player, p);
        for (const en of this.enemies) this.physics.add.collider(en, p);
      }
    }
    // Lantern blocks player from walking through it
    for (const lan of this.lanterns) {
      this.physics.add.collider(this.player, lan);
    }
  }

  _wireInput() {
    this.input.keyboard.addCapture(['SPACE', 'TAB']);
    this.keys = this.input.keyboard.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D',
      upArrow: 'UP', downArrow: 'DOWN', leftArrow: 'LEFT', rightArrow: 'RIGHT',
      light: 'J', heavy: 'K', roll: 'SHIFT',
      lock: 'L', cycle: 'TAB',
      flask: 'F', interact: 'E', mute: 'M',
    });
    this.keys.light.on('down', () => this.player.tryAttack(false));
    this.keys.heavy.on('down', () => this.player.tryAttack(true));
    this.keys.roll.on('down', () => {
      const vx = (this.keys.right.isDown || this.keys.rightArrow.isDown ? 1 : 0)
               - (this.keys.left.isDown  || this.keys.leftArrow.isDown  ? 1 : 0);
      const vy = (this.keys.down.isDown  || this.keys.downArrow.isDown  ? 1 : 0)
               - (this.keys.up.isDown    || this.keys.upArrow.isDown    ? 1 : 0);
      this.player.tryRoll(vx, vy);
    });
    this.keys.lock.on('down', () => this.lockOn.toggle(this.enemies));
    this.keys.cycle.on('down', () => this.lockOn.cycle(this.enemies));
    this.keys.flask.on('down', () => {
      if (this.player.drinkFlask()) this.game.events.emit('hudUpdate', this._hudPayload());
    });
    this.keys.interact.on('down', () => this._tryInteract());
    this.keys.mute.on('down', () => this._toggleMute());

    this.events.on('playerDied', () => this._onPlayerDied());
  }

  _toggleMute() {
    const m = Audio.toggleMute();
    const t = this.add.text(CONFIG.GAME_W / 2, 24, m ? 'audio off' : 'audio on', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#a89bb0',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2000);
    this.tweens.add({ targets: t, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
  }

  _wireBossEvents() {
    this.events.on('bossSlam', (x, y, dmg) => this._bossSlam(x, y, dmg));
    this.events.on('bossSummon', (x, y) => {
      const g = new GrubEnemy(this, x, y);
      g.hp = 18; g.hpMax = 18;
      this.enemies.push(g);
      this.physics.add.collider(g, this.solidTiles);
    });
    this.events.on('bossProjectile', (x, y, dx, dy) => this._spawnProjectile(x, y, dx, dy));
    this.events.on('bossPhase', (p) => { Audio.play('boss_roar'); this._flashMapName(`PHASE ${p}`); });
    this.events.on('bossDefeated', () => this._bossDefeated());
  }

  _bossSlam(x, y, dmg) {
    Audio.play('boss_slam');
    const ring = this.add.image(x, y, 'slam_ring').setDepth(15).setAlpha(0.95).setScale(0.4);
    this.tweens.add({
      targets: ring,
      scale: 1.6,
      alpha: 0,
      duration: 360,
      onComplete: () => ring.destroy(),
    });
    const d = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
    if (d < 36 && !this.player.isInvuln(this.time.now)) {
      this.player.takeDamage(dmg, x, y);
      this.game.events.emit('hudUpdate', this._hudPayload());
    }
  }

  _spawnProjectile(x, y, dx, dy) {
    Audio.play('boss_projectile');
    const proj = this.physics.add.image(x, y, 'proj_ichor');
    proj.setDepth(11);
    proj.body.setCircle(3);
    proj.body.setOffset(1, 1);
    proj.setVelocity(dx * 100, dy * 100);
    proj._dmg = CONFIG.BOSS.PROJECTILE_DAMAGE;
    proj._lifeUntil = this.time.now + 4000;
    if (!this._projectiles) this._projectiles = [];
    this._projectiles.push(proj);
  }

  _spawnFogGate() {
    // Decorative fog wall behind player on entry to boss arena
    const map = this.map;
    const w = map.tiles[0].length * TILE;
    const h = map.tiles.length * TILE;
    const fog = this.add.image(w / 2, h - 16, 'fog_gate').setDepth(10).setAlpha(0.7);
    this.tweens.add({ targets: fog, alpha: 0.4, duration: 1600, yoyo: true, repeat: -1 });
  }

  _spawnRuneDrop(x, y, amount) {
    const r = this.add.image(x, y, 'item_rune_shard').setDepth(6);
    r._dropped = amount;
    r.setScale(1.2);
    this.tweens.add({ targets: r, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });
    if (!this._runeDrops) this._runeDrops = [];
    this._runeDrops.push({ sprite: r, amount });
  }

  _bossDefeated() {
    if (this._bossEnded) return;
    this._bossEnded = true;
    this.player.pickupRunes(CONFIG.RUNES.BOSS_KILL);
    this.game.events.emit('hudUpdate', this._hudPayload());
    const tx = this.boss.x; const ty = this.boss.y;
    this.time.delayedCall(900, () => {
      const tooth = new ItemPickup(this, tx, ty, 'tooth');
      tooth.kind = 'tooth';
      this.pickups.push(tooth);
    });
  }

  _onPlayerDied() {
    if (this._died) return;
    this._died = true;
    // drop runes at death spot
    this.player.droppedRunes = {
      mapKey: this.mapKey,
      x: this.player.x,
      y: this.player.y,
      amount: this.player.runes,
    };
    this.player.runes = 0;

    const txt = this.add.text(CONFIG.GAME_W / 2, CONFIG.GAME_H / 2, 'YOU DIED', {
      fontFamily: 'Courier New, monospace',
      fontSize: '36px',
      color: '#7a1f24',
      stroke: '#0b0a10',
      strokeThickness: 4,
      letterSpacing: 8,
    }).setScrollFactor(0).setDepth(2000).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: txt, alpha: 1, duration: 1200 });
    this.cameras.main.fadeOut(2400, 0, 0, 0);
    this.time.delayedCall(2600, () => this._respawn());
  }

  _respawn() {
    const state = {
      hp: CONFIG.PLAYER.HP_MAX,
      stamina: CONFIG.PLAYER.STAMINA_MAX,
      flasks: CONFIG.PLAYER.FLASK_MAX,
      runes: 0,
      hasKey: this.player.hasKey,
      hasEmber: this.player.hasEmber,
      lightRadius: this.player.lightRadius,
      droppedRunes: this.player.droppedRunes,
    };
    this.scene.restart({
      mapKey: GraceState.lastMap,
      preserveState: state,
      toX: undefined,
      toY: undefined,
    });
  }

  _tryInteract() {
    // Rest at grace
    for (const lan of this.lanterns) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, lan.x, lan.y);
      if (d < 22) {
        GraceState.setActive(this.mapKey, lan.id, lan.x, lan.y);
        this.player.enterRest();
        Audio.play('grace_rest');
        this._respawnEnemies();
        const pTxt = this.add.text(lan.x, lan.y - 28, 'GRACE LIT', {
          fontFamily: 'Courier New, monospace',
          fontSize: '8px',
          color: '#c9a449',
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: pTxt, y: lan.y - 44, alpha: 0, duration: 1200, onComplete: () => pTxt.destroy() });
        this.cameras.main.flash(180, 200, 160, 60);
        this.time.delayedCall(900, () => {
          this.player.exitRest();
          this.game.events.emit('hudUpdate', this._hudPayload());
        });
        return;
      }
    }
  }

  _respawnEnemies() {
    // remove all current enemies (except boss) and respawn from map
    if (this.isBoss) return;
    for (const en of this.enemies) en.destroy();
    this.enemies = [];
    for (const e of this.map.entities) {
      if (e.type !== 'grub' && e.type !== 'spider') continue;
      const wx = e.x * TILE + TILE / 2;
      const wy = e.y * TILE + TILE / 2;
      const en = e.type === 'grub' ? new GrubEnemy(this, wx, wy) : new SpiderEnemy(this, wx, wy);
      this.enemies.push(en);
      this.physics.add.collider(en, this.solidTiles);
    }
    this.lockOn.target = null;
    // Clear-gates re-lock on rest so the player must clear again.
    this._roomCleared = false;
    for (const g of this.gates) {
      if (g.requires === 'clear' && !g.opened && g.sprite) {
        this.tweens.killTweensOf(g.sprite);
        g.sprite.setTexture('prop_door_locked');
        g.sprite.setAlpha(1);
      }
    }
  }

  _flashMapName(override) {
    const titles = {
      area1: 'THE FORSAKEN WARREN',
      area1_keyroom: 'A FORGOTTEN ALCOVE',
      area2: 'THE SUNKEN CHOIR',
      boss: "BUG'S HOLLOW",
    };
    const name = override || titles[this.mapKey] || '';
    if (!name) return;
    const t = this.add.text(CONFIG.GAME_W / 2, CONFIG.GAME_H / 2 - 70, name, {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#c9a449',
      stroke: '#0b0a10',
      strokeThickness: 3,
      letterSpacing: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1500).setAlpha(0);
    this.tweens.add({
      targets: t, alpha: 1, duration: 600, hold: 1400, yoyo: true,
      onComplete: () => t.destroy(),
    });
  }

  _hudPayload() {
    return {
      hp: this.player.hp,
      hpMax: this.player.hpMax,
      stamina: this.player.stamina,
      staminaMax: this.player.staminaMax,
      flasks: this.player.flasks,
      runes: this.player.runes,
      bossActive: this.isBoss && this.boss && !this.boss.dying,
      bossHp: this.boss ? this.boss.hp : 0,
      bossHpMax: this.boss ? this.boss.hpMax : 1,
    };
  }

  update(time, delta) {
    if (!this.player) return;

    // input vector
    const inp = {
      left:  this.keys.left.isDown  || this.keys.leftArrow.isDown,
      right: this.keys.right.isDown || this.keys.rightArrow.isDown,
      up:    this.keys.up.isDown    || this.keys.upArrow.isDown,
      down:  this.keys.down.isDown  || this.keys.downArrow.isDown,
    };

    this.player.update(time, delta, inp);
    for (const lan of this.lanterns) lan.update(time, delta);

    // enemies update
    for (const en of this.enemies) {
      if (!en.active) continue;
      en.update(time, delta, this.player);
    }

    // attack hitbox vs enemies
    const hitbox = this.player.getAttackHitbox();
    if (hitbox) {
      for (const en of this.enemies) {
        if (en.dying || !en.active) continue;
        if (this.player.attackHitTargets.has(en)) continue;
        const r = en.getBounds();
        if (Phaser.Geom.Intersects.RectangleToRectangle(hitbox, r)) {
          const dmg = this.player.attackHeavy ? CONFIG.COMBAT.HEAVY_DAMAGE : CONFIG.COMBAT.LIGHT_DAMAGE;
          const kb = this.player.attackHeavy ? CONFIG.COMBAT.KNOCKBACK_HEAVY : CONFIG.COMBAT.KNOCKBACK_LIGHT;
          en.takeDamage(dmg, this.player.x, this.player.y, kb);
          this.player.attackHitTargets.add(en);
          this.cameras.main.shake(60, 0.003);
        }
      }
    }

    // contact damage from enemies
    for (const en of this.enemies) {
      if (en.dying || !en.active) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, en.x, en.y);
      const reach = en === this.boss ? 22 : 12;
      if (d < reach) {
        if (!this.player.isInvuln(time)) {
          this.player.takeDamage(en.contactDamage || 8, en.x, en.y);
          this.game.events.emit('hudUpdate', this._hudPayload());
        }
      }
    }

    // boss projectiles
    if (this._projectiles) {
      for (let i = this._projectiles.length - 1; i >= 0; i--) {
        const p = this._projectiles[i];
        if (!p.active || time > p._lifeUntil) {
          p.destroy();
          this._projectiles.splice(i, 1);
          continue;
        }
        const d = Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y);
        if (d < 8 && !this.player.isInvuln(time)) {
          this.player.takeDamage(p._dmg, p.x, p.y);
          this.game.events.emit('hudUpdate', this._hudPayload());
          p.destroy();
          this._projectiles.splice(i, 1);
        }
      }
    }

    // pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      if (!p.active) { this.pickups.splice(i, 1); continue; }
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y);
      if (d < 12) this._collectPickup(p, i);
    }

    // room-cleared detection — fires once when the last mob dies, before the
    // gate loop so the message and door-open swap show even if the player
    // killed the final mob standing on the exit.
    if (!this._roomCleared && this._roomEverHadMobs && this._allMobsDead()) {
      this._roomCleared = true;
      this._onRoomCleared();
    }

    // gates
    for (const g of this.gates) {
      if (g.opened) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, g.wx, g.wy);
      if (d < 22) {
        if (this._gateUnlocked(g)) {
          g.opened = true;
          this._gateOpenFx(g);
          this.time.delayedCall(450, () => this._goto(g.target, g.toX, g.toY));
        } else {
          this._gateLockedHint(g);
        }
      }
    }

    // switches — touching a dormant switch lights it and sets its flag
    for (const s of this.switches) {
      if (s.pressed) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y);
      if (d < 14) {
        s.press();
        this.player.flags.add(s.id);
        this._switchPressedFx(s);
      }
    }

    // transitions (no requirement)
    for (const t of this.transitions) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, t.wx, t.wy);
      if (d < 14) {
        this._goto(t.target, t.toX, t.toY);
        return;
      }
    }

    // dead enemy cleanup with rune award
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const en = this.enemies[i];
      if (en.dying && !en._rewardGiven) {
        en._rewardGiven = true;
        if (en !== this.boss) this.player.pickupRunes(en.runeReward);
        this.game.events.emit('hudUpdate', this._hudPayload());
        this.time.delayedCall(420, () => en.destroy());
      }
    }
    this.enemies = this.enemies.filter((e) => e.active);

    // lock on
    this.lockOn.clearIfDead();
    this.lockOn.draw();

    // rune drop pickup
    if (this._runeDrops) {
      for (let i = this._runeDrops.length - 1; i >= 0; i--) {
        const rd = this._runeDrops[i];
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, rd.sprite.x, rd.sprite.y);
        if (d < 12) {
          this.player.pickupRunes(rd.amount);
          rd.sprite.destroy();
          this._runeDrops.splice(i, 1);
          this.player.droppedRunes = null;
          this.game.events.emit('hudUpdate', this._hudPayload());
        }
      }
    }

    // ending check
    if (this.isBoss && this._tookTooth) {
      this._showEnding();
    }

    // lighting
    const lights = [
      { x: this.player.x, y: this.player.y - 4, radius: this.player.lightRadius, intensity: 1.0 },
    ];
    for (const lan of this.lanterns) {
      lights.push({ x: lan.x, y: lan.y - 6, radius: 60, intensity: 1.0 });
    }
    for (const p of this.props) {
      if (p.name === 'fungus_pod') lights.push({ x: p.x, y: p.y - 6, radius: 40, intensity: 0.8 });
    }
    this.lighting.render(this.cameras.main, lights);

    // periodic HUD updates (boss bar)
    if (this._lastHudPush == null || time - this._lastHudPush > 120) {
      this._lastHudPush = time;
      this.game.events.emit('hudUpdate', this._hudPayload());
    }
  }

  _collectPickup(p, idx) {
    Audio.play('pickup');
    if (p.kind === 'flask') this.player.pickupFlask();
    else if (p.kind === 'key') this.player.pickupKey();
    else if (p.kind === 'ember') this.player.pickupEmber();
    else if (p.kind === 'tooth') {
      this._tookTooth = true;
    }
    const label = ({ flask: 'Carrot Flask +1', key: 'Bone Key', ember: 'Ember of the Hollow', tooth: 'Tooth of the Devourer' })[p.kind] || '';
    if (label) {
      const t = this.add.text(p.x, p.y - 16, label, {
        fontFamily: 'Courier New, monospace',
        fontSize: '8px',
        color: '#c9a449',
      }).setOrigin(0.5).setDepth(60);
      this.tweens.add({ targets: t, y: p.y - 36, alpha: 0, duration: 1400, onComplete: () => t.destroy() });
    }
    p.destroy();
    this.pickups.splice(idx, 1);
    this.game.events.emit('hudUpdate', this._hudPayload());
  }

  _gateUnlocked(g) {
    if (!g.requires) return true;
    if (g.requires === 'bone_key') return this.player.hasKey;
    if (g.requires === 'clear') return this._allMobsDead();
    return this.player.flags.has(g.requires);
  }

  _gateLockedHint(g) {
    if (this._lockedHintAt && this.time.now - this._lockedHintAt < 3200) return;
    this._lockedHintAt = this.time.now;
    Audio.play('door_locked');
    const hint = ({
      bone_key: 'a key turns somewhere in the dark...',
      boss_switch: 'a rune-circle waits to be lit.',
      clear: 'the door is sealed — slay the rest.',
    })[g.requires] || 'sealed.';
    const t = this.add.text(g.wx, g.wy - 20, hint, {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#d8c8e8',
      stroke: '#0b0a10',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: t, alpha: 0, duration: 3000, delay: 1800, onComplete: () => t.destroy() });
  }

  _allMobsDead() {
    return this.enemies.every((e) => e.dying || !e.active);
  }

  _pulseDoor(sprite) {
    this.tweens.add({
      targets: sprite,
      alpha: { from: 1.0, to: 0.7 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _onRoomCleared() {
    // Only guide the player if this room actually has a clear-gated exit.
    const clearGates = this.gates.filter((g) => g.requires === 'clear');
    if (clearGates.length === 0) return;
    for (const g of clearGates) {
      if (g.sprite && g.sprite.texture.key !== 'prop_door_open') {
        g.sprite.setTexture('prop_door_open');
        this._pulseDoor(g.sprite);
      }
    }
    Audio.play('room_cleared');
    this.cameras.main.flash(220, 80, 60, 30);
    const t = this.add.text(CONFIG.GAME_W / 2, CONFIG.GAME_H / 2 - 40, 'the way opens — find the door', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#c9a449',
      stroke: '#0b0a10',
      strokeThickness: 3,
      letterSpacing: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1500).setAlpha(0);
    this.tweens.add({
      targets: t, alpha: 1, duration: 500, hold: 1300, yoyo: true,
      onComplete: () => t.destroy(),
    });
  }

  _switchPressedFx(s) {
    Audio.play('switch_press');
    this.cameras.main.flash(280, 220, 180, 80);
    this.cameras.main.shake(160, 0.004);
    const t = this.add.text(s.x, s.y - 22, 'the way south opens', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#c9a449',
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: t, y: s.y - 40, alpha: 0, duration: 1800, onComplete: () => t.destroy() });
  }

  _gateOpenFx(g) {
    Audio.play('door_open');
    this.cameras.main.flash(220, 80, 30, 30);
    if (g.sprite && g.sprite.texture.key !== 'prop_door_open') {
      g.sprite.setTexture('prop_door_open');
    }
    const txt = this.add.text(g.wx, g.wy - 20, '...the way opens.', {
      fontFamily: 'Courier New, monospace',
      fontSize: '8px',
      color: '#a89bb0',
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: txt, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
  }

  _goto(target, toX, toY) {
    if (this._transitioning) return;
    this._transitioning = true;
    const state = {
      hp: this.player.hp,
      stamina: this.player.stamina,
      flasks: this.player.flasks,
      runes: this.player.runes,
      hasKey: this.player.hasKey,
      hasEmber: this.player.hasEmber,
      lightRadius: this.player.lightRadius,
      droppedRunes: this.player.droppedRunes,
      flags: [...this.player.flags],
    };
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.time.delayedCall(320, () => {
      this.scene.restart({
        mapKey: target,
        toX, toY,
        preserveState: state,
      });
    });
  }

  _showEnding() {
    if (this._endingShown) return;
    this._endingShown = true;
    this.cameras.main.fadeOut(2200, 0, 0, 0);
    const t = this.add.text(CONFIG.GAME_W / 2, CONFIG.GAME_H / 2, 'The burrow is quiet again.', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#c9a449',
      stroke: '#0b0a10',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2000).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 2200, delay: 400 });
  }
}
