import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// One unified grade for everything on screen, so footage from different cameras cuts together:
// saturation held slightly in check, a gentle S-curve, lifted blacks and a touch of warmth in the highlights.
// No grain, no paper, no lens effects: the footage is the texture.
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uSat: { value: 0.94 },
    uContrast: { value: 0.14 },
    uLift: { value: 0.012 },
    uWarmth: { value: 0.025 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uSat, uContrast, uLift, uWarmth;
    varying vec2 vUv;
    void main() {
      vec3 c = clamp(texture2D(tDiffuse, vUv).rgb, 0.0, 1.0);
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSat);
      c += vec3(1.0, 0.35, -0.8) * uWarmth * (l - 0.4);
      c = clamp(c, 0.0, 1.0);
      c = mix(c, c * c * (3.0 - 2.0 * c), uContrast);
      c = c * (1.0 - uLift) + uLift;
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export class PostFX {
  constructor(renderer) {
    this.renderer = renderer;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 2 });
    this.composer = new EffectComposer(renderer, target);
    this.renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
    this.gradePass = new ShaderPass(GradeShader);
    this.u = this.gradePass.uniforms;
    this.composer.addPass(this.renderPass);
    this.composer.addPass(new OutputPass());
    this.composer.addPass(this.gradePass);
  }

  setSize(w, h) {
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
  }

  render(scene, camera, dt) {
    this.renderPass.scene = scene;
    this.renderPass.camera = camera;
    this.composer.render(dt);
  }
}
