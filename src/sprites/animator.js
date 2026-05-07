// Minimal frame-swapping animator. Each "animation" is a list of texture keys
// that an entity cycles through at a fixed FPS. This avoids needing to use
// Phaser's spritesheet/anim manager for our generated single-frame textures.

export class Animator {
  constructor(sprite) {
    this.sprite = sprite;
    this.name = null;
    this.frames = [];
    this.frameIdx = 0;
    this.frameMs = 100;
    this.elapsed = 0;
    this.loop = true;
    this.onComplete = null;
    this.done = false;
  }

  play(name, frames, fps = 8, loop = true, onComplete = null) {
    if (this.name === name && !this.done) return;
    this.name = name;
    this.frames = frames;
    this.frameIdx = 0;
    this.frameMs = 1000 / fps;
    this.elapsed = 0;
    this.loop = loop;
    this.onComplete = onComplete;
    this.done = false;
    if (frames.length > 0) this.sprite.setTexture(frames[0]);
  }

  update(deltaMs) {
    if (!this.frames.length || this.done) return;
    this.elapsed += deltaMs;
    while (this.elapsed >= this.frameMs) {
      this.elapsed -= this.frameMs;
      this.frameIdx++;
      if (this.frameIdx >= this.frames.length) {
        if (this.loop) {
          this.frameIdx = 0;
        } else {
          this.frameIdx = this.frames.length - 1;
          this.done = true;
          if (this.onComplete) this.onComplete();
          return;
        }
      }
      this.sprite.setTexture(this.frames[this.frameIdx]);
    }
  }
}
