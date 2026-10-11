// The Index / Finale: a full-screen 24-hour clock face with all ten destinations at their hours.
// Hover or focus shows a thumbnail card; click jumps to the chapter or its Reader page.
// It can be opened at any time. When all ten hours are found it shows the closing line.
import gsap from 'gsap';
import { esc } from '../reader.js';

const angle = (m) => (m / 1440) * Math.PI * 2;

function faceSvg() {
  let t = '';
  for (let h = 0; h < 24; h++) {
    const a = angle(h * 60), major = h % 6 === 0, r2 = major ? 44 : 45;
    t += `<line class="t${major ? ' t--major' : ''}" x1="${(50 + Math.sin(a) * 47).toFixed(2)}" y1="${(50 - Math.cos(a) * 47).toFixed(2)}" x2="${(50 + Math.sin(a) * r2).toFixed(2)}" y2="${(50 - Math.cos(a) * r2).toFixed(2)}"/>`;
  }
  const labels = [[0, '00'], [360, '06'], [720, '12'], [1080, '18']].map(([m, s]) => {
    const a = angle(m);
    return `<text x="${(50 + Math.sin(a) * 41).toFixed(2)}" y="${(50 - Math.cos(a) * 41 + 1.2).toFixed(2)}" text-anchor="middle">${s}</text>`;
  }).join('');
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="ring" cx="50" cy="50" r="48"/>${t}${labels}</svg>`;
}

export function createFinale(root, { destinations, reduced, isSolved, thumb, onGo }) {
  const el = document.createElement('section');
  el.className = 'finale';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Index: ten places at their hours');
  el.setAttribute('inert', '');
  el.innerHTML = `
    <button class="link-btn finale__close" type="button" data-close>Close <span aria-hidden="true">Esc</span></button>
    <p class="finale__kicker">Index</p>
    <div class="finale__face">${faceSvg()}<ol class="finale__dots" data-dots></ol></div>
    <div class="finale__card" data-card aria-live="polite"></div>
    <p class="finale__line" data-line></p>`;
  root.append(el);
  gsap.set(el, { autoAlpha: 0 });

  const dotsEl = el.querySelector('[data-dots]');
  const card = el.querySelector('[data-card]');
  const line = el.querySelector('[data-line]');
  let open = false, returnFocus = null;

  // Dots sit on the clock face at their hour. Three radii keep neighbouring hours apart.
  const order = destinations.map((_d, i) => i).sort((a, b) => destinations[a].hourMinutes - destinations[b].hourMinutes);
  const radius = [40, 32, 24];
  const dots = destinations.map((d, i) => {
    const rank = order.indexOf(i), a = angle(d.hourMinutes), r = radius[rank % 3];
    const li = document.createElement('li');
    li.style.left = `${50 + Math.sin(a) * r}%`;
    li.style.top = `${50 - Math.cos(a) * r}%`;
    li.innerHTML = `<button class="dot" type="button" aria-label="${esc(d.name)}, ${esc(d.hour)}">${d.chapter}</button>`;
    const btn = li.querySelector('button');
    btn.addEventListener('pointerenter', () => showCard(i));
    btn.addEventListener('focus', () => showCard(i));
    btn.addEventListener('click', () => showCard(i));
    dotsEl.append(li);
    return btn;
  });

  function showCard(i) {
    const d = destinations[i], src = thumb(i);
    card.innerHTML = `${src ? `<img src="${esc(src)}" alt="" width="60" height="75">` : '<span class="finale__thumb" aria-hidden="true"></span>'}
      <div><p class="finale__name">${esc(d.name)}</p><p class="finale__hour"><time datetime="${esc(d.hour)}">${esc(d.hour)}</time>${isSolved(i) ? ' \u00b7 found' : ''}</p></div>
      <div class="finale__actions"><button class="link-btn" type="button" data-go="${i}">Enter chapter</button><a class="link-btn" href="/destinations/${esc(d.slug)}" data-link>Reader page \u2197</a></div>`;
    card.querySelector('[data-go]').addEventListener('click', () => { close(); onGo(i); });
  }

  function refresh() {
    const n = destinations.filter((_d, i) => isSolved(i)).length;
    dots.forEach((b, i) => b.classList.toggle('is-solved', isSolved(i)));
    line.textContent = n === destinations.length ? 'Every place has one hour. Which is yours?' : `${n} of ${destinations.length} hours found.`;
  }

  function focusables() {
    return [...el.querySelectorAll('button, a[href]')].filter((n) => n.offsetParent !== null);
  }

  function openIndex(from) {
    if (open) return;
    open = true;
    returnFocus = from || document.activeElement;
    refresh();
    showCard(0);
    el.classList.add('is-open');
    el.removeAttribute('inert');
    gsap.to(el, { autoAlpha: 1, duration: reduced ? 0.2 : 0.8, ease: 'power2.inOut' });
    el.querySelector('[data-close]').focus({ preventScroll: true });
  }

  function close() {
    if (!open) return;
    open = false;
    el.classList.remove('is-open');
    el.setAttribute('inert', '');
    gsap.to(el, { autoAlpha: 0, duration: reduced ? 0.1 : 0.5 });
    if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
  }

  el.querySelector('[data-close]').addEventListener('click', close);
  const onKey = (e) => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    // Keep keyboard focus inside the dialog
    const f = focusables();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKey);

  return {
    open: openIndex,
    close,
    isOpen: () => open,
    destroy() {
      document.removeEventListener('keydown', onKey);
      gsap.killTweensOf(el);
      el.remove();
    },
  };
}
