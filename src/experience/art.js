// Images for the plates.
// If a destination has photo.src in destinations.json, that photograph is used (with photo.depth
// as its depth map, or a simple top-far / bottom-near gradient when no depth map is given).
// Until photographs are supplied, a procedural placeholder illustration with a matching depth map
// is painted in the browser, so the whole experience works end to end.
import * as THREE from 'three';

const W = 640, H = 800; // 4:5 print
const DW = 160, DH = 200; // depth maps are small and soft on purpose

// Placeholder scene recipes. Colours only; nothing here is a travel fact.
const SCENES = {
  srinagar: { sky: ['#aebfc9', '#eadfd2'], sun: { x: 0.62, y: 0.4, r: 0.06, c: '#fff3dc' }, far: '#9aabb6', mid: '#7c909c', near: '#566d78', ground: ['#8aa0aa', '#34464f'] },
  manali: { sky: ['#b9c9d8', '#f1dcc0'], sun: { x: 0.3, y: 0.34, r: 0.06, c: '#fff0d0' }, far: '#d3dce4', mid: '#6f8a73', near: '#3f5c47', ground: ['#51684f', '#223326'] },
  amritsar: { sky: ['#3b3f5c', '#e0b070'], sun: null, far: '#7d6a58', mid: '#8b7458', near: '#5a4a3a', ground: ['#6a5a45', '#241c14'], build: { type: 'dome', c: '#d9a93f' } },
  jaipur: { sky: ['#e8b9a0', '#f7dcc0'], sun: { x: 0.8, y: 0.3, r: 0.05, c: '#fff1d6' }, far: '#c98e78', mid: '#b96f5c', near: '#8f4e40', ground: ['#a8604f', '#3a1f1a'], build: { type: 'facade', c: '#d9877a' } },
  agra: { sky: ['#cfd2d6', '#f4e2cf'], sun: { x: 0.25, y: 0.42, r: 0.05, c: '#fff3e0' }, far: '#c8c2b4', mid: '#a8a58f', near: '#7c7d68', ground: ['#9aa38f', '#3c4538'], build: { type: 'dome', c: '#efe8dc' } },
  goa: { sky: ['#3d5b86', '#f0a06a'], sun: { x: 0.5, y: 0.6, r: 0.08, c: '#ffd9a0' }, far: '#5f7ea0', mid: '#3f6a58', near: '#2a4a3c', ground: ['#3f6a8c', '#15283a'] },
  munnar: { sky: ['#cfe0d4', '#f0f0e0'], sun: { x: 0.7, y: 0.3, r: 0.05, c: '#fffbe6' }, far: '#a6c1ae', mid: '#6fa07e', near: '#3f7a52', ground: ['#4a8a58', '#1f4a2c'] },
  gangtok: { sky: ['#9db0cf', '#f5c9a0'], sun: { x: 0.55, y: 0.36, r: 0.05, c: '#ffe2b0' }, far: '#e8d9cf', mid: '#8a7a86', near: '#4c4a58', ground: ['#585466', '#1e1c28'] },
  kutch: { sky: ['#cdd0e4', '#f4f0ea'], sun: { x: 0.5, y: 0.3, r: 0.09, c: '#ffffff' }, far: '#e8e4dc', mid: '#f0ece4', near: '#ffffff', ground: ['#f4f2ec', '#cfcabf'] },
  shillong: { sky: ['#a8b8b8', '#dfe3df'], sun: null, far: '#8aa09c', mid: '#5f8076', near: '#3c5c52', ground: ['#4a6a64', '#1c2e2a'] },
};

// Small seeded random generator so each destination always paints the same picture
function rng(seed) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ridge(rand, base, amp, rough) {
  const pts = [], n = 48, p1 = rand() * 10, p2 = rand() * 10, p3 = rand() * 10;
  for (let i = 0; i <= n; i++) {
    const nx = i / n;
    const y = base + Math.sin(nx * 3.1 + p1) * amp + Math.sin(nx * 7.3 + p2) * amp * 0.45 * rough + Math.sin(nx * 17 + p3) * amp * 0.15 * rough;
    pts.push([nx * W, y * H]);
  }
  return pts;
}

function fillRidge(ctx, pts, fill, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, H);
  pts.forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.globalAlpha = 1;
}

let grainCanvas;
function grain(ctx) {
  if (!grainCanvas) {
    grainCanvas = document.createElement('canvas');
    grainCanvas.width = grainCanvas.height = 128;
    const g = grainCanvas.getContext('2d');
    const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = Math.random() * 40;
    }
    g.putImageData(img, 0, 0);
  }
  ctx.fillStyle = ctx.createPattern(grainCanvas, 'repeat');
  ctx.fillRect(0, 0, W, H);
}

function drawBuilding(ctx, sc, depth, g) {
  if (!sc.build) return;
  const baseY = H * 0.7, cx = W * 0.5;
  ctx.fillStyle = g(sc.build.c, 0.5);
  if (sc.build.type === 'dome') {
    const bw = W * 0.34, bh = H * 0.12;
    ctx.fillRect(cx - bw / 2, baseY - bh, bw, bh);
    ctx.beginPath();
    ctx.ellipse(cx, baseY - bh, W * 0.11, H * 0.09, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - 1.5, baseY - bh - H * 0.15, 3, H * 0.06);
    [-1, 1].forEach((s) => ctx.fillRect(cx + s * W * 0.24 - W * 0.01, baseY - H * 0.24, W * 0.02, H * 0.24));
  } else {
    [0.5, 0.42, 0.34].forEach((w, i) => ctx.fillRect(cx - (w * W) / 2, baseY - H * 0.08 * (i + 1), w * W, H * 0.08));
    if (!depth) {
      ctx.fillStyle = 'rgba(40,20,16,0.35)';
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 8; j++) ctx.fillRect(cx - W * 0.2 + j * W * 0.05, baseY - H * 0.08 * (i + 1) + H * 0.02, W * 0.025, H * 0.035);
      }
    }
  }
}

// Paints the scene. In depth mode it paints greys instead (white = near, black = far).
function drawScene(ctx, geo, sc, depth, rand) {
  const g = (colour, v) => (depth ? `rgb(${Math.round(v * 255)},${Math.round(v * 255)},${Math.round(v * 255)})` : colour);
  if (depth) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.7);
    sky.addColorStop(0, sc.sky[0]);
    sky.addColorStop(1, sc.sky[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    if (sc.sun) {
      const cx = sc.sun.x * W, cy = sc.sun.y * H, r = sc.sun.r * W;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 5);
      glow.addColorStop(0, sc.sun.c + 'cc');
      glow.addColorStop(1, sc.sun.c + '00');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = sc.sun.c;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  fillRidge(ctx, geo.far, g(sc.far, 0.2));
  if (!depth) fillRidge(ctx, geo.far, sc.sky[1], 0.4); // atmospheric haze
  fillRidge(ctx, geo.mid, g(sc.mid, 0.4));
  if (!depth) fillRidge(ctx, geo.mid, sc.sky[1], 0.2);
  drawBuilding(ctx, sc, depth, g);
  fillRidge(ctx, geo.near, g(sc.near, 0.6));

  const gy = H * 0.74;
  const ground = ctx.createLinearGradient(0, gy, 0, H);
  if (depth) {
    ground.addColorStop(0, 'rgb(150,150,150)');
    ground.addColorStop(1, 'rgb(255,255,255)');
  } else {
    ground.addColorStop(0, sc.ground[0]);
    ground.addColorStop(1, sc.ground[1]);
  }
  ctx.fillStyle = ground;
  ctx.fillRect(0, gy, W, H - gy);
  if (!depth) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 60; i++) ctx.fillRect(rand() * W, gy + rand() * (H - gy), 20 + rand() * 60, 1.5);
  }
  fillRidge(ctx, geo.fore, g('#0a0807', 1));
  if (!depth) grain(ctx);
}

function sampler(data) {
  return (x, yTop) => {
    const px = Math.min(DW - 1, Math.max(0, Math.floor(x * DW)));
    const py = Math.min(DH - 1, Math.max(0, Math.floor(yTop * DH)));
    return data[(py * DW + px) * 4] / 255;
  };
}

export function makePlaceholderArt(d) {
  const sc = SCENES[d.slug] || SCENES.srinagar;
  const rand = rng(d.slug);
  const geo = { far: ridge(rand, 0.5, 0.06, 1), mid: ridge(rand, 0.58, 0.05, 0.8), near: ridge(rand, 0.66, 0.04, 0.6), fore: ridge(rand, 0.93, 0.025, 0.5) };

  const cc = document.createElement('canvas');
  cc.width = W;
  cc.height = H;
  drawScene(cc.getContext('2d'), geo, sc, false, rand);

  const dc = document.createElement('canvas');
  dc.width = DW;
  dc.height = DH;
  const dctx = dc.getContext('2d', { willReadFrequently: true });
  dctx.scale(DW / W, DH / H);
  drawScene(dctx, geo, sc, true, rand);
  const depthAt = sampler(dctx.getImageData(0, 0, DW, DH).data);

  const t = document.createElement('canvas');
  t.width = 120;
  t.height = 150;
  t.getContext('2d').drawImage(cc, 0, 0, 120, 150);

  return { photo: new THREE.CanvasTexture(cc), depth: new THREE.CanvasTexture(dc), depthAt, thumb: t.toDataURL('image/jpeg', 0.7), placeholder: true };
}

async function loadReal(p) {
  const loader = new THREE.TextureLoader();
  const photo = await loader.loadAsync(p.src);
  let depth, depthAt;
  if (p.depth) {
    depth = await loader.loadAsync(p.depth);
    const c = document.createElement('canvas');
    c.width = DW;
    c.height = DH;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(depth.image, 0, 0, DW, DH);
    depthAt = sampler(x.getImageData(0, 0, DW, DH).data);
  } else {
    const c = document.createElement('canvas');
    c.width = DW;
    c.height = DH;
    const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, DH);
    gr.addColorStop(0, 'rgb(38,38,38)');
    gr.addColorStop(1, 'rgb(230,230,230)');
    x.fillStyle = gr;
    x.fillRect(0, 0, DW, DH);
    depth = new THREE.CanvasTexture(c);
    depthAt = (_x, yTop) => 0.15 + 0.75 * yTop;
  }
  return { photo, depth, depthAt, thumb: p.src, placeholder: false };
}

export async function loadArt(d) {
  const p = d.photo || {};
  if (p.src) {
    try { return await loadReal(p); } catch (err) { console.warn(`Photo for ${d.slug} failed, using placeholder art:`, err); }
  }
  return makePlaceholderArt(d);
}

// Paper grain for the print margins
let paper;
export function paperTexture() {
  if (paper) return paper;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#F2EBDD';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3500; i++) {
    x.fillStyle = Math.random() < 0.5 ? 'rgba(120,100,70,0.09)' : 'rgba(255,255,255,0.12)';
    x.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
  }
  x.strokeStyle = 'rgba(120,100,70,0.06)';
  for (let i = 0; i < 120; i++) {
    const px = Math.random() * 256, py = Math.random() * 256;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + Math.random() * 14 - 7, py + Math.random() * 14 - 7);
    x.stroke();
  }
  paper = new THREE.CanvasTexture(c);
  paper.colorSpace = THREE.SRGBColorSpace;
  return paper;
}

// The small mark in a solved plate's corner, e.g. "✓ 05:40"
export function markTexture(text) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#0C0A09';
  x.font = '600 30px Inter, system-ui, sans-serif';
  x.textAlign = 'right';
  x.textBaseline = 'middle';
  x.fillText(text, 246, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Soft pool of light on the back wall of the hall
export function wallTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 64, 4, 128, 64, 128);
  g.addColorStop(0, '#1d1814');
  g.addColorStop(1, '#0c0a09');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
