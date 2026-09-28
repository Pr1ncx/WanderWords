import gsap from 'gsap';

// Sound: one looping bed at a time (the journey, or the current city), crossfaded, plus one-shot effects.
// Every file is optional. A missing city bed falls back to the journey bed; a missing effect stays silent.
const JOURNEY = '/audio/ambient.mp3';
const BED_VOLUME = 0.4;

export class Soundscape {
  constructor() {
    this.on = false;
    this.want = JOURNEY;
    this.beds = new Map();
    this.shots = new Map();
  }

  bed(src) {
    let b = this.beds.get(src);
    if (!b) {
      const el = new Audio();
      el.loop = true;
      el.preload = 'none';
      el.volume = 0;
      b = { el, level: { v: 0 }, failed: false };
      el.addEventListener('error', () => {
        b.failed = true;
        if (this.want === src) this.apply();
      });
      el.src = src;
      this.beds.set(src, b);
    }
    return b;
  }

  // A city bed, or null for the journey bed
  setBed(src) {
    this.want = src || JOURNEY;
    this.apply();
  }

  setEnabled(on) {
    this.on = on;
    this.apply();
  }

  apply() {
    this.bed(JOURNEY);
    const src = this.bed(this.want).failed ? JOURNEY : this.want;
    for (const [key, b] of this.beds) {
      const target = this.on && key === src && !b.failed ? BED_VOLUME : 0;
      if (target) b.el.play().catch(() => {});
      gsap.to(b.level, {
        v: target, duration: target ? 2.4 : 1.2, ease: 'sine.inOut', overwrite: true,
        onUpdate: () => (b.el.volume = b.level.v),
        onComplete: () => { if (!target) b.el.pause(); },
      });
    }
  }

  // Plays the first available file, e.g. play('/audio/goa-swell.mp3', '/audio/swell.mp3')
  play(...srcs) {
    if (!this.on) return;
    const [src, ...rest] = srcs.filter((s) => !(this.shots.get(s) || {}).failed);
    if (!src) return;
    let a = this.shots.get(src);
    if (!a) {
      a = new Audio(src);
      a.preload = 'auto';
      a.failed = false;
      this.shots.set(src, a);
    }
    a.onerror = () => {
      a.failed = true;
      if (rest.length) this.play(...rest);
    };
    a.currentTime = 0;
    a.play().catch(() => {});
  }
}
