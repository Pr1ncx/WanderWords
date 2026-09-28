import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// One renderer, many views (train, rooms). Each view has scene, camera, update(), resize().
export class Engine {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    this.pointer = new THREE.Vector2(); // -1..1, y down
    this.ndc = new THREE.Vector2();     // -1..1, y up (for raycasting)
    this.view = null;
    this.clock = new THREE.Clock();

    addEventListener('pointermove', (e) => {
      this.pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
      this.ndc.set(this.pointer.x, -this.pointer.y);
    });
    addEventListener('resize', () => this.resize());
    this.resize();
  }

  setView(view) {
    this.view = view;
    this.resize();
  }

  resize() {
    this.renderer.setSize(innerWidth, innerHeight);
    if (this.view) this.view.resize(innerWidth / innerHeight);
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05), t = this.clock.elapsedTime;
    if (!this.view) return;
    this.view.update(dt, t, this.pointer);
    this.renderer.render(this.view.scene, this.view.camera);
  }
}

// Wider lens on portrait screens
export function fitCamera(camera, aspect) {
  camera.aspect = aspect;
  camera.fov = aspect < 1 ? Math.min(80, (50 / aspect) * 0.75) : 50;
  camera.updateProjectionMatrix();
}
