import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PostFX } from './post.js';

// One renderer, many views (train, rooms). Each view has scene, camera, update(), resize().
export class Engine {
  constructor(canvas) {
    // Antialiasing happens in the post-processing MSAA target
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, stencil: false, powerPreference: 'high-performance' });
    this.maxRatio = Math.min(devicePixelRatio, 1.25);
    this.ratio = this.maxRatio;
    this.renderer.setPixelRatio(this.ratio);
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.post = new PostFX(this.renderer);

    this.pointer = new THREE.Vector2(); // -1..1, y down
    this.ndc = new THREE.Vector2();     // -1..1, y up (for raycasting)
    this.view = null;
    this.paused = false; // set while a full-screen layer hides the canvas
    this.clock = new THREE.Clock();
    this.perf = { frames: 0, slow: 0, good: 0 };

    addEventListener('pointermove', (e) => {
      this.pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
      this.ndc.set(this.pointer.x, -this.pointer.y);
    }, { passive: true });
    addEventListener('resize', () => this.resize());
    this.resize();
  }

  setView(view) {
    this.view = view;
    this.perf.frames = this.perf.slow = 0;
    this.resize();
  }

  resize() {
    this.renderer.setSize(innerWidth, innerHeight);
    this.post.setSize(innerWidth, innerHeight);
    if (this.view) this.view.resize(innerWidth / innerHeight);
  }

  tick() {
    const raw = this.clock.getDelta();
    const dt = Math.min(raw, 0.05), t = this.clock.elapsedTime;
    if (!this.view || this.paused || document.hidden) return;
    this.view.update(dt, t, this.pointer);
    this.post.render(this.view.scene, this.view.camera, dt, t);
    this.adapt(raw);
  }

  // Keep motion smooth: lower the resolution when frames run long, recover when there is headroom
  adapt(raw) {
    const p = this.perf;
    if (raw > 0.25) return; // one-off hitch (texture upload, tab switch): ignore
    p.frames++;
    if (raw > 1 / 45) p.slow++;
    if (p.frames < 90) return;
    if (p.slow > 20 && this.ratio > 0.6) {
      this.setRatio(Math.max(0.6, this.ratio - 0.2));
      p.good = 0;
    } else if (p.slow < 3 && this.ratio < this.maxRatio && ++p.good >= 4) {
      this.setRatio(Math.min(this.maxRatio, this.ratio + 0.1));
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

// Wider lens on portrait screens
export function fitCamera(camera, aspect) {
  camera.aspect = aspect;
  camera.fov = aspect < 1 ? Math.min(80, (50 / aspect) * 0.75) : 50;
  camera.updateProjectionMatrix();
}
