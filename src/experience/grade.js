// Colour grades for the photograph.
// A grade = lift / gain (per channel), gamma, tint, saturation and vignette.
// The dial blends four presets (night, dawn, day, dusk) by hour of day.
// Each chapter also has a "true" look: the grade at its own hour, slightly boosted.
// Any preset can be overridden per chapter in destinations.json under "grades".

export const FLAT = { lift: [0.02, 0.02, 0.02], gain: [0.9, 0.9, 0.92], gamma: 1.05, tint: [0.98, 0.98, 1.0], sat: 0.6, vig: 0.3 };

export const PRESETS = {
  night: { lift: [0.0, 0.01, 0.03], gain: [0.36, 0.44, 0.68], gamma: 1.15, tint: [0.85, 0.95, 1.15], sat: 0.55, vig: 0.65 },
  dawn: { lift: [0.03, 0.015, 0.03], gain: [0.96, 0.84, 0.82], gamma: 1.05, tint: [1.12, 0.97, 0.93], sat: 0.85, vig: 0.4 },
  day: { lift: [0, 0, 0], gain: [1, 1, 1], gamma: 1.0, tint: [1, 1, 1], sat: 0.95, vig: 0.22 },
  dusk: { lift: [0.02, 0.0, 0.025], gain: [1.0, 0.74, 0.64], gamma: 1.08, tint: [1.15, 0.88, 0.86], sat: 0.9, vig: 0.45 },
};

// Where each preset sits on the 24-hour dial (minutes since midnight)
const KEYS = [[0, 'night'], [360, 'dawn'], [720, 'day'], [1080, 'dusk'], [1440, 'night']];

const lerp = (a, b, t) => a + (b - a) * t;
const lerpArr = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

export function mixGrade(a, b, t) {
  return {
    lift: lerpArr(a.lift, b.lift, t),
    gain: lerpArr(a.gain, b.gain, t),
    tint: lerpArr(a.tint, b.tint, t),
    gamma: lerp(a.gamma, b.gamma, t),
    sat: lerp(a.sat, b.sat, t),
    vig: lerp(a.vig, b.vig, t),
  };
}

// Presets for one destination: defaults plus any overrides from the data
export function presetsFor(d) {
  const out = {};
  Object.keys(PRESETS).forEach((k) => { out[k] = { ...PRESETS[k], ...((d.grades || {})[k] || {}) }; });
  return out;
}

export function gradeAtHour(minutes, presets = PRESETS) {
  const m = ((minutes % 1440) + 1440) % 1440;
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [m0, k0] = KEYS[i];
    const [m1, k1] = KEYS[i + 1];
    if (m >= m0 && m <= m1) {
      const t = (m - m0) / (m1 - m0);
      return mixGrade(presets[k0], presets[k1], t * t * (3 - 2 * t)); // smoothstep
    }
  }
  return presets.day;
}

export function trueGrade(d) {
  const base = gradeAtHour(d.hourMinutes, presetsFor(d));
  const boosted = { ...base, sat: Math.min(1.15, base.sat + 0.15), vig: base.vig + 0.05 };
  return { ...boosted, ...((d.grades || {}).true || {}) };
}

// Push a grade into a photo shader's uniforms. warm (0 to 1) is the slight warming from reading dispatches.
export function applyGrade(u, g, warm = 0) {
  u.uLift.value.set(g.lift[0], g.lift[1], g.lift[2]);
  u.uGain.value.set(g.gain[0], g.gain[1], g.gain[2]);
  u.uTint.value.set(g.tint[0] + warm * 0.1, g.tint[1] + warm * 0.02, g.tint[2] - warm * 0.09);
  u.uGamma.value = g.gamma;
  u.uSat.value = g.sat + warm * 0.1;
  u.uVig.value = g.vig;
}
