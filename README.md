# WANDERWORDS

*Every place has one hour.*

A college-project travel magazine about Incredible India: ten destinations, ten hours. The immersive WebGL experience ("One Hour") is the front door. The Reader / Print Edition is the always-available second door.

## Status

- **M0 Foundation**: Reader pages for all 10 destinations, rendered from `src/data/destinations.json`.
- **M1 Gateway**: preloader, staggered gateway type, Enter button, audio unlock, DOM to canvas transition. The canvas is empty apart from a faint turning ring. The plates arrive in M2.

## Run

```bash
npm install
npm run dev
```

Routes: `/` (immersive front door), `/read` (Reader index), `/destinations/:slug` (Reader page). If WebGL 2 is missing or fails, `/` opens Reader Mode automatically. Build with `npm run build`.

## Content

All copy lives in `src/data/destinations.json`. Any field left empty renders as a visible `[[PLACEHOLDER]]` on the page. Text marked `contentStatus: carried-over-unverified` came from the earlier build and must be fact-checked before submission.

## Code map

| File | Purpose |
|---|---|
| `src/main.js` | History API router, per-page meta tags, focus handling, lazy-loads the experience |
| `src/reader.js` | Builds the semantic HTML for the Reader pages |
| `src/experience/gateway.js` | Gateway, preloader counter, Enter transition, minimal UI overlay |
| `src/experience/preload.js` | Weighted preload tasks (fonts, Chapter I images) |
| `src/engine.js` | Minimal three.js engine: one canvas, DPR cap, pauses when the tab is hidden |
| `src/audio.js` | Web Audio bus: unlocked by the Enter click, persisted mute |
| `src/support.js` | WebGL 2 check, reduced-motion check |
| `src/nav.js` | Lets any module request navigation |
| `src/data/destinations.json` | Content model for all 10 destinations |
| `src/styles/tokens.css` | Design tokens, base styles, focus and reduced-motion rules |
| `src/styles/reader.css`, `src/styles/gateway.css` | Reader layout, gateway and overlay layout |
