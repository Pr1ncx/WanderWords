// Entry point: a tiny History API router.
//   /                      the immersive experience (front door), loaded on demand
//   /read                  Reader index
//   /destinations/:slug    Reader page for one destination
import './styles/tokens.css';
import './styles/reader.css';
import DESTINATIONS from './data/destinations.json';
import { indexPage, destinationPage, notFoundPage } from './reader.js';
import { webglAvailable } from './support.js';

const app = document.getElementById('app');
const DEFAULT_ACCENT = '#C9BFAE';
const EXPERIENCE_META = {
  title: 'WanderWords \u00b7 Every place has one hour',
  description: 'A travel magazine of ten hours: Srinagar, Manali, Amritsar, Jaipur, Agra, Goa, Munnar, Gangtok, Rann of Kutch and Shillong.',
};

let current = null; // the mounted experience, if any
let navToken = 0; // guards against a slow import finishing after the user has moved on

function readerPage(path) {
  if (path === '/read') return indexPage(DESTINATIONS);
  const m = path.match(/^\/destinations\/([a-z0-9-]+)$/);
  if (m) {
    const i = DESTINATIONS.findIndex((d) => d.slug === m[1]);
    if (i >= 0) return destinationPage(DESTINATIONS, i);
  }
  return notFoundPage();
}

// Create or update a <meta> tag
function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.append(el);
  }
  el.setAttribute('content', content);
}

function applyHead({ title, description, accent }) {
  document.title = title;
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  document.documentElement.style.setProperty('--accent', accent || DEFAULT_ACCENT);
}

async function show(pathname, { focus = true } = {}) {
  const token = ++navToken;
  if (current) { current.unmount(); current = null; }

  let path = pathname.replace(/\/+$/, '') || '/';

  // No WebGL 2: Reader Mode is selected automatically
  if (path === '/' && !webglAvailable()) {
    history.replaceState({}, '', '/read');
    path = '/read';
  }

  if (path === '/') {
    document.body.dataset.mode = 'experience';
    app.innerHTML = '';
    applyHead(EXPERIENCE_META);
    try {
      // three.js and gsap load only here, so Reader pages stay light
      const { mountExperience } = await import('./experience/gateway.js');
      if (token !== navToken) return;
      current = mountExperience(app);
    } catch (err) {
      console.error('Could not start the experience, opening Reader Mode:', err);
      if (token === navToken) go('/read', true);
    }
    return;
  }

  document.body.dataset.mode = 'reader';
  const page = readerPage(path);
  app.innerHTML = page.html;
  applyHead(page);
  if (focus) {
    // Move focus to the page heading so keyboard and screen reader users land at the top
    window.scrollTo(0, 0);
    const h1 = app.querySelector('h1');
    if (h1) h1.focus({ preventScroll: true });
  }
}

function go(path, replace = false) {
  if (replace) history.replaceState({}, '', path);
  else history.pushState({}, '', path);
  show(location.pathname);
}

// Internal links marked data-link use the router
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[data-link]');
  if (!a) return;
  e.preventDefault();
  go(a.getAttribute('href'));
});

// Other modules ask for navigation through an event (see nav.js)
window.addEventListener('ww:navigate', (e) => go(e.detail.path, e.detail.replace));
window.addEventListener('popstate', () => show(location.pathname, { focus: false }));

show(location.pathname, { focus: false });
