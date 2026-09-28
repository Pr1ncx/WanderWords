import * as THREE from 'three';

// Painted placeholder shown until the real photo or video is added
export function placeholderCanvas(title, path, accent = '#6B3A24') {
  const c = document.createElement('canvas');
  c.width = 1280;
  c.height = 800;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 1280, 800);
  g.addColorStop(0, accent);
  g.addColorStop(1, '#2A1A10');
  x.fillStyle = g;
  x.fillRect(0, 0, 1280, 800);
  x.globalAlpha = 0.08;
  x.fillStyle = '#F3E6CC';
  for (let i = 0; i < 26; i++) {
    x.save();
    x.translate(Math.random() * 1280, Math.random() * 800);
    x.rotate(-0.3 + Math.random() * 0.6);
    x.fillRect(-200, -12, 400, 24);
    x.restore();
  }
  x.globalAlpha = 1;
  x.strokeStyle = 'rgba(243,230,204,.5)';
  x.lineWidth = 3;
  x.setLineDash([14, 10]);
  x.strokeRect(40, 40, 1200, 720);
  x.setLineDash([]);
  x.fillStyle = '#F3E6CC';
  x.textAlign = 'center';
  x.font = '500 26px Inter';
  x.fillText('WANDERWORDS · ADD YOUR MEDIA', 640, 300);
  x.font = '72px Shrikhand';
  x.fillText(title || 'Media', 640, 420, 1100);
  x.font = '500 28px Inter';
  x.globalAlpha = 0.75;
  x.fillText(`public${path || ''}`, 640, 500, 1100);
  x.globalAlpha = 1;
  return c;
}

export const placeholderURL = (title, path, accent) =>
  placeholderCanvas(title, path, accent).toDataURL('image/jpeg', 0.82);

// Crop a texture like CSS object-fit: cover
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
  const tex = canvasTexture(placeholderCanvas(title, src, accent));
  coverFit(tex, 1.6, frameAspect);
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

  const placeholder = canvasTexture(placeholderCanvas(title, src, accent));
  coverFit(placeholder, 1.6, frameAspect);
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
