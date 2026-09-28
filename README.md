# WANDERWORDS

*Ten stops. Ten stories. One India.*

An interactive, premium digital travel magazine told as a journey on the WanderWords Express through Srinagar, Manali, Amritsar, Jaipur, Agra, Goa, Munnar, Gangtok, Rann of Kutch and Shillong.

## The experience

1. **Loader** with sound prompt.
2. **Cover gate**: "The INDIAN JOURNEY begins".
3. **Train intro**: a cinematic ride with "A journey, ten stops." and SKIP INTRO.
4. **Train rides** between stops: the next city's real video plays in the window.
5. **Chapter title card** in a themed 3D room, with an extruded title and EXPLORE.
6. **Explore**: scroll through 5 exhibits (hero video + 4 framed photos). Click any exhibit to open it full screen.
7. **Read the story**: a full magazine article with photos, video and travel notes.
8. **Finale**: download a postcard.

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

Add royalty-free `ambient.mp3` and `whoosh.mp3` to `public/audio/`.

## Code map

| File | Purpose |
|---|---|
| `src/main.js` | App flow: loader, intro, rides, chapters, overlays |
| `src/engine.js` | Renderer and view switching |
| `src/train.js` | Train carriage, window video |
| `src/landscape.js` | Scenery outside the train |
| `src/room.js` | Themed 3D room template and exhibits |
| `src/chapters.js` | All chapter content |
| `src/ui.js` | Article, lightbox and menu templates |
| `src/media.js` | Photo/video loading with placeholders |
| `src/textures.js` | Procedural wood, plaster, rug and tile textures |

Built with Vite, three.js, GSAP and Lenis.
