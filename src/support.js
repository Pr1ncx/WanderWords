// Small feature checks, kept free of heavy imports so the Reader pages stay light.

// three.js needs WebGL 2. If it is missing, the site opens in Reader Mode instead.
export function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext(); // free the test context straight away
    return true;
  } catch {
    return false;
  }
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
