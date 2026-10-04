import gsap from 'gsap';

// Act I: wipe the fogged train window, face the ticket, stamp it, ride.

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function paintScene(target) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = '/media/opening/arch.png';
    img.onload = () => {
      // 12% overscan buffer (6% bleed on all 4 sides) so parallax never exposes empty background
      const w = Math.round(innerWidth * 1.12);
      const h = Math.round(innerHeight * 1.12);
      target.width = w; target.height = h;
      const x = target.getContext('2d');
      const s = Math.max(w / img.width, h / img.height);
      const dw = img.width * s, dh = img.height * s;
      x.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      resolve(target);
    };
    img.onerror = () => resolve(target);
  });
}

function injectSubject(root) {
  const wrap = document.createElement('div');
  wrap.className = 'op-subject-wrap';
  const img = document.createElement('img');
  img.src = '/media/opening/subject.png';
  img.className = 'op-subject';
  wrap.appendChild(img);
  root.appendChild(wrap);
  // No idle animations — subject is static, depth comes from parallax only
  return { wrap, img };
}

// Renaissance Sacred Geometry & Drafting Grid (Shopify Editions Aesthetic)
function createPerspectiveOverlay(root) {
  const W = innerWidth, H = innerHeight;
  const cx = W / 2, cy = H / 2;
  const ns = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.classList.add('op-lines');
  root.appendChild(svg);

  const primaryAxes = [];
  const compassArcs = [];
  const goldenFrames = [];
  const fibonacciGrids = [];

  // Hairline vector drafting line helper
  function makeLine(x1, y1, x2, y2, stroke, width, group) {
    const el = document.createElementNS(ns, 'line');
    el.setAttribute('x1', x1); el.setAttribute('y1', y1);
    el.setAttribute('x2', x2); el.setAttribute('y2', y2);
    el.setAttribute('stroke', stroke || 'rgba(255, 255, 255, 0.16)');
    el.setAttribute('stroke-width', width || '0.75');
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(el);
    const len = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    const item = { el, len };
    (group || primaryAxes).push(item);
    return item;
  }

  // Hairline vector drafting path helper
  function makePath(d, stroke, width, group) {
    const el = document.createElementNS(ns, 'path');
    el.setAttribute('d', d);
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', stroke || 'rgba(255, 255, 255, 0.18)');
    el.setAttribute('stroke-width', width || '0.75');
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('stroke-linejoin', 'round');
    el.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(el);
    const len = Math.ceil(el.getTotalLength ? el.getTotalLength() : 1000);
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    const item = { el, len };
    (group || compassArcs).push(item);
    return item;
  }

  // 1. Central Golden Framing Box (Shopify Editions open architectural frame)
  const bw = Math.min(360, Math.max(260, W * 0.23));
  const bh = bw * 1.618; // Exact Golden Ratio
  const bx1 = cx - bw * 0.42;
  const bx2 = cx + bw * 0.58;
  const by1 = cy - bh * 0.46;
  const by2 = cy + bh * 0.54;

  // The distinctive Shopify open frame with bottom drafting tail
  const framePath = `M ${cx} ${by1} L ${bx2} ${by1} L ${bx2} ${by2} L ${bx1 - 50} ${by2}`;
  makePath(framePath, 'rgba(255, 255, 255, 0.52)', '1.0', goldenFrames);

  // Left vertical guide line with drafting overhang
  makeLine(bx1, by1 - 50, bx1, by2 + 50, 'rgba(255, 255, 255, 0.18)', '0.75', primaryAxes);
  // Right vertical guide line with drafting overhang
  makeLine(bx2, by1 - 50, bx2, by2 + 50, 'rgba(255, 255, 255, 0.18)', '0.75', primaryAxes);

  // Horizontal golden section guide lines extending across canvas
  makeLine(0, by1, W, by1, 'rgba(255, 255, 255, 0.10)', '0.75', primaryAxes);
  makeLine(0, by2, W, by2, 'rgba(255, 255, 255, 0.10)', '0.75', primaryAxes);

  // 2. Primary Axes (Streaming from center out to borders)
  // Vertical axis
  makeLine(cx, cy, cx, 0, 'rgba(255, 255, 255, 0.28)', '0.8', primaryAxes);
  makeLine(cx, cy, cx, H, 'rgba(255, 255, 255, 0.28)', '0.8', primaryAxes);
  // Horizontal axis
  makeLine(cx, cy, 0, cy, 'rgba(255, 255, 255, 0.28)', '0.8', primaryAxes);
  makeLine(cx, cy, W, cy, 'rgba(255, 255, 255, 0.28)', '0.8', primaryAxes);

  // Diagonal construction rays (cutting through the golden section vertices)
  const diagD = Math.max(W, H) * 1.5;
  const angle1 = Math.atan2(bh, bw * 2.2); // ~30 deg
  makeLine(cx, cy, cx + Math.cos(angle1) * diagD, cy - Math.sin(angle1) * diagD, 'rgba(255, 255, 255, 0.22)', '0.75', primaryAxes);
  makeLine(cx, cy, cx - Math.cos(angle1) * diagD, cy + Math.sin(angle1) * diagD, 'rgba(255, 255, 255, 0.22)', '0.75', primaryAxes);

  const angle2 = Math.atan2(bh * 0.7, bw * 1.8);
  makeLine(cx, cy, cx - Math.cos(angle2) * diagD, cy - Math.sin(angle2) * diagD, 'rgba(255, 255, 255, 0.14)', '0.75', primaryAxes);
  makeLine(cx, cy, cx + Math.cos(angle2) * diagD, cy + Math.sin(angle2) * diagD, 'rgba(255, 255, 255, 0.14)', '0.75', primaryAxes);

  // 3. Sacred Compass Circles (All 4 cardinal circles meet at cx, cy, forming the Vesica Piscis)
  const R = Math.min(W * 0.42, H * 0.56);
  // Top compass circle (starts at center cx, cy and sweeps up around)
  makePath(`M ${cx} ${cy} A ${R} ${R} 0 1 1 ${cx - 0.001} ${cy}`, 'rgba(255, 255, 255, 0.24)', '0.75', compassArcs);
  // Bottom compass circle (starts at center cx, cy and sweeps down around)
  makePath(`M ${cx} ${cy} A ${R} ${R} 0 1 0 ${cx + 0.001} ${cy}`, 'rgba(255, 255, 255, 0.24)', '0.75', compassArcs);
  // Left compass circle
  makePath(`M ${cx} ${cy} A ${R} ${R} 0 1 1 ${cx} ${cy - 0.001}`, 'rgba(255, 255, 255, 0.16)', '0.75', compassArcs);
  // Right compass circle
  makePath(`M ${cx} ${cy} A ${R} ${R} 0 1 0 ${cx} ${cy + 0.001}`, 'rgba(255, 255, 255, 0.16)', '0.75', compassArcs);
  // Outer harmony circle
  const R_outer = R * 1.618;
  makePath(`M ${cx} ${cy - R_outer} A ${R_outer} ${R_outer} 0 1 1 ${cx - 0.001} ${cy - R_outer}`, 'rgba(255, 255, 255, 0.10)', '0.75', compassArcs);

  // 4. Upper-Left Fibonacci Subdivision Grid
  const fx = bx1 - 140, fy = by1 + 40;
  // Outer rectangle with drafting overhangs
  makeLine(fx - 15, fy, fx + 85, fy, 'rgba(255, 255, 255, 0.22)', '0.75', fibonacciGrids);
  makeLine(fx - 15, fy + 50, fx + 85, fy + 50, 'rgba(255, 255, 255, 0.22)', '0.75', fibonacciGrids);
  makeLine(fx, fy - 15, fx, fy + 65, 'rgba(255, 255, 255, 0.22)', '0.75', fibonacciGrids);
  makeLine(fx + 80, fy - 15, fx + 80, fy + 65, 'rgba(255, 255, 255, 0.22)', '0.75', fibonacciGrids);
  // Internal subdivisions (Fibonacci squares: 50, 30, 20, 10)
  makeLine(fx + 50, fy - 8, fx + 50, fy + 58, 'rgba(255, 255, 255, 0.20)', '0.75', fibonacciGrids);
  makeLine(fx + 50, fy + 30, fx + 88, fy + 30, 'rgba(255, 255, 255, 0.20)', '0.75', fibonacciGrids);
  makeLine(fx + 68, fy + 30, fx + 68, fy + 56, 'rgba(255, 255, 255, 0.18)', '0.75', fibonacciGrids);
  // Golden spiral arc
  makePath(`M ${fx} ${fy + 50} A 50 50 0 0 1 ${fx + 50} ${fy} A 30 30 0 0 1 ${fx + 80} ${fy + 30}`, 'rgba(255, 255, 255, 0.25)', '0.75', fibonacciGrids);

  // 5. Lower-Right Fibonacci Subdivision Grid
  const rx = bx2 + 40, ry = cy + 40;
  // Outer rectangle with drafting overhangs
  makeLine(rx - 15, ry, rx + 115, ry, 'rgba(255, 255, 255, 0.22)', '0.75', fibonacciGrids);
  makeLine(rx - 15, ry + 68, rx + 115, ry + 68, 'rgba(255, 255, 255, 0.22)', '0.75', fibonacciGrids);
  makeLine(rx, ry - 15, rx, ry + 80, 'rgba(255, 255, 255, 0.22)', '0.75', fibonacciGrids);
  makeLine(rx + 110, ry - 15, rx + 110, ry + 80, 'rgba(255, 255, 255, 0.22)', '0.75', fibonacciGrids);
  // Internal subdivisions
  makeLine(rx + 68, ry - 8, rx + 68, ry + 76, 'rgba(255, 255, 255, 0.20)', '0.75', fibonacciGrids);
  makeLine(rx + 68, ry + 42, rx + 116, ry + 42, 'rgba(255, 255, 255, 0.20)', '0.75', fibonacciGrids);
  makeLine(rx + 94, ry + 42, rx + 94, ry + 74, 'rgba(255, 255, 255, 0.18)', '0.75', fibonacciGrids);
  // Diagonal through nested vertices
  makeLine(rx + 68, ry + 68, rx + 110, ry, 'rgba(255, 255, 255, 0.25)', '0.75', fibonacciGrids);
  // Golden spiral arc
  makePath(`M ${rx + 110} ${ry} A 68 68 0 0 1 ${rx + 42} ${ry + 68} A 42 42 0 0 1 ${rx} ${ry + 26}`, 'rgba(255, 255, 255, 0.25)', '0.75', fibonacciGrids);

  // 6. Central Compass Origin Anchor
  const centerGroup = document.createElementNS(ns, 'g');
  svg.appendChild(centerGroup);
  const cDot = document.createElementNS(ns, 'circle');
  cDot.setAttribute('cx', cx); cDot.setAttribute('cy', cy); cDot.setAttribute('r', '2.5');
  cDot.setAttribute('fill', 'rgba(255, 255, 255, 0.85)');
  centerGroup.appendChild(cDot);
  // Compass reticle ticks
  [[-8, 0, -14, 0], [8, 0, 14, 0], [0, -8, 0, -14], [0, 8, 0, 14]].forEach(([x1, y1, x2, y2]) => {
    const t = document.createElementNS(ns, 'line');
    t.setAttribute('x1', cx + x1); t.setAttribute('y1', cy + y1);
    t.setAttribute('x2', cx + x2); t.setAttribute('y2', cy + y2);
    t.setAttribute('stroke', 'rgba(255, 255, 255, 0.7)');
    t.setAttribute('stroke-width', '0.8');
    t.setAttribute('vector-effect', 'non-scaling-stroke');
    centerGroup.appendChild(t);
  });
  gsap.set(centerGroup, { scale: 0, autoAlpha: 0, transformOrigin: `${cx}px ${cy}px` });

  let flowStarted = false;
  function startFlow() {
    if (flowStarted) return;
    flowStarted = true;

    gsap.set(svg, { autoAlpha: 1 });
    const tl = gsap.timeline();

    // 1. Center anchor mark illuminates
    tl.to(centerGroup, {
      scale: 1,
      autoAlpha: 1,
      duration: 0.4,
      ease: 'back.out(2)',
    });

    // 2. Primary axes and golden diagonals stream outward from center
    tl.to(primaryAxes.map((d) => d.el), {
      strokeDashoffset: 0,
      duration: 1.1,
      ease: 'power2.out',
      stagger: { amount: 0.4, from: 'start' },
    }, '-=0.2');

    // 3. Sacred compass circles sweep in along their paths from the center
    tl.to(compassArcs.map((d) => d.el), {
      strokeDashoffset: 0,
      duration: 1.5,
      ease: 'power2.out',
      stagger: 0.1,
    }, '-=0.8');

    // 4. Central Renaissance Golden Frame traces its architectural perimeter
    tl.to(goldenFrames.map((d) => d.el), {
      strokeDashoffset: 0,
      duration: 1.1,
      ease: 'power2.out',
    }, '-=0.9');

    // 5. Fibonacci geometric grids sketch into place in top-left and bottom-right
    tl.to(fibonacciGrids.map((d) => d.el), {
      strokeDashoffset: 0,
      duration: 1.0,
      ease: 'power2.out',
      stagger: 0.03,
    }, '-=0.7');

    return tl;
  }

  return { svg, startFlow };
}

function paintFog(x, scene) {
  const w = x.canvas.width, h = x.canvas.height;
  const [small, sx] = canvas(Math.max(8, w >> 4), Math.max(8, h >> 4));
  sx.drawImage(scene, 0, 0, small.width, small.height);
  x.imageSmoothingEnabled = true;
  x.drawImage(small, 0, 0, w, h);
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(236,241,240,0.78)');
  g.addColorStop(1, 'rgba(210,220,222,0.72)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) {
    const px = Math.random() * w, py = Math.random() * h, r = (0.05 + Math.random() * 0.15) * Math.max(w, h);
    const rg = x.createRadialGradient(px, py, 0, px, py, r);
    rg.addColorStop(0, 'rgba(255,255,255,' + (0.05 + Math.random() * 0.08) + ')');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = rg; x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  for (let i = 0; i < 320; i++) {
    const px = Math.random() * w, py = Math.random() * h, r = 1 + Math.pow(Math.random(), 3) * w * 0.008;
    const rg = x.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r);
    rg.addColorStop(0, 'rgba(255,255,255,.6)');
    rg.addColorStop(0.7, 'rgba(170,188,194,.35)');
    rg.addColorStop(1, 'rgba(120,140,150,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
  }
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 14; i++) {
    const px = Math.random() * w, py = Math.random() * h * 0.5, len = h * (0.1 + Math.random() * 0.3);
    x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 1 + Math.random() * 2;
    x.beginPath(); x.moveTo(px, py);
    x.bezierCurveTo(px + (Math.random() - 0.5) * 6, py + len * 0.3,
      px + (Math.random() - 0.5) * 6, py + len * 0.6,
      px + (Math.random() - 0.5) * 4, py + len);
    x.stroke();
  }
  x.globalCompositeOperation = 'source-over';
}

function wipe(x, a, b, r) {
  const dx = b.x - a.x, dy = b.y - a.y, n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (r * 0.3)));
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i <= n; i++) {
    const px = a.x + (dx * i) / n, py = a.y + (dy * i) / n;
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, 'rgba(0,0,0,.9)');
    g.addColorStop(0.55, 'rgba(0,0,0,.6)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  x.globalCompositeOperation = 'source-over';
}

function clearedFraction(x) {
  const d = x.getImageData(0, 0, x.canvas.width, x.canvas.height).data;
  let clear = 0, total = 0;
  for (let i = 3; i < d.length; i += 4 * 17) { total++; if (d[i] < 90) clear++; }
  return clear / total;
}

function ticketCanvas(stamped) {
  const W = 1100, H = 460, [c, x] = canvas(W, H);
  const pg = x.createLinearGradient(0, 0, W, H);
  pg.addColorStop(0, '#F6E8BF'); pg.addColorStop(0.5, '#EDD898'); pg.addColorStop(1, '#F3E2B2');
  x.fillStyle = pg; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 14000; i++) {
    const alpha = 0.02 + Math.random() * 0.04;
    x.fillStyle = Math.random() < 0.5 ? ('rgba(70,40,10,' + alpha + ')') : ('rgba(255,245,200,' + (alpha + 0.01) + ')');
    x.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random(), 1 + Math.random());
  }
  x.strokeStyle = '#8B1A1A'; x.lineWidth = 7; x.strokeRect(10, 10, W - 20, H - 20);
  x.lineWidth = 2; x.strokeRect(20, 20, W - 40, H - 40);
  x.fillStyle = '#8B1A1A'; x.fillRect(10, 10, W - 20, 58);
  x.fillStyle = '#F6E8BF'; x.textAlign = 'center'; x.font = '700 12px Inter';
  x.fillText('BHARATIYA RAIL  -  WANDERWORDS JOURNEY PASS', W / 2, 44);
  const stripW = 86;
  x.fillStyle = '#E2CB88'; x.fillRect(10, 68, stripW, H - 78);
  x.save(); x.setLineDash([5, 6]); x.strokeStyle = '#8B1A1A'; x.lineWidth = 1.5;
  x.beginPath(); x.moveTo(10 + stripW, 68); x.lineTo(10 + stripW, H - 10); x.stroke(); x.restore();
  for (let y = 90; y < H - 18; y += 22) {
    x.fillStyle = '#C4A85C'; x.beginPath(); x.arc(10 + stripW / 2, y, 5, 0, Math.PI * 2); x.fill();
  }
  x.save(); x.translate(10 + stripW / 2, H / 2 + 20); x.rotate(-Math.PI / 2);
  x.fillStyle = '#7A5618'; x.font = '700 9px Inter'; x.textAlign = 'center';
  x.fillText('RETAIN THIS PORTION', 0, 0); x.restore();
  const cx0 = 10 + stripW + 18, cy0 = 78, cw = W - cx0 - 28;
  x.fillStyle = '#8B1A1A'; x.fillRect(cx0, cy0, 88, 26);
  x.fillStyle = '#F6E8BF'; x.font = '700 10px Inter'; x.textAlign = 'center';
  x.fillText('1ST CLASS', cx0 + 44, cy0 + 18);
  x.fillStyle = '#5A300A'; x.font = '700 10px Inter'; x.textAlign = 'right';
  x.fillText('TRAIN: 12952 RAJDHANI EXP  -  SEAT: A1-04', cx0 + cw, cy0 + 18);
  const fY = cy0 + 48;
  x.fillStyle = '#8B1A1A'; x.font = '700 9px Inter'; x.textAlign = 'left'; x.fillText('FROM', cx0, fY);
  x.fillStyle = '#1A0804'; x.font = 'italic 700 30px "Playfair Display"'; x.fillText('New Delhi', cx0, fY + 32);
  x.fillStyle = '#8B1A1A'; x.font = '20px Inter'; x.textAlign = 'center'; x.fillText('- O -', cx0 + cw * 0.44, fY + 22);
  x.fillStyle = '#8B1A1A'; x.font = '700 9px Inter'; x.textAlign = 'left'; x.fillText('TO', cx0 + cw * 0.55, fY);
  x.fillStyle = '#1A0804'; x.font = 'italic 700 30px "Playfair Display"'; x.fillText('All of India', cx0 + cw * 0.55, fY + 32);
  x.strokeStyle = 'rgba(139,26,26,0.28)'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(cx0, fY + 50); x.lineTo(cx0 + cw, fY + 50); x.stroke();
  const bY = fY + 72;
  [['DATE', 'Sept 29, 2026'], ['CLASS', 'AC1 SLEEPER'], ['FARE', 'Rs. 00.00'], ['VALID FOR', 'One Grand Journey']].forEach(function(pair, i) {
    const lbl = pair[0], val = pair[1], fx = cx0 + i * (cw / 4);
    x.fillStyle = '#8B1A1A'; x.font = '700 8px Inter'; x.textAlign = 'left'; x.fillText(lbl, fx, bY);
    x.fillStyle = '#2A1004'; x.font = '600 13px Inter'; x.fillText(val, fx, bY + 17);
  });
  x.save();
  const wX = cx0 + cw * 0.42, wY = H / 2 + 14, wR = 46;
  x.globalAlpha = 0.07; x.strokeStyle = '#8B1A1A'; x.lineWidth = 1.2;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    x.beginPath(); x.moveTo(wX, wY); x.lineTo(wX + Math.cos(a) * wR, wY + Math.sin(a) * wR); x.stroke();
  }
  x.beginPath(); x.arc(wX, wY, wR, 0, Math.PI * 2); x.stroke();
  x.beginPath(); x.arc(wX, wY, 8, 0, Math.PI * 2); x.stroke(); x.restore();
  const sX = cx0 + cw - 58, sY = H / 2 + 10;
  if (!stamped) {
    x.save(); x.setLineDash([4, 5]);
    x.strokeStyle = 'rgba(139,26,26,0.3)'; x.lineWidth = 1.5;
    x.beginPath(); x.arc(sX, sY, 50, 0, Math.PI * 2); x.stroke(); x.restore();
    x.fillStyle = 'rgba(139,26,26,0.2)'; x.font = '700 8px Inter'; x.textAlign = 'center';
    x.fillText('STAMP', sX, sY - 4); x.fillText('HERE', sX, sY + 10);
  } else {
    x.save(); x.globalAlpha = 0.9;
    x.strokeStyle = '#8B1010'; x.lineWidth = 3;
    x.beginPath(); x.arc(sX, sY, 50, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 1.5; x.beginPath(); x.arc(sX, sY, 42, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#8B1010'; x.font = '700 9px Inter'; x.textAlign = 'center'; x.fillText('WANDERWORDS', sX, sY - 16);
    x.font = '700 18px "Playfair Display"'; x.fillStyle = '#7A0A0A'; x.fillText('CLEARED', sX, sY + 4);
    x.font = '700 8px Inter'; x.fillStyle = '#8B1010'; x.fillText('JOURNEY APPROVED', sX, sY + 20);
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, d = 44 + Math.random() * 8;
      x.fillStyle = 'rgba(139,16,16,' + (0.1 + Math.random() * 0.2) + ')';
      x.beginPath(); x.arc(sX + Math.cos(a) * d, sY + Math.sin(a) * d, 1 + Math.random() * 2, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  }
  return c;
}

function tearPaths() {
  const edge = [];
  for (let i = 0; i <= 18; i++) edge.push((50 + (Math.random() - 0.5) * 6).toFixed(1) + '% ' + ((i / 18) * 100).toFixed(1) + '%');
  return { l: 'polygon(0 0, ' + edge.join(', ') + ', 0 100%)', r: 'polygon(100% 0, ' + edge.join(', ') + ', 100% 100%)' };
}

export function runOpening({ stamps, post, sound }) {
  const root = document.querySelector('#opening');
  const q = (s) => root.querySelector(s);
  const cleanups = [];
  let cancelled = false;

  const done = new Promise((resolve) => {
    paintScene(q('.op-scene')).then((scene) => {
      if (cancelled) return;

      // Renaissance Sacred Geometry & Drafting Grid (Shopify Editions Aesthetic)
      const overlay = createPerspectiveOverlay(root);
      // Lines are prepared with strokeDashoffset = len (100% un-drawn).
      // They do NOT start on load behind the fog.
      // They trigger and flow outward from the center when the fog is wiped!

      const fog = q('.op-fog'), k = 0.4;
      fog.width = Math.round(innerWidth * k); fog.height = Math.round(innerHeight * k);
      const fx = fog.getContext('2d', { willReadFrequently: true });
      paintFog(fx, scene);

      // Depth parallax on background scene + perspective overlay
      const onMouseMove = (e) => {
        const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
        gsap.to(q('.op-scene'), { x: -nx * 30, y: -ny * 18, duration: 1.8, ease: 'power2.out' });
        gsap.to(overlay.svg, { x: -nx * 30, y: -ny * 18, duration: 1.8, ease: 'power2.out' });
      };
      addEventListener('mousemove', onMouseMove);
      cleanups.push(() => removeEventListener('mousemove', onMouseMove));

      gsap.set(root, { autoAlpha: 1 });
      gsap.fromTo(q('.op-prompt').children, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 1.1, ease: 'expo.out', delay: 0.3 });
      gsap.fromTo([q('.op-meter'), q('.op-skip')], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, delay: 0.9 });

      const cursor = q('.op-cursor');
      const cxQ = gsap.quickTo(cursor, 'x', { duration: 0.2, ease: 'power3' });
      const cyQ = gsap.quickTo(cursor, 'y', { duration: 0.2, ease: 'power3' });
      const r = Math.max(fog.width, fog.height) * 0.06;
      const pos = (e) => ({ x: e.clientX * k, y: e.clientY * k });
      let last = null, lastCheck = 0, wiped = false;

      const move = (e) => {
        cxQ(e.clientX); cyQ(e.clientY);
        if (!wiped) gsap.set(cursor, { autoAlpha: 1 });
        if (wiped || !last) return;
        const p = pos(e); wipe(fx, last, p, r); last = p;
        const now = performance.now();
        if (now - lastCheck > 250) {
          lastCheck = now;
          const f = clearedFraction(fx);
          gsap.to(q('.op-meter i'), { scaleX: Math.min(1, f / 0.4), duration: 0.3 });
          if (f > 0.4) finishWipe();
        }
      };
      const down = (e) => {
        if (wiped || e.target.closest('button')) return;
        last = pos(e); wipe(fx, last, last, r); root.classList.add('is-wiping');
      };
      const up = () => { last = null; root.classList.remove('is-wiping'); };
      root.addEventListener('pointerdown', down);
      addEventListener('pointermove', move);
      addEventListener('pointerup', up);
      cleanups.push(() => {
        root.removeEventListener('pointerdown', down);
        removeEventListener('pointermove', move);
        removeEventListener('pointerup', up);
      });
      q('.op-skip').onclick = () => finishWipe();

      function finishWipe() {
        if (wiped || cancelled) return;
        wiped = true; up(); sound('whoosh');
        gsap.timeline()
          .to(fog, { autoAlpha: 0, duration: 1.0, ease: 'power2.out' })
          .to([q('.op-prompt'), q('.op-meter'), q('.op-skip'), cursor], { autoAlpha: 0, duration: 0.4 }, 0)
          .add(() => {
            // Start building the sacred geometry lines ONLY when the fog is completely wiped!
            overlay.startFlow();
          })
          .add(() => stamps.award('window', () => sound('stamp')).then(showStartBtn), 1.8);
      }

      function showStartBtn() {
        if (cancelled) return;
        const btn = q('.op-start-btn');
        gsap.fromTo(btn, { autoAlpha: 0, y: 40, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1, ease: 'expo.out' });
        btn.onclick = () => {
          gsap.to(btn, { autoAlpha: 0, y: -24, duration: 0.5, ease: 'power2.in' });
          gsap.to(overlay.svg, { autoAlpha: 0, duration: 0.6, ease: 'power2.in' });
          setTimeout(ticketPhase, 700);
        };
      }

      function ticketPhase() {
        if (cancelled) return;
        root.classList.add('ticket-phase'); // restore cursor for clicking
        const tc = ticketCanvas(false);
        const url = tc.toDataURL('image/jpeg', 0.9);
        const tear = tearPaths();
        const L = q('.op-half--l'), R = q('.op-half--r'), card = q('.op-card');
        L.style.backgroundImage = R.style.backgroundImage = 'url(' + url + ')';
        L.style.backgroundSize = R.style.backgroundSize = '100% 100%';
        L.style.clipPath = tear.l; R.style.clipPath = tear.r;
        gsap.set(q('.op-gate'), { autoAlpha: 0 });

        gsap.timeline()
          .to(q('.op-scrim'), { autoAlpha: 1, duration: 1 }, 0)
          .fromTo(card, { y: -80, rotate: -8, autoAlpha: 0 }, { y: 0, rotate: -1.5, autoAlpha: 1, duration: 1.3, ease: 'expo.out' }, 0)
          .fromTo(q('.op-headline'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.5)
          .fromTo(q('.op-stamp-hint'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.9);

        let stamping = false;
        card.style.cursor = 'pointer';
        const onStampClick = () => {
          if (stamping) return; stamping = true;
          card.style.cursor = 'default';
          card.removeEventListener('click', onStampClick);
          sound('punch'); post.pulse(0.025);
          gsap.timeline()
            .to(card, { y: 14, scale: 0.97, duration: 0.1, ease: 'power2.in' })
            .to(card, { y: 0, scale: 1, duration: 0.35, ease: 'elastic.out(1,0.5)' })
            .add(() => {
              const su = ticketCanvas(true).toDataURL('image/jpeg', 0.9);
              L.style.backgroundImage = R.style.backgroundImage = 'url(' + su + ')';
            }, 0.1)
            .add(() => sound('stamp'), 0.12)
            .add(stampedDone, 0.6);
        };
        card.addEventListener('click', onStampClick);

        function stampedDone() {
          gsap.to(q('.op-stamp-hint'), { autoAlpha: 0, duration: 0.3 });
          gsap.timeline({ delay: 0.5 })
            .add(() => sound('tear'), 0)
            .to(L, { xPercent: -30, yPercent: 10, rotate: -15, autoAlpha: 0, duration: 1.3, ease: 'power3.in' }, 0)
            .to(R, { xPercent: 30, yPercent: 14, rotate: 17, autoAlpha: 0, duration: 1.3, ease: 'power3.in' }, 0)
            .to(q('.op-headline'), { autoAlpha: 0, y: -18, duration: 0.5 }, 0)
            .fromTo(q('.op-ride'), { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 1, ease: 'expo.out' }, 0.9)
            .add(() => stamps.award('ticket', () => sound('stamp')), 1.0)
            .add(() => { cleanups.forEach((f) => f()); resolve(); }, 3.0)
            .to(root, { autoAlpha: 0, duration: 1.2, ease: 'power2.in' }, 3.0);
        }
      }
    });
  });

  return {
    done,
    cancel() { cancelled = true; cleanups.forEach((f) => f()); },
  };
}
