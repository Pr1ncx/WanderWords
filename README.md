# WANDERWORDS

*Ten stops. Ten stories. One India.*

An interactive, premium digital travel magazine told as a journey on the WanderWords Express through Srinagar, Manali, Amritsar, Jaipur, Agra, Goa, Munnar, Gangtok, Rann of Kutch and Shillong.

## The experience

1. **Loader** with sound prompt.
2. **Opening (Prologue)**: wipe the fogged train window, inspect the sacred geometry, punch your ticket to board.
3. **Train intro**: a cinematic 3D ride with "A journey, ten stops." and SKIP INTRO.
4. **Train rides** between stops: procedural 3D scenery and the next city's real video in the window.
5. **Chapter reel**: 2.39:1 cinema frame widescreen presentation. Scrolling with Lenis cuts through 5 full-screen shots (hero video + 4 high-res photos) with subtle push-in, unified warm color grading, and one-line captions in the margin. Click any shot to zoom into the lightbox.
6. **Chapter conclusion**: in the bottom margin, hold to stamp your passport, read the full magazine article with rich photography and travel notes, or proceed to the next stop.
7. **Finale**: your completed passport of stamps, and a downloadable souvenir postcard.

Controls live cleanly in the cinema margins: top margin hosts the wordmark, chapter credit, and menu; bottom margin hosts progress, journey stops, captions, sound toggle, CC captions, and the passport stamp counter.

## Run locally

```bash
npm install
npm run dev
```

Build for production with `npm run build`.

## Adding photos, videos and sound

See **[MEDIA_GUIDE.md](MEDIA_GUIDE.md)**: it lists every file, media dimensions, and sound files. Put media in `public/media/<city>/`, sound in `public/audio/`, and credits in `src/credits.js`. All chapter content and media manifests live in `src/chapters.js`.

## Code map

| File | Purpose |
|---|---|
| `src/main.js` | App orchestrator: loader, opening, train rides, chapter reel, margins & overlays |
| `src/engine.js` | Three.js WebGL renderer, responsive viewport handling, and render loop |
| `src/reel.js` | Cinema frame chapter footage reel: 2.39:1 letterbox, Lenis scroll dissolves, push-in |
| `src/train.js` | 3D train carriage model, procedural motion, window video integration |
| `src/landscape.js` | Procedural 3D landscape scenery outside the train window |
| `src/prologue.js` | Prologue "The Letter": grey desk, fogged window wipe, letter from last passenger, passport stamp, train wipe |
| `src/prologue-art.js` | Inline SVG art: desk scene, wax seal, margin sketches, passport watermark, train |
| `src/prologue.css` | Styles for the prologue sequence |
| `src/painter.js` | Canvas painting rendered behind the fogged window |
| `src/chapters.js` | All 10 stops' editorial content, quotes, and media manifests |
| `src/stamps.js` | Passport stamps, counter, SVG stamping animations, and passport modal |
| `src/audio.js` | Web Audio soundscape: journey bed, city ambient tracks, and sound effects |
| `src/ui.js` | Magazine article reader, photo lightbox, and navigation menu templates |
| `src/media.js` | Image and video loader with graceful black-frame fallbacks |
| `src/post.js` | Unified film color grade shader pass (saturation, S-curve, lifted blacks, warm highlights) |
| `src/gestures.js` | Interactive press-and-hold gestures (mouse, touch, keyboard) |
| `src/textures.js` | Procedural canvas textures and materials |
| `src/credits.js` | Project credits and acknowledgments |
| `src/style.css` | Global styling, cinema frame layout, typography, navigation bars |
| `src/stage3.css` | Styles for opening scene, ticket punch, stamps, and passport modal |

## Performance

- The cinema frame renders Three.js inside a strict 2.39:1 canvas with pixel ratio capped at 1.25.
- WebGL rendering automatically pauses when full-screen 2D overlays (article, menu, lightbox, passport) are active.
- Unified post-processing grade runs in a single efficient shader pass.
- Smooth scrolling powered by Lenis with inertia dampening.

Built with Vite, three.js, GSAP, and Lenis.
