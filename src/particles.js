import * as THREE from 'three';

// Drifting atmosphere per city: petals, snow, dust in light, fireflies, salt glitter, mist
const KINDS = {
  snow: { color: '#FFFFFF', count: 1100, size: 0.045, fall: 0.55, sway: 0.35, twinkle: 0, stretch: 1, additive: false, opacity: 0.85 },
  petals: { color: '#F4AFC0', count: 260, size: 0.09, fall: 0.3, sway: 0.8, twinkle: 0.15, stretch: 2.2, additive: false, opacity: 0.9 },
  marigold: { color: '#F2A93A', count: 240, size: 0.08, fall: 0.3, sway: 0.8, twinkle: 0.15, stretch: 2.0, additive: false, opacity: 0.9 },
  dust: { color: '#FFD9A0', count: 800, size: 0.028, fall: -0.04, sway: 0.25, twinkle: 0.5, stretch: 1, additive: true, opacity: 0.7 },
  fireflies: { color: '#E6F59A', count: 180, size: 0.06, fall: -0.05, sway: 0.6, twinkle: 1, stretch: 1, additive: true, opacity: 1 },
  glitter: { color: '#FFFFFF', count: 600, size: 0.022, fall: 0, sway: 0.03, twinkle: 1, stretch: 1, additive: true, opacity: 0.9 },
  mist: { color: '#EEF4EE', count: 70, size: 3.2, fall: 0, sway: 1.4, twinkle: 0, stretch: 1, additive: false, opacity: 0.1 },
};

export const CITY_PARTICLES = {
  srinagar: 'petals', manali: 'snow', amritsar: 'dust', jaipur: 'marigold', agra: 'dust',
  goa: 'dust', munnar: 'mist', gangtok: 'snow', kutch: 'glitter', shillong: 'fireflies',
};

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const vertexShader = /* glsl */ `
  uniform float uTime, uSize, uScale, uFall, uSway, uTwinkle;
  uniform vec3 uMin, uExtent;
  attribute float aSeed;
  varying float vAlpha, vSeed;
  void main() {
    vec3 p = uMin + position * uExtent;
    float yn = fract(position.y - uTime * uFall * (0.6 + aSeed * 0.8) / uExtent.y);
    p.y = uMin.y + yn * uExtent.y;
    p.x += sin(uTime * (0.3 + aSeed * 0.5) + aSeed * 40.0) * uSway;
    p.z += cos(uTime * (0.25 + aSeed * 0.4) + aSeed * 20.0) * uSway * 0.5;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = min(uSize * (0.6 + aSeed * 0.8) * uScale / max(depth, 0.1), 180.0);
    float edge = smoothstep(0.0, 0.08, yn) * smoothstep(1.0, 0.92, yn);
    float tw = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (1.5 + aSeed * 3.0) + aSeed * 60.0), 3.0);
    vAlpha = edge * mix(1.0, tw, uTwinkle) * smoothstep(0.8, 2.5, depth);
    vSeed = aSeed;
  }`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity, uStretch, uTime;
  varying float vAlpha, vSeed;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float a = vSeed * 6.2831 + uTime * (0.4 + vSeed);
    q = mat2(cos(a), -sin(a), sin(a), cos(a)) * q;
    q.x *= uStretch;
    float m = smoothstep(1.0, 0.2, length(q) * 2.0);
    if (m < 0.01) discard;
    vec3 col = uColor * mix(0.75, 1.1, smoothstep(-0.5, 0.5, q.y));
    gl_FragColor = vec4(col, m * vAlpha * uOpacity);
  }`;

export class Particles {
  // box: { min: [x, y, z], size: [w, h, d] } in world units
  constructor(kind, box) {
    const k = KINDS[kind] || KINDS.dust;
    const n = REDUCED ? Math.round(k.count * 0.4) : k.count;
    const pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = Math.random();
      pos[i * 3 + 1] = Math.random();
      pos[i * 3 + 2] = Math.random();
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMin: { value: new THREE.Vector3(...box.min) },
        uExtent: { value: new THREE.Vector3(...box.size) },
        uSize: { value: k.size },
        uScale: { value: 800 },
        uFall: { value: k.fall },
        uSway: { value: k.sway },
        uTwinkle: { value: k.twinkle },
        uStretch: { value: k.stretch },
        uOpacity: { value: k.opacity },
        uColor: { value: new THREE.Color(k.color) },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: k.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 1;
  }

  update(t) {
    if (!REDUCED) this.material.uniforms.uTime.value = t;
  }

  // Point sizes are in world units; convert with the current lens and screen height
  resize(camera) {
    const pr = Math.min(devicePixelRatio, 1.75);
    this.material.uniforms.uScale.value = (innerHeight * pr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  }
}
