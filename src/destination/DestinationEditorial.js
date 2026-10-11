// DestinationEditorial: a destination as a premium, smooth-scrolling HTML page.
// It is a fixed, scrollable layer (z-index 10) that fades in over the train and fades out again.
// Smooth scrolling comes from Lenis, parallax and text reveals from GSAP ScrollTrigger.
// It knows nothing about the train: journey.js tells it when to open and close.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { renderEditorial } from './template.js';

gsap.registerPlugin(ScrollTrigger);

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Every stop picks one of these. CSS gives each its own hero, gallery and food layout.
const LAYOUTS = ['a', 'b', 'c'];

const tween = (target, vars) => new Promise((resolve) => gsap.to(target, { ...vars, onComplete: resolve }));

export class DestinationEditorial {
  constructor({ root, chapters, onNext }) {
    this.root = root;
    this.chapters = chapters;
    this.onNext = onNext;
    this.ctx = null;
    this.lenis = null;
    this.tick = null;
    gsap.set(root, { autoAlpha: 0 });
    root.setAttribute('inert', ''); // closed
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-next-stop]')) this.onNext();
    });
  }

  async open(chapter, index) {
    const root = this.root;
    this.teardown();
    root.innerHTML = renderEditorial(chapter, index, this.chapters);
    root.dataset.layout = LAYOUTS[index % LAYOUTS.length];
    root.style.setProperty('--stop-accent', chapter.accent);
    root.scrollTop = 0;
    root.removeAttribute('inert');

    if (!REDUCED) {
      this.lenis = new Lenis({ wrapper: root, content: root.querySelector('.ed'), lerp: 0.1 });
      this.lenis.on('scroll', ScrollTrigger.update);
      this.tick = (t) => this.lenis.raf(t * 1000);
      gsap.ticker.add(this.tick);
    }
    this.ctx = gsap.context(() => this.animate(), root);

    await tween(root, { autoAlpha: 1, duration: REDUCED ? 0.2 : 0.9, ease: 'power2.out' });
    ScrollTrigger.refresh();
    const title = root.querySelector('.ed-hero__title');
    if (title) title.focus({ preventScroll: true });
  }

  async close() {
    await tween(this.root, { autoAlpha: 0, duration: REDUCED ? 0.15 : 0.7, ease: 'power2.inOut' });
    this.root.setAttribute('inert', '');
    this.teardown();
    this.root.innerHTML = '';
  }

  // Parallax and reveals. With reduced motion the page is simply shown, unanimated.
  animate() {
    if (REDUCED) return;
    const scroller = this.root;
    const all = (sel) => gsap.utils.toArray(sel, this.root);

    gsap.from('.ed-hero__eyebrow, .ed-hero__title, .ed-hero__tag', { autoAlpha: 0, y: 40, duration: 1.2, stagger: 0.12, ease: 'expo.out', delay: 0.5 });
    gsap.to('.ed-hero__img', {
      yPercent: 16, scale: 1.1, ease: 'none',
      scrollTrigger: { trigger: '.ed-hero', scroller, start: 'top top', end: 'bottom top', scrub: true },
    });
    all('[data-reveal]').forEach((el) => gsap.from(el, {
      autoAlpha: 0, y: 48, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: el, scroller, start: 'top 86%', once: true },
    }));
    all('[data-parallax]').forEach((el) => {
      const s = parseFloat(el.dataset.parallax) || 8;
      gsap.fromTo(el, { yPercent: -s }, {
        yPercent: s, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, scroller, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    gsap.to('.ed-progress__bar', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { scroller, start: 0, end: 'max', scrub: 0.3 },
    });
  }

  teardown() {
    if (this.ctx) { this.ctx.revert(); this.ctx = null; }
    if (this.tick) { gsap.ticker.remove(this.tick); this.tick = null; }
    if (this.lenis) { this.lenis.destroy(); this.lenis = null; }
    ScrollTrigger.getAll().forEach((t) => t.kill());
  }
}
