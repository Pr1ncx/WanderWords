import * as THREE from 'three';
import gsap from 'gsap';
import { imageTexture, videoSource } from './media.js';
import { fitCamera } from './engine.js';
import { Particles } from './particles.js';
import { SCENES, paintScene } from './scenes.js';

// A chapter is one cinematic tableau: the city's scene art (public/media/<id>/scene.webp) brought to life in a
// single full-screen shader (depth parallax, god rays, bloom, water, haze, a breathing focal glow), with
// drifting particles and out-of-focus bokeh in front of the lens. Scrolling cuts through the 5 photos/videos
// as full-screen shots, then returns to the scene for the ritual.

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const BASE_ZOOM = 1.04, EXPLORE_ZOOM = 1.1;

function aspectOf(tex) {
  const im = tex && tex.image;
  if (!im) return 16 / 9;
  const w = im.videoWidth || im.naturalWidth || im.width, h = im.videoHeight || im.naturalHeight || im.height;
  return w && h ? w / h : 16 / 9;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }`;

const fragmentShader = /* glsl */ `
  uniform sampler2D tScene, tDepth, tA, tB;
  uniform float uHasDepth, uSceneAspect, uAspect, uTime, uZoom, uShot, uMixAB, uKenA, uKenB, uAspA, uAspB;
  uniform float uGlow, uCharge, uRays, uWater, uLift;
  uniform vec2 uLook, uRayOrigin;
  uniform vec3 uGlowColor, uHaze;
  varying vec2 vUv;

  // Fit an image to the screen like CSS object-fit: cover
  vec2 cover(vec2 uv, float imgAspect) {
    vec2 s = uAspect > imgAspect ? vec2(1.0, imgAspect / uAspect) : vec2(uAspect / imgAspect, 1.0);
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    vec2 uv = (cover(vUv, uSceneAspect) - 0.5) / uZoom + 0.5;

    // Depth: the map if provided, otherwise lower in frame = nearer
    float depth = uHasDepth > 0.5 ? texture2D(tDepth, uv).r : clamp(1.0 - uv.y * 1.6, 0.0, 1.0);
    vec2 p = uv + uLook * (depth - 0.35) * 0.02;

    // Water: gentle ripples below the waterline
    float wet = 0.0;
    float below = uWater - p.y;
    if (below > 0.0) {
      wet = min(below * 10.0, 1.0);
      p.x += sin(p.y * 180.0 + uTime * 1.6) * 0.0015 * wet;
      p.y += sin(p.x * 90.0 + uTime * 1.1) * 0.0012 * wet;
    }

    vec3 col = texture2D(tScene, p).rgb;

    if (uShot < 0.999) {
      // Soft bloom from a blurred mip level
      vec3 blur = texture2D(tScene, p, 4.0).rgb;
      col += blur * smoothstep(0.55, 1.0, max(max(blur.r, blur.g), blur.b)) * (0.3 + uLift * 0.4);

      // God rays from the scene's light source
      vec2 dir = (uRayOrigin - p) / 14.0;
      vec2 q = p;
      float rays = 0.0, w = 1.0;
      for (int i = 0; i < 14; i++) {
        q += dir;
        rays += smoothstep(0.6, 1.0, dot(texture2D(tScene, q, 2.0).rgb, vec3(0.333))) * w;
        w *= 0.88;
      }
      col += mix(vec3(1.0, 0.96, 0.9), uGlowColor, 0.3) * rays * 0.045 * (uRays + uCharge * 0.8);

      // Glints on the water
      if (wet > 0.0) col += vec3(pow(max(0.0, sin(p.x * 400.0 + uTime * 2.0) * sin(p.y * 900.0 - uTime)), 12.0) * 0.12 * wet);

      // Atmospheric perspective: far things melt into the pastel air
      col = mix(col, uHaze, (1.0 - depth) * 0.08);

      // The focal point breathes, and answers the ritual
      float r = length((vUv - 0.5) * vec2(uAspect, 1.0));
      float g = uGlow * (0.85 + 0.15 * sin(uTime * 1.3)) + uCharge * 1.1;
      col += uGlowColor * g * (exp(-r * 7.0) * 0.7 + exp(-r * 2.0) * 0.18);
      col += vec3(uLift * 0.12);
    }

    // Shots: full-screen photos and video, crossfaded with a slow push-in
    if (uShot > 0.001) {
      vec2 ua = (cover(vUv, uAspA) - 0.5) / uKenA + 0.5;
      vec2 ub = (cover(vUv, uAspB) - 0.5) / uKenB + 0.5;
      vec3 shot = mix(texture2D(tA, ua).rgb, texture2D(tB, ub).rgb, uMixAB);
      col = mix(col, shot, uShot);
    }

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

export class Tableau {
  constructor(ch, env) {
    this.ch = ch;
    this.sc = SCENES[ch.id] || SCENES.srinagar;
    this.scene = new THREE.Scene();
    this.scene.environment = env;
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.05, 50);
    this.mode = 'title'; // title | moving | explore
    this.progress = 0;
    this.smooth = 0;
    this.current = -1;
    this.parallax = new THREE.Vector2();
    this.aspect = innerWidth / innerHeight;
    this.view = { zoom: BASE_ZOOM };
    this.charge = { v: 0 };
    this.textures = [];
    this.medias = [];

    const sc = this.sc;
    const placeholder = new THREE.CanvasTexture(paintScene(ch.id));
    placeholder.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(placeholder);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tScene: { value: placeholder }, tDepth: { value: placeholder }, tA: { value: placeholder }, tB: { value: placeholder },
        uHasDepth: { value: 0 }, uSceneAspect: { value: placeholder.image.width / placeholder.image.height },
        uAspect: { value: this.aspect }, uTime: { value: 0 }, uZoom: { value: BASE_ZOOM },
        uShot: { value: 0 }, uMixAB: { value: 0 }, uKenA: { value: 1 }, uKenB: { value: 1 },
        uAspA: { value: 16 / 9 }, uAspB: { value: 16 / 9 },
        uGlow: { value: 0.35 }, uCharge: { value: 0 }, uRays: { value: 1 }, uLift: { value: 0 },
        uWater: { value: sc.pool ? sc.horizon - 0.004 : 0 },
        uLook: { value: new THREE.Vector2() },
        uRayOrigin: { value: new THREE.Vector2(sc.rays[0], sc.rays[1]) },
        uGlowColor: { value: new THREE.Color(sc.glow) },
        uHaze: { value: new THREE.Color(sc.haze) },
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

    // Drifting atmosphere in the air, and a few huge soft specks right against the lens
    this.particles = new Particles(sc.particles, { min: [-7, -4, -9], size: [14, 8, 7.5] });
    this.bokeh = new Particles('bokeh', { min: [-3, -2, -3.2], size: [6, 4, 2] }, { color: sc.bokeh });
    this.scene.add(this.particles.points, this.bokeh.points);
    const pu = this.particles.material.uniforms;
    this.base = { o: pu.uOpacity.value, s: pu.uSway.value };
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
      this.u.uWater.value = this.sc.water;
    }, undefined, () => {});
    loader.load(`/media/${this.ch.id}/scene-depth.webp`, (t) => {
      if (this.disposed) { t.dispose(); return; }
      t.colorSpace = THREE.NoColorSpace;
      this.textures.push(t);
      this.u.tDepth.value = t;
      this.u.uHasDepth.value = 1;
    }, undefined, () => {});
  }

  // Exhibit 0 = hero video, 1-4 = photos
  buildShots() {
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

  setShot(tex, asp, shot) {
    const t = shot.texture;
    this.u[tex].value = t;
    this.u[asp].value = aspectOf(t);
  }

  update(dt, t, pointer) {
    this.parallax.lerp(pointer, Math.min(1, dt * 2.5));
    this.smooth += (this.progress - this.smooth) * Math.min(1, dt * 4);
    const u = this.u, drift = REDUCED ? 0 : 1;
    u.uTime.value = t;
    u.uCharge.value = this.charge.v;
    u.uZoom.value = this.view.zoom + this.charge.v * 0.035 + Math.sin(t * 0.11) * 0.004 * drift;
    u.uLook.value.set(this.parallax.x + Math.sin(t * 0.13) * 0.4 * drift, -this.parallax.y + Math.sin(t * 0.09) * 0.25 * drift);

    const p = this.mode === 'explore' ? this.smooth : 0;
    const vis = smooth(0, 0.06, p) * (1 - smooth(0.94, 1, p));
    u.uShot.value = vis;
    this.current = -1;
    if (vis > 0) {
      const f = clamp01((p - 0.03) / 0.94) * 4;
      const a = Math.min(4, Math.floor(f)), b = Math.min(4, a + 1);
      u.uMixAB.value = a === b ? 0 : smooth(0.35, 0.65, f - a);
      this.setShot('tA', 'uAspA', this.shots[a]);
      this.setShot('tB', 'uAspB', this.shots[b]);
      u.uKenA.value = 1 + 0.05 * clamp01((f - a + 0.5) / 2);
      u.uKenB.value = 1 + 0.05 * clamp01((f - b + 0.5) / 2);
      if (vis > 0.5) this.current = u.uMixAB.value > 0.5 ? b : a;
    }

    this.camera.position.set(this.parallax.x * 0.3, -this.parallax.y * 0.2, 0);
    this.camera.lookAt(0, 0, -10);
    this.particles.update(t);
    this.bokeh.update(t);
  }

  // EXPLORE: a slow push into the scene before the shots begin
  enterExplore() {
    this.mode = 'moving';
    return gsap.timeline({ onComplete: () => { this.mode = 'explore'; this.progress = 0; this.smooth = 0; } })
      .to(this.view, { zoom: EXPLORE_ZOOM, duration: 1.6, ease: 'power2.inOut' });
  }

  backToTitle() {
    this.mode = 'moving';
    return gsap.timeline({ onComplete: () => (this.mode = 'title') })
      .to(this.view, { zoom: BASE_ZOOM, duration: 1.2, ease: 'power2.inOut' });
  }

  // Ritual progress 0..1: the focal point gathers light while you perform it
  setCharge(p) {
    gsap.to(this.charge, { v: clamp01(p), duration: 0.3, ease: 'power2.out', overwrite: true });
  }

  // A city whose stamp is already earned stays lit
  lit() {
    this.u.uGlow.value = 0.6;
    this.u.uRays.value = 1.3;
  }

  // Ritual reward: a flash of light, the rays swell, the air comes alive, and the scene stays lit
  celebrate() {
    const u = this.u, pu = this.particles.material.uniforms, { o, s } = this.base;
    gsap.to(this.charge, { v: 0, duration: 2.4, ease: 'power2.inOut', overwrite: true });
    gsap.timeline()
      .to(u.uLift, { value: 1, duration: 0.35, ease: 'power2.out' }, 0)
      .to(u.uGlow, { value: 1.6, duration: 0.5, ease: 'power2.out' }, 0)
      .to(u.uRays, { value: 2.4, duration: 0.8, ease: 'power2.out' }, 0)
      .to(pu.uOpacity, { value: Math.min(1, o * 2), duration: 0.4 }, 0)
      .to(pu.uSway, { value: s * 3, duration: 0.4 }, 0)
      .to(u.uLift, { value: 0, duration: 2.2, ease: 'power2.inOut' }, 0.5)
      .to(u.uGlow, { value: 0.6, duration: 3, ease: 'power2.inOut' }, 0.8)
      .to(u.uRays, { value: 1.3, duration: 3, ease: 'power2.inOut' }, 0.8)
      .to(pu.uOpacity, { value: o, duration: 2.6 }, 0.8)
      .to(pu.uSway, { value: s, duration: 2.6 }, 0.8);
  }

  // The shot on screen (for the lightbox), or -1 while the scene is showing
  pick() {
    return this.current;
  }

  play() { this.medias.forEach((m) => m.play()); }
  pause() { this.medias.forEach((m) => m.pause()); }

  dispose() {
    this.disposed = true;
    gsap.killTweensOf([this.view, this.charge, this.u.uGlow, this.u.uRays, this.u.uLift]);
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
    this.bokeh.resize(this.camera);
  }
}
