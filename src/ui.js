// HTML template for the chapter index menu. (Destination pages live in src/destination/.)
export const pad = (n) => String(n).padStart(2, '0');

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// data-ph makes the global error handler swap in a painted placeholder if the file is missing
const img = (src, alt, accent, cls = '') =>
  `<img class="${cls}" src="${src}" alt="${esc(alt)}" loading="lazy" data-ph="${esc(alt)}" data-accent="${accent}">`;

export function renderMenu(chapters, credits) {
  const cards = chapters.map((c, k) => `
    <button class="menu-card" data-go="${k}">
      ${img(c.coverImg, c.name, c.accent)}
      <span class="menu-card__num">Stop ${pad(k + 1)}</span>
      <strong>${c.title}</strong>
      <span>${c.name}</span>
    </button>`).join('');
  const lines = chapters.flatMap((c) => (credits[c.id] || []).map((l) => `<li><b>${c.name}</b> ${esc(l)}</li>`));
  return `
    <div class="menu-head" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 2rem;">
      <div>
        <p class="eyebrow">WanderWords \u00b7 Issue 01</p>
        <h2 style="margin: .4rem 0 0;">The Journey</h2>
      </div>
      <button id="menuAuthBtn" class="btn btn--ghost" style="margin-top: 0; padding: .75rem 1.6rem; display: inline-flex; align-items: center; gap: 8px;">
        <span id="menuAuthText">Passenger Boarding Pass ↗</span>
      </button>
    </div>
    <div class="menu-grid">${cards}</div>
    <section class="menu-credits">
      <h3>Credits</h3>
      <ul>${lines.join('') || '<li>Add your photo and video credits in <code>src/credits.js</code>.</li>'}</ul>
    </section>`;
}
