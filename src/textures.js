import * as THREE from 'three';

// Procedural canvas textures for the rooms
function make(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function speckle(c, w, h, n, alpha) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * alpha;
    c.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
    const s = 1 + Math.random() * 3;
    c.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
}

export const plaster = (color) => make(512, 512, (c, w, h) => {
  c.fillStyle = color;
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 40 + Math.random() * 120;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, Math.random() < 0.5 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  speckle(c, w, h, 9000, 0.07);
});

export const planks = (color) => make(1024, 1024, (c, w, h) => {
  c.fillStyle = color;
  c.fillRect(0, 0, w, h);
  const rows = 8, rh = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = -Math.random() * 300;
    while (x < w) {
      const len = 300 + Math.random() * 300;
      const shade = (Math.random() - 0.5) * 0.25;
      c.fillStyle = shade > 0 ? `rgba(255,255,255,${shade})` : `rgba(0,0,0,${-shade})`;
      c.fillRect(x, r * rh, len, rh);
      c.strokeStyle = 'rgba(0,0,0,.08)';
      c.lineWidth = 1;
      for (let g = 0; g < 6; g++) {
        const y = r * rh + Math.random() * rh;
        c.beginPath();
        c.moveTo(x, y);
        c.bezierCurveTo(x + len * 0.3, y + 4, x + len * 0.6, y - 4, x + len, y);
        c.stroke();
      }
      c.fillStyle = 'rgba(0,0,0,.45)';
      c.fillRect(x, r * rh, 2, rh);
      x += len;
    }
    c.fillStyle = 'rgba(0,0,0,.5)';
    c.fillRect(0, r * rh, w, 2);
  }
});

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
  speckle(c, w, h, 5000, 0.08);
});

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
});

export const inlay = () => make(512, 512, (c, w, h) => {
  c.fillStyle = '#F4F1EA';
  c.fillRect(0, 0, w, h);
  speckle(c, w, h, 4000, 0.05);
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

export const label = (text, bg, ink) => make(512, 256, (c, w, h) => {
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);
  speckle(c, w, h, 3000, 0.12);
  c.strokeStyle = ink;
  c.lineWidth = 6;
  c.strokeRect(20, 20, w - 40, h - 40);
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.font = 'bold 54px Inter';
  c.fillText(text, w / 2, h / 2 + 18);
});
