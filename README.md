# WANDERWORDS

*Ten stops. Ten stories. One India.*

An interactive, premium digital travel magazine told as a journey on the WanderWords Express through Srinagar, Manali, Amritsar, Jaipur, Agra, Goa, Munnar, Gangtok, Rann of Kutch and Shillong.

## The experience

1. **Loader** with sound prompt.
2. **Opening**: wipe the fogged train window, then press and hold to punch your ticket and tear up the postcard.
3. **Train intro**: a cinematic ride with "A journey, ten stops." and SKIP INTRO.
4. **Train rides** between stops: the next city's real video plays in the window.
5. **Chapter scene**: each city is one composed, cinematic scene (surreal Renaissance meets India) with a glowing focal point at the centre, depth parallax, god rays, bloom, water, haze and drifting petals, snow or fireflies. The title appears low in the frame like a film credit.
6. **Explore**: cinema bars slide in and scrolling cuts through 5 full-screen shots (hero video + 4 photos) with a slow push-in and one line of type. Click a shot to open it.
7. **Ritual**: at the end the scene returns. Perform the city's ritual on its focal point (light the diya, spin the prayer wheel, raise the moon...) and the scene lights up and earns that city's passport stamp. Stamps are saved in the browser.
8. **Read the story**: a full magazine article with photos, video and travel notes.
9. **Finale**: your passport of stamps, and a postcard with your stamps to download.

The left pill jumps between stops and shows chapter progress. The stamp counter (bottom right) opens your passport. The menu (top right) jumps to any chapter and shows credits. CC shows captions, and the replay button restarts the current chapter.

## Run locally

```bash
npm install
npm run dev
```

Build for production with `npm run build`.

## Adding scene art, photos, videos and sound

See **[MEDIA_GUIDE.md](MEDIA_GUIDE.md)**: it lists every file, the image prompts for each city's scene, and the sound files. Put media in `public/media/<city>/`, sound in `public/audio/`, and credits in `src/credits.js`. All text lives in `src/chapters.js`; each city's light and atmosphere live in `src/scenes.js`.

## Code map

| File | Purpose |
|---|---|
| `src/main.js` | App flow: loader, intro, rides, chapters, overlays |
| `src/engine.js` | Renderer and view switching |
| `src/train.js` | Train carriage, window video |
| `src/landscape.js` | Scenery outside the train |
| `src/tableau.js` | Chapter view: one full-screen scene shader (parallax, rays, bloom, water, focal glow) and the full-screen shots |
| `src/scenes.js` | Per-city art direction, and the placeholder scene painted until `scene.webp` exists |
| `src/tableau.css` | Cinema bars, film caption, title credit, ritual layout |
| `src/audio.js` | Journey and per-city ambient beds (crossfaded) and one-shot effects |
| `src/painter.js` | Painted landscape behind the fogged window in the opening |
| `src/particles.js` | Drifting atmosphere (petals, snow, dust, fireflies, glitter, mist) and lens bokeh |
| `src/chapters.js` | All chapter content |
| `src/ui.js` | Article, lightbox and menu templates |
| `src/media.js` | Photo/video loading with placeholders |
| `src/post.js` | Post-processing: lens aberration, colour grade, vignette, paper and film grain |
| `src/opening.js` | Act I: wipe-the-window and punch-the-ticket |
| `src/rituals.js` | One interaction per city |
| `src/gestures.js` | Hold, rub and spin gestures (mouse, touch, keyboard) |
| `src/stamps.js` | Passport stamps, counter and passport grid |
| `src/stage3.css` | Styles for the opening, HUD, rituals, stamps and passport |

## Performance

Each chapter is a single full-screen shader pass plus two small particle systems. The pixel ratio is capped at 1.25 and drops automatically when frames run long, WebGL pauses while a full-screen layer covers it, and grain and paper are drawn in one cheap film pass. Reduced-motion settings stop camera drift and particle motion.

Built with Vite, three.js, GSAP and Lenis.
