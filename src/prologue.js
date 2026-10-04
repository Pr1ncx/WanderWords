import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
import './prologue.css';
import { ASSET_BASE, ASSETS, stageHTML, tornClip, trainSVG, TRAIN } from './prologue-art.js';

gsap.registerPlugin(Observer);

// Prologue "The Letter" as a scroll-driven mixed-media collage.
// Wheel, swipe and arrow keys scrub one master timeline; impacts fire as one-shot beats.
// Contract with main.js: runPrologue() returns { done, cancel, skip }.
// reveal() is called while the train covers the screen so the WebGL carriage can render underneath.

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOTAL = 80;          // timeline length in units (beats below use the same units)
const SCROLL_SCREENS = 6;  // how many screen-heights of scrolling the whole prologue takes
const SMOOTH = 0.09;       // 0..1, lower = more glide
const TRAIN_PASS = 3.0;    // seconds for the train to cross

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.alt = '';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Every [data-asset] gets its image, or keeps its placeholder (torn if marked data-torn)
function mountAssets(root) {
  return Promise.all([...root.querySelectorAll('[data-asset]')].map(async (el) => {
    const src = ASSET_BASE + ASSETS[el.dataset.asset];
    const img = await loadImage(src);
    if (img) {
      el.prepend(img);
      el.classList.add('has-asset');
    } else {
      el.classList.add('is-placeholder');
      el.dataset.missing = src;
      if (el.hasAttribute('data-torn')) el.style.clipPath = tornClip();
    }
  }));
}

function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  words.forEach((w, i) => {
    const s = document.createElement('span');
    s.className = 'cl-w';
    s.textContent = w;
    el.appendChild(s);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return [...el.querySelectorAll('.cl-w')];
}

export function runPrologue({ stamps, sound = () => {}, reveal = () => {} }) {
  const root = document.querySelector('#opening');
  root.innerHTML = stageHTML();
  root.classList.add('cl');
  if (import.meta.env && import.meta.env.DEV) root.classList.add('cl-dev');
  const q = (s) => root.querySelector(s);
  const qa = (s) => [...root.querySelectorAll(s)];

  const el = {
    cam: q('.cl-cam'), pan: q('.cl-pan'), world: q('.cl-world'), desk: q('.cl-desk'), scraps: q('.cl-scraps'),
    env: q('.cl-envelope'), flap: q('.cl-envelope__flap'), sealL: q('.cl-seal__half--l'), sealR: q('.cl-seal__half--r'),
    scrim: q('.cl-scrim'), wash: q('.cl-wash'), sheet: q('.cl-sheet'), sign: q('.cl-sign'),
    passport: q('.cl-passport'), book: q('.cl-book'), pageR: q('.cl-page--r'), target: q('.cl-target'),
    impression: q('.cl-impression'), splat: q('.cl-splat'), stamper: q('.cl-stamper'), shadow: q('.cl-stamp-shadow'),
    cue: q('.cl-cue'),
  };
  q('.cl-issued').textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  qa('[data-torn-always]').forEach((n) => (n.style.clipPath = tornClip(n.classList.contains('cl-word') ? 6 : 0.8)));

  let cancelled = false, departing = false, finished = false;
  let master = null, target = 0, value = 0, observer = null, trainEl = null, resolveDone;
  const done = new Promise((r) => (resolveDone = r));
  const fired = new Set();
  const timers = new Set();
  let listeners = [];
  const tl = (vars) => { const t = gsap.timeline(vars); timers.add(t); return t; };
  const on = (t, type, fn, opts) => { t.addEventListener(type, fn, opts); listeners.push(() => t.removeEventListener(type, fn, opts)); };
  const killTimers = () => { timers.forEach((t) => t.kill()); timers.clear(); };
  const alive = () => !cancelled && !departing;

  const trainImgs = Promise.all([loadImage(ASSET_BASE + ASSETS.coach), loadImage(ASSET_BASE + ASSETS.loco)]);
  Promise.race([mountAssets(root), wait(2500)]).then(() => {
    if (!alive()) return;
    build();
    start();
  });

  // ---------- The master timeline (scrubbed, never played) ----------
  function build() {
    const words = qa('.cl-words').map(splitWords);
    const sweeps = qa('.cl-sweep');
    const head1 = qa('.cl-head--1 .cl-word'), head2 = qa('.cl-head--2 .cl-word');
    const pieces = qa('.cl-scrap');
    const engr = qa('.cl-engr');
    const wm = qa('.cl-wm path');
    const greyed = [el.desk, el.scraps];
    const tilt = (a) => (i) => (i % 2 ? a : -a);

    gsap.set(words.flat(), { autoAlpha: 0, y: 8, filter: 'blur(5px)' });
    gsap.set(sweeps, { '--p': -0.15 });
    gsap.set([...head1, ...head2, el.sheet, el.passport, el.sign], { autoAlpha: 0 });
    gsap.set(engr, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(greyed, { filter: 'grayscale(1) brightness(0.62) contrast(1.05)' });
    gsap.set(el.stamper, { yPercent: -420 });
    gsap.set(el.shadow, { autoAlpha: 0, scale: 0.4 });

    const T = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

    // 0-25: the desk. Camera dollies out, ephemera drift at their own depths, the envelope floats in
    T.fromTo(el.world, { scale: 1.22 }, { scale: 1, duration: 24, ease: 'power2.out' }, 0)
      .fromTo(el.desk, { yPercent: 3 }, { yPercent: -3, duration: 56 }, 0);
    pieces.forEach((p) => {
      const d = +p.dataset.depth || 1;
      T.fromTo(p, { y: () => innerHeight * 0.16 * d, rotation: -5 * d }, { y: () => -innerHeight * 0.12 * d, rotation: 3 * d, duration: 56 }, 0);
    });
    T.fromTo(head1, { autoAlpha: 0, y: 60, rotation: tilt(9) }, { autoAlpha: 1, y: 0, rotation: tilt(2), duration: 3, stagger: 0.8, ease: 'power3.out' }, 1)
      .to(head1, { autoAlpha: 0, y: -50, duration: 2, stagger: 0.25, ease: 'power2.in' }, 15)
      .fromTo(el.env, { x: () => innerWidth * 0.55, y: () => -innerHeight * 0.75, rotation: 28 }, { x: 0, y: 0, rotation: 0, duration: 13, ease: 'power3.out' }, 9);

    // 25-54: the letter. Seal cracks, flap opens, the sheet fills the frame and writes itself
    T.to(el.sealL, { x: -26, y: 34, rotation: -40, autoAlpha: 0, duration: 3, ease: 'power2.in' }, 26)
      .to(el.sealR, { x: 26, y: 40, rotation: 34, autoAlpha: 0, duration: 3, ease: 'power2.in' }, 26)
      .fromTo(el.flap, { rotationX: 0, transformPerspective: 800 }, { rotationX: 178, duration: 3, ease: 'power2.inOut' }, 27.5)
      .to(el.scrim, { autoAlpha: 0.8, duration: 4 }, 30)
      .to(el.env, { y: () => innerHeight * 0.25, scale: 0.8, autoAlpha: 0, duration: 4, ease: 'power2.in' }, 31)
      .fromTo(el.sheet, { autoAlpha: 0, scale: 0.28, y: () => innerHeight * 0.2, rotation: -5 }, { autoAlpha: 1, scale: 1, y: 0, rotation: 0, duration: 6, ease: 'power3.out' }, 31)
      .to(engr, { clipPath: 'inset(0% 0% 0% 0%)', duration: 5, stagger: 3, ease: 'power1.inOut' }, 36)
      .to(sweeps[0], { '--p': 1.15, duration: 3, ease: 'power1.inOut' }, 37);
    let at = 40;
    [2.6, 4.2, 1.2].forEach((span, i) => {
      const ws = words[i] || [];
      T.to(ws, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.2, stagger: Math.max(0.02, (span - 1.2) / Math.max(1, ws.length)), ease: 'power2.out' }, at);
      at += span;
    });
    T.to(sweeps[1], { '--p': 1.15, duration: 2.5, ease: 'power1.inOut' }, at)
      .to(el.sign, { autoAlpha: 1, duration: 1.5 }, at + 2.2);

    // 54-76: the passport. Letter folds, passport rises, security print draws, the stamp comes down
    T.to(el.sheet, { scaleY: 0.03, y: () => -innerHeight * 0.05, autoAlpha: 0, duration: 3, ease: 'power2.in' }, 54)
      .fromTo(el.passport, { autoAlpha: 0, scale: 0.32, y: () => innerHeight * 0.3, rotation: 9, rotationX: 40, transformPerspective: 1200 }, { autoAlpha: 1, scale: 1, y: 0, rotation: -1.5, rotationX: 0, duration: 5, ease: 'power3.out' }, 56)
      .to(wm, { strokeDashoffset: 0, duration: 5, stagger: 0.08, ease: 'power2.out' }, 58)
      .to(el.stamper, { yPercent: -60, duration: 3, ease: 'power2.out' }, 61)
      .to(el.shadow, { autoAlpha: 0.45, scale: 0.75, duration: 3 }, 61)
      .to(el.stamper, { yPercent: 0, duration: 1, ease: 'power4.in' }, 64)
      .to(el.shadow, { autoAlpha: 0.9, scale: 1, duration: 1, ease: 'power4.in' }, 64)
      .set(el.target, { autoAlpha: 0 }, 65)
      .set([el.impression, el.splat], { autoAlpha: 1 }, 65)
      .to(el.stamper, { scaleY: 0.93, transformOrigin: '50% 100%', duration: 0.4, ease: 'power2.out' }, 65)
      .to(el.stamper, { scaleY: 1, yPercent: -460, duration: 4, ease: 'power2.in' }, 65.6)
      .to(el.shadow, { autoAlpha: 0, duration: 2 }, 65.6)
      // Colour blooms back into the grey world
      .to(greyed, { filter: 'grayscale(0) brightness(1) contrast(1)', duration: 9, ease: 'power1.inOut' }, 66)
      .to(el.wash, { autoAlpha: 1, duration: 9, ease: 'power1.inOut' }, 66)
      .to(el.scrim, { autoAlpha: 0.3, duration: 8 }, 67)
      .fromTo(el.book, { boxShadow: '0 30px 60px rgba(0,0,0,0.45), 0 0 0px rgba(242,182,50,0)' }, { boxShadow: '0 30px 60px rgba(0,0,0,0.45), 0 0 120px rgba(242,182,50,0.6)', duration: 6 }, 66);

    // 74-80: departure. Passport lifts away, the platform headline lands
    T.to(el.passport, { y: () => -innerHeight * 0.9, rotation: -8, duration: 5, ease: 'power2.in' }, 74)
      .fromTo(head2, { autoAlpha: 0, y: 70, rotation: tilt(8) }, { autoAlpha: 1, y: 0, rotation: tilt(2), duration: 2.5, stagger: 0.5, ease: 'power3.out' }, 75)
      .set({}, {}, TOTAL);

    master = T;
  }

  // One-shot impacts, fired the first time the scroll passes them
  const BEATS = [
    { at: 26, fn: () => sound('seal') },
    { at: 31, fn: () => sound('paper') },
    { at: 53, fn: () => stamps.award('window', () => sound('stamp')) },
    { at: 54.5, fn: () => sound('paper') },
    { at: 64.9, fn: thunk },
    { at: 70, fn: () => stamps.award('ticket', () => sound('stamp')) },
    { at: 79.2, fn: () => departure(false) },
  ];

  function thunk() {
    sound('punch');
    if (!el.splat.childElementCount) {
      const w = el.pageR.offsetWidth;
      for (let i = 0; i < 24; i++) {
        const d = document.createElement('i');
        const size = 2 + Math.random() * 5, a = Math.random() * Math.PI * 2, dist = w * (0.3 + Math.random() * 0.22);
        d.className = 'cl-drop';
        Object.assign(d.style, { left: '50%', top: '56%', width: `${size}px`, height: `${size}px` });
        el.splat.appendChild(d);
        gsap.fromTo(d, { x: 0, y: 0 }, { x: Math.cos(a) * dist, y: Math.sin(a) * dist * 0.66, duration: 0.3 + Math.random() * 0.3, ease: 'power3.out' });
      }
    }
    if (!RM) gsap.fromTo(el.cam, { x: -10, y: 7 }, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
  }

  // ---------- Input: scroll drives the playhead ----------
  const advance = (px) => {
    if (departing) return;
    target = Math.min(1, Math.max(0, target + px / (innerHeight * SCROLL_SCREENS)));
  };

  function tick() {
    if (!master || departing) return;
    const d = target - value;
    if (Math.abs(d) > 0.00002) {
      value += d * SMOOTH;
      master.progress(value);
    }
    const t = value * TOTAL;
    for (const b of BEATS) {
      if (!fired.has(b) && t >= b.at) { fired.add(b); b.fn(); }
    }
    if (value > 0.015 && !fired.has('cue')) { fired.add('cue'); gsap.to(el.cue, { autoAlpha: 0, duration: 0.6 }); }
  }

  // Stop-motion boil: every cutout shifts a hair 10 times a second
  const boilEls = qa('.cl-boil');
  let boilAcc = 0;
  function boil(time, dt) {
    boilAcc += dt;
    if (boilAcc < 100) return;
    boilAcc = 0;
    for (const b of boilEls) {
      b.style.transform = `translate(${((Math.random() - 0.5) * 2.4).toFixed(2)}px, ${((Math.random() - 0.5) * 2.4).toFixed(2)}px) rotate(${((Math.random() - 0.5) * 0.7).toFixed(2)}deg)`;
    }
  }

  function start() {
    gsap.set(root, { autoAlpha: 1 });
    master.progress(0);
    tl().fromTo(el.cam, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: 'power2.out' })
      .fromTo(el.cue, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 1.2);

    gsap.ticker.add(tick);
    if (!RM) gsap.ticker.add(boil);

    observer = Observer.create({
      target: root,
      type: 'wheel,touch',
      preventDefault: true,
      tolerance: 0,
      // Wheel down and swipe up both move forward
      onChangeY: (self) => advance(self.event.type === 'wheel' ? self.deltaY : -self.deltaY * 1.6),
    });

    on(window, 'keydown', (e) => {
      if (departing || document.querySelector('#menu.is-open')) return;
      if (e.target.closest && e.target.closest('button, a, input, textarea')) return;
      const step = innerHeight * 0.4;
      const map = { ArrowDown: step, ' ': step * 2, PageDown: step * 2, ArrowUp: -step, PageUp: -step * 2 };
      if (e.key in map) { e.preventDefault(); advance(map[e.key]); }
    });

    if (!RM) {
      const px = gsap.quickTo(el.pan, 'x', { duration: 1.4, ease: 'power3' });
      const py = gsap.quickTo(el.pan, 'y', { duration: 1.4, ease: 'power3' });
      on(window, 'pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        px((e.clientX / innerWidth - 0.5) * -24);
        py((e.clientY / innerHeight - 0.5) * -16);
      });
    }

    let rz = 0;
    on(window, 'resize', () => {
      clearTimeout(rz);
      rz = setTimeout(() => { if (master && !departing) { master.invalidate(); master.progress(value); } }, 150);
    });
  }

  function stopInput() {
    if (observer) { observer.kill(); observer = null; }
    gsap.ticker.remove(tick);
    gsap.ticker.remove(boil);
    listeners.forEach((f) => f());
    listeners = [];
  }

  // ---------- Departure: past the point of no return the train runs on its own ----------
  function departure(skipped) {
    if (cancelled || departing || finished) return;
    departing = true;
    stopInput();
    gsap.to(el.cue, { autoAlpha: 0, duration: 0.3 });
    if (skipped) {
      killTimers();
      gsap.set(root, { autoAlpha: 1 });
      runTrain();
      return;
    }
    sound('horn');
    timers.add(gsap.delayedCall(0.7, runTrain));
  }

  function imageTrain(coachImg, locoImg, vw, vh) {
    const ca = coachImg.naturalWidth / coachImg.naturalHeight, la = locoImg.naturalWidth / locoImg.naturalHeight;
    let h = vh * 1.15;
    if (h * ca < vw * 1.1) h = (vw * 1.1) / ca; // one coach must be wider than the screen
    const cw = h * ca, lw = h * la, wrap = document.createElement('div'), centres = [];
    wrap.className = 'cl-train';
    let x = 0;
    const car = (img, w) => {
      const c = img.cloneNode();
      c.className = 'cl-train__car';
      Object.assign(c.style, { left: `${x}px`, width: `${w}px`, height: `${h}px` });
      wrap.appendChild(c);
      x += w;
    };
    for (let i = 0; i < TRAIN.coaches; i++) { centres.push(x + cw / 2); car(coachImg, cw); }
    car(locoImg, lw);
    Object.assign(wrap.style, { width: `${x}px`, height: `${h}px`, top: `${(vh - h) / 2}px` });
    return { el: wrap, width: x, centres };
  }

  function svgTrain(vw, vh) {
    const art = trainSVG();
    const s = Math.max((vh * 1.25) / art.height, (vw * 1.1) / TRAIN.coach);
    const w = art.total * s, h = art.height * s, wrap = document.createElement('div');
    wrap.className = 'cl-train';
    wrap.innerHTML = art.svg;
    Object.assign(wrap.style, { width: `${w}px`, height: `${h}px`, top: `${(vh - h) / 2}px` });
    return { el: wrap, width: w, centres: art.centres.map((c) => c * s) };
  }

  async function runTrain() {
    if (cancelled) return;
    if (RM) {
      reveal();
      tl().to(root, { autoAlpha: 0, duration: 1.2, ease: 'power2.inOut', onComplete: finish });
      return;
    }
    const [coachImg, locoImg] = await trainImgs;
    if (cancelled) return;
    const vw = innerWidth, vh = innerHeight;
    const built = coachImg && locoImg ? imageTrain(coachImg, locoImg, vw, vh) : svgTrain(vw, vh);
    trainEl = built.el;
    root.appendChild(trainEl);

    // Swap scenes when the middle coach is centred: it covers the whole screen then
    const mid = built.centres[Math.floor(built.centres.length / 2)];
    const startX = -built.width, swapX = vw / 2 - mid, endX = vw;
    const v = (endX - startX) / TRAIN_PASS;
    sound('train');
    gsap.set(trainEl, { x: startX });
    timers.add(gsap.to(trainEl, { y: 3, duration: 0.06, yoyo: true, repeat: -1, ease: 'none' }));
    tl()
      .to(trainEl, { x: swapX, duration: (swapX - startX) / v, ease: 'none' })
      .add(swap)
      .to(trainEl, { x: endX, duration: (endX - swapX) / v, ease: 'none' })
      .add(finish);
  }

  function swap() {
    reveal();
    gsap.set([...root.children].filter((c) => c !== trainEl), { autoAlpha: 0 });
    root.classList.add('is-revealed');
  }

  function finish() {
    if (finished) return;
    finished = true;
    killTimers();
    stopInput();
    if (master) master.kill();
    gsap.set(root, { autoAlpha: 0 });
    if (trainEl) { trainEl.remove(); trainEl = null; }
    root.classList.remove('is-revealed');
    resolveDone();
  }

  return {
    done,
    // main.js Skip button: straight to the train
    skip() {
      if (cancelled || departing || finished) return;
      departure(true);
    },
    // main.js jumped to a chapter from the menu: stop everything
    cancel() {
      cancelled = true;
      killTimers();
      stopInput();
      if (master) master.kill();
      if (trainEl) { trainEl.remove(); trainEl = null; }
      root.classList.remove('is-revealed');
    },
  };
}
