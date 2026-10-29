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
import React from 'react';
import { createRoot } from 'react-dom/client';
import { GreetingPreloader, TravelerAuthModal } from './components/ui';

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
  if (p === 'entering' || p === 'destination') {
    gsap.set('#intro', { autoAlpha: 0 });
  }
  lastPhase = p;
});
journey.on('stop', (i) => {
  const badge = $('#badgeNum');
  if (badge) badge.textContent = `${i + 1}/${CHAPTERS.length}`;
  sfx();
});

// ---------- Passenger Auth Modal (React) ----------
let authRoot = null;
const authState = {
  isOpen: false,
  initialMode: 'signup',
};

function renderAuthModal() {
  const container = document.getElementById('auth-root');
  if (!container) return;
  if (!authRoot) {
    authRoot = createRoot(container);
  }
  authRoot.render(
    React.createElement(TravelerAuthModal, {
      isOpen: authState.isOpen,
      initialMode: authState.initialMode,
      onClose: () => {
        authState.isOpen = false;
        renderAuthModal();
      },
      onSuccess: (passenger) => {
        updatePassengerUI(passenger);
      },
      onStartJourney: () => {
        authState.isOpen = false;
        renderAuthModal();
        if (journey.phase === 'cover') {
          startJourney();
        }
      },
    })
  );
}

function openAuth(mode = 'signup') {
  authState.isOpen = true;
  authState.initialMode = mode;
  renderAuthModal();
}

function updatePassengerUI(passenger) {
  const btn = $('#authBtn');
  const btnText = $('#authBtnText');
  const menuText = $('#menuAuthText');
  if (!btn) return;
  if (passenger && passenger.name) {
    btn.classList.add('is-signed-in');
    const firstName = passenger.name.split(' ')[0].toUpperCase();
    if (btnText) btnText.textContent = `PASS: ${firstName} ↗`;
    if (menuText) menuText.textContent = `Passenger: ${passenger.name} (${passenger.travelClass}) ↗`;
  } else {
    btn.classList.remove('is-signed-in');
    if (btnText) btnText.textContent = 'PASSENGER LOG';
    if (menuText) menuText.textContent = 'Passenger Boarding Pass ↗';
  }
}

// ---------- 1. Greeting Preloader (React) ----------
async function init() {
  await Promise.all([
    document.fonts.load('700 40px "Playfair Display"'),
    document.fonts.load('italic 34px "Playfair Display"'),
    document.fonts.load('500 22px Inter'),
    document.fonts.load('700 22px Inter'),
    document.fonts.load('600 24px Caveat'),
  ]);

  gsap.ticker.lagSmoothing(0);
  train.prepare();
  setupUI();
  renderAuthModal();

  const preloaderContainer = document.getElementById('preloader-root');
  if (preloaderContainer) {
    const root = createRoot(preloaderContainer);
    root.render(
      React.createElement(GreetingPreloader, {
        fullPage: true,
        intervalMs: 650,
        onFinish: () => {
          openGate();
        },
      })
    );
  } else {
    openGate();
  }
}

function setupUI() {
  $$('.btn--magnetic').forEach((b) => magnetic(b));

  const soundOnBtn = $('[data-sound="on"]');
  if (soundOnBtn) soundOnBtn.onclick = () => { setSound(true); openGate(); };
  const soundOffBtn = $('[data-sound="off"]');
  if (soundOffBtn) soundOffBtn.onclick = () => { setSound(false); openGate(); };

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

  // Auth buttons
  const authBtn = $('#authBtn');
  if (authBtn) authBtn.onclick = () => openAuth('signin');
  const introAuthBtn = $('#introAuthBtn');
  if (introAuthBtn) introAuthBtn.onclick = () => openAuth('signin');
  const menuAuthBtn = $('#menuAuthBtn');
  if (menuAuthBtn) menuAuthBtn.onclick = () => { toggleMenu(false); openAuth('signin'); };

  // Listen for passenger updates
  window.addEventListener('wanderwords:passenger_updated', (e) => {
    updatePassengerUI(e.detail);
  });

  // Check initial localStorage
  try {
    const saved = localStorage.getItem('wanderwords_passenger');
    if (saved) updatePassengerUI(JSON.parse(saved));
  } catch {}

  // Index: every stop is one click away
  $('#menu .menu__body').innerHTML = renderMenu(CHAPTERS, CREDITS);
  $$('[data-go]').forEach((b) => (b.onclick = () => { toggleMenu(false); journey.goToStop(+b.dataset.go); }));
  const renderedMenuAuthBtn = $('#menuAuthBtn');
  if (renderedMenuAuthBtn) renderedMenuAuthBtn.onclick = () => { toggleMenu(false); openAuth('signin'); };

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleMenu(false);
  });
}

// ---------- 2. Cover gate ----------
function openGate() {
  gsap.to('.ctrl', { autoAlpha: 1, duration: 0.8, delay: 0.1, stagger: 0.08 });
  journey.openGate();

  // A link straight to a destination (/stop/goa) skips the cover and the train
  const deep = journey.stopFromUrl();
  if (deep >= 0) {
    gsap.set('#intro', { autoAlpha: 0 });
    journey.goToStop(deep);
    return;
  }

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
