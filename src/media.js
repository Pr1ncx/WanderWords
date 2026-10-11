// Painted placeholder shown until the real photo or video is added.
// Used by the global image error handler in main.js: any <img data-ph> whose file is missing
// is swapped for one of these, so a page never shows a broken image.
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
  x.fillText('WANDERWORDS \u00b7 ADD YOUR MEDIA', 640, 300);
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
