import gsap from 'gsap';
import { CHAPTERS } from './chapters.js';

const KEY = 'ww-stamps';
const pad2 = (n) => String(n).padStart(2, '0');

// Every stamp on the journey: boarding, the punched ticket, then one per city
export const STAMPS = [
  { id: 'window', label: 'Window Seat', sub: 'Boarded', color: '#2E3A6B' },
  { id: 'ticket', label: 'Ticket Punched', sub: 'All aboard', color: '#B5523B' },
  ...CHAPTERS.map((c) => ({ id: c.id, label: c.name, sub: c.tagline, color: c.accent })),
];

export function stampSVG(s) {
  const id = `sp-${s.id}-${Math.random().toString(36).slice(2, 8)}`;
  const label = s.label.toUpperCase();
  return `<svg class="stamp" viewBox="0 0 120 120" style="--stamp:${s.color}" aria-hidden="true">
    <defs><path id="${id}" d="M60,60 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" /></defs>
    <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="3" />
    <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" stroke-width="1" />
    <circle cx="60" cy="60" r="30" fill="none" stroke="currentColor" stroke-width="1.5" />
    <text font-family="Inter" font-weight="700" font-size="9" letter-spacing="1.6" fill="currentColor"><textPath href="#${id}">${label} · WANDERWORDS ·</textPath></text>
    <text x="60" y="60" text-anchor="middle" font-family="Cormorant Garamond" font-style="italic" font-size="17" fill="currentColor">${s.label.split(' ')[0]}</text>
    <text x="60" y="75" text-anchor="middle" font-family="Inter" font-weight="700" font-size="7" letter-spacing="1.5" fill="currentColor">2026</text>
  </svg>`;
}

export class Stamps {
  constructor(counter, layer) {
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { saved = []; }
    this.have = new Set(saved.filter((id) => STAMPS.some((s) => s.id === id)));
    this.counter = counter;
    this.layer = layer;
    this.shown = { v: this.have.size };
    this.render();
  }

  get count() { return this.have.size; }
  has(id) { return this.have.has(id); }
  list() { return STAMPS.filter((s) => this.have.has(s.id)); }

  render() {
    this.counter.querySelector('.stamps__num').textContent = `${pad2(Math.round(this.shown.v))} / ${pad2(STAMPS.length)}`;
  }

  renderPassport(el) {
    el.innerHTML = STAMPS.map((s) =>
      `<div class="passport__slot" title="${s.label}">${this.has(s.id) ? stampSVG(s) : `<span>${s.label}</span>`}</div>`).join('');
  }

  // Thump a stamp onto the screen, then fly it into the counter
  award(id, onThud) {
    const s = STAMPS.find((x) => x.id === id);
    if (!s || this.have.has(id)) return Promise.resolve(false);
    this.have.add(id);
    try { localStorage.setItem(KEY, JSON.stringify([...this.have])); } catch { /* private mode */ }
    const el = document.createElement('div');
    el.className = 'stamp-fly';
    el.innerHTML = `${stampSVG(s)}<p class="stamp-fly__label">${s.label}<span>${s.sub}</span></p>`;
    this.layer.appendChild(el);
    const centre = (r) => [r.left + r.width / 2, r.top + r.height / 2];
    return new Promise((resolve) => {
      gsap.timeline({ onComplete: () => { el.remove(); this.counter.classList.remove('is-bump'); resolve(true); } })
        .set(el, { xPercent: -50, yPercent: -50 })
        .fromTo(el, { scale: 2.4, rotate: -24, autoAlpha: 0 }, { scale: 1, rotate: -8, autoAlpha: 1, duration: 0.35, ease: 'power4.in' })
        .add(() => onThud && onThud())
        .fromTo(el, { y: 0 }, { y: 4, duration: 0.06, yoyo: true, repeat: 3 })
        .to(el.querySelector('.stamp-fly__label'), { autoAlpha: 0, duration: 0.3 }, '+=0.9')
        .to(el, {
          x: () => centre(this.counter.getBoundingClientRect())[0] - centre(el.getBoundingClientRect())[0],
          y: () => centre(this.counter.getBoundingClientRect())[1] - centre(el.getBoundingClientRect())[1],
          scale: 0.2, autoAlpha: 0, duration: 0.8, ease: 'power3.in',
        })
        .add(() => this.counter.classList.add('is-bump'), '-=0.2')
        .to(this.shown, { v: this.have.size, duration: 0.6, ease: 'power2.out', onUpdate: () => this.render() }, '-=0.2');
    });
  }
}
