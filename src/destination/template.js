// The HTML of one destination page. Pure function: chapter data in, markup out.
// Sections: hero, introduction, Attractions, Local Food, Festivals, Travel Tips, Next Stop.
import { pad } from '../ui.js';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// data-ph makes the global error handler swap in a painted placeholder if the file is missing
const img = (src, alt, accent, cls = '', extra = '') =>
  `<img class="${cls}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" data-ph="${esc(alt)}" data-accent="${esc(accent)}" ${extra}>`;

const ph = (label) => `<mark class="ph">[[PLACEHOLDER]] ${esc(label)}</mark>`;

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
      <div class="ed-hero__text">
        <p class="ed-hero__eyebrow">Stop ${pad(i + 1)} of ${pad(chapters.length)} \u00b7 ${esc(ch.name)}</p>
        <h1 class="ed-hero__title" tabindex="-1">${esc(ch.title)}</h1>
        <p class="ed-hero__tag">${esc(ch.tagline)}</p>
      </div>
      <p class="ed-hero__cue" aria-hidden="true">Scroll</p>
    </header>

    <section class="ed-intro">
      <p class="ed-lede" data-reveal>${esc(a.intro)}</p>
      <blockquote class="ed-quote" data-reveal>${esc(a.quote)}</blockquote>
    </section>

    <section class="ed-sec ed-places" aria-labelledby="ed-places-h">
      <h2 id="ed-places-h" class="ed-h" data-reveal><span>01</span> Attractions</h2>
      <ol class="ed-gallery">
        ${places.map((e, k) => `
        <li class="ed-card ed-card--${k % 2 ? 'r' : 'l'}" data-reveal>
          <div class="ed-card__img">${img(e.src, e.title, ch.accent, '', 'data-parallax="8"')}</div>
          <div class="ed-card__text">
            <p class="ed-kicker">${pad(k + 1)}</p>
            <h3>${esc(e.title)}</h3>
            <p>${esc(e.text)}</p>
          </div>
        </li>`).join('')}
      </ol>
    </section>

    <section class="ed-sec ed-food" aria-labelledby="ed-food-h">
      <h2 id="ed-food-h" class="ed-h" data-reveal><span>02</span> Local Food</h2>
      <div class="ed-food__grid">
        <div class="ed-food__img">${img(a.sections[1].img, a.sections[1].title, ch.accent, '', 'data-parallax="10"')}</div>
        <div>
          <h3 class="ed-h3" data-reveal>${esc(a.sections[1].title)}</h3>
          <p class="ed-body" data-reveal>${esc(a.sections[1].text)}</p>
          <ul class="ed-dishes" aria-label="Dishes to look for">${dishes.map((d) => `<li data-reveal>${esc(d)}</li>`).join('')}</ul>
        </div>
      </div>
    </section>

    <section class="ed-sec ed-fest" aria-labelledby="ed-fest-h">
      <h2 id="ed-fest-h" class="ed-h" data-reveal><span>03</span> Festivals</h2>
      <p class="ed-body" data-reveal>${ph(`Festivals of ${ch.name}: names, months and what to expect`)}</p>
    </section>

    <section class="ed-tips" aria-labelledby="ed-tips-h">
      <div class="ed-tips__in">
        <h2 id="ed-tips-h" class="ed-h" data-reveal><span>04</span> Travel Tips</h2>
        <div class="ed-tips__grid">
          <div>
            <h3 class="ed-h3" data-reveal>${esc(a.sections[0].title)}</h3>
            <p class="ed-body" data-reveal>${esc(a.sections[0].text)}</p>
          </div>
          <dl class="ed-facts" data-reveal>
            <dt>Best time</dt><dd>${esc(a.tips.best)}</dd>
            <dt>Getting there</dt><dd>${esc(a.tips.reach)}</dd>
            <dt>Stay</dt><dd>${esc(a.tips.stay)}</dd>
            <dt>Budget and safety</dt><dd>${ph('Daily budget (currency and date) and safety notes')}</dd>
          </dl>
        </div>
      </div>
    </section>

    <footer class="ed-next">
      <button class="ed-next__btn" type="button" data-next-stop>
        <span>${next ? 'Next Stop' : 'The last stop'}</span>
        <strong>${next ? `${esc(next.name)} \u2192` : 'Finish the journey \u2192'}</strong>
      </button>
    </footer>
  </article>`;
}
