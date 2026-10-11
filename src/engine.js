// Minimal three.js engine for the immersive experience.
// One full-viewport canvas, one scene, one camera.
import * as THREE from 'three';

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    // Throws if a WebGL context cannot be created. The caller falls back to Reader Mode.
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    // Cap the pixel ratio so phones do not render at 3x
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
    this.renderer.setClearColor(0x0c0a09, 1); // --ink

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(0, 0, 8);

    this.onLost = null; // set by the experience: called if the WebGL context is lost
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      if (this.onLost) this.onLost();
    });

    this.updaters = new Set(); // functions called every frame: fn(dt, t)
    this.clock = new THREE.Clock();
    this.running = false; // is the loop active right now
    this.wanted = false; // should it run whenever the tab is visible

    this._loop = this._loop.bind(this);
    this._onVisibility = () => {
      // Pause rendering when the tab is hidden
      if (document.hidden) this._halt();
      else if (this.wanted) this.start();
    };
    document.addEventListener('visibilitychange', this._onVisibility);
    this._resize = () => this.resize();
    window.addEventListener('resize', this._resize);
    if ('ResizeObserver' in window) {
      this._ro = new ResizeObserver(this._resize);
      this._ro.observe(canvas);
    }
    this.resize();
  }

  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // Register a per-frame function. Returns a function that removes it.
  onUpdate(fn) {
    this.updaters.add(fn);
    return () => this.updaters.delete(fn);
  }

  // Draw one frame now. Used during preload to compile everything before the reveal.
  renderOnce() {
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    this.wanted = true;
    if (this.running || document.hidden) return;
    this.running = true;
    this.clock.getDelta(); // discard the time spent paused
    this.renderer.setAnimationLoop(this._loop);
  }

  stop() {
    this.wanted = false;
    this._halt();
  }

  _halt() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  _loop() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    this.updaters.forEach((fn) => fn(dt, t));
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.onLost = null; // forceContextLoss below must not trigger the fallback
    this.stop();
    document.removeEventListener('visibilitychange', this._onVisibility);
    window.removeEventListener('resize', this._resize);
    if (this._ro) this._ro.disconnect();
    this.updaters.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
