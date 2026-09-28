// All magazine content lives here. Media files go in public/media/<id>/ (see MEDIA_GUIDE.md).

// Scenery outside the train window during the intro ride
export const INTRO_BIOME = {
  sky: '#F6D9A8', ground: '#7A9A4A', hill: '#5F8A45', far: '#9FB08A',
  trees: ['broadleaf', 'palm', 'broadleaf'], density: 34, water: false, snow: false,
};

const path = (id, file) => `/media/${id}/${file}`;

// exhibits: [title, text, caption] x5 -> 0 = hero.mp4, 1-4 = 01.webp..04.webp (3 = craft/food on the easel)
// article sections use 05.webp and 06.webp
function chapter(id, name, title, tagline, look, exhibits, article) {
  return {
    id, name, title, tagline, ...look,
    coverImg: path(id, 'cover.webp'),
    exhibits: exhibits.map(([t, text, caption], k) => ({
      type: k === 0 ? 'video' : 'photo',
      src: path(id, k === 0 ? 'hero.mp4' : `0${k}.webp`),
      title: t, text, caption,
    })),
    article: {
      ...article,
      sections: article.sections.map(([t, text], k) => ({ title: t, text, img: path(id, `0${k + 5}.webp`) })),
    },
  };
}

export const CHAPTERS = [
  chapter('srinagar', 'Srinagar', 'The Floating Gardens', 'Paradise on water', {
    cover: '#2E5E73', ink: '#F3E6CC', accent: '#2E5E73',
    biome: { sky: '#BFD8E6', ground: '#6F9A5E', hill: '#557A62', far: '#8FA7B8', trees: ['poplar'], density: 26, water: true, waterZ: -55, snow: true },
    room: { wall: '#E9DCC4', floor: '#5A3A22', trim: '#3A2416', signature: 'lattice' },
  }, [
    ['Dal Lake at Dawn', 'Shikaras glide across still water as the mountains turn pink. This is how Srinagar wakes up.', 'Every morning, the lake becomes a mirror.'],
    ['The Floating Market', 'Before sunrise, farmers paddle lotus stems, greens and flowers to trade on the water.', 'A market with no ground beneath it.'],
    ['Mughal Gardens', 'Shalimar and Nishat Bagh step down the hillside in terraces of chinar trees, fountains and roses.', 'Gardens built for emperors, open to all.'],
    ['Pashmina & Papier-mâché', 'Kashmiri artisans spin feather-light pashmina and paint papier-mâché boxes by hand.', 'Craft passed down through generations.'],
    ['Houseboat Life', 'Carved cedar houseboats line Dal and Nigeen lakes, each one a floating home.', 'Tonight, you sleep on the water.'],
  ], {
    intro: 'Srinagar is a city of water and gardens, cradled by the Himalaya in the Kashmir Valley. Days here move at the pace of a paddle.',
    quote: '“If there is paradise on earth, it is here.” A Persian couplet often quoted about Kashmir.',
    sections: [
      ['A Morning on the Lake', 'Hire a shikara before sunrise to see the floating market, then drift past lotus beds and kingfishers.'],
      ['Walnut, Wool and Wazwan', 'Visit old city workshops for carved walnut wood and pashmina, then sit down to a Wazwan feast.'],
    ],
    tips: { best: 'April to October; December to February for snow', reach: 'Fly into Srinagar airport, or take the train via Katra', eat: 'Wazwan, rogan josh, kahwa', stay: 'A houseboat on Dal or Nigeen Lake' },
  }),

  chapter('manali', 'Manali', 'The Cedar Lodge', 'Where the mountains whisper', {
    cover: '#3D5A40', ink: '#F3E6CC', accent: '#3D5A40',
    biome: { sky: '#CFE1EC', ground: '#5D7F45', hill: '#3F5E3A', far: '#DDE6EC', trees: ['deodar', 'pine'], density: 40, snow: true },
    room: { wall: '#D9C3A0', floor: '#6B4A2E', trim: '#4A2E1C', signature: 'fireplace' },
  }, [
    ['Into the Kullu Valley', 'The Beas river rushes past apple orchards and cedar forests on the way to Manali.', 'The road climbs, and the air turns cold.'],
    ['Solang Valley', 'Snowfields, ropeways and paragliders, a short drive above town.', 'Winter’s playground.'],
    ['Hadimba Temple', 'A wooden shrine with tiered roofs, hidden in a forest of giant deodar cedars.', 'Built in 1553, still standing among the trees.'],
    ['Himachali Wool', 'Hand-woven Kullu shawls in bold geometric borders keep the valley warm.', 'Every border tells a story.'],
    ['Old Manali', 'Riverside cafés, guesthouses and slow mornings by the Manalsu stream.', 'Where travellers stay longer than planned.'],
  ], {
    intro: 'Manali sits at the top of the Kullu Valley, where the Beas river meets snow peaks and cedar forests.',
    quote: '“The mountains are calling and I must go.” John Muir',
    sections: [
      ['Above the Clouds', 'Drive towards Solang Valley and the Atal Tunnel for snow, even when the town is green.'],
      ['Cedar and Stone', 'Wander old village lanes of stone-and-timber houses and apple orchards.'],
    ],
    tips: { best: 'March to June; December to February for snow', reach: 'Fly to Bhuntar (Kullu) airport, or take an overnight bus from Delhi', eat: 'Siddu, trout, Himachali dham', stay: 'Wooden cottages in Old Manali' },
  }),

  chapter('amritsar', 'Amritsar', 'The Golden Hour', 'The golden hour, forever', {
    cover: '#C8962E', ink: '#FFF3D6', accent: '#C8962E',
    biome: { sky: '#F2D7A6', ground: '#B59A5A', hill: '#A58A55', far: '#C9B48A', trees: ['broadleaf'], density: 20 },
    room: { wall: '#F1E7D6', floor: '#B89A6E', trim: '#8A6A2E', signature: 'goldLamps' },
  }, [
    ['The Golden Temple', 'Harmandir Sahib glows on its sacred pool, the Amrit Sarovar, from dawn until late at night.', 'Gold on water.'],
    ['The Parikrama', 'Pilgrims walk barefoot on cool marble around the sarovar, listening to live kirtan.', 'Every step is a prayer.'],
    ['Wagah Border', 'At sunset, a flag ceremony of high kicks, drums and cheering crowds.', 'Two nations, one evening ritual.'],
    ['The Langar', 'A community kitchen that serves free meals to everyone who visits, every single day.', 'No one leaves hungry.'],
    ['Old City Bazaars', 'Narrow lanes of phulkari embroidery, papad, spices and sizzling kulchas.', 'Follow the smell of butter.'],
  ], {
    intro: 'Amritsar is the spiritual heart of Sikhism and one of the warmest welcomes in India.',
    quote: '“Recognise the whole human race as one.” Guru Gobind Singh',
    sections: [
      ['Night at the Temple', 'Return after dark, when the gold reflects in the water and the crowds grow quiet.'],
      ['Eat Like Amritsar', 'Try a stuffed Amritsari kulcha with chole, and a tall glass of lassi.'],
    ],
    tips: { best: 'October to March', reach: 'Amritsar airport or Amritsar Junction railway station', eat: 'Amritsari kulcha, lassi, langar', stay: 'Heritage hotels near the Golden Temple' },
  }),

  chapter('jaipur', 'Jaipur', 'The Palace of Winds', 'The Pink City', {
    cover: '#D98A8A', ink: '#FBE7D6', accent: '#C0605A',
    biome: { sky: '#F5C9A8', ground: '#C99A6B', hill: '#B07A55', far: '#C98E6E', trees: ['broadleaf'], density: 12 },
    room: { wall: '#E7A98E', floor: '#8A5A3C', trim: '#8A3A2A', signature: 'jharokha' },
  }, [
    ['The Pink City', 'Jaipur’s old city glows terracotta pink, famously painted to welcome a royal visitor in 1876.', 'A city painted to say welcome.'],
    ['Hawa Mahal', 'A honeycomb of small windows built so royal women could watch street life unseen.', 'Hundreds of windows, one breeze.'],
    ['Amber Fort', 'Honey-coloured ramparts and a hall of mirrors high above Maota Lake.', 'One candle, a thousand reflections.'],
    ['Block Printing', 'Artisans stamp fabric by hand with carved wooden blocks and natural dyes.', 'Pattern by pattern.'],
    ['Bazaar Colours', 'Johari and Bapu Bazaars overflow with bangles, mojris and gemstones.', 'Bargaining is part of the fun.'],
  ], {
    intro: 'Jaipur, the capital of Rajasthan, is a planned city of palaces, forts and colour.',
    quote: '“The Pink City does not whisper. It celebrates.” WanderWords',
    sections: [
      ['Forts at Sunrise', 'Reach Amber Fort early to beat the heat and the crowds.'],
      ['Markets and Mojris', 'Spend the evening in the old city bazaars, then try dal baati churma.'],
    ],
    tips: { best: 'October to March', reach: 'Jaipur airport or Jaipur Junction', eat: 'Dal baati churma, pyaaz kachori, ghevar', stay: 'A restored haveli in the old city' },
  }),

  chapter('agra', 'Agra', 'The Marble Atelier', 'A love letter in marble', {
    cover: '#E9E4DA', ink: '#3C3A4A', accent: '#7A2E2E',
    biome: { sky: '#F4DCC4', ground: '#9FA36A', hill: '#A7A07F', far: '#CFC4B0', trees: ['broadleaf'], density: 22, water: true, waterZ: -80 },
    room: { wall: '#F2EEE6', floor: '#9E8C74', trim: '#6E6252', signature: 'marbleSlabs' },
  }, [
    ['The Taj at Sunrise', 'Shah Jahan’s white marble mausoleum for Mumtaz Mahal changes colour with the light.', 'Pink at dawn, gold at dusk.'],
    ['Mehtab Bagh', 'Across the Yamuna, the moonlight garden frames the Taj from the other side.', 'The quietest view in Agra.'],
    ['Agra Fort', 'A red sandstone fortress of palaces, courtyards and marble pavilions.', 'Where the story of the Taj began.'],
    ['Pietra Dura', 'Craftsmen cut semi-precious stones and set them into marble, just as they did for the Taj.', 'Flowers made of stone.'],
    ['Fatehpur Sikri', 'Akbar’s red sandstone capital, a short drive from Agra.', 'A city left to the wind.'],
  ], {
    intro: 'Agra, on the banks of the Yamuna, was a Mughal capital and is home to three UNESCO World Heritage Sites.',
    quote: '“A teardrop on the cheek of time.” Rabindranath Tagore',
    sections: [
      ['Beat the Crowds', 'Enter at opening time, and remember the Taj Mahal is closed on Fridays.'],
      ['Sweet Souvenirs', 'Take home petha, and try bedai with jalebi for breakfast.'],
    ],
    tips: { best: 'October to March', reach: 'Gatimaan Express or the Yamuna Expressway from Delhi', eat: 'Petha, bedai and jalebi, Mughlai curries', stay: 'Hotels in Taj Ganj' },
  }),

  chapter('goa', 'Goa', 'The Susegad Verandah', 'Sunsets & susegad', {
    cover: '#E36F3C', ink: '#FFF1DA', accent: '#1F4E8C',
    biome: { sky: '#FFD2A1', ground: '#E3C48E', hill: '#6E8F4E', far: '#89A67A', trees: ['palm'], density: 34, water: true, waterZ: -90 },
    room: { wall: '#F4E9D2', floor: '#7A4E30', trim: '#1F4E8C', signature: 'tiles' },
  }, [
    ['Golden Coast', 'Palm-lined beaches, fishing boats and sunsets that stop conversations.', 'Susegad means taking life slow.'],
    ['Palolem', 'A crescent of soft sand, calm water and beach huts in South Goa.', 'The bay that rocks you to sleep.'],
    ['Fontainhas', 'Panaji’s Latin quarter of yellow, blue and green Portuguese-era houses.', 'Every door a different colour.'],
    ['Goan Fish Curry', 'Coconut, kokum and the catch of the day, served with rice.', 'Lunch, Goan style.'],
    ['Old Goa Churches', 'The Basilica of Bom Jesus and Se Cathedral, part of a UNESCO World Heritage Site.', 'Faith in whitewash and laterite.'],
  ], {
    intro: 'Goa is India’s smallest state, where Konkani, Portuguese and beach culture meet.',
    quote: '“Susegad.” The Goan art of relaxed contentment.',
    sections: [
      ['North or South?', 'Head north for markets and nightlife, and south for quiet bays.'],
      ['Taste of Goa', 'Finish every meal with bebinca, a layered coconut dessert.'],
    ],
    tips: { best: 'November to February', reach: 'Dabolim or Mopa airport, Madgaon or Thivim station', eat: 'Fish curry rice, xacuti, bebinca', stay: 'Beach huts in South Goa or a Fontainhas guesthouse' },
  }),

  chapter('munnar', 'Munnar', 'The Tea Tasting Room', 'Rolling seas of tea', {
    cover: '#2F6B45', ink: '#E6F0D8', accent: '#2F6B45',
    biome: { sky: '#D8E6DA', ground: '#3E7A4A', hill: '#2F6B45', far: '#9DB9A6', trees: ['tea'], density: 60 },
    room: { wall: '#E6E1C8', floor: '#5A3A22', trim: '#2F4B35', signature: 'teaChests' },
  }, [
    ['Seas of Tea', 'Tea bushes carpet the hills of the Western Ghats in endless green rows.', 'Green as far as you can see.'],
    ['The Pluckers', 'Tea is still plucked by hand, two leaves and a bud at a time.', 'Two leaves and a bud.'],
    ['Eravikulam National Park', 'Home of the rare Nilgiri tahr and the neelakurinji flower that blooms once every twelve years.', 'Rare mountain goats on misty slopes.'],
    ['Fresh Brew', 'Estate factories dry and roll the leaves. Taste the difference at a tea museum.', 'From leaf to cup.'],
    ['Top Station', 'A viewpoint where you look down on clouds drifting across the valleys.', 'Above the clouds.'],
  ], {
    intro: 'Munnar is a hill station in Kerala, named for the three mountain streams that meet among its tea estates.',
    quote: '“There is something in the nature of tea that leads us into a world of quiet contemplation.” Lin Yutang',
    sections: [
      ['Walk the Estates', 'Take a guided walk through the tea rows in the cool morning mist.'],
      ['Spice Trail', 'Stop at spice gardens for cardamom, pepper and cinnamon on the way down.'],
    ],
    tips: { best: 'September to March', reach: 'Cochin airport, then about 3 to 4 hours by road', eat: 'Appam and stew, Kerala sadya, fresh tea', stay: 'A tea estate bungalow' },
  }),

  chapter('gangtok', 'Gangtok', 'The Monastery Library', 'Prayer flags in the clouds', {
    cover: '#C24E3A', ink: '#F6E7C8', accent: '#C24E3A',
    biome: { sky: '#C9D6E6', ground: '#4F6E55', hill: '#3E5A56', far: '#EEF2F6', trees: ['deodar', 'pine'], density: 34, snow: true },
    room: { wall: '#E8D5B0', floor: '#4A2E1C', trim: '#7A2E2E', signature: 'prayerWheels' },
  }, [
    ['City in the Clouds', 'Gangtok clings to a ridge with views of Kanchenjunga, the world’s third highest mountain.', 'Mountains on the horizon.'],
    ['Rumtek Monastery', 'Monks chant beneath colourful murals in one of Sikkim’s largest monasteries.', 'Chants carry through the valley.'],
    ['Tsomgo Lake', 'A glacial lake high in the mountains that changes colour with the seasons.', 'Frozen in winter, blue in spring.'],
    ['Momos & Thukpa', 'Steaming dumplings and noodle soup warm up every chilly evening.', 'Comfort food of the hills.'],
    ['MG Marg', 'A clean, car-free promenade of cafés, shops and evening strolls.', 'The city’s living room.'],
  ], {
    intro: 'Gangtok, the capital of Sikkim, mixes Buddhist monasteries, mountain views and friendly cafés.',
    quote: '“Om mani padme hum.” The mantra on every prayer wheel.',
    sections: [
      ['Permits and Passes', 'Tsomgo Lake and Nathu La need permits, arranged through registered tour operators.'],
      ['Monastery Mornings', 'Arrive early at Rumtek or Enchey for morning prayers.'],
    ],
    tips: { best: 'March to May, October to December', reach: 'Pakyong airport, or Bagdogra airport and NJP station, then by road', eat: 'Momos, thukpa, gundruk', stay: 'Homestays and hotels near MG Marg' },
  }),

  chapter('kutch', 'Rann of Kutch', 'The Mirror House', 'The white desert', {
    cover: '#E9E3D3', ink: '#3A3F55', accent: '#B5523B',
    biome: { sky: '#E7DDF0', ground: '#F1ECE2', hill: '#E6DED0', far: '#D8CFC2', trees: [], density: 0 },
    room: { wall: '#F2EBDD', floor: '#A8906E', trim: '#8A3A2A', signature: 'mirrors' },
  }, [
    ['The White Rann', 'A vast salt desert that stretches to the horizon, glowing silver under the full moon.', 'White as far as you can see.'],
    ['Rann Utsav', 'A winter festival of tents, folk music, dance and camel rides on the desert.', 'The desert comes alive.'],
    ['Bhunga Villages', 'Round mud houses with conical roofs, decorated with mud and mirror work.', 'Built to survive desert heat.'],
    ['Kutchi Embroidery', 'Women stitch intricate patterns with tiny mirrors that catch the sun.', 'Stitches that sparkle.'],
    ['Kala Dungar', 'The highest point in Kutch, with sweeping views over the white desert.', 'The desert from above.'],
  ], {
    intro: 'The Great Rann of Kutch in Gujarat is one of the largest salt deserts in the world.',
    quote: '“Kutch nahi dekha, toh kuch nahi dekha.” If you haven’t seen Kutch, you haven’t seen anything.',
    sections: [
      ['Moonlight on Salt', 'Plan your visit around a full moon night for the most magical views.'],
      ['Villages of Craft', 'Visit Hodka and Bhujodi for embroidery, weaving and mud-mirror work.'],
    ],
    tips: { best: 'November to February', reach: 'Bhuj airport or station, then by road to Dhordo (entry permit needed)', eat: 'Kutchi dabeli, Gujarati thali', stay: 'Rann Utsav tent city or a village bhunga' },
  }),

  chapter('shillong', 'Shillong', 'The Rock Café', 'Scotland of the East', {
    cover: '#28505A', ink: '#F2E4C4', accent: '#28505A',
    biome: { sky: '#C6D9D6', ground: '#3F6A55', hill: '#2E5549', far: '#7F9C96', trees: ['pine'], density: 34, water: true, waterZ: -55 },
    room: { wall: '#CFC3AE', floor: '#4E3524', trim: '#28505A', signature: 'records' },
  }, [
    ['Hills of Meghalaya', 'Pine forests, rolling hills and waterfalls in the abode of clouds.', 'Welcome to the abode of clouds.'],
    ['Living Root Bridges', 'Khasi communities guide rubber-tree roots across streams to grow bridges over many years.', 'Bridges that are alive.'],
    ['Umiam Lake', 'A wide blue reservoir ringed by pine hills, perfect at sunset.', 'Blue water, green hills.'],
    ['Jadoh & Street Food', 'Khasi rice cooked with meat and spices, sold at busy food stalls.', 'Taste of the Khasi hills.'],
    ['Live Music', 'Shillong’s cafés and gigs keep its rock and blues tradition alive.', 'The city that sings.'],
  ], {
    intro: 'Shillong, the capital of Meghalaya, is known for its pine hills, colonial charm and love of music.',
    quote: '“Meghalaya: the abode of clouds.”',
    sections: [
      ['The Double-Decker Bridge', 'Hike the steps down to Nongriat near Sohra to see the famous double-decker root bridge.'],
      ['Rainy Days', 'Nearby Sohra is one of the wettest places on Earth, so pack a raincoat.'],
    ],
    tips: { best: 'October to May', reach: 'Guwahati airport, then about 3 hours by road', eat: 'Jadoh, dohneiiong, momos', stay: 'Hotels near Police Bazaar or homestays in Sohra' },
  }),
];
