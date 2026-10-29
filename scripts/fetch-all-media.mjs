import fs from 'fs';
import path from 'path';
import { searchWikiImage, downloadFile, MEDIA_ROOT } from './media-utils.js';

const DESTINATIONS = [
  {
    id: 'srinagar',
    name: 'Srinagar',
    items: [
      { file: 'cover.webp', width: 1200, queries: ['Dal Lake shikara morning Srinagar', 'Dal Lake Srinagar', 'Kashmir Dal Lake'] },
      // 01, 02, 03 already exist
      { file: '04.webp', width: 1200, queries: ['Houseboat Dal Lake Srinagar', 'Houseboat Srinagar Kashmir', 'Dal Lake Houseboat'] },
      { file: '05.webp', width: 1600, queries: ['Dal Lake lotus Srinagar', 'Nigeen Lake Srinagar Kashmir', 'Srinagar Kashmir landscape'] },
      { file: '06.webp', width: 1600, queries: ['Kashmiri Wazwan Rogan Josh', 'Kashmiri Wazwan', 'Rogan Josh Kashmir food'] },
    ],
  },
  {
    id: 'manali',
    name: 'Manali',
    items: [
      { file: 'cover.webp', width: 1200, queries: ['Solang Valley Manali snow', 'Manali Himachal Pradesh view', 'Kullu Valley Himachal'] },
      { file: '01.webp', width: 1600, queries: ['Beas River Kullu Valley', 'Beas River Manali', 'Beas Valley Palchan Kullu'] },
      { file: '02.webp', width: 1600, queries: ['Solang Valley Manali', 'Solang Valley snow Himachal', 'Rohtang Pass Solang'] },
      { file: '03.webp', width: 1600, queries: ['Hidimba Devi Temple Dhungri Manali', 'Hadimba Temple Manali', 'Hidimba Devi Temple'] },
      { file: '04.webp', width: 1200, queries: ['Kullu traditional dress shawl Himachal', 'Himachali dress weaving', 'Himachal traditional wool'] },
      { file: '05.webp', width: 1600, queries: ['Rohtang Pass snow mountain Himachal', 'Atal Tunnel Rohtang', 'Rohtang Pass road'] },
      { file: '06.webp', width: 1600, queries: ['Kullvi Siddu Himachal Pradesh', 'Siddu dish Himachal Pradesh', 'Himachali dham food'] },
    ],
  },
  {
    id: 'amritsar',
    name: 'Amritsar',
    items: [
      { file: 'cover.webp', width: 1200, queries: ['Golden Temple of Amritsar night', 'Harmandir Sahib night illumination', 'Golden Temple Amritsar evening'] },
      { file: '01.webp', width: 1600, queries: ['The Golden Temple of Amritsar', 'Harmandir Sahib Golden Temple Sarovar', 'Amrit Sarovar Golden Temple'] },
      { file: '02.webp', width: 1600, queries: ['Parikrama Golden Temple Amritsar', 'Golden Temple Amritsar parikrama walkway', 'Harmandir Sahib complex walkway'] },
      { file: '03.webp', width: 1600, queries: ['Wagah Border ceremony retreat SAARC', 'Wagah Border flag lowering drummers', 'Wagah Border ceremony'] },
      { file: '04.webp', width: 1200, queries: ['Langar Golden Temple community kitchen', 'Langar Sikhism kitchen roti', 'Langar Amritsar'] },
      { file: '05.webp', width: 1600, queries: ['Golden Temple Amritsar reflection Sarovar', 'Harmandir Sahib illuminated', 'Golden Temple night view'] },
      { file: '06.webp', width: 1600, queries: ['Amritsari Kulcha food', 'Amritsari kulcha chole', 'Chole kulche Punjab'] },
    ],
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    items: [
      { file: 'cover.webp', width: 1200, queries: ['East facade Hawa Mahal Jaipur', 'Hawa Mahal Palace of Winds front', 'Hawa Mahal Jaipur facade'] },
      { file: '01.webp', width: 1600, queries: ['City Palace Jaipur courtyard', 'Jaipur Pink City street market', 'Jaipur architecture Pink City'] },
      { file: '02.webp', width: 1600, queries: ['Hawa Mahal Jaipur from street', 'Hawa Mahal windows Jaipur', 'Hawa Mahal Palace'] },
      { file: '03.webp', width: 1600, queries: ['Fort Amber Amer Jaipur Maota Lake', 'Amber Fort Amer Jaipur', 'Amber Palace Amer'] },
      { file: '04.webp', width: 1200, queries: ['Block printing Bagru Jaipur textile', 'Woodblock printing India textile artisan', 'Block printed fabric Rajasthan'] },
      { file: '05.webp', width: 1600, queries: ['Nahargarh Fort sunrise Jaipur', 'Jaipur city view Nahargarh', 'Amber Fort walls ramparts'] },
      { file: '06.webp', width: 1600, queries: ['Dal Baati Churma Rajasthani', 'Dal Baati Churma', 'Rajasthani thali food'] },
    ],
  },
  {
    id: 'agra',
    name: 'Agra',
    items: [
      { file: 'cover.webp', width: 1200, queries: ['Taj Mahal Edited sunrise marble', 'Taj Mahal Agra sunrise', 'Taj Mahal front reflection'] },
      { file: '01.webp', width: 1600, queries: ['Taj Mahal in India at sunset crop', 'Taj Mahal Yamuna morning', 'Taj Mahal Agra mausoleum'] },
      { file: '02.webp', width: 1600, queries: ['Taj Mahal Mehtab Bagh Yamuna', 'Mehtab Bagh Taj Mahal view', 'Taj Mahal across Yamuna'] },
      { file: '03.webp', width: 1600, queries: ['Agra Fort red sandstone Jahangiri', 'Agra Fort Diwan-i-Am', 'Agra Fort walls'] },
      { file: '04.webp', width: 1200, queries: ['Pietra dura marble inlay Agra artisan', 'Marble inlay work Agra floral', 'Pietra dura craft Agra'] },
      { file: '05.webp', width: 1600, queries: ['Fatehpur Sikri Buland Darwaza', 'Fatehpur Sikri Panch Mahal', 'Fatehpur Sikri red sandstone'] },
      { file: '06.webp', width: 1600, queries: ['Agra Petha sweet', 'Petha sweet pumpkin India', 'Bedai jalebi breakfast Agra'] },
    ],
  },
  {
    id: 'goa',
    name: 'Goa',
    items: [
      { file: 'cover.webp', width: 1200, queries: ['Goa beach sunset palms Arabian', 'Sunset in Goa beach palms', 'Palolem sunset Goa'] },
      { file: '01.webp', width: 1600, queries: ['Goa beach sea waves golden sand', 'Anjuna Beach Goa waves', 'Vagator Beach Goa'] },
      { file: '02.webp', width: 1600, queries: ['Palolem Beach South Goa crescent', 'Palolem Beach Goa', 'South Goa beach quiet'] },
      { file: '03.webp', width: 1600, queries: ['Fontainhas Latin Quarter Panaji Goa', 'Fontainhas Panjim colourful houses', 'Fontainhas street Goa'] },
      { file: '04.webp', width: 1200, queries: ['Goan fish curry rice thali', 'Goan fish curry coconut', 'Fish curry rice Goa'] },
      { file: '05.webp', width: 1600, queries: ['Basilica of Bom Jesus Old Goa', 'Se Cathedral Old Goa', 'Old Goa churches'] },
      { file: '06.webp', width: 1600, queries: ['Bebinca dessert Goa layered', 'Bebinca traditional Goan cake', 'Goan sweets food'] },
    ],
  },
  {
    id: 'munnar',
    name: 'Munnar',
    items: [
      { file: 'cover.webp', width: 1200, queries: ['Munnar Overview tea hills mist', 'Munnar tea gardens morning', 'Munnar tea plantations Kerala'] },
      { file: '01.webp', width: 1600, queries: ['Munnar tea plantation green landscape', 'Tea estate hills Munnar Kerala', 'Munnar tea terraces'] },
      { file: '02.webp', width: 1600, queries: ['Tea plucking women Kerala Munnar', 'Tea garden workers Munnar', 'Plucking tea leaves Kerala'] },
      { file: '03.webp', width: 1600, queries: ['Eravikulam National Park Nilgiri Tahr', 'Nilgiri tahr Eravikulam Munnar', 'Eravikulam National Park hills'] },
      { file: '04.webp', width: 1200, queries: ['Tea cup fresh brew leaves estate', 'Kanan Devan tea factory Munnar', 'Fresh tea cup plantation'] },
      { file: '05.webp', width: 1600, queries: ['Top Station Munnar view Western Ghats', 'Top Station Munnar clouds', 'Munnar mist viewpoint'] },
      { file: '06.webp', width: 1600, queries: ['Kerala Appam vegetable stew', 'Appam stew Kerala breakfast', 'Kerala traditional sadya'] },
    ],
  },
  {
    id: 'gangtok',
    name: 'Gangtok',
    items: [
      { file: 'cover.webp', width: 1200, queries: ['Kangchenjunga prayer flags Goechala Sikkim', 'Kanchenjunga view Sikkim prayer flags', 'Kangchenjunga snow peaks'] },
      { file: '01.webp', width: 1600, queries: ['Gangtok city view Himalaya Sikkim', 'Gangtok Sikkim hills town', 'Gangtok ridge mountains'] },
      { file: '02.webp', width: 1600, queries: ['Rumtek Monastery Sikkim murals', 'Rumtek Dharma Chakra Centre Sikkim', 'Rumtek Monastery monks'] },
      { file: '03.webp', width: 1600, queries: ['Tsongmo Lake Changu Lake East Sikkim', 'Tsomgo Lake Sikkim frozen reflection', 'Tsomgo Lake Sikkim'] },
      { file: '04.webp', width: 1200, queries: ['Momo dumplings steaming basket Tibetan', 'Steamed momos Sikkim street food', 'Momos chutney plate'] },
      { file: '05.webp', width: 1600, queries: ['MG Marg Gangtok promenade Sikkim', 'MG Marg Gangtok street evening', 'MG Marg pedestrian Sikkim'] },
      { file: '06.webp', width: 1600, queries: ['Thukpa noodle soup Himalayan Tibetan', 'Thukpa soup Sikkim broth', 'Tibetan thukpa bowl'] },
    ],
  },
  {
    id: 'kutch',
    name: 'Rann of Kutch',
    items: [
      { file: 'cover.webp', width: 1200, queries: ['White Rann of Kutch salt desert white', 'Great Rann of Kutch Gujarat white', 'Rann of Kutch horizon'] },
      { file: '01.webp', width: 1600, queries: ['Great Rann of Kutch salt desert', 'White desert Kutch Gujarat horizon', 'White Rann salt flats'] },
      { file: '02.webp', width: 1600, queries: ['Rann Utsav tent city camel Kutch', 'Rann Utsav camel desert Gujarat', 'Rann Utsav tents festival'] },
      { file: '03.webp', width: 1600, queries: ['Bhunga house Hodka Kutch Gujarat', 'Traditional Bhunga mud hut Kutch', 'Bhunga circular house Kutch'] },
      { file: '04.webp', width: 1200, queries: ['Kutch embroidery mirror work artisan', 'Kutchi embroidery textile Gujarat', 'Mirror work embroidery Kutch'] },
      { file: '05.webp', width: 1600, queries: ['Kalo Dungar Black Hill Kutch viewpoint', 'Kala Dungar view Kutch desert', 'Kalo Dungar highest point Kutch'] },
      { file: '06.webp', width: 1600, queries: ['Kutchi Dabeli Gujarat street food', 'Dabeli pav street food Kutch', 'Gujarati thali food plate'] },
    ],
  },
  {
    id: 'shillong',
    name: 'Shillong',
    items: [
      { file: 'cover.webp', width: 1200, queries: ['Elephant Falls Shillong Meghalaya waterfall', 'Shillong Meghalaya waterfall pine', 'Nohkalikai Falls Meghalaya'] },
      { file: '01.webp', width: 1600, queries: ['Meghalaya pine hills Shillong landscape', 'Shillong hills green clouds Meghalaya', 'Shillong Peak view Meghalaya'] },
      { file: '02.webp', width: 1600, queries: ['Living root bridge Nongriat Meghalaya', 'Double decker root bridge Cherrapunji', 'Living root bridge Cherrapunjee'] },
      { file: '03.webp', width: 1600, queries: ['Umiam Lake Barapani Shillong reservoir', 'Umiam Lake Meghalaya blue water', 'Barapani Lake Shillong'] },
      { file: '04.webp', width: 1200, queries: ['Jadoh Khasi food rice Meghalaya', 'Khasi traditional food street stall', 'Jadoh Shillong food'] },
      { file: '05.webp', width: 1600, queries: ['Live music Shillong concert guitar', 'Shillong rock cafe performance', 'Shillong music festival band'] },
      { file: '06.webp', width: 1600, queries: ['Dohneiiong Khasi dish Meghalaya', 'Khasi cuisine feast pork sesame', 'Traditional Meghalaya food plate'] },
    ],
  },
];

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const credits = {};

  for (const dest of DESTINATIONS) {
    console.log(`\n========================================`);
    console.log(`Processing ${dest.name} (${dest.id})...`);
    console.log(`========================================`);

    const destDir = path.join(MEDIA_ROOT, dest.id);
    fs.mkdirSync(destDir, { recursive: true });
    credits[dest.id] = [];

    // If srinagar, preserve existing credits for 01, 02, 03
    if (dest.id === 'srinagar') {
      credits.srinagar.push('01.webp · Floating vegetable market on Dal Lake (Wikimedia Commons)');
      credits.srinagar.push('02.webp · Shalimar Bagh terraces & waterfalls (Wikimedia Commons)');
      credits.srinagar.push('03.webp · Kashmiri pashmina artisans by Bridgette Auger');
    }

    for (const item of dest.items) {
      const targetFile = path.join(destDir, item.file);

      // Skip if file already exists and is not zero bytes
      if (fs.existsSync(targetFile) && fs.statSync(targetFile).size > 1000) {
        console.log(`[SKIP] ${dest.id}/${item.file} already exists (${(fs.statSync(targetFile).size / 1024).toFixed(0)} KB)`);
        continue;
      }

      console.log(`[SEARCH] ${dest.id}/${item.file} (width: ${item.width})...`);
      let result = null;

      for (const q of item.queries) {
        await sleep(650); // respect rate limits
        result = await searchWikiImage(q, item.width);
        if (result && result.thumbUrl) {
          console.log(`  -> Found via "${q}": ${result.title} by ${result.artist}`);
          break;
        }
      }

      if (!result || !result.thumbUrl) {
        console.warn(`  [FAILED] No image found for ${dest.id}/${item.file}`);
        continue;
      }

      console.log(`  -> Downloading to ${dest.id}/${item.file}...`);
      await sleep(300);
      const ok = await downloadFile(result.thumbUrl, targetFile);
      if (ok) {
        const sizeKB = (fs.statSync(targetFile).size / 1024).toFixed(0);
        console.log(`  [OK] Saved ${dest.id}/${item.file} (${sizeKB} KB)`);
        credits[dest.id].push(`${item.file} · ${result.title} by ${result.artist} (${result.license})`);
      } else {
        console.error(`  [ERR] Failed download: ${dest.id}/${item.file}`);
      }
    }
  }

  // Update credits.js
  console.log('\nUpdating src/credits.js...');
  const creditsCode = `// Photo and video credits for WanderWords. These appear in Menu > Credits.
export const CREDITS = ${JSON.stringify(credits, null, 2)};
`;
  fs.writeFileSync(path.resolve('src/credits.js'), creditsCode, 'utf8');
  console.log('Done updating src/credits.js!');
}

run().catch(console.error);
