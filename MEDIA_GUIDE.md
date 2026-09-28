# Media Guide

Each chapter uses the files below in `public/media/<folder>/`. Until a file exists the site shows a placeholder, so nothing breaks.

| File | Where it appears | Format |
|---|---|---|
| `scene.webp` | **The chapter itself**: the cinematic scene behind the title, and where the ritual happens | 2560 x 1440 (16:9), WebP quality ~85, under ~800 KB. The glowing focal object must sit **exactly in the centre**, with empty space around it |
| `scene-depth.webp` | Optional depth map for parallax | Grayscale version of the same framing: white = near, black = far |
| `hero.mp4` | Shot 1 (full screen), train window, article video | 720p MP4 (H.264), 10 to 20 s loop, under ~5 MB, no audio needed |
| `01.webp` to `04.webp` | Shots 2 to 5 (full screen, slow push-in) | Landscape, about 1920 wide (shots are cropped to fill the screen) |
| `cover.webp` | Article hero, menu card | Portrait, about 1200 x 1500 |
| `05.webp`, `06.webp` | Article sections | Landscape |

## Scene art

Every city has its own composition built around one glowing object in the centre of the frame. That object is where the ritual happens (you ripple the lotus, light the diya, raise the moon), so the scene itself is the button.

The code adds the motion: depth parallax, god rays, bloom, rippling water, haze, drifting petals or snow, and blurred specks in front of the lens. Light, colour, waterline and particles per city are set in `src/scenes.js`.

**Where to make it:** any AI image tool works (for example Midjourney, Leonardo.ai, Adobe Firefly, Ideogram, or ChatGPT image generation). Check each tool's licence for commercial or college use.

**Keep the set consistent:** generate Srinagar first, then use it as the style reference for the other nine. Use the same model and settings for all ten, and reuse the seed if your tool supports it.

**Depth map (optional):** run your `scene.webp` through a free depth-estimation tool (for example "Depth Anything" on Hugging Face) and save the result as `scene-depth.webp`. Without it, depth is estimated from height in the frame.

### Shared style (start every prompt with this)

> Cinematic surreal Renaissance landscape painting, dreamlike and ethereal, soft pastel palette of sky blue, blush pink, sage green and lavender, high-key lighting, volumetric god rays from the upper right, gentle bloom and lens haze, atmospheric perspective with a hazy soft-focus background, sharp detailed midground, oversized out-of-focus petals drifting in the extreme foreground, calm reflective water in the lower third, oil-painting texture with fine film grain, symmetrical central composition with a single glowing focal point exactly at the centre of the frame, 16:9

**Negative prompt:** text, watermark, logo, border, frame, close-up faces, distorted architecture, neon oversaturation, cartoon, low detail, cluttered centre

### City prompts (add after the shared style)

| Folder | Prompt |
|---|---|
| `srinagar` | Dal Lake at dawn, mirror-still water, a lone carved wooden shikara at the centre with a glowing pink lotus on its bow, autumn chinar trees in red and gold at the edges, snowy Pir Panjal peaks dissolving into mist, lotus petals drifting in the foreground |
| `manali` | A snow-laden deodar forest clearing at lavender dawn, the carved wooden pagoda roof of Hadimba Temple rising from mist behind, a single glowing brass lantern on a snowy stone at the centre, soft snowflakes in the foreground |
| `amritsar` | The Golden Temple floating on the Amrit Sarovar at blue hour with a perfect reflection, a single lit clay diya floating on the water at the centre glowing amber, the white marble causeway as leading lines, marigold petals in the foreground |
| `jaipur` | The pink honeycomb facade of Hawa Mahal rising through soft dusty-rose haze, one carved jharokha window at the centre with closed wooden shutters glowing warmly from within, bougainvillea and pigeons, a rose-gold sky |
| `agra` | The Taj Mahal distant across the Yamuna in pastel dawn mist, and at the centre a floating white marble disc with an unfinished pietra dura flower inlay glowing turquoise and carnelian, reflected in still water, rose petals in the foreground |
| `goa` | A tranquil palm-fringed bay at golden hour, a huge soft sun touching the horizon of a glassy sea at the centre, a lone wooden fishing boat in silhouette, coconut fronds framing the edges, a peach and coral palette |
| `munnar` | Endless rolling tea hills like waves of green velvet in morning mist, and at the centre a single tea sprig (two leaves and a bud) glowing and floating in a beam of light, dew drops, blurred tea leaves in the foreground |
| `gangtok` | A Himalayan monastery ridge above a sea of clouds with Kanchenjunga glowing pink at sunrise, a golden prayer wheel floating in a beam of light at the centre, prayer flags arcing as leading lines, snow drifting in the foreground |
| `kutch` | The endless white salt desert under a lavender pre-dawn sky, an enormous full moon resting on the horizon at the centre and reflected in a thin film of water over the salt, hexagonal salt-crust patterns as leading lines, sparkling glitter |
| `shillong` | Misty pine hills with a waterfall falling into the blue Umiam lake, a living root bridge arching over a stream, a vinyl record floating upright at the centre in a beam of light like a halo, fireflies, a soft teal and moss palette |

### Tuning a scene to your image

Open `src/scenes.js` and adjust the city's entry:

- `water`: height of the waterline in your image (0 = bottom, 1 = top, 0 = no water). Everything below it ripples.
- `rays`: where the light comes from (x 0 to 1 left to right, y 0 to 1 bottom to top).
- `glow`, `haze`, `bokeh`: colours of the focal glow, the air, and the blurred specks near the lens.
- `particles`: `lotus`, `petals`, `rose`, `marigold`, `tea`, `snow`, `dust`, `fireflies`, `glitter` or `mist`.

## Sound

All files are optional and go in `public/audio/`. A missing file simply stays silent.

| File | When it plays |
|---|---|
| `ambient.mp3` | Journey bed: loader, opening, train rides, finale (looped) |
| `<folder>.mp3` (for example `srinagar.mp3`) | That city's ambient bed while you are in the chapter (looped, crossfaded). Falls back to `ambient.mp3` |
| `<folder>-swell.mp3` | The swell when you complete that city's ritual. Falls back to `swell.mp3` |
| `swell.mp3` | Generic ritual swell |
| `whoosh.mp3`, `punch.mp3`, `tear.mp3`, `stamp.mp3` | Transitions, ticket punch, postcard tear, stamp |

Ideas for city beds: lapping water and oars (Srinagar), wind in cedars (Manali), distant kirtan (Amritsar), a far-off sarangi (Jaipur), morning birds by the river (Agra), slow surf (Goa), mist and birdsong (Munnar), monastery horns and bells (Gangtok), desert wind (Kutch), rain and a soft guitar (Shillong). Keep loops seamless, around 30 to 60 s, 128 kbps.

Freesound.org (check each file's CC licence) and Pixabay audio are good sources. Credit every file in `src/credits.js`.

## Where to find photos and videos

- **Pexels** and **Unsplash**: free photos and videos. Crediting the author is appreciated.
- **Wikimedia Commons**: check each file's licence and credit it as required.
- **Your own photos**: always the best choice for a college project.

Add a credit line for every file in `src/credits.js`. Credits appear in **Menu > Credits**.

## What to look for, per chapter

| Folder | hero.mp4 | 01 | 02 | 03 | 04 | 05 / 06 |
|---|---|---|---|---|---|---|
| `srinagar` | Dal Lake shikara at dawn | Floating market | Shalimar or Nishat Bagh | Pashmina or papier-mâché | Houseboat | Lake morning, Wazwan or walnut carving |
| `manali` | Kullu valley or Beas river | Solang Valley snow | Hadimba Temple | Kullu shawl | Old Manali lane | Snow road, stone houses |
| `amritsar` | Golden Temple | Parikrama walkway | Wagah ceremony | Langar kitchen | Old city bazaar | Temple at night, kulcha |
| `jaipur` | Pink City streets | Hawa Mahal | Amber Fort | Block printing | Bazaar colours | Fort at sunrise, market |
| `agra` | Taj Mahal at sunrise | Taj from Mehtab Bagh | Agra Fort | Pietra dura inlay | Fatehpur Sikri | Taj gardens, petha |
| `goa` | Beach sunset | Palolem | Fontainhas houses | Fish curry | Old Goa church | Beach or market, bebinca |
| `munnar` | Tea hills | Tea pluckers | Nilgiri tahr | Cup of tea | Top Station view | Estate walk, spices |
| `gangtok` | Mountains or prayer flags | Rumtek Monastery | Tsomgo Lake | Momos | MG Marg | Monks, mountain road |
| `kutch` | White Rann | Rann Utsav tents | Bhunga huts | Mirror embroidery | Kala Dungar view | Full moon on salt, crafts |
| `shillong` | Pine hills or waterfall | Living root bridge | Umiam Lake | Jadoh | Live music | Double-decker bridge, rain |

## Tips

- Convert images to `.webp` (Squoosh.app works well) to keep the site fast.
- Trim videos to a short loop and compress them (HandBrake works well).
- Keep file names exactly as listed above, in lowercase.
