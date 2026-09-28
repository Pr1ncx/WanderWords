import * as THREE from 'three';
import gsap from 'gsap';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Small tiling noise used for paper tooth and mottling (sampled at two scales)
function paperTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const img = x.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 70;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  x.globalAlpha = 0.25;
  for (let i = 0; i < 400; i++) {
    x.fillStyle = Math.random() < 0.5 ? '#000' : '#fff';
    x.fillRect(Math.random() * 256, Math.random() * 256, 6 + Math.random() * 20, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  t.generateMipmaps = false;
  t.minFilter = t.magFilter = THREE.LinearFilter;
  return t;
}

// One "film print" pass after tone mapping: lens RGB split, grade, print contrast,
// vignette, paper tooth, ink blacks and film grain. Cheap: 3 scene taps + 2 noise taps.
const FilmShader = {
  uniforms: {
    tDiffuse: { value: null },
    tPaper: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.055 },
    uVignette: { value: 0.42 },
    uAberration: { value: 0.0025 },
    uTint: { value: new THREE.Vector3(0.42, 0.23, 0.14) },
    uTintAmount: { value: 0.3 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse, tPaper;
    uniform float uTime, uGrain, uVignette, uAberration, uTintAmount;
    uniform vec3 uTint;
    varying vec2 vUv;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      float ca = uAberration * (0.25 + r2 * 4.0);
      vec3 col = vec3(
        texture2D(tDiffuse, vUv + d * ca).r,
        texture2D(tDiffuse, vUv).g,
        texture2D(tDiffuse, vUv - d * ca).b
      );
      col = clamp(col, 0.0, 1.0);
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));

      col = mix(col, col * (0.7 + uTint * 0.6), uTintAmount * (1.0 - l));
      col *= mix(vec3(1.0), vec3(1.035, 1.0, 0.93), smoothstep(0.35, 1.0, l));
      col = clamp(col, 0.0, 1.0);
      col = mix(col, col * col * (3.0 - 2.0 * col), 0.18);
      col *= 1.0 - uVignette * smoothstep(0.06, 0.8, r2 * 1.6);

      // Paper: fine tooth + soft mottling
      float tooth = texture2D(tPaper, gl_FragCoord.xy / 384.0).r;
      float mottle = texture2D(tPaper, gl_FragCoord.xy / 3072.0).r;
      col *= 1.0 + (tooth - 0.5) * 0.08 + (mottle - 0.5) * 0.1;

      col = col * 0.965 + vec3(0.03, 0.022, 0.016);

      vec2 seed = gl_FragCoord.xy + fract(uTime * 7.13) * 1000.0;
      float g = hash12(seed) - 0.5;
      col += g * uGrain * clamp(1.0 - abs(l - 0.45) * 1.3, 0.3, 1.0);

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }`,
};

export class PostFX {
  constructor(renderer) {
    this.renderer = renderer;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 2 });
    this.composer = new EffectComposer(renderer, target);
    this.renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
    this.film = new ShaderPass(FilmShader);
    this.u = this.film.uniforms;
    this.u.tPaper.value = paperTexture();
    this.composer.addPass(this.renderPass);
    this.composer.addPass(new OutputPass());
    this.composer.addPass(this.film);
    this.baseAberration = REDUCED ? 0.0008 : 0.0025;
    this.u.uAberration.value = this.baseAberration;
  }

  setSize(w, h) {
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
  }

  render(scene, camera, dt, t) {
    this.renderPass.scene = scene;
    this.renderPass.camera = camera;
    if (!REDUCED) this.u.uTime.value = t;
    this.composer.render(dt);
  }

  // Tint the shadows towards a chapter colour (hex string)
  grade(color, amount = 0.3, duration = 1.6) {
    const c = {};
    new THREE.Color(color).getRGB(c, THREE.SRGBColorSpace);
    gsap.to(this.u.uTint.value, { x: c.r, y: c.g, z: c.b, duration, ease: 'power2.inOut', overwrite: true });
    gsap.to(this.u.uTintAmount, { value: amount, duration, ease: 'power2.inOut', overwrite: true });
  }

  // Short lens shock for transitions
  pulse(strength = 0.018, duration = 1.4) {
    if (REDUCED) return;
    gsap.fromTo(this.u.uAberration, { value: strength },
      { value: this.baseAberration, duration, ease: 'expo.out', overwrite: true });
  }
}
