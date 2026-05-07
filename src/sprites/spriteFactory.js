import { PALETTE } from './palette.js';

// Each sprite is an array of strings; each string is a row of hex digits (0..f)
// indexing into PALETTE. '.' or ' ' are treated as transparent for readability.
function charToIndex(ch) {
  if (ch === '.' || ch === ' ') return 0;
  const v = parseInt(ch, 16);
  return Number.isNaN(v) ? 0 : v;
}

function normalizeRows(rows) {
  let w = 0;
  for (const r of rows) if (r.length > w) w = r.length;
  return { width: w, rows: rows.map((r) => r.padEnd(w, '.')) };
}

export function pixelDataToCanvas(rowsIn) {
  const { width: w, rows } = normalizeRows(rowsIn);
  const h = rows.length;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const idx = charToIndex(row[x]);
      if (idx === 0) continue;
      const color = PALETTE[idx];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

// Mirror a pixel-data array horizontally (used to derive left-facing from right-facing).
export function mirrorRows(rows) {
  return rows.map((r) => r.split('').reverse().join(''));
}

// Register a single-frame texture in the Phaser scene under `key`.
export function addSpriteTexture(scene, key, rows) {
  if (scene.textures.exists(key)) return;
  const canvas = pixelDataToCanvas(rows);
  scene.textures.addCanvas(key, canvas);
}

// Register a multi-frame texture as a horizontal spritesheet, where each frame
// is the same size and frames are concatenated horizontally.
export function addSpriteSheet(scene, key, frames) {
  if (scene.textures.exists(key)) return;
  // Normalize every frame and find the largest dimensions across frames.
  const norm = frames.map((f) => normalizeRows(f));
  const frameH = Math.max(...norm.map((n) => n.rows.length));
  const frameW = Math.max(...norm.map((n) => n.width));
  const sheetW = frameW * frames.length;
  const canvas = document.createElement('canvas');
  canvas.width = sheetW;
  canvas.height = frameH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  norm.forEach(({ rows }, fi) => {
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const idx = charToIndex(row[x]);
        if (idx === 0) continue;
        const color = PALETTE[idx];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(fi * frameW + x, y, 1, 1);
      }
    }
  });
  scene.textures.addSpriteSheet(key, canvas, {
    frameWidth: frameW,
    frameHeight: frameH,
  });
}

// Helper that creates an animation in the scene's anim manager.
export function makeAnim(scene, key, sheetKey, frameRange, frameRate, repeat = -1) {
  if (scene.anims.exists(key)) return;
  scene.anims.create({
    key,
    frames: scene.anims.generateFrameNumbers(sheetKey, frameRange),
    frameRate,
    repeat,
  });
}
