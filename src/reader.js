// Reader / Print Edition: builds semantic HTML for the index and each destination.
// Content is real HTML, never drawn inside a canvas.
// Anything missing from the data shows as a visible [[PLACEHOLDER]].

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const PILLARS = [
  { key: 'past', n: '01', label: 'The Past', pillar: 'Attractions & History' },
  { key: 'table', n: '02', label: 'The Table', pillar: 'Food & Cuisine' },
  { key: 'calendar', n: '03', label: 'The Calendar', pillar: 'Festivals' },
  { key: 'fieldNotes', n: '04', label: 'Field Notes', pillar: 'Tips, Budget & Safety' },
];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const has = (v) => typeof v === 'string' && v.trim().length > 0;
const ph = (label) => `<mark class="ph">[[PLACEHOLDER]] ${esc(label)}</mark>`;
const text = (v, label) => (has(v) ? esc(v) : ph(label));
const paras = (v, label) => (has(v) ? v.split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join('') : `<p>${ph(label)}</p>`);

const header = () => `
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <a class="wordmark" href="/" data-link>WanderWords</a>
    <nav class="site-nav" aria-label="Primary"><a href="/read" data-link>Index</a><a href="/" data-link>Immersive</a></nav>
  </header>`;

function photoHtml(d) {
  const p = d.photo || {};
  const caption = has(p.credit) ? esc(p.credit) : ph('Photo credit, source and licence');
  const body = has(p.src)
    ? `<img class="plate__frame" src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy" width="1600" height="2000">`
    : `<div class="plate__frame" role="img" aria-label="${esc(p.alt)}">${ph('Photograph needed: ' + (p.alt || d.name))}</div>`;
  return `<figure class="plate">${body}<figcaption>${caption}</figcaption></figure>`;
}

function dispatchExtras(key, x) {
  if (key === 'past') {
    return `<blockquote class="pull"><p>${text(x.pullQuote, 'Pull-quote')}</p></blockquote>`;
  }
  if (key === 'table') {
    const dishes = (x.dishes || []).filter(has);
    return `<h3 class="kicker">Dishes to look for</h3>` + (dishes.length
      ? `<ul class="list">${dishes.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
      : `<p>${ph('Dishes')}</p>`);
  }
  if (key === 'calendar') {
    const fs = (x.festivals || []).filter((f) => has(f.name));
    return `<h3 class="kicker">Festivals</h3>` + (fs.length
      ? `<ul class="list">${fs.map((f) => `<li><strong>${esc(f.name)}</strong> <span class="list__meta">${text(f.when, 'When')}</span><br>${text(f.note, 'Note')}</li>`).join('')}</ul>`
      : `<p>${ph('Festivals with names and dates')}</p>`);
  }
  if (key === 'fieldNotes') {
    const b = x.budgetPerDay || {};
    const budgetLabel = 'Budget in INR, with last-checked date';
    const safety = (x.safety || []).filter(has);
    return `<dl class="facts">
      <dt>Best time</dt><dd>${text(x.bestTime, 'Best time to visit')}</dd>
      <dt>Daily budget</dt><dd><ul>
        <li>Shoestring: ${text(b.shoestring, budgetLabel)}</li>
        <li>Mid-range: ${text(b.mid, budgetLabel)}</li>
        <li>Comfort: ${text(b.comfort, budgetLabel)}</li>
      </ul></dd>
      <dt>Safety</dt><dd>${safety.length ? `<ul>${safety.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ph('Verified safety points')}</dd>
      <dt>Getting there</dt><dd>${text(x.gettingThere, 'How to get there')}</dd>
    </dl>`;
  }
  return '';
}

function dispatchHtml(d, p) {
  const x = (d.dispatches && d.dispatches[p.key]) || {};
  return `<section class="dispatch" aria-labelledby="h-${p.key}">
    <p class="kicker">Dispatch ${p.n} · ${esc(p.pillar)}</p>
    <h2 id="h-${p.key}">${esc(p.label)}</h2>
    <p class="dispatch-title">${text(x.title, 'Dispatch title')}</p>
    <div class="prose">${paras(x.body, 'Body copy, 120 to 200 words')}</div>
    ${dispatchExtras(p.key, x)}
  </section>`;
}

export function destinationPage(all, i) {
  const d = all[i];
  const prev = all[i - 1], next = all[i + 1];
  const seo = d.seo || {};
  const html = `${header()}
  <main id="main" tabindex="-1">
    <article>
      <header>
        <p class="kicker">Chapter ${ROMAN[d.chapter]} · ${esc(d.region)}</p>
        <h1 class="display" tabindex="-1">${esc(d.name)}</h1>
        <p class="hour"><span class="hour__label">The hour</span><time datetime="${esc(d.hour)}">${esc(d.hour)}</time></p>
      </header>
      ${photoHtml(d)}
      ${PILLARS.map((p) => dispatchHtml(d, p)).join('')}
      ${d.contentStatus === 'carried-over-unverified' ? `<p class="credit-note">${ph('Facts in this chapter are carried over from an earlier draft and not yet verified')}</p>` : ''}
    </article>
    <nav class="chapter-nav" aria-label="Chapters">
      ${prev ? `<a href="/destinations/${prev.slug}" data-link rel="prev">← ${esc(prev.name)}</a>` : '<span></span>'}
      ${next ? `<a href="/destinations/${next.slug}" data-link rel="next">${esc(next.name)} →</a>` : '<span></span>'}
    </nav>
  </main>`;
  return {
    html,
    accent: d.accent,
    title: has(seo.title) ? seo.title : `${d.name} at ${d.hour} · WanderWords`,
    description: has(seo.description) ? seo.description : `${d.name}, ${d.region}: attractions and history, local food, festivals, and travel tips.`,
  };
}

export function indexPage(all) {
  const html = `${header()}
  <main id="main" tabindex="-1">
    <p class="kicker">WanderWords presents</p>
    <h1 class="display" tabindex="-1">Every place has one hour</h1>
    <p class="lede">WanderWords is a magazine of ten hours. Each chapter covers a place's history, its food, its festivals, and the practical notes for going.</p>
    <ol class="contents" aria-label="Chapters">
      ${all.map((d) => `<li><a href="/destinations/${d.slug}" data-link>
        <span class="contents__no">${String(d.chapter).padStart(2, '0')}</span>
        <span class="contents__name">${esc(d.name)}<span class="contents__region">${esc(d.region)}</span></span>
        <span class="contents__hour">${esc(d.hour)}</span>
      </a></li>`).join('')}
    </ol>
  </main>`;
  return {
    html,
    accent: null,
    title: 'WanderWords · Every place has one hour',
    description: 'A travel magazine of ten hours: Srinagar, Manali, Amritsar, Jaipur, Agra, Goa, Munnar, Gangtok, Rann of Kutch and Shillong.',
  };
}

export function notFoundPage() {
  return {
    html: `${header()}<main id="main" tabindex="-1"><h1 class="display" tabindex="-1">Not found</h1><p class="lede"><a href="/" data-link>Back to the index</a></p></main>`,
    accent: null,
    title: 'Not found · WanderWords',
    description: 'This page does not exist.',
  };
}
