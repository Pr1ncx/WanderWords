// Prologue art: a mixed-media collage built from image cutouts in public/media/prologue/.
// Every layer has a textured, typographic placeholder made in code, used until its file exists.
// Drop a file in with the name below and it replaces the placeholder. No code changes needed.

export const ASSET_BASE = '/media/prologue/';
export const ASSETS = {
  desk: 'desk.jpg',            // dark textured desk surface, top-down, ~2560px wide
  envelope: 'envelope.png',    // aerogramme / airmail envelope, transparent background
  seal: 'seal.png',            // red wax seal, transparent, square
  paper: 'letter.jpg',         // full-bleed aged parchment
  passport: 'passport.jpg',    // passport page texture
  stamper: 'stamper.png',      // brass hand stamp photo, transparent, rubber face at the bottom
  coach: 'coach.png',          // one train coach, side view, transparent (repeated 3x)
  loco: 'loco.png',            // locomotive, side view, transparent, nose on the right
  map: 'cutouts/map.png',
  compass: 'cutouts/compass.png',
  pen: 'cutouts/pen.png',
  film: 'cutouts/film.png',
  postage: 'cutouts/postage.png',
  ticket: 'cutouts/ticket.png',
  temple: 'engravings/temple.png',
  mountains: 'engravings/mountains.png',
  tea: 'engravings/tea.png',
  tracks: 'engravings/tracks.png',
};

// Ragged paper edge as a clip-path polygon (j = how deep the tears go, in %)
export function tornClip(j = 1.4, n = 14) {
  const r = () => Math.random() * j;
  const f = (v) => `${v.toFixed(2)}%`;
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(`${f((i / n) * 100)} ${f(r())}`);
  for (let i = 1; i <= n; i++) pts.push(`${f(100 - r())} ${f((i / n) * 100)}`);
  for (let i = n - 1; i >= 0; i--) pts.push(`${f((i / n) * 100)} ${f(100 - r())}`);
  for (let i = n - 1; i > 0; i--) pts.push(`${f(r())} ${f((i / n) * 100)}`);
  return `polygon(${pts.join(', ')})`;
}

// ---------- Desk ephemera (x, y in % of screen; w in vmax; depth drives parallax) ----------
const SCRAPS = [
  { key: 'map', x: 17, y: 24, w: 30, ar: '4 / 3', r: -7, depth: 0.7, ph: '<em>fig. 1</em><b>BHARAT</b><small>Railway map · 1956</small>' },
  { key: 'compass', x: 84, y: 20, w: 15, ar: '1', r: 12, depth: 1.3, ph: '<i>N</i><i>E</i><i>S</i><i>W</i><b>✦</b>' },
  { key: 'postage', x: 39, y: 11, w: 8, ar: '4 / 5', r: 6, depth: 1.8, ph: '<small>India postage</small><b>25</b><small>naye paise</small>' },
  { key: 'film', x: 13, y: 76, w: 24, ar: '3 / 1', r: 9, depth: 1.0, ph: '<small>Kodak safety film 5063</small>' },
  { key: 'pen', x: 75, y: 80, w: 30, ar: '7 / 1', r: -18, depth: 1.5, ph: '<small>fountain pen · Bombay · 1962</small>' },
  { key: 'ticket', x: 88, y: 52, w: 17, ar: '2 / 1', r: -12, depth: 0.6, ph: '<b>Wanderwords Rail</b><small>3rd class · Nº 0457</small>' },
];

const scrap = (s) => `
  <div class="cl-piece cl-scrap" data-depth="${s.depth}" style="--x:${s.x}%;--y:${s.y}%;--w:${s.w};--r:${s.r}deg;--ar:${s.ar}">
    <div class="cl-boil"><div class="cl-art" data-asset="${s.key}" data-torn><div class="ph ph-${s.key}">${s.ph}</div></div></div>
  </div>`;

// ---------- Wax seal (placeholder for seal.png) ----------
export function sealSVG() {
  const petals = Array.from({ length: 8 }, (_, i) =>
    `<ellipse cx="50" cy="31" rx="7" ry="15" transform="rotate(${i * 45} 50 50)"/>`).join('');
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <defs><radialGradient id="cl-wax" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#C23A2E"/><stop offset=".6" stop-color="#8E1A16"/><stop offset="1" stop-color="#5E0E0C"/></radialGradient></defs>
    <path d="M50 4 C66 2 78 10 88 20 C98 32 98 46 95 58 C92 74 84 86 70 93 C56 99 40 98 28 92 C14 85 5 72 4 56 C3 40 8 26 20 15 C28 8 38 5 50 4Z" fill="url(#cl-wax)"/>
    <circle cx="50" cy="50" r="35" fill="none" stroke="#5E0E0C" stroke-width="3" opacity=".7"/>
    <g fill="none" stroke="#E7B85A" stroke-width="2" opacity=".85">${petals}</g>
    <circle cx="50" cy="50" r="6" fill="#E7B85A" opacity=".85"/>
  </svg>`;
}

// ---------- Pen sketches (placeholders for the engravings) ----------
const SKETCH = {
  temple: 'M10 90 L10 60 Q10 20 50 12 Q90 20 90 60 L90 90 M50 12 L50 2 M30 90 L30 62 M70 90 L70 62 M0 90 L100 90',
  mountains: 'M0 80 L25 40 L38 58 L60 20 L80 50 L100 30 M52 32 L60 20 L68 32 M0 92 L100 92',
  tea: 'M20 80 C20 40 50 15 85 15 C85 50 60 80 20 80 Z M20 80 L70 30 M40 60 L45 45 M55 48 L62 38',
  tracks: 'M10 95 L40 5 M90 95 L60 5 M18 75 L82 75 M24 55 L76 55 M30 37 L70 37 M35 20 L65 20',
};
const ENGRAVINGS = [['temple', 'tl'], ['mountains', 'tr'], ['tea', 'bl'], ['tracks', 'br']];

// ---------- Passport security print: guilloche + sacred geometry, inner markup for viewBox 0 0 600 820 ----------
const pl = (d, o = 1) => `<path d="${d}" pathLength="1" opacity="${o}"/>`;
const ring = (x, y, r) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;

export function watermarkSVG(W = 600, H = 820) {
  const cx = W / 2, cy = H * 0.56, R = W * 0.3;
  let d = '';
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    d += pl(ring(cx + Math.cos(a) * R * 0.38, cy + Math.sin(a) * R * 0.38, R * 0.62), 0.55);
  }
  d += pl(ring(cx, cy - R, R), 0.7) + pl(ring(cx, cy + R, R), 0.7);
  d += pl(ring(cx - R, cy, R), 0.45) + pl(ring(cx + R, cy, R), 0.45) + pl(ring(cx, cy, R * 1.618), 0.35);
  d += pl(`M ${cx} 0 V ${H}`, 0.6) + pl(`M 0 ${cy} H ${W}`, 0.6);
  const bw = W * 0.46, bh = bw * 1.618, x1 = cx - bw / 2, x2 = cx + bw / 2, y1 = cy - bh / 2, y2 = cy + bh / 2;
  d += pl(`M ${cx} ${y1} H ${x2} V ${y2} H ${x1 - 30}`, 0.9) + pl(`M ${x1} ${y1 - 30} V ${y2 + 30}`, 0.5);
  return d;
}

// ---------- The ink the stamp leaves (uses the page's #inky filter) ----------
export function impressionSVG() {
  return `<svg viewBox="0 0 260 170" aria-hidden="true">
    <rect x="6" y="6" width="248" height="158" rx="6" fill="none" stroke="currentColor" stroke-width="5"/>
    <rect x="16" y="16" width="228" height="138" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <g fill="currentColor" text-anchor="middle">
      <text x="130" y="52" font-family="Inter, sans-serif" font-weight="700" font-size="18" letter-spacing="3">WANDERWORDS RAIL</text>
      <text x="130" y="106" font-family="Cormorant Garamond, serif" font-style="italic" font-size="38">Cleared</text>
      <text x="130" y="136" font-family="Inter, sans-serif" font-weight="700" font-size="11" letter-spacing="2.4">10 STOPS · JOURNEY APPROVED</text>
    </g>
    <line x1="40" y1="66" x2="220" y2="66" stroke="currentColor" stroke-width="2"/>
  </svg>`;
}

// Ransom-note headline: each word on its own torn scrap, alternating type styles
const head = (cls, words) => `
  <h2 class="cl-head ${cls}" aria-label="${words.join(' ')}">${words
    .map((w, i) => `<span class="cl-word cl-word--v${i % 4}" data-torn-always aria-hidden="true">${w}</span>`).join(' ')}</h2>`;

// ---------- The whole stage ----------
export function stageHTML() {
  return `
<div class="cl-cam"><div class="cl-pan">
  <div class="cl-world">
    <div class="cl-desk" data-asset="desk"><div class="ph ph-desk"></div></div>
    <div class="cl-scraps">
      ${SCRAPS.map(scrap).join('')}
      <div class="cl-piece cl-scrap" data-depth="0.9" style="--x:63%;--y:9%;--w:20;--r:3deg">
        <div class="cl-boil"><p class="cl-news" data-torn-always>MONDAY. AGAIN.</p></div>
      </div>
      <div class="cl-piece cl-scrap" data-depth="0.5" style="--x:31%;--y:66%;--w:12;--r:0deg"><div class="cl-ring"></div></div>
    </div>
    <div class="cl-piece cl-envelope" style="--x:50%;--y:54%;--w:30;--r:-4deg;--ar:1.6">
      <div class="cl-boil">
        <div class="cl-art cl-envelope__body" data-asset="envelope">
          <div class="ph ph-airmail">
            <span class="ph-airmail__label">Par avion · By air mail</span>
            <span class="ph-airmail__to">For you</span>
            <span class="ph-airmail__stamp"><small>India</small><b>25</b></span>
          </div>
        </div>
        <div class="cl-envelope__flap"></div>
        <div class="cl-seal">
          <div class="cl-seal__half cl-seal__half--l" data-asset="seal"><div class="ph">${sealSVG()}</div></div>
          <div class="cl-seal__half cl-seal__half--r" data-asset="seal"><div class="ph">${sealSVG()}</div></div>
        </div>
      </div>
    </div>
  </div>
  <div class="cl-vignette"></div>
  <div class="cl-scrim"></div>
  <div class="cl-wash"></div>
  ${head('cl-head--1', ['A', 'letter', 'has', 'come', 'for', 'you.'])}

  <article class="cl-letter" aria-label="The letter">
    <div class="cl-sheet" data-asset="paper" data-torn-always>
      <div class="ph ph-parchment"></div>
      <div class="cl-sheet__text">
        <p class="cl-ink cl-ink--salute cl-sweep">To whoever finds this next,</p>
        <p class="cl-ink cl-words">Someone once left me a letter like this. I almost didn't go.</p>
        <p class="cl-ink cl-words">There are ten stops on a line that runs the length of a country. At each one, someone will feed you, or show you something they made with their hands. Let them.</p>
        <p class="cl-ink cl-words">Bring your passport.</p>
        <p class="cl-ink cl-ink--key cl-sweep">The train leaves when you arrive.</p>
        <p class="cl-ink cl-sign"><span aria-hidden="true">—</span> <span class="cl-smudge" aria-hidden="true">the last passenger</span><span class="sr-only">The signature is smudged by rain.</span></p>
      </div>
      ${ENGRAVINGS.map(([k, pos]) => `<div class="cl-engr cl-engr--${pos}" data-asset="${k}"><div class="ph"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="${SKETCH[k]}"/></svg></div></div>`).join('')}
    </div>
  </article>

  <div class="cl-passport" role="group" aria-label="Your passport">
    <div class="cl-book">
      <div class="cl-page cl-page--l" data-asset="passport">
        <svg class="cl-wm" viewBox="0 0 600 820" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${watermarkSVG()}</svg>
        <p class="cl-page__eyebrow">Passport · Travel record</p>
        <div class="cl-photo"><span>Affix photograph</span></div>
        <dl class="cl-fields">
          <div><dt>Holder</dt><dd>You</dd></div>
          <div><dt>Destination</dt><dd>India</dd></div>
          <div><dt>Route</dt><dd>Ten stops, by rail</dd></div>
          <div><dt>Issued</dt><dd class="cl-issued">Today</dd></div>
        </dl>
      </div>
      <div class="cl-page cl-page--r" data-asset="passport">
        <svg class="cl-wm" viewBox="0 0 600 820" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${watermarkSVG()}</svg>
        <p class="cl-page__eyebrow">Visas · Entries</p>
        <div class="cl-target"><span>Stamp here</span></div>
        <div class="cl-impression" aria-hidden="true">${impressionSVG()}</div>
        <div class="cl-splat" aria-hidden="true"></div>
      </div>
    </div>
    <div class="cl-stamp-shadow" aria-hidden="true"></div>
    <div class="cl-stamper" data-asset="stamper" aria-hidden="true">
      <div class="ph ph-stamper"><i class="ph-stamper__knob"></i><i class="ph-stamper__neck"></i><i class="ph-stamper__base"></i></div>
    </div>
  </div>

  ${head('cl-head--2', ['Platform', '1', 'Departing', 'now.'])}
</div></div>
<div class="cl-grain" aria-hidden="true"></div>
<div class="cl-cue" aria-hidden="true"><span>Scroll</span><i></i></div>`;
}

// ---------- Train fallback (until coach.png and loco.png exist) ----------
// Side view in SVG units (1000 tall); coaches trail left, locomotive leads right.
export const TRAIN = { coach: 2400, gap: 70, loco: 2200, height: 1000, coaches: 3 };

function bogie(cx) {
  return [-120, 120].map((dx) =>
    `<circle cx="${cx + dx}" cy="880" r="70" fill="#2A2522" stroke="#8C8580" stroke-width="10"/><circle cx="${cx + dx}" cy="880" r="16" fill="#8C8580"/>`).join('') +
    `<rect x="${cx - 220}" y="820" width="440" height="40" rx="8" fill="#3A322C"/>`;
}

function coach(x, i) {
  const w = TRAIN.coach;
  let win = '';
  for (let k = 0; k < 9; k++) {
    const wx = x + 230 + k * 220;
    win += `<rect x="${wx}" y="290" width="150" height="190" rx="18" fill="url(#cl-lamp)"/>`;
    for (let b = 1; b < 4; b++) win += `<rect x="${wx}" y="${290 + b * 47}" width="150" height="5" fill="#1D2A3A" opacity=".8"/>`;
  }
  return `<rect x="${x + 10}" y="40" width="${w - 20}" height="70" rx="34" fill="#9AA3AD"/>
    <rect x="${x}" y="70" width="${w}" height="730" rx="40" fill="#1F4E8C"/>
    <rect x="${x}" y="520" width="${w}" height="36" fill="#F3E6CC"/>${win}
    <text x="${x + w / 2}" y="700" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="40" letter-spacing="6" fill="#F3E6CC" opacity=".85">WW 2026 · 0${i + 1}</text>
    ${bogie(x + 400)}${bogie(x + w - 400)}`;
}

function loco(x) {
  const w = TRAIN.loco, body = 1880;
  return `<path d="M${x + 40} 70 H${x + body} Q${x + w} 90 ${x + w} 330 V800 H${x} V110 Q${x} 70 ${x + 40} 70Z" fill="#B5523B"/>
    <path d="M${x + body + 20} 150 H${x + body + 170} Q${x + w - 14} 200 ${x + w - 14} 330 H${x + body + 20}Z" fill="#1D2A3A"/>
    <rect x="${x}" y="520" width="${w}" height="40" fill="#F3E6CC"/>
    <text x="${x + 1000}" y="720" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="64" letter-spacing="10" fill="#F3E6CC">WANDERWORDS</text>
    <circle cx="${x + w - 40}" cy="420" r="30" fill="#FFF3C4"/>
    ${bogie(x + 500)}${bogie(x + 1500)}`;
}

export function trainSVG() {
  const { coach: cw, gap, loco: lw, height, coaches } = TRAIN;
  const step = cw + gap, total = coaches * step + lw;
  let body = '';
  for (let i = 0; i < coaches; i++) {
    body += coach(i * step, i) + `<rect x="${i * step + cw}" y="120" width="${gap}" height="680" fill="#1E1712"/>`;
  }
  body += loco(coaches * step);
  const svg = `<svg viewBox="0 0 ${total} ${height}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="cl-lamp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBD889"/><stop offset="1" stop-color="#E08E2B"/></linearGradient></defs>
    <rect x="0" y="800" width="${total}" height="200" fill="#17110D"/>${body}</svg>`;
  return { svg, total, height, centres: Array.from({ length: coaches }, (_, i) => i * step + cw / 2) };
}
