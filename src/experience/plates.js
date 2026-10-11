// A plate: a tall 4:5 print hanging in the hall.
// Parts: paper frame (margins), the photograph (depth-parallax shader + colour grade), and a corner mark.
import * as THREE from 'three';
import { FLAT } from './grade.js';
import { paperTexture, markTexture } from './art.js';

export const PHOTO_W = 1.2;
export const PHOTO_H = 1.5;
const MX = 0.12, MT = 0.12, MB = 0.22; // paper margins: sides, top, bottom
export const FRAME_W = PHOTO_W + MX * 2;
export const FRAME_H = PHOTO_H + MT + MB;

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// The depth effect: the photograph is shifted per pixel by its depth map and the mouse,
// so near things slide further than far things (parallax). uDepthAmt fades the effect in.
// The grade (lift, gain, gamma, tint, saturation, vignette) is applied at the end.
const FRAG = `
uniform sampler2D uMap;
uniform sampler2D uDepth;
uniform vec2 uMouse;
uniform float uDepthAmt;
uniform float uDim;
uniform vec3 uLift;
uniform vec3 uGain;
uniform vec3 uTint;
uniform float uGamma;
uniform float uSat;
uniform float uVig;
varying vec2 vUv;
void main() {
  float zoom = 1.0 - 0.07 * uDepthAmt;
  vec2 uv = (vUv - 0.5) * zoom + 0.5;
  float d = texture2D(uDepth, uv).r;
  uv += uMouse * (d - 0.5) * 0.05 * uDepthAmt;
  vec3 c = texture2D(uMap, uv).rgb;
  c = c * uGain + uLift;
  c = pow(max(c, vec3(0.0)), vec3(1.0 / uGamma));
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSat);
  c *= uTint;
  float v = smoothstep(0.9, 0.2, distance(vUv, vec2(0.5)));
  c *= mix(1.0 - uVig, 1.0, v);
  c *= uDim;
  gl_FragColor = vec4(c, 1.0);
}`;

const blank = (r, g, b) => {
  const t = new THREE.DataTexture(new Uint8Array([r, g, b, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
};

export class Plate {
  constructor(data, index) {
    this.data = data;
    this.index = index;
    this.art = null;
    this.baseGrade = FLAT;
    // state is tweened by the stage: z (depth in the hall), dim, frame opacity, depth effect, corner mark
    this.state = { z: 0, dim: 0.35, frame: 1, depth: 0, mark: 0 };

    this.group = new THREE.Group();
    this.tilt = new THREE.Group(); // mouse tilt and breathing live here
    this.group.add(this.tilt);

    this.frameMat = new THREE.MeshBasicMaterial({ map: paperTexture(), transparent: true });
    this.frame = new THREE.Mesh(new THREE.PlaneGeometry(FRAME_W, FRAME_H), this.frameMat);
    this.frame.position.set(0, -(MB - MT) / 2, -0.004);
    this.tilt.add(this.frame);

    this.photoMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: blank(20, 18, 16) },
        uDepth: { value: blank(128, 128, 128) },
        uMouse: { value: new THREE.Vector2() },
        uDepthAmt: { value: 0 },
        uDim: { value: 1 },
        uLift: { value: new THREE.Vector3() },
        uGain: { value: new THREE.Vector3(1, 1, 1) },
        uTint: { value: new THREE.Vector3(1, 1, 1) },
        uGamma: { value: 1 },
        uSat: { value: 1 },
        uVig: { value: 0.2 },
      },
    });
    this.photo = new THREE.Mesh(new THREE.PlaneGeometry(PHOTO_W, PHOTO_H), this.photoMat);
    this.tilt.add(this.photo);

    this.markMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    this.mark = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.125), this.markMat);
    this.mark.position.set(FRAME_W / 2 - 0.31, -PHOTO_H / 2 - MB / 2, -0.003);
    this.mark.visible = false;
    this.tilt.add(this.mark);
  }

  setArt(art) {
    this.art = art;
    this.photoMat.uniforms.uMap.value = art.photo;
    this.photoMat.uniforms.uDepth.value = art.depth;
  }

  // Little corner mark for a solved plate, e.g. "✓ 05:40"
  setMark(text) {
    if (this.markMat.map) this.markMat.map.dispose();
    this.markMat.map = markTexture(text);
    this.markMat.needsUpdate = true;
  }

  update(t, tiltX, tiltY, breath, k) {
    const s = this.state;
    this.group.position.z = s.z;
    const u = this.photoMat.uniforms;
    u.uDim.value = s.dim;
    u.uDepthAmt.value = s.depth;
    this.frameMat.color.setScalar(s.dim);
    this.frameMat.opacity = s.frame;
    this.frame.visible = s.frame > 0.01;
    this.markMat.opacity = s.mark * s.frame;
    this.mark.visible = !!this.markMat.map && this.markMat.opacity > 0.01;
    // Tilt a few degrees with the mouse, breathe slowly (scale 1 to 1.01)
    const r = this.tilt.rotation;
    r.y += (tiltX * 0.07 - r.y) * k;
    r.x += (-tiltY * 0.05 - r.x) * k;
    this.tilt.scale.setScalar(1 + breath * (0.005 + 0.005 * Math.sin(t * 0.6 + this.index)));
  }

  dispose() {
    this.frame.geometry.dispose();
    this.photo.geometry.dispose();
    this.mark.geometry.dispose();
    this.frameMat.dispose();
    this.photoMat.dispose();
    if (this.markMat.map) this.markMat.map.dispose();
    this.markMat.dispose();
    if (this.art) {
      this.art.photo.dispose();
      this.art.depth.dispose();
    }
  }
}
