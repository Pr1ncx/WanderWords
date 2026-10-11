// The Dial: a hairline 24-hour radial dial. Drag (or use arrow keys) to turn the hand.
// It detents every 15 minutes with a synthesised tick. The photograph above is re-graded as the
// hour changes. Releasing the hand within tolerance of the chapter's hour locks it.
// Works with the keyboard (role=slider) and never blocks: after ~45s a quiet "Show me" appears,
// and Skip is always there.
import gsap from 'gsap';

const IDLE_MS = 45000;
const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const norm = (m) => ((Math.round(m / 15) * 15) % 1440 + 1440) % 1440;

function faceSvg() {
  let ticks = '';
  for (let i = 0; i < 96; i++) {
    const m = i * 15, a = (m / 1440) * Math.PI * 2;
    const major = m % 360 === 0, hour = m % 60 === 0;
    const r2 = major ? 112 : hour ? 120 : 126;
    ticks += `<line class="t${major ? ' t--major' : hour ? ' t--hour' : ''}" x1="${(Math.sin(a) * 131).toFixed(2)}" y1="${(-Math.cos(a) * 131).toFixed(2)}" x2="${(Math.sin(a) * r2).toFixed(2)}" y2="${(-Math.cos(a) * r2).toFixed(2)}"/>`;
  }
  const labels = [[0, '00'], [360, '06'], [720, '12'], [1080, '18']].map(([m, s]) => {
    const a = (m / 1440) * Math.PI * 2;
    return `<text x="${(Math.sin(a) * 98).toFixed(1)}" y="${(-Math.cos(a) * 98 + 4).toFixed(1)}" text-anchor="middle">${s}</text>`;
  }).join('');
  return `<svg viewBox="-140 -140 280 280" aria-hidden="true"><circle class="ring" r="134"/>${ticks}${labels}<g data-hand><line x1="0" y1="0" x2="0" y2="-92"/><circle cx="0" cy="-92" r="3.5"/></g><circle class="hub" r="2.5"/></svg>`;
}

export function createDial(ui, { reduced, audio, onChange, onCommit, onShowMe, onSkip, onNext }) {
  const wrap = document.createElement('section');
  wrap.className = 'dial';
  wrap.setAttribute('aria-label', 'The hour');
  wrap.innerHTML = `
    <p class="dial__line" data-line aria-live="polite"></p>
    <div class="dial__face" data-face role="slider" tabindex="0" aria-label="Hour dial. Arrow keys move by fifteen minutes, Page Up and Page Down by an hour." aria-valuemin="0" aria-valuemax="1439" aria-valuenow="720" aria-valuetext="12:00">${faceSvg()}</div>
    <p class="dial__read" data-read aria-hidden="true">12:00</p>
    <div class="dial__row" data-row>
      <button class="link-btn dial__showme" type="button" data-showme>Show me</button>
      <button class="link-btn" type="button" data-skip>Skip</button>
    </div>
    <p class="dial__caption" data-caption aria-live="polite"></p>
    <button class="cta" type="button" data-next>Next chapter \u2192</button>`;
  ui.querySelector('.hud').append(wrap);

  const q = (s) => wrap.querySelector(s);
  const el = { line: q('[data-line]'), face: q('[data-face]'), hand: q('[data-hand]'), read: q('[data-read]'), row: q('[data-row]'), showme: q('[data-showme]'), skip: q('[data-skip]'), caption: q('[data-caption]'), next: q('[data-next]') };
  gsap.set(wrap, { autoAlpha: 0 });
  wrap.setAttribute('inert', '');
  gsap.set(el.showme, { autoAlpha: 0 });

  let value = 720, locked = false, dragging = false, visible = false;
  let idleT = null, keyT = null, flashT = null;

  function paint() {
    el.hand.setAttribute('transform', `rotate(${(value / 1440) * 360})`);
    el.read.textContent = fmt(value);
    el.face.setAttribute('aria-valuenow', String(value));
    el.face.setAttribute('aria-valuetext', fmt(value));
  }

  function setValue(m, { silent = false } = {}) {
    const v = norm(m);
    if (v === value) return;
    value = v;
    paint();
    if (!silent) audio.tick();
    onChange(value);
  }

  // Any interaction restarts the idle timer and hides "Show me"
  function poke() {
    clearTimeout(idleT);
    gsap.to(el.showme, { autoAlpha: 0, duration: 0.3 });
    if (locked || !visible) return;
    idleT = setTimeout(() => {
      if (!locked && visible) gsap.to(el.showme, { autoAlpha: 1, duration: 0.8 });
    }, IDLE_MS);
  }

  function fromPointer(e) {
    const r = el.face.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    setValue((deg / 360) * 1440);
  }

  el.face.addEventListener('pointerdown', (e) => {
    if (locked) return;
    dragging = true;
    el.face.setPointerCapture(e.pointerId);
    fromPointer(e);
    poke();
  });
  el.face.addEventListener('pointermove', (e) => { if (dragging) fromPointer(e); });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    onCommit(value);
  };
  el.face.addEventListener('pointerup', end);
  el.face.addEventListener('pointercancel', end);

  el.face.addEventListener('keydown', (e) => {
    if (locked) return;
    const step = { ArrowRight: 15, ArrowUp: 15, ArrowLeft: -15, ArrowDown: -15, PageUp: 60, PageDown: -60 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    setValue(value + step);
    poke();
    clearTimeout(keyT);
    keyT = setTimeout(() => onCommit(value), 900); // settle on a keyboard hour after a short pause
  });

  el.showme.addEventListener('click', () => { poke(); onShowMe(); });
  el.skip.addEventListener('click', () => onSkip());
  el.next.addEventListener('click', () => onNext());

  const reveal = () => {
    visible = true;
    wrap.removeAttribute('inert');
    gsap.fromTo(wrap, { autoAlpha: 0, y: reduced ? 0 : 20 }, { autoAlpha: 1, y: 0, duration: reduced ? 0.2 : 0.8, ease: 'power2.out' });
  };

  return {
    get value() { return value; },
    // Show the puzzle, starting at the given hour
    show(startMin) {
      locked = false;
      el.face.removeAttribute('aria-disabled');
      el.face.style.display = '';
      el.read.style.display = '';
      el.row.style.display = '';
      el.caption.textContent = '';
      gsap.set(el.next, { autoAlpha: 0 });
      el.next.style.display = 'none';
      el.line.textContent = 'One last thing. Find the hour.';
      value = -1;
      setValue(startMin, { silent: true });
      reveal();
      poke();
    },
    // Re-entering a solved chapter: no puzzle, just the caption and the way on
    showSolved(caption) {
      locked = true;
      el.face.style.display = 'none';
      el.read.style.display = 'none';
      el.row.style.display = 'none';
      el.line.textContent = '';
      el.caption.textContent = caption;
      el.next.style.display = '';
      gsap.set(el.next, { autoAlpha: 1 });
      reveal();
    },
    hide() {
      visible = false;
      clearTimeout(idleT);
      clearTimeout(keyT);
      clearTimeout(flashT);
      wrap.setAttribute('inert', '');
      gsap.to(wrap, { autoAlpha: 0, duration: reduced ? 0.1 : 0.4 });
    },
    // Short message under the dial, e.g. after a wrong hour
    flash(msg) {
      el.line.textContent = msg;
      clearTimeout(flashT);
      flashT = setTimeout(() => { if (!locked) el.line.textContent = 'One last thing. Find the hour.'; }, 3500);
    },
    // Animate the hand to the answer, then call done (used by "Show me")
    animateTo(target, done) {
      if (reduced) { setValue(target, { silent: true }); done(); return; }
      const from = value;
      let delta = target - from;
      if (delta > 720) delta -= 1440;
      if (delta < -720) delta += 1440;
      const o = { v: 0 };
      gsap.to(o, {
        v: 1, duration: 1.6, ease: 'power2.inOut',
        onUpdate: () => setValue(from + delta * o.v, { silent: true }),
        onComplete: () => { setValue(target, { silent: true }); done(); },
      });
    },
    // The hour is found: lock, caption, and the button to move on
    lock(caption) {
      locked = true;
      dragging = false;
      clearTimeout(idleT);
      clearTimeout(keyT);
      clearTimeout(flashT);
      el.face.setAttribute('aria-disabled', 'true');
      el.line.textContent = '';
      el.caption.textContent = caption;
      gsap.to(el.showme, { autoAlpha: 0, duration: 0.2 });
      el.row.style.display = 'none';
      el.next.style.display = '';
      gsap.fromTo(el.next, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? 0.2 : 0.8, delay: reduced ? 0 : 0.4 });
      el.next.focus({ preventScroll: true });
    },
    destroy() {
      clearTimeout(idleT);
      clearTimeout(keyT);
      clearTimeout(flashT);
      gsap.killTweensOf([wrap, el.showme, el.next]);
      wrap.remove();
    },
  };
}
