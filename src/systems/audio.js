// Procedural audio engine. No external assets. Every sound is synthesized
// from oscillators and noise buffers via the Web Audio API. The AudioContext
// is created lazily on first user gesture (browsers block autoplay).

let ctx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let muted = false;
let currentMusic = null;
const lastPlayedAt = new Map();

const COOLDOWN_MS = {
  hit_enemy: 30,
  hit_player: 60,
  swing_light: 40,
  swing_heavy: 60,
};

export const Audio = {
  init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 0.7;
    masterGain.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.35;
    musicGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 1.0;
    sfxGain.connect(masterGain);
  },

  play(name) {
    if (!ctx || muted) return;
    const cd = COOLDOWN_MS[name];
    if (cd) {
      const now = ctx.currentTime * 1000;
      const last = lastPlayedAt.get(name) || 0;
      if (now - last < cd) return;
      lastPlayedAt.set(name, now);
    }
    const gen = SFX[name];
    if (gen) gen(ctx, sfxGain);
  },

  startMusic(name) {
    if (!ctx) return;
    if (currentMusic && currentMusic.name === name) return;
    const next = MUSIC[name];
    if (!next) return;
    const node = next(ctx, musicGain);
    if (currentMusic) {
      const fading = currentMusic;
      fading.gain.gain.cancelScheduledValues(ctx.currentTime);
      fading.gain.gain.setValueAtTime(fading.gain.gain.value, ctx.currentTime);
      fading.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
      setTimeout(() => fading.stop && fading.stop(), 1400);
    }
    node.gain.gain.setValueAtTime(0, ctx.currentTime);
    node.gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
    node.name = name;
    currentMusic = node;
  },

  stopMusic() {
    if (!ctx || !currentMusic) return;
    const fading = currentMusic;
    fading.gain.gain.cancelScheduledValues(ctx.currentTime);
    fading.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
    setTimeout(() => fading.stop && fading.stop(), 1200);
    currentMusic = null;
  },

  toggleMute() {
    muted = !muted;
    if (masterGain) {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.7, ctx.currentTime + 0.08);
    }
    return muted;
  },

  isMuted() { return muted; },
};

// ----------------------------------------------------------------------------
// Building blocks
// ----------------------------------------------------------------------------

function tone(c, dest, { freq, freq2, dur, type = 'sine', peak = 0.4, attack = 0.005, release = 0.05, detune = 0 }) {
  const osc = c.createOscillator();
  osc.type = type;
  osc.detune.value = detune;
  const g = c.createGain();
  const t = c.currentTime;
  osc.frequency.setValueAtTime(freq, t);
  if (freq2 != null) osc.frequency.exponentialRampToValueAtTime(Math.max(0.0001, freq2), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + dur + release);
  return { osc, g };
}

function noise(c, dest, { dur, peak = 0.3, attack = 0.005, filter, type = 'lowpass' }) {
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  let node = src;
  if (filter != null) {
    const bq = c.createBiquadFilter();
    bq.type = type;
    bq.frequency.value = filter;
    src.connect(bq);
    node = bq;
  }
  node.connect(g).connect(dest);
  src.start(t);
  src.stop(t + dur + 0.05);
  return { src, g };
}

// ----------------------------------------------------------------------------
// SFX library. Every entry is (ctx, dest) => void.
// ----------------------------------------------------------------------------

const SFX = {
  swing_light(c, d) {
    noise(c, d, { dur: 0.12, peak: 0.18, filter: 2200, type: 'bandpass' });
    tone(c, d, { freq: 600, freq2: 220, dur: 0.12, type: 'sawtooth', peak: 0.05 });
  },
  swing_heavy(c, d) {
    noise(c, d, { dur: 0.22, peak: 0.28, filter: 1200, type: 'bandpass' });
    tone(c, d, { freq: 320, freq2: 90, dur: 0.22, type: 'sawtooth', peak: 0.1 });
  },
  hit_enemy(c, d) {
    noise(c, d, { dur: 0.1, peak: 0.35, filter: 2400, type: 'highpass' });
    tone(c, d, { freq: 180, freq2: 80, dur: 0.12, type: 'square', peak: 0.22 });
  },
  hit_player(c, d) {
    noise(c, d, { dur: 0.18, peak: 0.3, filter: 600, type: 'lowpass' });
    tone(c, d, { freq: 120, freq2: 60, dur: 0.18, type: 'sine', peak: 0.3 });
  },
  enemy_death(c, d) {
    tone(c, d, { freq: 440, freq2: 110, dur: 0.35, type: 'square', peak: 0.18 });
    noise(c, d, { dur: 0.3, peak: 0.12, filter: 1400, type: 'lowpass' });
  },
  player_death(c, d) {
    tone(c, d, { freq: 220, freq2: 55, dur: 1.6, type: 'sawtooth', peak: 0.25, attack: 0.05 });
    tone(c, d, { freq: 220, freq2: 55, dur: 1.6, type: 'sine', peak: 0.18, detune: -12 });
  },
  roll(c, d) {
    noise(c, d, { dur: 0.22, peak: 0.22, filter: 1800, type: 'bandpass' });
  },
  flask(c, d) {
    tone(c, d, { freq: 660, freq2: 990, dur: 0.18, type: 'sine', peak: 0.18, attack: 0.01 });
    tone(c, d, { freq: 990, freq2: 1320, dur: 0.18, type: 'sine', peak: 0.12, attack: 0.06 });
  },
  pickup(c, d) {
    tone(c, d, { freq: 880, dur: 0.1, type: 'triangle', peak: 0.18 });
    setTimeout(() => tone(c, d, { freq: 1320, dur: 0.16, type: 'triangle', peak: 0.18 }), 90);
  },
  grace_rest(c, d) {
    tone(c, d, { freq: 220, dur: 1.2, type: 'sine', peak: 0.16, attack: 0.4 });
    tone(c, d, { freq: 277, dur: 1.2, type: 'sine', peak: 0.13, attack: 0.5 });
    tone(c, d, { freq: 330, dur: 1.2, type: 'sine', peak: 0.11, attack: 0.6 });
  },
  door_open(c, d) {
    tone(c, d, { freq: 80, freq2: 200, dur: 0.6, type: 'sawtooth', peak: 0.18 });
    noise(c, d, { dur: 0.5, peak: 0.1, filter: 400, type: 'lowpass' });
  },
  door_locked(c, d) {
    noise(c, d, { dur: 0.08, peak: 0.3, filter: 3200, type: 'highpass' });
    tone(c, d, { freq: 140, freq2: 90, dur: 0.1, type: 'square', peak: 0.18 });
  },
  switch_press(c, d) {
    noise(c, d, { dur: 0.05, peak: 0.2, filter: 4000, type: 'highpass' });
    tone(c, d, { freq: 1320, dur: 0.4, type: 'sine', peak: 0.16, attack: 0.005 });
  },
  room_cleared(c, d) {
    tone(c, d, { freq: 440, dur: 0.16, type: 'triangle', peak: 0.18 });
    setTimeout(() => tone(c, d, { freq: 660, dur: 0.16, type: 'triangle', peak: 0.18 }), 130);
    setTimeout(() => tone(c, d, { freq: 880, dur: 0.32, type: 'triangle', peak: 0.18 }), 260);
  },
  boss_roar(c, d) {
    tone(c, d, { freq: 90, freq2: 60, dur: 1.2, type: 'sawtooth', peak: 0.3 });
    tone(c, d, { freq: 110, freq2: 70, dur: 1.2, type: 'sawtooth', peak: 0.24, detune: -20 });
    noise(c, d, { dur: 1.0, peak: 0.15, filter: 800, type: 'lowpass' });
  },
  boss_slam(c, d) {
    tone(c, d, { freq: 80, freq2: 30, dur: 0.4, type: 'sine', peak: 0.45 });
    noise(c, d, { dur: 0.3, peak: 0.3, filter: 300, type: 'lowpass' });
  },
  boss_projectile(c, d) {
    tone(c, d, { freq: 440, freq2: 880, dur: 0.18, type: 'sine', peak: 0.16 });
    noise(c, d, { dur: 0.18, peak: 0.08, filter: 3200, type: 'highpass' });
  },
  ending_chime(c, d) {
    tone(c, d, { freq: 330, dur: 1.4, type: 'sine', peak: 0.16, attack: 0.08 });
    tone(c, d, { freq: 495, dur: 1.6, type: 'sine', peak: 0.13, attack: 0.18 });
    setTimeout(() => tone(c, d, { freq: 660, dur: 1.2, type: 'triangle', peak: 0.12, attack: 0.04 }), 220);
  },
  menu_select(c, d) {
    tone(c, d, { freq: 880, freq2: 1320, dur: 0.18, type: 'sine', peak: 0.22 });
  },
};

// ----------------------------------------------------------------------------
// Music: looping ambient layers. Each generator returns { gain, stop }.
// ----------------------------------------------------------------------------

function buildDrone(c, dest, { roots, lfoRate = 0.08, filterFreq = 600 }) {
  const out = c.createGain();
  out.gain.value = 0;
  out.connect(dest);

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 4;
  filter.connect(out);

  const lfo = c.createOscillator();
  lfo.frequency.value = lfoRate;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 200;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();

  const oscs = [];
  for (const r of roots) {
    const a = c.createOscillator();
    a.type = 'sawtooth';
    a.frequency.value = r;
    const b = c.createOscillator();
    b.type = 'sawtooth';
    b.frequency.value = r;
    b.detune.value = 8;
    const g = c.createGain();
    g.gain.value = 0.06;
    a.connect(g);
    b.connect(g);
    g.connect(filter);
    a.start();
    b.start();
    oscs.push(a, b);
  }

  return {
    gain: out,
    stop() {
      try { lfo.stop(); } catch {}
      for (const o of oscs) { try { o.stop(); } catch {} }
    },
  };
}

const MUSIC = {
  area(c, dest) {
    return buildDrone(c, dest, { roots: [55, 82.5, 110], lfoRate: 0.05, filterFreq: 500 });
  },
  boss(c, dest) {
    const layer = buildDrone(c, dest, { roots: [49, 73.5, 98, 130.81], lfoRate: 0.12, filterFreq: 700 });
    // Heartbeat: low thump every ~700ms
    const interval = setInterval(() => {
      if (!ctx || ctx.state !== 'running') return;
      tone(c, layer.gain, { freq: 60, freq2: 30, dur: 0.18, type: 'sine', peak: 0.4 });
    }, 720);
    const baseStop = layer.stop;
    layer.stop = () => { clearInterval(interval); baseStop(); };
    return layer;
  },
};
