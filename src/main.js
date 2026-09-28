import './style.css';
import Lenis from 'lenis';
import gsap from 'gsap';
import { World } from './scene.js';
import { CHAPTERS, INTRO_BIOME } from './chapters.js';
import { splitChars, revealChars, magnetic, drawPostcard } from './fx.js';

const $ = (s) => document.querySelector(s);
let world, lenis, introTl;
let current = 0, busy = false, started = false, entered = false, soundOn = false, storyIdx = -2;

// ---------- Sound (files are optional, missing files fail silently) ----------
const ambient = new Audio('/audio/ambient.mp3');
ambient.loop = true;
ambient.volume = 0;
const whoosh = new Audio('/audio/whoosh.mp3');
const vol = { v: 0 };

function setSound(on) {
  soundOn = on;
  $('#soundBtn').classList.toggle('is-muted', !on);
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
  world.setIntro(INTRO_BIOME);
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
  lenis.on('scroll', (l) => onScroll(l.progress));
}

function onScroll(p) {
  if (!started) return;
  world.progress = p;
  $('#nextCta').classList.toggle('is-visible', p > 0.97);
  $('#hint').classList.toggle('is-hidden', p > 0.04);
  const bar = document.querySelectorAll('.step i')[current];
  if (bar) bar.style.transform = `scaleX(${p})`;
  updateStory(p);
}

function setupUI() {
  document.querySelectorAll('.btn--magnetic').forEach((b) => magnetic(b));

  $('[data-sound="on"]').onclick = () => { setSound(true); openGate(); };
  $('[data-sound="off"]').onclick = () => { setSound(false); openGate(); };
  $('#start').onclick = startJourney;
  $('#skipIntro').onclick = () => arriveAtFirstStop(true);
  $('#soundBtn').onclick = () => setSound(!soundOn);
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

  // Route navigation: one bar per stop
  $('#steps').innerHTML = CHAPTERS.map((c, k) =>
    `<button class="step" title="${c.name}" aria-label="Stop ${k + 1}: ${c.name}"><i></i></button>`).join('');
  document.querySelectorAll('.step').forEach((s, k) => (s.onclick = () => goTo(k)));

  // Keep scrolling at the end of a stop to ride on to the next one
  let hold = 0;
  addEventListener('wheel', (e) => {
    if (!started || busy) return;
    if (lenis.progress > 0.995 && e.deltaY > 0) {
      hold += e.deltaY;
      if (hold > 350) { hold = 0; goTo(current + 1); }
    } else hold = 0;
  }, { passive: true });
}

// ---------- 2. Intro gate ----------
function openGate() {
  gsap.to('#loader', { autoAlpha: 0, duration: 1 });
  gsap.to('#soundBtn', { autoAlpha: 1, duration: 0.8, delay: 0.6 });
  gsap.set('#intro', { autoAlpha: 1 });
  gsap.timeline({ delay: 0.3 })
    .from('#intro .mosaic--top', { yPercent: -100, duration: 1, ease: 'expo.out' }, 0)
    .from('#intro .mosaic--bottom', { yPercent: 100, duration: 1, ease: 'expo.out' }, 0)
    .from('#intro .intro__card > *', { y: 40, autoAlpha: 0, stagger: 0.12, duration: 1.2, ease: 'expo.out' }, 0.2);
}

function startJourney() {
  $('#start').disabled = true;
  sfx();
  gsap.to('#intro', { autoAlpha: 0, scale: 1.08, filter: 'blur(14px)', duration: 1.2, ease: 'power3.in' });
  runIntro();
}

// ---------- 3. Train carriage intro (automatic) ----------
function runIntro() {
  const [c1, c2] = document.querySelectorAll('.caption');
  gsap.to(['#badge', '#trainIntro'], { autoAlpha: 1, duration: 1, delay: 0.8 });
  world.startIntro();
  introTl = gsap.timeline()
    .fromTo(c1, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out' }, 1.6)
    .to(c1, { autoAlpha: 0, y: -10, duration: 0.8 }, 5.2)
    .fromTo(c2, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out' }, 6)
    .add(() => world.arrive(), 8.2)
    .to(c2, { autoAlpha: 0, duration: 0.8 }, 9.6)
    .add(() => arriveAtFirstStop(false), 10.2);
}

// Push to the window, pass through a tunnel, arrive at stop 01
function arriveAtFirstStop(fast) {
  if (entered) return;
  entered = true;
  if (introTl) introTl.kill();
  sfx();
  gsap.to('#trainIntro', { autoAlpha: 0, duration: 0.5 });
  gsap.to('#badge', { autoAlpha: 1, duration: 0.5 });
  $('#tunnelText').textContent = `Stop 01 · ${CHAPTERS[0].name}`;

  const push = world.pushToWindow(fast ? 1 : 2.2);
  gsap.timeline()
    .to('#tunnel', { autoAlpha: 1, duration: fast ? 0.4 : 0.8, ease: 'power2.in' }, fast ? 0 : 1.4)
    .add(() => {
      push.progress(1);
      world.setChapter(0, CHAPTERS[0]);
      world.mode = 'chapter';
    })
    .to('#tunnel', { autoAlpha: 0, duration: 1, ease: 'power2.out' }, '+=0.5')
    .add(enterChapters, '-=0.6');
}

// ---------- 4. Stops ----------
function enterChapters() {
  started = true;
  document.body.classList.remove('is-locked');
  lenis.start();
  gsap.to('#ui', { autoAlpha: 1, duration: 1 });
  updateUI(0);
}

function updateUI(i) {
  const ch = CHAPTERS[i];
  $('#chapterNum').textContent = `Stop ${String(i + 1).padStart(2, '0')} / 10`;
  $('#chapterTag').textContent = ch.tagline;
  revealChars(splitChars($('#chapterTitle'), ch.name), 0.2);
  gsap.fromTo(['#chapterNum', '#chapterTag'], { autoAlpha: 0, y: 10 },
    { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.5, stagger: 0.1 });

  $('#nextCta span').textContent = i < CHAPTERS.length - 1 ? `Next stop: ${CHAPTERS[i + 1].name} →` : 'Unlock your gift →';
  document.querySelectorAll('.step').forEach((s, k) => {
    s.classList.toggle('is-active', k === i);
    s.querySelector('i').style.transform = `scaleX(${k < i ? 1 : 0})`;
  });
  $('#hint').classList.remove('is-hidden');
  storyIdx = -2;
  gsap.set('#story', { autoAlpha: 0 });
  updateStory(0);
}

// Story cards appear as the train moves through each stop
function updateStory(p) {
  let k = -1;
  for (let j = 0; j < 3; j++) {
    const start = 0.08 + j * 0.31;
    if (p >= start && p < start + 0.27) k = j;
  }
  if (k === storyIdx) return;
  storyIdx = k;
  const card = $('#story');
  gsap.to(card, {
    autoAlpha: 0, x: 20, duration: 0.3, overwrite: true,
    onComplete: () => {
      if (k < 0) return;
      const st = CHAPTERS[current].stories[k];
      card.querySelector('.story__num').textContent = `${String(k + 1).padStart(2, '0')} / 03`;
      card.querySelector('h3').textContent = st.title;
      card.querySelector('.story__text').textContent = st.text;
      gsap.to(card, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'expo.out' });
    },
  });
}

// Tunnel transition to another stop
function goTo(i, onCovered) {
  if (busy || i === current) return;
  busy = true;
  sfx();
  $('#tunnelText').textContent = i < CHAPTERS.length
    ? `Stop ${String(i + 1).padStart(2, '0')} · ${CHAPTERS[i].name}`
    : 'Journey complete';

  gsap.timeline({ onComplete: () => (busy = false) })
    .to('#tunnel', { autoAlpha: 1, duration: 0.6, ease: 'power2.in' })
    .add(() => {
      if (onCovered) onCovered();
      if (i >= CHAPTERS.length) { showGift(); return; }
      current = i;
      world.setChapter(i, CHAPTERS[i]);
      lenis.scrollTo(0, { immediate: true, force: true });
      updateUI(i);
    })
    .to('#tunnel', { autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, '+=0.5');
}

function showGift() {
  lenis.stop();
  gsap.set('#ui', { autoAlpha: 0 });
  gsap.set('#gift', { autoAlpha: 1 });
  gsap.from('#gift .intro__card > *', { y: 40, autoAlpha: 0, stagger: 0.12, duration: 1.2, ease: 'expo.out', delay: 0.6 });
}

init();
