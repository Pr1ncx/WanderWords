// TrainCanvas: everything about the train layer, behind one small interface.
// The rest of the app (journey.js) only calls these methods.
//
//   show() / pause() / resume()               layer control
//   intro() / ride(stop) / skipRide()         the journey between stops, with captions
//   pushThrough(stop) / pullBack(stop)        the focus pull to and from a destination
//
// The train is a looping video (z-index 5, under the destination page at 10).
//
// Leaving the train for a destination is a FOCUS PULL, like a camera shifting focus from the
// background to the foreground: the video blurs and darkens while the HTML page fades in over it.
// There is deliberately no zoom: scaling a flat video only stretches its pixels.
// Coming back reverses it: the page fades out and the train comes back into focus.
import gsap from 'gsap';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SHARP = 'blur(0px) brightness(1)';
// Reduced motion keeps the darkening but drops the blur
const SOFT = REDUCED ? 'blur(0px) brightness(0.6)' : 'blur(20px) brightness(0.6)';

export class TrainCanvas {
  constructor({ container, video, overlay, captionEl, skipBtn, onCaption = () => {} }) {
    this.container = container;
    this.video = video;
    this.overlay = overlay;
    this.captionEl = captionEl;
    this.skipBtn = skipBtn;
    this.onCaption = onCaption;
    this.tl = null;
    this._done = null;
    this.soft = false; // true while the train is out of focus
  }

  // ---- Layer control ----

  // Visible but still: the cover and the loader sit on top of the first frame
  prepare() {
    gsap.set(this.container, { autoAlpha: 1 });
  }

  show() {
    gsap.to(this.container, { autoAlpha: 1, duration: 0.8 });
    this._play();
  }

  // Hide and pause the train while an HTML destination page is on screen
  pause() {
    this._kill();
    if (this.video) this.video.pause();
    gsap.set(this.container, { autoAlpha: 0 });
  }

  // Wake up underneath the page, still out of focus. If the page was opened directly
  // (a link, the index), the train is first put into soft focus so the return has a start.
  resume() {
    if (!this.soft) gsap.set(this.video, { filter: SOFT });
    this.soft = true;
    gsap.set(this.container, { autoAlpha: 1 });
    gsap.set(this.overlay, { autoAlpha: 0 });
    this._play();
    return Promise.resolve();
  }

  _play() {
    if (this.video) this.video.play().catch(() => {});
  }

  // ---- The ride ----

  // Runs a timeline. Resolves when it finishes or when skipRide() is called.
  _run(build) {
    this._kill();
    return new Promise((resolve) => {
      this._done = () => { this._kill(); resolve(); };
      this.tl = gsap.timeline();
      build(this.tl);
      this.tl.add(this._done);
    });
  }

  _kill() {
    if (this.tl) { this.tl.kill(); this.tl = null; }
    this._done = null;
  }

  skipRide() {
    if (this._done) this._done();
  }

  intro() {
    this.show();
    this.skipBtn.textContent = 'SKIP INTRO >';
    gsap.to(this.overlay, { autoAlpha: 1, duration: 1, delay: 0.6 });
    return this._run((tl) => tl
      .add(() => this.caption('A journey, ten stops.'), 1.6)
      .add(() => this.caption(''), 5.2)
      .to({}, { duration: 0.8 }, 5.2)); // hold until 6s
  }

  ride(stop, { first = false } = {}) {
    this.show();
    this.skipBtn.textContent = first ? 'SKIP INTRO >' : 'SKIP >';
    gsap.to(this.overlay, { autoAlpha: 1, duration: 0.6 });
    this.caption(`Next stop: ${stop.name}`);
    return this._run((tl) => tl.to({}, { duration: 4.5 }));
  }

  // ---- The focus pull ----

  // The train blurs and darkens. Resolves when it is soft; the page then fades in over it.
  pushThrough() {
    this._kill();
    this.caption('');
    this.soft = true;
    return new Promise((resolve) => {
      gsap.timeline({ onComplete: resolve })
        .to(this.overlay, { autoAlpha: 0, duration: 0.4 }, 0)
        .fromTo(this.video, { filter: SHARP }, { filter: SOFT, duration: REDUCED ? 0.4 : 1.4, ease: 'power2.inOut' }, 0);
    });
  }

  // The page is gone: the train comes back into focus. The filter is then removed entirely,
  // so the playing video costs nothing extra.
  pullBack() {
    return new Promise((resolve) => {
      gsap.to(this.video, {
        filter: SHARP, duration: REDUCED ? 0.3 : 1.2, ease: 'power2.out',
        onComplete: () => {
          gsap.set(this.video, { clearProps: 'filter' });
          this.soft = false;
          resolve();
        },
      });
    });
  }

  // ---- Captions ----
  caption(text) {
    const el = this.captionEl;
    gsap.to(el, {
      autoAlpha: 0, y: -8, duration: 0.4, overwrite: true,
      onComplete: () => {
        el.textContent = text;
        if (text) gsap.fromTo(el, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out' });
      },
    });
    this.onCaption(text);
  }
}
