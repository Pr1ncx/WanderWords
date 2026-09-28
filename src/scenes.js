// Art direction for each chapter. Every city has its own composition, light, palette, water and air,
// built around one glowing focal point at the exact centre of the frame (where its ritual happens).
//
// Real art: public/media/<id>/scene.webp (+ optional scene-depth.webp). See MEDIA_GUIDE.md.
// Until it exists, paintScene() paints a soft placeholder with the same composition.
//
// horizon    placeholder horizon (0 = bottom of the frame, 1 = top)
// water      waterline of YOUR scene art (0 = no water); the shader ripples everything below it
// pool       water colour of the placeholder (no pool = no water in the placeholder)
// rays       where the god rays come from, in image space (x: 0 left..1 right, y: 0 bottom..1 top)
// glow       focal point colour; haze: colour of the air; bokeh: out-of-focus specks near the lens
// particles  drifting atmosphere (particles.js); grade: shadow tint for the film pass
export const SCENES = {
  srinagar: {
    motif: 'lake', horizon: 0.6, water: 0.3, pool: '#8FAFD2', sky: ['#A9C6E8', '#F7DCE2'], haze: '#EFE4F3',
    glow: '#FFC9DA', rays: [0.82, 1.05], particles: 'lotus', bokeh: '#F6B8C8', grade: '#56699A',
  },
  manali: {
    motif: 'forest', horizon: 0.52, water: 0, sky: ['#B4B2E0', '#F3E8F2'], haze: '#ECE8F6',
    glow: '#FFD89A', rays: [0.78, 1.08], particles: 'snow', bokeh: '#FFFFFF', grade: '#4E5A7E',
  },
  amritsar: {
    motif: 'temple', horizon: 0.6, water: 0.3, pool: '#6F7FB8', sky: ['#7E8FC6', '#F6D3B4'], haze: '#F3E0D2',
    glow: '#FFB44D', rays: [0.8, 1.02], particles: 'marigold', bokeh: '#F2A93A', grade: '#7A5A2E',
  },
  jaipur: {
    motif: 'facade', horizon: 0.18, water: 0, sky: ['#E9B6C0', '#FBE0CF'], haze: '#F8DCD6',
    glow: '#FFC07A', rays: [0.84, 1.06], particles: 'petals', bokeh: '#E88AA8', grade: '#8A3A3A',
  },
  agra: {
    motif: 'taj', horizon: 0.62, water: 0.3, pool: '#B8B4D8', sky: ['#C9C3E6', '#FBE4D6'], haze: '#F4EAF0',
    glow: '#8FE3D8', rays: [0.8, 1.05], particles: 'rose', bokeh: '#F2A0B0', grade: '#6E5A6E',
  },
  goa: {
    motif: 'bay', horizon: 0.5, water: 0.46, pool: '#E89A8A', sky: ['#F4B6A6', '#FFE2B8'], haze: '#FFE6D2',
    glow: '#FFB070', rays: [0.5, 0.53], particles: 'dust', bokeh: '#FFC890', grade: '#A0503A',
  },
  munnar: {
    motif: 'tea', horizon: 0.58, water: 0, sky: ['#BFE0D6', '#F2F2DE'], haze: '#E8F2E6',
    glow: '#D8FF9A', rays: [0.82, 1.06], particles: 'tea', bokeh: '#B8E08A', grade: '#2F5B45',
  },
  gangtok: {
    motif: 'peaks', horizon: 0.42, water: 0, sky: ['#9FB4E0', '#F8D6DA'], haze: '#F1E6F0',
    glow: '#FFD27A', rays: [0.8, 1.04], particles: 'snow', bokeh: '#FFFFFF', grade: '#5A3E6E',
  },
  kutch: {
    motif: 'salt', horizon: 0.5, water: 0.46, pool: '#F1EDF8', sky: ['#8E86C6', '#F0DDEB'], haze: '#EEE6F4',
    glow: '#EEF0FF', rays: [0.5, 0.55], particles: 'glitter', bokeh: '#E8E6FF', grade: '#4A4A7A',
  },
  shillong: {
    motif: 'pines', horizon: 0.6, water: 0.3, pool: '#5F9AA6', sky: ['#9FC9C8', '#E6EEDC'], haze: '#DDEBE4',
    glow: '#C8F2FF', rays: [0.8, 1.06], particles: 'fireflies', bokeh: '#C8F2E0', grade: '#28505A',
  },
};

// ---------- Placeholder painter ----------
const W = 1600, H = 900, CX = W / 2, CY = H / 2, TAU = Math.PI * 2;

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

const rgba = (hex, a = 1) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

function glow(x, cx, cy, rad, color, a = 1) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(0.3, rgba(color, a * 0.35));
  g.addColorStop(1, rgba(color, 0));
  x.fillStyle = g;
  x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
}

function veil(x, color, a, y0 = 0, y1 = H) {
  x.fillStyle = rgba(color, a);
  x.fillRect(0, y0, W, y1 - y0);
}

// A soft mountain or hill line filled down to the bottom of the frame
function ridge(x, r, { base, amp, color, alpha = 1, peaks = 1, freq = 1 }) {
  const f = [1.2 + r() * 1.5, 3 + r() * 3, 8 + r() * 6].map((v) => v * freq);
  const ph = [r() * TAU, r() * TAU, r() * TAU];
  x.fillStyle = rgba(color, alpha);
  x.beginPath();
  x.moveTo(0, H);
  for (let i = 0; i <= 200; i++) {
    const u = i / 200;
    const n = Math.sin(u * f[0] * TAU + ph[0]) * 0.55 + Math.sin(u * f[1] * TAU + ph[1]) * 0.3 + Math.sin(u * f[2] * TAU + ph[2]) * 0.15;
    x.lineTo(u * W, base - Math.pow(n * 0.5 + 0.5, peaks) * amp);
  }
  x.lineTo(W, H);
  x.closePath();
  x.fill();
}

function blobs(x, r, { n, x0 = 0, x1 = W, y0, y1, r0, r1, color, alpha = 1, blur = 0 }) {
  x.save();
  if (blur) x.filter = `blur(${blur}px)`;
  x.fillStyle = rgba(color, alpha);
  for (let i = 0; i < n; i++) {
    const rad = r0 + r() * (r1 - r0);
    x.beginPath();
    x.ellipse(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), rad * 1.5, rad, 0, 0, TAU);
    x.fill();
  }
  x.restore();
}

function pines(x, r, { base, n, h0, h1, color, alpha = 1, x0 = 0, x1 = W, jitter = 30, gap }) {
  x.fillStyle = rgba(color, alpha);
  x.beginPath();
  for (let i = 0; i < n; i++) {
    const px = x0 + r() * (x1 - x0), h = h0 + r() * (h1 - h0), y = base + r() * jitter, w = h * (0.34 + r() * 0.1);
    if (gap && px > gap[0] && px < gap[1]) continue;
    for (let k = 0; k < 4; k++) {
      const top = y - h + k * h * 0.2, bot = top + h * 0.38, ww = w * (0.45 + k * 0.2);
      x.moveTo(px, top);
      x.lineTo(px + ww / 2, bot);
      x.lineTo(px - ww / 2, bot);
      x.closePath();
    }
    x.rect(px - h * 0.02, y - h * 0.18, h * 0.04, h * 0.18);
  }
  x.fill();
}

// Arched window or doorway: left edge, bottom, width, height
function arch(x, px, bottom, w, h) {
  x.beginPath();
  x.moveTo(px, bottom);
  x.lineTo(px, bottom - h + w / 2);
  x.arc(px + w / 2, bottom - h + w / 2, w / 2, Math.PI, 0);
  x.lineTo(px + w, bottom);
  x.closePath();
  x.fill();
}

function dome(x, cx, cy, rx, ry) {
  x.beginPath();
  x.ellipse(cx, cy, rx, ry, 0, Math.PI, 0);
  x.fill();
}

function leaf(x, cx, cy, len, rot) {
  x.save();
  x.translate(cx, cy);
  x.rotate(rot);
  x.beginPath();
  x.ellipse(0, 0, len * 0.38, len, 0, 0, TAU);
  x.fill();
  x.restore();
}

function lotus(x, cx, cy, s, color) {
  x.fillStyle = color;
  for (let k = -3; k <= 3; k++) {
    x.save();
    x.translate(cx, cy);
    x.rotate(k * 0.38);
    x.beginPath();
    x.ellipse(0, -s * 0.6, s * 0.28, s * 0.7, 0, 0, TAU);
    x.fill();
    x.restore();
  }
}

function boat(x, cx, y, color) {
  x.fillStyle = color;
  x.beginPath();
  x.moveTo(cx - 50, y);
  x.quadraticCurveTo(cx, y + 22, cx + 50, y - 4);
  x.quadraticCurveTo(cx, y + 8, cx - 50, y);
  x.fill();
  x.fillRect(cx - 2, y - 60, 3, 60);
  x.beginPath();
  x.moveTo(cx + 2, y - 58);
  x.lineTo(cx + 34, y - 10);
  x.lineTo(cx + 2, y - 10);
  x.closePath();
  x.fill();
}

function palm(x, r, px, base, dir, color) {
  const tx = px + dir * 160, ty = base - 560;
  x.strokeStyle = color;
  x.lineCap = 'round';
  x.lineWidth = 22;
  x.beginPath();
  x.moveTo(px, base);
  x.quadraticCurveTo(px + dir * 20, base - 300, tx, ty);
  x.stroke();
  x.lineWidth = 10;
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + (k - 4) * 0.42 + (r() - 0.5) * 0.2, len = 200 + r() * 90;
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.6 + len * 0.45;
    x.beginPath();
    x.moveTo(tx, ty);
    x.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.6 - 40, ex, ey);
    x.stroke();
  }
}

// Prayer flags on a sagging line from a to b
function flags(x, [ax, ay], [bx, by], sag) {
  const cx = (ax + bx) / 2, cy = (ay + by) / 2 + sag;
  x.strokeStyle = 'rgba(90, 70, 90, 0.6)';
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(ax, ay);
  x.quadraticCurveTo(cx, cy, bx, by);
  x.stroke();
  const cols = ['#3A6FD8', '#F4F4F4', '#D84A3A', '#3AA85A', '#F2C230'];
  for (let i = 1; i < 26; i++) {
    const t = i / 26, u = 1 - t;
    const px = u * u * ax + 2 * u * t * cx + t * t * bx, py = u * u * ay + 2 * u * t * cy + t * t * by;
    x.fillStyle = rgba(cols[i % 5], 0.9);
    x.fillRect(px - 9, py, 18, 24);
  }
}

// Still water: the land above the horizon mirrored, tinted, with a few bright ripple lines
function reflect(c, x, r, s, hz) {
  const t = document.createElement('canvas');
  t.width = W;
  t.height = hz;
  t.getContext('2d').drawImage(c, 0, 0, W, hz, 0, 0, W, hz);
  const g = x.createLinearGradient(0, hz, 0, H);
  g.addColorStop(0, s.sky[1]);
  g.addColorStop(1, s.pool);
  x.fillStyle = g;
  x.fillRect(0, hz, W, H - hz);
  x.save();
  x.globalAlpha = 0.6;
  x.translate(0, hz * 2);
  x.scale(1, -1);
  x.drawImage(t, 0, 0);
  x.restore();
  const w = x.createLinearGradient(0, hz, 0, H);
  w.addColorStop(0, rgba(s.pool, 0.05));
  w.addColorStop(1, rgba(s.pool, 0.5));
  x.fillStyle = w;
  x.fillRect(0, hz, W, H - hz);
  x.fillStyle = 'rgba(255, 255, 255, 0.16)';
  for (let i = 0; i < 70; i++) {
    const k = r(), y = hz + 4 + k * k * (H - hz), len = 20 + r() * 120 * (0.3 + k);
    x.fillRect(r() * W - len / 2, y, len, 1 + k * 2);
  }
  x.fillStyle = rgba(s.haze, 0.6);
  x.fillRect(0, hz - 1, W, 3);
}

// far(): everything above the horizon (and any ground). near(): after the water. focal(): the centre object.
const MOTIFS = {
  // Srinagar: Dal Lake at dawn, a shikara with a lotus on its bow, chinars in red and gold
  lake: {
    far(x, r, s, hz) {
      ridge(x, r, { base: hz, amp: 330, color: '#C9C6E4', peaks: 2.4 });
      veil(x, s.haze, 0.35, 0, hz);
      ridge(x, r, { base: hz, amp: 140, color: '#8FA3BD', peaks: 1.3, freq: 1.4 });
      veil(x, s.haze, 0.2, 0, hz);
      blobs(x, r, { n: 16, x0: -40, x1: 330, y0: hz - 170, y1: hz - 10, r0: 30, r1: 70, color: '#D9735A', alpha: 0.9 });
      blobs(x, r, { n: 16, x0: W - 330, x1: W + 40, y0: hz - 170, y1: hz - 10, r0: 30, r1: 70, color: '#E3A34E', alpha: 0.9 });
    },
    focal(x) {
      glow(x, CX, CY, 150, '#FFD6E2', 0.8);
      x.fillStyle = '#6A4636';
      x.beginPath();
      x.moveTo(650, 468);
      x.quadraticCurveTo(800, 520, 950, 462);
      x.quadraticCurveTo(800, 492, 650, 468);
      x.fill();
      lotus(x, CX, 464, 30, '#F6A8C0');
    },
  },

  // Manali: deodar clearing at lavender dawn, Hadimba's pagoda roof in the mist, a lantern on a snowy stone
  forest: {
    far(x, r, s, hz) {
      ridge(x, r, { base: hz - 30, amp: 280, color: '#D6D2EE', peaks: 2.6 });
      veil(x, s.haze, 0.3, 0, hz);
      pines(x, r, { base: hz, n: 80, h0: 70, h1: 150, color: '#8C97B8', alpha: 0.85, gap: [690, 910] });
      x.fillStyle = rgba('#7C6A8E', 0.85);
      let y = hz - 10;
      for (const [w, h] of [[200, 60], [150, 50], [100, 44]]) {
        x.fillRect(CX - w * 0.3, y - h * 0.5, w * 0.6, h * 0.5);
        x.beginPath();
        x.moveTo(CX - w / 2, y - h * 0.45);
        x.lineTo(CX + w / 2, y - h * 0.45);
        x.lineTo(CX + w * 0.2, y - h);
        x.lineTo(CX - w * 0.2, y - h);
        x.closePath();
        x.fill();
        y -= h;
      }
      veil(x, s.haze, 0.3, 0, hz);
      const snow = x.createLinearGradient(0, hz, 0, H);
      snow.addColorStop(0, '#F3F0FA');
      snow.addColorStop(1, '#D9D5EC');
      x.fillStyle = snow;
      x.fillRect(0, hz + 10, W, H - hz - 10);
    },
    near(x, r) {
      pines(x, r, { base: H + 40, n: 7, h0: 420, h1: 640, color: '#56627E', x0: -80, x1: 300 });
      pines(x, r, { base: H + 40, n: 7, h0: 420, h1: 640, color: '#56627E', x0: W - 300, x1: W + 80 });
    },
    focal(x) {
      x.fillStyle = '#EDE9F6';
      x.beginPath();
      x.ellipse(CX, 498, 90, 26, 0, 0, TAU);
      x.fill();
      glow(x, CX, 452, 170, '#FFD89A', 0.9);
      x.fillStyle = '#6A5040';
      x.fillRect(782, 470, 36, 8);
      x.beginPath();
      x.moveTo(780, 428);
      x.lineTo(820, 428);
      x.lineTo(CX, 410);
      x.fill();
      x.fillStyle = '#FFE2A6';
      x.fillRect(786, 428, 28, 42);
    },
  },

  // Amritsar: the Golden Temple on the Amrit Sarovar at blue hour, a diya on the water
  temple: {
    far(x, r, s, hz) {
      ridge(x, r, { base: hz, amp: 40, color: '#8E86B4', alpha: 0.6, freq: 3 });
      x.fillStyle = '#EEE6EE';
      x.fillRect(0, hz - 70, 560, 70);
      x.fillRect(W - 560, hz - 70, 560, 70);
      x.fillStyle = rgba('#B8A8C8', 0.6);
      for (let px = 20; px < 540; px += 36) {
        arch(x, px, hz - 12, 16, 34);
        arch(x, W - px - 16, hz - 12, 16, 34);
      }
      glow(x, CX, hz - 90, 320, '#FFD58A', 0.7);
      x.fillStyle = '#E9B45E';
      x.fillRect(CX - 130, hz - 70, 260, 70);
      x.fillStyle = '#F3C572';
      x.fillRect(CX - 80, hz - 120, 160, 50);
      dome(x, CX, hz - 120, 62, 58);
      x.fillRect(CX - 3, hz - 205, 6, 30);
      for (const dx of [-120, 120]) dome(x, CX + dx, hz - 70, 14, 16);
      for (const dx of [-70, 70]) dome(x, CX + dx, hz - 120, 12, 14);
      x.fillStyle = rgba('#9A6A2A', 0.5);
      for (let k = 0; k < 7; k++) arch(x, CX - 118 + k * 34, hz - 10, 18, 44);
      x.fillStyle = '#F6EFE6';
      x.fillRect(560, hz - 8, 120, 8);
    },
    focal(x) {
      glow(x, CX, 440, 130, '#FFB44D', 0.95);
      x.fillStyle = '#A0502E';
      x.beginPath();
      x.ellipse(CX, 458, 34, 13, 0, 0, Math.PI);
      x.fill();
      x.fillStyle = '#FFE3A0';
      x.beginPath();
      x.moveTo(CX, 414);
      x.quadraticCurveTo(CX + 12, 446, CX, 454);
      x.quadraticCurveTo(CX - 12, 446, CX, 414);
      x.fill();
    },
  },

  // Jaipur: Hawa Mahal's honeycomb rising through rose haze, one jharokha glowing at the centre
  facade: {
    far(x, r, s, hz) {
      const tiers = [[1320, 250], [1040, 170], [760, 100], [480, 40]];
      x.fillStyle = '#E8A39C';
      for (const [w, top] of tiers) {
        x.fillRect(CX - w / 2, top, w, hz - top);
        for (let px = CX - w / 2 + 22; px < CX + w / 2; px += 44) {
          x.beginPath();
          x.arc(px, top, 22, Math.PI, 0);
          x.fill();
        }
      }
      const inside = (px, py) => tiers.some(([w, top]) => Math.abs(px - CX) < w / 2 - 20 && py > top + 24);
      for (let py = 70; py < hz - 50; py += 56) {
        for (let px = CX - 640; px <= CX + 640; px += 58) {
          if (!inside(px, py) || (Math.abs(px - CX) < 110 && Math.abs(py - CY) < 120)) continue;
          x.fillStyle = rgba('#B45E5A', 0.7);
          arch(x, px - 13, py + 38, 26, 38);
          x.fillStyle = rgba('#F7CFC6', 0.8);
          x.fillRect(px - 17, py + 38, 34, 4);
        }
      }
      veil(x, s.haze, 0.22, 0, hz);
      x.fillStyle = '#D9A48E';
      x.fillRect(0, hz, W, H - hz);
    },
    near(x, r) {
      blobs(x, r, { n: 22, x0: -60, x1: 260, y0: 540, y1: H + 40, r0: 26, r1: 60, color: '#D04E8A', alpha: 0.85, blur: 4 });
      blobs(x, r, { n: 22, x0: W - 260, x1: W + 60, y0: 540, y1: H + 40, r0: 26, r1: 60, color: '#C83E7E', alpha: 0.85, blur: 4 });
      x.strokeStyle = 'rgba(90, 60, 80, 0.55)';
      x.lineWidth = 2;
      for (let i = 0; i < 14; i++) {
        const px = 200 + r() * 1200, py = 30 + r() * 200, w = 8 + r() * 8;
        x.beginPath();
        x.moveTo(px - w, py - w * 0.4);
        x.quadraticCurveTo(px - w * 0.4, py - w * 0.6, px, py);
        x.quadraticCurveTo(px + w * 0.4, py - w * 0.6, px + w, py - w * 0.4);
        x.stroke();
      }
    },
    focal(x) {
      glow(x, CX, CY, 230, '#FFC07A', 0.7);
      x.fillStyle = '#8A4640';
      arch(x, 732, 532, 136, 170);
      x.fillStyle = '#FFE0B0';
      arch(x, 746, 520, 108, 144);
      x.strokeStyle = 'rgba(138, 70, 64, 0.7)';
      x.lineWidth = 3;
      x.beginPath();
      x.moveTo(CX, 390);
      x.lineTo(CX, 520);
      for (let py = 420; py < 520; py += 20) {
        x.moveTo(746, py);
        x.lineTo(854, py);
      }
      x.stroke();
    },
  },

  // Agra: the Taj far across the Yamuna in dawn mist, a floating marble disc with a pietra dura flower
  taj: {
    far(x, r, s, hz) {
      blobs(x, r, { n: 40, y0: hz - 26, y1: hz - 4, r0: 10, r1: 26, color: '#A9B39C', alpha: 0.75 });
      veil(x, s.haze, 0.25, 0, hz);
      glow(x, CX, hz - 80, 260, '#FFF0E6', 0.6);
      x.fillStyle = '#F7EFF2';
      x.fillRect(CX - 150, hz - 14, 300, 14);
      x.fillRect(CX - 78, hz - 92, 156, 78);
      x.fillRect(CX - 30, hz - 104, 60, 12);
      dome(x, CX, hz - 100, 46, 52);
      x.fillRect(CX - 2, hz - 172, 4, 24);
      for (const dx of [-54, 54]) dome(x, CX + dx, hz - 92, 14, 16);
      for (const dx of [-140, 140]) {
        x.fillRect(CX + dx - 4, hz - 128, 8, 114);
        dome(x, CX + dx, hz - 128, 8, 10);
      }
      x.fillStyle = rgba('#C8B8C8', 0.6);
      arch(x, CX - 22, hz - 20, 44, 62);
      veil(x, s.haze, 0.22, 0, hz);
    },
    focal(x) {
      glow(x, CX, 452, 190, '#8FE3D8', 0.6);
      x.fillStyle = '#E4DED6';
      x.beginPath();
      x.ellipse(CX, 464, 120, 28, 0, 0, TAU);
      x.fill();
      x.fillStyle = '#FBF8F3';
      x.beginPath();
      x.ellipse(CX, 458, 120, 28, 0, 0, TAU);
      x.fill();
      for (let k = 0; k < 8; k++) {
        x.save();
        x.translate(CX, 456);
        x.scale(1, 0.24);
        x.rotate((k / 8) * TAU);
        x.fillStyle = k % 2 ? '#C0503A' : '#3FB8AF';
        x.beginPath();
        x.ellipse(0, -30, 9, 22, 0, 0, TAU);
        x.fill();
        x.restore();
      }
      x.fillStyle = '#E0B040';
      x.beginPath();
      x.ellipse(CX, 456, 8, 3, 0, 0, TAU);
      x.fill();
    },
  },

  // Goa: a glassy palm-fringed bay, a huge soft sun touching the horizon at the centre
  bay: {
    far(x, r, s, hz) {
      glow(x, CX, hz, 560, '#FFC890', 0.8);
      x.fillStyle = '#FFE0B0';
      x.beginPath();
      x.arc(CX, hz - 20, 120, 0, TAU);
      x.fill();
      x.save();
      x.beginPath();
      x.rect(0, 0, 520, H);
      x.rect(W - 460, 0, 460, H);
      x.clip();
      ridge(x, r, { base: hz, amp: 90, color: '#C98E94', alpha: 0.75, freq: 0.8 });
      x.restore();
    },
    near(x, r, s, hz) {
      x.fillStyle = 'rgba(255, 236, 200, 0.5)';
      for (let i = 0; i < 90; i++) {
        const t = r(), y = hz + 6 + t * t * (H - hz), w = 10 + r() * 60 * (0.3 + t);
        x.fillRect(CX - w / 2 + (r() - 0.5) * 140 * (0.2 + t), y, w, 2);
      }
      boat(x, 1060, hz + 22, '#4A3444');
      palm(x, r, 110, H + 20, 1, '#5E4458');
      palm(x, r, W - 90, H + 20, -1, '#5E4458');
    },
    focal() {},
  },

  // Munnar: waves of tea hills in mist, one sprig (two leaves and a bud) in a beam of light
  tea: {
    far(x, r, s, hz) {
      ridge(x, r, { base: hz, amp: 110, color: '#A9C9BC', freq: 0.8 });
      veil(x, s.haze, 0.3, 0, H);
      ['#A3CC9C', '#8BBE88', '#72AC74', '#5B9A62', '#46864F'].forEach((c, k) => {
        ridge(x, r, { base: hz + 80 + k * 115, amp: 120, color: c, freq: 0.6 });
        x.strokeStyle = 'rgba(30, 70, 40, 0.12)';
        x.lineWidth = 2;
        for (let j = 0; j < 6; j++) {
          const y0 = hz + 60 + k * 115 + j * 16;
          x.beginPath();
          for (let px = 0; px <= W; px += 40) x.lineTo(px, y0 + Math.sin(px * 0.004 + k * 1.7) * 30);
          x.stroke();
        }
        if (k < 2) veil(x, s.haze, 0.18, 0, H);
      });
      blobs(x, r, { n: 18, x0: -100, x1: W + 100, y0: hz + 10, y1: hz + 240, r0: 60, r1: 140, color: '#FFFFFF', alpha: 0.28, blur: 30 });
    },
    focal(x) {
      const beam = x.createLinearGradient(0, 0, 0, 470);
      beam.addColorStop(0, 'rgba(255, 255, 240, 0)');
      beam.addColorStop(1, 'rgba(255, 255, 240, 0.35)');
      x.fillStyle = beam;
      x.fillRect(730, 0, 140, 470);
      glow(x, CX, CY, 180, '#D8FF9A', 0.7);
      x.strokeStyle = '#6E9A3E';
      x.lineWidth = 4;
      x.beginPath();
      x.moveTo(CX, 500);
      x.lineTo(CX, 430);
      x.stroke();
      x.fillStyle = '#9ED86A';
      leaf(x, 772, 462, 34, -0.9);
      leaf(x, 828, 458, 34, 0.9);
      x.fillStyle = '#C8F090';
      leaf(x, CX, 424, 20, 0);
    },
  },

  // Gangtok: Kanchenjunga glowing pink above a sea of clouds, prayer flags leading to a golden wheel
  peaks: {
    far(x, r, s, hz) {
      glow(x, CX, 300, 500, '#FFD6DC', 0.5);
      ridge(x, r, { base: hz, amp: 420, color: '#F2CCD6', peaks: 3.2, freq: 0.7 });
      ridge(x, r, { base: hz, amp: 260, color: '#B9A9CC', alpha: 0.55, peaks: 2, freq: 1.1 });
      veil(x, s.haze, 0.2, 0, hz);
      const g = x.createLinearGradient(0, hz - 40, 0, H);
      g.addColorStop(0, '#F8F2F8');
      g.addColorStop(1, '#E4DAEE');
      x.fillStyle = g;
      x.fillRect(0, hz - 10, W, H - hz + 10);
      blobs(x, r, { n: 46, x0: -100, x1: W + 100, y0: hz - 60, y1: hz + 140, r0: 40, r1: 110, color: '#FFFFFF', alpha: 0.85, blur: 14 });
    },
    near(x) {
      x.fillStyle = '#6C5C7E';
      x.beginPath();
      x.moveTo(0, H);
      x.lineTo(0, 560);
      x.quadraticCurveTo(220, 600, 420, H);
      x.fill();
      x.fillStyle = '#C24E3A';
      x.fillRect(90, 520, 100, 50);
      x.fillStyle = '#E0A840';
      x.beginPath();
      x.moveTo(76, 522);
      x.lineTo(204, 522);
      x.lineTo(172, 496);
      x.lineTo(108, 496);
      x.closePath();
      x.fill();
      flags(x, [0, 120], [760, 360], 130);
      flags(x, [W, 90], [840, 360], 130);
    },
    focal(x) {
      const beam = x.createLinearGradient(0, 0, 0, 460);
      beam.addColorStop(0, 'rgba(255, 244, 220, 0)');
      beam.addColorStop(1, 'rgba(255, 244, 220, 0.3)');
      x.fillStyle = beam;
      x.fillRect(740, 0, 120, 460);
      glow(x, CX, CY, 190, '#FFD27A', 0.8);
      x.strokeStyle = '#8A6A2E';
      x.lineWidth = 4;
      x.beginPath();
      x.moveTo(CX, 400);
      x.lineTo(CX, 530);
      x.stroke();
      x.fillStyle = '#E3B04A';
      x.fillRect(772, 412, 56, 80);
      x.fillStyle = '#B8862E';
      x.fillRect(772, 426, 56, 6);
      x.fillRect(772, 472, 56, 6);
      x.fillStyle = '#F4D27A';
      x.fillRect(768, 406, 64, 8);
    },
  },

  // Rann of Kutch: the white salt desert, an enormous full moon resting on the horizon
  salt: {
    far(x, r, s, hz) {
      glow(x, CX, hz - 40, 560, '#E6E4FF', 0.7);
      x.fillStyle = '#FFF9F2';
      x.beginPath();
      x.arc(CX, hz - 40, 150, 0, TAU);
      x.fill();
      x.fillStyle = 'rgba(200, 190, 220, 0.18)';
      for (const [cx, cy, rr] of [[760, hz - 80, 26], [850, hz - 20, 34], [820, hz - 110, 14], [740, hz - 10, 18]]) {
        x.beginPath();
        x.arc(cx, cy, rr, 0, TAU);
        x.fill();
      }
      ridge(x, r, { base: hz, amp: 8, color: '#CFC6DE', alpha: 0.6, freq: 4 });
    },
    near(x, r, s, hz) {
      x.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      x.lineWidth = 1.5;
      for (let k = -14; k <= 14; k++) {
        x.beginPath();
        x.moveTo(CX + k * 8, hz + 4);
        x.lineTo(CX + k * 240, H);
        x.stroke();
      }
      for (let i = 1; i < 14; i++) {
        const t = i / 14, y = hz + 4 + t * t * (H - hz);
        x.beginPath();
        for (let px = 0; px <= W; px += 40) x.lineTo(px, y + Math.sin(px * 0.05 + i) * 3 * t);
        x.stroke();
      }
      x.fillStyle = '#FFFFFF';
      for (let i = 0; i < 300; i++) {
        const t = r();
        x.globalAlpha = 0.3 + r() * 0.6;
        x.fillRect(r() * W, hz + t * t * (H - hz), 2, 2);
      }
      x.globalAlpha = 1;
    },
    focal() {},
  },

  // Shillong: misty pine hills, a waterfall into Umiam lake, a root bridge, a record haloed in light
  pines: {
    far(x, r, s, hz) {
      ridge(x, r, { base: hz, amp: 170, color: '#93B5AE', freq: 0.9 });
      veil(x, s.haze, 0.3, 0, hz);
      ridge(x, r, { base: hz, amp: 90, color: '#5F8C80', freq: 1.3 });
      pines(x, r, { base: hz, n: 110, h0: 24, h1: 60, color: '#46705F', alpha: 0.9, jitter: 10 });
      x.save();
      x.filter = 'blur(3px)';
      x.fillStyle = 'rgba(255, 255, 255, 0.85)';
      x.fillRect(360, hz - 120, 12, 120);
      x.restore();
    },
    near(x, r) {
      x.strokeStyle = '#4A3A30';
      x.lineCap = 'round';
      for (let k = 0; k < 5; k++) {
        x.lineWidth = 10 - k;
        x.beginPath();
        x.moveTo(-20, 820 + k * 6);
        x.quadraticCurveTo(260, 640 + k * 10, 560, 830 + k * 4);
        x.stroke();
      }
      for (let i = 0; i < 40; i++) glow(x, r() * W, 480 + r() * 400, 6 + r() * 8, '#E6F59A', 0.9);
    },
    focal(x) {
      glow(x, CX, CY, 220, '#C8F2FF', 0.6);
      x.strokeStyle = 'rgba(230, 250, 255, 0.8)';
      x.lineWidth = 3;
      x.beginPath();
      x.arc(CX, CY, 96, 0, TAU);
      x.stroke();
      x.fillStyle = '#1C1A22';
      x.beginPath();
      x.arc(CX, CY, 72, 0, TAU);
      x.fill();
      x.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      x.lineWidth = 1;
      for (let rr = 30; rr < 70; rr += 6) {
        x.beginPath();
        x.arc(CX, CY, rr, 0, TAU);
        x.stroke();
      }
      x.fillStyle = '#E0B040';
      x.beginPath();
      x.arc(CX, CY, 22, 0, TAU);
      x.fill();
      x.fillStyle = '#FFFFFF';
      x.beginPath();
      x.arc(CX, CY, 3, 0, TAU);
      x.fill();
    },
  },
};

// Paints the placeholder for a city: pastel sky, high-key light, its own landscape, water, focal object, bokeh
export function paintScene(id) {
  const s = SCENES[id] || SCENES.srinagar;
  const m = MOTIFS[s.motif];
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  const r = seeded(id);
  const hz = Math.round(H * (1 - s.horizon));

  const sky = x.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, s.sky[0]);
  sky.addColorStop(1, s.sky[1]);
  x.fillStyle = sky;
  x.fillRect(0, 0, W, H);
  glow(x, s.rays[0] * W, (1 - s.rays[1]) * H, W * 0.75, '#FFFFFF', 0.5);
  glow(x, CX, hz, W * 0.55, s.haze, 0.55);

  m.far(x, r, s, hz);

  // Atmospheric haze where land meets sky
  const hg = x.createLinearGradient(0, hz - 140, 0, hz + 30);
  hg.addColorStop(0, rgba(s.haze, 0));
  hg.addColorStop(0.75, rgba(s.haze, 0.5));
  hg.addColorStop(1, rgba(s.haze, 0));
  x.fillStyle = hg;
  x.fillRect(0, hz - 140, W, 170);

  if (s.pool) reflect(c, x, r, s, hz);
  if (m.near) m.near(x, r, s, hz);
  glow(x, CX, CY, 320, s.glow, 0.4);
  m.focal(x, r, s);

  // Out-of-focus shapes at the edges of the lens
  blobs(x, r, { n: 6, x0: -120, x1: 220, y0: 80, y1: H, r0: 40, r1: 90, color: s.bokeh, alpha: 0.3, blur: 22 });
  blobs(x, r, { n: 6, x0: W - 220, x1: W + 120, y0: 80, y1: H, r0: 40, r1: 90, color: s.bokeh, alpha: 0.3, blur: 22 });
  return c;
}
