// The journey: ONE state machine decides which layer is on screen.
//
//   TrainCanvas          (the train video, z-index 5)
//   DestinationEditorial (smooth-scrolling HTML page,  z-index 10)
//
// The two components never talk to each other. Only this file does.
//
// Phases and the moves allowed between them:
//   loading -> gate -> intro -> riding -> entering -> destination -> leaving -> riding ...
//                 \-> entering (deep link, index jump)                      \-> finale -> riding
//
// URLs follow the state: "/" while on the train, "/stop/<id>" on a destination page.
// A destination can therefore be opened straight from a link, and the browser Back button
// takes you from the page back to the train.

const GRAPH = {
  loading: ['gate'],
  gate: ['intro', 'entering'],
  intro: ['riding', 'entering'],
  riding: ['entering', 'finale'],
  entering: ['destination'],
  destination: ['leaving'],
  leaving: ['riding', 'finale'],
  finale: ['riding', 'entering'],
};

export function createJourney({ chapters, train, editorial }) {
  let phase = 'loading';
  let current = -1; // the stop on screen, or being approached
  let target = -1; // where the train is heading while riding
  let skipFlag = false;
  let locked = false; // true while one destination page is swapped for another
  let pendingPop = false; // the Back button was pressed mid-transition
  const handlers = { phase: new Set(), stop: new Set() };

  const emit = (type, value) => handlers[type].forEach((fn) => fn(value));
  const busy = () => phase === 'entering' || phase === 'leaving' || locked;

  function set(next) {
    if (next === phase) return;
    if (!GRAPH[phase].includes(next)) {
      // A bug in the flow, not something the visitor did: say so loudly in development
      const msg = `Journey: ${phase} -> ${next} is not allowed`;
      if (import.meta.env && import.meta.env.DEV) throw new Error(msg);
      console.warn(msg);
    }
    phase = next;
    document.body.dataset.phase = next;
    emit('phase', next);
  }

  // ---- URLs ----
  const pathFor = (i) => (i < 0 ? '/' : `/stop/${chapters[i].id}`);
  function stopFromUrl() {
    const m = location.pathname.match(/^\/stop\/([a-z0-9-]+)\/?$/);
    return m ? chapters.findIndex((c) => c.id === m[1]) : -1;
  }
  function setUrl(i) {
    const p = pathFor(i);
    if (location.pathname !== p) history.pushState({ stop: i }, '', p);
  }

  // ---- Moves ----

  // Into a destination. via 'window': a focus pull first (the train blurs and darkens).
  // via 'direct': no train shown (deep link, index jump).
  async function enterStop(i, via) {
    current = i;
    set('entering');
    emit('stop', i);
    if (via === 'window') await train.pushThrough(chapters[i]); // focus pull: no zoom
    setUrl(i);
    await editorial.open(chapters[i], i); // the HTML page fades in over the train
    train.pause(); // then the train is hidden and paused
    set('destination');
    settle();
  }

  // Out of a destination, back onto the train, and on to the next stop (or the finale).
  async function leaveStop() {
    if (phase !== 'destination' || busy()) return;
    set('leaving');
    await train.resume(); // the train wakes up underneath the page, still out of focus
    await editorial.close(); // the page fades out
    setUrl(-1);
    await train.pullBack(chapters[current]); // the train comes back into focus
    const next = current + 1;
    if (next >= chapters.length) {
      set('finale');
      settle();
      return;
    }
    target = next;
    skipFlag = false;
    set('riding');
    settle();
    await train.ride(chapters[next]); // ends after a few seconds, or when skipped
    await enterStop(target, 'window');
  }

  // From the cover: the intro ride, then the first stop
  async function begin() {
    target = 0;
    skipFlag = false;
    set('intro');
    await train.intro();
    if (!skipFlag) {
      set('riding');
      await train.ride(chapters[0], { first: true });
    }
    await enterStop(target, 'window');
  }

  function skip() {
    if (phase === 'intro' || phase === 'riding') {
      skipFlag = true;
      train.skipRide();
    }
  }

  // Jump to any stop (index menu, deep link, Back/Forward)
  async function goToStop(i) {
    if (busy() || i < 0 || i >= chapters.length) return;
    if (phase === 'destination' && i === current) return;
    if (phase === 'gate' || phase === 'finale') return enterStop(i, 'direct');
    if (phase === 'intro' || phase === 'riding') {
      target = i;
      skipFlag = true;
      train.skipRide();
      return;
    }
    if (phase === 'destination') return swapStop(i);
  }

  // One destination page replaced by another, without going back to the train
  async function swapStop(i) {
    locked = true;
    current = i;
    emit('stop', i);
    await editorial.close();
    setUrl(i);
    await editorial.open(chapters[i], i);
    locked = false;
    settle();
  }

  async function restart() {
    if (phase !== 'finale') return;
    target = 0;
    skipFlag = false;
    set('riding');
    await train.ride(chapters[0], { first: true });
    await enterStop(target, 'window');
  }

  // ---- Browser Back / Forward ----
  function syncFromUrl() {
    const i = stopFromUrl();
    if (phase === 'destination' && i < 0) leaveStop();
    else if (phase === 'destination' && i >= 0 && i !== current) swapStop(i);
    else if (i >= 0 && (phase === 'riding' || phase === 'finale' || phase === 'gate')) goToStop(i);
  }
  function onPop() {
    if (busy()) { pendingPop = true; return; }
    syncFromUrl();
  }
  function settle() {
    if (pendingPop && !busy()) {
      pendingPop = false;
      syncFromUrl();
    }
  }
  addEventListener('popstate', onPop);

  return {
    get phase() { return phase; },
    get current() { return current; },
    stopFromUrl,
    openGate: () => set('gate'),
    begin,
    skip,
    goToStop,
    nextStop: leaveStop,
    restart,
    on(type, fn) {
      handlers[type].add(fn);
      return () => handlers[type].delete(fn);
    },
    dispose: () => removeEventListener('popstate', onPop),
  };
}
