// Credits page: photography, type, software, sound. Reached from the Reader header at /credits.
import { pageHeader, esc, ph, has } from './reader.js';

export function creditsPage(all) {
  const photos = all.map((d) => {
    const credit = has((d.photo || {}).credit) ? esc(d.photo.credit) : ph('Photographer, source and licence');
    return `<li><strong>${esc(d.name)}</strong> \u00b7 ${credit}</li>`;
  }).join('');
  const html = `${pageHeader()}
  <main id="main" tabindex="-1">
    <p class="kicker">WanderWords</p>
    <h1 class="display" tabindex="-1">Credits</h1>
    <section class="dispatch" aria-labelledby="c-team"><h2 id="c-team">Team</h2>
      <p>${ph('Student names, course and institution')}</p></section>
    <section class="dispatch" aria-labelledby="c-photo"><h2 id="c-photo">Photography</h2>
      <p>Until photographs are supplied, the plates use procedurally generated placeholder illustrations that are painted in the browser. They are not photographs of the places.</p>
      <ul class="list">${photos}</ul></section>
    <section class="dispatch" aria-labelledby="c-type"><h2 id="c-type">Typefaces</h2>
      <ul class="list">
        <li>Jost, by Owen Earl</li>
        <li>Newsreader, by Production Type</li>
        <li>Inter, by Rasmus Andersson</li>
      </ul>
      <p>All three are served from Google Fonts under the SIL Open Font License.</p></section>
    <section class="dispatch" aria-labelledby="c-soft"><h2 id="c-soft">Software</h2>
      <ul class="list">
        <li>three.js (MIT licence)</li>
        <li>GSAP (GreenSock standard licence)</li>
        <li>Vite (MIT licence)</li>
      </ul></section>
    <section class="dispatch" aria-labelledby="c-sound"><h2 id="c-sound">Sound</h2>
      <p>All sound is synthesised in your browser with the Web Audio API: a soft drone for each chapter, four layers that arrive as you read the dispatches, a swell when you find the hour, and the ticks of the dial. There are no recordings and no speech, so there is nothing to transcribe. Sound never carries information that is not also on screen, and it never starts before you press Enter. You can mute it at any time.</p></section>
    <section class="dispatch" aria-labelledby="c-note"><h2 id="c-note">A note on accuracy</h2>
      <p>The ten hours are editorial choices, not timetables. Check opening times, permits, prices and conditions before you travel.</p></section>
  </main>`;
  return {
    html,
    accent: null,
    title: 'Credits \u00b7 WanderWords',
    description: 'Credits for WanderWords: photography, typefaces, software and sound.',
  };
}
