import gsap from 'gsap';

// Small gesture helpers. Each returns a cleanup function.
const RING = 2 * Math.PI * 52; // circumference of the r=52 progress ring
const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'];

// Press and hold: fills the element's .hold__fill ring; releasing early drains it
export function holdGesture(el, { duration = 1.6, onProgress, onRelease, onDone }) {
  const fill = el.querySelector('.hold__fill');
  gsap.set(fill, { strokeDasharray: RING, strokeDashoffset: RING });
  let finished = false, holding = false;
  const tw = gsap.to(fill, {
    strokeDashoffset: 0, duration, ease: 'none', paused: true,
    onUpdate: () => onProgress && onProgress(tw.progress()),
    onComplete: () => {
      finished = true;
      el.classList.remove('is-holding');
      stop();
      if (onDone) onDone();
    },
  });
  const down = (e) => {
    if (finished) return;
    if (e.cancelable) e.preventDefault();
    holding = true;
    el.classList.add('is-holding');
    tw.timeScale(1).play();
  };
  const up = () => {
    if (finished || !holding) return;
    holding = false;
    el.classList.remove('is-holding');
    tw.timeScale(2.5).reverse();
    if (onRelease) onRelease();
  };
  const key = (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (e.type === 'keydown' && !e.repeat) down(e);
    else if (e.type === 'keyup') up();
  };
  const noMenu = (e) => e.preventDefault();
  el.addEventListener('pointerdown', down);
  el.addEventListener('keydown', key);
  el.addEventListener('keyup', key);
  el.addEventListener('contextmenu', noMenu);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  function stop() {
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('keydown', key);
    el.removeEventListener('keyup', key);
    el.removeEventListener('contextmenu', noMenu);
    removeEventListener('pointerup', up);
    removeEventListener('pointercancel', up);
  }
  return () => { stop(); tw.kill(); };
}

// Shared pointer tracking for rub and spin
function track(el, { onDown, onMove, onKey }) {
  let active = false;
  const down = (e) => {
    active = true;
    try { el.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    el.classList.add('is-active');
    onDown(e);
  };
  const move = (e) => { if (active) onMove(e); };
  const up = () => { active = false; el.classList.remove('is-active'); };
  const key = (e) => { if (KEYS.includes(e.key)) { e.preventDefault(); onKey(); } };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('keydown', key);
  return () => {
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
    el.removeEventListener('keydown', key);
  };
}

// Rub or swipe: accumulate pointer travel. axis 'x' | 'y' (downwards only) | undefined (any)
export function rubGesture(el, { distance = 2400, axis, onProgress, onDone }) {
  const need = (distance * Math.min(innerWidth, innerHeight)) / 800;
  let last = null, total = 0, finished = false;
  const add = (d) => {
    if (finished) return;
    total += d;
    const p = Math.min(1, total / need);
    if (onProgress) onProgress(p);
    if (p >= 1) { finished = true; stop(); if (onDone) onDone(); }
  };
  const stop = track(el, {
    onDown: (e) => (last = [e.clientX, e.clientY]),
    onMove: (e) => {
      const dx = e.clientX - last[0], dy = e.clientY - last[1];
      last = [e.clientX, e.clientY];
      add(axis === 'y' ? Math.max(0, dy) : axis === 'x' ? Math.abs(dx) : Math.hypot(dx, dy));
    },
    onKey: () => add(need / 8),
  });
  return stop;
}

// Spin: accumulate angle around the element's centre (either direction)
export function spinGesture(el, { turns = 2, onAngle, onProgress, onDone }) {
  const need = turns * Math.PI * 2;
  let lastA = 0, total = 0, signed = 0, finished = false;
  const angle = (e) => {
    const r = el.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  };
  const add = (d) => {
    if (finished) return;
    signed += d;
    total += Math.abs(d);
    if (onAngle) onAngle(signed);
    const p = Math.min(1, total / need);
    if (onProgress) onProgress(p);
    if (p >= 1) { finished = true; stop(); if (onDone) onDone(); }
  };
  const stop = track(el, {
    onDown: (e) => (lastA = angle(e)),
    onMove: (e) => {
      const a = angle(e);
      let d = a - lastA;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      lastA = a;
      add(d);
    },
    onKey: () => add(Math.PI / 4),
  });
  return stop;
}
