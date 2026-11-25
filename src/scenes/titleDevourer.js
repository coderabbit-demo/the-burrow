// The Devourer hangs above the path. Each pose is painted on the same
// two-game-pixel grid as the surrounding title illustration.
export function animateDevourer(scene) {
  const key = 'title_devourer';
  const texture = scene.textures.exists(key)
    ? scene.textures.get(key) : scene.textures.createCanvas(key, 110, 120);
  scene.add.image(240, 0, key).setOrigin(0).setScale(2);
  const ctx = texture.getContext();
  const tau = Math.PI * 2;

  // Fill scanlines on integer coordinates for crisp diagonal limbs.
  function plate(color, points) {
    ctx.fillStyle = color;
    const ys = points.map(p => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y < Math.ceil(Math.max(...ys)); y++) {
      const edges = [];
      const line = y + 0.5;
      for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % points.length];
        if (line >= Math.min(y1, y2) && line < Math.max(y1, y2)) {
          edges.push(Math.round(x1 + (line - y1) * (x2 - x1) / (y2 - y1)));
        }
      }
      edges.sort((a, b) => a - b);
      for (let i = 0; i < edges.length; i += 2) ctx.fillRect(edges[i], y, edges[i + 1] - edges[i], 1);
    }
  }

  function draw(frame) {
    const t = frame / 96;
    // A slow descent, a short mandible strike, then a retreat into the arch.
    const descent = (1 - Math.cos(t * tau)) / 2;
    const strike = Math.max(0, 1 - Math.abs(t - 0.61) / 0.085);
    const cx = 58 + Math.round(3 * Math.sin(t * tau));
    const cy = 23 + Math.round(30 * descent + 7 * strike);
    const shape = (color, points, side = 1) => plate(color, points.map(([x, y]) => [cx + side * x, cy + y]));
    ctx.clearRect(0, 0, 110, 120);

    // Suspension strands catch the distant light above the moving abdomen.
    plate('#817184', [[56,0],[57,0],[cx+1,cy-17],[cx,cy-17]]);
    plate('#504258', [[48,0],[49,0],[cx-5,cy-14],[cx-6,cy-14]]);
    for (const side of [-1, 1]) {
      for (let leg = 0; leg < 4; leg++) {
        const swing = Math.round(4 * Math.sin(t * tau * 2 + leg * 1.4 + side * 0.6));
        const root = -11 + leg * 6;
        const knee = 18 + leg * 3;
        const ky = root - 10 + swing - 3 * strike;
        const foot = 30 + leg * 2 + swing;
        const fy = root + 5 + leg * 3 + 6 * strike;
        shape('#191424', [[6,root],[knee-2,ky-3],[knee+2,ky-2],[foot,fy-4],[foot-1,fy+6],[foot-4,fy-3],[knee,ky+3],[8,root+5]],side);
        shape(side === 1 ? '#94555a' : '#674254', [[9,root],[knee-2,ky-2],[knee+1,ky-1],[foot-2,fy-5],[knee,ky+1]],side);
        shape('#bc8276', [[knee-2,ky-2],[knee+1,ky-2],[knee+2,ky],[knee,ky]],side);
      }
    }

    shape('#1b1524', [[0,-24],[9,-22],[15,-15],[16,-4],[12,5],[10,14],[4,20],[-5,20],[-13,13],[-13,4],[-16,-4],[-14,-17],[-8,-23]]);
    for (const side of [-1,1]) {
      shape(side === 1 ? '#6b394a' : '#4a2c40', [[1,-21],[9,-19],[13,-13],[13,-5],[6,1],[1,4]],side);
      shape('#98545a', [[2,-21],[8,-19],[11,-16],[7,-17],[3,-18]],side);
      shape('#321e32', [[2,-10],[9,-7],[13,-10],[12,-5],[6,-1],[2,0]],side);
      shape('#613847', [[1,5],[10,0],[13,4],[10,12],[4,15],[1,13]],side);
      const gape = Math.round(6 * descent - 5 * strike);
      shape('#2a1e2a', [[7,13],[11,10],[13+gape,17],[10+gape,23],[3+gape,28],[7+gape,19]],side);
      shape('#c29a87', [[11+gape,16],[12+gape,18],[9+gape,23],[4+gape,26],[8+gape,20]],side);
      const eye = descent > 0.4 ? '#ffc37c' : '#e77961';
      shape('#a34c50', [[2,8],[10,5],[8,10],[3,12]],side);
      shape(eye, [[3,8],[9,6],[7,9],[3,10]],side);
      shape('#ec946a', [[10,3],[12,2],[11,5],[9,6]],side);
    }
    texture.refresh();
  }

  draw(0);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let frame = 0;
  scene.time.addEvent({ delay: 1000 / 12, loop: true, callback: () => {
    frame = (frame + 1) % 96;
    draw(frame);
  } });
}
