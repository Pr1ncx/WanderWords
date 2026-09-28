import gsap from 'gsap';

const SWATCH = ['#E08E2B', '#F3E6CC', '#B5523B', '#F2B632', '#1F6F6B', '#2E3A6B'];

export function splitChars(el, text, mask = true) {
  el.setAttribute('aria-label', text);
  el.innerHTML = [...text].map((ch) => {
    const c = ch === ' ' ? '&nbsp;' : ch;
    return mask
      ? `<span class="char-mask" aria-hidden="true"><span class="char">${c}</span></span>`
      : `<span class="char" aria-hidden="true">${c}</span>`;
  }).join('');
  return el.querySelectorAll('.char');
}

export function revealChars(chars, delay = 0) {
  return gsap.fromTo(chars, { yPercent: 110, rotate: 8 },
    { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.035, ease: 'expo.out', delay });
}

export function magnetic(el, strength = 0.35) {
  const inner = el.querySelector('span');
  const q = (t, p) => gsap.quickTo(t, p, { duration: 0.6, ease: 'power3' });
  const [xTo, yTo, ixTo, iyTo] = [q(el, 'x'), q(el, 'y'), q(inner, 'x'), q(inner, 'y')];
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    xTo(dx * strength);
    yTo(dy * strength);
    ixTo(dx * strength * 0.5);
    iyTo(dy * strength * 0.5);
    gsap.to(el, { scale: 1.06, duration: 0.4 });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to([el, inner], { x: 0, y: 0, scale: 1, duration: 1, ease: 'elastic.out(1, 0.35)', overwrite: true });
  });
}

function mosaicStrip(c, x0, y, w, h) {
  c.fillStyle = SWATCH[1];
  c.fillRect(x0, y, w, h);
  for (let x = x0, k = 0; x < x0 + w; k++) {
    const sw = 24 + ((k * 37) % 48);
    c.fillStyle = SWATCH[k % SWATCH.length];
    c.fillRect(x, y, sw, h / 2);
    c.fillStyle = SWATCH[(k + 3) % SWATCH.length];
    c.fillRect(x + sw / 2, y + h / 2, sw, h / 2);
    x += sw;
  }
}

export function drawCover(canvas, ch, i) {
  const c = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  c.fillStyle = ch.cover;
  c.fillRect(0, 0, W, H);
  mosaicStrip(c, 0, 0, W, 40);
  mosaicStrip(c, 0, H - 40, W, 40);

  c.fillStyle = ch.ink;
  c.textAlign = 'center';
  c.font = '500 22px Inter';
  c.fillText(`WANDERWORDS · CHAPTER ${String(i + 1).padStart(2, '0')}`, W / 2, 110);

  // Arch motif
  c.save();
  c.strokeStyle = ch.ink;
  c.globalAlpha = 0.35;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(W / 2, H / 2 - 170, 90, Math.PI, 0);
  c.lineTo(W / 2 + 90, H / 2 - 80);
  c.lineTo(W / 2 - 90, H / 2 - 80);
  c.closePath();
  c.stroke();
  c.restore();

  // Auto-fit the city name
  let size = 150;
  c.font = `${size}px Shrikhand`;
  while (c.measureText(ch.name).width > W - 80) {
    size -= 6;
    c.font = `${size}px Shrikhand`;
  }
  c.fillText(ch.name, W / 2, H / 2 + size * 0.3 + 40);
  c.font = 'italic 34px "Playfair Display"';
  c.fillText(ch.tagline, W / 2, H / 2 + size * 0.3 + 110);
}

export function drawPostcard(chapters) {
  const cv = document.createElement('canvas');
  cv.width = 1600;
  cv.height = 1000;
  const c = cv.getContext('2d');
  c.fillStyle = '#6B3A24';
  c.fillRect(0, 0, 1600, 1000);
  mosaicStrip(c, 0, 0, 1600, 50);
  mosaicStrip(c, 0, 950, 1600, 50);
  c.fillStyle = '#F3E6CC';
  c.textAlign = 'center';
  c.font = 'italic 48px "Playfair Display"';
  c.fillText('Greetings from', 800, 220);
  c.font = '220px Shrikhand';
  c.fillText('India', 800, 440);
  c.font = '500 26px Inter';
  chapters.forEach((ch, k) =>
    c.fillText(ch.name.toUpperCase(), 240 + (k % 5) * 280, 640 + Math.floor(k / 5) * 80));
  c.font = 'italic 30px "Playfair Display"';
  c.fillText('Ten chapters. One journey. · WanderWords', 800, 860);
  return cv;
}
