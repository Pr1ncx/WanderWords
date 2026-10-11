// Ask the router to go somewhere. Lets any module trigger navigation without importing main.js.
export function navigate(path, replace = false) {
  window.dispatchEvent(new CustomEvent('ww:navigate', { detail: { path, replace } }));
}
