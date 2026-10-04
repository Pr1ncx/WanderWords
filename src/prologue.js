import gsap from 'gsap';
import './prologue.css';
import {
  deskSVG, sealSVG, sketchesSVG, watermarkSVG, photoSVG,
  stamperSVG, STAMPER_FACE, impressionSVG, trainSVG, TRAIN,
} from './prologue-art.js';

// Prologue "The Letter": a grey desk, a fogged window, a letter from the last passenger,
// a passport stamp, and a train that wipes the screen into the WebGL carriage.
//
// Contract with main.js: runPrologue() returns { done, cancel, skip }.
// reveal() is called while the train fully covers the screen, so the 3D carriage
// can start rendering underneath before the last coach clears.

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const TRAIN_PASS = 3.0; // seconds for the whole train to cross the screen

// ---------- Helpers ----------
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Condensation on the glass, tinted by a blurred copy of the view behind it
function paintFog(x, img) {
  const w = x.canvas.width, h = x.canvas.height;
  x.clearRect(0, 0, w, h);
  if (img) {
    const [small, sx] = makeCanvas(Math.max(8, w >> 4), Math.max(8, h >> 4));
    const s = Math.max(small.width / img.width, small.height / img.height);
    sx.drawImage(img, (small.width - img.width * s) / 2, (small.height - img.height * s) / 2, img.width * s, img.height * s);
    x.imageSmoothingEnabled = true;
    x.drawImage(small, 0, 0, w, h);
  }
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(226, 232, 234, 0.86)');
  g.addColorStop(1, 'rgba(198, 208, 212, 0.8)');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);

  const drops = Math.min(400, Math.round((w * h) / 250));
  for (let i = 0; i < drops; i++) {
    const px = Math.random() * w, py = Math.random() * h, r = 0.6 + Math.pow(Math.random(), 3) * w * 0.012;
    const rg = x.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r);
    rg.addColorStop(0, 'rgba(255, 255, 255, .6)');
    rg.addColorStop(0.7, 'rgba(170, 188, 194, .35)');
    rg.addColorStop(1, 'rgba(120, 140, 150, 0)');
    x.fillStyle = rg;
    x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
  }

  // Rain trickling down the outside of the glass
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 10; i++) {
    const px = Math.random() * w, py = Math.random() * h * 0.5, len = h * (0.15 + Math.random() * 0.35);
    x.strokeStyle = 'rgba(0, 0, 0, .5)';
    x.lineWidth = 0.8 + Math.random() * 1.4;
    x.beginPath(); x.moveTo(px, py);
    x.bezierCurveTo(px + (Math.random() - 0.5) * 4, py + len * 0.3, px + (Math.random() - 0.5) * 4, py + len * 0.6, px + (Math.random() - 0.5) * 3, py + len);
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
    g.addColorStop(0, 'rgba(0, 0, 0, .9)');
    g.addColorStop(0.55, 'rgba(0, 0, 0, .6)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    x.fillStyle = g;
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  x.globalCompositeOperation = 'source-over';
}

function clearedFraction(x) {
  const d = x.getImageData(0, 0, x.canvas.width, x.canvas.height).data;
  let clear = 0, total = 0;
  for (let i = 3; i < d.length; i += 4 * 17) { total++; if (d[i] < 90) clear++; }
  return clear / total;
}

// Wrap each word in a span so the letter can appear word by word (keeps wrapping natural)
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  words.forEach((w, i) => {
    const s = document.createElement('span');
    s.className = 'pl-w';
    s.textContent = w;
    el.appendChild(s);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return [...el.querySelectorAll('.pl-w')];
}

// Split-flap board: characters settle left to right out of random glyphs
function scramble(el, text, duration) {
  const o = { p: 0 };
  return gsap.to(o, {
    p: 1, duration, ease: 'none',
    onUpdate: () => {
      const n = Math.floor(o.p * text.length);
      let out = text.slice(0, n);
      for (let i = n; i < text.length; i++) out += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = out;
    },
    onComplete: () => (el.textContent = text),
  });
}

// ---------- The prologue ----------
export function runPrologue({ stamps, sound = () => {}, reveal = () => {} }) {
  const root = document.querySelector('#opening');
  const q = (s) => root.querySelector(s);
  const qa = (s) => [...root.querySelectorAll(s)];

  const el = {
    desk: q('.pl-desk'), view: q('.pl-view'), fog: q('.pl-fog'),
    winHint: q('.pl-hint--window'), meter: q('.pl-meter i'), assist: q('.pl-assist'),
    scrim: q('.pl-scrim'), wash: q('.pl-wash'),
    envWrap: q('.pl-envelope-wrap'), env: q('.pl-envelope'), flap: q('.pl-envelope__flap'),
    sealL: q('.pl-seal__half--l'), sealR: q('.pl-seal__half--r'), letterHint: q('.pl-hint--letter'),
    letter: q('.pl-letter'), paper: q('.pl-paper'), sketches: q('.pl-sketches'), sign: q('.pl-sign'), cta: q('.pl-cta'),
    passport: q('.pl-passport'), pageR: q('.pl-page--r'), target: q('.pl-target'), impression: q('.pl-impression'),
    stamper: q('.pl-stamper'), shadow: q('.pl-stamp-shadow'), stampHint: q('.pl-hint--stamp'),
    board: q('.pl-board'), status: q('.pl-board__status'),
  };

  let cancelled = false, departing = false, finished = false, stamped = false;
  let resolveDone, trainEl = null, bob = null, lift = 0, glassRect = null;
  const done = new Promise((r) => (resolveDone = r));

  // Everything started here is tracked so cancel() and skip() can stop it cleanly
  const timers = new Set();
  let listeners = [];
  const tl = (vars) => { const t = gsap.timeline(vars); timers.add(t); return t; };
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    listeners.push(() => target.removeEventListener(type, fn, opts));
  };
  const killTimers = () => { timers.forEach((t) => t.kill()); timers.clear(); };
  const dropListeners = () => { listeners.forEach((f) => f()); listeners = []; };
  const alive = () => !cancelled && !departing;

  // ---------- Build the illustrations ----------
  el.desk.innerHTML = deskSVG();
  const deskArt = el.desk.querySelector('.pl-desk__art');
  const glass = el.desk.querySelector('#pl-glass');
  el.sealL.innerHTML = sealSVG();
  el.sealR.innerHTML = sealSVG();
  el.sketches.innerHTML = sketchesSVG();
  qa('.pl-wm').forEach((s) => (s.innerHTML = watermarkSVG()));
  q('.pl-photo').innerHTML = photoSVG();
  el.stamper.innerHTML = stamperSVG();
  el.impression.innerHTML = impressionSVG();
  q('.pl-issued').textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  gsap.set(deskArt, { filter: 'grayscale(1) brightness(0.72) saturate(1)' });

  // The fog canvas and the view behind it sit exactly on the illustrated window pane
  function placeWindow() {
    glassRect = glass.getBoundingClientRect();
    const r = glassRect;
    for (const n of [el.view, el.fog]) {
      Object.assign(n.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    }
    el.winHint.style.top = `${r.bottom + 34}px`;
  }
  placeWindow();
  el.fog.width = Math.max(64, Math.round(glassRect.width * 0.5));
  el.fog.height = Math.max(40, Math.round(glassRect.height * 0.5));
  const fx = el.fog.getContext('2d', { willReadFrequently: true });
  on(window, 'resize', placeWindow);

  loadImage('/media/opening/arch.png').then((img) => {
    if (!alive()) return;
    paintFog(fx, img);
    intro();
  });

  // ---------- 1. The desk ----------
  function intro() {
    gsap.set(root, { autoAlpha: 1 });
    tl()
      .fromTo(el.desk, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.6, ease: 'power2.out' })
      .fromTo([el.view, el.fog], { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 0.3)
      .fromTo(el.winHint, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 0.9);
    armWipe();
  }

  function armWipe() {
    const k = () => el.fog.width / glassRect.width;
    const pos = (e) => ({ x: (e.clientX - glassRect.left) * k(), y: (e.clientY - glassRect.top) * k() });
    const r = Math.max(el.fog.width, el.fog.height) * 0.11;
    let last = null, lastCheck = 0, wiped = false;

    const down = (e) => {
      if (wiped) return;
      last = pos(e);
      wipe(fx, last, last, r);
      try { el.fog.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    };
    const move = (e) => {
      if (wiped || !last) return;
      const p = pos(e);
      wipe(fx, last, p, r);
      last = p;
      const now = performance.now();
      if (now - lastCheck > 200) {
        lastCheck = now;
        const f = clearedFraction(fx);
        gsap.to(el.meter, { scaleX: Math.min(1, f / 0.45), duration: 0.3 });
        if (f > 0.45) finishWipe();
      }
    };
    const up = () => (last = null);
    on(el.fog, 'pointerdown', down);
    on(el.fog, 'pointermove', move);
    on(el.fog, 'pointercancel', up);
    on(window, 'pointerup', up);
    on(el.assist, 'click', () => finishWipe());

    function finishWipe() {
      if (wiped || !alive()) return;
      wiped = true;
      up();
      el.fog.classList.add('is-done');
      sound('whoosh');
      tl()
        .to(el.fog, { autoAlpha: 0, duration: 1.1, ease: 'power2.out' })
        .to(el.winHint, { autoAlpha: 0, duration: 0.4 }, 0)
        .add(() => stamps.award('window', () => sound('stamp')).then(() => alive() && letterArrives()), 0.9);
    }
  }

  // ---------- 2. The letter ----------
  function letterArrives() {
    sound('paper');
    tl()
      .fromTo(el.envWrap,
        { autoAlpha: 0, x: () => innerWidth * 0.6, rotate: 14 },
        { autoAlpha: 1, x: 0, rotate: -4, duration: RM ? 0.4 : 1.4, ease: 'expo.out' })
      .add(() => el.env.classList.add('is-glowing'))
      .fromTo(el.letterHint, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8 }, '-=0.4');

    // Tactile tilt toward the pointer
    if (!RM) {
      on(el.env, 'pointermove', (e) => {
        const r = el.env.getBoundingClientRect();
        const nx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
        gsap.to(el.env, { rotateY: nx * 18, rotateX: -ny * 18, duration: 0.5, ease: 'power2.out' });
      });
      on(el.env, 'pointerleave', () => gsap.to(el.env, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' }));
    }
    on(el.env, 'click', openLetter, { once: true });
  }

  function openLetter() {
    if (!alive()) return;
    el.env.classList.remove('is-glowing');
    el.env.disabled = true;
    sound('seal');

    const words = qa('.pl-words').map(splitWords);
    const sweeps = qa('.pl-sweep');
    gsap.set(words.flat(), { autoAlpha: 0, y: 6, filter: 'blur(4px)' });
    gsap.set(sweeps, { '--p': -0.15 });
    gsap.set([el.sign, el.cta], { autoAlpha: 0 });

    tl()
      .to(el.env, { rotateX: 0, rotateY: 0, duration: 0.2 }, 0)
      .to(el.letterHint, { autoAlpha: 0, duration: 0.3 }, 0)
      .to(el.sealL, { x: -18, y: 26, rotate: -32, autoAlpha: 0, duration: 0.7, ease: 'power2.in' }, 0.1)
      .to(el.sealR, { x: 18, y: 30, rotate: 28, autoAlpha: 0, duration: 0.7, ease: 'power2.in' }, 0.1)
      .to(el.flap, { rotateX: 180, duration: 0.6, ease: 'power2.inOut' }, 0.35)
      .add(() => sound('paper'), 0.6)
      .to(el.scrim, { autoAlpha: 1, duration: 0.9 }, 0.6)
      .to(el.envWrap, { y: 40, autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, 0.9)
      .fromTo(el.letter,
        { autoAlpha: 0, y: () => innerHeight * 0.3, scale: 0.55, rotate: -3 },
        { autoAlpha: 1, y: 0, scale: 1, rotate: 0, duration: 1.1, ease: 'expo.out' }, 0.9)
      .add(() => writeLetter(words, sweeps));
  }

  function writeLetter(words, sweeps) {
    if (!alive()) return;
    const show = { autoAlpha: 1, y: 0, filter: 'blur(0px)', ease: 'power2.out', duration: 0.5, stagger: 0.07 };
    const t = tl()
      .to(qa('.pl-sketch path'), { strokeDashoffset: 0, duration: 3.2, ease: 'power1.inOut', stagger: 0.5 }, 0)
      .to(sweeps[0], { '--p': 1.15, duration: 1.4, ease: 'power1.inOut' }, 0.2);
    let at = 1.5;
    words.forEach((ws) => {
      t.to(ws, show, at);
      at += ws.length * 0.07 + 0.35;
    });
    t.to(sweeps[1], { '--p': 1.15, duration: 1.6, ease: 'power1.inOut' }, at)
      .to(el.sign, { autoAlpha: 1, duration: 0.8 }, at + 1.4)
      .to(el.cta, { autoAlpha: 1, duration: 0.6 }, at + 1.8)
      .add(() => el.cta.focus({ preventScroll: true }));
    if (RM) t.timeScale(6);

    // Tap the paper to finish the writing at once
    on(el.paper, 'click', () => t.progress(1), { once: true });
    on(el.cta, 'click', toPassport, { once: true });
  }

  // ---------- 3. The passport ----------
  function toPassport() {
    if (!alive()) return;
    sound('paper');
    const wm = qa('.pl-wm path');
    gsap.set(wm, { strokeDashoffset: 1 });
    tl()
      .to(el.letter, { scaleY: 0.04, y: () => innerHeight * 0.1, autoAlpha: 0, duration: 0.7, ease: 'power3.in' })
      .fromTo(el.passport,
        { autoAlpha: 0, y: 60, scale: 0.92, rotateX: 18, transformPerspective: 900 },
        { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, duration: 1.1, ease: 'expo.out' }, 0.5)
      .to(wm, { strokeDashoffset: 0, duration: RM ? 0.3 : 2.2, ease: 'power2.out', stagger: RM ? 0 : 0.03 }, 0.9)
      .add(armStamper, 1.5);
  }

  // Stamper pose y = 0 is "rubber on the page"; lift is the hover height above it
  function aim() {
    const t = el.target.getBoundingClientRect();
    const w = el.stamper.offsetWidth, h = el.stamper.offsetHeight;
    el.stamper.style.left = `${t.left + t.width / 2 - w / 2}px`;
    el.stamper.style.top = `${t.top + t.height / 2 - h * STAMPER_FACE}px`;
    el.shadow.style.left = `${t.left + t.width / 2}px`;
    el.shadow.style.top = `${t.top + t.height / 2}px`;
    lift = -(h * 0.6 + 40);
  }

  function armStamper() {
    if (!alive()) return;
    aim();
    on(window, 'resize', () => {
      aim();
      if (!stamped) { if (bob) bob.kill(); gsap.set(el.stamper, { y: lift }); }
    });
    gsap.set(el.stamper, { y: -innerHeight, autoAlpha: 1 });
    tl()
      .to(el.stamper, { y: lift, duration: 0.9, ease: 'expo.out' })
      .fromTo(el.shadow, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 0.5, scale: 0.8, duration: 0.9 }, 0)
      .fromTo(el.stampHint, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.4)
      .add(() => {
        if (RM || stamped) return;
        bob = gsap.to(el.stamper, { y: lift - 12, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        timers.add(bob);
      });
    on(el.stamper, 'click', pressStamp, { once: true });
  }

  function pressStamp() {
    if (!alive() || stamped) return;
    stamped = true;
    if (bob) bob.kill();
    el.stamper.disabled = true;
    tl()
      .to(el.stampHint, { autoAlpha: 0, duration: 0.3 }, 0)
      .to(el.stamper, { y: lift - 30, duration: 0.25, ease: 'power2.out' }, 0)
      .to(el.stamper, { y: 0, duration: 0.16, ease: 'power4.in' })
      .to(el.shadow, { autoAlpha: 0.9, scale: 1, duration: 0.16, ease: 'power4.in' }, '<')
      .add(thunk)
      .to(el.stamper, { scaleY: 0.94, transformOrigin: '50% 100%', duration: 0.06, yoyo: true, repeat: 1 })
      .to(el.stamper, { y: -innerHeight, duration: 0.8, ease: 'power3.in' }, '+=0.35')
      .to(el.shadow, { autoAlpha: 0, duration: 0.4 }, '<')
      .add(() => stamps.award('ticket', () => sound('stamp')).then(() => alive() && colourBleed()), '-=0.3');
  }

  function thunk() {
    sound('punch');
    gsap.set(el.target, { autoAlpha: 0 });
    gsap.fromTo(el.impression, { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1, duration: 0.18, ease: 'power3.out' });
    splatter();
    if (!RM) gsap.fromTo(el.passport, { y: 8 }, { y: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
  }

  function splatter() {
    const t = el.target.getBoundingClientRect(), p = el.pageR.getBoundingClientRect();
    const cx = t.left - p.left + t.width / 2, cy = t.top - p.top + t.height / 2;
    for (let i = 0; i < 22; i++) {
      const d = document.createElement('i');
      d.className = 'pl-drop';
      const size = 2 + Math.random() * 5, a = Math.random() * Math.PI * 2, dist = t.width * (0.42 + Math.random() * 0.3);
      Object.assign(d.style, { left: `${cx}px`, top: `${cy}px`, width: `${size}px`, height: `${size}px` });
      el.pageR.appendChild(d);
      gsap.to(d, { x: Math.cos(a) * dist, y: Math.sin(a) * dist * 0.66, duration: 0.3 + Math.random() * 0.3, ease: 'power3.out' });
    }
  }

  // The grey world takes on colour, from the edges in
  function colourBleed() {
    el.passport.classList.add('is-cleared');
    tl()
      .to(el.scrim, { autoAlpha: 0.35, duration: 2 }, 0)
      .to(deskArt, { filter: 'grayscale(0) brightness(1) saturate(1.08)', duration: 2.4, ease: 'power2.inOut' }, 0)
      .to(el.wash, { autoAlpha: 1, duration: 2.4, ease: 'power2.inOut' }, 0.2)
      .add(() => departure(false), 1.6);
  }

  // ---------- 4. Departure: the board, then the train ----------
  function departure(skipped) {
    if (cancelled || departing || finished) return;
    departing = true;
    dropListeners();
    if (skipped) {
      killTimers();
      gsap.set(root, { autoAlpha: 1 });
      runTrain();
      return;
    }
    const flaps = qa('[data-flap]');
    tl()
      .fromTo(el.board, { autoAlpha: 0, y: -24 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' })
      .add(() => {
        sound('board');
        flaps.forEach((f, i) => timers.add(scramble(f, f.dataset.flap, 0.9 + i * 0.25)));
      }, 0.2)
      .add(() => el.status.classList.add('is-blink'), 2.0)
      .add(() => sound('horn'), 2.2)
      .add(runTrain, 2.8);
  }

  function runTrain() {
    if (cancelled) return;
    if (RM) {
      // No sweeping train: a calm crossfade instead
      reveal();
      tl().to(root, { autoAlpha: 0, duration: 1.2, ease: 'power2.inOut', onComplete: finish });
      return;
    }

    // Size the train so one coach is taller and wider than the screen
    const art = trainSVG();
    const vw = innerWidth, vh = innerHeight;
    const s = Math.max((vh * 1.25) / art.height, (vw * 1.1) / TRAIN.coach);
    const w = art.total * s, h = art.height * s;
    trainEl = document.createElement('div');
    trainEl.className = 'pl-train';
    trainEl.innerHTML = art.svg;
    Object.assign(trainEl.style, { width: `${w}px`, height: `${h}px`, top: `${(vh - h) / 2}px` });
    root.appendChild(trainEl);

    // Swap scenes when the middle coach is centred: it covers the whole viewport then
    const mid = art.centres[Math.floor(art.centres.length / 2)];
    const startX = -w, swapX = vw / 2 - mid * s, endX = vw;
    const v = (endX - startX) / TRAIN_PASS;

    sound('train');
    gsap.set(trainEl, { x: startX });
    const shake = gsap.to(trainEl, { y: 3, duration: 0.06, yoyo: true, repeat: -1, ease: 'none' });
    timers.add(shake);
    tl()
      .to(trainEl, { x: swapX, duration: (swapX - startX) / v, ease: 'none' })
      .add(swap)
      .to(trainEl, { x: endX, duration: (endX - swapX) / v, ease: 'none' })
      .add(finish);
  }

  // Behind the train: hide the prologue and let the WebGL carriage show through
  function swap() {
    reveal();
    gsap.set(qa(':scope > :not(.pl-train)'), { autoAlpha: 0 });
    root.classList.add('is-revealed');
  }

  function finish() {
    if (finished) return;
    finished = true;
    killTimers();
    dropListeners();
    gsap.set(root, { autoAlpha: 0 });
    if (trainEl) { trainEl.remove(); trainEl = null; }
    root.classList.remove('is-revealed');
    resolveDone();
  }

  return {
    done,
    // Jump straight to the train (main.js Skip button)
    skip() {
      if (cancelled || departing || finished) return;
      departure(true);
    },
    // Stop everything (main.js jumps to a chapter from the menu)
    cancel() {
      cancelled = true;
      killTimers();
      dropListeners();
      if (trainEl) { trainEl.remove(); trainEl = null; }
      root.classList.remove('is-revealed');
    },
  };
}
