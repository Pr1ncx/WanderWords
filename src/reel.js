import * as THREE from 'three';
import { imageTexture, videoSource } from './media.js';

// A chapter's footage: full-bleed shots inside the cinema frame, dissolving from one to the next as you scroll.
// Each shot pushes in by no more than 3%. No overlays, no particles: the unified grade in post.js is the only
// treatment, and the footage keeps its own colour (no tone mapping).

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const PUSH = 0.03;

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
  uniform sampler2D tA, tB;
  uniform float uAspect, uAspA, uAspB, uMix, uKenA, uKenB;
  varying vec2 vUv;

  // Fit an image to the picture like CSS object-fit: cover
  vec2 cover(vec2 uv, float imgAspect) {
    vec2 s = uAspect > imgAspect ? vec2(1.0, imgAspect / uAspect) : vec2(uAspect / imgAspect, 1.0);
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    vec2 ua = (cover(vUv, uAspA) - 0.5) / uKenA + 0.5;
    vec2 ub = (cover(vUv, uAspB) - 0.5) / uKenB + 0.5;
    vec3 col = mix(texture2D(tA, ua).rgb, texture2D(tB, ub).rgb, uMix);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

export class Reel {
  constructor(ch) {
    this.ch = ch;
    this.toneMapped = false;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
    this.progress = 0;
    this.smooth = 0;
    this.current = 0;
    this.textures = [];
    this.medias = [];
    this.buildShots();

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tA: { value: this.shots[0].texture }, tB: { value: this.shots[0].texture },
        uAspect: { value: 16 / 9 }, uAspA: { value: 16 / 9 }, uAspB: { value: 16 / 9 },
        uMix: { value: 0 }, uKenA: { value: 1 }, uKenB: { value: 1 },
      },
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    this.u = this.material.uniforms;
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);
  }

  // Exhibit 0 = hero video, 1-4 = photos
  buildShots() {
    this.shots = this.ch.exhibits.map((ex, k) => {
      if (k === 0) {
        const media = videoSource(ex.src, ex.title, this.ch.accent, 16 / 9);
        this.medias.push(media);
        return { get texture() { return media.texture; } };
      }
      const tex = imageTexture(ex.src, ex.title, this.ch.accent, 16 / 9);
      this.textures.push(tex);
      return { texture: tex };
    });
  }

  // Push-in for shot k: starts as it dissolves in, ends as it dissolves out, never more than 3%
  push(f, k) {
    return 1 + PUSH * clamp01((f - k + 0.6) / 1.2);
  }

  update(dt) {
    this.smooth += (this.progress - this.smooth) * Math.min(1, dt * 4);
    const u = this.u, f = clamp01(this.smooth) * 4;
    const a = Math.min(4, Math.floor(f)), b = Math.min(4, a + 1);
    u.uMix.value = a === b ? 0 : smooth(0.4, 0.6, f - a);
    u.tA.value = this.shots[a].texture;
    u.tB.value = this.shots[b].texture;
    u.uAspA.value = aspectOf(u.tA.value);
    u.uAspB.value = aspectOf(u.tB.value);
    u.uKenA.value = this.push(f, a);
    u.uKenB.value = this.push(f, b);
    this.current = u.uMix.value > 0.5 ? b : a;
  }

  // The shot on screen, for the lightbox
  pick() {
    return this.current;
  }

  play() { this.medias.forEach((m) => m.play()); }
  pause() { this.medias.forEach((m) => m.pause()); }

  dispose() {
    this.medias.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
    this.material.dispose();
    this.scene.traverse((o) => o.geometry && o.geometry.dispose());
  }

  resize(aspect) {
    this.u.uAspect.value = aspect;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
