// Painted plates: procedural scenery in the manner of Indian miniatures and oil landscapes.
// Each chapter gets 4 layers: bg (sky), far (ranges, water), mid (ground, landmark, trees), fg (foliage).
// Seeded per chapter, so every visit paints the same picture.

const GOLD = '#C9A24A', INK = '#2A1A10';

function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgb = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const hex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); };
const shade = (a, k) => hex(rgb(a).map((v) => v * k));
const css = (a, alpha = 1) => { const [r, g, b] = rgb(a); return `rgba(${r},${g},${b},${alpha})`; };

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

// Smooth random ridge line: returns -1..1 for u in 0..1
function ridge(r, octaves = 5, base = 1.5) {
  const waves = Array.from({ length: octaves }, (_, k) => ({ f: (k + 1) * (base + r() * 1.5), p: r() * Math.PI * 2, a: 1 / (k + 1.2) }));
  const norm = waves.reduce((s, w) => s + w.a, 0);
  return (u) => waves.reduce((s, w) => s + Math.sin(u * w.f * Math.PI * 2 + w.p) * w.a, 0) / norm;
}

function areaPath(w, h, top) {
  const p = new Path2D();
  p.moveTo(0, h);
  for (let i = 0; i <= 240; i++) p.lineTo((i / 240) * w, top(i / 240));
  p.lineTo(w, h);
  p.closePath();
  return p;
}

// Short curved brush strokes inside a box (clip first to confine them)
function strokes(x, r, box, colors, n, len, width, alpha, angle = 0, spread = 0.35) {
  x.save();
  x.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const px = box.x + r() * box.w, py = box.y + r() * box.h;
    const a = angle + (r() - 0.5) * spread, l = len * (0.5 + r());
    x.strokeStyle = css(colors[(r() * colors.length) | 0], alpha * (0.4 + r() * 0.6));
    x.lineWidth = width * (0.5 + r());
    x.beginPath();
    x.moveTo(px, py);
    x.quadraticCurveTo(px + Math.cos(a) * l * 0.5, py + Math.sin(a) * l * 0.5 + (r() - 0.5) * width * 2,
      px + Math.cos(a) * l, py + Math.sin(a) * l);
    x.stroke();
  }
  x.restore();
}

// Fill a path with a vertical gradient, then work brush strokes into it
function paintArea(x, r, path, box, top, bottom, cols, n, st) {
  x.save();
  const g = x.createLinearGradient(0, box.y, 0, box.y + box.h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  x.fillStyle = g;
  x.fill(path);
  x.clip(path);
  strokes(x, r, box, cols, n, st.len, st.width, st.alpha, st.angle || 0, st.spread ?? 0.35);
  x.restore();
}

// Age the paint where it exists: warm varnish, craquelure, pigment specks
function age(x, r, w, h, k = 1) {
  x.save();
  x.globalCompositeOperation = 'source-atop';
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(90,60,20,0.10)');
  g.addColorStop(1, 'rgba(60,35,10,0.16)');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  const n = Math.round(((w * h) / 26000) * k);
  x.lineWidth = Math.max(0.6, h / 1400);
  for (let i = 0; i < n; i++) {
    let px = r() * w, py = r() * h, a = r() * Math.PI * 2;
    x.strokeStyle = `rgba(35,20,8,${0.05 + r() * 0.07})`;
    x.beginPath();
    x.moveTo(px, py);
    for (let s = 0, m = 3 + r() * 6; s < m; s++) {
      a += (r() - 0.5) * 1.6;
      px += Math.cos(a) * h * 0.012;
      py += Math.sin(a) * h * 0.012;
      x.lineTo(px, py);
    }
    x.stroke();
  }
  for (let i = 0; i < n * 4; i++) {
    x.fillStyle = r() < 0.5 ? 'rgba(20,10,0,0.08)' : 'rgba(255,245,220,0.07)';
    const s = 1 + r() * 2.5;
    x.fillRect(r() * w, r() * h, s, s);
  }
  x.restore();
}

// ---------- Sky ----------
function cloud(x, r, cx, cy, s, sky) {
  const light = mix(sky, '#FFFFFF', 0.8), mid = mix(sky, '#F3E6CC', 0.4), dark = mix(sky, '#5E5470', 0.35);
  const puffs = 8 + ((r() * 8) | 0);
  for (let i = 0; i < puffs; i++) {
    const px = cx + (r() - 0.5) * s * 3, py = cy + (r() - 0.5) * s * 0.6, pr = s * (0.35 + r() * 0.5);
    const g = x.createRadialGradient(px - pr * 0.2, py - pr * 0.45, pr * 0.05, px, py, pr);
    g.addColorStop(0, css(light, 0.95));
    g.addColorStop(0.55, css(mid, 0.75));
    g.addColorStop(0.85, css(dark, 0.35));
    g.addColorStop(1, css(dark, 0));
    x.fillStyle = g;
    x.beginPath();
    x.arc(px, py, pr, 0, Math.PI * 2);
    x.fill();
  }
}

function moon(x, cx, cy, rr) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr * 5);
  g.addColorStop(0, 'rgba(255,250,235,0.5)');
  g.addColorStop(1, 'rgba(255,250,235,0)');
  x.fillStyle = g;
  x.fillRect(cx - rr * 5, cy - rr * 5, rr * 10, rr * 10);
  x.fillStyle = '#FBF4E2';
  x.beginPath();
  x.arc(cx, cy, rr, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = 'rgba(180,170,150,0.25)';
  for (const [dx, dy, s] of [[-0.3, -0.2, 0.25], [0.25, 0.1, 0.18], [-0.05, 0.35, 0.14]]) {
    x.beginPath();
    x.arc(cx + dx * rr, cy + dy * rr, s * rr, 0, Math.PI * 2);
    x.fill();
  }
}

function paintSky(ch, r, w, h) {
  const [c, x] = canvas(w, h);
  const b = ch.biome, hz = h * 0.54, A = (w * h) / 2097152;
  const zenith = mix(b.sky, '#2E3A6B', 0.5), high = mix(b.sky, '#6F8FB0', 0.15), low = mix(b.sky, '#FFF3D6', 0.5);
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, zenith);
  g.addColorStop(0.3, high);
  g.addColorStop(0.54, low);
  g.addColorStop(1, mix(b.far, low, 0.5));
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);

  // Glow of a low sun
  const sx = w * (0.25 + r() * 0.5), sy = hz - h * 0.05;
  const sun = x.createRadialGradient(sx, sy, 0, sx, sy, h * 0.55);
  sun.addColorStop(0, 'rgba(255,238,200,0.7)');
  sun.addColorStop(0.35, 'rgba(255,220,170,0.22)');
  sun.addColorStop(1, 'rgba(255,220,170,0)');
  x.fillStyle = sun;
  x.fillRect(0, 0, w, h);

  strokes(x, r, { x: 0, y: 0, w, h: hz }, [zenith, high, low, '#FFFFFF'], 1800 * A, h * 0.08, h * 0.012, 0.07, 0, 0.15);

  // Billowing clouds, lit from above
  const count = 7 + ((r() * 5) | 0);
  for (let k = 0; k < count; k++) cloud(x, r, (w * (k + r())) / count, h * (0.1 + r() * 0.3), h * (0.05 + r() * 0.07), b.sky);
  if (ch.id === 'kutch') moon(x, w * 0.62, h * 0.22, h * 0.05);

  // Haze on the horizon
  const hg = x.createLinearGradient(0, hz - h * 0.14, 0, hz + h * 0.04);
  hg.addColorStop(0, css(low, 0));
  hg.addColorStop(1, css(low, 0.65));
  x.fillStyle = hg;
  x.fillRect(0, hz - h * 0.14, w, h * 0.18);
  age(x, r, w, h, 0.6);
  return c;
}

// ---------- Far ranges and water ----------
function paintFar(ch, r, w, h) {
  const [c, x] = canvas(w, h);
  const b = ch.biome, hz = h * 0.54, A = (w * h) / 2097152;
  const ranges = ch.id === 'kutch'
    ? [[0.02, b.far, 0.5]]
    : [[b.snow ? 0.22 : 0.13, b.far, 0.55], [b.snow ? 0.13 : 0.09, mix(b.far, b.hill, 0.5), 0.3], [0.07, b.hill, 0.12]];
  ranges.forEach(([amp, col, haze], k) => {
    const fn = ridge(r, 6, 1 + k);
    const peaks = b.snow && k < 2;
    const y0 = hz + k * h * 0.025;
    const top = (u) => (peaks ? y0 - Math.pow(1 - Math.abs(fn(u)), 2.4) * amp * h : y0 - (fn(u) * 0.5 + 0.5) * amp * h);
    const base = mix(col, b.sky, haze);
    const path = areaPath(w, h, top);
    const box = { x: 0, y: y0 - amp * h, w, h: h - (y0 - amp * h) };
    paintArea(x, r, path, box, mix(base, '#FFF3D6', 0.18), shade(base, 0.8),
      [base, shade(base, 0.85), mix(base, '#FFF3D6', 0.3)], 1400 * A,
      { len: h * 0.03, width: h * 0.006, alpha: 0.18, angle: -0.3, spread: 1.2 });
    if (peaks) {
      x.save();
      x.clip(path);
      const line = y0 - amp * h * 0.5;
      const sg = x.createLinearGradient(0, y0 - amp * h, 0, line + h * 0.02);
      sg.addColorStop(0, '#FBFBF7');
      sg.addColorStop(1, 'rgba(240,244,248,0)');
      x.fillStyle = sg;
      x.fillRect(0, 0, w, line + h * 0.02);
      strokes(x, r, { x: 0, y: y0 - amp * h, w, h: amp * h * 0.6 }, ['#FFFFFF', '#DCE6F0', '#B8C8DA'], 900 * A, h * 0.02, h * 0.004, 0.5, 1.2, 0.8);
      x.restore();
    }
  });
  if (b.water) {
    const wy = hz + h * 0.01;
    const water = mix(b.sky, '#2E5E73', 0.4);
    const g = x.createLinearGradient(0, wy, 0, h);
    g.addColorStop(0, mix(water, '#FFF3D6', 0.35));
    g.addColorStop(1, shade(water, 0.7));
    x.fillStyle = g;
    x.fillRect(0, wy, w, h - wy);
    x.save();
    x.beginPath();
    x.rect(0, wy, w, h - wy);
    x.clip();
    strokes(x, r, { x: 0, y: wy, w, h: h - wy }, ['#FFFFFF', mix(water, '#FFF3D6', 0.6), shade(water, 0.8)], 1600 * A, h * 0.04, h * 0.0025, 0.35, 0, 0.05);
    x.restore();
  }
  age(x, r, w, h, 0.8);
  return c;
}

// ---------- Architecture primitives (flat miniature style) ----------
function block(x, cx, by, w, h, fill) {
  x.fillStyle = fill;
  x.fillRect(cx - w / 2, by - h, w, h);
}

function finial(x, cx, y, len) {
  x.strokeStyle = GOLD;
  x.lineWidth = Math.max(1.5, len * 0.08);
  x.beginPath();
  x.moveTo(cx, y);
  x.lineTo(cx, y - len);
  x.stroke();
  x.fillStyle = GOLD;
  x.beginPath();
  x.arc(cx, y - len * 0.55, len * 0.12, 0, Math.PI * 2);
  x.fill();
}

function onionDome(x, cx, by, rw, rh, fill) {
  x.fillStyle = fill;
  x.beginPath();
  x.moveTo(cx - rw, by);
  x.bezierCurveTo(cx - rw * 1.25, by - rh * 0.55, cx - rw * 0.15, by - rh * 0.8, cx, by - rh);
  x.bezierCurveTo(cx + rw * 0.15, by - rh * 0.8, cx + rw * 1.25, by - rh * 0.55, cx + rw, by);
  x.closePath();
  x.fill();
  finial(x, cx, by - rh, rh * 0.3);
}

function archRow(x, cx, by, w, h, n, fill) {
  const cw = w / n;
  x.fillStyle = fill;
  for (let i = 0; i < n; i++) {
    const ax = cx - w / 2 + cw * (i + 0.5), aw = cw * 0.32;
    x.beginPath();
    x.moveTo(ax - aw, by);
    x.lineTo(ax - aw, by - h + aw);
    x.quadraticCurveTo(ax - aw, by - h, ax, by - h - aw * 0.4);
    x.quadraticCurveTo(ax + aw, by - h, ax + aw, by - h + aw);
    x.lineTo(ax + aw, by);
    x.closePath();
    x.fill();
  }
}

function chhatri(x, cx, by, s, fill, dome) {
  block(x, cx - s * 0.35, by, s * 0.08, s * 0.5, fill);
  block(x, cx + s * 0.35, by, s * 0.08, s * 0.5, fill);
  block(x, cx, by - s * 0.5, s * 0.95, s * 0.08, fill);
  onionDome(x, cx, by - s * 0.58, s * 0.42, s * 0.5, dome);
}

function minaret(x, cx, by, w, h, fill) {
  x.fillStyle = fill;
  x.beginPath();
  x.moveTo(cx - w / 2, by);
  x.lineTo(cx - w * 0.38, by - h);
  x.lineTo(cx + w * 0.38, by - h);
  x.lineTo(cx + w / 2, by);
  x.closePath();
  x.fill();
  for (const t of [0.35, 0.65, 0.95]) block(x, cx, by - h * t + h * 0.02, w * 1.3, h * 0.025, fill);
  chhatri(x, cx, by - h, w * 1.4, fill, fill);
}

function tiers(x, cx, by, w, h, n, roof, wall) {
  block(x, cx, by, w * 0.55, h * 0.3, wall);
  let y = by - h * 0.3;
  for (let i = 0; i < n; i++) {
    const ww = w * (1 - (i / n) * 0.55);
    x.fillStyle = shade(roof, 1 + (i / n) * 0.15);
    x.beginPath();
    x.moveTo(cx - ww / 2, y);
    x.lineTo(cx + ww / 2, y);
    x.lineTo(cx + ww * 0.25, y - h * 0.13);
    x.lineTo(cx - ww * 0.25, y - h * 0.13);
    x.closePath();
    x.fill();
    y -= h * 0.13;
    if (i < n - 1) {
      block(x, cx, y, ww * 0.42, h * 0.05, wall);
      y -= h * 0.05;
    }
  }
  finial(x, cx, y, h * 0.12);
}

function flags(x, x1, y1, x2, y2, n, s) {
  const cols = ['#2E5E9E', '#F3F3EE', '#C24E3A', '#2F7A45', '#F2B632'];
  const sag = s * 0.25;
  const pt = (t) => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * sag];
  x.strokeStyle = 'rgba(60,40,20,0.6)';
  x.lineWidth = Math.max(1, s * 0.006);
  x.beginPath();
  for (let i = 0; i <= 30; i++) {
    const [px, py] = pt(i / 30);
    if (i) x.lineTo(px, py);
    else x.moveTo(px, py);
  }
  x.stroke();
  for (let i = 1; i < n; i++) {
    const [px, py] = pt(i / n);
    x.fillStyle = cols[i % cols.length];
    x.fillRect(px - s * 0.03, py, s * 0.06, s * 0.08);
  }
}

// One landmark per city, drawn at base (cx, by) with scale s. Return { pool: [w, h] } to sit on water.
const LANDMARKS = {
  srinagar(x, r, cx, by, s) {
    const wood = '#5A3A22', cabin = '#E9DCC4', trim = '#3A2416';
    for (let k = -1; k <= 1; k++) {
      const bx = cx + k * s * 1.25, bl = s * 1.05, y = by;
      x.fillStyle = wood;
      x.beginPath();
      x.moveTo(bx - bl / 2 - s * 0.08, y - s * 0.1);
      x.lineTo(bx + bl / 2 + s * 0.08, y - s * 0.1);
      x.lineTo(bx + bl / 2, y);
      x.lineTo(bx - bl / 2, y);
      x.closePath();
      x.fill();
      block(x, bx, y - s * 0.1, bl * 0.9, s * 0.22, cabin);
      archRow(x, bx, y - s * 0.13, bl * 0.9, s * 0.12, 6, trim);
      x.fillStyle = trim;
      x.beginPath();
      x.moveTo(bx - bl * 0.5, y - s * 0.32);
      x.lineTo(bx, y - s * 0.45);
      x.lineTo(bx + bl * 0.5, y - s * 0.32);
      x.closePath();
      x.fill();
    }
    const sx = cx + s * 2.1, sy = by;
    x.fillStyle = wood;
    x.beginPath();
    x.moveTo(sx - s * 0.5, sy - s * 0.08);
    x.quadraticCurveTo(sx, sy + s * 0.04, sx + s * 0.5, sy - s * 0.08);
    x.lineTo(sx + s * 0.35, sy);
    x.lineTo(sx - s * 0.35, sy);
    x.closePath();
    x.fill();
    block(x, sx - s * 0.18, sy - s * 0.06, s * 0.015, s * 0.14, wood);
    block(x, sx + s * 0.18, sy - s * 0.06, s * 0.015, s * 0.14, wood);
    block(x, sx, sy - s * 0.2, s * 0.46, s * 0.05, '#B5523B');
    return { pool: [s * 5.2, s * 0.45] };
  },
  manali(x, r, cx, by, s) {
    block(x, cx, by, s * 0.9, s * 0.12, '#8C8272');
    tiers(x, cx, by - s * 0.12, s * 1.0, s * 1.3, 4, '#5A3A22', '#9C7A52');
  },
  amritsar(x, r, cx, by, s) {
    const gold = '#D9A93A', deep = '#9A6A1E', light = '#F2D58A', marble = '#EFE7D8';
    block(x, cx, by, s * 1.3, s * 0.1, marble);
    block(x, cx, by - s * 0.1, s * 1.1, s * 0.42, gold);
    archRow(x, cx, by - s * 0.14, s * 1.1, s * 0.22, 5, deep);
    block(x, cx, by - s * 0.52, s * 0.75, s * 0.2, gold);
    archRow(x, cx, by - s * 0.55, s * 0.75, s * 0.1, 4, deep);
    onionDome(x, cx, by - s * 0.72, s * 0.3, s * 0.42, light);
    for (const k of [-1, 1]) chhatri(x, cx + k * s * 0.5, by - s * 0.52, s * 0.16, gold, light);
    return { pool: [s * 4, s * 0.4] };
  },
  jaipur(x, r, cx, by, s) {
    const pink = '#E0907A', deep = '#9A4A3E', light = '#F2B8A0';
    const lv = 5, hh = s * 0.2;
    for (let i = 0; i < lv; i++) {
      const ww = s * 1.7 * (1 - i * 0.15), y = by - i * hh;
      block(x, cx, y, ww, hh, i % 2 ? pink : mix(pink, light, 0.3));
      const n = Math.max(3, Math.round(ww / (s * 0.13)));
      archRow(x, cx, y - hh * 0.15, ww, hh * 0.55, n, deep);
      for (let k = 0; k < n; k++) onionDome(x, cx - ww / 2 + (ww / n) * (k + 0.5), y - hh, s * 0.035, s * 0.06, light);
    }
    onionDome(x, cx, by - lv * hh, s * 0.12, s * 0.2, light);
  },
  agra(x, r, cx, by, s) {
    const white = '#F2EEE6', shadowed = '#CFC6B6', dark = '#A89C88';
    block(x, cx, by, s * 2.8, s * 0.1, shadowed);
    const b2 = by - s * 0.1;
    block(x, cx, b2, s * 1.2, s * 0.62, white);
    archRow(x, cx, b2 - s * 0.05, s * 1.2, s * 0.22, 3, dark);
    archRow(x, cx, b2 - s * 0.33, s * 1.2, s * 0.2, 3, dark);
    block(x, cx, b2 - s * 0.62, s * 0.52, s * 0.1, white);
    onionDome(x, cx, b2 - s * 0.72, s * 0.34, s * 0.62, white);
    for (const k of [-1, 1]) {
      chhatri(x, cx + k * s * 0.42, b2 - s * 0.62, s * 0.2, white, white);
      minaret(x, cx + k * s * 1.25, b2, s * 0.09, s * 0.95, white);
    }
  },
  goa(x, r, cx, by, s) {
    const white = '#F4F1EA', dark = '#6E7A8A', trim = '#1F4E8C';
    block(x, cx, by, s * 0.9, s * 0.75, white);
    x.fillStyle = white;
    x.beginPath();
    x.moveTo(cx - s * 0.45, by - s * 0.75);
    x.lineTo(cx, by - s * 1.0);
    x.lineTo(cx + s * 0.45, by - s * 0.75);
    x.closePath();
    x.fill();
    archRow(x, cx, by, s * 0.9, s * 0.4, 1, dark);
    archRow(x, cx, by - s * 0.5, s * 0.9, s * 0.14, 3, dark);
    for (const k of [-1, 1]) {
      const tx = cx + k * s * 0.6;
      block(x, tx, by, s * 0.32, s * 1.05, white);
      archRow(x, tx, by - s * 0.75, s * 0.32, s * 0.14, 1, dark);
      onionDome(x, tx, by - s * 1.05, s * 0.14, s * 0.18, white);
    }
    x.fillStyle = trim;
    x.fillRect(cx - s * 0.012, by - s * 1.18, s * 0.024, s * 0.18);
    x.fillRect(cx - s * 0.06, by - s * 1.13, s * 0.12, s * 0.024);
  },
  gangtok(x, r, cx, by, s) {
    const white = '#F2EBDD', red = '#8A2E2A', gold = '#D9A93A', dark = '#3A2416';
    block(x, cx, by, s * 1.5, s * 0.38, white);
    block(x, cx, by - s * 0.3, s * 1.5, s * 0.08, red);
    for (let k = 0; k < 7; k++) block(x, cx - s * 0.6 + k * s * 0.2, by - s * 0.08, s * 0.07, s * 0.14, dark);
    block(x, cx, by - s * 0.38, s * 0.9, s * 0.26, red);
    for (let k = 0; k < 4; k++) block(x, cx - s * 0.3 + k * s * 0.2, by - s * 0.45, s * 0.07, s * 0.1, gold);
    tiers(x, cx, by - s * 0.64, s * 1.0, s * 0.5, 2, gold, red);
    flags(x, cx, by - s * 1.1, cx - s * 2.2, by - s * 0.1, 22, s);
    flags(x, cx, by - s * 1.1, cx + s * 2.2, by - s * 0.1, 22, s);
  },
  kutch(x, r, cx, by, s) {
    const wall = '#EADFCB', thatch = '#9E7E4A', red = '#B5523B';
    [[-0.9, 0.8], [0, 1], [0.95, 0.85], [1.7, 0.7]].forEach(([dx, k]) => {
      const hx = cx + dx * s, hw = s * 0.5 * k, hh = s * 0.35 * k;
      x.fillStyle = wall;
      x.beginPath();
      x.moveTo(hx - hw / 2, by - hh);
      x.lineTo(hx + hw / 2, by - hh);
      x.lineTo(hx + hw / 2, by);
      x.ellipse(hx, by, hw / 2, hw * 0.08, 0, 0, Math.PI);
      x.closePath();
      x.fill();
      block(x, hx, by, hw * 0.28, hh * 0.55, '#5A3A22');
      x.fillStyle = red;
      for (let i = 0; i < 5; i++) {
        x.beginPath();
        x.arc(hx - hw * 0.4 + i * hw * 0.2, by - hh * 0.85, hw * 0.03, 0, Math.PI * 2);
        x.fill();
      }
      x.fillStyle = thatch;
      x.beginPath();
      x.moveTo(hx - hw * 0.62, by - hh);
      x.lineTo(hx, by - hh - hw * 0.75);
      x.lineTo(hx + hw * 0.62, by - hh);
      x.closePath();
      x.fill();
      x.strokeStyle = 'rgba(60,40,15,0.35)';
      x.lineWidth = Math.max(1, s * 0.006);
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        x.beginPath();
        x.moveTo(hx, by - hh - hw * 0.75);
        x.lineTo(hx - hw * 0.62 + t * hw * 1.24, by - hh);
        x.stroke();
      }
    });
  },
};

// Draw a landmark on its own sheet, light it (chiaroscuro + aerial haze), then composite
function landmark(x, r, w, h, ch, draw, cx, by) {
  const [lc, lx] = canvas(w, h);
  const s = h * 0.2;
  const opts = draw(lx, r, cx, by, s, ch) || {};
  lx.save();
  lx.globalCompositeOperation = 'source-atop';
  const g = lx.createLinearGradient(cx - s * 1.6, 0, cx + s * 1.6, 0);
  g.addColorStop(0, 'rgba(255,238,200,0.28)');
  g.addColorStop(0.45, 'rgba(255,238,200,0)');
  g.addColorStop(1, 'rgba(25,12,0,0.38)');
  lx.fillStyle = g;
  lx.fillRect(0, 0, w, h);
  lx.fillStyle = css(ch.biome.sky, 0.14);
  lx.fillRect(0, 0, w, h);
  lx.restore();

  if (opts.pool) {
    const [pw, ph] = opts.pool, water = mix(ch.biome.sky, '#2E5E73', 0.35);
    x.fillStyle = water;
    x.fillRect(cx - pw / 2, by, pw, ph);
    x.save();
    x.beginPath();
    x.rect(cx - pw / 2, by, pw, ph);
    x.clip();
    x.globalAlpha = 0.35;
    x.translate(0, 2 * by);
    x.scale(1, -1);
    x.drawImage(lc, 0, 0);
    x.restore();
    x.save();
    x.beginPath();
    x.rect(cx - pw / 2, by, pw, ph);
    x.clip();
    strokes(x, r, { x: cx - pw / 2, y: by, w: pw, h: ph }, ['#FFFFFF', mix(water, '#FFF3D6', 0.5)], 400, s * 0.3, s * 0.012, 0.35, 0, 0.05);
    x.restore();
    x.fillStyle = mix('#E9DCC4', INK, 0.1);
    x.fillRect(cx - pw / 2, by + ph, pw, s * 0.03);
  }
  x.drawImage(lc, 0, 0);
}

// ---------- Trees ----------
const leaf = (b) => mix(b.hill, '#1E3A22', 0.35);

function broadleaf(x, r, px, py, s, b) {
  const base = leaf(b), dark = shade(base, 0.6), light = mix(base, '#E8D890', 0.35);
  x.strokeStyle = css('#3A2416', 0.9);
  x.lineWidth = s * 0.06;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(px, py);
  x.quadraticCurveTo(px + s * 0.05, py - s * 0.3, px, py - s * 0.55);
  x.stroke();
  for (let i = 0; i < 9; i++) {
    const cx = px + (r() - 0.5) * s * 0.7, cy = py - s * (0.55 + r() * 0.4), cr = s * (0.16 + r() * 0.14);
    const g = x.createRadialGradient(cx - cr * 0.35, cy - cr * 0.4, cr * 0.1, cx, cy, cr);
    g.addColorStop(0, light);
    g.addColorStop(0.6, base);
    g.addColorStop(1, dark);
    x.fillStyle = g;
    x.beginPath();
    x.arc(cx, cy, cr, 0, Math.PI * 2);
    x.fill();
  }
  x.fillStyle = css(light, 0.6);
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = r() * s * 0.4;
    x.beginPath();
    x.ellipse(px + Math.cos(a) * d, py - s * 0.75 + Math.sin(a) * d * 0.7, s * 0.02, s * 0.01, a, 0, Math.PI * 2);
    x.fill();
  }
}

function poplar(x, r, px, py, s, b) {
  const base = leaf(b);
  const g = x.createLinearGradient(px - s * 0.1, 0, px + s * 0.1, 0);
  g.addColorStop(0, mix(base, '#E8D890', 0.3));
  g.addColorStop(1, shade(base, 0.55));
  x.fillStyle = g;
  x.beginPath();
  x.ellipse(px, py - s * 0.55, s * 0.1, s * 0.5, 0, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = css(shade(base, 0.5), 0.5);
  x.lineWidth = s * 0.008;
  for (let i = 0; i < 10; i++) {
    const yy = py - s * (0.15 + i * 0.08);
    x.beginPath();
    x.moveTo(px - s * 0.06, yy);
    x.quadraticCurveTo(px, yy - s * 0.03, px + s * 0.06, yy);
    x.stroke();
  }
}

function conifer(x, r, px, py, s, b) {
  const base = mix(leaf(b), '#16301E', 0.3), light = mix(base, '#C9D8A0', 0.3);
  x.fillStyle = '#3A2416';
  x.fillRect(px - s * 0.02, py - s * 0.15, s * 0.04, s * 0.15);
  for (let i = 0; i < 5; i++) {
    const t = i / 5, ww = s * (0.28 - t * 0.2), yb = py - s * (0.1 + t * 0.78), yt = yb - s * 0.3;
    const g = x.createLinearGradient(px - ww, 0, px + ww, 0);
    g.addColorStop(0, light);
    g.addColorStop(0.5, base);
    g.addColorStop(1, shade(base, 0.55));
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(px - ww, yb);
    x.quadraticCurveTo(px, yb + s * 0.04, px + ww, yb);
    x.lineTo(px, yt);
    x.closePath();
    x.fill();
    if (b.snow) {
      x.fillStyle = 'rgba(250,250,245,0.8)';
      x.beginPath();
      x.moveTo(px - ww * 0.6, yb - s * 0.08);
      x.lineTo(px, yt + s * 0.02);
      x.lineTo(px - ww * 0.1, yb - s * 0.12);
      x.closePath();
      x.fill();
    }
  }
}

function palm(x, r, px, py, s, b) {
  const lean = (r() - 0.5) * s * 0.4, tx = px + lean, ty = py - s;
  x.strokeStyle = '#6B4A2E';
  x.lineWidth = s * 0.035;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(px, py);
  x.quadraticCurveTo(px + lean * 0.2, py - s * 0.5, tx, ty);
  x.stroke();
  const base = mix(leaf(b), '#2F5A2A', 0.3);
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i / 8 - 0.5) * Math.PI * 1.7, l = s * (0.35 + r() * 0.12);
    const ex = tx + Math.cos(a) * l, ey = ty + Math.sin(a) * l * 0.6 + l * 0.35;
    x.strokeStyle = i % 2 ? base : mix(base, '#D8D890', 0.3);
    x.lineWidth = s * 0.025;
    x.beginPath();
    x.moveTo(tx, ty);
    x.quadraticCurveTo(tx + Math.cos(a) * l * 0.6, ty + Math.sin(a) * l * 0.6 - l * 0.15, ex, ey);
    x.stroke();
  }
}

const TREES = { broadleaf, poplar, deodar: conifer, pine: conifer, palm };

function teaRows(x, w, h, top, b) {
  const base = mix(b.ground, '#2F6B45', 0.4);
  for (let row = 0; row < 14; row++) {
    const yOff = row * h * 0.018 + h * 0.01, bump = h * (0.012 + row * 0.0015);
    for (let px = -bump; px < w + bump; px += bump * 1.6) {
      const py = top(px / w) + yOff;
      const g = x.createRadialGradient(px - bump * 0.3, py - bump * 0.6, bump * 0.1, px, py, bump);
      g.addColorStop(0, mix(base, '#D8E8A0', 0.35));
      g.addColorStop(0.7, base);
      g.addColorStop(1, shade(base, 0.6));
      x.fillStyle = g;
      x.beginPath();
      x.ellipse(px, py, bump, bump * 0.7, 0, Math.PI, 0);
      x.fill();
    }
  }
}

// ---------- Mid ground: land, landmark, trees ----------
function paintMid(ch, r, w, h) {
  const [c, x] = canvas(w, h);
  const b = ch.biome, A = (w * h) / 2097152, salt = ch.id === 'kutch';
  const fn = ridge(r, 4, 1);
  const hz = h * (b.water ? 0.64 : 0.57);
  const top = (u) => hz - (fn(u) * 0.5 + 0.5) * h * 0.035;
  const ground = salt ? '#EFE9DC' : b.ground;
  paintArea(x, r, areaPath(w, h, top), { x: 0, y: hz - h * 0.04, w, h: h - hz + h * 0.04 },
    mix(ground, '#FFF3D6', 0.2), shade(ground, salt ? 0.85 : 0.55),
    salt ? ['#FFFFFF', '#E6DDF0', '#D8CFC2'] : [ground, shade(ground, 0.8), mix(ground, '#E8D890', 0.3)], 2600 * A,
    { len: h * 0.05, width: h * 0.005, alpha: 0.22, angle: 0, spread: 0.2 });
  const kinds = b.trees || [];
  if (kinds.includes('tea')) teaRows(x, w, h, top, b);

  const trees = kinds.filter((t) => TREES[t]);
  const lx = 0.3; // the landmark sits behind the first exhibits
  const items = [];
  const n = trees.length ? Math.round((b.density || 0) * 1.8) : 0;
  for (let i = 0; i < n; i++) {
    const u = r();
    if (Math.abs(u - lx) > 0.07) items.push({ u, d: r() });
  }
  items.sort((p, q) => p.d - q.d); // back to front
  const draw = LANDMARKS[ch.id];
  let drawn = !draw;
  for (const it of items) {
    if (!drawn && it.d > 0.35) {
      landmark(x, r, w, h, ch, draw, lx * w, top(lx));
      drawn = true;
    }
    const s = h * (0.07 + it.d * 0.08);
    TREES[trees[(r() * trees.length) | 0]](x, r, it.u * w, top(it.u) + it.d * h * 0.05, s, b);
  }
  if (!drawn) landmark(x, r, w, h, ch, draw, lx * w, top(lx));
  age(x, r, w, h, 1);
  return c;
}

// ---------- Foreground: grass, bushes, miniature flowers ----------
function bush(x, r, px, py, s, dark, rim) {
  for (let i = 0; i < 12; i++) {
    const cx = px + (r() - 0.5) * s * 1.4, cy = py - r() * s * 0.6, cr = s * (0.18 + r() * 0.22);
    const g = x.createRadialGradient(cx - cr * 0.2, cy - cr * 0.6, cr * 0.05, cx, cy, cr);
    g.addColorStop(0, mix(dark, rim, 0.45));
    g.addColorStop(0.45, mix(dark, rim, 0.12));
    g.addColorStop(1, shade(dark, 0.7));
    x.fillStyle = g;
    x.beginPath();
    x.arc(cx, cy, cr, 0, Math.PI * 2);
    x.fill();
  }
}

function rosette(x, px, py, rr, col) {
  x.fillStyle = col;
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    x.beginPath();
    x.arc(px + Math.cos(a) * rr, py + Math.sin(a) * rr, rr * 0.7, 0, Math.PI * 2);
    x.fill();
  }
  x.fillStyle = '#F2D58A';
  x.beginPath();
  x.arc(px, py, rr * 0.5, 0, Math.PI * 2);
  x.fill();
}

function saltCracks(x, r, w, h, top) {
  x.strokeStyle = 'rgba(150,135,120,0.35)';
  x.lineWidth = Math.max(1, h * 0.002);
  for (let i = 0; i < 400; i++) {
    const u = r();
    let px = u * w, py = top(u) + r() * h * 0.3;
    x.beginPath();
    x.moveTo(px, py);
    for (let s = 0; s < 4; s++) {
      px += (r() - 0.5) * h * 0.06;
      py += (r() - 0.5) * h * 0.02;
      x.lineTo(px, py);
    }
    x.stroke();
  }
}

function paintNear(ch, r, w, h) {
  const [c, x] = canvas(w, h);
  const b = ch.biome, A = (w * h) / 2097152, salt = ch.id === 'kutch';
  const fn = ridge(r, 5, 3);
  const top = (u) => h * 0.64 - (fn(u) * 0.5 + 0.5) * h * 0.06;
  const dark = salt ? '#D9D0C0' : mix(b.ground, '#0E170E', 0.6);
  const rim = mix(b.sky, '#FFD9A0', 0.5);
  const path = areaPath(w, h, top);
  paintArea(x, r, path, { x: 0, y: h * 0.56, w, h: h * 0.44 }, salt ? '#EFE9DC' : mix(dark, b.ground, 0.4), dark,
    salt ? ['#FFFFFF', '#E6DDF0', '#CFC4B4'] : [dark, shade(dark, 0.7), mix(dark, b.ground, 0.5)], 1500 * A,
    { len: h * 0.04, width: h * 0.006, alpha: 0.35, angle: 0, spread: 0.3 });

  if (salt) {
    saltCracks(x, r, w, h, top);
  } else {
    x.lineCap = 'round';
    for (let i = 0, n = Math.round(9000 * A); i < n; i++) {
      const u = r(), px = u * w, py = top(u) + r() * h * 0.08, len = h * (0.03 + r() * 0.07), lean = (r() - 0.5) * len * 0.6;
      x.strokeStyle = css(r() < 0.15 ? rim : mix(dark, b.ground, r() * 0.5), 0.5 + r() * 0.5);
      x.lineWidth = h * (0.002 + r() * 0.003);
      x.beginPath();
      x.moveTo(px, py);
      x.quadraticCurveTo(px + lean * 0.3, py - len * 0.6, px + lean, py - len);
      x.stroke();
    }
    for (let u = r() * 0.1; u < 1; u += 0.12 + r() * 0.1) bush(x, r, u * w, top(u) + h * 0.04, h * (0.1 + r() * 0.1), dark, rim);
    const petals = ['#F2B632', '#E08E2B', '#F3E6CC', '#D98A8A', '#B5523B'];
    for (let i = 0, n = Math.round(700 * A); i < n; i++) {
      const u = r();
      rosette(x, u * w, top(u) + r() * h * 0.12, h * (0.004 + r() * 0.005), petals[(r() * petals.length) | 0]);
    }
  }
  if (b.snow) {
    x.save();
    x.clip(path);
    strokes(x, r, { x: 0, y: h * 0.56, w, h: h * 0.2 }, ['#FFFFFF', '#E6EEF4'], 1200 * A, h * 0.03, h * 0.006, 0.5, 0, 0.3);
    x.restore();
  }
  age(x, r, w, h, 0.7);
  return c;
}

const PAINTERS = { bg: paintSky, far: paintFar, mid: paintMid, fg: paintNear };

// specs: [{ key: 'bg'|'far'|'mid'|'fg', w, h }] -> { key: canvas }
export function paintPlates(ch, specs) {
  const out = {};
  for (const s of specs) out[s.key] = PAINTERS[s.key](ch, seeded(`${ch.id}:${s.key}`), s.w, s.h);
  return out;
}
