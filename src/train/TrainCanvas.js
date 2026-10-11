// TrainCanvas: everything about the train layer, behind one small interface.
// The rest of the app (journey.js) only calls these methods.
//
//   show() / hide() / pause() / resume()      layer control
//   intro() / ride(stop) / skipRide()         the journey between stops, with captions
//   pushThrough(stop) / pullBack(stop)        the camera moves through the train window
//
// Layer stack: #webgl (z-index 1), #trainContainer (z-index 5), destination HTML (z-index 10).
//
// Today the cabin view is the looping train video, and the push-through is a camera-style scale
// towards the window. The WebGL train scene plugs in through attachEngine(): once an Engine with a
// train view is attached, pause()/resume() also stop and start its render loop, and pushThrough()
// and pullBack() are where the 3D camera dolly goes. Nothing outside this file has to change.
import gsap from 'gsap';

const PUSH_SCALE = 1.35;

export class TrainCanvas {
  constructor({ canvas, container, video, overlay, captionEl, skipBtn, onCaption = () => {} }) {
    this.canvas = canvas;
    this.container = container;
    this.video = video;
    this.overlay = overlay;
    this.captionEl = captionEl;
    this.skipBtn = skipBtn;
    this.onCaption = onCaption;
    this.engine = null; // the WebGL engine, once attached
    this.tl = null;
    this._done = null;
    this.pushed = false; // true while the camera is at the window
    if (this.video) gsap.set(this.video, { transformOrigin: '50% 55%' });
  }

  attachEngine(engine) {
    this.engine = engine;
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

  // Hide and pause everything while an HTML destination page is on screen
  pause() {
    this._kill();
    if (this.video) this.video.pause();
    if (this.engine) this.engine.paused = true;
    gsap.set(this.container, { autoAlpha: 0 });
  }

  // Wake up underneath the page. If the page was opened directly (a link, the index),
  // the camera is first placed at the window, so the pull-back has somewhere to start.
  resume() {
    if (!this.pushed && this.video) gsap.set(this.video, { scale: PUSH_SCALE });
    this.pushed = true;
    gsap.set(this.container, { autoAlpha: 1 });
    gsap.set(this.overlay, { autoAlpha: 0 });
    if (this.engine) this.engine.paused = false;
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

  // ---- Through the window and back ----

  // The camera pushes through the window until the exterior fills the viewport
  pushThrough() {
    this._kill();
    this.caption('');
    this.pushed = true;
    return new Promise((resolve) => {
      gsap.timeline({ onComplete: resolve })
        .to(this.overlay, { autoAlpha: 0, duration: 0.4 }, 0)
        .to(this.video, { scale: PUSH_SCALE, duration: 1.6, ease: 'power2.in' }, 0);
    });
  }

  // The camera pulls back from the window into the cabin
  pullBack() {
    return new Promise((resolve) => {
      gsap.timeline({ onComplete: () => { this.pushed = false; resolve(); } })
        .to(this.video, { scale: 1, duration: 1.4, ease: 'power2.out' }, 0);
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
