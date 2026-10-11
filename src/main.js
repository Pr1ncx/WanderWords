// Entry point: a tiny History API router for the Reader pages.
// Routes: /  and  /destinations/:slug
import './styles/tokens.css';
import './styles/reader.css';
import DESTINATIONS from './data/destinations.json';
import { indexPage, destinationPage, notFoundPage } from './reader.js';

const app = document.getElementById('app');
const DEFAULT_ACCENT = '#C9BFAE';

function resolve(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return indexPage(DESTINATIONS);
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

function show(pathname, { focus = true } = {}) {
  const page = resolve(pathname);
  app.innerHTML = page.html;
  document.title = page.title;
  setMeta('name', 'description', page.description);
  setMeta('property', 'og:title', page.title);
  setMeta('property', 'og:description', page.description);
  document.documentElement.style.setProperty('--accent', page.accent || DEFAULT_ACCENT);
  if (focus) {
    // After navigating, move focus to the page heading so keyboard and screen reader users land at the top
    window.scrollTo(0, 0);
    const h1 = app.querySelector('h1');
    if (h1) h1.focus({ preventScroll: true });
  }
}

// Intercept internal links marked data-link
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[data-link]');
  if (!a) return;
  e.preventDefault();
  history.pushState({}, '', a.getAttribute('href'));
  show(location.pathname);
});

window.addEventListener('popstate', () => show(location.pathname, { focus: false }));

show(location.pathname, { focus: false });
