import * as THREE from 'three';

const GROUND_Y = -1.5;
const cache = new Map();

// Shared low-poly materials
function M(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!cache.has(key)) {
    cache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, ...opts }));
  }
  return cache.get(key);
}

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

let seed = 1;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const wrap = (v, r) => (((v % r) + r) % r) - r / 2;

// ---------- Trees ----------
const TREES = {
  broadleaf() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.6, 5), M('#5A3A22'), 0, 0.8, 0));
    g.add(mesh(new THREE.IcosahedronGeometry(1.1, 0), M('#4E7A3A'), 0, 2.2, 0));
    return g;
  },
  palm() {
    const g = new THREE.Group();
    const trunk = mesh(new THREE.CylinderGeometry(0.08, 0.14, 4, 5), M('#7A5A3A'), 0, 2, 0);
    trunk.rotation.z = 0.12;
    g.add(trunk);
    for (let k = 0; k < 7; k++) {
      const pivot = new THREE.Group();
      pivot.position.set(-0.24, 4, 0);
      pivot.rotation.y = (k / 7) * Math.PI * 2;
      const frond = mesh(new THREE.BoxGeometry(1.8, 0.04, 0.3), M('#3F7A3A'), 0.9, -0.3, 0);
      frond.rotation.z = -0.45;
      pivot.add(frond);
      g.add(pivot);
    }
    return g;
  },
  deodar() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.8, 5), M('#4A3020'), 0, 0.4, 0));
    [[1.3, 1.6, 1.2], [1.0, 1.4, 2.1], [0.7, 1.2, 2.9]].forEach(([r, h, y]) =>
      g.add(mesh(new THREE.ConeGeometry(r, h, 6), M('#2F4F3A'), 0, y, 0)));
    return g;
  },
  pine() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.8, 5), M('#4A3020'), 0, 0.4, 0));
    g.add(mesh(new THREE.ConeGeometry(0.8, 3.4, 6), M('#2E5A45'), 0, 2.4, 0));
    return g;
  },
  poplar() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.6, 5), M('#4A3020'), 0, 0.3, 0));
    const crown = mesh(new THREE.IcosahedronGeometry(0.6, 0), M('#6E8F3E'), 0, 2.2, 0);
    crown.scale.set(1, 3, 1);
    g.add(crown);
    return g;
  },
  tea() {
    const g = new THREE.Group();
    for (let k = 0; k < 6; k++) {
      const bush = mesh(new THREE.SphereGeometry(0.55, 6, 4), M('#3E7A3A'), k * 1.1 - 2.75, 0.3, 0);
      bush.scale.y = 0.6;
      g.add(bush);
    }
    return g;
  },
};

// ---------- Landmarks (one per city, built from simple shapes) ----------
const LANDMARKS = {
  houseboat() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(10, 1, 2.4), M('#5A3A22'), 0, 0.2, 0));
    g.add(mesh(new THREE.BoxGeometry(8, 1.6, 2), M('#E9DCC0'), 0, 1.5, 0));
    g.add(mesh(new THREE.BoxGeometry(8.8, 0.3, 2.6), M('#8A2E2A'), 0, 2.45, 0));
    for (let k = 0; k < 6; k++) g.add(mesh(new THREE.BoxGeometry(0.7, 0.7, 0.05), M('#3A2416'), -3 + k * 1.2, 1.6, 1.02));
    g.add(mesh(new THREE.BoxGeometry(4, 0.3, 0.8), M('#B5523B'), 6, 0.1, 4));
    g.add(mesh(new THREE.BoxGeometry(1.6, 0.9, 0.8), M('#F2B632'), 6, 0.7, 4));
    return g;
  },
  pagoda() {
    const g = new THREE.Group();
    const roof = M('#4A2E1C');
    g.add(mesh(new THREE.BoxGeometry(4, 0.8, 4), M('#8C8272'), 0, 0.4, 0));
    g.add(mesh(new THREE.BoxGeometry(3, 2.4, 3), M('#6B3F22'), 0, 2, 0));
    [[3.6, 1.6, 3.8], [3.0, 1.4, 5.0], [2.3, 1.2, 6.1]].forEach(([r, h, y]) => {
      const c = mesh(new THREE.ConeGeometry(r, h, 4), roof, 0, y, 0);
      c.rotation.y = Math.PI / 4;
      g.add(c);
    });
    g.add(mesh(new THREE.ConeGeometry(0.9, 2.6, 4), M('#C9A24A', { metalness: 0.6 }), 0, 7.8, 0));
    return g;
  },
  goldenTemple() {
    const g = new THREE.Group();
    const gold = M('#E0B040', { metalness: 0.8, roughness: 0.3 });
    g.add(mesh(new THREE.BoxGeometry(24, 0.2, 14), M('#4F7F95', { roughness: 0.2, metalness: 0.3 }), 0, 0.05, 0));
    g.add(mesh(new THREE.BoxGeometry(26, 0.6, 1.5), M('#EFE7DA'), 0, 0.3, 7.5));
    g.add(mesh(new THREE.BoxGeometry(5, 1.6, 5), M('#EFE7DA'), 0, 0.9, 0));
    g.add(mesh(new THREE.BoxGeometry(4, 2.2, 4), gold, 0, 2.8, 0));
    const dome = mesh(new THREE.SphereGeometry(1.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, 3.9, 0);
    dome.scale.y = 1.3;
    g.add(dome);
    g.add(mesh(new THREE.ConeGeometry(0.25, 1.2, 6), gold, 0, 6.5, 0));
    for (const [x, z] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) {
      g.add(mesh(new THREE.SphereGeometry(0.4, 8, 6), gold, x, 4.1, z));
    }
    return g;
  },
  hawaMahal() {
    const g = new THREE.Group();
    const pink = M('#D9826A'), light = M('#F2C7A8');
    let y = 0;
    for (const [w, h] of [[14, 2.2], [12, 2], [10, 1.8], [7, 1.6], [4, 1.4]]) {
      g.add(mesh(new THREE.BoxGeometry(w, h, 2), pink, 0, y + h / 2, 0));
      const n = Math.floor(w / 1.2);
      for (let k = 0; k < n; k++) {
        const x = -w / 2 + 0.6 + (k * (w - 1.2)) / Math.max(1, n - 1);
        g.add(mesh(new THREE.BoxGeometry(0.6, h * 0.55, 0.3), light, x, y + h / 2, 1.05));
      }
      y += h;
    }
    for (let k = 0; k < 5; k++) g.add(mesh(new THREE.ConeGeometry(0.4, 0.9, 6), pink, -2 + k, y + 0.45, 0));
    return g;
  },
  taj() {
    const g = new THREE.Group();
    const marble = M('#F4F1EA', { roughness: 0.5 });
    g.add(mesh(new THREE.BoxGeometry(16, 1, 12), marble, 0, 0.5, 0));
    g.add(mesh(new THREE.BoxGeometry(7, 4.4, 6), marble, 0, 3.2, 0));
    g.add(mesh(new THREE.BoxGeometry(2.4, 3.4, 0.2), M('#D9D2C3'), 0, 2.9, 3.05));
    g.add(mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.8, 16), marble, 0, 5.8, 0));
    const dome = mesh(new THREE.SphereGeometry(2.3, 20, 14), marble, 0, 7.4, 0);
    dome.scale.y = 1.15;
    g.add(dome);
    g.add(mesh(new THREE.ConeGeometry(0.15, 1.4, 8), M('#C9A24A', { metalness: 0.8 }), 0, 10.4, 0));
    for (const [x, z] of [[-7.4, -5.4], [7.4, -5.4], [-7.4, 5.4], [7.4, 5.4]]) {
      g.add(mesh(new THREE.CylinderGeometry(0.3, 0.38, 7, 10), marble, x, 4.5, z));
      g.add(mesh(new THREE.SphereGeometry(0.5, 10, 8), marble, x, 8.3, z));
    }
    for (const [x, z] of [[-2.8, -2.4], [2.8, -2.4], [-2.8, 2.4], [2.8, 2.4]]) {
      g.add(mesh(new THREE.SphereGeometry(0.8, 12, 8), marble, x, 5.8, z));
    }
    return g;
  },
  church() {
    const g = new THREE.Group();
    const white = M('#F2EDE3'), trim = M('#C9A24A');
    g.add(mesh(new THREE.BoxGeometry(7, 6, 3), white, 0, 3, 0));
    const pediment = mesh(new THREE.CylinderGeometry(2.2, 2.2, 3, 3), white, 0, 6.9, 0);
    pediment.rotation.x = -Math.PI / 2;
    g.add(pediment);
    for (const sx of [-1, 1]) {
      g.add(mesh(new THREE.BoxGeometry(1.6, 8, 1.6), white, sx * 4.2, 4, 0));
      const cap = mesh(new THREE.ConeGeometry(1.1, 1.4, 4), trim, sx * 4.2, 8.7, 0);
      cap.rotation.y = Math.PI / 4;
      g.add(cap);
    }
    g.add(mesh(new THREE.BoxGeometry(1.6, 2.6, 0.2), M('#6B3A24'), 0, 1.3, 1.55));
    g.add(mesh(new THREE.BoxGeometry(0.15, 1.2, 0.15), trim, 0, 9.7, 0));
    g.add(mesh(new THREE.BoxGeometry(0.7, 0.15, 0.15), trim, 0, 9.9, 0));
    return g;
  },
  teaHut() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(3, 2, 2.5), M('#EDE3CF'), 0, 1, 0));
    const roof = mesh(new THREE.ConeGeometry(2.6, 1.4, 4), M('#B5523B'), 0, 2.7, 0);
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
    for (let row = 0; row < 6; row++) {
      for (let k = 0; k < 10; k++) {
        const bush = mesh(new THREE.SphereGeometry(0.7, 6, 4), M('#3E7A3A'), -12 + k * 2.6 + (row % 2) * 1.3, 0.3 + row * 0.9, -3 - row * 2.2);
        bush.scale.y = 0.6;
        g.add(bush);
      }
    }
    return g;
  },
  monastery() {
    const g = new THREE.Group();
    const white = M('#F1ECE2'), maroon = M('#7A2E2E'), gold = M('#E0B040', { metalness: 0.8, roughness: 0.3 });
    g.add(mesh(new THREE.BoxGeometry(10, 3, 5), white, 0, 1.5, 0));
    g.add(mesh(new THREE.BoxGeometry(10.2, 0.6, 5.2), maroon, 0, 3.2, 0));
    g.add(mesh(new THREE.BoxGeometry(6, 2.2, 4), maroon, 0, 4.6, 0));
    const roof = mesh(new THREE.ConeGeometry(4.6, 1.8, 4), gold, 0, 6.6, 0);
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 8), gold, 0, 8, 0));
    // Prayer flags strung between two poles
    const colors = ['#2E6FD0', '#F3F0E6', '#C24E3A', '#3E8A4A', '#F2B632'];
    for (const x of [-9, 9]) g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 7.5, 6), M('#5A3A22'), x, 3.25, 3));
    for (let k = 1; k < 20; k++) {
      const t = k / 20;
      const x = THREE.MathUtils.lerp(-9, 9, t);
      const y = 6.8 - Math.sin(t * Math.PI) * 1.6;
      g.add(mesh(new THREE.PlaneGeometry(0.6, 0.7), M(colors[k % 5], { side: THREE.DoubleSide }), x, y - 0.35, 3));
    }
    return g;
  },
  bhunga() {
    const g = new THREE.Group();
    const mud = M('#F4EEE2'), thatch = M('#9C7A4E'), red = M('#B5523B');
    for (const [x, z] of [[-5, 1], [0, -1], [5, 1.5]]) {
      g.add(mesh(new THREE.CylinderGeometry(1.8, 1.8, 2.2, 14), mud, x, 1.1, z));
      g.add(mesh(new THREE.ConeGeometry(2.3, 1.8, 14), thatch, x, 3.1, z));
      g.add(mesh(new THREE.BoxGeometry(0.8, 1.3, 0.1), red, x, 0.65, z + 1.8));
    }
    g.add(mesh(new THREE.SphereGeometry(5, 24, 16), new THREE.MeshBasicMaterial({ color: '#FFF6E0', fog: false }), 8, 20, -60));
    return g;
  },
  rootBridge() {
    const g = new THREE.Group();
    const root = M('#5A3A22'), leaf = M('#2E5A45');
    for (const sx of [-1, 1]) {
      g.add(mesh(new THREE.CylinderGeometry(0.8, 1.1, 7, 7), root, sx * 6.5, 3.5, 0));
      g.add(mesh(new THREE.IcosahedronGeometry(3.2, 0), leaf, sx * 6.5, 8, 0));
    }
    const deck = mesh(new THREE.TorusGeometry(6, 0.4, 6, 28, Math.PI), root, 0, 5, 0);
    deck.rotation.z = Math.PI;
    deck.scale.y = 0.35;
    g.add(deck);
    const rail = mesh(new THREE.TorusGeometry(6, 0.12, 5, 28, Math.PI), root, 0, 6.3, 0);
    rail.rotation.z = Math.PI;
    rail.scale.y = 0.3;
    g.add(rail);
    for (let k = 0; k < 14; k++) {
      const x = -5 + k * 0.75;
      const len = 0.8 + ((k * 7) % 5) * 0.3;
      const deckY = 5 - Math.sqrt(Math.max(0, 36 - x * x)) * 0.35;
      g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 4), root, x, deckY - len / 2, 0));
    }
    return g;
  },
};

// ---------- Landscape that scrolls past the train window ----------
export class Landscape {
  constructor() {
    this.group = new THREE.Group();
    this.groundMat = new THREE.MeshStandardMaterial({ roughness: 1 });
    this.hillMat = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true });
    this.farMat = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true });
    this.snowMat = new THREE.MeshStandardMaterial({ color: '#F7F7F2', roughness: 0.8, flatShading: true });

    const ground = mesh(new THREE.PlaneGeometry(800, 400), this.groundMat, 0, GROUND_Y, -200);
    ground.rotation.x = -Math.PI / 2;
    this.group.add(ground);

    this.water = mesh(new THREE.PlaneGeometry(800, 60),
      new THREE.MeshStandardMaterial({ color: '#5C8FA8', roughness: 0.15, metalness: 0.3 }), 0, GROUND_Y + 0.05, -55);
    this.water.rotation.x = -Math.PI / 2;
    this.group.add(this.water);

    // Track bed right outside the window
    this.group.add(mesh(new THREE.BoxGeometry(800, 0.3, 2.5), M('#5A4A3E'), 0, GROUND_Y, -3.6));

    this.items = [];
    seed = 7;

    // Telegraph poles: the strongest sense of speed
    for (let k = 0; k < 8; k++) {
      const pole = new THREE.Group();
      pole.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 6, 6), M('#3A2416'), 0, 3, 0));
      pole.add(mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), M('#3A2416'), 0, 5.6, 0));
      pole.position.set(0, GROUND_Y, -4.8);
      this.addItem(pole, k * 12, 96, 1);
    }

    // Rolling hills
    for (let k = 0; k < 14; k++) {
      const hill = mesh(new THREE.IcosahedronGeometry(1, 1), this.hillMat, 0, GROUND_Y, -55 - rnd() * 20);
      hill.scale.set(12 + rnd() * 10, 4 + rnd() * 5, 8);
      this.addItem(hill, k * 20, 280, 0.8);
    }

    // Far mountains with optional snow caps
    this.caps = [];
    for (let k = 0; k < 12; k++) {
      const m = new THREE.Group();
      const r = 14 + rnd() * 10, h = 14 + rnd() * 14;
      m.add(mesh(new THREE.ConeGeometry(r, h, 6), this.farMat, 0, h / 2, 0));
      const cap = mesh(new THREE.ConeGeometry(r * 0.33, h * 0.32, 6), this.snowMat, 0, h - h * 0.16 + 0.05, 0);
      this.caps.push(cap);
      m.add(cap);
      m.position.set(0, GROUND_Y, -130 - rnd() * 30);
      this.addItem(m, k * 35, 420, 0.4);
    }

    this.treeGroup = new THREE.Group();
    this.group.add(this.treeGroup);
    this.trees = [];
    this.landmark = null;
  }

  addItem(obj, base, range, factor) {
    this.group.add(obj);
    this.items.push({ obj, base, range, factor });
  }

  setBiome(cfg) {
    this.groundMat.color.set(cfg.ground);
    this.hillMat.color.set(cfg.hill);
    this.farMat.color.set(cfg.far);
    this.caps.forEach((c) => (c.visible = !!cfg.snow));
    this.water.visible = !!cfg.water;
    this.water.position.z = cfg.waterZ ?? -55;

    // Rebuild the near trees for this biome
    this.treeGroup.traverse((o) => o.geometry && o.geometry.dispose());
    this.treeGroup.clear();
    this.trees = [];
    seed = 11;
    const types = cfg.trees || [];
    const count = types.length ? cfg.density ?? 30 : 0;
    // Keep trees out of the lake or sea
    const depth = cfg.water ? Math.min(30, -(cfg.waterZ ?? -55) - 38) : 30;
    for (let k = 0; k < count; k++) {
      const type = types[k % types.length];
      const tree = TREES[type]();
      tree.position.set(0, GROUND_Y, -7 - rnd() * depth);
      tree.rotation.y = type === 'tea' ? 0 : rnd() * Math.PI;
      tree.scale.setScalar(0.8 + rnd() * 0.6);
      this.treeGroup.add(tree);
      this.trees.push({ obj: tree, base: rnd() * 140, range: 140, factor: 1 });
    }
  }

  setLandmark(key) {
    if (this.landmark) {
      this.group.remove(this.landmark);
      this.landmark.traverse((o) => o.geometry && o.geometry.dispose());
    }
    this.landmark = key ? LANDMARKS[key]() : null;
    if (this.landmark) {
      this.landmark.position.set(50, GROUND_Y, -35);
      this.group.add(this.landmark);
    }
  }

  // distance = how far the train has travelled, progress = scroll progress of the stop
  update(distance, progress) {
    for (const it of this.items) it.obj.position.x = wrap(it.base - distance * it.factor, it.range);
    for (const it of this.trees) it.obj.position.x = wrap(it.base - distance * it.factor, it.range);
    // Landmark passes the window, centred at the middle of the scroll
    if (this.landmark) this.landmark.position.x = 50 - progress * 100;
  }
}
