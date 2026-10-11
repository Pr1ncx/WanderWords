// The stage: the hall of ten plates and every phase of the experience.
//   plates -> crossing -> dispatches -> dial -> solved -> exiting -> plates ...
// The DOM overlay (hud, panel, dial, index) lives in the other modules; this file owns the 3D scene,
// the camera, the colour grade and the state machine that connects them.
import gsap from 'gsap';
import * as THREE from 'three';
import { Plate, PHOTO_W, PHOTO_H } from './plates.js';
import { loadArt, wallTexture } from './art.js';
import { FLAT, mixGrade, gradeAtHour, presetsFor, trueGrade, applyGrade } from './grade.js';
import { createHud } from './hud.js';
import { createDispatches } from './dispatches.js';
import { createDial } from './dial.js';
import { createFinale } from './finale.js';
import { audio } from '../audio.js';
import { navigate } from '../nav.js';
import { PILLARS } from '../reader.js';

const SPACING = 3.4; // distance between plates along X
const PLATE_Y = 0.12;
const GALLERY_Z = 5.4; // camera distance in the hall
const FOV_GALLERY = 35;
const FOV_CLOSE = 30; // the lens narrows slightly as you step in
const STORE = 'ww:solved';
const clamp = THREE.MathUtils.clamp;

const loadSolved = () => {
  try { return new Set(JSON.parse(localStorage.getItem(STORE) || '[]')); } catch { return new Set(); }
};
const saveSolved = (s) => {
  try { localStorage.setItem(STORE, JSON.stringify([...s])); } catch { /* storage unavailable */ }
};
const circDiff = (a, b) => {
  const d = Math.abs(a - b) % 1440;
  return Math.min(d, 1440 - d);
};
const idle = () => new Promise((r) => (window.requestIdleCallback ? window.requestIdleCallback(() => r(), { timeout: 600 }) : setTimeout(r, 80)));

export function startStage({ engine, ui, rootEl, destinations, art0, reduced }) {
  const { scene, camera, canvas } = engine;
  const total = destinations.length;
  let phase = 'plates';
  let active = 0, busy = false, dead = false, spotsOn = false, solvedThisVisit = false, suppress = false;

  const W = { v: 0 }; // warmth 0..1: the scene warms a little with every dispatch read
  const solved = loadSolved();
  const openedBy = {}; // slug -> Set of dispatch keys read
  const cam = { x: 0, y: PLATE_Y, z: GALLERY_Z, fov: FOV_GALLERY };
  const mouse = { x: 0, y: 0 }; // -1..1, y up
  const look = { x: 0, y: 0 }; // damped copy of the mouse
  const amt = { tilt: 0, breath: 1 };
  const grade = { from: FLAT, to: FLAT, t: 1, on: false }; // live grade of the active plate
  const liveGrade = () => mixGrade(grade.from, grade.to, grade.t);

  // ---- The hall: fog, floor, a pool of light on the back wall, drifting dust ----
  scene.background = new THREE.Color(0x0c0a09);
  scene.fog = new THREE.FogExp2(0x0c0a09, 0.07);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 24), new THREE.MeshBasicMaterial({ color: 0x14100e }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.95, -4);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), new THREE.MeshBasicMaterial({ map: wallTexture(), fog: false }));
  wall.position.set(0, 1, -4);
  const dustPos = new Float32Array(180 * 3);
  for (let i = 0; i < 180; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 14;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 5;
    dustPos[i * 3 + 2] = (Math.random() - 0.8) * 6;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xf2ebdd, size: 0.02, transparent: true, opacity: 0.22, depthWrite: false }));
  scene.add(floor, wall, dust);

  // ---- The plates ----
  const dimFor = (j, a) => (j === a ? 1 : Math.abs(j - a) === 1 ? 0.35 : 0.2);
  const zFor = (j, a) => -Math.min(Math.abs(j - a), 2) * 0.9; // neighbours sit further back
  const plates = destinations.map((d, i) => {
    const p = new Plate(d, i);
    p.group.position.set(i * SPACING, PLATE_Y, 0);
    if (solved.has(d.slug)) {
      p.baseGrade = trueGrade(d);
      p.setMark(`\u2713 ${d.hour}`);
      p.state.mark = 1;
    }
    scene.add(p.group);
    return p;
  });
  const place = (a) => plates.forEach((p, j) => { p.state.z = zFor(j, a); p.state.dim = dimFor(j, a); });
  place(0);

  // Camera glide on X (about 1.1s, power3.inOut), neighbours move back and dim
  function layout(a, dur) {
    plates.forEach((p, j) => gsap.to(p.state, { z: zFor(j, a), dim: dimFor(j, a), duration: dur, ease: 'power3.inOut', overwrite: 'auto' }));
    gsap.to(cam, { x: a * SPACING, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
  }

  // ---- Images: chapter I is ready at preload, the rest load quietly after Enter ----
  const artPromises = new Map();
  function ensureArt(i) {
    if (i < 0 || i >= total) return Promise.resolve();
    if (!artPromises.has(i)) {
      const source = i === 0 && art0 ? Promise.resolve(art0) : loadArt(destinations[i]);
      artPromises.set(i, source.then((a) => { if (!dead) plates[i].setArt(a); return a; }).catch((err) => console.warn('Art failed for', destinations[i].slug, err)));
    }
    return artPromises.get(i);
  }
  async function loadRest() {
    for (let i = 1; i < total && !dead; i++) {
      await ensureArt(i);
      await idle();
    }
  }
  ensureArt(0);

  // ---- Colour grade helpers ----
  function gradeSet(g) {
    gsap.killTweensOf(grade);
    grade.from = g;
    grade.to = g;
    grade.t = 1;
    grade.on = true;
  }
  function gradeTo(g, secs) {
    const from = liveGrade();
    gsap.killTweensOf(grade);
    grade.from = from;
    grade.to = g;
    grade.t = secs > 0 ? 0 : 1;
    grade.on = true;
    if (secs > 0) gsap.to(grade, { t: 1, duration: secs, ease: 'power2.inOut' });
  }

  // Camera distance at which the photograph fills the viewport (by height, or by width on portrait screens)
  function fitZ() {
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV_CLOSE / 2));
    return Math.max(PHOTO_H / (2 * tan), PHOTO_W / (2 * tan * camera.aspect)) * 1.02;
  }

  // Reduced motion: replace camera moves with a quick crossfade
  function jump(fn, then) {
    gsap.timeline()
      .to(canvas, { opacity: 0, duration: 0.25 })
      .add(fn)
      .to(canvas, { opacity: 1, duration: 0.25, onComplete: then });
  }

  // ---- DOM modules ----
  const hud = createHud(ui, { total, reduced });
  hud.setChapter(destinations[0], 0, true);
  const dispatches = createDispatches(ui, { reduced, onOpen: onDispatchOpen, onClosed: onPanelClosed });
  const dial = createDial(ui, { reduced, audio, onChange: onDialChange, onCommit: onDialCommit, onShowMe, onSkip: () => exit(false), onNext: () => exit(true) });
  const finale = createFinale(rootEl, {
    destinations, reduced,
    isSolved: (i) => solved.has(destinations[i].slug),
    thumb: (i) => (plates[i].art ? plates[i].art.thumb : ''),
    onGo: goFromIndex,
  });
  const allSolved = () => destinations.every((d) => solved.has(d.slug));

  // ---- Phase 2: the plates ----
  function goTo(i) {
    i = clamp(i, 0, total - 1);
    if (phase !== 'plates' || i === active) return;
    active = i;
    ensureArt(i);
    ensureArt(i - 1);
    ensureArt(i + 1);
    hud.setChapter(destinations[i], i);
    if (reduced) jump(() => { cam.x = i * SPACING; place(i); }, () => {});
    else layout(i, 1.1);
  }

  async function goFromIndex(i) {
    if (phase !== 'plates') await exit(false);
    if (!dead && phase === 'plates') goTo(i);
  }

  // ---- Phase 3: the crossing (about 2.4s) ----
  async function cross() {
    if (busy || phase !== 'plates') return;
    busy = true;
    phase = 'crossing';
    const p = plates[active], d = p.data;
    await ensureArt(active);
    if (dead) return;
    const opened = (openedBy[d.slug] = openedBy[d.slug] || new Set());
    const isSolved = solved.has(d.slug);
    W.v = opened.size / 4;
    gradeSet(isSolved ? trueGrade(d) : FLAT);
    hud.showPlates(false); // the chapter UI fades out (0.4s)
    hud.setCounter(opened.size);
    audio.startChapter(d, active, [...opened].map((k) => PILLARS.findIndex((x) => x.key === k)));
    dispatches.mount(d, opened);
    const z = fitZ();
    const finish = () => {
      phase = 'dispatches';
      busy = false;
      if (isSolved) {
        phase = 'solved';
        dial.showSolved(`${d.hour}: ${d.name.toUpperCase()}`);
      } else if (opened.size >= 4) {
        unlockDial();
      }
      dispatches.focusFirst();
    };
    plates.forEach((q) => { if (q !== p) gsap.to(q.state, { dim: 0, duration: reduced ? 0 : 1.2, ease: 'power2.inOut' }); });

    if (reduced) {
      jump(() => {
        cam.z = z;
        cam.fov = FOV_CLOSE;
        p.state.frame = 0;
        audio.bedTo(0.6, 0.5);
        spotsOn = true;
        dispatches.show();
        hud.showClose(true);
      }, finish);
      return;
    }
    gsap.timeline({ onComplete: finish })
      .add(() => hud.showClose(true), 0.4)
      .to(cam, { z, fov: FOV_CLOSE, duration: 1.6, ease: 'power2.inOut' }, 0.4) // dolly in on Z
      .to(p.state, { frame: 0, duration: 1, ease: 'power2.inOut' }, 0.6) // frame and margins dissolve
      .to(p.state, { depth: 1, duration: 0.8, ease: 'power2.inOut' }, 1.6) // the photograph comes alive
      .add(() => audio.bedTo(0.6, 2), 1.6) // ambient bed up to about 60%
      .add(() => { spotsOn = true; dispatches.show(); }, 2.2); // hotspots in, 0.15s stagger
  }

  // ---- Phase 4: the dispatches ----
  function onDispatchOpen(key, first) {
    if (!first) return;
    const opened = openedBy[plates[active].data.slug];
    hud.setCounter(opened.size);
    audio.layerOn(PILLARS.findIndex((x) => x.key === key)); // one new audio layer
    gsap.to(W, { v: opened.size / 4, duration: reduced ? 0 : 1.5, ease: 'power2.out' }); // the grade warms
  }

  function onPanelClosed() {
    const d = plates[active].data;
    if (phase === 'dispatches' && openedBy[d.slug].size >= 4 && !solved.has(d.slug)) unlockDial();
  }

  // ---- Phase 5: the dial ----
  function unlockDial() {
    if (phase !== 'dispatches') return;
    phase = 'dial';
    const d = plates[active].data;
    suppress = true;
    dial.show(720);
    suppress = false;
    gradeTo(gradeAtHour(720, presetsFor(d)), reduced ? 0 : 1.2);
  }

  // As the dial turns, the photograph is re-graded in real time
  function onDialChange(min) {
    if (suppress || phase !== 'dial') return;
    gradeSet(gradeAtHour(min, presetsFor(plates[active].data)));
  }

  function onDialCommit(min) {
    if (phase !== 'dial') return;
    const d = plates[active].data;
    if (circDiff(min, d.hourMinutes) <= (d.hourToleranceMinutes ?? 20)) solve();
    else dial.flash('Not yet. The Field Notes know.');
  }

  function onShowMe() {
    if (phase !== 'dial') return;
    dial.animateTo(plates[active].data.hourMinutes, solve);
  }

  function solve() {
    if (phase !== 'dial') return;
    phase = 'solved';
    solvedThisVisit = true;
    const d = plates[active].data;
    solved.add(d.slug);
    saveSolved(solved);
    dial.lock(`${d.hour}: ${d.name.toUpperCase()}`);
    gradeTo(trueGrade(d), reduced ? 0 : 1.8); // eases to the chapter's "true" look
    audio.lock();
    audio.swell();
  }

  // ---- Phase 6: the exit (about 1.4s), then on to the next plate ----
  function exit(advance) {
    return new Promise((resolve) => {
      if (busy || !['dispatches', 'dial', 'solved'].includes(phase)) { resolve(); return; }
      busy = true;
      phase = 'exiting';
      const p = plates[active], d = p.data, isSolved = solved.has(d.slug);
      const justSolved = solvedThisVisit;
      solvedThisVisit = false;
      dispatches.close(true);
      dispatches.hide();
      spotsOn = false;
      dial.hide();
      hud.showClose(false);
      audio.stopChapter(1.2);
      const base = isSolved ? trueGrade(d) : FLAT;
      gradeTo(base, reduced ? 0 : 1.4);
      gsap.to(W, { v: 0, duration: reduced ? 0 : 1, overwrite: true });
      plates.forEach((q, j) => { if (j !== active) gsap.to(q.state, { dim: dimFor(j, active), duration: reduced ? 0 : 1.2, ease: 'power2.inOut' }); });

      const finish = () => {
        grade.on = false;
        p.baseGrade = base;
        if (isSolved) {
          p.setMark(`\u2713 ${d.hour}`); // the solved plate gets a small mark in its corner
          gsap.to(p.state, { mark: 1, duration: reduced ? 0 : 0.6 });
        }
        phase = 'plates';
        busy = false;
        hud.setChapter(destinations[active], active, true);
        hud.showPlates(true);
        hud.focusStep();
        const wait = reduced ? 0.2 : 0.6;
        if (justSolved && allSolved()) {
          gsap.delayedCall(wait, () => { if (!dead && phase === 'plates') finale.open(hud.el.step); });
        } else if (advance && isSolved && active < total - 1) {
          gsap.delayedCall(wait, () => goTo(active + 1));
        }
        resolve();
      };

      if (reduced) {
        jump(() => { cam.z = GALLERY_Z; cam.fov = FOV_GALLERY; p.state.frame = 1; p.state.depth = 0; }, finish);
        return;
      }
      gsap.timeline({ onComplete: finish })
        .to(p.state, { depth: 0, duration: 0.8, ease: 'power2.inOut' }, 0)
        .to(p.state, { frame: 1, duration: 1, ease: 'power2.inOut' }, 0.3)
        .to(cam, { z: GALLERY_Z, fov: FOV_GALLERY, duration: 1.4, ease: 'power2.inOut' }, 0);
    });
  }

  // ---- Input ----
  hud.el.step.addEventListener('click', cross);
  hud.el.prev.addEventListener('click', () => goTo(active - 1));
  hud.el.next.addEventListener('click', () => goTo(active + 1));
  hud.el.back.addEventListener('click', () => exit(false));
  hud.el.index.addEventListener('click', () => finale.open(hud.el.index));

  const onMove = (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  const onKey = (e) => {
    if (finale.isOpen() || phase !== 'plates') return;
    if (e.key === 'ArrowLeft') goTo(active - 1);
    else if (e.key === 'ArrowRight') goTo(active + 1);
  };
  // Touch: swipe between plates; dragging a finger also steers the parallax (the pointer position is the mouse)
  let sx = 0, sy = 0, swiping = false;
  const onDown = (e) => { sx = e.clientX; sy = e.clientY; swiping = true; };
  const onUp = (e) => {
    if (!swiping) return;
    swiping = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (phase === 'plates' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(active + (dx < 0 ? 1 : -1));
  };
  const onResize = () => { if (['dispatches', 'dial', 'solved'].includes(phase)) cam.z = fitZ(); };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);

  // ---- Every frame ----
  const removeUpdater = engine.onUpdate((dt, t) => {
    const k = 1 - Math.pow(1 - 0.06, dt * 60); // damped lerp of about 0.06 per frame
    const closeUp = phase === 'dispatches' || phase === 'dial' || phase === 'solved';
    const parallax = closeUp && !reduced ? 1 : 0;
    look.x += (mouse.x * parallax - look.x) * k;
    look.y += (mouse.y * parallax - look.y) * k;
    amt.tilt += ((phase === 'plates' && !reduced ? 1 : 0) - amt.tilt) * k;
    amt.breath += ((phase === 'plates' && !reduced ? 1 : 0) - amt.breath) * k;

    camera.position.set(cam.x + look.x * 0.15, cam.y + look.y * 0.15, cam.z); // about +-0.15 units of parallax
    if (camera.fov !== cam.fov) {
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld(true);
    wall.position.x = cam.x;
    dust.position.x = cam.x * 0.9;
    if (!reduced) {
      dust.rotation.y = t * 0.02;
      dust.position.y = Math.sin(t * 0.1) * 0.05;
    }

    plates.forEach((p, j) => {
      const isActive = j === active;
      p.group.visible = Math.abs(j - active) <= 2;
      if (!p.group.visible) return;
      p.update(t, isActive ? mouse.x * amt.tilt : 0, isActive ? mouse.y * amt.tilt : 0, amt.breath, k);
      applyGrade(p.photoMat.uniforms, isActive && grade.on ? liveGrade() : p.baseGrade, isActive ? W.v : 0);
      if (isActive) p.photoMat.uniforms.uMouse.value.set(look.x, look.y);
    });

    if (spotsOn) {
      dispatches.update({ plate: plates[active], camera, width: canvas.clientWidth, height: canvas.clientHeight, look, amt: plates[active].state.depth });
    }
  });

  return {
    // Called on Enter
    begin() {
      ensureArt(1);
      loadRest();
    },
    dispose() {
      dead = true;
      removeUpdater();
      gsap.killTweensOf([cam, grade, W, ...plates.map((p) => p.state)]);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      dispatches.destroy();
      dial.destroy();
      finale.destroy();
      audio.stopChapter(0);
      plates.forEach((p) => { scene.remove(p.group); p.dispose(); });
      scene.remove(floor, wall, dust);
      floor.geometry.dispose();
      floor.material.dispose();
      wall.geometry.dispose();
      wall.material.map.dispose();
      wall.material.dispose();
      dustGeo.dispose();
      dust.material.dispose();
    },
  };
}
