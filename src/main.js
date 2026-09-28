import './style.css';
import Lenis from 'lenis';
import gsap from 'gsap';
import { World } from './scene.js';
import { CHAPTERS, HOTSPOT_POS } from './chapters.js';
import { splitChars, revealChars, magnetic, drawPostcard } from './fx.js';

const $ = (s) => document.querySelector(s);
let world, lenis, current = 0, busy = false, started = false, soundOn = false;

// ---------- Sound (files are optional, missing files fail silently) ----------
const ambient = new Audio('/audio/ambient.mp3');
ambient.loop = true;
ambient.volume = 0;
const whoosh = new Audio('/audio/whoosh.mp3');
const vol = { v: 0 };

function setSound(on) {
  soundOn = on;
  $('#soundToggle').classList.toggle('is-muted', !on);
  if (on) ambient.play().catch(() => {});
  gsap.to(vol, {
    v: on ? 0.4 : 0, duration: on ? 2 : 0.6, overwrite: true,
    onUpdate: () => (ambient.volume = vol.v),
    onComplete: () => !on && ambient.pause(),
  });
}

function sfx() {
  if (!soundOn) return;
  whoosh.currentTime = 0;
  whoosh.play().catch(() => {});
}

// ---------- 1. Loader ----------
async function init() {
  const pct = $('.loader__pct'), counter = { v: 0 };
  const draw = () => (pct.textContent = `${Math.round(counter.v)}%`);

  // Bouncing "loading" letters
  const letters = splitChars($('.loader__word'), 'loading', false);
  gsap.to(letters, { yPercent: -14, duration: 0.5, ease: 'sine.inOut', stagger: { each: 0.08, repeat: -1, yoyo: true } });

  const creep = gsap.to(counter, { v: 85, duration: 3, ease: 'power2.out', onUpdate: draw });

  await Promise.all([
    document.fonts.load('150px Shrikhand'),
    document.fonts.load('700 40px "Playfair Display"'),
    document.fonts.load('italic 34px "Playfair Display"'),
    document.fonts.load('500 22px Inter'),
    new Promise((r) => setTimeout(r, 1500)),
  ]);

  world = new World($('#webgl'));
  world.setChapter(0, CHAPTERS[0]);
  world.renderer.compile(world.scene, world.camera);
  gsap.ticker.add(() => world.tick());

  setupLenis();
  setupUI();

  creep.kill();
  gsap.to(counter, {
    v: 100, duration: 0.6, onUpdate: draw,
    onComplete: () => gsap.timeline()
      .to('.loader__center', { autoAlpha: 0, y: -30, duration: 0.8, ease: 'power3.in' })
      .fromTo('.loader__prompt', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' }),
  });
}

function setupLenis() {
  lenis = new Lenis({ lerp: 0.08 });
  lenis.stop();
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', (l) => {
    world.progress = l.progress;
    $('#nextCta').classList.toggle('is-visible', l.progress > 0.97);
    const bar = document.querySelectorAll('.step i')[current];
    if (bar) bar.style.transform = `scaleX(${l.progress})`;
  });
}

function setupUI() {
  document.querySelectorAll('.btn--magnetic').forEach((b) => magnetic(b));

  $('[data-sound="on"]').onclick = () => { setSound(true); openIntro(); };
  $('[data-sound="off"]').onclick = () => { setSound(false); openIntro(); };
  $('#skip').onclick = () => { hideLoader(); world.skipIntro(); enterChapters(); };
  $('#start').onclick = startJourney;
  $('#soundToggle').onclick = () => setSound(!soundOn);
  $('#nextCta').onclick = () => goTo(current + 1);

  $('#download').onclick = () => {
    const a = document.createElement('a');
    a.download = 'wanderwords-postcard.png';
    a.href = drawPostcard(CHAPTERS).toDataURL('image/png');
    a.click();
  };
  $('#restart').onclick = () => goTo(0, () => {
    gsap.set('#gift', { autoAlpha: 0 });
    gsap.set('#ui', { autoAlpha: 1 });
    lenis.start();
  });

  // Bottom step navigation
  $('#steps').innerHTML = CHAPTERS.map((c, k) =>
    `<button class="step" title="${c.name}" aria-label="Chapter ${k + 1}: ${c.name}"><i></i></button>`).join('');
  document.querySelectorAll('.step').forEach((s, k) => (s.onclick = () => goTo(k)));

  // Mosaic curtain tiles
  const colors = ['#E08E2B', '#B5523B', '#F2B632', '#1F6F6B', '#2E3A6B', '#F3E6CC'];
  $('#curtain').innerHTML = Array.from({ length: 10 },
    (_, k) => `<div style="background:${colors[k % colors.length]}"></div>`).join('');

  // Keep scrolling at the end of a chapter to go to the next one
  let hold = 0;
  addEventListener('wheel', (e) => {
    if (!started || busy) return;
    if (lenis.progress > 0.995 && e.deltaY > 0) {
      hold += e.deltaY;
      if (hold > 350) { hold = 0; goTo(current + 1); }
    } else hold = 0;
  }, { passive: true });
}

function hideLoader() {
  gsap.to('#loader', { autoAlpha: 0, duration: 1 });
}

// ---------- 2. Intro gate ----------
function openIntro() {
  hideLoader();
  gsap.set('#intro', { autoAlpha: 1 });
  gsap.timeline({ delay: 0.3 })
    .from('#intro .mosaic--top', { yPercent: -100, duration: 1, ease: 'expo.out' }, 0)
    .from('#intro .mosaic--bottom', { yPercent: 100, duration: 1, ease: 'expo.out' }, 0)
    .from('#intro .intro__card > *', { y: 40, autoAlpha: 0, stagger: 0.12, duration: 1.2, ease: 'expo.out' }, 0.2);
}

function startJourney() {
  $('#start').disabled = true;
  sfx();
  gsap.to('#intro', { autoAlpha: 0, scale: 1.12, filter: 'blur(14px)', duration: 1.4, ease: 'power3.in' });
  world.dollyIn().then(enterChapters);
}

// ---------- 3. Chapters ----------
function enterChapters() {
  started = true;
  document.body.classList.remove('is-locked');
  lenis.start();
  gsap.to('#ui', { autoAlpha: 1, duration: 1 });
  updateUI(0);
}

function updateUI(i) {
  const ch = CHAPTERS[i];
  $('#chapterNum').textContent = `Chapter ${String(i + 1).padStart(2, '0')} / 10`;
  $('#chapterTag').textContent = ch.tagline;
  revealChars(splitChars($('#chapterTitle'), ch.name), 0.2);
  gsap.fromTo(['#chapterNum', '#chapterTag'], { autoAlpha: 0, y: 10 },
    { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.5, stagger: 0.1 });

  $('#nextCta span').textContent = i < CHAPTERS.length - 1 ? `Next: ${CHAPTERS[i + 1].name} →` : 'Unlock your gift →';
  document.querySelectorAll('.step').forEach((s, k) => {
    s.classList.toggle('is-active', k === i);
    s.querySelector('i').style.transform = `scaleX(${k < i ? 1 : 0})`;
  });
  buildHotspots(ch);
}

function buildHotspots(ch) {
  const root = $('#hotspots');
  root.innerHTML = '';
  const items = ch.hotspots.map((h, k) => {
    const el = document.createElement('button');
    el.className = 'hotspot is-hidden';
    el.innerHTML = `<span class="hotspot__dot"></span>
      <span class="hotspot__card"><strong>${h.title}</strong><span>${h.text}</span></span>`;
    const bounce = () => {
      gsap.fromTo(el.querySelector('.hotspot__dot'), { scale: 1.6 }, { scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.3)' });
      if (k === 2) world.glint();
    };
    el.addEventListener('mouseenter', bounce);
    el.addEventListener('click', () => { el.classList.toggle('is-open'); bounce(); }); // touch support
    root.appendChild(el);
    return { el, pos: HOTSPOT_POS[k] };
  });
  world.setHotspots(items);
}

function goTo(i, onCovered) {
  if (busy || i === current) return;
  busy = true;
  sfx();
  const tiles = $('#curtain').children;
  const from = i >= current ? 'start' : 'end';

  gsap.timeline({ onComplete: () => (busy = false) })
    .set(tiles, { transformOrigin: '50% 100%' })
    .to(tiles, { scaleY: 1, duration: 0.7, ease: 'expo.inOut', stagger: { each: 0.05, from } })
    .add(() => {
      if (onCovered) onCovered();
      if (i >= CHAPTERS.length) { showGift(); return; }
      current = i;
      world.setChapter(i, CHAPTERS[i]);
      lenis.scrollTo(0, { immediate: true, force: true });
      updateUI(i);
    })
    .set(tiles, { transformOrigin: '50% 0%' })
    .to(tiles, { scaleY: 0, duration: 0.8, ease: 'expo.inOut', stagger: { each: 0.05, from } }, '+=0.2');
}

function showGift() {
  lenis.stop();
  gsap.set('#ui', { autoAlpha: 0 });
  gsap.set('#gift', { autoAlpha: 1 });
  gsap.from('#gift .intro__card > *', { y: 40, autoAlpha: 0, stagger: 0.12, duration: 1.2, ease: 'expo.out', delay: 0.6 });
}

init();
