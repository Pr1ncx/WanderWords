// Preloader helpers. Each task reports its own progress (0 to 1) and carries a weight.
// The combined progress (0 to 1) is passed to onProgress.

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const withTimeout = (promise, ms) => Promise.race([promise, wait(ms)]);

export function preload(tasks, onProgress) {
  const total = tasks.reduce((sum, t) => sum + t.weight, 0);
  const done = tasks.map(() => 0);
  const emit = () => onProgress(done.reduce((sum, d, i) => sum + d * tasks[i].weight, 0) / total);

  return Promise.all(tasks.map((task, i) => {
    const report = (p) => {
      done[i] = Math.max(done[i], Math.min(1, p));
      emit();
    };
    return Promise.resolve()
      .then(() => task.run(report))
      .catch((err) => {
        if (!task.optional) throw err; // a required task failing fails the whole preload
        console.warn('Preload task skipped:', err);
        return null;
      })
      .then((result) => {
        report(1);
        return result;
      });
  }));
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => (img.decode ? img.decode().catch(() => {}).then(() => resolve(img)) : resolve(img));
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

// Empty paths are skipped. Chapter I photos are not supplied yet, so this resolves straight away.
export async function loadImages(srcs, report) {
  const list = srcs.filter(Boolean);
  if (!list.length) return [];
  let n = 0;
  return Promise.all(list.map((src) => loadImage(src).then((img) => {
    report(++n / list.length);
    return img;
  })));
}

// Wait for the display fonts so the gateway never flashes in a fallback face
export function loadFonts(report) {
  const faces = ['700 1em Jost', '400 1em Jost', '400 1em Inter', '500 1em Inter', '400 1em Newsreader', 'italic 400 1em Newsreader'];
  let n = 0;
  const all = Promise.all(faces.map((face) => document.fonts.load(face).then(() => report(++n / faces.length))));
  return withTimeout(all, 5000); // never block entry if the font host is unreachable
}
