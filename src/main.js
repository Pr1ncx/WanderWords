// Boot and wiring. The experience is two separate layers connected by one state machine:
//
//   TrainCanvas          src/train/TrainCanvas.js                    the journey (the train video)
//   DestinationEditorial src/destination/DestinationEditorial.js     a destination (HTML page)
//   journey              src/journey.js                              which layer is on screen, and the URL
//
// This file only builds them, connects them, and runs the loader, cover, menu and finale.
import './style.css';
import './grain.css';
import './editorial.css';
import gsap from 'gsap';
import { CHAPTERS } from './chapters.js';
import { CREDITS } from './credits.js';
import { placeholderURL } from './media.js';
import { renderMenu } from './ui.js';
import { splitChars, magnetic, drawPostcard } from './fx.js';
import { TrainCanvas } from './train/TrainCanvas.js';
import { DestinationEditorial } from './destination/DestinationEditorial.js';
import { createJourney } from './journey.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const S = { soundOn: false, cc: false, ccText: '' };

// ---------- Missing media: swap in a painted placeholder ----------
document.addEventListener('error', (e) => {
  const el = e.target;
  if (!el || !el.dataset || !el.dataset.ph || el.dataset.failed) return;
  el.dataset.failed = '1';
  const url = placeholderURL(el.dataset.ph, el.getAttribute('src'), el.dataset.accent);
  if (el.tagName === 'IMG') el.src = url;
}, true);

// ---------- Sound (optional files, missing files fail silently) ----------
const ambient = new Audio('/audio/ambient.mp3');
ambient.loop = true;
ambient.volume = 0;
const whoosh = new Audio('/audio/whoosh.mp3');
const vol = { v: 0 };

function setSound(on) {
  S.soundOn = on;
  $('#soundBtn').classList.toggle('is-muted', !on);
  if (on) ambient.play().catch(() => {});
  gsap.to(vol, {
    v: on ? 0.4 : 0, duration: on ? 2 : 0.6, overwrite: true,
    onUpdate: () => (ambient.volume = vol.v),
    onComplete: () => !on && ambient.pause(),
  });
}

function sfx() {
  if (!S.soundOn) return;
  whoosh.currentTime = 0;
  whoosh.play().catch(() => {});
}

// ---------- Captions (CC) for the train narration ----------
function cc(text) {
  S.ccText = text || '';
  refreshCC();
}
function refreshCC() {
  const el = $('#cc');
  el.textContent = S.ccText;
  el.classList.toggle('is-on', S.cc && !!S.ccText);
}

// ---------- The two layers and the journey that connects them ----------
const train = new TrainCanvas({
  container: $('#trainContainer'),
  video: $('#trainVideo'),
  overlay: $('#trainOverlay'),
  captionEl: $('#trainCaption'),
  skipBtn: $('#skipBtn'),
  onCaption: cc,
});
const editorial = new DestinationEditorial({ root: $('#destination'), chapters: CHAPTERS, onNext: () => journey.nextStop() });
const journey = createJourney({ chapters: CHAPTERS, train, editorial });
document.body.dataset.phase = journey.phase;

let lastPhase = '';
journey.on('phase', (p) => {
  if (p === 'finale') showGift();
  else if (lastPhase === 'finale') hideGift();
  lastPhase = p;
});
journey.on('stop', (i) => {
  const badge = $('#badgeNum');
  if (badge) badge.textContent = `${i + 1}/${CHAPTERS.length}`;
  sfx();
});

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
    document.fonts.load('700 22px Inter'),
    new Promise((r) => setTimeout(r, 1500)),
  ]);

  gsap.ticker.lagSmoothing(0);
  train.prepare();
  setupUI();
  creep.kill();
  gsap.to(counter, {
    v: 100, duration: 0.6, onUpdate: draw,
    onComplete: () => gsap.timeline()
      .to('.loader__center', { autoAlpha: 0, y: -30, duration: 0.8, ease: 'power3.in' })
      .fromTo('.loader__prompt', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' }),
  });
}

function setupUI() {
  $$('.btn--magnetic').forEach((b) => magnetic(b));

  $('[data-sound="on"]').onclick = () => { setSound(true); openGate(); };
  $('[data-sound="off"]').onclick = () => { setSound(false); openGate(); };
  $('#start').onclick = startJourney;
  $('#skipBtn').onclick = () => journey.skip();
  $('#soundBtn').onclick = () => setSound(!S.soundOn);
  $('#ccBtn').onclick = () => { S.cc = !S.cc; $('#ccBtn').classList.toggle('is-active', S.cc); refreshCC(); };
  $('#menuBtn').onclick = () => toggleMenu();
  $('#menuClose').onclick = () => toggleMenu(false);
  $('#download').onclick = () => {
    const a = document.createElement('a');
    a.download = 'wanderwords-postcard.png';
    a.href = drawPostcard(CHAPTERS).toDataURL('image/png');
    a.click();
  };
  $('#restart').onclick = () => journey.restart();

  // Index: every stop is one click away
  $('#menu .menu__body').innerHTML = renderMenu(CHAPTERS, CREDITS);
  $$('[data-go]').forEach((b) => (b.onclick = () => { toggleMenu(false); journey.goToStop(+b.dataset.go); }));

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleMenu(false);
  });
}

// ---------- 2. Cover gate ----------
function openGate() {
  gsap.to('#loader', { autoAlpha: 0, duration: 1 });
  gsap.to('.ctrl', { autoAlpha: 1, duration: 0.8, delay: 0.6, stagger: 0.08 });
  journey.openGate();

  // A link straight to a destination (/stop/goa) skips the cover and the train
  const deep = journey.stopFromUrl();
  if (deep >= 0) { journey.goToStop(deep); return; }

  gsap.set('#intro', { autoAlpha: 1 });
  gsap.timeline({ delay: 0.3 })
    .from('#intro .mosaic--top', { yPercent: -100, duration: 1, ease: 'expo.out' }, 0)
    .from('#intro .mosaic--bottom', { yPercent: 100, duration: 1, ease: 'expo.out' }, 0)
    .from('#intro .intro__card > *', { y: 40, autoAlpha: 0, stagger: 0.12, duration: 1.2, ease: 'expo.out' }, 0.2);
}

function startJourney() {
  $('#start').disabled = true;
  sfx();
  gsap.to('#intro', { autoAlpha: 0, scale: 1.04, duration: 1, ease: 'power2.inOut' }); // no blur filter: very costly full-screen
  journey.begin();
}

// ---------- Index menu ----------
function toggleMenu(force) {
  const menu = $('#menu');
  const isOpen = menu.classList.contains('is-open');
  const open = force === undefined ? !isOpen : force;
  if (open === isOpen) return;
  menu.classList.toggle('is-open', open);
  $('#menuBtn').classList.toggle('is-active', open);
  gsap.to(menu, { autoAlpha: open ? 1 : 0, duration: 0.45 });
}

// ---------- Finale ----------
function showGift() {
  cc('');
  gsap.set('#gift', { autoAlpha: 1 });
  gsap.from('#gift .intro__card > *', { y: 40, autoAlpha: 0, stagger: 0.12, duration: 1.2, ease: 'expo.out' });
}

function hideGift() {
  gsap.to('#gift', { autoAlpha: 0, duration: 0.5 });
}

init();
