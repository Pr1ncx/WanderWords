import * as THREE from 'three';
import gsap from 'gsap';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { imageTexture, videoSource } from './media.js';
import { fitCamera } from './engine.js';
import { paintPlates } from './painter.js';
import { Particles, CITY_PARTICLES } from './particles.js';
import { CHAPTERS } from './chapters.js';

// A chapter is a painted panorama (4 parallax plates) with crisp 3D exhibits floating in front.
const SP = 6.2, EYE = 2.2, CAM_Z = 5.4, OFFSET = 1.3;
const TITLE = { pos: [-4.5, EYE + 0.3, CAM_Z + 3.5], look: [-1.5, EYE + 0.1, -10] };

// Exhibit 0 = hero video in a gilt arch, 1-4 = mounted prints (3 = craft/food, 4 = portrait)
const LAYOUT = [
  { x: 0, y: EYE + 0.15, z: 0, w: 4.6, h: 3.3, ry: -0.06, rz: 0 },
  { x: SP, y: EYE, z: 0.3, w: 3.4, h: 2.3, ry: 0.08, rz: -0.02 },
  { x: SP * 2, y: EYE + 0.1, z: -0.2, w: 3.4, h: 2.3, ry: -0.07, rz: 0.025 },
  { x: SP * 3, y: EYE, z: 0.4, w: 3.0, h: 2.1, ry: 0.06, rz: -0.03 },
  { x: SP * 4, y: EYE + 0.15, z: 0, w: 2.3, h: 3.0, ry: -0.06, rz: 0.02 },
];
// Camera sits left of each exhibit so the exhibit card (DOM, left) and the object (right) share the frame
const STATIONS = LAYOUT.map((l) => ({ pos: [l.x - OFFSET, EYE, CAM_Z], look: [l.x - OFFSET, EYE, -10] }));

const LAYERS = [
  { key: 'bg', z: -44, px: 1024, sway: 0 },
  { key: 'far', z: -26, px: 1536, sway: 0 },
  { key: 'mid', z: -14, px: 2048, sway: 0 },
  { key: 'fg', z: -4, px: 2048, sway: 1 },
];
const Q = matchMedia('(max-width: 900px)').matches ? 0.5 : 1;
const X0 = TITLE.pos[0] - 2, X1 = STATIONS[4].pos[0] + 2;

function archShape(w, h, y0 = 0) {
  const r = w / 2, s = new THREE.Shape();
  s.moveTo(-r, y0);
  s.lineTo(r, y0);
  s.lineTo(r, y0 + h - r);
  s.absarc(0, y0 + h - r, r, 0, Math.PI, false);
  s.lineTo(-r, y0);
  return s;
}

function normalizeUV(geo) {
  geo.computeBoundingBox();
  const b = geo.boundingBox, uv = geo.attributes.uv, p = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x), (p.getY(i) - b.min.y) / (b.max.y - b.min.y));
  }
  uv.needsUpdate = true;
}

// Soft drop shadow, shared by every exhibit
let SHADOW = null;
function shadowTexture() {
  if (SHADOW) return SHADOW;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.shadowColor = '#000';
  x.shadowBlur = 36;
  x.shadowOffsetX = 1000;
  x.fillStyle = '#000';
  x.fillRect(56 - 1000, 56, 144, 144);
  SHADOW = new THREE.CanvasTexture(c);
  return SHADOW;
}

function coverFit(v, imgAspect, planeAspect) {
  if (imgAspect > planeAspect) {
    const r = planeAspect / imgAspect;
    v.set(r, 1, (1 - r) / 2, 0);
  } else {
    const r = imgAspect / planeAspect;
    v.set(1, r, 0, (1 - r) / 2);
  }
}

function plateMaterial(map, sway) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, uTime: { value: 0 }, uSway: { value: sway }, uFit: { value: new THREE.Vector4(1, 1, 0, 0) } },
    transparent: true,
    depthWrite: false,
    premultipliedAlpha: true,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform float uTime, uSway;
      uniform vec4 uFit;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv;
        // Wind in the foreground grass: tips move, roots stay
        uv.x += sin(uTime * 1.3 + vUv.x * 90.0 + vUv.y * 12.0) * uSway * 0.0012 * smoothstep(0.2, 0.5, vUv.y);
        vec4 c = texture2D(map, uv * uFit.xy + uFit.zw);
        if (c.a < 0.004) discard;
        gl_FragColor = c;
        #include <colorspace_fragment>
      }`,
  });
}

export class Gallery {
  constructor(ch, env) {
    this.ch = ch;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(ch.biome.sky);
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.6;
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.05, 120);

    this.mode = 'title'; // title | moving | explore
    this.progress = 0;
    this.smooth = 0;
    this.pose = { pos: new THREE.Vector3(...TITLE.pos), look: new THREE.Vector3(...TITLE.look) };
    this.look = new THREE.Vector3();
    this.parallax = new THREE.Vector2();
    this.pickables = [];
    this.medias = [];
    this.animators = [];
    this.plates = [];
    this.raycaster = new THREE.Raycaster();
    this.posRail = new THREE.CatmullRomCurve3(STATIONS.map((s) => new THREE.Vector3(...s.pos)));
    this.lookRail = new THREE.CatmullRomCurve3(STATIONS.map((s) => new THREE.Vector3(...s.look)));

    this.buildPlates();
    this.buildLights();
    this.buildExhibits();
    this.buildTicket();
    this.particles = new Particles(CITY_PARTICLES[ch.id], { min: [X0, -0.5, -3.5], size: [X1 - X0, 7, 8] });
    this.scene.add(this.particles.points);
  }

  // ---------- Painted parallax plates ----------
  buildPlates() {
    const specs = LAYERS.map((l) => {
      const D = TITLE.pos[2] - l.z; // size for the widest (title) view
      const worldW = 2.3 * D + (X1 - X0), worldH = 1.7 * D;
      const w = Math.round(l.px * Q);
      return { ...l, w, h: Math.round((w * worldH) / worldW), worldW, worldH };
    });
    const canvases = paintPlates(this.ch, specs);
    specs.forEach((s, k) => {
      const tex = new THREE.CanvasTexture(canvases[s.key]);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.premultiplyAlpha = true;
      tex.anisotropy = 4;
      const mat = plateMaterial(tex, s.sway);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(s.worldW, s.worldH), mat);
      mesh.position.set((X0 + X1) / 2, EYE, s.z);
      mesh.renderOrder = k - LAYERS.length; // far to near, before exhibits' shadows and particles
      this.scene.add(mesh);
      this.plates.push(mat);
      this.loadPlate(mat, s);
    });
  }

  // Optional hand-made plate: public/media/<id>/plate-<key>.webp replaces the painted one
  loadPlate(mat, s) {
    new THREE.TextureLoader().load(`/media/${this.ch.id}/plate-${s.key}.webp`, (t) => {
      if (!this.plates.includes(mat)) { t.dispose(); return; }
      t.colorSpace = THREE.SRGBColorSpace;
      t.premultiplyAlpha = true;
      t.anisotropy = 8;
      const old = mat.uniforms.map.value;
      mat.uniforms.map.value = t;
      coverFit(mat.uniforms.uFit.value, t.image.width / t.image.height, s.worldW / s.worldH);
      old.dispose();
    }, undefined, () => {});
  }

  buildLights() {
    const key = new THREE.DirectionalLight('#FFE2B8', 2.4); // chiaroscuro key, top left
    key.position.set(-6, 10, 9);
    const rim = new THREE.DirectionalLight('#A8C0FF', 0.8);
    rim.position.set(8, 4, -6);
    this.scene.add(key, rim, new THREE.HemisphereLight('#FFF1DC', '#2A1A10', 0.35));
  }

  // ---------- Crisp 3D exhibits ----------
  buildExhibits() {
    this.gilt = new THREE.MeshPhysicalMaterial({ color: '#C9A24A', metalness: 1, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.2 });
    this.mount = new THREE.MeshPhysicalMaterial({ color: '#F3E6CC', roughness: 0.6, sheen: 0.5, sheenColor: new THREE.Color('#FFFFFF') });
    LAYOUT.forEach((l, k) => {
      const g = new THREE.Group();
      g.position.set(l.x, l.y, l.z);
      g.rotation.set(0, l.ry, l.rz);
      this.scene.add(g);
      const ex = this.ch.exhibits[k];
      if (k === 0) this.heroArch(g, ex, l);
      else this.print(g, ex, l, k);

      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(l.w + 1.6, l.h + 1.6),
        new THREE.MeshBasicMaterial({ map: shadowTexture(), color: '#000000', transparent: true, opacity: 0.5, depthWrite: false }));
      shadow.material.userData.sharedMap = true;
      shadow.position.set(0.25, -0.3, -0.45);
      g.add(shadow);

      this.animators.push((dt, t) => {
        g.position.y = l.y + Math.sin(t * 0.7 + k * 1.7) * 0.05;
        g.rotation.y = l.ry + this.parallax.x * 0.08;
        g.rotation.x = this.parallax.y * 0.04;
      });
    });
  }

  heroArch(g, ex, l) {
    const outer = archShape(l.w + 0.5, l.h + 0.45, -l.h / 2 - 0.225);
    outer.holes.push(archShape(l.w, l.h, -l.h / 2));
    const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, {
      depth: 0.16, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 32,
    }), this.gilt);
    frame.position.z = -0.08;
    g.add(frame);

    const geo = new THREE.ShapeGeometry(archShape(l.w, l.h, -l.h / 2), 32);
    normalizeUV(geo);
    const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
    const media = videoSource(ex.src, ex.title, this.ch.accent, l.w / l.h);
    media.material = mat;
    mat.map = media.texture;
    const screen = new THREE.Mesh(geo, mat);
    screen.userData.exhibit = 0;
    g.add(screen);
    this.pickables.push(screen);
    this.medias.push(media);
  }

  print(g, ex, l, k) {
    const m = 0.16, foot = 0.22;
    const board = new THREE.Mesh(new RoundedBoxGeometry(l.w + m * 2, l.h + m * 2 + foot, 0.06, 3, 0.02), this.mount);
    board.position.y = -foot / 2;
    g.add(board);
    const fillet = new THREE.Mesh(new THREE.PlaneGeometry(l.w + 0.05, l.h + 0.05), this.gilt);
    fillet.position.z = 0.036;
    g.add(fillet);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(l.w, l.h),
      new THREE.MeshBasicMaterial({ map: imageTexture(ex.src, ex.title, this.ch.accent, l.w / l.h), toneMapped: false }));
    pic.position.z = 0.04;
    pic.userData.exhibit = k;
    g.add(pic);
    this.pickables.push(pic);
  }

  // A paper train ticket floating in the title view, with a punched hole
  buildTicket() {
    const n = CHAPTERS.indexOf(this.ch) + 1;
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    const x = c.getContext('2d');
    x.fillStyle = '#EFE3C8';
    x.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 6000; i++) {
      x.fillStyle = Math.random() < 0.5 ? 'rgba(90,60,30,.06)' : 'rgba(255,255,255,.08)';
      x.fillRect(Math.random() * 1024, Math.random() * 512, 2, 2);
    }
    x.strokeStyle = this.ch.accent;
    x.lineWidth = 6;
    x.strokeRect(24, 24, 976, 464);
    x.lineWidth = 2;
    x.strokeRect(38, 38, 948, 436);
    x.setLineDash([10, 12]);
    x.beginPath();
    x.moveTo(760, 38);
    x.lineTo(760, 474);
    x.stroke();
    x.setLineDash([]);
    x.fillStyle = '#2A1A10';
    x.textAlign = 'left';
    x.font = '700 30px Inter';
    x.fillText('WANDERWORDS EXPRESS', 70, 100);
    x.font = '500 22px Inter';
    x.fillStyle = this.ch.accent;
    x.fillText(`CHAPTER ${String(n).padStart(2, '0')}`, 70, 140);
    x.fillStyle = '#2A1A10';
    x.font = 'italic 96px "Playfair Display"';
    x.fillText(this.ch.name, 70, 250, 660);
    x.font = 'italic 30px "Playfair Display"';
    x.fillText(this.ch.tagline, 70, 305, 660);
    x.font = '500 20px Inter';
    x.fillText('ADMIT ONE · SECOND CLASS · WINDOW SEAT', 70, 420, 660);
    x.save();
    x.translate(875, 256);
    x.rotate(-Math.PI / 2);
    x.textAlign = 'center';
    x.font = '700 28px Inter';
    x.fillText(`Nº ${1000 + Math.floor(Math.random() * 9000)}`, 0, 0);
    x.font = '500 18px Inter';
    x.fillText('WW-2026', 0, 36);
    x.restore();
    x.globalCompositeOperation = 'destination-out';
    x.beginPath();
    x.arc(905, 90, 18, 0, Math.PI * 2);
    x.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const geo = new THREE.PlaneGeometry(1.7, 0.85, 24, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / 0.85;
      p.setZ(i, -0.07 * u * u); // a gentle paper curl
    }
    geo.computeVertexNormals();
    const ticket = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
      map: tex, alphaTest: 0.5, roughness: 0.75, sheen: 0.6, sheenColor: new THREE.Color('#FFFFFF'), side: THREE.DoubleSide,
    }));
    ticket.position.set(-2.8, 1.7, 5.7);
    ticket.rotation.set(-0.2, -0.35, 0.1);
    this.scene.add(ticket);
    this.animators.push((dt, t) => {
      ticket.position.y = 1.7 + Math.sin(t * 0.9) * 0.05;
      ticket.rotation.z = 0.1 + Math.sin(t * 0.6) * 0.04;
      ticket.rotation.y = -0.35 + this.parallax.x * 0.15;
    });
  }

  // Ritual reward: the air comes alive for a moment
  celebrate() {
    if (this.celebrating) return;
    this.celebrating = true;
    const u = this.particles.material.uniforms, o = u.uOpacity.value, s = u.uSway.value;
    gsap.timeline({ onComplete: () => (this.celebrating = false) })
      .to(u.uOpacity, { value: Math.min(1, o * 2.2), duration: 0.4, ease: 'power2.out' }, 0)
      .to(u.uSway, { value: s * 3, duration: 0.4, ease: 'power2.out' }, 0)
      .to(u.uOpacity, { value: o, duration: 2.6, ease: 'power2.inOut' }, 0.6)
      .to(u.uSway, { value: s, duration: 2.6, ease: 'power2.inOut' }, 0.6);
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
    // Move the lens with the pointer so the plates separate in depth
    this.camera.position.set(this.pose.pos.x + this.parallax.x * 0.35, this.pose.pos.y - this.parallax.y * 0.2, this.pose.pos.z);
    this.look.set(this.pose.look.x + this.parallax.x * 0.1, this.pose.look.y - this.parallax.y * 0.05, this.pose.look.z);
    this.camera.lookAt(this.look);
    for (const m of this.plates) m.uniforms.uTime.value = t;
    this.particles.update(t);
    for (const a of this.animators) a(dt, t);
  }

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
    this.plates = [];
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      mats.forEach((m) => {
        if (m.uniforms && m.uniforms.map && m.uniforms.map.value) m.uniforms.map.value.dispose();
        if (m.map && !m.userData.sharedMap) m.map.dispose();
        m.dispose();
      });
    });
  }

  resize(aspect) {
    fitCamera(this.camera, aspect);
    this.particles.resize(this.camera);
  }
}
