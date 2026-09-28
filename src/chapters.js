// Hotspot positions in magazine-local space: cover top, cover middle, gold charm
export const HOTSPOT_POS = [[0.7, 1.0, 0.16], [-0.6, -0.4, 0.16], [0.9, -2.4, 0.36]];

const c = (name, tagline, bg, ground, cover, accent, ink, hotspots) =>
  ({ name, tagline, bg, ground, cover, accent, ink, hotspots });
const h = (title, text) => ({ title, text });

export const CHAPTERS = [
  c('Srinagar', 'Paradise on water', '#1F3B4D', '#3F6B5A', '#2E5E73', '#F2B632', '#F3E6CC',
    [h('Dal Lake', 'Shikara rides at dawn'), h('Mughal Gardens', 'Shalimar & Nishat Bagh'), h('Kahwa', 'Saffron tea on a houseboat')]),
  c('Manali', 'Where the mountains whisper', '#2B3A2E', '#4E6B3A', '#3D5A40', '#E08E2B', '#F3E6CC',
    [h('Solang Valley', 'Snow, paragliding, silence'), h('Hadimba Temple', 'Cedar forest shrine'), h('Old Manali', 'Cafés and riverside walks')]),
  c('Amritsar', 'The golden hour, forever', '#5A3A12', '#A0782E', '#C8962E', '#B5523B', '#FFF3D6',
    [h('Golden Temple', 'Harmandir Sahib at night'), h('Langar', 'The world’s biggest kitchen'), h('Wagah Border', 'The evening ceremony')]),
  c('Jaipur', 'The Pink City', '#6B2F3A', '#C0706A', '#D98A8A', '#2E3A6B', '#FBE7D6',
    [h('Hawa Mahal', 'Palace of winds'), h('Amber Fort', 'Sandstone and mirrors'), h('Block Print', 'Sanganeri textiles')]),
  c('Agra', 'A love letter in marble', '#3C3A4A', '#9E9486', '#E9E4DA', '#7A2E2E', '#3C3A4A',
    [h('Taj Mahal', 'Sunrise over the Yamuna'), h('Pietra Dura', 'Stone inlay craft'), h('Petha', 'Agra’s sweet souvenir')]),
  c('Goa', 'Sunsets & susegad', '#0F4C5C', '#D9B77A', '#E36F3C', '#1F6F6B', '#FFF1DA',
    [h('Palolem', 'Crescent beach calm'), h('Fontainhas', 'Latin quarter colours'), h('Fish Curry', 'Coconut, kokum, rice')]),
  c('Munnar', 'Rolling seas of tea', '#1E3B2C', '#3E7A4A', '#2F6B45', '#F2B632', '#E6F0D8',
    [h('Tea Estates', 'Emerald hills'), h('Eravikulam', 'Home of the Nilgiri tahr'), h('Top Station', 'Above the mist')]),
  c('Gangtok', 'Prayer flags in the clouds', '#26324F', '#5B6E8C', '#C24E3A', '#F2B632', '#F6E7C8',
    [h('Rumtek', 'Monastery chants'), h('Tsomgo Lake', 'Glacial blue at 12,000 ft'), h('MG Marg', 'Momos and mountain air')]),
  c('Rann of Kutch', 'The white desert', '#3A3F55', '#EDE7DA', '#E9E3D3', '#B5523B', '#3A3F55',
    [h('Salt Flats', 'Full moon on white earth'), h('Rann Utsav', 'Festival of tents'), h('Mirror Work', 'Kutchi embroidery')]),
  c('Shillong', 'Scotland of the East', '#1D3A3A', '#3F6A55', '#28505A', '#E08E2B', '#F2E4C4',
    [h('Root Bridges', 'Living bridges of Meghalaya'), h('Umiam Lake', 'Blue water, pine hills'), h('Music City', 'Rock and live gigs')]),
];
