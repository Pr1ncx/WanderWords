# WANDERWORDS

*Ten stops. Ten stories. One India.*

An interactive, premium digital travel magazine told as a journey on the WanderWords Express through Srinagar, Manali, Amritsar, Jaipur, Agra, Goa, Munnar, Gangtok, Rann of Kutch and Shillong.

## The experience

1. **Loader** with sound prompt.
2. **Opening**: wipe the fogged train window, then press and hold to punch your ticket and tear up the postcard.
3. **Train intro**: a cinematic ride with "A journey, ten stops." and SKIP INTRO.
4. **Train rides** between stops: the next city's real video plays in the window.
5. **Chapter title card** over a painted landscape (miniature and oil-painting style), with a floating train ticket and EXPLORE.
6. **Explore**: scroll through 5 exhibits (hero video + 4 framed photos). Click any exhibit to open it full screen.
7. **Read the story**: a full magazine article with photos, video and travel notes.
8. **Rituals**: at the end of each chapter, one small interaction (light the diya, spin the prayer wheel, drop the needle...) earns that city's passport stamp. Stamps are saved in the browser.
9. **Finale**: your passport of stamps, and a postcard with your stamps to download.

The left pill jumps between stops and shows chapter progress. The stamp counter (bottom right) opens your passport.

The menu (top right) jumps to any chapter and shows credits. CC shows captions, and the replay button restarts the current chapter.

## Run locally

```bash
npm install
npm run dev
```

Build for production with `npm run build`.

## Adding photos and videos

See **[MEDIA_GUIDE.md](MEDIA_GUIDE.md)**. Put files in `public/media/<city>/` and credits in `src/credits.js`. All text lives in `src/chapters.js`.

## Optional sound

Add royalty-free `ambient.mp3`, `whoosh.mp3`, `punch.mp3`, `tear.mp3` and `stamp.mp3` to `public/audio/`.

## Code map

| File | Purpose |
|---|---|
| `src/main.js` | App flow: loader, intro, rides, chapters, overlays |
| `src/engine.js` | Renderer and view switching |
| `src/train.js` | Train carriage, window video |
| `src/landscape.js` | Scenery outside the train |
| `src/gallery.js` | Chapter view: 4 painted parallax plates, gilt arch video, mounted prints, ticket |
| `src/painter.js` | Procedural painted plates per city (sky, ranges, landmark, trees, foliage) |
| `src/particles.js` | Drifting atmosphere per city (petals, snow, dust, fireflies, glitter, mist) |
| `src/chapters.js` | All chapter content |
| `src/ui.js` | Article, lightbox and menu templates |
| `src/media.js` | Photo/video loading with placeholders |
| `src/textures.js` | Procedural wood, plaster, marble, rug and tile textures (tileable fractal noise) |
| `src/post.js` | Post-processing: bloom, lens aberration, colour grade, vignette, film grain |
| `src/opening.js` | Act I: wipe-the-window and punch-the-ticket |
| `src/rituals.js` | One interaction per city |
| `src/gestures.js` | Hold, rub and spin gestures (mouse, touch, keyboard) |
| `src/stamps.js` | Passport stamps, counter and passport grid |
| `src/stage3.css` | Styles for the opening, HUD, rituals, stamps and passport |

## Performance

The renderer targets smooth motion over resolution: pixel ratio is capped at 1.25 and drops automatically when frames run long, WebGL pauses while a full-screen layer covers it, and grain and paper are drawn in one cheap shader pass (no CSS blend layers).

Built with Vite, three.js, GSAP and Lenis.
