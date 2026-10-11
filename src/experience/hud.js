// The DOM overlay (z-index 10): wordmark, chapter label, tools, chapter text, arrows and the
// "Step into the photograph" button. Typography is real HTML, never drawn in the canvas.
import gsap from 'gsap';
import { audio } from '../audio.js';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const pad = (n) => String(n).padStart(2, '0');

const arrow = (dir) => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${dir === 'l' ? '<path d="M19 12H5M11 6l-6 6 6 6"/>' : '<path d="M5 12h14M13 6l6 6-6 6"/>'}</svg>`;

const TEMPLATE = `
<div class="hud">
  <h1 class="sr-only" tabindex="-1" data-uititle>WanderWords. Every place has one hour.</h1>

  <header class="hud-top">
    <p class="exp-wordmark">WanderWords</p>
    <p class="hud-chapter" data-chapter aria-live="polite">Chapter I</p>
    <div class="hud-tools">
      <p class="hud-counter" data-counter>\u2197 0/4 Dispatches</p>
      <button class="link-btn" type="button" data-mute></button>
      <button class="link-btn" type="button" data-index>Index</button>
      <a class="link-btn" href="/read" data-link>Reader mode</a>
    </div>
  </header>

  <button class="link-btn hud-back" type="button" data-back>\u2190 Gallery</button>

  <div class="hud-plates" data-plates>
    <button class="hud-arrow hud-arrow--prev" type="button" data-prev aria-label="Previous chapter">${arrow('l')}</button>
    <button class="hud-arrow hud-arrow--next" type="button" data-next aria-label="Next chapter">${arrow('r')}</button>
    <h2 class="hud-name" data-name></h2>
    <p class="hud-hour" data-hourwrap><time data-hour></time><span>The hour</span></p>
    <div class="hud-cta">
      <p class="hud-progress" data-progress></p>
      <button class="cta" type="button" data-step>Step into the photograph</button>
    </div>
  </div>

  <div class="hud-spots" data-spots></div>
</div>`;

export function createHud(ui, { total, reduced }) {
  ui.innerHTML = TEMPLATE;
  const q = (s) => ui.querySelector(s);
  const el = {
    title: q('[data-uititle]'), chapter: q('[data-chapter]'), counter: q('[data-counter]'), mute: q('[data-mute]'),
    index: q('[data-index]'), back: q('[data-back]'), plates: q('[data-plates]'), prev: q('[data-prev]'), next: q('[data-next]'),
    name: q('[data-name]'), hour: q('[data-hour]'), hourWrap: q('[data-hourwrap]'), progress: q('[data-progress]'), step: q('[data-step]'),
  };
  gsap.set([el.counter, el.back], { autoAlpha: 0 });
  el.back.setAttribute('inert', '');

  // Sound toggle: label and state follow the audio bus
  const syncMute = () => {
    el.mute.textContent = audio.muted ? 'Sound off' : 'Sound on';
    el.mute.setAttribute('aria-pressed', String(!audio.muted));
  };
  syncMute();
  el.mute.addEventListener('click', () => {
    audio.unlock();
    audio.setMuted(!audio.muted);
    syncMute();
  });

  const fadeTargets = [el.chapter, el.name, el.hourWrap];

  return {
    el,
    // Change the chapter text. The text cross-fades in step with the camera glide.
    setChapter(d, i, instant = false) {
      const apply = () => {
        el.chapter.textContent = `Chapter ${ROMAN[d.chapter]}`;
        el.name.textContent = d.name;
        el.hour.textContent = d.hour;
        el.hour.setAttribute('datetime', d.hour);
        el.progress.textContent = `${pad(i + 1)} / ${pad(total)}`;
        el.prev.disabled = i === 0;
        el.next.disabled = i === total - 1;
      };
      gsap.killTweensOf(fadeTargets);
      if (instant) {
        apply();
        gsap.set(fadeTargets, { autoAlpha: 1 });
        return;
      }
      gsap.to(fadeTargets, {
        autoAlpha: 0, duration: reduced ? 0.15 : 0.25,
        onComplete: () => {
          apply();
          gsap.to(fadeTargets, { autoAlpha: 1, duration: reduced ? 0.15 : 0.5 });
        },
      });
    },
    showPlates(on) {
      if (on) el.plates.removeAttribute('inert');
      else el.plates.setAttribute('inert', '');
      gsap.to(el.plates, { autoAlpha: on ? 1 : 0, duration: reduced ? 0.2 : on ? 0.6 : 0.4 });
    },
    showClose(on) {
      if (on) el.back.removeAttribute('inert');
      else el.back.setAttribute('inert', '');
      gsap.to([el.counter, el.back], { autoAlpha: on ? 1 : 0, duration: reduced ? 0.2 : 0.5 });
    },
    setCounter(n) {
      el.counter.textContent = `\u2197 ${n}/4 Dispatches`;
    },
    focusStep() {
      el.step.focus({ preventScroll: true });
    },
  };
}
