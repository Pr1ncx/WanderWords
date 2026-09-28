import * as THREE from 'three';
import gsap from 'gsap';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Landscape } from './landscape.js';
import { drawCover } from './fx.js';

// Camera poses inside the carriage
const POSES = {
  intro:   { x: 0, y: 1.3,  z: 1.7,  lx: 0, ly: 1.25, lz: -2 },
  chapter: { x: 0, y: 1.32, z: -0.1, lx: 0, ly: 1.15, lz: -4 },
};
const TRAVEL = 110; // world units the train travels during one stop

export class World {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#F6D9A8');
    this.scene.fog = new THREE.Fog('#F6D9A8', 30, 190);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.35;

    this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 400);
    this.pose = { ...POSES.intro };
    this.pointer = new THREE.Vector2();
    this.parallax = new THREE.Vector2();

    this.mode = 'idle'; // idle | intro | chapter
    this.introSpeed = 0;
    this.progress = 0;
    this.smooth = 0;
    this.distance = 0;
    this.speed = 0;
    this.clock = new THREE.Clock();

    this.landscape = new Landscape();
    this.scene.add(this.landscape.group);
    this.addLights();
    this.addCarriage();
    this.resize();

    addEventListener('resize', () => this.resize());
    addEventListener('pointermove', (e) =>
      this.pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1));
  }

  addLights() {
    this.scene.add(new THREE.HemisphereLight('#ffe9c9', '#2a160c', 0.7));
    const sun = new THREE.DirectionalLight('#fff0d0', 2.2);
    sun.position.set(6, 12, 10);
    this.scene.add(sun);
    this.lampBase = 8;
    this.lamp = new THREE.PointLight('#ffb870', this.lampBase, 8, 1);
    this.lamp.position.set(0, 2.35, 0.2);
    this.scene.add(this.lamp);
  }

  addCarriage() {
    const g = new THREE.Group();
    this.scene.add(g);
    const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
    const wood = M('#3A2416', { roughness: 0.6 });
    const panel = M('#5A3822');
    const plush = M('#5A2E22', { roughness: 1 });
    const floor = M('#24160D');
    const ceil = M('#2E1D12');
    const brass = M('#C9A24A', { metalness: 1, roughness: 0.3 });
    const box = (w, h, d, mat, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      g.add(m);
      return m;
    };

    const W = 1.6, H = 2.6, ZF = -2, ZB = 2.2;

    // Window wall with an opening x[-0.9, 0.9], y[0.8, 1.9]
    box(W - 0.9, H, 0.1, panel, -(0.9 + W) / 2, H / 2, ZF);
    box(W - 0.9, H, 0.1, panel, (0.9 + W) / 2, H / 2, ZF);
    box(1.8, 0.8, 0.1, panel, 0, 0.4, ZF);
    box(1.8, H - 1.9, 0.1, panel, 0, (1.9 + H) / 2, ZF);

    // Window frame and brass sill
    box(1.9, 0.08, 0.16, wood, 0, 0.8, ZF + 0.02);
    box(1.9, 0.08, 0.16, wood, 0, 1.9, ZF + 0.02);
    box(0.08, 1.18, 0.16, wood, -0.95, 1.35, ZF + 0.02);
    box(0.08, 1.18, 0.16, wood, 0.95, 1.35, ZF + 0.02);
    box(1.9, 0.05, 0.25, brass, 0, 0.86, ZF + 0.1);

    // Side walls, floor, ceiling, back wall
    box(0.1, H, ZB - ZF, panel, -W, H / 2, (ZF + ZB) / 2);
    box(0.1, H, ZB - ZF, panel, W, H / 2, (ZF + ZB) / 2);
    box(2 * W, 0.1, ZB - ZF, floor, 0, 0, (ZF + ZB) / 2);
    box(2 * W, 0.1, ZB - ZF, ceil, 0, H, (ZF + ZB) / 2);
    box(2 * W, H, 0.1, panel, 0, H / 2, ZB);

    // Wooden rails and ceiling ribs
    for (const s of [-1, 1]) box(0.04, 0.06, ZB - ZF, wood, s * (W - 0.06), 1.75, (ZF + ZB) / 2);
    for (let z = ZF + 0.4; z < ZB; z += 0.6) box(2 * W, 0.06, 0.08, wood, 0, H - 0.06, z);

    // Facing benches with ribbed plush backrests
    for (const s of [-1, 1]) {
      box(0.75, 0.4, 2.4, wood, s * 1.2, 0.2, -0.7);
      const cushion = new THREE.Mesh(new RoundedBoxGeometry(0.75, 0.14, 2.4, 3, 0.05), plush);
      cushion.position.set(s * 1.2, 0.47, -0.7);
      g.add(cushion);
      for (let k = 0; k < 8; k++) {
        const rib = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.85, 0.28, 3, 0.06), plush);
        rib.position.set(s * 1.5, 0.98, -1.75 + k * 0.3);
        g.add(rib);
      }
    }

    // Ceiling lamp
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), new THREE.MeshBasicMaterial({ color: '#FFD9A0' }));
    bulb.position.set(0, 2.45, 0.2);
    g.add(bulb);

    // Vintage suitcase on the left seat
    const tan = M('#B07A45', { roughness: 0.55 });
    const strap = M('#6B3F22');
    const suitcase = new THREE.Group();
    suitcase.position.set(-1.15, 0.66, -1.0);
    suitcase.rotation.y = 0.12;
    g.add(suitcase);
    suitcase.add(new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.24, 0.8, 4, 0.04), tan));
    for (const z of [-0.22, 0.22]) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.25, 0.05), strap);
      st.position.z = z;
      suitcase.add(st);
    }
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 8, 16, Math.PI), strap);
    handle.position.set(0, 0.12, 0);
    handle.rotation.y = Math.PI / 2;
    suitcase.add(handle);
    for (const z of [-0.15, 0.15]) {
      const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.06), brass);
      clasp.position.set(0.28, 0.06, z);
      suitcase.add(clasp);
    }

    // WANDERWORDS journal resting on the suitcase (cover changes per stop)
    this.coverCanvas = document.createElement('canvas');
    this.coverCanvas.width = 720;
    this.coverCanvas.height = 1000;
    this.coverTex = new THREE.CanvasTexture(this.coverCanvas);
    this.coverTex.colorSpace = THREE.SRGBColorSpace;
    this.coverTex.anisotropy = 8;
    const page = M('#f5ecd9');
    this.journalSide = M('#6B3A24');
    const cover = new THREE.MeshStandardMaterial({ map: this.coverTex, roughness: 0.6 });
    // Box faces: +x, -x, +y (cover), -y, +z, -z
    const journal = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.42),
      [page, this.journalSide, cover, this.journalSide, page, page]);
    journal.position.set(0.02, 0.135, 0.05);
    journal.rotation.y = -0.35;
    suitcase.add(journal);
  }

  applyBiome(cfg) {
    this.landscape.setBiome(cfg);
    this.scene.background.set(cfg.sky);
    this.scene.fog.color.set(cfg.sky);
  }

  setIntro(cfg) {
    this.applyBiome(cfg);
    this.landscape.setLandmark(null);
  }

  setChapter(i, ch) {
    this.applyBiome(ch);
    this.landscape.setLandmark(ch.landmark);
    drawCover(this.coverCanvas, ch, i);
    this.coverTex.needsUpdate = true;
    this.journalSide.color.set(ch.cover);
    this.progress = 0;
    this.smooth = 0;
    this.distance = 0;
    this.speed = 0;
  }

  // Automatic intro ride: the train speeds up
  startIntro() {
    this.mode = 'intro';
    gsap.fromTo(this, { introSpeed: 0 }, { introSpeed: 16, duration: 3, ease: 'power1.in' });
  }

  // The train slows down at the first stop
  arrive() {
    gsap.to(this, { introSpeed: 0, duration: 2.2, ease: 'power2.out', overwrite: true });
  }

  // Camera moves from the aisle up to the window
  pushToWindow(duration = 2.2) {
    return gsap.to(this.pose, { ...POSES.chapter, duration, ease: 'power2.inOut' });
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05), t = this.clock.elapsedTime;
    const prev = this.distance;

    if (this.mode === 'chapter') {
      // Scroll drives the train
      this.smooth += (this.progress - this.smooth) * Math.min(1, dt * 3);
      this.distance = this.smooth * TRAVEL;
    } else {
      this.distance += this.introSpeed * dt;
    }

    const v = Math.min(60, Math.abs(this.distance - prev) / Math.max(dt, 1e-4));
    this.speed += (v - this.speed) * Math.min(1, dt * 5);
    this.landscape.update(this.distance, this.smooth);

    // Mouse parallax + train sway that grows with speed
    this.parallax.lerp(this.pointer, Math.min(1, dt * 3));
    const k = Math.min(1, this.speed / 16);
    const p = this.pose;
    this.camera.position.set(
      p.x + this.parallax.x * 0.12,
      p.y - this.parallax.y * 0.06 + Math.sin(t * 11) * 0.005 * k + Math.sin(t * 1.3) * 0.003,
      p.z,
    );
    this.camera.lookAt(p.lx + this.parallax.x * 0.35, p.ly - this.parallax.y * 0.18, p.lz);
    this.camera.rotateZ(Math.sin(t * 1.7) * 0.005 * k);
    this.lamp.intensity = this.lampBase + Math.sin(t * 23) * 0.4 * k;

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const aspect = innerWidth / innerHeight;
    this.camera.aspect = aspect;
    // Wider lens on portrait screens so the window still fits
    this.camera.fov = aspect < 1 ? Math.min(80, (50 / aspect) * 0.75) : 50;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  }
}
