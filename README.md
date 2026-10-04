# WANDERWORDS

*Ten stops. Ten stories. One India.*

An interactive, premium digital travel magazine told as a journey on the WanderWords Express through Srinagar, Manali, Amritsar, Jaipur, Agra, Goa, Munnar, Gangtok, Rann of Kutch and Shillong.

## The experience

1. **Loader** with sound prompt.
2. **Prologue, "The Letter"**: a grey desk in a grey city. Wipe the fogged window to glimpse India, then a letter from *the last passenger* slides onto the desk. Break the wax seal and read it as it writes itself. Open your passport and press the brass stamp: the grey world bleeds into colour, the departure board flips, and a full-screen train sweeps across and carries you into the carriage. Skip prologue jumps straight to the train.
3. **Train intro**: a cinematic ride with "A journey, ten stops." and SKIP INTRO.
4. **Train rides** between stops: the next city's real video plays in the window.
5. **Chapter reel**: each city plays in a 2.39:1 cinema frame. Scrolling cuts through 5 shots (hero video + 4 photos) with a slow push-in and one line of type in the bottom margin. Click a shot to open it.
6. **End of chapter**: hold to stamp your passport, read the story, or ride on to the next stop. Stamps are saved in the browser.
7. **Read the story**: a full magazine article with photos, video and travel notes.
8. **Finale**: your passport of stamps, and a postcard with your stamps to download.

The journey dots in the bottom margin jump between stops. The Passport button (bottom right) opens your stamps. The menu (top right) jumps to any chapter and shows credits. CC shows captions.

## Run locally

```bash
npm install
npm run dev
```

Build for production with `npm run build`.

## Adding photos, videos and sound

See **[MEDIA_GUIDE.md](MEDIA_GUIDE.md)**: it lists every file and the sound files. Put media in `public/media/<city>/`, sound in `public/audio/`, and credits in `src/credits.js`. All chapter text lives in `src/chapters.js`.

The prologue's illustrations are drawn in code (`src/prologue-art.js`), so it needs no image files except `public/media/opening/arch.png` (the view through the window). Its sound effects are optional and stay silent if missing: `whoosh`, `stamp`, `seal`, `paper`, `punch`, `board`, `horn` and `train` (all `.mp3` in `public/audio/`).

## Code map

| File | Purpose |
|---|---|
| `src/main.js` | App flow: loader, prologue, intro, rides, chapters, overlays |
| `src/prologue.js` | The prologue: desk, window wipe, letter, passport stamp, departure board and train wipe. Returns `{ done, cancel, skip }` |
| `src/prologue-art.js` | Flat 2D SVG illustrations for the prologue (desk, seal, sketches, watermark, stamp, train) |
| `src/prologue.css` | Prologue styles |
| `src/engine.js` | Renderer and view switching |
| `src/train.js` | Train carriage, window video |
| `src/landscape.js` | Scenery outside the train |
| `src/reel.js` | Chapter view: the 2.39:1 cinema reel of shots with push-ins and transitions |
| `src/audio.js` | Journey and per-city ambient beds (crossfaded) and one-shot effects |
| `src/painter.js` | Canvas-painted artwork |
| `src/chapters.js` | All chapter content |
| `src/credits.js` | Media credits shown in Menu > Credits |
| `src/ui.js` | Article, lightbox and menu templates |
| `src/media.js` | Photo/video loading with placeholders |
| `src/post.js` | Film colour grade |
| `src/fx.js` | The downloadable postcard |
| `src/gestures.js` | Hold, rub and spin gestures (mouse, touch, keyboard) |
| `src/stamps.js` | Passport stamps, counter and passport grid |
| `src/style.css`, `src/stage3.css` | Cinema frame, typography, HUD, stamps and passport |

## Performance

The pixel ratio is capped and WebGL pauses while a full-screen layer covers it. The prologue is plain DOM and SVG: WebGL stays paused until the train covers the screen, then starts rendering the carriage behind it. Reduced-motion settings shorten the prologue, replace the train sweep with a crossfade, and stop camera drift.

Built with Vite, three.js, GSAP and Lenis.
