import * as THREE from 'three';

// Shown until the real photo or video is added: a quiet black frame that names the missing file
export function placeholderCanvas(title, path) {
  const c = document.createElement('canvas');
  c.width = 1280;
  c.height = 720;
  const x = c.getContext('2d');
  x.fillStyle = '#0B0A09';
  x.fillRect(0, 0, 1280, 720);
  x.textAlign = 'center';
  x.fillStyle = 'rgba(243, 235, 221, 0.5)';
  x.font = 'italic 44px "Cormorant Garamond", Georgia, serif';
  x.fillText(title || '', 640, 372, 1100);
  x.fillStyle = 'rgba(243, 235, 221, 0.3)';
  x.font = '500 16px Inter, sans-serif';
  x.fillText(`Missing file · public${path || ''}`, 640, 420, 1100);
  return c;
}

export const placeholderURL = (title, path) => placeholderCanvas(title, path).toDataURL('image/jpeg', 0.85);

// Crop a texture like CSS object-fit: cover (used where textures sit on fixed-size planes)
function coverFit(tex, imageAspect, frameAspect) {
  tex.repeat.set(1, 1);
  tex.offset.set(0, 0);
  if (imageAspect > frameAspect) {
    const r = frameAspect / imageAspect;
    tex.repeat.x = r;
    tex.offset.x = (1 - r) / 2;
  } else {
    const r = imageAspect / frameAspect;
    tex.repeat.y = r;
    tex.offset.y = (1 - r) / 2;
  }
}

function canvasTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Photo texture: placeholder first, swapped for the real image when it loads
export function imageTexture(src, title, accent, frameAspect) {
  const tex = canvasTexture(placeholderCanvas(title, src));
  coverFit(tex, 16 / 9, frameAspect);
  const img = new Image();
  img.onload = () => {
    tex.image = img;
    coverFit(tex, img.naturalWidth / img.naturalHeight, frameAspect);
    tex.needsUpdate = true;
  };
  img.src = src;
  return tex;
}

// Video texture with placeholder fallback. Set `material` so the map swaps automatically.
export function videoSource(src, title, accent, frameAspect) {
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  video.src = src;

  const placeholder = canvasTexture(placeholderCanvas(title, src));
  coverFit(placeholder, 16 / 9, frameAspect);
  const vtex = new THREE.VideoTexture(video);
  vtex.colorSpace = THREE.SRGBColorSpace;

  const state = {
    video,
    texture: placeholder,
    material: null,
    play: () => video.play().catch(() => {}),
    pause: () => video.pause(),
    dispose: () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      vtex.dispose();
      placeholder.dispose();
    },
  };

  video.addEventListener('loadeddata', () => {
    coverFit(vtex, video.videoWidth / video.videoHeight, frameAspect);
    state.texture = vtex;
    if (state.material) {
      state.material.map = vtex;
      state.material.needsUpdate = true;
    }
  });
  return state;
}
