import * as THREE from 'three';
import gsap from 'gsap';
import { imageTexture, videoSource } from './media.js';
import { fitCamera } from './engine.js';
import { Particles, CITY_PARTICLES } from './particles.js';

// A chapter is one cinematic tableau: the city's scene art (public/media/<id>/scene.webp)
// brought to life in a single full-screen shader, with the 5 photos/videos as full-screen shots.

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

// Soft placeholder until the real scene art exists: pastel sky, glow at the centre, still water
function placeholderScene(ch) {
  const w = 1024, h = 576, c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d'), b = ch.biome, hz = h * 0.6;
  x.fillStyle = b.sky;
  x.fillRect(0, 0, w, h);
  let g = x.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, 'rgba(46,58,107,0.35)');
  g.addColorStop(1, 'rgba(46,58,107,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, w, hz);
  g = x.createRadialGradient(w / 2, hz, 0, w / 2, hz, w * 0.55);
  g.addColorStop(0, 'rgba(255,246,228,0.95)');
  g.addColorStop(0.35, 'rgba(255,236,210,0.35)');
  g.addColorStop(1, 'rgba(255,236,210,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  x.fillStyle = b.far;
  x.globalAlpha = 0.55;
  x.beginPath();
  x.moveTo(0, hz);
  for (let i = 0; i <= 64; i++) {
    const u = i / 64;
    x.lineTo(u * w, hz - (Math.sin(u * 7.3) * 0.5 + Math.sin(u * 17.1) * 0.25 + 0.8) * h * 0.05);
  }
  x.lineTo(w, hz);
  x.closePath();
  x.fill();
  x.globalAlpha = 1;
  g = x.createLinearGradient(0, hz, 0, h);
  g.addColorStop(0, 'rgba(255,244,228,0.55)');
  g.addColorStop(1, b.hill);
  x.fillStyle = g;
  x.fillRect(0, hz, w, h - hz);
  g = x.createRadialGradient(w / 2, h * 0.5, 0, w / 2, h * 0.5, h * 0.12);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.4, 'rgba(255,240,215,0.5)');
  g.addColorStop(1, 'rgba(255,240,215,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  return c;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }`;

const fragmentShader = /* glsl */ `
  uniform sampler2D tScene, tDepth, tA, tB;
  uniform mat3 uMatA, uMatB;
  uniform float uHasDepth, uSceneAspect, uAspect, uTime, uZoom, uShot, uMixAB, uKenA, uKenB, uGlow, uRays, uWater;
  uniform vec2 uLook;
  varying vec2 vUv;

  // Fit the art to the screen like CSS object-fit: cover
  vec2 cover(vec2 uv, float imgAspect) {
    vec2 s = uAspect > imgAspect ? vec2(1.0, imgAspect / uAspect) : vec2(uAspect / imgAspect, 1.0);
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    vec2 uv = (cover(vUv, uSceneAspect) - 0.5) / uZoom + 0.5;

    // Depth: the map if provided, otherwise lower in frame = nearer
    float depth = uHasDepth > 0.5 ? texture2D(tDepth, uv).r : clamp(1.0 - uv.y * 1.6, 0.0, 1.0);
    vec2 p = uv + uLook * (depth - 0.35) * 0.025;

    // Water: gentle ripples below the waterline
    float below = uWater - p.y;
    if (below > 0.0) {
      float k = min(below * 8.0, 1.0);
      p.x += sin(p.y * 180.0 + uTime * 1.6) * 0.0015 * k;
      p.y += sin(p.x * 90.0 + uTime * 1.1) * 0.0012 * k;
    }

    vec3 col = texture2D(tScene, p).rgb;
    vec3 col0 = col;

    if (uShot < 0.999) {
      // Soft bloom from a blurred mip level
      vec3 blur = texture2D(tScene, p, 4.5).rgb;
      col += blur * smoothstep(0.55, 1.0, max(max(blur.r, blur.g), blur.b)) * 0.35;

      // God rays from the upper right
      vec2 dir = (vec2(0.82, 1.05) - p) / 12.0;
      vec2 q = p;
      float rays = 0.0, w = 1.0;
      for (int i = 0; i < 12; i++) {
        q += dir;
        rays += smoothstep(0.62, 1.0, dot(texture2D(tScene, q, 2.0).rgb, vec3(0.333))) * w;
        w *= 0.9;
      }
      col += vec3(1.0, 0.95, 0.85) * rays * 0.05 * uRays;

      // The focal point answers the ritual
      float r = length((vUv - 0.5) * vec2(uAspect, 1.0));
      col += vec3(1.0, 0.9, 0.7) * uGlow * (exp(-r * 6.0) * 0.8 + exp(-r * 1.5) * 0.15);
    }

    // Shots: full-screen photos and video, crossfaded with a slow push-in
    if (uShot > 0.001) {
      vec2 ua = (uMatA * vec3((vUv - 0.5) / uKenA + 0.5, 1.0)).xy;
      vec2 ub = (uMatB * vec3((vUv - 0.5) / uKenB + 0.5, 1.0)).xy;
      vec3 shot = mix(texture2D(tA, ua).rgb, texture2D(tB, ub).rgb, uMixAB);
      col = mix(col, shot, uShot);
    }

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

export class Tableau {
  constructor(ch, env) {
    this.ch = ch;
    this.scene = new THREE.Scene();
    this.scene.environment = env;
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.05, 50);
    this.mode = 'title'; // title | moving | explore
    this.progress = 0;
    this.smooth = 0;
    this.current = -1;
    this.parallax = new THREE.Vector2();
    this.aspect = innerWidth / innerHeight;

    const placeholder = new THREE.CanvasTexture(placeholderScene(ch));
    placeholder.colorSpace = THREE.SRGBColorSpace;
    this.textures = [placeholder];

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tScene: { value: placeholder }, tDepth: { value: placeholder }, tA: { value: placeholder }, tB: { value: placeholder },
        uMatA: { value: new THREE.Matrix3() }, uMatB: { value: new THREE.Matrix3() },
        uHasDepth: { value: 0 }, uSceneAspect: { value: 16 / 9 }, uAspect: { value: this.aspect },
        uTime: { value: 0 }, uZoom: { value: 1 }, uShot: { value: 0 }, uMixAB: { value: 0 },
        uKenA: { value: 1 }, uKenB: { value: 1 }, uGlow: { value: 0.15 }, uRays: { value: 1 }, uWater: { value: 0.4 },
        uLook: { value: new THREE.Vector2() },
      },
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    this.u = this.material.uniforms;
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    quad.renderOrder = -10;
    this.scene.add(quad);

    this.loadArt();
    this.buildShots();

    // Drifting petals / snow / fireflies in front of the art, bigger and softer when close to the lens
    this.particles = new Particles(CITY_PARTICLES[ch.id], { min: [-7, -4, -9], size: [14, 8, 7.5] });
    this.scene.add(this.particles.points);
  }

  // Real scene art replaces the placeholder as soon as it loads
  loadArt() {
    const loader = new THREE.TextureLoader();
    loader.load(`/media/${this.ch.id}/scene.webp`, (t) => {
      if (this.disposed) { t.dispose(); return; }
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      this.textures.push(t);
      this.u.tScene.value = t;
      this.u.uSceneAspect.value = t.image.width / t.image.height;
      this.u.uWater.value = 0.33;
    }, undefined, () => {});
    loader.load(`/media/${this.ch.id}/scene-depth.webp`, (t) => {
      if (this.disposed) { t.dispose(); return; }
      t.colorSpace = THREE.NoColorSpace;
      this.textures.push(t);
      this.u.tDepth.value = t;
      this.u.uHasDepth.value = 1;
    }, undefined, () => {});
  }

  // Exhibit 0 = hero video, 1-4 = photos, each fitted to the screen
  buildShots() {
    this.medias = [];
    this.shots = this.ch.exhibits.map((ex, k) => {
      if (k === 0) {
        const media = videoSource(ex.src, ex.title, this.ch.accent, this.aspect);
        this.medias.push(media);
        return { get texture() { return media.texture; } };
      }
      const tex = imageTexture(ex.src, ex.title, this.ch.accent, this.aspect);
      this.textures.push(tex);
      return { texture: tex };
    });
  }

  setShot(uniform, matrix, shot) {
    const t = shot.texture;
    t.updateMatrix();
    this.u[uniform].value = t;
    this.u[matrix].value.copy(t.matrix);
  }

  update(dt, t, pointer) {
    this.parallax.lerp(pointer, Math.min(1, dt * 2.5));
    this.smooth += (this.progress - this.smooth) * Math.min(1, dt * 4);
    const u = this.u, drift = REDUCED ? 0 : 1;
    u.uTime.value = t;
    u.uLook.value.set(this.parallax.x + Math.sin(t * 0.13) * 0.4 * drift, -this.parallax.y + Math.sin(t * 0.09) * 0.25 * drift);

    const p = this.mode === 'explore' ? this.smooth : 0;
    const vis = smooth(0, 0.06, p) * (1 - smooth(0.94, 1, p));
    u.uShot.value = vis;
    this.current = -1;
    if (vis > 0) {
      const f = clamp01((p - 0.03) / 0.94) * 4;
      const a = Math.min(4, Math.floor(f)), b = Math.min(4, a + 1);
      u.uMixAB.value = a === b ? 0 : smooth(0.35, 0.65, f - a);
      this.setShot('tA', 'uMatA', this.shots[a]);
      this.setShot('tB', 'uMatB', this.shots[b]);
      u.uKenA.value = 1 + 0.05 * clamp01((f - a + 0.5) / 2);
      u.uKenB.value = 1 + 0.05 * clamp01((f - b + 0.5) / 2);
      if (vis > 0.5) this.current = u.uMixAB.value > 0.5 ? b : a;
    }

    this.camera.position.set(this.parallax.x * 0.3, -this.parallax.y * 0.2, 0);
    this.camera.lookAt(0, 0, -10);
    this.particles.update(t);
  }

  // EXPLORE: a slow push into the scene before the shots begin
  enterExplore() {
    this.mode = 'moving';
    return gsap.timeline({ onComplete: () => { this.mode = 'explore'; this.progress = 0; this.smooth = 0; } })
      .to(this.u.uZoom, { value: 1.06, duration: 1.6, ease: 'power2.inOut' });
  }

  backToTitle() {
    this.mode = 'moving';
    return gsap.timeline({ onComplete: () => (this.mode = 'title') })
      .to(this.u.uZoom, { value: 1, duration: 1.2, ease: 'power2.inOut' });
  }

  // Ritual reward: the focal point lights up, rays swell, the air comes alive
  celebrate() {
    const u = this.u, pu = this.particles.material.uniforms, o = pu.uOpacity.value, s = pu.uSway.value;
    gsap.timeline()
      .to(u.uGlow, { value: 1.4, duration: 0.5, ease: 'power2.out' }, 0)
      .to(u.uRays, { value: 2.2, duration: 0.8, ease: 'power2.out' }, 0)
      .to(pu.uOpacity, { value: Math.min(1, o * 2.2), duration: 0.4 }, 0)
      .to(pu.uSway, { value: s * 3, duration: 0.4 }, 0)
      .to(u.uGlow, { value: 0.4, duration: 3, ease: 'power2.inOut' }, 0.8)
      .to(u.uRays, { value: 1.2, duration: 3, ease: 'power2.inOut' }, 0.8)
      .to(pu.uOpacity, { value: o, duration: 2.6 }, 0.8)
      .to(pu.uSway, { value: s, duration: 2.6 }, 0.8);
  }

  // Clicking a shot opens it in the lightbox
  pick() {
    return this.current;
  }

  play() { this.medias.forEach((m) => m.play()); }
  pause() { this.medias.forEach((m) => m.pause()); }

  dispose() {
    this.disposed = true;
    this.medias.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  }

  resize(aspect) {
    this.aspect = aspect;
    this.u.uAspect.value = aspect;
    fitCamera(this.camera, aspect);
    this.particles.resize(this.camera);
  }
}
