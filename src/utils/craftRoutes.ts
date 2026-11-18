import type { CraftType } from '../types/craft';

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

/**
 * Dynamically updates the browser tab title, meta description, and canonical link.
 */
export function updateDocumentMeta(routeConfig: CraftRouteConfig | null): void {
  if (typeof document === 'undefined') return;

  const title = routeConfig 
    ? routeConfig.metaTitle 
    : 'Pixel Craft Studio — Free Pixel Art Maker, Crochet, Cross-Stitch & Beads';
  
  const description = routeConfig 
    ? routeConfig.metaDescription 
    : 'Draw pixel art online or convert photos into Tapestry Crochet row-by-row patterns, DMC Cross-Stitch charts, and Perler Bead grids. Free with printable PDF export.';

  const canonicalUrl = routeConfig
    ? `https://www.pixel-craft-studio.com${routeConfig.path}`
    : 'https://www.pixel-craft-studio.com/';

  document.title = title;

  // Meta description
  let descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) {
    descMeta.setAttribute('content', description);
  }

  // Canonical link
  let canonicalLink = document.querySelector('link[rel="canonical"]');
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
}
