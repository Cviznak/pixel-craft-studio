import type { CraftType } from '../types/craft';
import { getPatternBySlug, type CommunityPattern } from './communityPatterns';

export interface CraftRouteConfig {
  path: string;
  craftType: CraftType;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  badge: string;
  icon: string;
  recommendedPalette: string;
  h1: string;
  subtitle: string;
}

export const CRAFT_ROUTES: Record<CraftType, CraftRouteConfig> = {
  'cross-stitch': {
    path: '/cross-stitch',
    craftType: 'cross-stitch',
    title: 'Cross-Stitch',
    metaTitle: 'Free Cross Stitch Pattern Maker from Photo — DMC Floss Charts | Pixel Craft Studio',
    metaDescription: 'Convert any photo or pixel art into a DMC cross-stitch chart with high-contrast symbols, Aida cloth calculators, and printable multi-page PDF charts. Free, no sign-up.',
    keywords: 'cross stitch pattern maker, convert picture to cross stitch, free cross stitch chart generator, dmc embroidery floss matching, aida cloth calculator, pixel art to cross stitch',
    badge: 'Cross-Stitch Chart Maker',
    icon: '🧵',
    recommendedPalette: 'dmc',
    h1: 'Free Cross-Stitch Pattern Maker',
    subtitle: 'Convert pictures into official DMC embroidery floss charts with printable PDF symbols and fabric sizing.',
  },
  'crochet': {
    path: '/crochet',
    craftType: 'crochet',
    title: 'Crochet',
    metaTitle: 'Tapestry Crochet Pattern Maker & Row-by-Row Written Generator | Pixel Craft Studio',
    metaDescription: 'Turn pictures into Tapestry Crochet row-by-row written patterns, C2C graphgans, and color-change grids. Includes yarn yardage and gauge size calculator.',
    keywords: 'tapestry crochet pattern maker, crochet graphgan generator, picture to crochet pattern, row by row written crochet instructions, corner to corner chart, yarn yardage calculator',
    badge: 'Crochet Graphgan Maker',
    icon: '🧶',
    recommendedPalette: 'pastel',
    h1: 'Tapestry Crochet Pattern Generator',
    subtitle: 'Turn pictures into row-by-row written stitch counts with interactive progress tracking and yarn yardage estimation.',
  },
  'alpha': {
    path: '/alpha-keychain',
    craftType: 'alpha',
    title: 'Alpha Knot',
    metaTitle: 'Alpha Pattern Maker & Keychain String Length Calculator | Pixel Craft Studio',
    metaDescription: 'Design alpha friendship bracelets and keychains from images or pixel grids. Calculates base string cuts, working floss yardage, and ribbon clamp hardware fit.',
    keywords: 'alpha pattern generator, alpha keychain maker, friendship bracelet alpha pattern, alpha pattern string calculator, knotting grid, dmc bracelet maker',
    badge: 'Alpha Keychain & Bracelet Knotting',
    icon: '🪢',
    recommendedPalette: 'dmc',
    h1: 'Alpha Pattern & Keychain Studio',
    subtitle: 'Create alpha bracelet and keychain patterns with knotting simulation, base string cut lengths, and ribbon clamp sizing.',
  },
  'perler': {
    path: '/perler-beads',
    craftType: 'perler',
    title: 'Beads',
    metaTitle: 'Perler Bead Pattern Maker — Free Fuse Bead Designer & Grid | Pixel Craft Studio',
    metaDescription: 'Convert images to Perler and Hama bead pegboard patterns with official color matching, bead counts, and 29x29 interlocking board previews. Free printable PDF.',
    keywords: 'perler bead pattern maker, fuse bead designer, hama bead generator, bead sprite maker, 29x29 pegboard calculator, artkal bead converter',
    badge: 'Perler & Fuse Bead Studio',
    icon: '🔘',
    recommendedPalette: 'perler',
    h1: 'Perler & Fuse Bead Pattern Designer',
    subtitle: 'Convert images into bead grids with exact bead counts, color matching, and 29×29 interlocking pegboard layouts.',
  },
  'diamond': {
    path: '/diamond-painting',
    craftType: 'diamond',
    title: 'Diamond',
    metaTitle: 'Diamond Painting Chart Maker & Drill Count Converter | Pixel Craft Studio',
    metaDescription: 'Convert any photo into a custom Diamond Painting chart with 2.5mm square drills, DMC color matching codes, drill counts, and canvas sizing.',
    keywords: 'diamond painting pattern generator, photo to diamond painting, custom diamond painting chart, dmc diamond drill converter, 2.5mm drill calculator',
    badge: 'Diamond Painting Studio',
    icon: '💎',
    recommendedPalette: 'dmc',
    h1: 'Diamond Painting Chart Generator',
    subtitle: 'Design diamond painting canvases with 2.5mm square drills, DMC color keys, and canvas framing estimates.',
  },
  'pixel': {
    path: '/pixel-art',
    craftType: 'pixel',
    title: 'Pixel',
    metaTitle: 'Free Online Pixel Art Maker & Retro Sprite Editor | Pixel Craft Studio',
    metaDescription: 'Draw pixel art online with live vertical symmetry, retro palettes (Pico-8, GameBoy, Arcade), flood fill bucket, line tools, and instant PNG export.',
    keywords: 'pixel art maker, draw pixel art online, free sprite editor, pico-8 palette, gameboy pixel art, retro pixel drawer, pixel symmetry mirror',
    badge: 'Pixel Art Drawing Studio',
    icon: '🔲',
    recommendedPalette: 'pico-8',
    h1: 'Online Pixel Art Studio',
    subtitle: 'Freehand pixel art editor with live mirror symmetry, retro palettes, flood fill, and seamless image conversion.',
  },
  'knitting': {
    path: '/knitting',
    craftType: 'knitting',
    title: 'Knitting',
    metaTitle: 'Free Knitting Chart Maker — Intarsia & Fair Isle Graph Generator | Pixel Craft Studio',
    metaDescription: 'Convert photos or draw custom knitting charts with accurate rectangular gauge ratios (4:5 stockinette), V-stitch texture simulation, and yarn yardage estimates.',
    keywords: 'knitting chart maker, intarsia graph generator, fair isle pattern maker, rectangular knit gauge grid, stockinette stitch graph, photo to knitting pattern',
    badge: 'Intarsia & Fair Isle Knitting Studio',
    icon: '🥢',
    recommendedPalette: 'pastel',
    h1: 'Intarsia & Fair Isle Knitting Chart Maker',
    subtitle: 'Convert images into knitting graphs with non-square rectangular gauge ratios, realistic V-stitch texture, and yarn estimates.',
  },
  'loom': {
    path: '/loom-beading',
    craftType: 'loom',
    title: 'Bead Loom',
    metaTitle: 'Free Bead Loom & Peyote Pattern Maker — Miyuki Delica Grids | Pixel Craft Studio',
    metaDescription: 'Design bead loom and peyote stitch patterns with Miyuki Delica cylinder beads. Calculates exact bead counts, 5g tubes, warp threads, and slide clasp sizing.',
    keywords: 'bead loom pattern maker, peyote stitch designer, miyuki delica pattern generator, bead weaving chart, brick stitch pattern maker, seed bead loom calculator',
    badge: 'Bead Loom & Peyote Studio',
    icon: '📿',
    recommendedPalette: 'dmc',
    h1: 'Bead Loom & Peyote Stitch Pattern Maker',
    subtitle: 'Design bead weaving bracelets and cuffs with Miyuki Delica cylinder simulation, warp thread calculations, and slide clasp sizing.',
  },
};

export interface StaticRouteConfig {
  path: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
}

export const CALCULATOR_ROUTES: Record<string, StaticRouteConfig> = {
  '/calculators': {
    path: '/calculators',
    metaTitle: 'Free Craft Calculators — Floss Skeins, Bead Grams & C2C Blanket Sizer | Pixel Craft Studio',
    metaDescription: 'Calculate DMC embroidery floss skein lengths, convert Perler bead grams to exact counts, and size corner-to-corner (C2C) crochet blankets with yarn yardage.',
    canonicalUrl: 'https://www.pixel-craft-studio.com/calculators',
  },
  '/calculators/floss-estimator': {
    path: '/calculators/floss-estimator',
    metaTitle: 'DMC Embroidery Floss & Skein Calculator — Exact Yardage & Cost | Pixel Craft Studio',
    metaDescription: 'Free online DMC floss skein calculator. Enter stitch counts, fabric count (14ct, 16ct, 18ct) and strand thickness to calculate required 8-meter skeins, total yards, and project cost.',
    canonicalUrl: 'https://www.pixel-craft-studio.com/calculators/floss-estimator',
  },
  '/calculators/bead-converter': {
    path: '/calculators/bead-converter',
    metaTitle: 'Perler & Hama Bead Grams to Count Converter — 1,000 & 6,000 Bead Bags | Pixel Craft Studio',
    metaDescription: 'Accurately convert fusible bead weight in grams or ounces to exact bead count for Perler, Artkal, and Hama beads. Includes 29x29 pegboard count calculator.',
    canonicalUrl: 'https://www.pixel-craft-studio.com/calculators/bead-converter',
  },
  '/calculators/c2c-blanket-size': {
    path: '/calculators/c2c-blanket-size',
    metaTitle: 'C2C Crochet Blanket Size & Yardage Calculator — Corner to Corner Graphgan | Pixel Craft Studio',
    metaDescription: 'Calculate finished blanket dimensions in inches and centimeters from your C2C grid tile count and gauge. Estimates total yarn yardage, skeins, and bed sizing.',
    canonicalUrl: 'https://www.pixel-craft-studio.com/calculators/c2c-blanket-size',
  },
};

export function getCalculatorRoute(pathname: string): StaticRouteConfig | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return CALCULATOR_ROUTES[clean] || null;
}

export const COLOR_CHART_ROUTES: Record<string, StaticRouteConfig> = {
  '/color-chart': {
    path: '/color-chart',
    metaTitle: 'Hex to DMC, Perler & Miyuki Color Matcher — CIELAB Color Chart | Pixel Craft Studio',
    metaDescription: 'Free interactive hex-to-thread and bead color matcher. Enter any hex code to find the closest DMC floss, Anchor cotton, Perler, Artkal, Hama, and Miyuki Delica shades.',
    canonicalUrl: 'https://www.pixel-craft-studio.com/color-chart',
  },
  '/color-chart/dmc-to-anchor': {
    path: '/color-chart/dmc-to-anchor',
    metaTitle: 'DMC to Anchor Floss Conversion Chart (175+ Shades) | Pixel Craft Studio',
    metaDescription: 'Searchable DMC embroidery floss to Anchor stranded cotton conversion chart with hex codes, lightness sorting, personal stash toggles, and close shade matching.',
    canonicalUrl: 'https://www.pixel-craft-studio.com/color-chart/dmc-to-anchor',
  },
  '/color-chart/perler-bead-colors': {
    path: '/color-chart/perler-bead-colors',
    metaTitle: 'Perler to Artkal & Hama Bead Color Conversion Chart | Pixel Craft Studio',
    metaDescription: 'Complete Perler fuse bead color chart with Artkal S-series and Hama Midi equivalents, hex previews, color family filters, and pegboard stash checklists.',
    canonicalUrl: 'https://www.pixel-craft-studio.com/color-chart/perler-bead-colors',
  },
  '/color-chart/miyuki-delica': {
    path: '/color-chart/miyuki-delica',
    metaTitle: 'Miyuki Delica 11/0 Seed Bead Color Chart & Finish Guide | Pixel Craft Studio',
    metaDescription: 'Browse calibrated Miyuki Delica 11/0 (DB) seed bead shades across Opaque, Matte, Metallic, Duracoat, Ceylon, and Silver-Lined finishes with DMC matches.',
    canonicalUrl: 'https://www.pixel-craft-studio.com/color-chart/miyuki-delica',
  },
};

export const GALLERY_ROUTE: StaticRouteConfig = {
  path: '/gallery',
  metaTitle: 'Free Craft Pattern Gallery — 32+ Cross-Stitch, Crochet, Perler & Bead Patterns | Pixel Craft Studio',
  metaDescription: 'Browse 32+ free, stitch-calibrated patterns across Cross-Stitch, Perler Beads, Tapestry Crochet, Knitting, Bead Loom, Alpha Bracelets, and Diamond Painting.',
  canonicalUrl: 'https://www.pixel-craft-studio.com/gallery',
};

export const STANDALONE_PAGE_ROUTES: Record<string, StaticRouteConfig> = {
  '/oxs-viewer': {
    path: '/oxs-viewer',
    metaTitle: 'Free .OXS Cross-Stitch Pattern Viewer & Converter (PDF, SVG, DMC List) | Pixel Craft Studio',
    metaDescription: 'Open and inspect any .OXS cross-stitch chart online for free. View symbols and backstitches, calculate Aida fabric size and DMC skeins, export PDF or layered SVG, or remix in Studio.',
    canonicalUrl: 'https://www.pixel-craft-studio.com/oxs-viewer',
  },
  '/tools/color-substitutor': {
    path: '/tools/color-substitutor',
    metaTitle: 'Batch DMC, Anchor, Perler & Miyuki Color Substitutor + 2-Strand Blend Finder | Pixel Craft Studio',
    metaDescription: 'Batch-convert DMC floss shopping lists to Anchor, Perler, Artkal, Hama, Miyuki Delica, or your personal stash using CIELAB matching, plus a 2-strand tweeding blend finder.',
    canonicalUrl: 'https://www.pixel-craft-studio.com/tools/color-substitutor',
  },
  '/community': {
    path: '/community',
    metaTitle: 'Community Craft Pattern Showcase — Remix & Share Free Charts | Pixel Craft Studio',
    metaDescription: 'Explore community-published Cross-Stitch, Tapestry Crochet, Knitting, Perler Bead, and Bead Loom patterns. Like, bookmark build tips, or open any design in Studio to remix.',
    canonicalUrl: 'https://www.pixel-craft-studio.com/community',
  },
  '/about': {
    path: '/about',
    metaTitle: 'About Pixel Craft Studio — Free Multi-Craft Pattern & Stitch Engine',
    metaDescription: 'Learn how Pixel Craft Studio helps stitchers, crocheters, knitters, and bead artists turn photos and pixel art into calibrated charts with CIELAB matching and zero paywalls.',
    canonicalUrl: 'https://www.pixel-craft-studio.com/about',
  },
  '/license': {
    path: '/license',
    metaTitle: 'Commercial & Etsy Seller Pattern License | Pixel Craft Studio',
    metaDescription: 'Commercial usage rights for patterns created in Pixel Craft Studio. Use your generated PDF, OXS, SVG, and listing kits freely on Etsy or personal shops.',
    canonicalUrl: 'https://www.pixel-craft-studio.com/license',
  },
  '/privacy': {
    path: '/privacy',
    metaTitle: 'Privacy Policy & Local-First Storage Architecture | Pixel Craft Studio',
    metaDescription: 'How Pixel Craft Studio handles browser-local auto-saves, optional Supabase cloud sync accounts, AI image generation requests, and anonymous analytics.',
    canonicalUrl: 'https://www.pixel-craft-studio.com/privacy',
  },
};

export function getStandalonePageRoute(pathname: string): StaticRouteConfig | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return STANDALONE_PAGE_ROUTES[clean] || null;
}

export function buildCreatorProfileMeta(handle: string): StaticRouteConfig {
  const cleanHandle = handle.trim() || 'Creator';
  const encoded = encodeURIComponent(cleanHandle);
  return {
    path: `/u/${encoded}`,
    metaTitle: `@${cleanHandle} — Creator Portfolio & Craft Patterns | Pixel Craft Studio`,
    metaDescription: `Browse free public patterns published by @${cleanHandle} on Pixel Craft Studio. Open any pattern in Studio to stitch, inspect DMC/bead legends, or remix.`,
    canonicalUrl: `https://www.pixel-craft-studio.com/u/${encoded}`,
  };
}

export function getColorChartRoute(pathname: string): StaticRouteConfig | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return COLOR_CHART_ROUTES[clean] || null;
}

export function getPatternRouteInfo(
  pathname: string
): { pattern: CommunityPattern; meta: StaticRouteConfig } | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (!clean.startsWith('/patterns/')) return null;
  const slug = clean.slice('/patterns/'.length);
  if (!slug || slug.includes('/')) return null;
  const pattern = getPatternBySlug(slug);
  if (!pattern) return null;

  const craftTitle = CRAFT_ROUTES[pattern.recommendedCraft]?.title || pattern.recommendedCraft;
  const { width, height } = pattern.recommendedGridSize;

  return {
    pattern,
    meta: {
      path: `/patterns/${pattern.slug}`,
      metaTitle: `${pattern.name} — Free ${craftTitle} Pattern (${width}×${height}) | Pixel Craft Studio`,
      metaDescription: `Free ${width}×${height} ${craftTitle.toLowerCase()} pattern (${pattern.recommendedColors} colors, ${pattern.difficulty}). ${pattern.description} Includes physical sizing, material estimates, and 1-click studio editing.`,
      canonicalUrl: `https://www.pixel-craft-studio.com/patterns/${pattern.slug}`,
    },
  };
}

/**
 * Matches community/shared pattern short links `/p/:shortId`.
 */
export function getSharedPatternRouteId(pathname: string): string | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (!clean.startsWith('/p/')) return null;
  const shortId = clean.slice('/p/'.length).toLowerCase();
  return /^[a-z0-9]{6,16}$/.test(shortId) ? shortId : null;
}

/**
 * Builds SEO metadata for a loaded `/p/:shortId` pattern view.
 */
export function buildSharedPatternMeta(
  shortId: string,
  title = 'Shared Craft Pattern',
  craftType?: CraftType,
  width?: number,
  height?: number
): StaticRouteConfig {
  const craftTitle = craftType ? (CRAFT_ROUTES[craftType]?.title || craftType) : 'Craft';
  const dimText = width && height ? ` (${width}×${height})` : '';
  return {
    path: `/p/${shortId}`,
    metaTitle: `${title} — ${craftTitle} Pattern${dimText} | Pixel Craft Studio`,
    metaDescription: `Interactive ${craftTitle.toLowerCase()} pattern${dimText} shared on Pixel Craft Studio. Open in the browser canvas to track stitches, swap DMC/Delica colors, or export a printable PDF chart.`,
    canonicalUrl: `https://www.pixel-craft-studio.com/p/${shortId}`,
  };
}

/**
 * Returns the route configuration for a given URL path, or null if root / unknown.
 */
export function getRouteByPath(pathname: string): CraftRouteConfig | null {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  for (const config of Object.values(CRAFT_ROUTES)) {
    if (config.path === cleanPath) {
      return config;
    }
  }
  return null;
}

/**
 * Returns the path for a given craft type.
 */
export function getPathForCraft(craftType: CraftType): string {
  return CRAFT_ROUTES[craftType]?.path || '/';
}

const DYNAMIC_JSONLD_ID = 'dynamic-route-jsonld';

/**
 * Dynamically updates the browser tab title, meta description, canonical link,
 * social tags, and optional route-specific JSON-LD structured data.
 */
export function updateDocumentMeta(
  routeConfig: CraftRouteConfig | StaticRouteConfig | null,
  jsonLd?: Record<string, unknown> | null
): void {
  if (typeof document === 'undefined') return;

  const title = routeConfig 
    ? routeConfig.metaTitle 
    : 'Pixel Craft Studio — Free Pixel Art Maker, Crochet, Cross-Stitch & Beads';
  
  const description = routeConfig 
    ? routeConfig.metaDescription 
    : 'Draw pixel art online or convert photos into Tapestry Crochet row-by-row patterns, DMC Cross-Stitch charts, and Perler Bead grids. Free with printable PDF export.';

  let canonicalUrl = 'https://www.pixel-craft-studio.com/';
  if (routeConfig) {
    canonicalUrl = 'canonicalUrl' in routeConfig
      ? routeConfig.canonicalUrl
      : `https://www.pixel-craft-studio.com${routeConfig.path}`;
  }

  document.title = title;

  // Meta description
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) {
    descMeta.setAttribute('content', description);
  }

  // Canonical link
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) {
    canonicalLink.setAttribute('href', canonicalUrl);
  }

  // Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', description);

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', canonicalUrl);

  // Twitter / X
  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) twTitle.setAttribute('content', title);

  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute('content', description);

  const twUrl = document.querySelector('meta[name="twitter:url"]');
  if (twUrl) twUrl.setAttribute('content', canonicalUrl);

  // Dynamic route-specific JSON-LD
  const existingScript = document.getElementById(DYNAMIC_JSONLD_ID);
  if (jsonLd) {
    const script = existingScript || document.createElement('script');
    script.id = DYNAMIC_JSONLD_ID;
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(jsonLd);
    if (!existingScript) {
      document.head.appendChild(script);
    }
  } else if (existingScript) {
    existingScript.remove();
  }
}
