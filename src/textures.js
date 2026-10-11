import * as THREE from 'three';

// Procedural canvas textures for the rooms, built on tileable fractal noise
function make(w, h, draw, color = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d', { willReadFrequently: true }), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const smooth = (t) => t * t * (3 - 2 * t);

// Tileable fractal value noise in 0..1. cx/cy = lattice cells across x/y (stretch for grain).
function fbm(w, h, cx, cy, octaves, gain = 0.5) {
  const out = new Float32Array(w * h);
  let amp = 1, total = 0;
  for (let o = 0; o < octaves; o++) {
    const nx = cx << o, ny = cy << o;
    const g = new Float32Array(nx * ny);
    for (let i = 0; i < g.length; i++) g[i] = Math.random();
    for (let y = 0; y < h; y++) {
      const fy = (y / h) * ny, y0 = Math.floor(fy), ty = smooth(fy - y0);
      const r0 = y0 * nx, r1 = ((y0 + 1) % ny) * nx;
      for (let x = 0; x < w; x++) {
        const fx = (x / w) * nx, x0 = Math.floor(fx), tx = smooth(fx - x0), x1 = (x0 + 1) % nx;
        const a = g[r0 + x0] + (g[r0 + x1] - g[r0 + x0]) * tx;
        const b = g[r1 + x0] + (g[r1 + x1] - g[r1 + x0]) * tx;
        out[y * w + x] += (a + (b - a) * ty) * amp;
      }
    }
    total += amp;
    amp *= gain;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

// Multiply the canvas brightness by a noise field (1 +- strength)
function modulate(c, w, h, field, strength) {
  const img = c.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0, p = 0; i < field.length; i++, p += 4) {
    const k = 1 + (field[i] - 0.5) * 2 * strength;
    d[p] *= k;
    d[p + 1] *= k;
    d[p + 2] *= k;
  }
  c.putImageData(img, 0, 0);
}

function speckle(c, w, h, n, alpha) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * alpha;
    c.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
    const s = 1 + Math.random() * 2;
    c.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
}

// Hairline cracks: short wandering strokes
function cracks(c, w, h, n, alpha) {
  c.save();
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    let x = Math.random() * w, y = Math.random() * h, a = Math.random() * Math.PI * 2;
    c.strokeStyle = `rgba(40,25,15,${alpha * (0.5 + Math.random() * 0.5)})`;
    c.lineWidth = 0.5 + Math.random() * 0.8;
    c.beginPath();
    c.moveTo(x, y);
    const steps = 20 + Math.random() * 40;
    for (let s = 0; s < steps; s++) {
      a += (Math.random() - 0.5) * 0.9;
      x += Math.cos(a) * 4;
      y += Math.sin(a) * 4;
      c.lineTo(x, y);
    }
    c.stroke();
  }
  c.restore();
}

// Grey value map for roughness / bump variation
export const grime = (size = 512, cells = 6) => make(size, size, (c, w, h) => {
  const f = fbm(w, h, cells, cells, 5);
  const img = c.createImageData(w, h), d = img.data;
  for (let i = 0, p = 0; i < f.length; i++, p += 4) {
    const v = 70 + Math.min(1, Math.max(0, (f[i] - 0.5) * 2.2 + 0.5)) * 170;
    d[p] = d[p + 1] = d[p + 2] = v;
    d[p + 3] = 255;
  }
  c.putImageData(img, 0, 0);
}, false);

// Lime plaster: cloudy mottling, fine sand, hairline cracks
export const plaster = (color) => make(512, 512, (c, w, h) => {
  c.fillStyle = color;
  c.fillRect(0, 0, w, h);
  modulate(c, w, h, fbm(w, h, 3, 3, 6), 0.2);
  modulate(c, w, h, fbm(w, h, 32, 32, 2), 0.07);
  cracks(c, w, h, 7, 0.16);
  speckle(c, w, h, 6000, 0.05);
});

// Oiled planks: per-board tone, long grain streaks, knots, worn patina
export const planks = (color) => make(1024, 1024, (c, w, h) => {
  c.fillStyle = color;
  c.fillRect(0, 0, w, h);
  const rows = 8, rh = h / rows;
  const knots = [];
  for (let r = 0; r < rows; r++) {
    let x = -Math.random() * 300;
    while (x < w) {
      const len = 300 + Math.random() * 300;
      const shade = (Math.random() - 0.5) * 0.22;
      c.fillStyle = shade > 0 ? `rgba(255,240,220,${shade})` : `rgba(0,0,0,${-shade})`;
      c.fillRect(x, r * rh, len, rh);
      if (Math.random() < 0.45) knots.push([x + Math.random() * len, r * rh + rh * (0.25 + Math.random() * 0.5)]);
      c.fillStyle = 'rgba(0,0,0,.5)';
      c.fillRect(x, r * rh, 2, rh);
      x += len;
    }
    c.fillStyle = 'rgba(0,0,0,.55)';
    c.fillRect(0, r * rh, w, 2);
  }
  // Long grain: stretched noise, low frequency along the board, high across it
  modulate(c, w, h, fbm(w, h, 2, 64, 4, 0.6), 0.32);
  for (const [kx, ky] of knots) {
    const rx = 10 + Math.random() * 14, ry = rx * 0.45;
    const g = c.createRadialGradient(kx, ky, 0, kx, ky, rx);
    g.addColorStop(0, 'rgba(30,15,5,.55)');
    g.addColorStop(1, 'rgba(30,15,5,0)');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(kx, ky, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(30,15,5,.18)';
    for (let k = 1; k < 4; k++) {
      c.beginPath();
      c.ellipse(kx, ky, rx * (1 + k * 0.6), ry * (1 + k * 0.35), 0, 0, Math.PI * 2);
      c.stroke();
    }
  }
  modulate(c, w, h, fbm(w, h, 4, 4, 4), 0.14);
});

// Hand-knotted wool rug, worn and faded
export const rug = (accent, trim) => make(512, 720, (c, w, h) => {
  c.fillStyle = trim;
  c.fillRect(0, 0, w, h);
  c.fillStyle = accent;
  c.fillRect(24, 24, w - 48, h - 48);
  c.strokeStyle = '#F3E6CC';
  c.lineWidth = 6;
  c.strokeRect(44, 44, w - 88, h - 88);
  c.save();
  c.translate(w / 2, h / 2);
  c.rotate(Math.PI / 4);
  c.fillStyle = '#F3E6CC';
  c.fillRect(-90, -90, 180, 180);
  c.fillStyle = trim;
  c.fillRect(-60, -60, 120, 120);
  c.fillStyle = '#F2B632';
  c.fillRect(-24, -24, 48, 48);
  c.restore();
  c.fillStyle = '#F2B632';
  for (let y = 70; y < h - 70; y += 40) {
    for (const x of [64, w - 64]) {
      c.beginPath();
      c.arc(x, y, 8, 0, Math.PI * 2);
      c.fill();
    }
  }
  modulate(c, w, h, fbm(w, h, 3, 4, 5), 0.22);
  modulate(c, w, h, fbm(w, h, 128, 180, 1), 0.12);
  speckle(c, w, h, 5000, 0.08);
});

// Azulejo tiles with glaze variation and fine crazing
export const tiles = () => make(256, 256, (c, w, h) => {
  c.fillStyle = '#F4F1EA';
  c.fillRect(0, 0, w, h);
  c.strokeStyle = '#1F4E8C';
  c.fillStyle = '#1F4E8C';
  c.lineWidth = 6;
  for (const [x, y] of [[0, 0], [128, 0], [0, 128], [128, 128]]) {
    c.save();
    c.translate(x + 64, y + 64);
    c.beginPath();
    c.arc(0, 0, 40, 0, Math.PI * 2);
    c.stroke();
    for (let k = 0; k < 4; k++) {
      c.rotate(Math.PI / 2);
      c.beginPath();
      c.ellipse(0, -22, 8, 16, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.fillRect(-6, -6, 12, 12);
    c.restore();
    c.strokeRect(x + 3, y + 3, 122, 122);
  }
  modulate(c, w, h, fbm(w, h, 4, 4, 3), 0.12);
  cracks(c, w, h, 5, 0.1);
});

// White marble with soft grey veins, then pietra dura inlay
export const inlay = () => make(512, 512, (c, w, h) => {
  c.fillStyle = '#F4F1EA';
  c.fillRect(0, 0, w, h);
  const f = fbm(w, h, 3, 3, 5);
  const img = c.getImageData(0, 0, w, h), d = img.data;
  for (let y = 0, i = 0; y < h; y++) {
    for (let x = 0; x < w; x++, i++) {
      const t = (x / w) * 4 + (y / h) * 2 + f[i] * 6;
      const vein = Math.pow(1 - Math.abs(Math.sin(t * Math.PI)), 12) * 70;
      const p = i * 4;
      d[p] -= vein;
      d[p + 1] -= vein * 0.95;
      d[p + 2] -= vein * 0.9;
    }
  }
  c.putImageData(img, 0, 0);
  modulate(c, w, h, f, 0.05);
  c.translate(w / 2, h / 2);
  const cols = ['#7A2E2E', '#2F6B45', '#C9A24A', '#2E3A6B'];
  for (let k = 0; k < 8; k++) {
    c.rotate(Math.PI / 4);
    c.fillStyle = cols[k % 4];
    c.beginPath();
    c.ellipse(0, -90, 22, 60, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = '#C9A24A';
  c.beginPath();
  c.arc(0, 0, 30, 0, Math.PI * 2);
  c.fill();
});

// Stencilled paper label on a chest
export const label = (text, bg, ink) => make(512, 256, (c, w, h) => {
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);
  modulate(c, w, h, fbm(w, h, 4, 2, 5), 0.18);
  speckle(c, w, h, 3000, 0.12);
  c.strokeStyle = ink;
  c.lineWidth = 6;
  c.strokeRect(20, 20, w - 40, h - 40);
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.font = 'bold 54px Inter';
  c.globalAlpha = 0.88;
  c.fillText(text, w / 2, h / 2 + 18);
  c.globalAlpha = 1;
});
