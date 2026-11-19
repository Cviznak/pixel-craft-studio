import fs from 'node:fs/promises';
import path from 'node:path';

const HOST = 'www.pixel-craft-studio.com';
const KEY = 'c7e4a9b2f1084d6e9a3c5f7b2e8d1a40';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

async function main() {
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  const sitemapXml = await fs.readFile(sitemapPath, 'utf8');

  const urlList = [];
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(sitemapXml)) !== null) {
    const u = match[1].trim();
    if (u) urlList.push(u);
  }

  if (urlList.length === 0) {
    throw new Error('No <loc> entries found in public/sitemap.xml');
  }

  console.log(`Submitting ${urlList.length} URLs to IndexNow (${HOST})...`);

  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  });

  const body = await response.text();
  console.log(`IndexNow response: HTTP ${response.status} ${response.statusText}${body ? ` — ${body}` : ''}`);
  if (!response.ok && response.status !== 202) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('IndexNow submission failed:', err);
  process.exit(1);
});
