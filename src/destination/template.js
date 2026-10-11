// The HTML of one destination page. Pure function: chapter data in, markup out.
// Sections: hero, introduction (drop cap + pull quote), 01 Attractions, 02 Local Food,
// 03 Festivals, 04 Travel Tips, Next Stop. The layout rules live in src/editorial.css.
import { pad } from '../ui.js';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// data-ph makes the global error handler swap in a painted placeholder if the file is missing
const img = (src, alt, accent, cls = '', extra = '') =>
  `<img class="${cls}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" data-ph="${esc(alt)}" data-accent="${esc(accent)}" ${extra}>`;

const ph = (label) => `<mark class="ph">[[PLACEHOLDER]] ${esc(label)}</mark>`;

const heading = (id, no, title) =>
  `<h2 id="${id}" class="ed-h" data-reveal><span class="ed-no">${no}</span>${title}</h2>`;

export function renderEditorial(ch, i, chapters) {
  const a = ch.article;
  const next = chapters[i + 1];
  const dishes = a.tips.eat.split(',').map((s) => s.trim()).filter(Boolean);
  // Exhibit 0 is the hero video; the others are photos (a few cities use a video for exhibit 4: show the cover instead)
  const places = ch.exhibits.slice(1).map((e) => ({ ...e, src: e.type === 'video' ? ch.coverImg : e.src }));

  return `
  <div class="ed-progress" aria-hidden="true"><i class="ed-progress__bar"></i></div>
  <article class="ed" aria-label="${esc(ch.name)}">

    <header class="ed-hero">
      ${img(ch.coverImg, ch.name, ch.accent, 'ed-hero__img')}
      <div class="ed-hero__shade" aria-hidden="true"></div>
      <div class="ed-hero__grid">
        <p class="ed-hero__eyebrow">Stop ${pad(i + 1)} / ${pad(chapters.length)}</p>
        <h1 class="ed-hero__title" tabindex="-1">${esc(ch.name)}</h1>
        <p class="ed-hero__tag">${esc(ch.title)}</p>
      </div>
      <p class="ed-hero__cue" aria-hidden="true">Scroll</p>
    </header>

    <section class="ed-grid ed-intro" aria-label="Introduction">
      <p class="ed-meta">${pad(i + 1)}<br>${esc(ch.name)}<br><em>${esc(ch.tagline)}</em></p>
      <p class="ed-lede" data-reveal>${esc(a.intro)}</p>
      <blockquote class="ed-pull" data-reveal>${esc(a.quote)}</blockquote>
    </section>

    <section class="ed-grid ed-sec ed-places" aria-labelledby="ed-places-h">
      ${heading('ed-places-h', '01', 'Attractions')}
      <ol class="ed-spreads">
        ${places.map((e, k) => `
        <li class="ed-spread ed-spread--${k % 2 ? 'b' : 'a'}" data-reveal>
          <figure class="ed-spread__img">${img(e.src, e.title, ch.accent, '', 'data-parallax="7"')}</figure>
          <div class="ed-spread__text">
            <p class="ed-no">${pad(k + 1)}</p>
            <h3>${esc(e.title)}</h3>
            <p class="ed-body">${esc(e.text)}</p>
          </div>
        </li>`).join('')}
      </ol>
    </section>

    <section class="ed-grid ed-sec ed-food" aria-labelledby="ed-food-h">
      ${heading('ed-food-h', '02', 'Local Food')}
      <div class="ed-food__fig">
        <span class="ed-food__block" aria-hidden="true"></span>
        <figure class="ed-food__img">${img(a.sections[1].img, a.sections[1].title, ch.accent, '', 'data-parallax="9"')}</figure>
      </div>
      <div class="ed-food__text">
        <h3 class="ed-h3" data-reveal>${esc(a.sections[1].title)}</h3>
        <p class="ed-body" data-reveal>${esc(a.sections[1].text)}</p>
        <ul class="ed-tags" aria-label="Dishes to look for">${dishes.map((d) => `<li data-reveal>${esc(d)}</li>`).join('')}</ul>
      </div>
    </section>

    <section class="ed-grid ed-sec ed-fest" aria-labelledby="ed-fest-h">
      ${heading('ed-fest-h', '03', 'Festivals')}
      <p class="ed-body ed-fest__body" data-reveal>${ph(`Festivals of ${ch.name}: names, months and what to expect`)}</p>
    </section>

    <section class="ed-tips" aria-labelledby="ed-tips-h">
      <div class="ed-grid">
        ${heading('ed-tips-h', '04', 'Travel Tips')}
        <div class="ed-tips__lead">
          <h3 class="ed-h3" data-reveal>${esc(a.sections[0].title)}</h3>
          <p class="ed-body" data-reveal>${esc(a.sections[0].text)}</p>
        </div>
        <dl class="ed-facts" data-reveal>
          <div class="ed-fact"><dt>Best time</dt><dd>${esc(a.tips.best)}</dd></div>
          <div class="ed-fact"><dt>Getting there</dt><dd>${esc(a.tips.reach)}</dd></div>
          <div class="ed-fact"><dt>Stay</dt><dd>${esc(a.tips.stay)}</dd></div>
          <div class="ed-fact"><dt>Budget and safety</dt><dd>${ph('Daily budget (currency and date) and safety notes')}</dd></div>
        </dl>
      </div>
    </section>

    <footer class="ed-grid ed-next">
      <button class="ed-next__btn" type="button" data-next-stop>
        <span>${next ? 'Next Stop' : 'The last stop'}</span>
        <strong>${next ? `${esc(next.name)} \u2192` : 'Finish the journey \u2192'}</strong>
      </button>
    </footer>
  </article>`;
}
