import * as THREE from 'three';
import gsap from 'gsap';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { drawCover } from './fx.js';

// Camera path: wide view -> swoop -> cover close-up -> title -> charm macro -> pull back
const CAM  = [[0, 5, 17], [7, 2.5, 10], [2.5, 1.2, 4.2], [-1.2, 0, 3.6], [0.6, -1.6, 2.6], [0, 0.2, 7.5]];
const LOOK = [[0, -1, -8], [0, 0, -2], [0.6, 0.8, 0], [-0.6, -0.3, 0], [0.8, -2, 0], [0, -0.2, 0]];

export class World {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#6B3A24');
    this.scene.fog = new THREE.Fog('#6B3A24', 10, 45);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // Starts far away with a narrow lens, for the dolly-zoom intro
    this.camera = new THREE.PerspectiveCamera(22, innerWidth / innerHeight, 0.1, 200);
    this.camera.position.set(0, 1.5, 26);
    this.target = new THREE.Vector3();

    this.mode = 'idle'; // idle | manual | rail
    this.progress = 0;
    this.smooth = 0;
    this.side = 1;
    this.drag = { active: false, px: 0, py: 0, vx: 0, vy: 0, rotX: 0, rotY: 0 };
    this.hotspots = [];
    this.clock = new THREE.Clock();
    this._v = new THREE.Vector3();
    this._n = new THREE.Vector3();
    this._c = new THREE.Vector3();

    this.addLights();
    this.addGround();
    this.addParticles();
    this.addMagazine();
    this.bindDrag();
    addEventListener('resize', () => this.resize());
  }

  addLights() {
    this.scene.add(new THREE.HemisphereLight('#fff1dc', '#3a1f10', 1.1));
    const sun = new THREE.DirectionalLight('#ffd9a0', 2.4);
    sun.position.set(5, 8, 6);
    this.scene.add(sun);
  }

  addGround() {
    const g = new THREE.PlaneGeometry(80, 80, 80, 80);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), d = Math.hypot(x, y);
      // Gentle dunes near the centre, hills rising towards the horizon
      p.setZ(i, (Math.sin(x * 0.25) + Math.cos(y * 0.2)) * 0.8 * Math.min(1, d / 8) + Math.max(0, d - 15) * 0.35);
    }
    g.computeVertexNormals();
    this.groundMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 });
    const ground = new THREE.Mesh(g, this.groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3.2;
    this.scene.add(ground);
  }

  addParticles() {
    const n = 700, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 12 - 2;
      pos[i * 3 + 2] = Math.random() * 30 - 20;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particles = new THREE.Points(g, new THREE.PointsMaterial({
      size: 0.05, color: '#F3E6CC', transparent: true, opacity: 0.8, depthWrite: false,
    }));
    this.scene.add(this.particles);
  }

  addMagazine() {
    this.book = new THREE.Group();
    this.scene.add(this.book);

    this.coverCanvas = document.createElement('canvas');
    this.coverCanvas.width = 720;
    this.coverCanvas.height = 1000;
    this.coverTex = new THREE.CanvasTexture(this.coverCanvas);
    this.coverTex.colorSpace = THREE.SRGBColorSpace;
    this.coverTex.anisotropy = 8;

    const front = new THREE.MeshStandardMaterial({ map: this.coverTex, roughness: 0.6 });
    const pages = new THREE.MeshStandardMaterial({ color: '#f5ecd9', roughness: 0.9 });
    this.spineMat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
    // Box faces: +x, -x, +y, -y, +z (front), -z (back)
    this.book.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.6, 0.3),
      [pages, this.spineMat, pages, pages, front, this.spineMat]));

    // Ribbon with gold charm (swings from its top)
    this.charm = new THREE.Group();
    this.charm.position.set(0.9, -1.8, 0.17);
    this.book.add(this.charm);
    this.ribbonMat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide });
    const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.6), this.ribbonMat);
    ribbon.position.y = -0.3;
    this.charm.add(ribbon);
    this.charmMat = new THREE.MeshStandardMaterial({
      color: '#F2B632', metalness: 1, roughness: 0.25, emissive: '#F2B632', emissiveIntensity: 0,
    });
    this.orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 48, 48), this.charmMat);
    this.orb.position.y = -0.6;
    this.charm.add(this.orb);
  }

  setChapter(i, ch) {
    drawCover(this.coverCanvas, ch, i);
    this.coverTex.needsUpdate = true;
    this.spineMat.color.set(ch.cover);
    this.ribbonMat.color.set(ch.accent);
    this.scene.background.set(ch.bg);
    this.scene.fog.color.set(ch.bg);
    this.groundMat.color.set(ch.ground);

    // Mirror the camera path on alternate chapters so each one feels different
    this.side = i % 2 === 0 ? 1 : -1;
    this.camRail = new THREE.CatmullRomCurve3(CAM.map(([x, y, z]) => new THREE.Vector3(x * this.side, y, z)));
    this.lookRail = new THREE.CatmullRomCurve3(LOOK.map((p) => new THREE.Vector3(...p)));

    this.progress = 0;
    this.smooth = 0;
    Object.assign(this.drag, { rotX: 0, rotY: 0, vx: 0, vy: 0 });
  }

  setHotspots(items) {
    this.hotspots = items.map((h) => ({ el: h.el, v: new THREE.Vector3(...h.pos) }));
  }

  // Intro: push in while widening the lens (dolly zoom)
  dollyIn() {
    this.mode = 'manual';
    this.target.set(0, 0, 0);
    const pos = this.camRail.getPointAt(0), look = this.lookRail.getPointAt(0);
    const tl = gsap.timeline({ onComplete: () => (this.mode = 'rail') });
    tl.to(this.camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: 2.6, ease: 'power3.inOut' }, 0)
      .to(this.target, { x: look.x, y: look.y, z: look.z, duration: 2.6, ease: 'power3.inOut' }, 0)
      .to(this.camera, {
        fov: 45, duration: 2.6, ease: 'power3.inOut',
        onUpdate: () => this.camera.updateProjectionMatrix(),
      }, 0);
    return tl;
  }

  skipIntro() {
    this.camera.fov = 45;
    this.camera.updateProjectionMatrix();
    this.mode = 'rail';
  }

  // Hotspot hover: charm bounces and glints
  glint() {
    gsap.fromTo(this.charmMat, { emissiveIntensity: 2 }, { emissiveIntensity: 0, duration: 0.8 });
    gsap.fromTo(this.orb.scale, { x: 1.3, y: 1.3, z: 1.3 },
      { x: 1, y: 1, z: 1, duration: 0.9, ease: 'elastic.out(1, 0.35)' });
  }

  bindDrag() {
    const c = this.renderer.domElement, d = this.drag;
    c.addEventListener('pointerdown', (e) => {
      d.active = true;
      d.px = e.clientX;
      d.py = e.clientY;
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      if (!d.active) return;
      const dx = e.clientX - d.px, dy = e.clientY - d.py;
      d.rotY += dx * 0.008;
      d.rotX += dy * 0.005;
      d.vx = dx * 0.008;
      d.vy = dy * 0.005;
      d.px = e.clientX;
      d.py = e.clientY;
    });
    const up = () => (d.active = false);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
  }

  updateHotspots() {
    const show = this.mode === 'rail' && this.smooth > 0.3 && this.smooth < 0.97;
    this._n.set(0, 0, 1).applyQuaternion(this.book.quaternion); // cover normal
    for (const h of this.hotspots) {
      this._v.copy(h.v);
      this.book.localToWorld(this._v);
      const facing = this._c.copy(this.camera.position).sub(this._v).dot(this._n) > 0;
      this._v.project(this.camera);
      const x = (this._v.x * 0.5 + 0.5) * innerWidth;
      const y = (-this._v.y * 0.5 + 0.5) * innerHeight;
      h.el.style.transform = `translate(${x}px, ${y}px)`;
      h.el.classList.toggle('is-hidden', !(show && facing));
    }
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05), t = this.clock.elapsedTime;

    // Drag inertia
    const d = this.drag;
    if (!d.active) {
      d.rotY += d.vx;
      d.rotX += d.vy;
      d.vx *= 0.94;
      d.vy *= 0.94;
      d.rotX *= 0.96;
    }
    d.rotX = THREE.MathUtils.clamp(d.rotX, -0.6, 0.6);

    this.smooth += (this.progress - this.smooth) * Math.min(1, dt * 4);
    const sway = Math.sin(this.smooth * Math.PI * 2) * 0.3 * this.side;
    this.book.rotation.set(d.rotX, d.rotY + sway, 0);
    this.book.position.y = Math.sin(t * 1.2) * 0.06;
    this.charm.rotation.z = Math.sin(t * 1.8) * 0.12;
    this.particles.rotation.y += dt * 0.02;
    this.particles.position.y = Math.sin(t * 0.3) * 0.3;

    if (this.mode === 'idle') {
      this.camera.position.x = Math.sin(t * 0.25) * 0.8;
      this.camera.lookAt(0, 0, 0);
    } else if (this.mode === 'manual') {
      this.camera.lookAt(this.target);
    } else {
      const p = THREE.MathUtils.clamp(this.smooth, 0, 1);
      this.camRail.getPointAt(p, this.camera.position);
      this.lookRail.getPointAt(p, this.target);
      this.camera.lookAt(this.target);
    }

    this.renderer.render(this.scene, this.camera);
    this.updateHotspots();
  }

  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  }
}
