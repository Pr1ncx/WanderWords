import gsap from 'gsap';
import { paintPlates } from './painter.js';
import { INTRO_BIOME } from './chapters.js';
import { holdGesture } from './gestures.js';

// Act I: wipe the fogged train window, face the postcard, punch the ticket.

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

// The landscape behind the glass, painted at screen aspect (kept small for speed)
function paintScene(target) {
  const k = Math.min(1, 1280 / Math.max(innerWidth, innerHeight));
  const w = Math.round(innerWidth * k), h = Math.round(innerHeight * k);
  const layers = paintPlates({ id: 'opening', biome: INTRO_BIOME }, ['bg', 'far', 'mid', 'fg'].map((key) => ({ key, w, h })));
  target.width = w;
  target.height = h;
  const x = target.getContext('2d');
  for (const key of ['bg', 'far', 'mid', 'fg']) x.drawImage(layers[key], 0, 0);
  return target;
}

// Condensation: the scene through wet glass (cheap downscale blur), frost and droplets
function paintFog(x, scene) {
  const w = x.canvas.width, h = x.canvas.height;
  const [small, sx] = canvas(Math.max(8, w >> 4), Math.max(8, h >> 4));
  sx.drawImage(scene, 0, 0, small.width, small.height);
  x.imageSmoothingEnabled = true;
  x.drawImage(small, 0, 0, w, h);
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(236,241,240,0.78)');
  g.addColorStop(1, 'rgba(210,220,222,0.72)');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) {
    const px = Math.random() * w, py = Math.random() * h, r = (0.05 + Math.random() * 0.15) * Math.max(w, h);
    const rg = x.createRadialGradient(px, py, 0, px, py, r);
    rg.addColorStop(0, `rgba(255,255,255,${0.05 + Math.random() * 0.08})`);
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = rg;
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  for (let i = 0; i < 320; i++) {
    const px = Math.random() * w, py = Math.random() * h, r = 1 + Math.pow(Math.random(), 3) * w * 0.008;
    const rg = x.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r);
    rg.addColorStop(0, 'rgba(255,255,255,.6)');
    rg.addColorStop(0.7, 'rgba(170,188,194,.35)');
    rg.addColorStop(1, 'rgba(120,140,150,0)');
    x.fillStyle = rg;
    x.beginPath();
    x.arc(px, py, r, 0, Math.PI * 2);
    x.fill();
  }
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 14; i++) {
    const px = Math.random() * w, py = Math.random() * h * 0.5, len = h * (0.1 + Math.random() * 0.3);
    x.strokeStyle = 'rgba(0,0,0,.5)';
    x.lineWidth = 1 + Math.random() * 2;
    x.beginPath();
    x.moveTo(px, py);
    x.bezierCurveTo(px + (Math.random() - 0.5) * 6, py + len * 0.3, px + (Math.random() - 0.5) * 6, py + len * 0.6, px + (Math.random() - 0.5) * 4, py + len);
    x.stroke();
  }
  x.globalCompositeOperation = 'source-over';
}

function wipe(x, a, b, r) {
  const dx = b.x - a.x, dy = b.y - a.y, n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (r * 0.3)));
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i <= n; i++) {
    const px = a.x + (dx * i) / n, py = a.y + (dy * i) / n;
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, 'rgba(0,0,0,.9)');
    g.addColorStop(0.55, 'rgba(0,0,0,.6)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  x.globalCompositeOperation = 'source-over';
}

function clearedFraction(x) {
  const d = x.getImageData(0, 0, x.canvas.width, x.canvas.height).data;
  let clear = 0, total = 0;
  for (let i = 3; i < d.length; i += 4 * 17) {
    total++;
    if (d[i] < 90) clear++;
  }
  return clear / total;
}

// The cliché: a faded, sepia 'Incredible India' postcard of the same view
function postcardImage(scene) {
  const W = 1200, H = 760, [c, x] = canvas(W, H);
  x.fillStyle = '#F1E6CF';
  x.fillRect(0, 0, W, H);
  const iw = W - 70, ih = H - 70, s = Math.max(iw / scene.width, ih / scene.height);
  const cw = iw / s, chh = ih / s;
  x.drawImage(scene, (scene.width - cw) / 2, (scene.height - chh) / 2, cw, chh, 35, 35, iw, ih);
  x.globalCompositeOperation = 'saturation';
  x.fillStyle = 'rgba(128,128,128,0.85)';
  x.fillRect(35, 35, iw, ih);
  x.globalCompositeOperation = 'color';
  x.fillStyle = 'rgba(168,120,60,0.55)';
  x.fillRect(35, 35, iw, ih);
  x.globalCompositeOperation = 'source-over';
  const v = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.62);
  v.addColorStop(0, 'rgba(255,240,210,0)');
  v.addColorStop(1, 'rgba(120,80,30,0.45)');
  x.fillStyle = v;
  x.fillRect(35, 35, iw, ih);
  x.fillStyle = '#F3EBDD';
  x.textAlign = 'center';
  x.shadowColor = 'rgba(0,0,0,.35)';
  x.shadowBlur = 12;
  x.font = 'italic 46px "Cormorant Garamond", Georgia, serif';
  x.fillText('Greetings from', W / 2, H * 0.4);
  x.font = 'italic 500 120px "Cormorant Garamond", Georgia, serif';
  x.fillText('Incredible India', W / 2, H * 0.58, W - 160);
  x.shadowBlur = 0;
  x.fillStyle = '#E9DCC4';
  x.fillRect(W - 170, 60, 110, 130);
  x.strokeStyle = '#B5523B';
  x.lineWidth = 3;
  x.strokeRect(W - 160, 70, 90, 110);
  x.fillStyle = '#B5523B';
  x.font = '700 22px Inter, sans-serif';
  x.fillText('₹ 5', W - 115, 160);
  return c.toDataURL('image/jpeg', 0.85);
}

function tearPaths() {
  const edge = [];
  for (let i = 0; i <= 18; i++) edge.push(`${(50 + (Math.random() - 0.5) * 6).toFixed(1)}% ${((i / 18) * 100).toFixed(1)}%`);
  return { l: `polygon(0 0, ${edge.join(', ')}, 0 100%)`, r: `polygon(100% 0, ${edge.join(', ')}, 100% 100%)` };
}

// Returns { done: Promise, cancel() }
export function runOpening({ stamps, sound }) {
  const root = document.querySelector('#opening');
  const q = (s) => root.querySelector(s);
  const cleanups = [];
  let cancelled = false;

  const done = new Promise((resolve) => {
    const scene = paintScene(q('.op-scene'));
    const fog = q('.op-fog'), k = 0.4;
    fog.width = Math.round(innerWidth * k);
    fog.height = Math.round(innerHeight * k);
    const fx = fog.getContext('2d', { willReadFrequently: true });
    paintFog(fx, scene);

    gsap.set(root, { autoAlpha: 1 });
    gsap.fromTo(q('.op-prompt').children, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 1.1, ease: 'expo.out', delay: 0.3 });
    gsap.fromTo([q('.op-meter'), q('.op-skip')], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, delay: 0.9 });

    // ---- Wipe the window ----
    const cursor = q('.op-cursor');
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.2, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.2, ease: 'power3' });
    const r = Math.max(fog.width, fog.height) * 0.06;
    const pos = (e) => ({ x: e.clientX * k, y: e.clientY * k });
    let last = null, lastCheck = 0, wiped = false;

    const move = (e) => {
      cx(e.clientX);
      cy(e.clientY);
      if (!wiped) gsap.set(cursor, { autoAlpha: 1 });
      if (wiped || !last) return;
      const p = pos(e);
      wipe(fx, last, p, r);
      last = p;
      const now = performance.now();
      if (now - lastCheck > 300) {
        lastCheck = now;
        const f = clearedFraction(fx);
        gsap.to(q('.op-meter i'), { scaleX: Math.min(1, f / 0.4), duration: 0.3 });
        if (f > 0.4) finishWipe();
      }
    };
    const down = (e) => {
      if (wiped || e.target.closest('button')) return;
      last = pos(e);
      wipe(fx, last, last, r);
      root.classList.add('is-wiping');
    };
    const up = () => { last = null; root.classList.remove('is-wiping'); };
    root.addEventListener('pointerdown', down);
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    cleanups.push(() => {
      root.removeEventListener('pointerdown', down);
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
    });
    q('.op-skip').onclick = () => finishWipe();

    function finishWipe() {
      if (wiped || cancelled) return;
      wiped = true;
      up();
      sound('whoosh');
      gsap.timeline()
        .to(fog, { autoAlpha: 0, duration: 1.2, ease: 'power2.out' })
        .to([q('.op-prompt'), q('.op-meter'), q('.op-skip'), cursor], { autoAlpha: 0, duration: 0.5 }, 0)
        .add(() => stamps.award('window', () => sound('stamp')).then(postcardPhase), 0.5);
    }

    // ---- The postcard, and the ticket punch ----
    function postcardPhase() {
      if (cancelled) return;
      const url = postcardImage(scene), tear = tearPaths();
      const L = q('.op-half--l'), R = q('.op-half--r'), card = q('.op-card');
      L.style.backgroundImage = R.style.backgroundImage = `url(${url})`;
      L.style.clipPath = tear.l;
      R.style.clipPath = tear.r;
      gsap.set(q('.op-gate'), { autoAlpha: 1 });
      gsap.timeline()
        .to(q('.op-scrim'), { autoAlpha: 1, duration: 1 }, 0)
        .fromTo(card, { y: -60, rotate: -6, autoAlpha: 0 }, { y: 0, rotate: -2, autoAlpha: 1, duration: 1.2, ease: 'expo.out' }, 0)
        .fromTo(q('.op-headline'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.4)
        .fromTo(q('#punch'), { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'back.out(2)' }, 0.7);
      cleanups.push(holdGesture(q('#punch'), {
        duration: 1.6,
        onProgress: (p) => gsap.set(card, { x: (Math.random() - 0.5) * p * 8, y: (Math.random() - 0.5) * p * 6 }),
        onRelease: () => gsap.to(card, { x: 0, y: 0, duration: 0.3 }),
        onDone: punched,
      }));

      function punched() {
        if (cancelled) return;
        sound('punch');
        gsap.timeline()
          .to(q('#punch'), { scale: 1.3, autoAlpha: 0, duration: 0.4, ease: 'power2.out' }, 0)
          .add(() => sound('tear'), 0.1)
          .to(L, { xPercent: -28, yPercent: 8, rotate: -14, autoAlpha: 0, duration: 1.2, ease: 'power3.in' }, 0.1)
          .to(R, { xPercent: 28, yPercent: 12, rotate: 16, autoAlpha: 0, duration: 1.2, ease: 'power3.in' }, 0.1)
          .to(q('.op-headline'), { autoAlpha: 0, y: -20, duration: 0.5 }, 0.1)
          .fromTo(q('.op-ride'), { autoAlpha: 0, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'expo.out' }, 0.8)
          .add(() => stamps.award('ticket', () => sound('stamp')), 1.0)
          .add(() => { cleanups.forEach((f) => f()); resolve(); }, 3.0)
          .to(root, { autoAlpha: 0, duration: 1.2, ease: 'power2.in' }, 3.0);
      }
    }
  });

  return {
    done,
    cancel() {
      cancelled = true;
      cleanups.forEach((f) => f());
    },
  };
}
