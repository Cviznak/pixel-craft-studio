const ORIGIN = 'https://www.pixel-craft-studio.com';

export interface SitemapPatternRow {
  short_id: string;
  author_name?: string | null;
  updated_at?: string | null;
}

export function escapeXml(raw: string): string {
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDate(rawDate?: string | null): string {
  if (!rawDate) return new Date().toISOString().slice(0, 10);
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function buildCommunitySitemapXml(rows: SitemapPatternRow[]): string {
  let latestDate = toIsoDate(rows[0]?.updated_at);
  for (const row of rows) {
    if (!row.updated_at) continue;
    const d = toIsoDate(row.updated_at);
    if (d > latestDate) latestDate = d;
  }

  const entries: string[] = [
    `  <url>\n    <loc>${escapeXml(`${ORIGIN}/community`)}</loc>\n    <lastmod>${latestDate}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.85</priority>\n  </url>`,
  ];
  const seenPatternIds = new Set<string>();
  const creatorLastMod = new Map<string, string>();

  for (const row of rows) {
    const shortId = (row.short_id || '').trim().toLowerCase();
    if (!/^[a-z0-9]{6,16}$/.test(shortId) || seenPatternIds.has(shortId)) {
      continue;
    }
    seenPatternIds.add(shortId);

    const lastmod = toIsoDate(row.updated_at);
    entries.push(
      `  <url>\n    <loc>${escapeXml(`${ORIGIN}/p/${shortId}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    );

    const author = (row.author_name || '').trim();
    if (author) {
      const prev = creatorLastMod.get(author);
      if (!prev || lastmod > prev) {
        creatorLastMod.set(author, lastmod);
      }
    }
  }

  for (const [author, lastmod] of creatorLastMod.entries()) {
    const creatorUrl = `${ORIGIN}/u/${encodeURIComponent(author)}`;
    entries.push(
      `  <url>\n    <loc>${escapeXml(creatorUrl)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.65</priority>\n  </url>`
    );
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
  ].join('\n');
}

export default async function handler(_req: any, res: any) {
  try {
    const sbUrl = (
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      ''
    ).trim();
    const sbKey = (
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      ''
    ).trim();

    let rows: SitemapPatternRow[] = [];

    if (sbUrl && sbKey) {
      const endpoint = `${sbUrl}/rest/v1/published_patterns?is_public=eq.true&select=short_id,author_name,updated_at&order=updated_at.desc&limit=500`;
      const upstream = await fetch(endpoint, {
        headers: {
          apikey: sbKey,
          Accept: 'application/json',
        },
      });
      if (upstream.ok) {
        const parsed = (await upstream.json()) as SitemapPatternRow[];
        if (Array.isArray(parsed)) {
          rows = parsed;
        }
      }
    }

    const xml = buildCommunitySitemapXml(rows);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch {
    const emptyXml = buildCommunitySitemapXml([]);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).send(emptyXml);
  }
}
