import * as THREE from 'three';
import gsap from 'gsap';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Final "film print" pass, runs in display space after tone mapping:
// chromatic aberration, colour grade, print contrast, vignette, ink blacks, film grain.
const FilmShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.05 },
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
    uniform sampler2D tDiffuse;
    uniform float uTime, uGrain, uVignette, uAberration, uTintAmount;
    uniform vec3 uTint;
    varying vec2 vUv;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

    void main() {
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);

      // Lens: RGB split grows towards the edges
      float ca = uAberration * (0.25 + r2 * 4.0);
      vec3 col = vec3(
        texture2D(tDiffuse, vUv + d * ca).r,
        texture2D(tDiffuse, vUv).g,
        texture2D(tDiffuse, vUv - d * ca).b
      );
      col = clamp(col, 0.0, 1.0);
      float l = luma(col);

      // Grade: chapter colour in the shadows, warm cream highlights
      col = mix(col, col * (0.7 + uTint * 0.6), uTintAmount * (1.0 - l));
      col *= mix(vec3(1.0), vec3(1.035, 1.0, 0.93), smoothstep(0.35, 1.0, l));

      // Gentle print contrast
      col = clamp(col, 0.0, 1.0);
      col = mix(col, col * col * (3.0 - 2.0 * col), 0.18);

      // Vignette / lens falloff
      col *= 1.0 - uVignette * smoothstep(0.06, 0.8, r2 * 1.6);

      // Ink blacks: printed matter is never pure black
      col = col * 0.965 + vec3(0.03, 0.022, 0.016);

      // Film grain: fine + clumped, strongest in the mid-tones
      vec2 seed = gl_FragCoord.xy + fract(uTime * 7.13) * 1000.0;
      float g = (hash12(seed) - 0.5) + (hash12(floor(seed * 0.5) + 17.0) - 0.5) * 0.6;
      float mids = clamp(1.0 - abs(l - 0.45) * 1.3, 0.3, 1.0);
      col += g * uGrain * mids;

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }`,
};

export class PostFX {
  constructor(renderer) {
    this.renderer = renderer;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    // MSAA render target keeps edges clean now that the canvas no longer antialiases itself
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(renderer, target);

    this.renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.3, 0.65, 0.9);
    this.film = new ShaderPass(FilmShader);
    this.u = this.film.uniforms;

    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloom);
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
