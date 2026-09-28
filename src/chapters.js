// Scenery outside the window during the automatic intro ride
export const INTRO_BIOME = {
  sky: '#F6D9A8', ground: '#7A9A4A', hill: '#5F8A45', far: '#9FB08A',
  trees: ['broadleaf', 'palm', 'broadleaf'], density: 34, water: false, snow: false,
};

const ch = (name, tagline, look, landmark, cover, ink, stories) =>
  ({ name, tagline, ...look, landmark, cover, ink, accent: '#F2B632', stories });
const s = (title, text) => ({ title, text });

export const CHAPTERS = [
  ch('Srinagar', 'Paradise on water',
    { sky: '#BFD8E6', ground: '#6F9A5E', hill: '#557A62', far: '#8FA7B8', trees: ['poplar'], density: 26, water: true, waterZ: -55, snow: true },
    'houseboat', '#2E5E73', '#F3E6CC', [
      s('Dal Lake', 'Glide past floating markets on a painted shikara as the mist lifts off the water at dawn.'),
      s('Mughal Gardens', 'Shalimar and Nishat Bagh step down the hills in terraces of chinar trees, fountains and roses.'),
      s('Kahwa', 'Warm up on a houseboat deck with saffron kahwa, almonds and a view of the mountains.'),
    ]),
  ch('Manali', 'Where the mountains whisper',
    { sky: '#CFE1EC', ground: '#5D7F45', hill: '#3F5E3A', far: '#DDE6EC', trees: ['deodar', 'pine'], density: 40, snow: true },
    'pagoda', '#3D5A40', '#F3E6CC', [
      s('Solang Valley', 'Snowfields, paragliders and silence, a short drive above town.'),
      s('Hadimba Temple', 'A wooden shrine with tiered roofs, hidden in a forest of giant cedars.'),
      s('Old Manali', 'Riverside cafés, apple orchards and slow mornings by the stream.'),
    ]),
  ch('Amritsar', 'The golden hour, forever',
    { sky: '#F2D7A6', ground: '#B59A5A', hill: '#A58A55', far: '#C9B48A', trees: ['broadleaf'], density: 20 },
    'goldenTemple', '#C8962E', '#FFF3D6', [
      s('Golden Temple', 'Harmandir Sahib glows on its sacred pool, most magical after dark.'),
      s('Langar', 'Volunteers serve free meals to tens of thousands of visitors every day, open to everyone.'),
      s('Wagah Border', 'An evening flag ceremony full of high kicks, drums and cheering crowds.'),
    ]),
  ch('Jaipur', 'The Pink City',
    { sky: '#F5C9A8', ground: '#C99A6B', hill: '#B07A55', far: '#C98E6E', trees: ['broadleaf'], density: 12 },
    'hawaMahal', '#D98A8A', '#FBE7D6', [
      s('Hawa Mahal', 'The Palace of Winds, a honeycomb of small windows built so royal women could watch the street unseen.'),
      s('Amber Fort', 'Honey-coloured ramparts and a hall of mirrors high above Maota Lake.'),
      s('Block Print', 'Sanganeri artisans stamp textiles by hand with carved wooden blocks.'),
    ]),
  ch('Agra', 'A love letter in marble',
    { sky: '#F4DCC4', ground: '#9FA36A', hill: '#A7A07F', far: '#CFC4B0', trees: ['broadleaf'], density: 22, water: true, waterZ: -80 },
    'taj', '#E9E4DA', '#3C3A4A', [
      s('Taj Mahal', 'Shah Jahan’s marble tribute to Mumtaz Mahal, pink at sunrise and gold at dusk.'),
      s('Pietra Dura', 'Semi-precious stones inlaid into marble, a craft still practised in local workshops.'),
      s('Petha', 'Translucent sweets made from ash gourd, Agra’s favourite souvenir.'),
    ]),
  ch('Goa', 'Sunsets & susegad',
    { sky: '#FFD2A1', ground: '#E3C48E', hill: '#6E8F4E', far: '#89A67A', trees: ['palm'], density: 34, water: true, waterZ: -90 },
    'church', '#E36F3C', '#FFF1DA', [
      s('Palolem', 'A crescent of soft sand, calm water and palm-shaded beach huts.'),
      s('Fontainhas', 'Panaji’s Latin quarter of yellow, blue and green Portuguese-era houses.'),
      s('Fish Curry', 'Coconut, kokum and the fresh catch of the day, served with rice by the sea.'),
    ]),
  ch('Munnar', 'Rolling seas of tea',
    { sky: '#D8E6DA', ground: '#3E7A4A', hill: '#2F6B45', far: '#9DB9A6', trees: ['tea'], density: 60 },
    'teaHut', '#2F6B45', '#E6F0D8', [
      s('Tea Estates', 'Endless emerald rows of tea clipped into the hills of the Western Ghats.'),
      s('Eravikulam', 'A national park and home of the rare Nilgiri tahr.'),
      s('Top Station', 'A viewpoint where you look down on clouds drifting across the valleys.'),
    ]),
  ch('Gangtok', 'Prayer flags in the clouds',
    { sky: '#C9D6E6', ground: '#4F6E55', hill: '#3E5A56', far: '#EEF2F6', trees: ['deodar', 'pine'], density: 34, snow: true },
    'monastery', '#C24E3A', '#F6E7C8', [
      s('Rumtek', 'Monks chant in a monastery wrapped in prayer flags and mountain mist.'),
      s('Tsomgo Lake', 'A glacial lake high in the mountains that changes colour with the seasons.'),
      s('MG Marg', 'A walking street of cafés, momos and views of Kanchenjunga.'),
    ]),
  ch('Rann of Kutch', 'The white desert',
    { sky: '#E7DDF0', ground: '#F1ECE2', hill: '#E6DED0', far: '#D8CFC2', trees: [], density: 0 },
    'bhunga', '#E9E3D3', '#3A3F55', [
      s('Salt Flats', 'Miles of white salt that glow silver under the full moon.'),
      s('Rann Utsav', 'A winter festival of tents, folk music and camel rides on the desert.'),
      s('Mirror Work', 'Kutchi embroidery stitched with tiny mirrors that catch the sun.'),
    ]),
  ch('Shillong', 'Scotland of the East',
    { sky: '#C6D9D6', ground: '#3F6A55', hill: '#2E5549', far: '#7F9C96', trees: ['pine'], density: 34, water: true, waterZ: -55 },
    'rootBridge', '#28505A', '#F2E4C4', [
      s('Root Bridges', 'Bridges grown from living tree roots by Khasi communities.'),
      s('Umiam Lake', 'A wide blue reservoir ringed by pine hills, perfect at sunset.'),
      s('Music City', 'A thriving rock and live-music scene in the hills of Meghalaya.'),
    ]),
];
