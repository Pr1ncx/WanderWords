import './style.css';
import Lenis from 'lenis';
import gsap from 'gsap';
import { Engine } from './engine.js';
import { Train } from './train.js';
import { Room } from './room.js';
import { CHAPTERS, INTRO_BIOME } from './chapters.js';
import { CREDITS } from './credits.js';
import { videoSource, placeholderURL } from './media.js';
import { renderArticle, renderLightbox, renderMenu, pad } from './ui.js';
import { splitChars, magnetic, drawPostcard } from './fx.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// phase: loader | gate | intro | ride | title | moving | explore | gift
const S = { phase: 'loader', current: 0, target: 0, busy: false, arriving: false, soundOn: false, cc: false, ccText: '', exhibit: -2, overlay: null, lb: 0 };
let engine, train, room, lenis, windowMedia, introTl, rideTl;

// ---------- Missing media: swap in a painted placeholder ----------
document.addEventListener('error', (e) => {
  const el = e.target;
  if (!el || !el.dataset || !el.dataset.ph || el.dataset.failed) return;
  el.dataset.failed = '1';
  const url = placeholderURL(el.dataset.ph, el.getAttribute('src'), el.dataset.accent);
  if (el.tagName === 'IMG') el.src = url;
  else if (el.tagName === 'VIDEO') {
    const im = document.createElement('img');
    im.className = el.className;
    im.alt = el.dataset.ph;
    im.src = url;
    el.replaceWith(im);
  }
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

// ---------- Captions (CC) ----------
function cc(text) {
  S.ccText = text || '';
  refreshCC();
}
function refreshCC() {
  const el = $('#cc');
  el.textContent = S.ccText;
  el.classList.toggle('is-on', S.cc && !!S.ccText);
}

function lockScroll() {
  lenis.stop();
  document.body.classList.add('is-locked');
}
function unlockScroll() {
  document.body.classList.remove('is-locked');
  lenis.start();
}

function splitTitle(el, text) {
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(' ').map((w) =>
    `<span class="word" aria-hidden="true">${[...w].map((c) => `<span class="char">${c}</span>`).join('')}</span>`).join(' ');
  return el.querySelectorAll('.char');
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
    document.fonts.load('700 22px Inter'),
    new Promise((r) => setTimeout(r, 1500)),
  ]);

  engine = new Engine($('#webgl'));
  train = new Train(engine.env);
  train.setBiome(INTRO_BIOME);
  train.showJournal(CHAPTERS[0], 0);
  engine.setView(train);
  engine.renderer.compile(train.scene, train.camera);
  gsap.ticker.add(() => engine.tick());

  lenis = new Lenis({ lerp: 0.08 });
  lenis.stop();
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', (l) => onScroll(l.progress));

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
  $('#skipBtn').onclick = skip;
  $('#soundBtn').onclick = () => setSound(!S.soundOn);
  $('#ccBtn').onclick = () => { S.cc = !S.cc; $('#ccBtn').classList.toggle('is-active', S.cc); refreshCC(); };
  $('#replayBtn').onclick = replay;
  $('#menuBtn').onclick = () => toggleMenu();
  $('#menuClose').onclick = () => toggleMenu(false);
  $('#exploreBtn').onclick = explore;
  $('#viewBtn').onclick = () => openLightbox(S.exhibit);
  $('#readBtn').onclick = openArticle;
  $('#nextBtn').onclick = () => (S.current < CHAPTERS.length - 1 ? rideTo(S.current + 1) : finish());
  $('#articleClose').onclick = closeOverlay;
  $('#lbClose').onclick = closeOverlay;
  $('#lbPrev').onclick = () => openLightbox((S.lb + 4) % 5);
  $('#lbNext').onclick = () => openLightbox((S.lb + 1) % 5);
  $('#download').onclick = () => {
    const a = document.createElement('a');
    a.download = 'wanderwords-postcard.png';
    a.href = drawPostcard(CHAPTERS).toDataURL('image/png');
    a.click();
  };
  $('#restart').onclick = () => rideTo(0);

  // Menu: chapter index + credits
  $('#menu .menu__body').innerHTML = renderMenu(CHAPTERS, CREDITS);
  $$('[data-go]').forEach((b) => (b.onclick = () => { toggleMenu(false); goToChapter(+b.dataset.go); }));

  // Exhibit progress dots
  $('#dots').innerHTML = Array.from({ length: 5 }, () => '<i></i>').join('');

  // Click photos and the hero video in 3D
  const canvas = $('#webgl');
  canvas.addEventListener('click', () => {
    if (S.phase !== 'explore' || S.overlay || !room) return;
    const k = room.pick(engine.ndc);
    if (k >= 0) openLightbox(k);
  });
  canvas.addEventListener('pointermove', () => {
    if (S.phase !== 'explore' || !room) { canvas.style.cursor = ''; return; }
    canvas.style.cursor = room.pick(engine.ndc) >= 0 ? 'pointer' : '';
  });
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (S.overlay) closeOverlay();
    else toggleMenu(false);
  });
}

// ---------- 2. Cover gate ----------
function openGate() {
  S.phase = 'gate';
  gsap.to('#loader', { autoAlpha: 0, duration: 1 });
  gsap.to('.ctrl', { autoAlpha: 1, duration: 0.8, delay: 0.6, stagger: 0.08 });
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

// ---------- 3. Train intro (automatic) ----------
function caption(text) {
  const el = $('#trainCaption');
  gsap.to(el, {
    autoAlpha: 0, y: -8, duration: 0.4, overwrite: true,
    onComplete: () => {
      el.textContent = text;
      if (text) gsap.fromTo(el, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out' });
    },
  });
  cc(text);
}

function runIntro() {
  S.phase = 'intro';
  $('#skipBtn').textContent = 'SKIP INTRO >';
  gsap.to('#trainOverlay', { autoAlpha: 1, duration: 1, delay: 0.6 });
  train.run(16, 3);
  introTl = gsap.timeline()
    .add(() => caption('A journey, ten stops.'), 1.6)
    .add(() => caption(''), 5.2)
    .add(() => rideTo(0, true), 6);
}

// ---------- Train ride to a stop: real video in the window ----------
function rideTo(i, fromIntro = false) {
  if (S.busy && !fromIntro) return;
  S.busy = true;
  S.phase = 'ride';
  S.target = i;
  const ch = CHAPTERS[i];
  closeOverlay(true);
  lockScroll();
  sfx();

  rideTl = gsap.timeline();
  if (!fromIntro) {
    $('#tunnelText').textContent = 'All aboard';
    rideTl.to('#tunnel', { autoAlpha: 1, duration: 0.6, ease: 'power2.in' })
      .add(() => {
        hideChapterUI();
        gsap.set('#gift', { autoAlpha: 0 });
        disposeRoom();
        engine.setView(train);
        train.setPose('window');
        gsap.killTweensOf(train);
        train.speed = 16;
      })
      .to('#tunnel', { autoAlpha: 0, duration: 0.8, ease: 'power2.out' }, '+=0.3');
  } else {
    train.moveTo('window', 3);
  }
  rideTl
    .add(() => {
      $('#skipBtn').textContent = fromIntro ? 'SKIP INTRO >' : 'SKIP >';
      gsap.to('#trainOverlay', { autoAlpha: 1, duration: 0.6 });
      train.showJournal(ch, i);
      caption(`Next stop: ${ch.name}`);
    })
    .add(() => {
      if (windowMedia) windowMedia.dispose();
      windowMedia = videoSource(ch.exhibits[0].src, ch.name, ch.accent, 3 / 1.8);
      train.showWindowMedia(windowMedia);
    }, '+=1.2')
    .add(() => train.setBiome(ch.biome), '+=1.4')
    .add(() => arrive(i), '+=2.8');
}

function skip() {
  if (S.phase === 'intro') arrive(0);
  else if (S.phase === 'ride') arrive(S.target);
}

// Tunnel into the chapter's room
function arrive(i) {
  if (S.arriving) return;
  S.arriving = true;
  S.busy = true;
  if (introTl) introTl.kill();
  if (rideTl) rideTl.kill();
  const ch = CHAPTERS[i];
  $('#tunnelText').textContent = `Chapter ${pad(i + 1)} · ${ch.title}`;
  gsap.timeline()
    .to('#trainOverlay', { autoAlpha: 0, duration: 0.4 }, 0)
    .to('#tunnel', { autoAlpha: 1, duration: 0.6, ease: 'power2.in' }, 0)
    .add(() => {
      caption('');
      train.hideWindowMedia();
      if (windowMedia) { windowMedia.dispose(); windowMedia = null; }
      gsap.killTweensOf(train);
      train.speed = 0;
      train.setPose('window');
      openRoom(i);
    })
    .to('#tunnel', { autoAlpha: 0, duration: 1, ease: 'power2.out' }, '+=0.5')
    .add(() => { S.arriving = false; S.busy = false; });
}

function openRoom(i) {
  disposeRoom();
  S.current = i;
  room = new Room(CHAPTERS[i], engine.env);
  engine.setView(room);
  room.play();
  showTitle(i);
}

function disposeRoom() {
  if (room) { room.dispose(); room = null; }
}

// ---------- 4. Chapter title card ----------
function showTitle(i) {
  S.phase = 'title';
  lockScroll();
  hideChapterUI();
  const ch = CHAPTERS[i];
  const next = CHAPTERS[i + 1];
  $('#tcNum').textContent = `CHAPTER ${pad(i + 1)}`;
  $('#tcCity').textContent = `${ch.name} · ${ch.tagline}`;
  $('#nextBtn span').textContent = next ? `Next stop: ${next.name} →` : 'Finish the journey →';
  const chars = splitTitle($('#tcTitle'), ch.title.toUpperCase());
  gsap.set('#titleCard', { autoAlpha: 1, y: 0 });
  gsap.timeline({ delay: 0.3 })
    .fromTo('#tcNum', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8 })
    .fromTo(chars, { autoAlpha: 0, yPercent: 60, rotate: 6 },
      { autoAlpha: 1, yPercent: 0, rotate: 0, duration: 1, stagger: 0.03, ease: 'expo.out' }, 0.2)
    .fromTo(['#tcCity', '#exploreBtn'], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12 }, '-=0.5');
  cc(`${ch.name}. ${ch.tagline}.`);
}

function hideChapterUI() {
  gsap.set(['#titleCard', '#exploreUI', '#exhibit'], { autoAlpha: 0 });
  $('#endPanel').classList.remove('is-visible');
  S.exhibit = -2;
}

// ---------- 5. Explore the room ----------
function explore() {
  if (S.phase !== 'title' || !room) return;
  S.phase = 'moving';
  sfx();
  gsap.to('#titleCard', { autoAlpha: 0, y: -20, duration: 0.6, ease: 'power2.in' });
  room.enterExplore().then(() => {
    S.phase = 'explore';
    S.exhibit = -2;
    lenis.scrollTo(0, { immediate: true, force: true });
    unlockScroll();
    gsap.to('#exploreUI', { autoAlpha: 1, duration: 0.6 });
    onScroll(0);
  });
}

function onScroll(p) {
  if (S.phase !== 'explore' || !room) return;
  room.progress = p;
  const f = p * 4, k = Math.round(f);
  showExhibit(Math.abs(f - k) < 0.38 ? k : -1);
  $$('#dots i').forEach((d, j) => d.classList.toggle('is-on', j <= k));
  $('#endPanel').classList.toggle('is-visible', p > 0.97);
  $('#hint').classList.toggle('is-hidden', p > 0.03);
}

function showExhibit(k) {
  if (k === S.exhibit) return;
  S.exhibit = k;
  const card = $('#exhibit');
  gsap.to(card, {
    autoAlpha: 0, x: -20, duration: 0.25, overwrite: true,
    onComplete: () => {
      if (k < 0) { cc(''); return; }
      const e = CHAPTERS[S.current].exhibits[k];
      card.querySelector('.ex-num').textContent = `${pad(k + 1)} / 05`;
      card.querySelector('h3').textContent = e.title;
      card.querySelector('.ex-text').textContent = e.text;
      $('#viewBtn span').textContent = e.type === 'video' ? 'Watch >' : 'View photo >';
      gsap.to(card, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'expo.out' });
      cc(e.caption);
    },
  });
}

// ---------- Overlays: lightbox + article ----------
function openLightbox(k) {
  if (k < 0 || !room) return;
  S.lb = k;
  $('#lightbox .lb-body').innerHTML = renderLightbox(CHAPTERS[S.current], k);
  openOverlay('#lightbox');
}

function openArticle() {
  $('#article .article__inner').innerHTML = renderArticle(CHAPTERS[S.current], S.current);
  $('#article').scrollTop = 0;
  openOverlay('#article');
}

function openOverlay(sel) {
  if (S.overlay === sel) return;
  if (S.overlay) gsap.set(S.overlay, { autoAlpha: 0 });
  S.overlay = sel;
  lenis.stop();
  if (room) room.pause();
  gsap.fromTo(sel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 });
}

function closeOverlay(instant) {
  if (!S.overlay) return;
  const sel = S.overlay;
  S.overlay = null;
  $(sel).querySelectorAll('video').forEach((v) => v.pause());
  gsap.to(sel, { autoAlpha: 0, duration: instant === true ? 0 : 0.4 });
  if (room) room.play();
  if (S.phase === 'explore') lenis.start();
}

// ---------- Menu ----------
function toggleMenu(force) {
  const menu = $('#menu');
  const isOpen = menu.classList.contains('is-open');
  const open = force === undefined ? !isOpen : force;
  if (open === isOpen) return;
  menu.classList.toggle('is-open', open);
  $('#menuBtn').classList.toggle('is-active', open);
  gsap.to(menu, { autoAlpha: open ? 1 : 0, duration: 0.45 });
  if (open) lenis.stop();
  else if (S.phase === 'explore' && !S.overlay) lenis.start();
}

function goToChapter(k) {
  if (S.phase === 'loader') return;
  if (S.phase === 'gate') {
    gsap.to('#intro', { autoAlpha: 0, duration: 0.6 });
    S.phase = 'intro';
    arrive(k);
    return;
  }
  if (S.phase === 'intro' || S.phase === 'ride') { S.target = k; arrive(k); return; }
  if (S.busy) return;
  if (k === S.current && S.phase !== 'gift') { replay(); return; }
  rideTo(k);
}

// Replay the current chapter from its title card
function replay() {
  if (!room || S.busy || !['explore', 'title'].includes(S.phase)) return;
  closeOverlay(true);
  gsap.to('#exploreUI', { autoAlpha: 0, duration: 0.4 });
  lockScroll();
  S.phase = 'moving';
  room.backToTitle().then(() => showTitle(S.current));
}

// ---------- Finale ----------
function finish() {
  if (S.busy) return;
  S.busy = true;
  S.phase = 'gift';
  closeOverlay(true);
  $('#tunnelText').textContent = 'Journey complete';
  gsap.timeline()
    .to('#tunnel', { autoAlpha: 1, duration: 0.6 })
    .add(() => {
      hideChapterUI();
      disposeRoom();
      engine.setView(train);
      train.setPose('window');
      train.speed = 4;
      lockScroll();
      gsap.set('#gift', { autoAlpha: 1 });
      cc('');
    })
    .to('#tunnel', { autoAlpha: 0, duration: 0.8 }, '+=0.3')
    .from('#gift .intro__card > *', { y: 40, autoAlpha: 0, stagger: 0.12, duration: 1.2, ease: 'expo.out' }, '-=0.4')
    .add(() => (S.busy = false));
}

init();
