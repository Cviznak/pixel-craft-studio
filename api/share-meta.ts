const ORIGIN = 'https://www.pixel-craft-studio.com';

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatSlugTitle(slug: string): string {
  return slug
    .replace(/[^a-z0-9-]+/gi, '-')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const STATIC_PAGE_META: Record<
  string,
  { path: string; title: string; description: string }
> = {
  'oxs-viewer': {
    path: '/oxs-viewer',
    title: 'Free .OXS Cross-Stitch Pattern Viewer & Converter | Pixel Craft Studio',
    description:
      'Open and inspect any .OXS cross-stitch chart online for free. Calculate Aida sizes & DMC skeins, export PDF or layered SVG, or edit in Studio.',
  },
  'color-substitutor': {
    path: '/tools/color-substitutor',
    title: 'Batch DMC, Anchor, Perler & Miyuki Color Substitutor + Blend Finder | Pixel Craft Studio',
    description:
      'Batch-convert DMC lists to Anchor, Perler, Artkal, Hama, Miyuki Delica, or your personal stash using CIELAB matching, plus a 2-strand tweeding blend finder.',
  },
  community: {
    path: '/community',
    title: 'Community Craft Pattern Showcase — Remix & Share Free Charts | Pixel Craft Studio',
    description:
      'Explore community-published Cross-Stitch, Crochet, Knitting, Perler Bead, and Bead Loom patterns. Like, read build tips, and remix in Studio.',
  },
  about: {
    path: '/about',
    title: 'About Pixel Craft Studio — Free Multi-Craft Pattern Engine',
    description:
      'Learn how Pixel Craft Studio helps stitchers, crocheters, knitters, and bead artists turn photos into calibrated charts with zero paywalls.',
  },
  license: {
    path: '/license',
    title: 'Commercial & Etsy Seller Pattern License | Pixel Craft Studio',
    description:
      'Commercial usage rights for patterns created in Pixel Craft Studio. Use your generated PDF, OXS, SVG, and listing kits freely on Etsy or personal shops.',
  },
  privacy: {
    path: '/privacy',
    title: 'Privacy Policy & Local-First Data Architecture | Pixel Craft Studio',
    description:
      'How Pixel Craft Studio handles browser-local auto-saves, optional Supabase cloud sync accounts, AI generation requests, and analytics.',
  },
};

export async function buildShareMetaHtml(params: {
  type?: string;
  id?: string;
  slug?: string;
  handle?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}): Promise<string> {
  const type = (params.type || 'p').toLowerCase();

  let title = 'Pixel Craft Studio — Free Pattern Generator';
  let description =
    'Turn images into Cross-Stitch DMC charts, Perler bead pegboards, Tapestry Crochet instructions, and Seed Bead Word Charts.';
  let canonicalUrl = `${ORIGIN}/`;
  let imageUrl = `${ORIGIN}/og-preview.png`;
  let authorLine = '';

  if (type === 'creator' && params.handle) {
    let decodedHandle = params.handle;
    try {
      decodedHandle = decodeURIComponent(params.handle);
    } catch {
      decodedHandle = params.handle;
    }
    const cleanHandle = decodedHandle.replace(/[<>]/g, '').trim().slice(0, 60) || 'Creator';
    title = `@${cleanHandle} — Creator Portfolio & Craft Patterns | Pixel Craft Studio`;
    description = `Browse free public craft patterns published by @${cleanHandle} on Pixel Craft Studio. Open any pattern in Studio to stitch, inspect legends, or remix.`;
    canonicalUrl = `${ORIGIN}/u/${encodeURIComponent(cleanHandle)}`;
    imageUrl = `${ORIGIN}/og-preview.png`;
  } else if (type === 'page' && params.slug) {
    const cleanSlug = params.slug.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    const pageMeta = STATIC_PAGE_META[cleanSlug];
    if (pageMeta) {
      title = pageMeta.title;
      description = pageMeta.description;
      canonicalUrl = `${ORIGIN}${pageMeta.path}`;
      imageUrl = `${ORIGIN}/og-preview.png`;
    }
  } else if (type === 'pattern' && params.slug) {
    const cleanSlug = params.slug.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    const prettyName = formatSlugTitle(cleanSlug) || 'Craft Pattern';
    title = `${prettyName} — Free Printable Craft Pattern | Pixel Craft Studio`;
    description = `Open ${prettyName} in Pixel Craft Studio. View dimensions, material color counts, and export printable PDF, PNG, SVG, or .OXS charts for free.`;
    canonicalUrl = `${ORIGIN}/patterns/${cleanSlug}`;
    imageUrl = `${ORIGIN}/og-preview.png`;
  } else if (params.id) {
    const shortId = params.id.replace(/[^a-z0-9]/gi, '').toLowerCase();
    canonicalUrl = `${ORIGIN}/p/${shortId}`;

    if (/^[a-z0-9]{6,16}$/.test(shortId)) {
      imageUrl = `${ORIGIN}/api/og-pattern?id=${encodeURIComponent(shortId)}`;
      const sbUrl = (params.supabaseUrl || '').trim();
      const sbKey = (params.supabaseKey || '').trim();

      if (sbUrl && sbKey) {
        try {
          const endpoint = `${sbUrl}/rest/v1/published_patterns?short_id=eq.${encodeURIComponent(
            shortId
          )}&select=short_id,title,author_name,description,craft_type,width,height,color_count,category&limit=1`;
          const resp = await fetch(endpoint, {
            headers: {
              apikey: sbKey,
              Accept: 'application/json',
            },
          });
          if (resp.ok) {
            const rows = (await resp.json()) as Array<{
              title?: string;
              author_name?: string;
              description?: string;
              craft_type?: string;
              width?: number;
              height?: number;
              color_count?: number;
              category?: string;
            }>;
            const row = rows[0];
            if (row) {
              const dims = row.width && row.height ? `${row.width}×${row.height}` : '';
              const craft = (row.craft_type || 'craft').replace(/-/g, ' ');
              const colors = row.color_count ? `${row.color_count} colors` : '';
              const metaParts = [craft, dims, colors].filter(Boolean).join(' • ');
              title = `${row.title || 'Shared Pattern'} (${metaParts}) | Pixel Craft Studio`;
              authorLine = row.author_name ? `Created by ${row.author_name}. ` : '';
              description = `${authorLine}${row.description ? `${row.description} ` : ''}View colors, remix in Pixel Craft Studio, or download printable PDF / .OXS / .SVG charts free.`;
            }
          }
        } catch {
          // Fallback to clean shortId meta below
        }
      }

      if (title === 'Pixel Craft Studio — Free Pattern Generator') {
        title = `Shared Pattern /p/${shortId} | Pixel Craft Studio`;
        description = `View, track stitches, or remix pattern /p/${shortId} in Pixel Craft Studio.`;
      }
    }
  }

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeUrl = escapeHtml(canonicalUrl);
  const safeImage = escapeHtml(imageUrl);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <link rel="canonical" href="${safeUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Pixel Craft Studio" />
  <meta property="og:url" content="${safeUrl}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${safeUrl}" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />
</head>
<body>
  <main>
    <h1>${safeTitle}</h1>
    <p>${safeDesc}</p>
    <p><a href="${safeUrl}">Open Interactive Pattern in Pixel Craft Studio</a></p>
  </main>
</body>
</html>`;
}

export default async function handler(req: any, res: any) {
  try {
    const type = String(req.query?.type || 'p');
    const id = req.query?.id ? String(req.query.id) : undefined;
    const slug = req.query?.slug ? String(req.query.slug) : undefined;
    const handle = req.query?.handle ? String(req.query.handle) : undefined;

    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      '';
    const supabaseKey =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      '';

    const html = await buildShareMetaHtml({
      type,
      id,
      slug,
      handle,
      supabaseUrl,
      supabaseKey,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    res.status(200).send(html);
  } catch {
    res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(
      '<!doctype html><html><head><title>Pixel Craft Studio</title></head><body><a href="https://www.pixel-craft-studio.com/">Pixel Craft Studio</a></body></html>'
    );
  }
}
