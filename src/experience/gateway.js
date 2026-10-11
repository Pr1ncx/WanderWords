// The front door: a typographic gateway that doubles as the preloader.
// Flow: preload (000 to 100) -> Enter becomes available -> click unlocks audio,
// fades the DOM layer out and the WebGL canvas in.
import gsap from 'gsap';
import * as THREE from 'three';
import { Engine } from '../engine.js';
import { audio } from '../audio.js';
import { preload, loadFonts, loadImages, wait } from './preload.js';
import { prefersReducedMotion } from '../support.js';
import { navigate } from '../nav.js';
import DESTINATIONS from '../data/destinations.json';
import '../styles/gateway.css';

const MIN_LOAD_MS = 800; // so the counter is never just a flash
const chapter1 = DESTINATIONS[0];

// Thin-line icons, 1.5px stroke
const svg = (inner) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const ICON_SPEAKER = svg('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/>');
// A dial: ring, four hour ticks and a hand (not a door)
const ICON_DIAL = svg('<circle cx="12" cy="12" r="9"/><path d="M12 3v2M21 12h-2M12 21v-2M3 12h2"/><path d="M12 12l4-4"/>');

const pad3 = (n) => String(Math.round(n)).padStart(3, '0');

const template = () => `
<div class="exp">
  <canvas class="exp__canvas" aria-hidden="true"></canvas>

  <!-- UI overlay (z-index 10). M1 holds only the essentials: wordmark, sound toggle, Reader Mode. -->
  <section class="exp__ui" aria-label="WanderWords">
    <div class="exp-bar">
      <p class="exp-wordmark">WanderWords</p>
      <div class="exp-tools">
        <button class="link-btn" type="button" data-mute></button>
        <a class="link-btn" href="/read" data-link>Reader mode</a>
      </div>
    </div>
    <h1 class="sr-only" tabindex="-1" data-uititle>WanderWords. Every place has one hour.</h1>
    <p class="exp-note"><mark class="ph">[[M1]] The canvas is live. The gallery of plates arrives in M2.</mark></p>
    <span></span>
  </section>

  <!-- The gateway (z-index 20) -->
  <section class="gate" aria-label="Welcome">
    <div class="gate__top">
      <p class="gate__presents">WanderWords presents</p>
      <a class="gate__reader link-btn" href="/read" data-link>Reader mode</a>
      <p class="gate__count" aria-hidden="true">000</p>
    </div>

    <h1 class="gate__stack" aria-label="Every place has one hour">
      <span class="gate__line gate__line--1" aria-hidden="true">Every</span>
      <span class="gate__line gate__line--2" aria-hidden="true">Place</span>
      <span class="gate__line gate__line--3" aria-hidden="true">Has</span>
      <span class="gate__line gate__line--4" aria-hidden="true">One</span>
      <span class="gate__hour" aria-hidden="true"><span>H</span><span>O</span><span>U</span><span>R</span></span>
    </h1>

    <div class="gate__bottom">
      <p class="gate__sound">${ICON_SPEAKER}<span>Turn on your sound for the full experience.</span></p>
      <button class="gate__enter" type="button" disabled aria-label="Loading">
        <span class="gate__enter-icon">${ICON_DIAL}</span>
        <span class="gate__enter-label" data-slot>000%</span>
      </button>
    </div>

    <p class="sr-only" role="status" data-status>Loading.</p>
  </section>
</div>`;

// A faint, slowly turning ring: proves the canvas is live and hints at the dial to come
function addDialRing(engine, reduced) {
  const points = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0));
  }
  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0xf2ebdd, transparent: true, opacity: 0.25 }),
  );
  engine.scene.add(ring);
  if (!reduced) engine.onUpdate((dt) => { ring.rotation.z += dt * 0.05; });
}

// The Enter button is gently pulled toward the cursor when it is near
function magnet(button, reduced) {
  if (reduced || !window.matchMedia('(hover: hover)').matches) return () => {};
  const xTo = gsap.quickTo(button, 'x', { duration: 0.5, ease: 'power3.out' });
  const yTo = gsap.quickTo(button, 'y', { duration: 0.5, ease: 'power3.out' });
  const move = (e) => {
    const r = button.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    if (!button.disabled && Math.hypot(dx, dy) < 150) { xTo(dx * 0.25); yTo(dy * 0.25); }
    else { xTo(0); yTo(0); }
  };
  window.addEventListener('pointermove', move);
  return () => window.removeEventListener('pointermove', move);
}

export function mountExperience(root) {
  root.innerHTML = template();
  const $ = (s) => root.querySelector(s);
  const el = {
    gate: $('.gate'), canvas: $('.exp__canvas'), ui: $('.exp__ui'), uiTitle: $('[data-uititle]'),
    count: $('.gate__count'), enter: $('.gate__enter'), label: $('[data-slot]'), status: $('[data-status]'),
    mute: $('[data-mute]'),
    parts: root.querySelectorAll('.gate__line, .gate__hour'),
    edges: root.querySelectorAll('.gate__top > *, .gate__bottom > *'),
  };
  const reduced = prefersReducedMotion();
  let engine = null;
  let ready = false, entered = false, dead = false;
  const cleanups = [];

  // Canvas and UI overlay start hidden; the gateway covers everything
  gsap.set([el.canvas, el.ui], { autoAlpha: 0 });

  // Sound toggle: label and state follow the audio bus
  const syncMute = () => {
    el.mute.textContent = audio.muted ? 'Sound off' : 'Sound on';
    el.mute.setAttribute('aria-pressed', String(!audio.muted));
  };
  syncMute();
  el.mute.addEventListener('click', () => {
    audio.unlock();
    audio.setMuted(!audio.muted);
    syncMute();
  });

  // ---- Preloader: counter 000 -> 100 in the gateway and in the button slot ----
  const shown = { v: 0 };
  const paint = () => {
    const n = pad3(shown.v);
    el.count.textContent = n;
    if (!ready) el.label.textContent = `${n}%`;
  };
  let lastAnnounced = 0;
  const setProgress = (p) => {
    const pct = p * 100;
    if (pct >= lastAnnounced + 25 && p < 1) { // screen readers hear 25, 50, 75 only
      lastAnnounced = Math.floor(pct / 25) * 25;
      el.status.textContent = `Loading, ${lastAnnounced} percent.`;
    }
    gsap.to(shown, {
      v: pct, duration: reduced ? 0 : 0.5, ease: 'power1.out', overwrite: true,
      onUpdate: paint,
      onComplete: () => { paint(); if (p >= 1) becomeReady(); },
    });
  };

  function becomeReady() {
    if (ready || dead) return;
    ready = true;
    el.enter.disabled = false;
    el.enter.removeAttribute('aria-label');
    el.label.textContent = 'Enter';
    el.status.textContent = 'Ready. Activate the Enter button to begin.';
    gsap.to(el.count, { autoAlpha: 0, duration: reduced ? 0 : 0.8 });
    el.enter.focus({ preventScroll: true });
  }

  // Gateway type arrives in a stagger
  if (!reduced) {
    gsap.from(el.parts, { yPercent: 40, autoAlpha: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' });
    gsap.from(el.edges, { autoAlpha: 0, duration: 1, delay: 0.5, ease: 'power2.out' });
  }

  const tasks = [
    { weight: 3, optional: true, run: (report) => loadFonts(report) },
    { weight: 4, optional: true, run: (report) => loadImages([chapter1.photo.src, chapter1.photo.depth], report) },
    {
      weight: 3,
      run: async (report) => {
        engine = new Engine(el.canvas); // throws if WebGL fails
        if (dead) { engine.dispose(); engine = null; return; }
        addDialRing(engine, reduced);
        engine.renderOnce(); // compile now, so the reveal does not stutter
        report(1);
      },
    },
  ];

  Promise.all([preload(tasks, (p) => setProgress(Math.min(p, 0.99))), wait(MIN_LOAD_MS)])
    .then(() => { if (!dead) setProgress(1); })
    .catch((err) => {
      console.error('Immersive mode failed, opening Reader Mode:', err);
      if (!dead) navigate('/read', true);
    });

  cleanups.push(magnet(el.enter, reduced));

  // ---- Enter: unlock audio, fade the DOM out, fade the canvas in ----
  function enter() {
    if (!ready || entered || dead) return;
    entered = true;
    el.enter.disabled = true;
    el.gate.style.pointerEvents = 'none'; // the old layer can no longer be clicked

    audio.unlock(); // must run inside this click: browsers only allow audio after a gesture
    audio.chime();
    syncMute();
    engine.start();

    const tl = gsap.timeline({
      onComplete: () => {
        el.gate.setAttribute('inert', '');
        gsap.set(el.gate, { display: 'none' });
        el.uiTitle.focus({ preventScroll: true });
      },
    });
    if (reduced) {
      // Reduced motion: plain crossfade, no movement
      tl.to(el.gate, { autoAlpha: 0, duration: 0.4, ease: 'none' }, 0)
        .to(el.canvas, { autoAlpha: 1, duration: 0.4, ease: 'none' }, 0)
        .to(el.ui, { autoAlpha: 1, duration: 0.4, ease: 'none' }, 0.2);
    } else {
      tl.to(el.parts, { yPercent: -30, autoAlpha: 0, duration: 0.7, stagger: 0.06, ease: 'power2.in' }, 0)
        .to(el.gate, { autoAlpha: 0, duration: 1, ease: 'power2.inOut' }, 0.15) // the ~1s DOM fade
        .to(el.canvas, { autoAlpha: 1, duration: 1, ease: 'power2.inOut' }, 0.5)
        .to(el.ui, { autoAlpha: 1, duration: 0.9, ease: 'power2.out' }, 1.1);
    }
  }
  el.enter.addEventListener('click', enter);

  return {
    unmount() {
      dead = true;
      cleanups.forEach((fn) => fn());
      gsap.killTweensOf([el.gate, el.canvas, el.ui, el.count, el.enter, shown, ...el.parts, ...el.edges]);
      if (engine) engine.dispose();
      root.innerHTML = '';
    },
  };
}
