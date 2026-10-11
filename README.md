# WANDERWORDS

*Ten stops. Ten stories. One India.*

An interactive, luxury digital travel magazine told as an editorial journey through Srinagar, Manali, Amritsar, Jaipur, Agra, Goa, Munnar, Gangtok, Rann of Kutch and Shillong.

## The Experience

1. **Loader**: Clean preloader with interactive sound prompt.
2. **Cover Gate**: Minimalist editorial gateway with "The INDIAN JOURNEY begins".
3. **Cinematic Train Journey**: AI-generated photorealistic train window video bridge (`public/media/train-window.mp4`) carrying travelers across landscapes with captions and a minimal `SKIP >` button.
4. **Destination Rooms**: High-end architectural 3D exhibition pavilions for each city built with Three.js, featuring ambient lighting, brass picture lights, and authentic cultural signatures.
5. **Interactive Exhibits**: Scroll to navigate through 5 exhibits per destination (hero video arch + 4 framed gallery photographs). Click any exhibit to open a high-res lightbox.
6. **Editorial Story**: Full long-form magazine article with curated photos, video exhibits, and travel notes.
7. **Design Language**: Minimalist editorial UI inspired by Miu Miu aesthetics (Work Sans & Sometype Mono typography, electric cobalt station badges, angled tape card buttons, and full-bleed viewport).
8. **Finale**: Complete the tour and download a personalized stamped postcard.

The top-right notebook menu provides instant navigation to any chapter and displays project credits. Captions (CC) and chapter replay controls are pinned to the bottom corner.

## Run Locally

```bash
npm install
npm run dev
```

Build for production with:

```bash
npm run build
```

## Media Assets & Content

- **Train Video**: Stored at `public/media/train-window.mp4` for the cinematic window view.
- **Destination Media**: High-res photographs and videos placed in `public/media/<city>/`.
- **Chapter Copy**: All destination text, history, and exhibits live in `src/chapters.js`.
- **Audio**: Ambient soundscapes and effects located in `public/audio/`.

## Code Map

| File | Purpose |
|---|---|
| `src/main.js` | App orchestration: flow state machine, video transitions, chapter lifecycle, UI events |
| `src/engine.js` | WebGL renderer, camera controller, and view management |
| `src/room.js` | Architectural 3D room pavilion, lighting, photo frames, video arches, and interactive camera movement |
| `src/chapters.js` | Curated editorial content, exhibits, and styling metadata for all 10 stops |
| `src/ui.js` | Magazine reader article, lightbox, and navigation menu templates |
| `src/media.js` | Dynamic image/video loaders with procedural fallbacks |
| `src/textures.js` | Procedural PBR textures: plaster walls, floorboards, marble inlays, and textiles |
| `src/post.js` | PostFX pipeline: color grading, bloom, subtle vignette, and exposure tuning |
| `src/grain.css` | Film grain overlay and tactile micro-textures |
| `src/style.css` | Miu Miu editorial design tokens, full-bleed layout, and component styling |

Built with Vite, Three.js, GSAP and Lenis.
