# WANDERWORDS

*Every place has one hour.*

A college-project travel magazine about Incredible India: ten destinations, ten hours. The immersive WebGL experience ("One Hour") is the front door. The Reader / Print Edition is the always-available second door.

## The experience

Gateway and preloader, then a dark hall of ten plates. Step into a photograph, read four Dispatches hidden in it, then turn a 24-hour dial to find the hour at which that place is truest. Solve all ten and the clock-face Index closes with a line.

- **Gateway** (`/`): preloader counting 000 to 100, Enter unlocks audio.
- **Plates**: arrows, keyboard left/right, or swipe. Neighbours sit back and dim.
- **Crossing**: camera push on Z, frame dissolves, depth parallax comes alive.
- **Dispatches**: four hotspots (The Past, The Table, The Calendar, Field Notes), counter 0/4, an audio layer and a slight warming for each.
- **Dial**: drag or arrow keys, detents every 15 minutes, tolerance of 20 minutes. After about 45 seconds a quiet "Show me" appears. Skip is always there.
- **Index**: the clock face with all ten hours, open any time from the top bar.

Progress (solved chapters) and the mute choice are remembered in `localStorage`.

## Run

```bash
npm install
npm run dev
```

Routes: `/` (immersive), `/read` (Reader index), `/destinations/:slug` (Reader page), `/credits`. If WebGL 2 is missing, fails, or the context is lost, the site opens Reader Mode. Build with `npm run build`. A static host needs a fallback to `index.html` for these routes.

## Content

All copy lives in `src/data/destinations.json`. Any field left empty shows as a visible `[[PLACEHOLDER]]`. Text marked `contentStatus: carried-over-unverified` came from an earlier build and must be fact-checked. The `hourClue` sentences are drafts that need checking too: each is shown in the Field Notes and implies the chapter's hour.

### Adding a real photograph

Set these fields for a destination (put files in `public/assets/<slug>/`):

```json
"photo": { "src": "/assets/srinagar/photo.webp", "depth": "/assets/srinagar/depth.webp", "alt": "...", "credit": "Photographer / source / licence" }
```

Portrait 4:5, about 1600 x 2000. `depth` is optional (grayscale, white = near). Without it, depth is estimated from height. Until `src` is set, a procedural placeholder illustration is painted in the browser. Hotspot positions are `[x, y]` from the top-left of the photograph, both 0 to 1.

### Grades and sound

`grades` may override any preset per chapter (`night`, `dawn`, `day`, `dusk`, `true`) with `lift`, `gain`, `tint` (three numbers each), `gamma`, `sat`, `vig`. Without overrides the defaults in `src/experience/grade.js` are used and the "true" look is the grade at the chapter's own hour. Sound is synthesised in the browser. To use recordings instead, set `audio.bed`, `audio.layers[0..3]` and `audio.swell` to file paths.

## Code map

| File | Purpose |
|---|---|
| `src/main.js` | History API router, per-page meta tags, focus handling, lazy-loads the experience |
| `src/reader.js` | Semantic HTML for the Reader pages, plus helpers shared with the experience |
| `src/credits.js` | Credits page |
| `src/experience/gateway.js` | Gateway, preloader, Enter transition |
| `src/experience/stage.js` | The hall, the camera and the phase state machine |
| `src/experience/plates.js` | A plate: paper frame, depth-parallax photograph shader, corner mark |
| `src/experience/art.js` | Placeholder art and depth maps, paper grain, textures |
| `src/experience/grade.js` | Colour grade presets and hour interpolation |
| `src/experience/hud.js` | Overlay: chapter text, arrows, tools |
| `src/experience/dispatches.js` | Hotspots and the editorial panel |
| `src/experience/dial.js` | The hour dial |
| `src/experience/finale.js` | Clock-face Index |
| `src/experience/preload.js` | Weighted preload tasks |
| `src/engine.js` | Minimal three.js engine: DPR cap, pauses when the tab is hidden |
| `src/audio.js` | Web Audio bus: unlock, persisted mute, synthesised soundscape |
| `src/support.js`, `src/nav.js` | WebGL 2 and reduced-motion checks, navigation events |
| `src/data/destinations.json` | Content model for all 10 destinations |
| `src/styles/*.css` | Tokens, Reader layout, experience layout |
