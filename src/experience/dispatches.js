// The four Dispatches: hotspot markers anchored to the photograph, and the editorial panel.
// Hotspots are re-projected from 3D to screen coordinates every frame so they stay locked to the
// image during parallax. The panel is real HTML (right side on desktop, bottom sheet on mobile).
import gsap from 'gsap';
import * as THREE from 'three';
import { PHOTO_W, PHOTO_H } from './plates.js';
import { PILLARS, esc, text, paras, dispatchExtras, bodyFor } from '../reader.js';

const TICK = '<svg class="hs__tick" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const v3 = new THREE.Vector3();

export function createDispatches(ui, { reduced, onOpen, onClosed }) {
  const hud = ui.querySelector('.hud');
  const spotsEl = ui.querySelector('[data-spots]');
  const panel = document.createElement('aside');
  panel.className = 'panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'panel-title');
  panel.setAttribute('aria-hidden', 'true');
  panel.setAttribute('inert', '');
  panel.innerHTML = '<button class="panel__close" type="button" aria-label="Close dispatch">Close <span aria-hidden="true">Esc</span></button><div class="panel__inner" data-inner></div>';
  hud.append(panel);
  gsap.set(panel, { autoAlpha: 0 });
  const inner = panel.querySelector('[data-inner]');

  let d = null, opened = new Set(), spots = [], openKey = null, lastTrigger = null;
  const mobile = window.matchMedia('(max-width: 48rem)');

  function mount(dest, openedSet) {
    d = dest;
    opened = openedSet;
    spots = [];
    spotsEl.innerHTML = '';
    d.hotspots.forEach((h) => {
      const p = PILLARS.find((x) => x.key === h.id);
      if (!p) return;
      const wrap = document.createElement('div');
      wrap.className = 'hs';
      wrap.innerHTML = `<button class="hs__btn${opened.has(h.id) ? ' is-read' : ''}" type="button" aria-label="Dispatch ${p.n}: ${p.label}. ${p.pillar}"><span class="hs__ring"><span class="hs__n">${p.n}</span>${TICK}</span><span class="hs__label">${p.n} ${p.label}<small>${p.pillar}</small></span></button>`;
      const btn = wrap.querySelector('button');
      btn.addEventListener('click', () => open(h.id, btn));
      spotsEl.append(wrap);
      spots.push({ h, wrap, btn });
    });
    gsap.set(spots.map((s) => s.btn), { autoAlpha: 0 });
  }

  function show() {
    gsap.to(spots.map((s) => s.btn), { autoAlpha: 1, duration: reduced ? 0.2 : 0.6, stagger: reduced ? 0 : 0.15, ease: 'power2.out' });
  }

  function hide() {
    gsap.to(spots.map((s) => s.btn), { autoAlpha: 0, duration: reduced ? 0.2 : 0.3 });
  }

  // Place every hotspot on screen: undo the shader's parallax shift, then project from 3D
  function update({ plate, camera, width, height, look, amt }) {
    if (!plate.art) return;
    const zoom = 1 - 0.07 * amt;
    spots.forEach(({ h, wrap }) => {
      const [x, yTop] = h.uv;
      const depth = plate.art.depthAt(x, yTop);
      const ox = look.x * (depth - 0.5) * 0.05 * amt;
      const oy = look.y * (depth - 0.5) * 0.05 * amt;
      const su = (x - ox - 0.5) / zoom + 0.5;
      const sv = (1 - yTop - oy - 0.5) / zoom + 0.5;
      v3.set(plate.group.position.x + (su - 0.5) * PHOTO_W, plate.group.position.y + (sv - 0.5) * PHOTO_H, plate.group.position.z);
      v3.project(camera);
      wrap.style.transform = `translate3d(${((v3.x * 0.5 + 0.5) * width).toFixed(1)}px,${((-v3.y * 0.5 + 0.5) * height).toFixed(1)}px,0)`;
    });
  }

  function open(key, trigger) {
    const p = PILLARS.find((x) => x.key === key);
    const x = (d.dispatches || {})[key] || {};
    const first = !opened.has(key);
    if (first) {
      opened.add(key);
      trigger.classList.add('is-read');
    }
    inner.innerHTML = `<p class="kicker">Dispatch ${p.n}: ${esc(p.label)}</p>
      <h2 id="panel-title" class="panel__title">${text(x.title, 'Dispatch title')}</h2>
      <div class="prose">${paras(bodyFor(d, key), 'Body copy, 120 to 200 words')}</div>
      ${dispatchExtras(key, x)}
      <a class="panel__more" href="/destinations/${d.slug}#h-${key}" data-link>Read the full dispatch \u2197</a>`;
    lastTrigger = trigger;
    openKey = key;
    panel.removeAttribute('inert');
    panel.setAttribute('aria-hidden', 'false');
    panel.scrollTop = 0;
    gsap.fromTo(panel,
      { autoAlpha: 0, x: reduced || mobile.matches ? 0 : 40, y: reduced || !mobile.matches ? 0 : 40 },
      { autoAlpha: 1, x: 0, y: 0, duration: reduced ? 0.2 : 0.6, ease: 'power2.out' });
    panel.querySelector('.panel__close').focus({ preventScroll: true });
    onOpen(key, first);
  }

  function close(instant = false) {
    if (!openKey) return;
    openKey = null;
    panel.setAttribute('inert', '');
    panel.setAttribute('aria-hidden', 'true');
    gsap.to(panel, { autoAlpha: 0, duration: instant || reduced ? 0.1 : 0.4 });
    if (!instant && lastTrigger) lastTrigger.focus({ preventScroll: true });
    onClosed();
  }

  panel.querySelector('.panel__close').addEventListener('click', () => close());
  const onKey = (e) => {
    if (e.key !== 'Escape' || !openKey) return;
    if (document.querySelector('.finale.is-open')) return;
    e.stopPropagation();
    close();
  };
  document.addEventListener('keydown', onKey, true);

  return {
    mount, show, hide, update, close,
    isOpen: () => !!openKey,
    focusFirst: () => spots[0] && spots[0].btn.focus({ preventScroll: true }),
    destroy() {
      document.removeEventListener('keydown', onKey, true);
      gsap.killTweensOf(panel);
      panel.remove();
    },
  };
}
