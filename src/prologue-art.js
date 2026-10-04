// Flat 2D illustrations for the prologue. Everything is inline SVG,
// so it scales to any screen and needs no image files.

// A path that draws itself: pathLength="1" lets CSS/GSAP animate stroke-dashoffset from 1 to 0
const pl = (d, o = 1) => `<path d="${d}" pathLength="1" opacity="${o}"/>`;
const ring = (x, y, r) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;

// ---------- The desk ----------
// Drawn in full colour. CSS shows it in greyscale until the passport is stamped,
// then the colour bleeds back in. #pl-glass is the window pane the fog sits on.
export function deskSVG() {
  const sheet = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 6; c++) {
      sheet.push(`<rect x="${448 + c * 54}" y="${418 + r * 20}" width="50" height="16" rx="1.5" fill="${r === 0 ? '#5B7A99' : '#E4E8EE'}"/>`);
    }
  }
  // A calendar with nothing circled
  const days = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      days.push(`<rect x="${194 + c * 21}" y="${214 + r * 22}" width="17" height="18" rx="2" fill="#E6E0D4"/>`);
    }
  }
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const p = (r) => [(1320 + Math.cos(a) * r).toFixed(1), (210 + Math.sin(a) * r).toFixed(1)];
    const [x1, y1] = p(50), [x2, y2] = p(60);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join('');

  return `<svg class="pl-desk__art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="pl-wall-shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.22"/>
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.18"/>
    </linearGradient>
  </defs>

  <!-- Wall -->
  <rect width="1600" height="900" fill="#2E6A68"/>
  <rect width="1600" height="640" fill="url(#pl-wall-shade)"/>

  <!-- Window (the fog canvas is laid over #pl-glass) -->
  <rect x="560" y="80" width="480" height="320" rx="6" fill="#E9DCC4"/>
  <rect id="pl-glass" x="584" y="104" width="432" height="272" fill="#9FB7C4"/>
  <rect x="540" y="400" width="520" height="18" rx="3" fill="#D9C7A6"/>

  <!-- Calendar -->
  <rect x="170" y="130" width="190" height="240" rx="6" fill="#F4F1EA"/>
  <rect x="170" y="130" width="190" height="60" rx="6" fill="#B5523B"/>
  <rect x="170" y="170" width="190" height="20" fill="#B5523B"/>
  <text x="265" y="168" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="16" letter-spacing="4" fill="#F4F1EA">OCTOBER</text>
  <circle cx="210" cy="130" r="6" fill="#2A2522"/>
  <circle cx="320" cy="130" r="6" fill="#2A2522"/>
  ${days.join('')}

  <!-- Clock: 9 o'clock, forever -->
  <circle cx="1320" cy="210" r="70" fill="#F4F1EA" stroke="#1F1A17" stroke-width="8"/>
  <g stroke="#1F1A17" stroke-width="3">${ticks}</g>
  <line x1="1320" y1="210" x2="1284" y2="210" stroke="#1F1A17" stroke-width="7" stroke-linecap="round"/>
  <line x1="1320" y1="210" x2="1320" y2="160" stroke="#1F1A17" stroke-width="5" stroke-linecap="round"/>
  <line class="pl-clock-sec" x1="1320" y1="222" x2="1320" y2="152" stroke="#B5523B" stroke-width="2" stroke-linecap="round"/>
  <circle cx="1320" cy="210" r="5" fill="#1F1A17"/>

  <!-- Sticky note -->
  <g transform="rotate(-6 1135 340)">
    <rect x="1080" y="290" width="110" height="100" fill="#F2D46B"/>
    <text x="1135" y="350" text-anchor="middle" font-family="Caveat, cursive" font-size="32" fill="#3A2A1A">someday</text>
  </g>

  <!-- Wilting plant -->
  <g fill="none" stroke="#5F8A45" stroke-width="6" stroke-linecap="round">
    <path d="M1485 578 C1482 520 1446 498 1418 528"/>
    <path d="M1488 578 C1494 512 1534 500 1556 534"/>
    <path d="M1486 578 C1486 540 1478 520 1470 506"/>
  </g>
  <ellipse cx="1416" cy="534" rx="16" ry="8" transform="rotate(40 1416 534)" fill="#5F8A45"/>
  <ellipse cx="1558" cy="540" rx="16" ry="8" transform="rotate(-40 1558 540)" fill="#5F8A45"/>
  <ellipse cx="1468" cy="502" rx="14" ry="7" transform="rotate(70 1468 502)" fill="#5F8A45"/>
  <rect x="1450" y="580" width="70" height="64" rx="6" fill="#B5523B"/>
  <rect x="1444" y="574" width="82" height="14" rx="4" fill="#C8664C"/>

  <!-- Desk -->
  <rect y="640" width="1600" height="120" fill="#8A5A3C"/>
  <rect y="640" width="1600" height="6" fill="#A7744F"/>
  <rect y="760" width="1600" height="140" fill="#5E3B26"/>
  <rect y="760" width="1600" height="4" fill="#4A2E1C"/>

  <!-- Papers -->
  <polygon points="200,668 380,672 392,724 206,730" fill="#E4DED2"/>
  <polygon points="160,690 360,676 384,740 176,752" fill="#F4F1EA"/>
  <g stroke="#B9B2A6" stroke-width="3">
    <line x1="190" y1="702" x2="340" y2="692"/>
    <line x1="194" y1="716" x2="350" y2="706"/>
    <line x1="198" y1="730" x2="300" y2="724"/>
  </g>

  <!-- Laptop with a spreadsheet -->
  <rect x="420" y="380" width="380" height="240" rx="10" fill="#2A2D33"/>
  <rect x="436" y="396" width="348" height="208" rx="3" fill="#F7F8FA"/>
  ${sheet.join('')}
  <polygon points="400,620 820,620 850,660 370,660" fill="#B8BEC6"/>
  <polygon points="570,632 650,632 656,652 564,652" fill="#A3AAB3"/>

  <!-- Cold coffee and the ring it left -->
  <ellipse cx="1010" cy="704" rx="46" ry="10" fill="none" stroke="#6E4630" stroke-width="3"/>
  <path d="M958 582 q36 0 36 30 q0 30 -36 30" fill="none" stroke="#E9E4DA" stroke-width="12"/>
  <rect x="880" y="560" width="80" height="90" rx="8" fill="#E9E4DA"/>
  <ellipse cx="920" cy="562" rx="40" ry="8" fill="#3B2416"/>

  <!-- Phone: twelve unread -->
  <polygon points="1060,680 1170,680 1185,720 1072,720" fill="#1E2024"/>
  <polygon points="1068,684 1164,684 1176,716 1078,716" fill="#3A3F47"/>
  <circle cx="1166" cy="682" r="10" fill="#B5523B"/>
  <text x="1166" y="686" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="10" fill="#fff">12</text>

  <!-- Passport, never used -->
  <polygon points="1240,668 1390,668 1410,736 1252,736" fill="#1F3A5F"/>
  <ellipse cx="1326" cy="702" rx="18" ry="10" fill="none" stroke="#C8962E" stroke-width="3"/>
</svg>`;
}

// ---------- Wax seal with a lotus ----------
export function sealSVG() {
  const petals = Array.from({ length: 8 }, (_, i) =>
    `<ellipse cx="50" cy="31" rx="7" ry="15" transform="rotate(${i * 45} 50 50)"/>`).join('');
  return `<svg class="pl-seal__art" viewBox="0 0 100 100" aria-hidden="true">
    <path d="M50 4 C66 2 78 10 88 20 C98 32 98 46 95 58 C92 74 84 86 70 93 C56 99 40 98 28 92 C14 85 5 72 4 56 C3 40 8 26 20 15 C28 8 38 5 50 4Z" fill="#9E1F1A"/>
    <circle cx="50" cy="50" r="35" fill="none" stroke="#7A1512" stroke-width="3"/>
    <g fill="none" stroke="#F2B632" stroke-width="2.2">${petals}</g>
    <circle cx="50" cy="50" r="7" fill="#F2B632"/>
  </svg>`;
}

// ---------- Ink sketches bleeding through the letter's margins ----------
const SKETCHES = {
  temple: 'M10 90 L10 60 Q10 20 50 12 Q90 20 90 60 L90 90 M50 12 L50 2 M30 90 L30 62 M70 90 L70 62 M0 90 L100 90',
  mountains: 'M0 80 L25 40 L38 58 L60 20 L80 50 L100 30 M52 32 L60 20 L68 32 M0 92 L100 92',
  tea: 'M20 80 C20 40 50 15 85 15 C85 50 60 80 20 80 Z M20 80 L70 30 M40 60 L45 45 M55 48 L62 38',
  tracks: 'M10 95 L40 5 M90 95 L60 5 M18 75 L82 75 M24 55 L76 55 M30 37 L70 37 M35 20 L65 20',
};

export function sketchesSVG() {
  return [['temple', 'tl'], ['mountains', 'tr'], ['tea', 'bl'], ['tracks', 'br']].map(([k, pos]) =>
    `<svg class="pl-sketch pl-sketch--${pos}" viewBox="0 0 100 100" aria-hidden="true"><path d="${SKETCHES[k]}" pathLength="1"/></svg>`).join('');
}

// ---------- Passport watermark: guilloche rosette + the sacred geometry, as security ink ----------
// Returns the inner markup for an <svg viewBox="0 0 600 820">
export function watermarkSVG(W = 600, H = 820) {
  const cx = W / 2, cy = H * 0.56, R = W * 0.3;
  let d = '';
  // Guilloche rosette, like the one printed on every passport page
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    d += pl(ring(cx + Math.cos(a) * R * 0.38, cy + Math.sin(a) * R * 0.38, R * 0.62), 0.55);
  }
  // Compass circles meeting at the centre (vesica piscis) and the outer harmony circle
  d += pl(ring(cx, cy - R, R), 0.7) + pl(ring(cx, cy + R, R), 0.7);
  d += pl(ring(cx - R, cy, R), 0.45) + pl(ring(cx + R, cy, R), 0.45);
  d += pl(ring(cx, cy, R * 1.618), 0.35);
  // Axes and construction diagonals
  d += pl(`M ${cx} 0 V ${H}`, 0.6) + pl(`M 0 ${cy} H ${W}`, 0.6);
  d += pl(`M 0 ${cy + cx * 0.58} L ${W} ${cy - cx * 0.58}`, 0.4);
  d += pl(`M 0 ${cy - cx * 0.58} L ${W} ${cy + cx * 0.58}`, 0.4);
  // Open golden frame with a drafting tail
  const bw = W * 0.46, bh = bw * 1.618;
  const x1 = cx - bw / 2, x2 = cx + bw / 2, y1 = cy - bh / 2, y2 = cy + bh / 2;
  d += pl(`M ${cx} ${y1} H ${x2} V ${y2} H ${x1 - 30}`, 0.9);
  d += pl(`M ${x1} ${y1 - 30} V ${y2 + 30}`, 0.5);
  // Fibonacci grid and spiral in the top-left corner
  const fx = W * 0.08, fy = H * 0.08;
  d += pl(`M ${fx} ${fy} h 80 v 50 h -80 Z M ${fx + 50} ${fy} v 50 M ${fx + 50} ${fy + 30} h 30`, 0.6);
  d += pl(`M ${fx} ${fy + 50} A 50 50 0 0 1 ${fx + 50} ${fy} A 30 30 0 0 1 ${fx + 80} ${fy + 30}`, 0.8);
  return d;
}

// ---------- Passport photo: a silhouette, because it's you ----------
export function photoSVG() {
  return `<svg viewBox="0 0 60 80" aria-hidden="true">
    <circle cx="30" cy="30" r="13" fill="#B9AE98"/>
    <path d="M6 80 C6 58 18 50 30 50 C42 50 54 58 54 80Z" fill="#B9AE98"/>
  </svg>`;
}

// ---------- Brass stamp (rubber face sits at y = 246 of 260) ----------
export const STAMPER_FACE = 246 / 260;

export function stamperSVG() {
  return `<svg viewBox="0 0 200 260" aria-hidden="true">
    <defs>
      <linearGradient id="pl-brass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#8A6A2E"/>
        <stop offset="0.45" stop-color="#E7C877"/>
        <stop offset="1" stop-color="#9A7430"/>
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="52" rx="46" ry="44" fill="#6B3A24"/>
    <ellipse cx="86" cy="36" rx="14" ry="9" fill="#8C5434"/>
    <rect x="84" y="88" width="32" height="70" rx="6" fill="url(#pl-brass)"/>
    <rect x="56" y="150" width="88" height="22" rx="6" fill="url(#pl-brass)"/>
    <rect x="30" y="170" width="140" height="60" rx="8" fill="url(#pl-brass)"/>
    <rect x="36" y="230" width="128" height="16" rx="3" fill="#5A1010"/>
  </svg>`;
}

// ---------- The ink the stamp leaves behind (uses the page's #inky filter) ----------
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

// ---------- The train for the screen wipe ----------
// One long side view in SVG units (1000 tall). Coaches trail on the left, the locomotive
// leads on the right, so it enters from the left edge and sweeps right.
// The dark undercarriage band runs the full length, so the train covers the screen with no gaps.
export const TRAIN = { coach: 2400, gap: 70, loco: 2200, height: 1000, coaches: 3 };

function bogie(cx) {
  const wheels = [-120, 120].map((dx) =>
    `<circle cx="${cx + dx}" cy="880" r="70" fill="#2A2522" stroke="#8C8580" stroke-width="10"/>` +
    `<circle cx="${cx + dx}" cy="880" r="16" fill="#8C8580"/>`).join('');
  return `${wheels}<rect x="${cx - 220}" y="820" width="440" height="40" rx="8" fill="#3A322C"/>`;
}

function coach(x, i) {
  const w = TRAIN.coach;
  let windows = '';
  for (let k = 0; k < 9; k++) {
    const wx = x + 230 + k * 220;
    windows += `<rect x="${wx}" y="290" width="150" height="190" rx="18" fill="url(#pl-lamp)"/>`;
    // A few passengers already on board
    if ((k + i) % 3 === 0) {
      windows += `<circle cx="${wx + 75}" cy="392" r="26" fill="#6B3A24" opacity=".55"/>` +
        `<path d="M${wx + 30} 480 C${wx + 30} 432 ${wx + 120} 432 ${wx + 120} 480Z" fill="#6B3A24" opacity=".55"/>`;
    }
    for (let b = 1; b < 4; b++) windows += `<rect x="${wx}" y="${290 + b * 47}" width="150" height="5" fill="#1D2A3A" opacity=".8"/>`;
  }
  const door = (dx) =>
    `<rect x="${x + dx}" y="200" width="120" height="560" rx="10" fill="#1A4378"/>` +
    `<rect x="${x + dx + 22}" y="250" width="76" height="140" rx="10" fill="url(#pl-lamp)"/>`;
  return `<g>
    <rect x="${x + 10}" y="40" width="${w - 20}" height="70" rx="34" fill="#9AA3AD"/>
    <rect x="${x}" y="70" width="${w}" height="730" rx="40" fill="#1F4E8C"/>
    <rect x="${x}" y="520" width="${w}" height="36" fill="#F3E6CC"/>
    <rect x="${x}" y="600" width="${w}" height="10" fill="#F3E6CC"/>
    ${door(70)}${door(w - 190)}
    ${windows}
    <text x="${x + w / 2}" y="548" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="26" letter-spacing="8" fill="#1F4E8C">WANDERWORDS EXPRESS</text>
    <text x="${x + w / 2}" y="700" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="40" letter-spacing="6" fill="#F3E6CC" opacity=".85">WW 2026 · 0${i + 1}</text>
    ${bogie(x + 400)}${bogie(x + w - 400)}
  </g>`;
}

function loco(x) {
  const w = TRAIN.loco, body = 1880;
  let grille = '';
  for (let k = 0; k < 14; k++) grille += `<rect x="${x + 320 + k * 100}" y="200" width="56" height="260" rx="6" fill="#8E3B2A"/>`;
  return `<g>
    <rect x="${x + 10}" y="40" width="${body - 40}" height="70" rx="34" fill="#9AA3AD"/>
    <path d="M${x + 40} 70 H${x + body} Q${x + w} 90 ${x + w} 330 V800 H${x} V110 Q${x} 70 ${x + 40} 70Z" fill="#B5523B"/>
    <path d="M${x + body + 20} 150 H${x + body + 170} Q${x + w - 14} 200 ${x + w - 14} 330 H${x + body + 20}Z" fill="#1D2A3A"/>
    <path d="M${x + body + 40} 170 H${x + body + 110} L${x + body + 60} 310 H${x + body + 40}Z" fill="#F3E6CC" opacity=".18"/>
    <rect x="${x}" y="520" width="${w}" height="40" fill="#F3E6CC"/>
    <rect x="${x}" y="590" width="${w}" height="14" fill="#F3E6CC"/>
    ${grille}
    <rect x="${x + 120}" y="200" width="120" height="560" rx="10" fill="#9A4532"/>
    <rect x="${x + 142}" y="250" width="76" height="140" rx="10" fill="#1D2A3A"/>
    <text x="${x + 1000}" y="720" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="64" letter-spacing="10" fill="#F3E6CC">WANDERWORDS</text>
    <circle cx="${x + w - 40}" cy="420" r="90" fill="url(#pl-beam)"/>
    <circle cx="${x + w - 40}" cy="420" r="30" fill="#FFF3C4"/>
    ${bogie(x + 500)}${bogie(x + 1500)}
  </g>`;
}

// Returns the markup plus its geometry in SVG units, so prologue.js can size it to the viewport
// and time the swap to the moment a coach fully covers the screen.
export function trainSVG() {
  const { coach: cw, gap, loco: lw, height, coaches } = TRAIN;
  const step = cw + gap;
  const total = coaches * step + lw;
  let body = '';
  for (let i = 0; i < coaches; i++) {
    const x = i * step;
    body += coach(x, i);
    body += `<rect x="${x + cw}" y="120" width="${gap}" height="680" fill="#1E1712"/>`; // bellows between cars
  }
  body += loco(coaches * step);
  const centres = Array.from({ length: coaches }, (_, i) => i * step + cw / 2);
  const svg = `<svg viewBox="0 0 ${total} ${height}" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="pl-lamp" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FBD889"/>
        <stop offset="1" stop-color="#E08E2B"/>
      </linearGradient>
      <radialGradient id="pl-beam">
        <stop offset="0" stop-color="#FFF3C4" stop-opacity=".7"/>
        <stop offset="1" stop-color="#FFF3C4" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect x="0" y="800" width="${total}" height="200" fill="#17110D"/>
    ${body}
  </svg>`;
  return { svg, total, height, centres };
}
