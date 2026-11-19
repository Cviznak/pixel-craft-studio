import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';

function escapeHtml(raw) {
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceMetaTag(html, attrName, attrValue, content) {
  const safeContent = escapeHtml(content);
  const pattern = new RegExp(
    `(<meta\\s+${escapeRegExp(attrName)}=["']${escapeRegExp(attrValue)}["']\\s+content=["'])[^"']*([\\s"']*\\/?>)`,
    'i'
  );
  return html.replace(pattern, `$1${safeContent}" />`);
}

function buildNavFooterHtml() {
  const studioLinks = [
    ['/cross-stitch', 'Cross-Stitch Pattern Maker'],
    ['/crochet', 'Tapestry Crochet & C2C'],
    ['/knitting', 'Intarsia Knitting Charts'],
    ['/loom-beading', 'Bead Loom & Peyote'],
    ['/alpha-keychain', 'Alpha Keychain Studio'],
    ['/perler-beads', 'Perler & Fuse Beads'],
    ['/diamond-painting', 'Diamond Painting'],
    ['/pixel-art', 'Pixel Art Studio'],
  ];
  const toolLinks = [
    ['/oxs-viewer', '.OXS Pattern Viewer'],
    ['/tools/color-substitutor', 'Batch Color Substitutor & Blends'],
    ['/color-chart', 'CIELAB Color Chart & Hex Match'],
    ['/color-chart/dmc-to-anchor', 'DMC to Anchor Chart'],
    ['/calculators', 'Floss, Bead & C2C Calculators'],
    ['/community', 'Community Pattern Showcase'],
    ['/gallery', 'Curated Starter Gallery'],
    ['/about', 'About'],
    ['/license', 'Commercial License'],
    ['/privacy', 'Privacy'],
  ];

  const renderLinks = (items) =>
    items
      .map(
        ([href, text]) =>
          `<a href="${escapeHtml(href)}" style="color:#93c5fd;margin-right:0.9rem;display:inline-block;margin-bottom:0.35rem;">${escapeHtml(text)}</a>`
      )
      .join('');

  return `<nav aria-label="Pixel Craft Studio Directory" style="margin-top:1.75rem;padding-top:1.25rem;border-top:1px solid #1e293b;font-size:0.875rem;line-height:1.6;">
    <div style="margin-bottom:0.75rem;"><strong style="color:#f8fafc;">Craft Studios:</strong><br/>${renderLinks(studioLinks)}</div>
    <div><strong style="color:#f8fafc;">Free Craft Tools &amp; Resources:</strong><br/>${renderLinks(toolLinks)}</div>
  </nav>`;
}

function buildRouteEntryHtml(entry) {
  const detailsHtml =
    entry.details && entry.details.length > 0
      ? `<ul style="color:#cbd5e1;margin:1rem 0;padding-left:1.25rem;line-height:1.7;">${entry.details
          .map((d) => `<li>${escapeHtml(d)}</li>`)
          .join('')}</ul>`
      : '';

  const extraLinksHtml =
    entry.links && entry.links.length > 0
      ? `<p style="margin-top:0.75rem;">${entry.links
          .map(
            ([href, label]) =>
              `<a href="${escapeHtml(href)}" style="color:#f472b6;font-weight:600;margin-right:1rem;">${escapeHtml(label)}</a>`
          )
          .join('')}</p>`
      : '';

  return `<main style="min-height:100vh;background:#090d16;color:#e2e8f0;padding:2.5rem 1.25rem;max-width:58rem;margin:0 auto;font-family:system-ui,-apple-system,sans-serif;">
  <p style="font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase;color:#818cf8;font-weight:700;margin-bottom:0.5rem;">${escapeHtml(
    entry.badge || 'Pixel Craft Studio'
  )}</p>
  <h1 style="font-size:2rem;line-height:1.2;font-weight:800;color:#ffffff;margin:0 0 0.75rem 0;">${escapeHtml(
    entry.h1
  )}</h1>
  <p style="font-size:1rem;line-height:1.65;color:#cbd5e1;margin:0 0 1rem 0;">${escapeHtml(
    entry.summary
  )}</p>
  ${detailsHtml}
  ${extraLinksHtml}
  ${buildNavFooterHtml()}
</main>`;
}

function buildPageHtml(templateHtml, entry) {
  let html = templateHtml;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(entry.metaTitle)}</title>`);
  html = replaceMetaTag(html, 'name', 'description', entry.metaDescription);
  if (entry.keywords) {
    html = replaceMetaTag(html, 'name', 'keywords', entry.keywords);
  }
  html = html.replace(
    /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(entry.canonicalUrl)}" />`
  );

  html = replaceMetaTag(html, 'property', 'og:url', entry.canonicalUrl);
  html = replaceMetaTag(html, 'property', 'og:title', entry.metaTitle);
  html = replaceMetaTag(html, 'property', 'og:description', entry.metaDescription);
  html = replaceMetaTag(html, 'name', 'twitter:url', entry.canonicalUrl);
  html = replaceMetaTag(html, 'name', 'twitter:title', entry.metaTitle);
  html = replaceMetaTag(html, 'name', 'twitter:description', entry.metaDescription);

  const jsonLdScript = entry.jsonLd
    ? `<script type="application/ld+json">\n${JSON.stringify(entry.jsonLd, null, 2).replace(
        /<\//g,
        '<\\/'
      )}\n    </script>`
    : '';

  html = html.replace(
    /<!-- ROUTE_JSONLD_START -->[\s\S]*?<!-- ROUTE_JSONLD_END -->/,
    `<!-- ROUTE_JSONLD_START -->\n    ${jsonLdScript}\n    <!-- ROUTE_JSONLD_END -->`
  );

  html = html.replace(
    /<!-- ROUTE_ROOT_START -->[\s\S]*?<!-- ROUTE_ROOT_END -->/,
    `<!-- ROUTE_ROOT_START -->\n      ${buildRouteEntryHtml(entry)}\n      <!-- ROUTE_ROOT_END -->`
  );

  return html;
}

async function main() {
  const rootDir = process.cwd();
  const distDir = path.join(rootDir, 'dist');
  const templateHtml = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');

  const vite = await createServer({
    root: rootDir,
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'silent',
  });

  try {
    const routesMod = await vite.ssrLoadModule('/src/utils/craftRoutes.ts');
    const patternsMod = await vite.ssrLoadModule('/src/utils/communityPatterns.ts');

    const origin = 'https://www.pixel-craft-studio.com';
    const entries = [];

    // 1. 8 Craft studio routes
    for (const craft of Object.values(routesMod.CRAFT_ROUTES)) {
      const canonicalUrl = `${origin}${craft.path}`;
      entries.push({
        path: craft.path,
        metaTitle: craft.metaTitle,
        metaDescription: craft.metaDescription,
        keywords: craft.keywords,
        canonicalUrl,
        badge: craft.badge,
        h1: craft.h1,
        summary: craft.subtitle,
        details: [
          `Perceptual CIELAB color matching (${craft.recommendedPalette.toUpperCase()} recommended palette)`,
          'Printable multi-page symbol PDF, PNG, .OXS XML & layered .SVG export',
          'Live stitch tracker, physical gauge & material calculator included',
        ],
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: craft.metaTitle,
          description: craft.metaDescription,
          url: canonicalUrl,
          applicationCategory: 'DesignApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
      });
    }

    // 2. 4 Calculator routes
    for (const calc of Object.values(routesMod.CALCULATOR_ROUTES)) {
      entries.push({
        path: calc.path,
        metaTitle: calc.metaTitle,
        metaDescription: calc.metaDescription,
        canonicalUrl: calc.canonicalUrl,
        badge: 'Craft Calculator Suite',
        h1: calc.metaTitle.split('|')[0].trim(),
        summary: calc.metaDescription,
        details: [
          'Instant browser-based calculations with zero login or fees',
          'Imperial (inches / yards) and Metric (cm / meters) unit support',
        ],
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: calc.metaTitle,
          description: calc.metaDescription,
          url: calc.canonicalUrl,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
      });
    }

    // 3. 4 Color Chart routes
    for (const chart of Object.values(routesMod.COLOR_CHART_ROUTES)) {
      entries.push({
        path: chart.path,
        metaTitle: chart.metaTitle,
        metaDescription: chart.metaDescription,
        canonicalUrl: chart.canonicalUrl,
        badge: 'CIELAB Craft Color Reference',
        h1: chart.metaTitle.split('|')[0].trim(),
        summary: chart.metaDescription,
        details: [
          'Covers 175+ DMC floss codes, Anchor equivalents, Perler, Artkal, Hama & Miyuki Delica 11/0',
          'Sort by code, family, or lightness and track owned shades in My Stash',
        ],
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: chart.metaTitle,
          description: chart.metaDescription,
          url: chart.canonicalUrl,
          applicationCategory: 'DesignApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
      });
    }

    // 4. Curated Pattern Gallery (/gallery)
    const gallery = routesMod.GALLERY_ROUTE;
    entries.push({
      path: gallery.path,
      metaTitle: gallery.metaTitle,
      metaDescription: gallery.metaDescription,
      canonicalUrl: gallery.canonicalUrl,
      badge: 'Free Pattern Gallery',
      h1: 'Free Cross-Stitch, Crochet, Perler & Bead Pattern Gallery',
      summary: gallery.metaDescription,
      details: [
        '32 curated starter charts across 8 fiber and bead crafts',
        'Open any pattern directly in the Studio canvas to edit or print',
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: gallery.metaTitle,
        description: gallery.metaDescription,
        url: gallery.canonicalUrl,
      },
    });

    // 5. 6 Standalone Wave 6 pages
    for (const standalone of Object.values(routesMod.STANDALONE_PAGE_ROUTES)) {
      const schemaType =
        standalone.path === '/community'
          ? 'CollectionPage'
          : standalone.path === '/oxs-viewer'
          ? 'WebApplication'
          : standalone.path === '/tools/color-substitutor'
          ? 'WebApplication'
          : 'WebPage';
      entries.push({
        path: standalone.path,
        metaTitle: standalone.metaTitle,
        metaDescription: standalone.metaDescription,
        canonicalUrl: standalone.canonicalUrl,
        badge: 'Pixel Craft Studio',
        h1: standalone.metaTitle.split('|')[0].trim(),
        summary: standalone.metaDescription,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': schemaType,
          name: standalone.metaTitle,
          description: standalone.metaDescription,
          url: standalone.canonicalUrl,
        },
      });
    }

    // 6. 32 Individual Pattern Landing Pages (/patterns/:slug)
    for (const p of patternsMod.COMMUNITY_PATTERNS) {
      const info = routesMod.getPatternRouteInfo(`/patterns/${p.slug}`);
      if (!info) continue;
      const { pattern, meta } = info;
      entries.push({
        path: meta.path,
        metaTitle: meta.metaTitle,
        metaDescription: meta.metaDescription,
        keywords: pattern.tags.join(', '),
        canonicalUrl: meta.canonicalUrl,
        badge: `${pattern.category} • ${pattern.difficulty}`,
        h1: `${pattern.name} — Free Pattern (${pattern.recommendedGridSize.width}×${pattern.recommendedGridSize.height})`,
        summary: `${pattern.description} Recommended for ${pattern.recommendedCraft} using ${pattern.recommendedColors} colors (~${pattern.estimatedHours} hrs).`,
        details: [
          `Grid Size: ${pattern.recommendedGridSize.width} × ${pattern.recommendedGridSize.height}`,
          `Palette: ${pattern.recommendedColors} colors • Difficulty: ${pattern.difficulty}`,
          `Tags: ${pattern.tags.join(', ')}`,
        ],
        links: [
          ['/gallery', '← All Curated Patterns'],
          [routesMod.getPathForCraft(pattern.recommendedCraft), `Open ${pattern.recommendedCraft} Studio →`],
        ],
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: pattern.name,
          description: meta.metaDescription,
          url: meta.canonicalUrl,
          keywords: pattern.tags.join(', '),
          genre: pattern.category,
          isAccessibleForFree: true,
        },
      });
    }

    let written = 0;
    for (const entry of entries) {
      const rel = entry.path.replace(/^\/+/, '');
      if (!rel) continue;
      const targetFile = path.join(distDir, `${rel}.html`);
      await fs.mkdir(path.dirname(targetFile), { recursive: true });
      await fs.writeFile(targetFile, buildPageHtml(templateHtml, entry), 'utf8');
      written++;
    }

    console.log(`Prerendered ${written} static SEO route HTML files into dist/`);
  } finally {
    await vite.close();
  }
}

main().catch((err) => {
  console.error('SEO prerender failed:', err);
  process.exit(1);
});
