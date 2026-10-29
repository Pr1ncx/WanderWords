// The HTML of one destination page. Pure function: chapter data in, markup out.
// Clean editorial architecture with polaroid snapshot spreads across all 10 stops.
import { pad } from '../ui.js';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// data-ph makes the global error handler swap in a painted placeholder if the file is missing
const img = (src, alt, accent, cls = '', extra = '') =>
  `<img class="${cls}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" data-ph="${esc(alt)}" data-accent="${esc(accent)}" ${extra}>`;

const ph = (label) => `<mark class="ph">[[PLACEHOLDER]] ${esc(label)}</mark>`;

const heading = (id, no, title) =>
  `<h2 id="${id}" class="ed-h" data-reveal><span class="ed-no">${no}</span>${title}</h2>`;

const POLAROID_ROTATIONS = [-2.8, 3.2, -2.2, 2.7, -3.5, 2.4];
const POLAROID_UPS = [-8, 6, -6, 8, -7, 6];

export function polaroid(src, alt, caption, accent, k = 0, extra = '', innerCls = '', desc = '') {
  const rot = POLAROID_ROTATIONS[k % POLAROID_ROTATIONS.length];
  const up = POLAROID_UPS[k % POLAROID_UPS.length];
  const tapeRot = k % 2 === 0 ? -1.8 : 2.2;
  return `
    <figure class="ed-polaroid ${innerCls}" style="--polaroid-rot: ${rot}deg; --polaroid-up: ${up}px; --tape-rot: ${tapeRot}deg;" data-polaroid data-modal-src="${esc(src)}" data-modal-title="${esc(alt)}" data-modal-caption="${esc(caption || alt)}" data-modal-desc="${esc(desc)}" role="button" tabindex="0" aria-label="View ${esc(alt)}">
      <span class="ed-polaroid__tape" aria-hidden="true"></span>
      <div class="ed-polaroid__photo">
        <span class="ed-crop-corner ed-crop-tl" aria-hidden="true"></span>
        <span class="ed-crop-corner ed-crop-tr" aria-hidden="true"></span>
        <span class="ed-crop-corner ed-crop-bl" aria-hidden="true"></span>
        <span class="ed-crop-corner ed-crop-br" aria-hidden="true"></span>
        <span class="ed-shutter-curtain" aria-hidden="true" style="--curtain-accent: ${esc(accent)};"></span>
        ${img(src, alt, accent, 'ed-polaroid__img', extra)}
      </div>
      <figcaption class="ed-polaroid__caption" title="${esc(caption || alt)}">
        <span class="ed-polaroid__fig-num">FIG. ${pad(k + 1)}</span>
        <span class="ed-polaroid__fig-title">${esc(caption || alt)}</span>
      </figcaption>
    </figure>`;
}

// Helper to wrap text into staggered fluid character segments
export function splitCharMarkup(str) {
  return Array.from(str).map((ch) => {
    if (ch === ' ') return '<span class="ed-char-space">&nbsp;</span>';
    return `<span class="ed-char-segment"><span class="ed-char-glyph">${esc(ch)}</span></span>`;
  }).join('');
}

// All 10 stops use the editorial spreads layout with polaroids
export const SCROLL_TECHNIQUES = {
  srinagar: { mode: 'spreads', num: '01', title: 'Dal Lake Drift' },
  manali: { mode: 'spreads', num: '02', title: 'The Cedar Lodge' },
  amritsar: { mode: 'spreads', num: '03', title: 'The Golden Pool' },
  jaipur: { mode: 'spreads', num: '04', title: 'The Rose City' },
  agra: { mode: 'spreads', num: '05', title: 'Marble Monuments' },
  goa: { mode: 'spreads', num: '06', title: 'The Konkan Coast' },
  munnar: { mode: 'spreads', num: '07', title: 'The Tea Hills' },
  gangtok: { mode: 'spreads', num: '08', title: 'The Cloud Monasteries' },
  kutch: { mode: 'spreads', num: '09', title: 'The White Desert' },
  shillong: { mode: 'spreads', num: '10', title: 'The Rain Forest' },
};

export const STOP_SCROLL_MODES = Object.fromEntries(
  Object.entries(SCROLL_TECHNIQUES).map(([k, v]) => [k, v.mode])
);

const DESTINATION_FESTIVALS = {
  srinagar: [
    { name: 'Tulip Festival', season: 'April · Spring Bloom', note: 'Over a million tulips erupt into colour across Indira Gandhi Memorial Garden beneath the Zabarwan range.' },
    { name: 'Shikara Festival', season: 'July · Midsummer', note: 'Illuminated wooden boats compete in synchronised races and dragon dances across Dal Lake.' },
    { name: 'Saffron Harvest', season: 'October · Autumn', note: 'Pampore’s fields turn purple as purple crocus blossoms are picked by hand for world-renowned saffron.' },
  ],
  manali: [
    { name: 'Winter Carnival', season: 'January · Snow Season', note: 'Folk dances, ski competitions and Kullu music performances fill the Mall Road in sub-zero snow.' },
    { name: 'Hadimba Fair', season: 'May · Cedar Spring', note: 'Villagers bring wooden brass palanquins through ancient deodar pine forests to honour Goddess Hadimba.' },
    { name: 'Kullu Dussehra', season: 'October · Valley Grandeur', note: 'Over 200 local hill deities assemble in royal procession in the neighbouring valley.' },
  ],
  amritsar: [
    { name: 'Baisakhi Harvest', season: 'April · Punjabi New Year', note: 'Bhangra processions and celebratory feasts mark the founding of the Khalsa around the Golden Temple.' },
    { name: 'Diwali & Bandi Chhor', season: 'Oct/Nov · Festival of Lights', note: '100,000 oil lamps float upon the sacred Amrit Sarovar as fireworks reflect off gold leaf.' },
    { name: 'Guru Nanak Gurpurab', season: 'November · Full Moon', note: 'Three-day continuous readings and massive night langar kitchens feed pilgrims without distinction.' },
  ],
  jaipur: [
    { name: 'Teej Procession', season: 'August · Monsoon Welcoming', note: 'Gilded royal palanquins carrying Goddess Parvati wind through the pink terracotta bazaars.' },
    { name: 'Jaipur Lit Fest', season: 'January · Winter Cultural', note: 'The world’s largest free literary festival convenes novelists and philosophers under marquee tents.' },
    { name: 'Gangaur', season: 'March/April · Spring Rite', note: 'Women balance brass pots of sprouted barley in vibrant lehengas to celebrate marital devotion.' },
  ],
  agra: [
    { name: 'Taj Mahotsav', season: 'February · Mughal Heritage', note: 'A 10-day carnival of artisan crafts, classical ghazals and Mughal court cuisine near the East Gate.' },
    { name: 'Ram Barat', season: 'September · Royal Wedding', note: 'One of northern India’s largest street pageants recreating the royal marriage with illuminated chariots.' },
    { name: 'Bateshwar Cattle Fair', season: 'November · Yamuna Banks', note: 'Over 100 white Shiva temples host camel traders, sadhus and holy immersions on Kartik Purnima.' },
  ],
  goa: [
    { name: 'Goa Carnival', season: 'Feb/Mar · Pre-Lent Extravaganza', note: 'King Momo commands four days of brass bands, paper-mâché floats and coastal masked revelry.' },
    { name: 'Sao Joao Water Feast', season: 'June · Monsoon Leap', note: 'Villagers crown themselves with wild palm coronets and leap into overflowing garden wells.' },
    { name: 'Shigmo Spring Festival', season: 'March · Konkan Tradition', note: 'Traditional Konkani dancers reenact warrior epics with enormous gold umbrellas and dhol drums.' },
  ],
  munnar: [
    { name: 'Neelakurinji Blossom', season: '12-Year Cycle · Highlands', note: 'The entire Western Ghats turn lavender-blue as rare Strobilanthes blooms carpet tea peaks.' },
    { name: 'Onam Harvest', season: 'Aug/Sept · Kerala Homecoming', note: 'Intricate pookkalam floral carpets grace homesteads with traditional Sadya banquets on banana leaves.' },
    { name: 'Vishu Spring Equinox', season: 'April · New Dawn', note: 'Families awake to golden cucumber, silver coins and yellow kani flowers for auspicious beginnings.' },
  ],
  gangtok: [
    { name: 'Losar Tibetan New Year', season: 'February · Himalayan Winter', note: 'Cham masked dances by lamas at Rumtek Monastery ward off evil spirits for the lunar cycle.' },
    { name: 'International Flower Fair', season: 'May · Orchid Season', note: 'Over 600 indigenous Himalayan orchid and rhododendron varieties blanket the Ridge Park.' },
    { name: 'Pang Lhabsol', season: 'September · Mountain Vow', note: 'Warrior dances honour Mount Kanchenjunga as the divine protector of the Sikkimese kingdom.' },
  ],
  kutch: [
    { name: 'Rann Utsav', season: 'Nov–Feb · Full Moon Desert', note: 'A white salt desert transforms into an encampment of Kutchi embroidery, campfire poetry and camel rides.' },
    { name: 'International Kite Fest', season: 'January · Uttarayan', note: 'Kite masters from across the globe fill the cobalt skies above the Great Rann with giant windsocks.' },
    { name: 'Navratri Garba Nights', season: 'October · Nine Sacred Nights', note: 'Concentric circles of thousands dance with mirror-work chaniya cholis to hypnotic rhythm.' },
  ],
  shillong: [
    { name: 'Cherry Blossom Fest', season: 'November · Pink Autumn', note: 'Himalayan cherry trees turn Shillong pastel pink while indie bands perform on Ward’s Lake shores.' },
    { name: 'Nongkrem Dance', season: 'November · Khasi Harvest', note: 'Pomblang ceremonies by the Syiem of Hima Khyrim give thanks for prosperous hill harvests.' },
    { name: 'Autumn Festival', season: 'October · Umiam Lakeside', note: 'Food carnivals, bamboo archery, and traditional Khasi string musicians celebrate lakeside autumn.' },
  ],
};
export const DESTINATION_POSTAL = {
  srinagar: {
    coords: '34.0837° N, 74.7973° E',
    elevation: '1,585 M',
    regionCode: 'IND-JK-01',
    basin: 'Jhelum Valley Basin',
    airfield: 'SXR / SHEIKH UL-ALAM',
    note: 'Shikara morning mooring permit cleared. Dal Lake water calm at 11°C.',
  },
  manali: {
    coords: '32.2432° N, 77.1892° E',
    elevation: '2,050 M',
    regionCode: 'IND-HP-02',
    basin: 'Beas Gorge Foothills',
    airfield: 'KUU / BHUNTAR PASS',
    note: 'Deodar pine canopy damp from overnight frost. Woodstove lit at 17:00.',
  },
  amritsar: {
    coords: '31.6340° N, 74.8723° E',
    elevation: '234 M',
    regionCode: 'IND-PB-03',
    basin: 'Bari Doab Alluvium',
    airfield: 'ATQ / GURU RAM DASS',
    note: 'Sacred pool marble parikrama washed before sunrise. Continuous langar boiling.',
  },
  jaipur: {
    coords: '26.9124° N, 75.7873° E',
    elevation: '431 M',
    regionCode: 'IND-RJ-04',
    basin: 'Dhundhar Desert Plain',
    airfield: 'JAI / SANGANER GATE',
    note: 'Pink terracotta wash fresh on Johari Bazaar facades. Natural indigo mordants dry.',
  },
  agra: {
    coords: '27.1767° N, 78.0081° E',
    elevation: '171 M',
    regionCode: 'IND-UP-05',
    basin: 'Yamuna River Terrace',
    airfield: 'AGR / KHERIA POST',
    note: 'Pietra dura lapidary check verified. Morning Yamuna mist reflecting off dome.',
  },
  goa: {
    coords: '15.2993° N, 74.1240° E',
    elevation: '14 M',
    regionCode: 'IND-GA-06',
    basin: 'Mandovi Estuary',
    airfield: 'GOI / DABOLIM SHORE',
    note: 'Laterite stone salty from high tide. Spring cashew pot distillation underway.',
  },
  munnar: {
    coords: '10.0889° N, 77.0595° E',
    elevation: '1,532 M',
    regionCode: 'IND-KL-07',
    basin: 'Muthirapuzha Range',
    airfield: 'COK / NEDUMBASSERY',
    note: 'Mountain shola mist descends at 14:30. Second tea pekoe flush harvested.',
  },
  gangtok: {
    coords: '27.3389° N, 88.6065° E',
    elevation: '1,650 M',
    regionCode: 'IND-SK-08',
    basin: 'Teesta Mountain Basin',
    airfield: 'PYG / PAKYONG RIDGE',
    note: 'Kanchenjunga snow ridge visible at 06:15. Enchey copper prayer wheels spinning.',
  },
  kutch: {
    coords: '23.7337° N, 69.8597° E',
    elevation: '12 M',
    regionCode: 'IND-GJ-09',
    basin: 'Great Salt Marsh Basin',
    airfield: 'BHJ / RUDRA MATA',
    note: 'Full moon salt crust crystallized across white horizon. Ajrakh mud-resist drying.',
  },
  shillong: {
    coords: '25.5788° N, 91.8933° E',
    elevation: '1,525 M',
    regionCode: 'IND-ML-10',
    basin: 'Khasi Rain Plateau',
    airfield: 'SHL / UMROI PLATEAU',
    note: 'Torrential canyon runoff steady. Pine needles wet along red clay forest trail.',
  },
};

// Collect & Contrast Archival Coffee Table Book Components
export function cmykBar(code = 'IND-2026', accent = '#E08E2B') {
  return `
  <div class="ed-cmyk-bar" aria-hidden="true">
    <div class="ed-cmyk-boxes">
      <span class="cmyk-box cmyk-c" title="Cyan (Process Blue)"></span>
      <span class="cmyk-box cmyk-m" title="Magenta (Process Red)"></span>
      <span class="cmyk-box cmyk-y" title="Yellow (Process Yellow)"></span>
      <span class="cmyk-box cmyk-k" title="Key (Process Black)"></span>
      <span class="cmyk-box cmyk-spot" style="background:${esc(accent)}" title="Spot Accent"></span>
    </div>
    <span class="cmyk-reg">⊕ REG: ${esc(code)} · 300 DPI OFFSET</span>
  </div>`;
}

export function folioGutter() {
  return '';
}

function renderAttractions(ch, places, i, postal) {
  const isSrinagar = ch.id === 'srinagar';
  return `
  <section class="ed-sec ed-places ${isSrinagar ? 'ed-places--gehry' : ''}" data-section="places" id="ed-sec-places" data-scroll-mode="spreads" aria-labelledby="ed-places-h">
    ${isSrinagar ? '<div class="readMore__noise" aria-hidden="true"></div>' : ''}
    <div class="ed-grid">
      ${heading('ed-places-h', '01', 'Visual Anthology & Exhibits')}
    </div>
    <div class="ed-grid">
      <ol class="ed-spreads">
        ${places.map((e, k) => {
          const layout = k % 2 === 0 ? 'a' : 'b';
          return `
        <li class="ed-spread ed-spread--${layout}" data-reveal>
          <div class="ed-spread__img">
            ${polaroid(e.src, e.title, e.title, ch.accent, k, '', 'ed-polaroid--interactive', e.text)}
          </div>
          <div class="ed-spread__text">
            <h3>${esc(e.title)}</h3>
            <p class="ed-body">${esc(e.text)}</p>
          </div>
        </li>`;
        }).join('')}
      </ol>
    </div>
  </section>`;
}

export function renderEditorial(ch, i, chapters) {
  const isSrinagar = ch.id === 'srinagar';
  const postal = DESTINATION_POSTAL[ch.id] || DESTINATION_POSTAL.srinagar;
  const a = ch.article;
  const next = chapters[i + 1];
  const dishes = a.tips.eat.split(',').map((s) => s.trim()).filter(Boolean);
  const places = ch.exhibits.slice(1).map((e) => ({ ...e, src: e.type === 'video' ? ch.coverImg : e.src }));
  const scrollMode = STOP_SCROLL_MODES[ch.id] || 'spreads';
  const festivals = DESTINATION_FESTIVALS[ch.id] || [
    { name: `${ch.name} Cultural Season`, season: 'Seasonal Highlight', note: `Centuries-old folk music, culinary feasts and artisan crafts celebrating the unique landscape of ${ch.name}.` },
    { name: 'Artisan Heritage Days', season: 'Annual Tradition', note: `Master craftsmen and generational guilds open their workshops to visitors across the historic quarters.` },
    { name: 'Harvest & Solstice Gathering', season: 'Equinox Gathering', note: `Community dances and temple bells welcome the changing seasons with traditional regional banquets.` }
  ];
  const srinagarHeroFrames = {
    base: '/media/srinagar/hero-frames/frame_',
    ext: '.webp',
    count: 320,
    pad: 4,
  };
  const srinagarHeroFirst = `${srinagarHeroFrames.base}${String(1).padStart(srinagarHeroFrames.pad, '0')}${srinagarHeroFrames.ext}`;

  if (isSrinagar) {
    return `
    <div class="ed-progress" aria-hidden="true"><i class="ed-progress__bar"></i></div>
    <article class="ed" data-chapter="srinagar" data-scroll-mode="spreads" aria-label="${esc(ch.name)}">
      <!-- Section 1: Hero Frame Sequence Track -->
      <div class="ed-hero-track" id="ed-hero-track">
        <header class="ed-hero ed-hero--sequence" data-section="hero" id="ed-sec-hero">
          <div class="ed-hero__frame" data-hero-frame>
            <canvas
              class="ed-hero__canvas"
              id="ed-hero-canvas"
              width="1280"
              height="720"
              data-hero-canvas
              data-frame-base="${esc(srinagarHeroFrames.base)}"
              data-frame-ext="${esc(srinagarHeroFrames.ext)}"
              data-frame-count="${srinagarHeroFrames.count}"
              data-frame-pad="${srinagarHeroFrames.pad}"
            ></canvas>
            <div class="ed-hero__shade" aria-hidden="true"></div>
          </div>
        </header>
      </div>

      <!-- Section 2: Next Section with Gehry Editorial Hero, TitleStretch & Sub-Headline Description -->
      <section class="ed-next-section stretch-outer titleStretch" id="ed-sec-intro" aria-label="Srinagar">
        <div class="stretch-inner titleStretch__inner">
          <header class="editorialHero">
            <div class="editorialHero__titleContainer">
              <h1 class="hidden" style="display:none;">Srinagar</h1>
              <div class="stretch-content titleStretch__content">
                <svg viewBox="0 0 1500 340" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-label="Srinagar">
                  <text x="0" y="250" text-anchor="start" fill="#0E0C0A" font-family="'SharpGroteskBlack', 'Sharp Grotesk', system-ui, sans-serif" font-weight="600" font-size="240" letter-spacing="0.02em">SRINAGAR</text>
                </svg>
              </div>
            </div>

            <!-- Lower Stage: 3D Realism Houseboat Cutout (Left) & Narrative Description (Right) -->
            <div class="editorialHero__lowerStage">
              <div class="editorialHero__cutoutCol" data-reveal>
                <div class="ed-houseboat-poster ed-polaroid--interactive"
                  data-modal-src="/media/srinagar/houseboat_cutout.webp"
                  data-modal-title="Dal Lake Luxury Cedar Houseboat"
                  data-modal-caption="FIG. 02 · CEDAR HOUSEBOAT ARCHIVE / DAL LAKE · 1,585M"
                  data-modal-desc="Hand-crafted from fragrant Himalayan deodar cedar with ornate Khatamband woodwork ceilings and Pinjrakari lattice balconies, moored along Dal and Nigeen lakes. Each vessel serves as an architectural sanctuary lived upon reflections."
                  role="button"
                  tabindex="0"
                  aria-label="View Dal Lake Luxury Cedar Houseboat"
                >
                  <div class="ed-houseboat-badge">
                    <span class="ed-houseboat-badge__dot"></span>
                    <span class="ed-houseboat-badge__text">FIG. 02 · CEDAR HOUSEBOAT ARCHIVE</span>
                    <span class="ed-houseboat-badge__sep">/</span>
                    <span class="ed-houseboat-badge__loc">DAL LAKE · 1,585M</span>
                  </div>
                  <div class="ed-houseboat-frame">
                    <img
                      class="ed-houseboat-img"
                      src="/media/srinagar/houseboat_cutout.webp"
                      alt="Dal Lake Luxury Cedar Houseboat 3D Cutout"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                  <div class="ed-houseboat-caption">
                    <span class="ed-houseboat-caption__tag">SPECIFICATION</span>
                    <p class="ed-houseboat-caption__desc">Himalayan fragrant deodar hull with hand-carved Khatamband ceilings &amp; Pinjrakari lattice balcony.</p>
                  </div>
                </div>
              </div>

              <p class="editorialHero__description heading1Text">
                Srinagar is a city of water and gardens, cradled by the Himalaya in the Kashmir Valley. Days here move at the pace of a paddle. Shikaras glide across still morning water as mist rises off Dal Lake, where carved cedar houseboats and floating markets shape a world lived entirely upon the surface of reflections.
              </p>
            </div>
          </header>
        </div>
      </section>

      <!-- Section 3: Attractions (The Spreads) -->
      ${renderAttractions(ch, places, i, postal)}

      <!-- Section 5: Local Food -->
      <section class="ed-grid ed-sec ed-food" data-section="food" id="ed-sec-food" aria-labelledby="ed-food-h">
        ${heading('ed-food-h', '02', 'Culinary Provenance & Tasting')}
        <div class="ed-food__fig">
          <span class="ed-food__block" aria-hidden="true"></span>
          <div class="ed-food__img">
            ${polaroid(a.sections[1].img, a.sections[1].title, a.sections[1].title, ch.accent, 4, 'data-parallax="9"', 'ed-polaroid--interactive', a.sections[1].text)}
          </div>
        </div>
        <div class="ed-food__text">
          <h3 class="ed-h3">${esc(a.sections[1].title)}</h3>
          <p class="ed-body">${esc(a.sections[1].text)}</p>
          <div class="ed-food__specimen-block">
            <span class="ed-specimen-label">GASTRONOMIC SPECIMENS & DISHES</span>
            <ul class="ed-tags" aria-label="Dishes to look for">
              ${dishes.map((d) => `<li class="ed-specimen-tag"><span class="ed-specimen-bullet">▪</span> ${esc(d)}</li>`).join('')}
            </ul>
          </div>
        </div>
      </section>

      <!-- Section 6: Festivals & Living Traditions -->
      <section class="ed-sec ed-fest" data-section="fest" id="ed-sec-fest" aria-labelledby="ed-fest-h">
        <div class="ed-grid">
          ${heading('ed-fest-h', '03', 'Festivals & Living Traditions')}
        </div>
        <div class="ed-grid">
          <div class="ed-fest__grid">
            ${festivals.map((fest, idx) => `
            <article class="ed-fest__card" data-reveal>
              <div class="ed-fest__card-head">
                <span class="ed-fest__num" data-scramble>${pad(idx + 1)}</span>
                <span class="ed-fest__plate-tag">FOLK ARCHIVE PLATE ${pad(idx + 1)}</span>
              </div>
              <header class="ed-fest__head">
                <span class="ed-fest__season">${esc(fest.season)}</span>
                <h3 class="ed-fest__title">${esc(fest.name)}</h3>
              </header>
              <p class="ed-fest__desc">${esc(fest.note)}</p>
              <div class="ed-fest__footer" aria-hidden="true">
                <span class="ed-fest__seal">VERIFIED CULTURAL RITE</span>
              </div>
            </article>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Section 7: Traveler's Field Guide -->
      <section class="ed-tips" data-section="tips" id="ed-sec-tips" data-drawer-stack aria-labelledby="ed-tips-h">
        <div class="ed-grid">
          ${heading('ed-tips-h', '04', 'Traveler\'s Field Guide & Logistics')}
          <div class="ed-tips__lead">
            <h3 class="ed-h3">${esc(a.sections[0].title)}</h3>
            <p class="ed-body ed-line-mask">${esc(a.sections[0].text)}</p>
          </div>
          <dl class="ed-facts" data-reveal>
            <div class="ed-fact">
              <dt><span class="ed-fact-icon">⏱</span> Best time</dt>
              <dd>${esc(a.tips.best)}</dd>
            </div>
            <div class="ed-fact">
              <dt><span class="ed-fact-icon">🚂</span> Transit & Access</dt>
              <dd>${esc(a.tips.reach)}</dd>
            </div>
            <div class="ed-fact">
              <dt><span class="ed-fact-icon">⛺</span> Lodging & Stay</dt>
              <dd>${esc(a.tips.stay)}</dd>
            </div>
            <div class="ed-fact">
              <dt><span class="ed-fact-icon">☕</span> Local Flavours</dt>
              <dd>${esc(a.tips.eat)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- Section 8: Next Stop Departure Voucher -->
      <footer class="ed-grid ed-next" data-section="next" id="ed-sec-next">
        <div class="ed-next__ticket-wrap">
          <button class="ed-next__btn" type="button" data-next-stop>
            <div class="ed-next__voucher-meta" aria-hidden="true">
              <span>INDIAN RAILWAYS PASSENGER VOUCHER</span>
              <span>DEPARTURE PLATFORM 01</span>
            </div>
            <span class="ed-next__label">${next ? 'CONTINUE EXPEDITION' : 'FINAL DESTINATION REACHED'}</span>
            <strong class="ed-next__name">${next ? `${esc(next.name)} <span class="ed-next__arrow" aria-hidden="true">&rarr;</span>` : 'Complete the journey <span class="ed-next__arrow" aria-hidden="true">&rarr;</span>'}</strong>
          </button>
        </div>
        ${next ? `
        <aside class="ed-next__preview" aria-hidden="true" data-next-preview>
          <div class="ed-next__preview-card">
            <div class="ed-next__preview-photo">
              <img src="${esc(next.coverImg)}" alt="${esc(next.name)}" loading="lazy" />
            </div>
            <div class="ed-next__preview-info">
              <span class="ed-next__preview-sub">Next Stop ${pad(i + 2)} / ${pad(chapters.length)}</span>
              <h4 class="ed-next__preview-title">${esc(next.name)}</h4>
              <p class="ed-next__preview-tag">${esc(next.tagline)}</p>
            </div>
          </div>
        </aside>` : ''}
      </footer>
    </article>`;
  }

  return `
  <div class="ed-progress" aria-hidden="true"><i class="ed-progress__bar"></i></div>
  <article class="ed" data-chapter="${ch.id}" data-scroll-mode="${scrollMode}" aria-label="${esc(ch.name)}">
    <div class="ed-ambient-mesh" aria-hidden="true" style="--mesh-accent: ${esc(ch.accent)};"></div>
    
    <!-- Tactile Analog Paper & Risograph Grain Overlay -->
    <div class="ed-paper-grain" aria-hidden="true">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <filter id="ed-paper-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.5 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ed-paper-noise)" />
      </svg>
    </div>

    ${isSrinagar ? `
    <!-- Gehry Getty Sticky Interactive Media Stage (Srinagar Hero -> Attractions transition) -->
    <div class="chapterInteractive isStoryMode ed-gehry-interactive" aria-hidden="true" data-gehry-interactive>
      <div class="chapterInteractive__inner ed-gehry-interactive__inner">
        <div class="ed-hero__frame ed-hero__frame--gehry" data-hero-frame>
          ${img(ch.coverImg, ch.name, ch.accent, 'ed-hero__img')}
          <div class="chapterInteractive__backgroundFade" aria-hidden="true"></div>
          <div class="chapterInteractive__overlay" aria-hidden="true"></div>
          <div class="ed-hero__shade" aria-hidden="true"></div>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Section 1: Hero -->
    <header class="ed-hero ${isSrinagar ? 'ed-hero--gehry' : ''}" data-section="hero" id="ed-sec-hero" data-portal-frame>
      ${!isSrinagar ? `
      <div class="ed-hero__frame" data-hero-frame>
        ${img(ch.coverImg, ch.name, ch.accent, 'ed-hero__img')}
        <div class="ed-hero__shade" aria-hidden="true"></div>
      </div>
      ` : ''}
      <div class="ed-hero__grid">
        <div class="ed-hero__meta-top">
          <p class="ed-hero__eyebrow" data-scramble>Stop ${pad(i + 1)} / ${pad(chapters.length)} · FOLIO ${esc(postal.regionCode)}</p>
          ${cmykBar(postal.regionCode, ch.accent)}
        </div>
        <h1 class="ed-hero__title" tabindex="-1">${esc(ch.name)}</h1>
        <p class="ed-hero__tag">${esc(ch.title)}</p>
        <div class="ed-hero__coords" aria-hidden="true">
          <span>COORDINATES: ${esc(postal.coords)}</span>
          <span>AIRFIELD: ${esc(postal.airfield)}</span>
          <span>REGION: ${esc(postal.basin)}</span>
        </div>
      </div>
      <p class="ed-hero__cue" aria-hidden="true">Scroll &darr;</p>
    </header>

    <!-- Section 2: Overview (Intro) -->
    <section class="ed-grid ed-intro ${isSrinagar ? 'ed-intro--gehry' : ''}" data-section="intro" id="ed-sec-intro" aria-label="Overview">
      <p class="ed-meta"><span class="ed-meta-no">${pad(i + 1)}</span><br><strong class="ed-meta-title">${esc(ch.name)}</strong><br><em>${esc(ch.tagline)}</em></p>
      <p class="ed-lede" data-text-reveal>${esc(a.intro)}</p>
      <blockquote class="ed-pull" data-text-reveal>${esc(a.quote)}</blockquote>
    </section>

    <!-- Section 3: Attractions (The Spreads) -->
    ${renderAttractions(ch, places, i, postal)}

    <!-- Section 4: Local Food -->
    <section class="ed-grid ed-sec ed-food" data-section="food" id="ed-sec-food" aria-labelledby="ed-food-h">
      ${heading('ed-food-h', '02', 'Culinary Provenance & Tasting')}
      <div class="ed-food__fig">
        <span class="ed-food__block" aria-hidden="true"></span>
        <div class="ed-food__img">
          ${polaroid(a.sections[1].img, a.sections[1].title, a.sections[1].title, ch.accent, 4, 'data-parallax="9"', 'ed-polaroid--interactive', a.sections[1].text)}
        </div>
      </div>
      <div class="ed-food__text">
        <h3 class="ed-h3">${esc(a.sections[1].title)}</h3>
        <p class="ed-body">${esc(a.sections[1].text)}</p>
        <div class="ed-food__specimen-block">
          <span class="ed-specimen-label">GASTRONOMIC SPECIMENS & DISHES</span>
          <ul class="ed-tags" aria-label="Dishes to look for">
            ${dishes.map((d) => `<li class="ed-specimen-tag"><span class="ed-specimen-bullet">▪</span> ${esc(d)}</li>`).join('')}
          </ul>
        </div>
      </div>
    </section>

    <!-- Section 5: Festivals & Living Traditions -->
    <section class="ed-sec ed-fest" data-section="fest" id="ed-sec-fest" aria-labelledby="ed-fest-h">
      <div class="ed-grid">
        ${heading('ed-fest-h', '03', 'Festivals & Living Traditions')}
      </div>
      <div class="ed-grid">
        <div class="ed-fest__grid">
          ${festivals.map((fest, idx) => `
          <article class="ed-fest__card" data-reveal>
            <div class="ed-fest__card-head">
              <span class="ed-fest__num" data-scramble>${pad(idx + 1)}</span>
              <span class="ed-fest__plate-tag">FOLK ARCHIVE PLATE ${pad(idx + 1)}</span>
            </div>
            <header class="ed-fest__head">
              <span class="ed-fest__season">${esc(fest.season)}</span>
              <h3 class="ed-fest__title">${esc(fest.name)}</h3>
            </header>
            <p class="ed-fest__desc">${esc(fest.note)}</p>
            <div class="ed-fest__footer" aria-hidden="true">
              <span class="ed-fest__seal">VERIFIED CULTURAL RITE</span>
            </div>
          </article>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Section 6: Traveler's Field Guide -->
    <section class="ed-tips" data-section="tips" id="ed-sec-tips" data-drawer-stack aria-labelledby="ed-tips-h">
      <div class="ed-grid">
        ${heading('ed-tips-h', '04', 'Traveler\'s Field Guide & Logistics')}
        <div class="ed-tips__lead">
          <h3 class="ed-h3">${esc(a.sections[0].title)}</h3>
          <p class="ed-body ed-line-mask">${esc(a.sections[0].text)}</p>
        </div>
        <dl class="ed-facts" data-reveal>
          <div class="ed-fact">
            <dt><span class="ed-fact-icon">⏱</span> Best time</dt>
            <dd>${esc(a.tips.best)}</dd>
          </div>
          <div class="ed-fact">
            <dt><span class="ed-fact-icon">🚂</span> Transit & Access</dt>
            <dd>${esc(a.tips.reach)}</dd>
          </div>
          <div class="ed-fact">
            <dt><span class="ed-fact-icon">⛺</span> Lodging & Stay</dt>
            <dd>${esc(a.tips.stay)}</dd>
          </div>
          <div class="ed-fact">
            <dt><span class="ed-fact-icon">☕</span> Local Flavours</dt>
            <dd>${esc(a.tips.eat)}</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- Section 7: Next Stop Departure Voucher -->
    <footer class="ed-grid ed-next" data-section="next" id="ed-sec-next">
      <div class="ed-next__ticket-wrap">
        <button class="ed-next__btn" type="button" data-next-stop>
          <div class="ed-next__voucher-meta" aria-hidden="true">
            <span>INDIAN RAILWAYS PASSENGER VOUCHER</span>
            <span>DEPARTURE PLATFORM 01</span>
          </div>
          <span class="ed-next__label">${next ? 'CONTINUE EXPEDITION' : 'FINAL DESTINATION REACHED'}</span>
          <strong class="ed-next__name">${next ? `${esc(next.name)} <span class="ed-next__arrow" aria-hidden="true">&rarr;</span>` : 'Complete the journey <span class="ed-next__arrow" aria-hidden="true">&rarr;</span>'}</strong>
        </button>
      </div>
      ${next ? `
      <aside class="ed-next__preview" aria-hidden="true" data-next-preview>
        <div class="ed-next__preview-card">
          <div class="ed-next__preview-photo">
            <img src="${esc(next.coverImg)}" alt="${esc(next.name)}" loading="lazy" />
          </div>
          <div class="ed-next__preview-info">
            <span class="ed-next__preview-sub">Next Stop ${pad(i + 2)} / ${pad(chapters.length)}</span>
            <h4 class="ed-next__preview-title">${esc(next.name)}</h4>
            <p class="ed-next__preview-tag">${esc(next.tagline)}</p>
          </div>
        </div>
      </aside>` : ''}
    </footer>
  </article>`;
}
