import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PostFX } from './post.js';

// One renderer, many views (the train, a chapter's reel). Each view has scene, camera, update(), resize().
// The canvas is sized by CSS to the picture inside the cinema frame; the renderer follows it.
// Views with toneMapped === false (real footage) skip tone mapping so the footage keeps its own colour.
export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, stencil: false, powerPreference: 'high-performance' });
    this.maxRatio = Math.min(devicePixelRatio, 1.5);
    this.ratio = this.maxRatio;
    this.renderer.setPixelRatio(this.ratio);
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.post = new PostFX(this.renderer);

    this.pointer = new THREE.Vector2(); // -1..1 across the picture, y down
    this.view = null;
    this.paused = false; // set while a full-screen layer hides the canvas
    this.clock = new THREE.Clock();
    this.perf = { frames: 0, slow: 0, good: 0 };

    addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    }, { passive: true });
    addEventListener('resize', () => this.resize());
    if ('ResizeObserver' in window) new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }

  size() {
    return [this.canvas.clientWidth || innerWidth, this.canvas.clientHeight || innerHeight];
  }

  setView(view) {
    this.view = view;
    this.renderer.toneMapping = view.toneMapped === false ? THREE.NoToneMapping : THREE.NeutralToneMapping;
    this.perf.frames = this.perf.slow = 0;
    this.resize();
  }

  resize() {
    const [w, h] = this.size();
    this.renderer.setSize(w, h, false);
    this.post.setSize(w, h);
    if (this.view) this.view.resize(w / h);
  }

  tick() {
    const raw = this.clock.getDelta();
    const dt = Math.min(raw, 0.05), t = this.clock.elapsedTime;
    if (!this.view || this.paused || document.hidden) return;
    this.view.update(dt, t, this.pointer);
    this.post.render(this.view.scene, this.view.camera, dt);
    this.adapt(raw);
  }

  // Keep motion smooth: lower the resolution when frames run long, recover when there is headroom
  adapt(raw) {
    const p = this.perf;
    if (raw > 0.25) return; // one-off hitch (texture upload, tab switch): ignore
    p.frames++;
    if (raw > 1 / 45) p.slow++;
    if (p.frames < 90) return;
    if (p.slow > 20 && this.ratio > 0.75) {
      this.setRatio(Math.max(0.75, this.ratio - 0.25));
      p.good = 0;
    } else if (p.slow < 3 && this.ratio < this.maxRatio && ++p.good >= 4) {
      this.setRatio(Math.min(this.maxRatio, this.ratio + 0.125));
      p.good = 0;
    }
    p.frames = p.slow = 0;
  }

  setRatio(r) {
    this.ratio = r;
    this.renderer.setPixelRatio(r);
    this.resize();
  }
}

// Tighter lens on wide scope screens, wider lens on portrait screens
export function fitCamera(camera, aspect) {
  camera.aspect = aspect;
  camera.fov = aspect < 1 ? Math.min(80, (50 / aspect) * 0.75) : aspect > 1.9 ? 38 : 50;
  camera.updateProjectionMatrix();
}
