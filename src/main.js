import './style.css';
import './stage3.css';
import Lenis from 'lenis';
import gsap from 'gsap';
import { Engine } from './engine.js';
import { Train } from './train.js';
import { Reel } from './reel.js';
import { Soundscape } from './audio.js';
import { CHAPTERS, INTRO_BIOME } from './chapters.js';
import { CREDITS } from './credits.js';
import { videoSource, placeholderURL } from './media.js';
import { renderArticle, renderLightbox, renderMenu, pad } from './ui.js';
import { drawPostcard } from './fx.js';
import { holdGesture } from './gestures.js';
import { Stamps, STAMPS } from './stamps.js';
import { runPrologue } from './prologue.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// phase: loader | gate | intro | ride | explore | gift
const S = {
  phase: 'loader', current: 0, target: 0, busy: false, arriving: false, soundOn: false, cc: false,
  line: null, caption: '', hint: '', shot: -2, end: false, overlay: null, lb: 0, visited: new Set(),
};
let engine, train, room, lenis, windowMedia, introTl, rideTl, stamps, opening, stampStop = null;

// Missing media in overlays: a quiet placeholder naming the file
document.addEventListener('error', (e) => {
  const el = e.target;
  if (!el || !el.dataset || !el.dataset.ph || el.dataset.failed) return;
  el.dataset.failed = '1';
  const url = placeholderURL(el.dataset.ph, el.getAttribute('src'));
  if (el.tagName === 'IMG') el.src = url;
  else if (el.tagName === 'VIDEO') {
    const im = document.createElement('img');
    im.className = el.className;
    im.alt = el.dataset.ph;
    im.src = url;
    el.replaceWith(im);
  }
}, true);

// Sound: a journey bed, one bed per city, one-shot effects (all files optional)
const sound = new Soundscape();

function setSound(on) {
  S.soundOn = on;
  const b = $('#soundBtn');
  b.textContent = on ? 'Sound on' : 'Sound off';
  b.classList.toggle('is-active', on);
  sound.setEnabled(on);
}

function sfx(name = 'whoosh') {
  sound.play(`/audio/${name}.mp3`);
}

// The margins: chapter credit (top), one line of type + captions (bottom)
function label(top, name = '') {
  $('#chapterLabel').innerHTML = top ? `<span>${top}</span>${name ? `<strong>${name}</strong>` : ''}` : '';
}

function refreshSub() {
  $('#sub').textContent = S.cc && S.caption ? S.caption : S.hint;
}

function setLine(text, caption = '') {
  S.caption = caption;
  if (text === S.line) { refreshSub(); return; }
  S.line = text;
  const block = $('.caption-block');
  gsap.to(block, {
    autoAlpha: 0, duration: 0.3, overwrite: true,
    onComplete: () => {
      $('#line').textContent = text;
      refreshSub();
      gsap.to(block, { autoAlpha: 1, duration: 0.9, ease: 'power2.out' });
    },
  });
}

function setHint(text) {
  if (S.hint === text) return;
  S.hint = text;
  refreshSub();
}

const setProgress = (p) => ($('#barProgress').style.transform = `scaleX(${p.toFixed(3)})`);
function showSkip(on, text = 'Skip →') {
  const b = $('#skipBtn');
  b.textContent = text;
  b.classList.toggle('is-hidden', !on);
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

// ---------- 1. Loader ----------
async function init() {
  const pct = $('.loader__pct'), counter = { v: 0 };
  const draw = () => (pct.textContent = `Boarding · ${Math.round(counter.v)}%`);
  gsap.fromTo('.loader__word', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1.8, ease: 'power2.out' });
  const creep = gsap.to(counter, { v: 85, duration: 3, ease: 'power2.out', onUpdate: draw });

  await Promise.all([
    document.fonts.load('400 40px "Cormorant Garamond"'),
    document.fonts.load('italic 400 40px "Cormorant Garamond"'),
    document.fonts.load('italic 500 40px "Cormorant Garamond"'),
    document.fonts.load('500 22px Inter'),
    document.fonts.load('700 22px Inter'),
    document.fonts.load('400 30px Caveat'),
    document.fonts.load('600 30px Caveat'),
    new Promise((r) => setTimeout(r, 1500)),
  ]);

  engine = new Engine($('#webgl'));
  train = new Train(engine.env);
  train.setBiome(INTRO_BIOME);
  train.showJournal(CHAPTERS[0], 0);
  engine.setView(train);
  engine.renderer.compile(train.scene, train.camera);
  hide3D(true);
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
      .to('.loader__center', { autoAlpha: 0, y: -20, duration: 0.8, ease: 'power3.in' })
      .fromTo('.loader__prompt', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out' }),
  });
}

function setupUI() {
  $('[data-sound="on"]').onclick = () => { setSound(true); openGate(); };
  $('[data-sound="off"]').onclick = () => { setSound(false); openGate(); };
  $('#skipBtn').onclick = skip;
  $('#soundBtn').onclick = () => setSound(!S.soundOn);
  $('#ccBtn').onclick = () => { S.cc = !S.cc; $('#ccBtn').classList.toggle('is-active', S.cc); refreshSub(); };
  $('#menuBtn').onclick = () => toggleMenu();
  $('#menuClose').onclick = () => toggleMenu(false);
  $('#readBtn').onclick = openArticle;
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

  $('#menu .menu__body').innerHTML = renderMenu(CHAPTERS, CREDITS);
  $$('[data-go]').forEach((b) => (b.onclick = () => { toggleMenu(false); goToChapter(+b.dataset.go); }));

  // Journey: one stop per chapter, in the bottom margin
  $('#journey').innerHTML = CHAPTERS.map((ch, k) =>
    `<li><button data-stop="${k}" data-name="${ch.name}" aria-label="Go to ${ch.name}"></button></li>`).join('');
  $$('[data-stop]').forEach((b) => (b.onclick = () => goToChapter(+b.dataset.stop)));
  renderJourney();

  // Click the picture to open the shot on screen
  const canvas = $('#webgl');
  canvas.addEventListener('click', () => {
    if (S.phase !== 'explore' || S.overlay || !room) return;
    openLightbox(room.pick());
  });
  canvas.addEventListener('pointermove', () => {
    canvas.style.cursor = S.phase === 'explore' && room ? 'zoom-in' : '';
  });
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (S.overlay) closeOverlay();
    else toggleMenu(false);
  });
}

function renderJourney() {
  const started = !['loader', 'gate'].includes(S.phase);
  $$('[data-stop]').forEach((b, k) => {
    b.classList.toggle('is-current', started && S.phase !== 'gift' && k === S.current);
    b.classList.toggle('is-visited', S.visited.has(k));
    b.classList.toggle('is-stamped', stamps.has(CHAPTERS[k].id));
  });
}

// ---------- 2. Prologue: the desk, the letter, the passport, the train ----------
function openGate() {
  S.phase = 'gate';
  gsap.to('#loader', { autoAlpha: 0, duration: 1 });
  gsap.to('.ctrl', { autoAlpha: 1, duration: 0.8, delay: 0.6, stagger: 0.06 });
  label('Prologue');
  showSkip(true, 'Skip prologue →');
  // reveal() fires while the train covers the screen: start drawing the carriage underneath it
  opening = runPrologue({ stamps, sound: sfx, reveal: () => hide3D(false) });
  opening.done.then(() => {
    opening = null;
    showSkip(false);
    if (S.phase === 'gate') runIntro();
  });
}

// ---------- 3. Train intro ----------
function runIntro() {
  S.phase = 'intro';
  hide3D(false);
  renderJourney();
  label('The journey');
  showSkip(true, 'Skip intro →');
  train.run(16, 3);
  introTl = gsap.timeline()
    .add(() => setLine('A journey, ten stops.'), 1.6)
    .add(() => setLine(''), 5.2)
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
  sound.setBed(null);
  hideChapterUI();

  rideTl = gsap.timeline();
  if (!fromIntro) {
    $('#tunnelText').textContent = 'All aboard';
    rideTl.to('#tunnel', { autoAlpha: 1, duration: 0.6, ease: 'power2.in' })
      .add(() => {
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
      label('Next stop', ch.name);
      showSkip(true, fromIntro ? 'Skip intro →' : 'Skip →');
      train.showJournal(ch, i);
      setLine(ch.tagline);
      renderJourney();
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
  if (S.phase === 'gate') {
    if (opening) { opening.skip(); showSkip(false); }
    return;
  }
  if (S.phase === 'intro') arrive(0);
  else if (S.phase === 'ride') arrive(S.target);
}

// Into the chapter (the window-to-chapter push-through arrives in step 3)
function arrive(i) {
  if (S.arriving) return;
  S.arriving = true;
  S.busy = true;
  if (introTl) introTl.kill();
  if (rideTl) rideTl.kill();
  showSkip(false);
  $('#tunnelText').textContent = '';
  gsap.timeline()
    .to('#tunnel', { autoAlpha: 1, duration: 0.6, ease: 'power2.in' }, 0)
    .add(() => {
      train.hideWindowMedia();
      if (windowMedia) { windowMedia.dispose(); windowMedia = null; }
      gsap.killTweensOf(train);
      train.speed = 0;
      train.setPose('window');
      openRoom(i);
    })
    .to('#tunnel', { autoAlpha: 0, duration: 1.2, ease: 'power2.out' }, '+=0.2')
    .add(() => { S.arriving = false; S.busy = false; });
}

function openRoom(i) {
  disposeRoom();
  S.current = i;
  S.visited.add(i);
  hide3D(false);
  const ch = CHAPTERS[i];
  room = new Reel(ch);
  engine.setView(room);
  engine.renderer.compile(room.scene, room.camera);
  sound.setBed(`/audio/${ch.id}.mp3`);
  room.play();
  startChapter(i);
}

function disposeRoom() {
  if (room) { room.dispose(); room = null; }
}

function startChapter(i) {
  const ch = CHAPTERS[i];
  S.phase = 'explore';
  S.shot = -2;
  label(`Chapter ${pad(i + 1)}`, ch.name);
  showEnd(false);
  lenis.scrollTo(0, { immediate: true, force: true });
  unlockScroll();
  setHint('Scroll to continue');
  onScroll(0);
  renderJourney();
}

function hideChapterUI() {
  showEnd(false);
  if (stampStop) { stampStop(); stampStop = null; }
  S.shot = -2;
  setHint('');
  setLine('');
  setProgress(0);
}

// ---------- 4. Explore: scroll through the shots ----------
function onScroll(p) {
  if (S.phase !== 'explore' || !room) return;
  room.progress = p;
  setProgress(p);
  if (p > 0.03) setHint('');
  showShot(Math.min(4, Math.round(p * 4)));
  showEnd(p > 0.97);
}

function showShot(k) {
  if (k === S.shot) return;
  S.shot = k;
  const e = CHAPTERS[S.current].exhibits[k];
  setLine(e.title, e.caption);
}

// ---------- End of a chapter: stamp, read, move on (bottom margin) ----------
function showEnd(on) {
  if (on === S.end) return;
  S.end = on;
  $('.bar--bottom').classList.toggle('is-end', on);
  if (!on) return;
  gsap.fromTo('.end-actions', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: 'power2.out' });
  armStamp();
}

function armStamp() {
  const ch = CHAPTERS[S.current], next = CHAPTERS[S.current + 1];
  const btn = $('#stampBtn'), text = btn.querySelector('span');
  $('#nextBtn').textContent = next ? `Next stop · ${next.name} →` : 'Finish the journey →';
  if (stampStop) { stampStop(); stampStop = null; }
  if (stamps.has(ch.id)) {
    btn.classList.add('is-done');
    btn.disabled = true;
    text.textContent = 'Passport stamped';
    return;
  }
  btn.classList.remove('is-done');
  btn.disabled = false;
  text.textContent = 'Hold to stamp';
  stampStop = holdGesture(btn, {
    duration: 1.4,
    onDone: () => {
      stampStop = null;
      sound.play(`/audio/${ch.id}-swell.mp3`, '/audio/swell.mp3');
      btn.classList.add('is-done');
      btn.disabled = true;
      text.textContent = 'Passport stamped';
      stamps.award(ch.id, () => sfx('stamp')).then(renderJourney);
    },
  });
}

// ---------- Overlays ----------
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
  if (['loader', 'gate'].includes(S.phase)) return;
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
  if (S.phase === 'explore') lenis.start();
}

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
    if (S.phase === 'explore' && !S.overlay) lenis.start();
  }
}

function goToChapter(k) {
  if (S.phase === 'loader') return;
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
  if (k === S.current && S.phase === 'explore') { lenis.scrollTo(0, { duration: 1.6 }); return; }
  rideTo(k);
}

// ---------- Finale ----------
function finish() {
  if (S.busy) return;
  S.busy = true;
  S.phase = 'gift';
  closeOverlay(true);
  sound.setBed(null);
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
      lockScroll();
      label('Journey complete');
      gsap.set('#gift', { autoAlpha: 1 });
      hide3D(true);
      renderJourney();
    })
    .to('#tunnel', { autoAlpha: 0, duration: 0.8 }, '+=0.3')
    .from('#gift .intro__card > *', { y: 30, autoAlpha: 0, stagger: 0.1, duration: 1.1, ease: 'expo.out' }, '-=0.4')
    .add(() => {
      const inked = $$('#giftPassport .stamp');
      if (inked.length) gsap.from(inked, { scale: 2, autoAlpha: 0, stagger: 0.1, duration: 0.45, ease: 'power4.in', onStart: () => sfx('stamp') });
    }, '-=0.6')
    .add(() => (S.busy = false));
}

init();
