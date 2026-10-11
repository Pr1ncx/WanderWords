# WANDERWORDS

*Every place has one hour.*

A college-project travel magazine about Incredible India: ten destinations, ten hours. The immersive WebGL experience ("One Hour") is the front door. The Reader / Print Edition is the always-available second door.

## Status

**M0 Foundation**: Reader pages for all 10 destinations, rendered from `src/data/destinations.json`. The immersive experience (M1 onwards) is not built yet.

## Run

```bash
npm install
npm run dev
```

Routes: `/` (index) and `/destinations/:slug`. Build with `npm run build`.

## Content

All copy lives in `src/data/destinations.json`. Any field left empty renders as a visible `[[PLACEHOLDER]]` on the page. Text marked `contentStatus: carried-over-unverified` came from the earlier build and must be fact-checked before submission.

## Code map

| File | Purpose |
|---|---|
| `src/main.js` | Tiny History API router, per-page meta tags, focus handling |
| `src/reader.js` | Builds the semantic HTML for the index and destination pages |
| `src/data/destinations.json` | Content model for all 10 destinations |
| `src/styles/tokens.css` | Design tokens, base styles, focus and reduced-motion rules |
| `src/styles/reader.css` | Reader layout |
| `src/engine.js`, `src/audio.js`, `src/post.js` | Kept from the earlier build for possible reuse. Not used yet. They will be audited in M1/M3 |
