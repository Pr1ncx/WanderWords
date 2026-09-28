// Canvas artwork: the journal cover on the train seat, and the downloadable postcard
const SERIF = '"Cormorant Garamond", Georgia, serif';

export function drawCover(canvas, ch, i) {
  const c = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  c.fillStyle = ch.cover;
  c.fillRect(0, 0, W, H);
  c.strokeStyle = ch.ink;
  c.globalAlpha = 0.45;
  c.lineWidth = 2;
  c.strokeRect(36, 36, W - 72, H - 72);
  c.globalAlpha = 1;

  c.fillStyle = ch.ink;
  c.textAlign = 'center';
  c.font = '500 20px Inter, sans-serif';
  c.fillText(`WANDERWORDS · CHAPTER ${String(i + 1).padStart(2, '0')}`, W / 2, 120);

  // Auto-fit the city name
  let size = 150;
  c.font = `italic 500 ${size}px ${SERIF}`;
  while (c.measureText(ch.name).width > W - 120) {
    size -= 6;
    c.font = `italic 500 ${size}px ${SERIF}`;
  }
  c.fillText(ch.name, W / 2, H / 2 + size * 0.3);
  c.font = `italic 36px ${SERIF}`;
  c.fillText(ch.tagline, W / 2, H / 2 + size * 0.3 + 80);
}

// Round rubber stamp drawn on the postcard canvas
function drawStamp(c, s, x, y, r, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.globalAlpha = 0.9;
  c.fillStyle = s.color;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#F3EBDD';
  c.fillStyle = '#F3EBDD';
  c.lineWidth = r * 0.05;
  for (const k of [0.9, 0.55]) {
    c.beginPath();
    c.arc(0, 0, r * k, 0, Math.PI * 2);
    c.stroke();
  }
  const ring = `${s.label.toUpperCase()} · WW · `;
  const step = Math.min(0.24, (Math.PI * 2) / ring.length);
  c.font = `700 ${Math.round(r * 0.15)}px Inter, sans-serif`;
  c.textAlign = 'center';
  [...ring].forEach((ch, i) => {
    c.save();
    c.rotate(i * step);
    c.fillText(ch, 0, -r * 0.66);
    c.restore();
  });
  c.font = `italic ${Math.round(r * 0.3)}px ${SERIF}`;
  c.fillText(s.label.split(' ')[0], 0, r * 0.1, r * 1.0);
  c.restore();
}

export function drawPostcard(chapters, stamps = []) {
  const cv = document.createElement('canvas');
  cv.width = 1600;
  cv.height = 1000;
  const c = cv.getContext('2d');
  c.fillStyle = '#0E0C0A';
  c.fillRect(0, 0, 1600, 1000);
  c.strokeStyle = 'rgba(217, 178, 106, 0.6)';
  c.lineWidth = 1.5;
  c.strokeRect(40, 40, 1520, 920);

  c.fillStyle = '#F3EBDD';
  c.textAlign = 'center';
  c.font = `italic 52px ${SERIF}`;
  c.fillText('Greetings from', 800, 230);
  c.font = `italic 500 240px ${SERIF}`;
  c.fillText('India', 800, 450);
  c.fillStyle = 'rgba(243, 235, 221, 0.7)';
  c.font = '500 22px Inter, sans-serif';
  chapters.forEach((ch, k) =>
    c.fillText(ch.name.toUpperCase(), 240 + (k % 5) * 280, 640 + Math.floor(k / 5) * 80));
  c.fillStyle = '#D9B26A';
  c.font = `italic 32px ${SERIF}`;
  c.fillText('Ten chapters. One journey. · WanderWords', 800, 870);

  // Postmark lines
  c.strokeStyle = 'rgba(243, 235, 221, 0.25)';
  c.lineWidth = 2;
  for (let k = 0; k < 5; k++) {
    c.beginPath();
    for (let x = 1120; x <= 1540; x += 10) {
      const y = 110 + k * 16 + Math.sin(x / 22) * 6;
      if (x === 1120) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  // The stamps collected on the journey
  stamps.forEach((s, k) => {
    const col = k % 4, row = Math.floor(k / 4);
    drawStamp(c, s, 1200 + col * 100 + (row % 2) * 30, 130 + row * 105, 46, (Math.random() - 0.5) * 0.5);
  });
  return cv;
}
