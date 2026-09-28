import * as THREE from 'three';
import gsap from 'gsap';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as TX from './textures.js';
import { imageTexture, videoSource } from './media.js';
import { fitCamera } from './engine.js';

// Room: x -6..6, z 6..-12, height 5. Hero arch on the back wall.
const H = 5;
const TITLE = { pos: [0, 1.7, 5.2], look: [0, 2.2, -12] };

// Camera stops for the 5 exhibits (0 = hero video, 1-4 = photos)
const STATIONS = [
  { pos: [0, 1.8, -5.2], look: [0, 2.4, -12] },
  { pos: [-2.3, 1.8, -7], look: [-6, 2.3, -7] },
  { pos: [2.3, 1.8, -7], look: [6, 2.3, -7] },
  { pos: [-0.3, 1.6, 0.8], look: [-3.2, 1.5, -1.6] },
  { pos: [2.4, 1.8, -1.8], look: [6, 2.3, -1.8] },
];

function archShape(w, h) {
  const r = w / 2, s = new THREE.Shape();
  s.moveTo(-r, 0);
  s.lineTo(r, 0);
  s.lineTo(r, h - r);
  s.absarc(0, h - r, r, 0, Math.PI, false);
  s.lineTo(-r, 0);
  return s;
}

// Map UVs 0..1 across the shape's bounding box so a video fills the arch
function normalizeUV(geo) {
  geo.computeBoundingBox();
  const b = geo.boundingBox, uv = geo.attributes.uv, p = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x), (p.getY(i) - b.min.y) / (b.max.y - b.min.y));
  }
  uv.needsUpdate = true;
}

export class Room {
  constructor(ch, env) {
    this.ch = ch;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1A100A');
    this.scene.fog = new THREE.Fog('#1A100A', 16, 34);
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.5;
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.05, 100);

    this.mode = 'title'; // title | moving | explore
    this.progress = 0;
    this.smooth = 0;
    this.pose = { pos: new THREE.Vector3(...TITLE.pos), look: new THREE.Vector3(...TITLE.look) };
    this.parallax = new THREE.Vector2();
    this.pickables = [];
    this.medias = [];
    this.animators = [];
    this.raycaster = new THREE.Raycaster();
    this.posRail = new THREE.CatmullRomCurve3(STATIONS.map((s) => new THREE.Vector3(...s.pos)));
    this.lookRail = new THREE.CatmullRomCurve3(STATIONS.map((s) => new THREE.Vector3(...s.look)));
    this.build();
  }

  std(o) {
    return new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  }

  add(geo, mat, x = 0, y = 0, z = 0, parent = this.scene) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  build() {
    const { room, accent } = this.ch;
    this.trimMat = this.std({ color: room.trim, roughness: 0.5 });
    this.brass = this.std({ color: '#C9A24A', metalness: 1, roughness: 0.3 });

    this.buildShell(room);
    this.buildHero(accent);
    this.frame(1, 2.6, 1.75, -5.95, 2.4, -7, Math.PI / 2);
    this.frame(2, 2.6, 1.75, 5.95, 2.4, -7, -Math.PI / 2);
    this.easel(3);
    this.frame(4, 1.7, 2.2, 5.95, 2.4, -1.8, -Math.PI / 2);
    this.props(room, accent);
    const signature = SIGNATURES[room.signature];
    if (signature) signature.call(this, room, accent);

    this.scene.add(new THREE.HemisphereLight('#ffe9c9', '#2a160c', 0.55));
    const key = new THREE.PointLight('#ffd9a0', 10, 18, 1.2);
    key.position.set(0, 4.2, -3);
    this.scene.add(key);
  }

  buildShell(room) {
    // Polished wooden plank floor
    const planks = TX.planks(room.floor);
    planks.repeat.set(3, 4.5);
    const floor = this.add(new THREE.PlaneGeometry(12, 18),
      new THREE.MeshPhysicalMaterial({ map: planks, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }), 0, 0, -3);
    floor.rotation.x = -Math.PI / 2;

    // Textured plaster walls
    const plaster = TX.plaster(room.wall);
    plaster.repeat.set(3, 1.2);
    const wall = this.std({ map: plaster, roughness: 0.95 });
    for (const [w, x, z, ry] of [[12, 0, -12, 0], [18, -6, -3, Math.PI / 2], [18, 6, -3, -Math.PI / 2], [12, 0, 6, Math.PI]]) {
      const m = this.add(new THREE.PlaneGeometry(w, H), wall, x, H / 2, z);
      m.rotation.y = ry;
    }
    const ceil = this.add(new THREE.PlaneGeometry(12, 18), this.std({ color: '#2A1A10' }), 0, H, -3);
    ceil.rotation.x = Math.PI / 2;

    // Skirting, cornice and ceiling beams
    for (const y of [0.12, H - 0.1]) {
      this.add(new THREE.BoxGeometry(12, 0.24, 0.08), this.trimMat, 0, y, -11.96);
      this.add(new THREE.BoxGeometry(0.08, 0.24, 18), this.trimMat, -5.96, y, -3);
      this.add(new THREE.BoxGeometry(0.08, 0.24, 18), this.trimMat, 5.96, y, -3);
    }
    for (let z = -11; z < 6; z += 2.5) this.add(new THREE.BoxGeometry(12, 0.18, 0.3), this.trimMat, 0, H - 0.09, z);
  }

  // Exhibit 0: the hero video playing inside a big arch
  buildHero(accent) {
    const ex = this.ch.exhibits[0];
    this.add(new THREE.ShapeGeometry(archShape(5.5, 4.0), 24), this.trimMat, 0, 0.45, -11.97);
    const geo = new THREE.ShapeGeometry(archShape(5, 3.6), 24);
    normalizeUV(geo);
    const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
    const media = videoSource(ex.src, ex.title, accent, 5 / 3.6);
    media.material = mat;
    mat.map = media.texture;
    const screen = this.add(geo, mat, 0, 0.65, -11.95);
    screen.userData.exhibit = 0;
    this.pickables.push(screen);
    this.medias.push(media);
    const glow = new THREE.PointLight('#fff1dc', 6, 10, 1.4);
    glow.position.set(0, 2.5, -10);
    this.scene.add(glow);
  }

  // Framed photo on a wall, with a brass picture light
  frame(idx, w, h, x, y, z, ry) {
    const ex = this.ch.exhibits[idx];
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    this.scene.add(g);
    this.add(new THREE.BoxGeometry(w + 0.24, h + 0.24, 0.08), this.brass, 0, 0, 0, g);
    this.add(new THREE.BoxGeometry(w + 0.04, h + 0.04, 0.085), this.std({ color: '#F3E6CC' }), 0, 0, 0.002, g);
    const pic = this.add(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: imageTexture(ex.src, ex.title, this.ch.accent, w / h), toneMapped: false }), 0, 0, 0.05, g);
    pic.userData.exhibit = idx;
    this.pickables.push(pic);
    const bar = this.add(new THREE.CylinderGeometry(0.035, 0.035, w * 0.6, 10), this.brass, 0, h / 2 + 0.28, 0.16, g);
    bar.rotation.z = Math.PI / 2;
    const light = new THREE.PointLight('#ffd9a0', 3, 4, 1.5);
    light.position.set(0, h / 2 + 0.1, 0.7);
    g.add(light);
  }

  // Exhibit 3: craft or food photo on a wooden easel
  easel(idx) {
    const ex = this.ch.exhibits[idx];
    const g = new THREE.Group();
    g.position.set(-3.2, 0, -1.6);
    g.rotation.y = 0.88;
    this.scene.add(g);
    const wood = this.std({ color: '#5A3A22', roughness: 0.6 });
    for (const sx of [-0.55, 0.55]) {
      const leg = this.add(new THREE.BoxGeometry(0.06, 2.4, 0.06), wood, sx, 1.15, 0, g);
      leg.rotation.z = -sx * 0.12;
    }
    const back = this.add(new THREE.BoxGeometry(0.06, 2.3, 0.06), wood, 0, 1.1, -0.45, g);
    back.rotation.x = -0.35;
    this.add(new THREE.BoxGeometry(1.5, 0.06, 0.16), wood, 0, 0.9, 0.04, g);
    const board = new THREE.Group();
    board.position.set(0, 1.55, 0.06);
    board.rotation.x = -0.1;
    g.add(board);
    this.add(new THREE.BoxGeometry(1.46, 1.08, 0.05), this.brass, 0, 0, 0, board);
    const pic = this.add(new THREE.PlaneGeometry(1.36, 0.98),
      new THREE.MeshBasicMaterial({ map: imageTexture(ex.src, ex.title, this.ch.accent, 1.36 / 0.98), toneMapped: false }), 0, 0, 0.03, board);
    pic.userData.exhibit = idx;
    this.pickables.push(pic);
  }

  // Shared furniture: rug, bench, antique cabinet, pendant lamps, plants
  props(room, accent) {
    const rug = this.add(new THREE.PlaneGeometry(4.6, 6.4), this.std({ map: TX.rug(accent, room.trim), roughness: 1 }), 0, 0.01, -5.5);
    rug.rotation.x = -Math.PI / 2;

    const wood = this.std({ color: '#4A2E1C', roughness: 0.55 });
    this.add(new RoundedBoxGeometry(2.4, 0.12, 0.6, 3, 0.04), this.std({ color: accent, roughness: 1 }), 0, 0.5, -8.6);
    for (const x of [-1, 1]) this.add(new THREE.BoxGeometry(0.1, 0.44, 0.5), wood, x, 0.22, -8.6);

    // Antique display cabinet with glass doors, against the left wall
    const cab = new THREE.Group();
    cab.position.set(-5.55, 0, -10.2);
    cab.rotation.y = Math.PI / 2;
    this.scene.add(cab);
    this.add(new THREE.BoxGeometry(1.6, 2.9, 0.06), wood, 0, 1.45, -0.37, cab);
    for (const sx of [-0.77, 0.77]) this.add(new THREE.BoxGeometry(0.06, 2.9, 0.8), wood, sx, 1.45, 0, cab);
    for (const y of [0.05, 2.85]) this.add(new THREE.BoxGeometry(1.6, 0.1, 0.8), wood, 0, y, 0, cab);
    const items = [this.brass, this.std({ color: accent, roughness: 0.4 }), this.std({ color: '#F3E6CC', roughness: 0.5 })];
    [0.8, 1.5, 2.2].forEach((y, r) => {
      this.add(new THREE.BoxGeometry(1.5, 0.04, 0.7), wood, 0, y, 0, cab);
      for (let k = 0; k < 3; k++) {
        const geos = [
          () => new THREE.SphereGeometry(0.12, 16, 12),
          () => new THREE.CylinderGeometry(0.08, 0.12, 0.3, 16),
          () => new THREE.TorusKnotGeometry(0.08, 0.03, 48, 8),
        ];
        this.add(geos[(k + r) % 3](), items[(k + r) % 3], -0.45 + k * 0.45, y + 0.18, 0, cab);
      }
    });
    this.add(new THREE.BoxGeometry(1.5, 2.7, 0.02),
      new THREE.MeshPhysicalMaterial({ color: '#dfe8e4', transparent: true, opacity: 0.18, roughness: 0.05 }), 0, 1.45, 0.4, cab);

    // Pendant lamps
    for (const x of [-2.6, 2.6]) {
      this.add(new THREE.CylinderGeometry(0.01, 0.01, 1.2, 4), this.brass, x, H - 0.6, -4.5);
      this.add(new THREE.ConeGeometry(0.35, 0.4, 20, 1, true), this.std({ color: room.trim, side: THREE.DoubleSide }), x, H - 1.35, -4.5);
      this.add(new THREE.SphereGeometry(0.09, 12, 12), new THREE.MeshBasicMaterial({ color: '#FFE2B0' }), x, H - 1.45, -4.5);
      const l = new THREE.PointLight('#ffc98a', 5, 7, 1.3);
      l.position.set(x, H - 1.6, -4.5);
      this.scene.add(l);
    }

    // Potted plants either side of the arch
    for (const x of [-3.4, 3.4]) {
      this.add(new THREE.CylinderGeometry(0.35, 0.28, 0.7, 16), this.std({ color: '#9C5A3C', roughness: 0.7 }), x, 0.35, -11.2);
      for (let k = 0; k < 5; k++) {
        this.add(new THREE.IcosahedronGeometry(0.35, 0), this.std({ color: '#3E6B3A', flatShading: true }),
          x + Math.cos(k * 1.3) * 0.2, 0.95 + k * 0.18, -11.2 + Math.sin(k * 1.3) * 0.2);
      }
    }
  }

  update(dt, t, pointer) {
    this.parallax.lerp(pointer, Math.min(1, dt * 3));
    if (this.mode === 'explore') {
      this.smooth += (this.progress - this.smooth) * Math.min(1, dt * 3);
      const p = THREE.MathUtils.clamp(this.smooth, 0, 1);
      this.posRail.getPoint(p, this.pose.pos);
      this.lookRail.getPoint(p, this.pose.look);
    } else if (this.mode === 'title') {
      this.pose.pos.set(TITLE.pos[0] + Math.sin(t * 0.2) * 0.25, TITLE.pos[1] + Math.sin(t * 0.3) * 0.05, TITLE.pos[2]);
    }
    this.camera.position.copy(this.pose.pos);
    this.camera.lookAt(this.pose.look);
    this.camera.rotateY(-this.parallax.x * 0.05);
    this.camera.rotateX(-this.parallax.y * 0.03);
    for (const a of this.animators) a(dt, t);
  }

  // EXPLORE: dolly from the doorway to the first exhibit
  enterExplore() {
    this.mode = 'moving';
    const s = STATIONS[0];
    return gsap.timeline({ onComplete: () => { this.mode = 'explore'; this.progress = 0; this.smooth = 0; } })
      .to(this.pose.pos, { x: s.pos[0], y: s.pos[1], z: s.pos[2], duration: 2.4, ease: 'power2.inOut' }, 0)
      .to(this.pose.look, { x: s.look[0], y: s.look[1], z: s.look[2], duration: 2.4, ease: 'power2.inOut' }, 0);
  }

  backToTitle() {
    this.mode = 'moving';
    return gsap.timeline({ onComplete: () => (this.mode = 'title') })
      .to(this.pose.pos, { x: TITLE.pos[0], y: TITLE.pos[1], z: TITLE.pos[2], duration: 1.8, ease: 'power2.inOut' }, 0)
      .to(this.pose.look, { x: TITLE.look[0], y: TITLE.look[1], z: TITLE.look[2], duration: 1.8, ease: 'power2.inOut' }, 0);
  }

  pick(ndc) {
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObjects(this.pickables, false)[0];
    return hit ? hit.object.userData.exhibit : -1;
  }

  play() { this.medias.forEach((m) => m.play()); }
  pause() { this.medias.forEach((m) => m.pause()); }

  dispose() {
    this.medias.forEach((m) => m.dispose());
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
    });
  }

  resize(aspect) {
    fitCamera(this.camera, aspect);
  }
}

// One signature decor piece per city (called with the Room as `this`)
const SIGNATURES = {
  // Srinagar: carved walnut lattice panels
  lattice() {
    for (const sx of [-1, 1]) {
      for (let i = 0; i <= 6; i++) {
        this.add(new THREE.BoxGeometry(0.05, 2.6, 0.05), this.trimMat, sx * (3.9 + i * 0.3), 2.6, -11.95);
        this.add(new THREE.BoxGeometry(1.8, 0.05, 0.05), this.trimMat, sx * 4.8, 1.3 + i * 0.43, -11.95);
      }
    }
  },
  // Manali: stone fireplace with a flickering fire
  fireplace() {
    const stone = this.std({ color: '#8C8272', roughness: 1, flatShading: true });
    const g = new THREE.Group();
    g.position.set(4.7, 0, -11.6);
    this.scene.add(g);
    this.add(new THREE.BoxGeometry(1.8, 1.5, 0.6), stone, 0, 0.75, 0, g);
    this.add(new THREE.BoxGeometry(1.1, 0.9, 0.62), this.std({ color: '#140a05' }), 0, 0.5, 0.01, g);
    this.add(new THREE.BoxGeometry(2.1, 0.12, 0.75), this.trimMat, 0, 1.56, 0.05, g);
    const flame = this.add(new THREE.ConeGeometry(0.22, 0.5, 8), new THREE.MeshBasicMaterial({ color: '#FF9A40' }), 0, 0.35, 0.34, g);
    const fire = new THREE.PointLight('#ff8a3a', 4, 5, 1.5);
    fire.position.set(0, 0.5, 0.8);
    g.add(fire);
    this.animators.push((dt, t) => {
      fire.intensity = 3.5 + Math.sin(t * 13) * 0.6 + Math.sin(t * 7.3) * 0.4;
      flame.scale.y = 1 + Math.sin(t * 11) * 0.15;
    });
  },
  // Amritsar: rows of glowing golden lamps
  goldLamps() {
    const gold = this.std({ color: '#E0B040', metalness: 0.9, roughness: 0.25, emissive: '#7a5410', emissiveIntensity: 0.6 });
    for (const sx of [-1, 1]) {
      for (let k = 0; k < 7; k++) {
        const z = -10.5 + k * 1.6;
        this.add(new THREE.CylinderGeometry(0.008, 0.008, 0.8, 4), this.brass, sx * 5.3, H - 0.4, z);
        this.add(new THREE.SphereGeometry(0.16, 16, 12), gold, sx * 5.3, H - 0.9, z);
      }
    }
    const l = new THREE.PointLight('#ffcf70', 4, 12, 1.2);
    l.position.set(0, 3.5, -8);
    this.scene.add(l);
  },
  // Jaipur: jharokha niches with balconies
  jharokha(room) {
    const stone = this.std({ color: room.wall, roughness: 0.9 });
    const dark = this.std({ color: '#3a1f14' });
    for (const sx of [-1, 1]) {
      for (const y of [1.0, 2.7]) {
        this.add(new THREE.ShapeGeometry(archShape(1.1, 1.4), 16), dark, sx * 4.8, y, -11.96);
        this.add(new THREE.BoxGeometry(1.5, 0.12, 0.45), this.trimMat, sx * 4.8, y, -11.75);
        const dome = this.add(new THREE.SphereGeometry(0.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), stone, sx * 4.8, y + 1.45, -11.8);
        dome.scale.z = 0.5;
      }
    }
  },
  // Agra: marble inlay table and wall panel
  marbleSlabs() {
    const inlay = this.std({ map: TX.inlay(), roughness: 0.25 });
    const leg = this.std({ color: '#CFC8BC' });
    this.add(new THREE.BoxGeometry(1.6, 0.08, 1.0), inlay, 4.6, 0.9, -10.9);
    for (const [x, z] of [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]]) {
      this.add(new THREE.BoxGeometry(0.08, 0.86, 0.08), leg, 4.6 + x, 0.43, -10.9 + z);
    }
    this.add(new THREE.PlaneGeometry(1.4, 1.4), inlay, -4.8, 2.6, -11.95);
  },
  // Goa: blue azulejo tile wainscot
  tiles() {
    const long = TX.tiles();
    long.repeat.set(14, 1.2);
    const short = TX.tiles();
    short.repeat.set(2.4, 1.2);
    const longMat = this.std({ map: long, roughness: 0.3 });
    const shortMat = this.std({ map: short, roughness: 0.3 });
    for (const [x, ry] of [[-5.95, Math.PI / 2], [5.95, -Math.PI / 2]]) {
      const m = this.add(new THREE.PlaneGeometry(18, 1.2), longMat, x, 0.84, -3);
      m.rotation.y = ry;
    }
    for (const sx of [-1, 1]) this.add(new THREE.PlaneGeometry(3, 1.2), shortMat, sx * 4.5, 0.84, -11.95);
  },
  // Munnar: stacked tea chests and tasting cups
  teaChests() {
    const wood = this.std({ color: '#7A5634', roughness: 0.8 });
    const lab = this.std({ map: TX.label('ESTATE TEA', '#C9A77A', '#3A2416'), roughness: 0.8 });
    const mats = [wood, wood, wood, wood, lab, wood];
    for (const [x, y, z] of [[4.3, 0.35, -11.4], [5.1, 0.35, -11.4], [4.7, 1.05, -11.4], [5.2, 0.35, -10.6]]) {
      this.add(new THREE.BoxGeometry(0.7, 0.7, 0.7), mats, x, y, z);
    }
    const cup = this.std({ color: '#F4F1EA', roughness: 0.3 });
    for (const x of [-0.6, 0, 0.6]) this.add(new THREE.CylinderGeometry(0.07, 0.05, 0.1, 16), cup, x, 0.61, -8.6);
  },
  // Gangtok: spinning prayer wheels and thangka hangings
  prayerWheels() {
    const red = this.std({ color: '#8A2E2A', roughness: 0.5 });
    const gold = this.std({ color: '#E0B040', metalness: 0.9, roughness: 0.3 });
    const wheels = [];
    for (const sx of [-1, 1]) {
      this.add(new THREE.BoxGeometry(1.9, 0.1, 0.4), this.trimMat, sx * 4.8, 1.0, -11.7);
      this.add(new THREE.BoxGeometry(1.9, 0.1, 0.4), this.trimMat, sx * 4.8, 1.9, -11.7);
      for (let k = 0; k < 5; k++) {
        const w = new THREE.Group();
        w.position.set(sx * 4.8 - 0.72 + k * 0.36, 1.45, -11.7);
        this.scene.add(w);
        this.add(new THREE.CylinderGeometry(0.15, 0.15, 0.7, 20), k % 2 ? red : gold, 0, 0, 0, w);
        this.add(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 20), k % 2 ? gold : red, 0, 0.3, 0, w);
        wheels.push(w);
      }
      this.add(new THREE.PlaneGeometry(1.2, 1.6), this.std({ map: TX.rug(this.ch.accent, '#E0B040') }), sx * 4.8, 3.3, -11.95);
    }
    this.animators.push((dt) => wheels.forEach((w, i) => (w.rotation.y += dt * (0.6 + (i % 3) * 0.2))));
  },
  // Rann of Kutch: mud-and-mirror wall work
  mirrors() {
    const mirror = this.std({ color: '#ffffff', metalness: 1, roughness: 0.05 });
    const mud = this.std({ color: '#D9C9AE', roughness: 1 });
    for (const sx of [-1, 1]) {
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 5; c++) {
          if ((r + c) % 2) continue;
          const x = sx * (4.0 + c * 0.4), y = 1.3 + r * 0.45;
          this.add(new THREE.CircleGeometry(0.1, 16), mirror, x, y, -11.94);
          this.add(new THREE.RingGeometry(0.1, 0.16, 16), mud, x, y, -11.945);
        }
      }
    }
  },
  // Shillong: vinyl record wall and a guitar
  records() {
    const vinyl = this.std({ color: '#111111', roughness: 0.35 });
    const labels = ['#C24E3A', '#F2B632', '#28505A', '#F3E6CC'];
    for (const sx of [-1, 1]) {
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          const x = sx * (4.1 + c * 0.75), y = 2.2 + r * 0.9;
          this.add(new THREE.CircleGeometry(0.32, 32), vinyl, x, y, -11.95);
          this.add(new THREE.CircleGeometry(0.1, 20), this.std({ color: labels[(r + c) % 4] }), x, y, -11.94);
        }
      }
    }
    const g = new THREE.Group();
    g.position.set(5.2, 0, -10.8);
    g.rotation.z = 0.18;
    this.scene.add(g);
    const body = this.std({ color: '#B5652E', roughness: 0.4 });
    this.add(new THREE.SphereGeometry(0.34, 20, 16), body, 0, 0.4, 0, g).scale.z = 0.3;
    this.add(new THREE.SphereGeometry(0.26, 20, 16), body, 0, 0.82, 0, g).scale.z = 0.3;
    this.add(new THREE.BoxGeometry(0.08, 0.9, 0.05), this.std({ color: '#3A2416' }), 0, 1.45, 0, g);
  },
};
