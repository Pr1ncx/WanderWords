import './style.css';
import './stage3.css';
import Lenis from 'lenis';
import gsap from 'gsap';
import { Engine } from './engine.js';
import { Train } from './train.js';
import { Gallery } from './gallery.js';
import { CHAPTERS, INTRO_BIOME } from './chapters.js';
import { CREDITS } from './credits.js';
import { videoSource, placeholderURL } from './media.js';
import { renderArticle, renderLightbox, renderMenu, pad } from './ui.js';
import { splitChars, magnetic, drawPostcard } from './fx.js';
import { Stamps, STAMPS } from './stamps.js';
import { runOpening } from './opening.js';
import { openRitual, RITUALS } from './rituals.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// phase: loader | gate | intro | ride | title | moving | explore | gift
const S = {
  phase: 'loader', current: 0, target: 0, busy: false, arriving: false, soundOn: false, cc: false, ccText: '',
  exhibit: -2, overlay: null, lb: 0, ritual: null, visited: new Set(),
};
let engine, train, room, lenis, windowMedia, introTl, rideTl, stamps, opening;

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
const SFX = {};
for (const k of ['whoosh', 'punch', 'tear', 'stamp']) {
  SFX[k] = new Audio(`/audio/${k}.mp3`);
  SFX[k].preload = 'none';
}
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

function sfx(name = 'whoosh') {
  const a = SFX[name];
  if (!S.soundOn || !a) return;
  a.currentTime = 0;
  a.play().catch(() => {});
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

// Stop rendering WebGL while a full-screen layer hides the canvas
function hide3D(on) {
  if (engine) engine.paused = on;
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
  engine.post.grade('#6B3A24', 0.3, 0);
  train = new Train(engine.env);
  train.setBiome(INTRO_BIOME);
  train.showJournal(CHAPTERS[0], 0);
  engine.setView(train);
  engine.renderer.compile(train.scene, train.camera);
  hide3D(true); // the loader and opening cover the canvas
  gsap.ticker.add(() => engine.tick());

  lenis = new Lenis({ lerp: 0.1 });
  lenis.stop();
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', (l) => onScroll(l.progress));

  stamps = new Stamps($('#stampsBtn'), $('#stampLayer'));
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
  $('#skipBtn').onclick = skip;
  $('#soundBtn').onclick = () => setSound(!S.soundOn);
  $('#ccBtn').onclick = () => { S.cc = !S.cc; $('#ccBtn').classList.toggle('is-active', S.cc); refreshCC(); };
  $('#replayBtn').onclick = replay;
  $('#menuBtn').onclick = () => toggleMenu();
  $('#menuClose').onclick = () => toggleMenu(false);
  $('#exploreBtn').onclick = explore;
  $('#viewBtn').onclick = () => openLightbox(S.exhibit);
  $('#readBtn').onclick = openArticle;
  $('#ritualBtn').onclick = startRitual;
  $('#nextBtn').onclick = () => (S.current < CHAPTERS.length - 1 ? rideTo(S.current + 1) : finish());
  $('#articleClose').onclick = closeOverlay;
  $('#lbClose').onclick = closeOverlay;
  $('#passportClose').onclick = closeOverlay;
  $('#stampsBtn').onclick = openPassport;
  $('#lbPrev').onclick = () => openLightbox((S.lb + 4) % 5);
  $('#lbNext').onclick = () => openLightbox((S.lb + 1) % 5);
  $('#download').onclick = () => {
    const a = document.createElement('a');
    a.download = 'wanderwords-postcard.png';
    a.href = drawPostcard(CHAPTERS, stamps.list()).toDataURL('image/png');
    a.click();
  };
  $('#restart').onclick = () => rideTo(0);

  // Menu: chapter index + credits
  $('#menu .menu__body').innerHTML = renderMenu(CHAPTERS, CREDITS);
  $$('[data-go]').forEach((b) => (b.onclick = () => { toggleMenu(false); goToChapter(+b.dataset.go); }));

  // HUD: one stop per chapter
  $('#hud .hud__stops').innerHTML = CHAPTERS.map((ch, k) =>
    `<li><button data-hud="${k}" data-name="${pad(k + 1)} · ${ch.name}" aria-label="Go to ${ch.name}"></button></li>`).join('');
  $$('[data-hud]').forEach((b) => (b.onclick = () => goToChapter(+b.dataset.hud)));
  renderHud();

  // Exhibit progress dots
  $('#dots').innerHTML = Array.from({ length: 5 }, () => '<i></i>').join('');

  // Click photos and the hero video in 3D
  const canvas = $('#webgl');
  canvas.addEventListener('click', () => {
    if (S.phase !== 'explore' || S.overlay || S.ritual || !room) return;
    const k = room.pick(engine.ndc);
    if (k >= 0) openLightbox(k);
  });
  let lastPick = 0;
  canvas.addEventListener('pointermove', () => {
    if (S.phase !== 'explore' || !room) { canvas.style.cursor = ''; return; }
    const now = performance.now();
    if (now - lastPick < 100) return; // raycasting on every move is wasted work
    lastPick = now;
    canvas.style.cursor = room.pick(engine.ndc) >= 0 ? 'pointer' : '';
  });
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (S.ritual) S.ritual.close();
    else if (S.overlay) closeOverlay();
    else toggleMenu(false);
  });
}

// ---------- HUD ----------
function renderHud() {
  const started = !['loader', 'gate'].includes(S.phase);
  $$('[data-hud]').forEach((b, k) => {
    b.classList.toggle('is-current', started && k === S.current);
    b.classList.toggle('is-visited', S.visited.has(k));
    b.classList.toggle('is-stamped', stamps.has(CHAPTERS[k].id));
  });
}

// ---------- 2. Opening: wipe the window, punch the ticket ----------
function openGate() {
  S.phase = 'gate';
  gsap.to('#loader', { autoAlpha: 0, duration: 1 });
  gsap.to('.ctrl', { autoAlpha: 1, duration: 0.8, delay: 0.6, stagger: 0.08 });
  opening = runOpening({ stamps, post: engine.post, sound: sfx });
  opening.done.then(() => {
    opening = null;
    if (S.phase === 'gate') runIntro();
  });
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
  hide3D(false);
  renderHud();
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
  if (S.ritual) S.ritual.close();
  S.busy = true;
  S.phase = 'ride';
  S.target = i;
  const ch = CHAPTERS[i];
  closeOverlay(true);
  lockScroll();
  sfx();
  engine.post.pulse();
  engine.post.grade(ch.accent, 0.28);

  rideTl = gsap.timeline();
  if (!fromIntro) {
    $('#tunnelText').textContent = 'All aboard';
    rideTl.to('#tunnel', { autoAlpha: 1, duration: 0.6, ease: 'power2.in' })
      .add(() => {
        hideChapterUI();
        gsap.set('#gift', { autoAlpha: 0 });
        hide3D(false);
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

// Tunnel into the chapter
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
      engine.post.pulse(0.022);
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
  S.visited.add(i);
  hide3D(false);
  room = new Gallery(CHAPTERS[i], engine.env);
  engine.setView(room);
  engine.renderer.compile(room.scene, room.camera); // compile now, not on the first visible frame
  engine.post.grade(CHAPTERS[i].room.trim, 0.4);
  room.play();
  showTitle(i);
  renderHud();
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
  updateRitualBtn();
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

// ---------- 5. Explore the chapter ----------
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

const hudBar = () => $('#hud .hud__bar i');
function onScroll(p) {
  if (S.phase !== 'explore' || !room) return;
  room.progress = p;
  const f = p * 4, k = Math.round(f);
  showExhibit(Math.abs(f - k) < 0.38 ? k : -1);
  $$('#dots i').forEach((d, j) => d.classList.toggle('is-on', j <= k));
  $('#endPanel').classList.toggle('is-visible', p > 0.97);
  $('#hint').classList.toggle('is-hidden', p > 0.03);
  hudBar().style.transform = `scaleY(${p.toFixed(3)})`;
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

// ---------- Rituals: one small interaction per city, earns its stamp ----------
function updateRitualBtn() {
  const ch = CHAPTERS[S.current], def = RITUALS[ch.id], btn = $('#ritualBtn');
  const show = !!def && !stamps.has(ch.id);
  btn.style.display = show ? '' : 'none';
  if (show) btn.querySelector('span').textContent = `✦ ${def.verb}`;
}

function startRitual() {
  if (S.ritual || !room || S.phase !== 'explore') return;
  const ch = CHAPTERS[S.current];
  lenis.stop();
  gsap.to('#exploreUI', { autoAlpha: 0, duration: 0.4 });
  S.ritual = openRitual(ch, {
    onFinish: (completed) => {
      S.ritual = null;
      const back = () => {
        updateRitualBtn();
        renderHud();
        if (S.phase !== 'explore') return;
        gsap.to('#exploreUI', { autoAlpha: 1, duration: 0.6 });
        if (!S.overlay) lenis.start();
      };
      if (!completed) { back(); return; }
      const def = RITUALS[ch.id];
      engine.post.pulse(0.02);
      if (def.grade) {
        engine.post.grade(def.grade, 0.55, 0.8);
        gsap.delayedCall(2.6, () => room && engine.post.grade(CHAPTERS[S.current].room.trim, 0.4));
      }
      if (room) room.celebrate();
      stamps.award(ch.id, () => sfx('stamp')).then(back);
    },
  });
}

// ---------- Overlays: lightbox, article, passport ----------
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

function openPassport() {
  if (['loader', 'gate'].includes(S.phase) || S.ritual) return;
  stamps.renderPassport($('#passportGrid'));
  $('#passportCount').textContent = `${stamps.count} of ${STAMPS.length} stamps collected`;
  openOverlay('#passport');
}

function openOverlay(sel) {
  if (S.overlay === sel) return;
  if (S.overlay) gsap.set(S.overlay, { autoAlpha: 0 });
  S.overlay = sel;
  lenis.stop();
  if (room) room.pause();
  gsap.fromTo(sel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, onComplete: () => S.overlay === sel && hide3D(true) });
}

function closeOverlay(instant) {
  if (!S.overlay) return;
  const sel = S.overlay;
  S.overlay = null;
  if (S.phase !== 'gift') hide3D(false);
  $(sel).querySelectorAll('video').forEach((v) => v.pause());
  gsap.to(sel, { autoAlpha: 0, duration: instant === true ? 0 : 0.4 });
  if (room) room.play();
  if (S.phase === 'explore' && !S.ritual) lenis.start();
}

// ---------- Menu ----------
function toggleMenu(force) {
  const menu = $('#menu');
  const isOpen = menu.classList.contains('is-open');
  const open = force === undefined ? !isOpen : force;
  if (open === isOpen) return;
  menu.classList.toggle('is-open', open);
  $('#menuBtn').classList.toggle('is-active', open);
  gsap.to(menu, { autoAlpha: open ? 1 : 0, duration: 0.45, onComplete: () => open && hide3D(true) });
  if (open) lenis.stop();
  else {
    hide3D(S.phase === 'gift' || !!S.overlay || S.phase === 'gate');
    if (S.phase === 'explore' && !S.overlay && !S.ritual) lenis.start();
  }
}

function goToChapter(k) {
  if (S.phase === 'loader') return;
  if (S.ritual) S.ritual.close();
  if (S.phase === 'gate') {
    if (opening) { opening.cancel(); opening = null; }
    gsap.to('#opening', { autoAlpha: 0, duration: 0.6 });
    hide3D(false);
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
  if (!room || S.busy || S.ritual || !['explore', 'title'].includes(S.phase)) return;
  closeOverlay(true);
  gsap.to('#exploreUI', { autoAlpha: 0, duration: 0.4 });
  lockScroll();
  S.phase = 'moving';
  room.backToTitle().then(() => showTitle(S.current));
}

// ---------- Finale: your passport and postcard ----------
function finish() {
  if (S.busy) return;
  S.busy = true;
  S.phase = 'gift';
  closeOverlay(true);
  $('#tunnelText').textContent = 'Journey complete';
  stamps.renderPassport($('#giftPassport'));
  $('#giftCount').textContent = `${stamps.count} of ${STAMPS.length} stamps collected`;
  gsap.timeline()
    .to('#tunnel', { autoAlpha: 1, duration: 0.6 })
    .add(() => {
      hideChapterUI();
      disposeRoom();
      engine.setView(train);
      train.setPose('window');
      train.speed = 4;
      engine.post.grade('#2E3A6B', 0.45);
      lockScroll();
      gsap.set('#gift', { autoAlpha: 1 });
      hide3D(true); // the finale covers the canvas
      cc('');
      renderHud();
    })
    .to('#tunnel', { autoAlpha: 0, duration: 0.8 }, '+=0.3')
    .from('#gift .intro__card > *', { y: 40, autoAlpha: 0, stagger: 0.1, duration: 1.1, ease: 'expo.out' }, '-=0.4')
    .add(() => {
      const inked = $$('#giftPassport .stamp');
      if (inked.length) gsap.from(inked, { scale: 2, autoAlpha: 0, stagger: 0.1, duration: 0.45, ease: 'power4.in', onStart: () => sfx('stamp') });
    }, '-=0.6')
    .add(() => (S.busy = false));
}

init();
