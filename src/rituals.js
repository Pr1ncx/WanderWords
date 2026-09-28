import gsap from 'gsap';
import { holdGesture, rubGesture, spinGesture } from './gestures.js';

// One small ritual per city. Completing it earns that city's passport stamp.
export const RITUALS = {
  srinagar: { verb: 'Ripple the lake', hint: 'Drag across the water', type: 'rub', icon: 'wave' },
  manali: { verb: 'Brush off the snow', hint: 'Rub to clear it', type: 'rub', icon: 'snow' },
  amritsar: { verb: 'Light the diya', hint: 'Press + hold', type: 'hold', icon: 'diya', grade: '#E0B040' },
  jaipur: { verb: 'Open the jharokha', hint: 'Tap both shutters', type: 'taps', count: 2, icon: 'shutter' },
  agra: { verb: 'Set the inlay', hint: 'Trace a circle around it', type: 'spin', turns: 1, icon: 'inlay' },
  goa: { verb: 'Bring down the sun', hint: 'Drag downwards', type: 'rub', axis: 'y', icon: 'sun', grade: '#E36F3C' },
  munnar: { verb: 'Two leaves and a bud', hint: 'Tap all three', type: 'taps', count: 3, icon: 'leaf' },
  gangtok: { verb: 'Spin the prayer wheel', hint: 'Drag in circles', type: 'spin', turns: 2, icon: 'wheel' },
  kutch: { verb: 'Wait for the full moon', hint: 'Press + hold', type: 'hold', icon: 'moon', grade: '#C9D6E6' },
  shillong: { verb: 'Drop the needle', hint: 'Tap the record', type: 'taps', count: 1, icon: 'record' },
};

const ICONS = {
  diya: '<path d="M8 36 Q32 60 56 36 Z" /><path d="M32 30 C25 22 31 14 32 6 C33 14 39 22 32 30 Z" />',
  wave: '<path d="M6 24 q7 -8 13 0 t13 0 t13 0 t13 0" /><path d="M6 36 q7 -8 13 0 t13 0 t13 0 t13 0" /><path d="M6 48 q7 -8 13 0 t13 0 t13 0 t13 0" />',
  snow: '<path d="M32 6 V58 M9 19 L55 45 M9 45 L55 19" /><path d="M26 10 L32 16 L38 10 M26 54 L32 48 L38 54" />',
  shutter: '<path d="M14 58 V24 A18 18 0 0 1 50 24 V58 Z" /><path d="M32 8 V58 M14 34 H50 M14 46 H50" />',
  inlay: '<circle cx="32" cy="32" r="6" /><ellipse cx="32" cy="15" rx="5" ry="10" /><ellipse cx="32" cy="49" rx="5" ry="10" /><ellipse cx="15" cy="32" rx="10" ry="5" /><ellipse cx="49" cy="32" rx="10" ry="5" />',
  sun: '<circle cx="32" cy="28" r="12" /><path d="M6 46 H58 M12 54 H52 M32 6 V10 M14 12 L17 15 M50 12 L47 15" />',
  leaf: '<path d="M32 58 C10 40 14 16 32 6 C50 16 54 40 32 58 Z" /><path d="M32 58 V14" />',
  wheel: '<rect x="18" y="14" width="28" height="36" rx="4" /><path d="M18 24 H46 M18 40 H46 M32 6 V14 M32 50 V58" />',
  moon: '<circle cx="32" cy="32" r="20" /><circle cx="25" cy="27" r="3" /><circle cx="38" cy="38" r="4" />',
  record: '<circle cx="32" cy="32" r="24" /><circle cx="32" cy="32" r="16" /><circle cx="32" cy="32" r="6" /><path d="M52 6 L40 26" />',
};

const icon = (name) =>
  `<svg class="ritual__icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
const RING = '<svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="hold__track" cx="60" cy="60" r="52" /><circle class="hold__fill" cx="60" cy="60" r="52" /></svg>';
const CIRC = 2 * Math.PI * 52;

function ringSetter(el) {
  const fill = el.querySelector('.hold__fill');
  gsap.set(fill, { strokeDasharray: CIRC, strokeDashoffset: CIRC });
  return (p) => gsap.to(fill, { strokeDashoffset: CIRC * (1 - p), duration: 0.2, overwrite: true });
}

// Opens the ritual overlay for a chapter. onFinish(completed) is called exactly once.
export function openRitual(ch, { onFinish }) {
  const def = RITUALS[ch.id];
  if (!def) return null;
  const root = document.querySelector('#ritual');
  const stage = root.querySelector('.ritual__stage');
  root.querySelector('.ritual__verb').textContent = def.verb;
  root.querySelector('.ritual__hint').textContent = def.hint;
  let stop = () => {};
  let closed = false;

  const close = (completed) => {
    if (closed) return;
    closed = true;
    stop();
    gsap.to(root, { autoAlpha: 0, duration: 0.4, delay: completed ? 0.5 : 0, onComplete: () => (stage.innerHTML = '') });
    onFinish(completed);
  };
  const finish = () => {
    gsap.to(stage.children, { scale: 1.15, autoAlpha: 0, duration: 0.6, ease: 'power2.out', stagger: 0.05 });
    close(true);
  };

  if (def.type === 'hold') {
    stage.innerHTML = `<button class="hold hold--ritual" aria-label="${def.verb}: press and hold">${RING}${icon(def.icon)}</button>`;
    const btn = stage.firstElementChild;
    stop = holdGesture(btn, { duration: 2, onProgress: (p) => btn.style.setProperty('--glow', p.toFixed(3)), onDone: finish });
  } else if (def.type === 'rub' || def.type === 'spin') {
    stage.innerHTML = `<div class="ritual__pad" tabindex="0" role="button" aria-label="${def.verb}">${RING}${icon(def.icon)}</div>`;
    const pad = stage.firstElementChild, set = ringSetter(pad), ic = pad.querySelector('.ritual__icon');
    if (def.type === 'rub') {
      stop = rubGesture(pad, {
        axis: def.axis,
        onProgress: (p) => { set(p); gsap.to(ic, { y: def.axis === 'y' ? p * 16 : 0, rotate: def.axis ? 0 : Math.sin(p * 24) * 8, duration: 0.2 }); },
        onDone: finish,
      });
    } else {
      stop = spinGesture(pad, { turns: def.turns, onAngle: (a) => gsap.set(ic, { rotate: (a * 180) / Math.PI }), onProgress: set, onDone: finish });
    }
    pad.focus({ preventScroll: true });
  } else {
    stage.innerHTML = Array.from({ length: def.count }, (_, k) =>
      `<button class="ritual__tap" aria-label="${def.verb} ${k + 1} of ${def.count}">${icon(def.icon)}</button>`).join('');
    let left = def.count;
    stage.querySelectorAll('.ritual__tap').forEach((b) => {
      b.onclick = () => {
        if (closed || b.classList.contains('is-done')) return;
        b.classList.add('is-done');
        gsap.fromTo(b, { scale: 0.85 }, { scale: 1.08, duration: 0.5, ease: 'back.out(3)' });
        if (--left === 0) setTimeout(finish, 350);
      };
    });
  }

  root.querySelector('.ritual__skip').onclick = () => close(false);
  gsap.set(root, { autoAlpha: 1 });
  gsap.fromTo(root.querySelectorAll('.ritual__eyebrow, .ritual__verb, .ritual__stage, .ritual__hint, .ritual__skip'),
    { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.8, ease: 'expo.out' });
  return { def, close: () => close(false) };
}
