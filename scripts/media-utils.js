import fs from 'fs';
import path from 'path';

const MEDIA_ROOT = path.resolve('public/media');

// Helper to sanitize HTML tags from strings
function cleanText(s) {
  if (!s) return '';
  return s.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

async function searchWikiImage(query, width = 1600) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=${width}&format=json`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'WanderWordsEditorial/1.0 (academic digital magazine; student@wanderwords.org)',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});
    
    // Pick the best image file (skip pdf, tif, djvu, audio, video)
    const valid = pages.filter(p => {
      const title = p.title || '';
      return /\.(jpe?g|png|webp)$/i.test(title) && p.imageinfo?.[0]?.thumburl;
    });

    if (valid.length === 0) return null;

    const chosen = valid[0];
    const info = chosen.imageinfo[0];
    const meta = info.extmetadata || {};

    let artist = cleanText(meta.Artist?.value);
    if (!artist) artist = cleanText(meta.Credit?.value);
    if (!artist) artist = 'Wikimedia Commons';
    // shorten if too long
    if (artist.length > 50) artist = artist.slice(0, 47) + '...';

    const license = cleanText(meta.LicenseShortName?.value) || 'CC BY-SA';

    return {
      title: chosen.title.replace(/^File:/, ''),
      thumbUrl: info.thumburl,
      originalUrl: info.url,
      artist,
      license,
    };
  } catch (err) {
    console.error(`Error searching "${query}":`, err.message);
    return null;
  }
}

async function downloadFile(url, destPath) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'WanderWordsEditorial/1.0 (academic digital magazine; student@wanderwords.org)',
      },
    });
    if (!res.ok) {
      console.warn(`Failed to download ${url}: HTTP ${res.status}`);
      return false;
    }
    const buffer = await res.arrayBuffer();
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(buffer));
    return true;
  } catch (err) {
    console.error(`Download error for ${destPath}:`, err.message);
    return false;
  }
}

export { searchWikiImage, downloadFile, cleanText, MEDIA_ROOT };
