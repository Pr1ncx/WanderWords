# WANDERWORDS

*Ten stops. Ten stories. One India.*

An interactive digital travel magazine told as an editorial journey through Srinagar, Manali, Amritsar, Jaipur, Agra, Goa, Munnar, Gangtok, Rann of Kutch and Shillong.

## The Experience

Two layers, joined by one state machine:

1. **Loader and cover**: preloader with a sound prompt, then "The INDIAN JOURNEY begins".
2. **The train** (video): a looping, photorealistic train-window video (`public/media/train-window.mp4`) carries you between stops, with captions and a `SKIP >` button.
3. **The focus pull**: arriving at a stop, the train blurs and darkens (like a camera shifting focus) while the destination page fades in over it. There is no zoom, because scaling a flat video only stretches its pixels.
4. **The destination** (HTML): a smooth-scrolling editorial page with parallax and text reveals: hero, introduction, Attractions, Local Food, Festivals, Travel Tips. Each stop uses one of three layouts.
5. **Next Stop**: the page fades out, the train comes back into focus, and the ride continues to the next stop. After the last stop, download a postcard.

Addresses follow the journey: `/` on the train, `/stop/<id>` on a destination page (for example `/stop/goa`). A link opens a destination directly, and the browser Back button goes from the page to the train. A static host needs a fallback to `index.html`. The index menu (top right) jumps to any stop.

## Run Locally

```bash
npm install
npm run dev
```

Build for production with `npm run build`.

## Media and Content

- **Train video**: `public/media/train-window.mp4`. For smooth playback keep it about 720p, H.264, 4 to 5 MB, 24 to 30 fps, with fast-start.
- **Destination media**: photographs in `public/media/<city>/` (`cover.webp`, `01.webp` to `06.webp`). A missing image is replaced by a painted placeholder.
- **Chapter copy**: all destination text lives in `src/chapters.js`. Festivals and budget/safety are `[[PLACEHOLDER]]` blocks until that content is written.
- **Audio**: `public/audio/`. Missing files stay silent.

## Code Map

| File | Purpose |
|---|---|
| `src/main.js` | Boot and wiring: builds the layers and the journey, runs the loader, cover, menu and finale |
| `src/journey.js` | The state machine and routing: which layer is on screen, and the URL |
| `src/train/TrainCanvas.js` | The train layer: ride, captions, and the focus pull to and from a destination |
| `src/destination/DestinationEditorial.js` | The destination page layer: open, close, Lenis smooth scroll, GSAP ScrollTrigger |
| `src/destination/template.js` | The HTML of one destination page |
| `src/editorial.css` | Destination page styles and the three layouts |
| `src/chapters.js` | Content for all 10 stops |
| `src/ui.js` | The index menu template |
| `src/media.js` | Painted placeholders for missing images |
| `src/fx.js` | Text splitting, magnetic buttons, the postcard |
| `src/grain.css` | One static paper layer |
| `src/style.css` | Design tokens, controls, loader, cover, train layer, menu |

Built with Vite, GSAP (with ScrollTrigger) and Lenis.
