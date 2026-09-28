# Media Guide

Every chapter needs **8 files** in `public/media/<folder>/`. Until a file exists, the site shows a painted placeholder with the missing file path, so nothing breaks.

| File | Where it appears | Format |
|---|---|---|
| `hero.mp4` | Arch in the room, train window, article video | 720p MP4 (H.264), 10 to 20 s loop, under ~5 MB, no audio needed |
| `cover.webp` | Article hero, menu card | Portrait, about 1200 x 1500 |
| `01.webp` | Left wall frame | Landscape, about 1600 wide |
| `02.webp` | Right wall frame | Landscape |
| `03.webp` | Easel (craft or food) | Landscape |
| `04.webp` | Right wall, near the door | **Portrait** |
| `05.webp` | Article section 1 | Landscape |
| `06.webp` | Article section 2 | Landscape |

## Where to find media

- **Pexels** and **Unsplash**: free photos and videos, free to use. Crediting the author is appreciated.
- **Wikimedia Commons**: check each file's licence and credit it as required.
- **Your own photos**: always the best choice for a college project.

Add a credit line for every file in `src/credits.js`. Credits appear in **Menu > Credits**.

## What to look for, per chapter

| Folder | hero.mp4 | 01 | 02 | 03 (craft/food) | 04 (portrait) | 05 / 06 |
|---|---|---|---|---|---|---|
| `srinagar` | Dal Lake shikara at dawn | Floating market | Shalimar or Nishat Bagh | Pashmina or papier-mâché | Houseboat | Lake morning, Wazwan or walnut carving |
| `manali` | Kullu valley or Beas river | Solang Valley snow | Hadimba Temple | Kullu shawl | Old Manali lane | Snow road, stone houses |
| `amritsar` | Golden Temple | Parikrama walkway | Wagah ceremony | Langar kitchen | Old city bazaar | Temple at night, kulcha |
| `jaipur` | Pink City streets | Hawa Mahal | Amber Fort | Block printing | Bazaar colours | Fort at sunrise, market |
| `agra` | Taj Mahal at sunrise | Taj from Mehtab Bagh | Agra Fort | Pietra dura inlay | Fatehpur Sikri | Taj crowds or gardens, petha |
| `goa` | Beach sunset | Palolem | Fontainhas houses | Fish curry | Old Goa church | Beach or market, bebinca |
| `munnar` | Tea hills | Tea pluckers | Nilgiri tahr | Cup of tea | Top Station view | Estate walk, spices |
| `gangtok` | Mountains or prayer flags | Rumtek Monastery | Tsomgo Lake | Momos | MG Marg | Monks, mountain road |
| `kutch` | White Rann | Rann Utsav tents | Bhunga huts | Mirror embroidery | Kala Dungar view | Full moon on salt, crafts |
| `shillong` | Pine hills or waterfall | Living root bridge | Umiam Lake | Jadoh | Live music | Double-decker bridge, rain |

## Tips

- Convert photos to `.webp` (Squoosh.app works well) to keep the site fast.
- Trim videos to a short loop and compress them (HandBrake works well).
- Keep file names exactly as listed above, in lowercase.
