// HTML templates for the article, lightbox and menu
export const pad = (n) => String(n).padStart(2, '0');

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// data-ph makes the global error handler swap in a painted placeholder if the file is missing
const img = (src, alt, accent, cls = '') =>
  `<img class="${cls}" src="${src}" alt="${esc(alt)}" loading="lazy" data-ph="${esc(alt)}" data-accent="${accent}">`;

const video = (src, title, accent, cls = '', controls = false) =>
  `<video class="${cls}" src="${src}" autoplay muted loop playsinline ${controls ? 'controls' : ''} data-ph="${esc(title)}" data-accent="${accent}"></video>`;

export function renderArticle(ch, i) {
  const a = ch.article, ex = ch.exhibits;
  return `
    <header class="art-hero">
      ${img(ch.coverImg, ch.name, ch.accent, 'art-hero__img')}
      <div class="art-hero__text">
        <p class="eyebrow">Chapter ${pad(i + 1)} · ${ch.name}</p>
        <h1>${ch.title}</h1>
        <p class="art-lede">${a.intro}</p>
      </div>
    </header>
    <blockquote class="art-quote">${a.quote}</blockquote>
    ${a.sections.map((s, k) => `
      <section class="art-sec ${k % 2 ? 'is-flip' : ''}">
        ${img(s.img, s.title, ch.accent)}
        <div><h2>${s.title}</h2><p>${s.text}</p></div>
      </section>`).join('')}
    <section class="art-video">
      ${video(ex[0].src, ex[0].title, ch.accent, '', true)}
      <p class="art-cap"><strong>${ex[0].title}.</strong> ${ex[0].text}</p>
    </section>
    <section class="art-grid">
      ${ex.slice(1).map((e) => `<figure>${img(e.src, e.title, ch.accent)}<figcaption><strong>${e.title}</strong> ${e.text}</figcaption></figure>`).join('')}
    </section>
    <aside class="art-tips">
      <h2>Travel notes</h2>
      <dl>
        <dt>Best time</dt><dd>${a.tips.best}</dd>
        <dt>Getting there</dt><dd>${a.tips.reach}</dd>
        <dt>Eat</dt><dd>${a.tips.eat}</dd>
        <dt>Stay</dt><dd>${a.tips.stay}</dd>
      </dl>
    </aside>`;
}

export function renderLightbox(ch, k) {
  const e = ch.exhibits[k];
  const media = e.type === 'video'
    ? video(e.src, e.title, ch.accent, 'lb-media', true)
    : img(e.src, e.title, ch.accent, 'lb-media');
  return `
    <div class="lb-stage">${media}</div>
    <div class="lb-text">
      <p class="eyebrow">${ch.name} · ${pad(k + 1)} / 05</p>
      <h2>${e.title}</h2>
      <p>${e.text}</p>
    </div>`;
}

export function renderMenu(chapters, credits) {
  const cards = chapters.map((c, k) => `
    <button class="menu-card" data-go="${k}">
      ${img(c.coverImg, c.name, c.accent)}
      <span class="menu-card__num">Chapter ${pad(k + 1)}</span>
      <strong>${c.title}</strong>
      <span>${c.name}</span>
    </button>`).join('');
  const lines = chapters.flatMap((c) => (credits[c.id] || []).map((l) => `<li><b>${c.name}</b> ${esc(l)}</li>`));
  return `
    <div class="menu-head"><p class="eyebrow">WanderWords · Issue 01</p><h2>The Journey</h2></div>
    <div class="menu-grid">${cards}</div>
    <section class="menu-credits">
      <h3>Credits</h3>
      <ul>${lines.join('') || '<li>Add your photo and video credits in <code>src/credits.js</code>.</li>'}</ul>
    </section>`;
}
