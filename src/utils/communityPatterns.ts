import type { CraftType, SampleImage } from '../types/craft';

export interface CommunityPattern extends SampleImage {
  recommendedCraft: CraftType;
  difficulty: 'Beginner' | 'Intermediate' | 'Master';
  recommendedGridSize: { width: number; height: number };
  recommendedColors: number;
  tags: string[];
  likesCount: number;
  estimatedHours: number;
}

// ---------------------------------------------------------------------------
// High-Fidelity SVG Artworks for Community Patterns
// ---------------------------------------------------------------------------

// 1. Arcade Ghost (Blinky / Retro Pixel)
const arcadeGhostSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <rect width="320" height="320" fill="%2309090b"/>
  <!-- Ghost Body (Arcade Red) -->
  <path d="M 60 160 C 60 70, 260 70, 260 160 L 260 270 L 230 240 L 200 270 L 160 240 L 120 270 L 90 240 L 60 270 Z" fill="%23ef4444"/>
  <!-- Left Eye White -->
  <ellipse cx="120" cy="140" rx="26" ry="32" fill="%23ffffff"/>
  <!-- Right Eye White -->
  <ellipse cx="200" cy="140" rx="26" ry="32" fill="%23ffffff"/>
  <!-- Pupils looking left -->
  <ellipse cx="112" cy="144" rx="14" ry="18" fill="%231d4ed8"/>
  <ellipse cx="192" cy="144" rx="14" ry="18" fill="%231d4ed8"/>
</svg>`;

// 2. Magic Mana Potion Bottle
const magicPotionSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <rect width="320" height="320" fill="%230f172a"/>
  <!-- Cork Stopper -->
  <polygon points="135,50 185,50 175,80 145,80" fill="%23b45309"/>
  <!-- Bottle Neck -->
  <rect x="140" y="80" width="40" height="30" fill="%2338bdf8" opacity="0.6" stroke="%23bae6fd" stroke-width="6"/>
  <!-- Round Flask Body -->
  <circle cx="160" cy="200" r="90" fill="%230284c7" stroke="%2338bdf8" stroke-width="8"/>
  <!-- Glowing Liquid Level -->
  <path d="M 78 220 C 110 200, 210 240, 242 220 A 90 90 0 0 1 78 220 Z" fill="%2306b6d4"/>
  <!-- Sparkles / Bubbles -->
  <circle cx="140" cy="230" r="10" fill="%23ffffff" opacity="0.8"/>
  <circle cx="180" cy="210" r="7" fill="%23ffffff" opacity="0.7"/>
  <circle cx="155" cy="255" r="5" fill="%23ffffff" opacity="0.9"/>
  <!-- Glass Reflection Arc -->
  <path d="M 100 150 A 75 75 0 0 1 140 120" stroke="%23ffffff" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.75"/>
</svg>`;

// 3. Retro 80s Cassette Tape
const cassetteTapeSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <rect width="320" height="320" fill="%2318181b"/>
  <!-- Outer Shell -->
  <rect x="40" y="70" width="240" height="180" rx="16" fill="%2306b6d4" stroke="%2322d3ee" stroke-width="8"/>
  <!-- Center Label -->
  <rect x="65" y="100" width="190" height="100" rx="8" fill="%23f43f5e"/>
  <rect x="75" y="110" width="170" height="20" fill="%23fef08a"/>
  <!-- Tape Window -->
  <rect x="100" y="135" width="120" height="55" rx="6" fill="%230f172a"/>
  <!-- Left Spool -->
  <circle cx="130" cy="162" r="18" fill="%23ffffff" stroke="%2309090b" stroke-width="6"/>
  <!-- Right Spool -->
  <circle cx="190" cy="162" r="18" fill="%23ffffff" stroke="%2309090b" stroke-width="6"/>
  <!-- Magnetic Tape -->
  <rect x="145" y="157" width="30" height="10" fill="%2378350f"/>
  <!-- Bottom Trapezoid -->
  <polygon points="70,250 90,225 230,225 250,250" fill="%230891b2"/>
  <circle cx="110" cy="240" r="6" fill="%230f172a"/>
  <circle cx="210" cy="240" r="6" fill="%230f172a"/>
</svg>`;

// 4. Pixel Retro Gameboy Handheld
const gameboySvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <rect width="320" height="320" fill="%231e1b4b"/>
  <!-- Case Body -->
  <rect x="70" y="40" width="180" height="250" rx="20" fill="%23cbd5e1" stroke="%2394a3b8" stroke-width="8"/>
  <!-- Screen Bezel -->
  <path d="M 90 60 L 230 60 L 230 155 L 210 170 L 90 170 Z" fill="%23475569"/>
  <!-- Dot Matrix Screen (Green Phosphor) -->
  <rect x="110" y="75" width="100" height="80" rx="4" fill="%2384cc16"/>
  <rect x="125" y="90" width="70" height="50" fill="%234d7c0f" opacity="0.3"/>
  <!-- D-Pad -->
  <rect x="95" y="200" width="45" height="15" fill="%231e293b"/>
  <rect x="110" y="185" width="15" height="45" fill="%231e293b"/>
  <!-- A & B Buttons (Magenta) -->
  <circle cx="215" cy="205" r="11" fill="%23be123c"/>
  <circle cx="190" cy="220" r="11" fill="%23be123c"/>
  <!-- Select / Start -->
  <rect x="130" y="255" width="24" height="6" rx="3" transform="rotate(-25 130 255)" fill="%2364748b"/>
  <rect x="165" y="255" width="24" height="6" rx="3" transform="rotate(-25 165 255)" fill="%2364748b"/>
</svg>`;

// 5. Cottagecore Amanita Mushroom & Fern
const cottageMushroomSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <rect width="320" height="320" fill="%231c1917"/>
  <!-- Fern Fronds Left -->
  <path d="M 60 280 Q 80 180 120 140" stroke="%2315803d" stroke-width="12" stroke-linecap="round" fill="none"/>
  <path d="M 60 220 Q 90 210 110 230" stroke="%2322c55e" stroke-width="8" stroke-linecap="round" fill="none"/>
  <!-- Fern Fronds Right -->
  <path d="M 260 280 Q 240 180 200 140" stroke="%2315803d" stroke-width="12" stroke-linecap="round" fill="none"/>
  <!-- Mushroom Stem -->
  <path d="M 140 170 C 135 240, 130 270, 120 285 L 200 285 C 190 270, 185 240, 180 170 Z" fill="%23fef3c7"/>
  <!-- Mushroom Cap -->
  <path d="M 70 180 C 70 70, 250 70, 250 180 C 250 195, 70 195, 70 180 Z" fill="%23b91c1c"/>
  <!-- White Poisonous Dots -->
  <circle cx="160" cy="110" r="16" fill="%23ffffff"/>
  <circle cx="110" cy="140" r="13" fill="%23ffffff"/>
  <circle cx="210" cy="135" r="14" fill="%23ffffff"/>
  <circle cx="150" cy="165" r="10" fill="%23ffffff"/>
  <circle cx="85" cy="170" r="8" fill="%23ffffff"/>
  <circle cx="235" cy="170" r="8" fill="%23ffffff"/>
  <!-- Grass Clump -->
  <polygon points="100,285 110,255 125,285" fill="%234ade80"/>
  <polygon points="190,285 205,250 220,285" fill="%234ade80"/>
</svg>`;

// 6. Cherry Blossom Sakura Sprig
const cherryBlossomSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <rect width="320" height="320" fill="%230f172a"/>
  <!-- Woody Branch -->
  <path d="M 40 280 Q 120 220 180 170 Q 240 130 290 80" stroke="%2378350f" stroke-width="16" fill="none" stroke-linecap="round"/>
  <path d="M 140 205 Q 180 250 220 270" stroke="%2378350f" stroke-width="10" fill="none" stroke-linecap="round"/>
  <!-- Main Sakura Flower -->
  <g transform="translate(180, 160)">
    <circle cx="0" cy="-35" r="24" fill="%23fbcfe8"/>
    <circle cx="33" cy="-11" r="24" fill="%23f472b6"/>
    <circle cx="21" cy="28" r="24" fill="%23fbcfe8"/>
    <circle cx="-21" cy="28" r="24" fill="%23f472b6"/>
    <circle cx="-33" cy="-11" r="24" fill="%23fbcfe8"/>
    <circle cx="0" cy="0" r="14" fill="%23db2777"/>
    <circle cx="0" cy="0" r="7" fill="%23fef08a"/>
  </g>
  <!-- Smaller Blossom Top Right -->
  <g transform="translate(260, 95)">
    <circle cx="0" cy="-22" r="16" fill="%23fbcfe8"/>
    <circle cx="21" cy="-7" r="16" fill="%23f472b6"/>
    <circle cx="13" cy="18" r="16" fill="%23fbcfe8"/>
    <circle cx="-13" cy="18" r="16" fill="%23f472b6"/>
    <circle cx="-21" cy="-7" r="16" fill="%23fbcfe8"/>
    <circle cx="0" cy="0" r="8" fill="%23db2777"/>
  </g>
  <!-- Buds -->
  <ellipse cx="110" cy="210" rx="10" ry="16" transform="rotate(-35 110 210)" fill="%23f472b6"/>
  <ellipse cx="230" cy="265" rx="8" ry="14" transform="rotate(25 230 265)" fill="%23f472b6"/>
</svg>`;

// 7. Lavender & Eucalyptus Botanical Sprig
const lavenderSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <rect width="320" height="320" fill="%23111827"/>
  <!-- Stem -->
  <path d="M 130 290 Q 160 180 160 50" stroke="%234d7c0f" stroke-width="8" stroke-linecap="round" fill="none"/>
  <!-- Eucalyptus Round Leaves -->
  <circle cx="135" cy="230" r="22" fill="%2365a30d" opacity="0.9"/>
  <circle cx="185" cy="210" r="20" fill="%2384cc16" opacity="0.9"/>
  <circle cx="140" cy="170" r="18" fill="%2365a30d" opacity="0.9"/>
  <!-- Lavender Flower Calyxes -->
  <g fill="%238b5cf6">
    <ellipse cx="150" cy="120" rx="12" ry="7"/>
    <ellipse cx="170" cy="120" rx="12" ry="7"/>
    <ellipse cx="145" cy="100" rx="11" ry="6"/>
    <ellipse cx="175" cy="100" rx="11" ry="6"/>
    <ellipse cx="150" cy="80" rx="10" ry="6"/>
    <ellipse cx="170" cy="80" rx="10" ry="6"/>
    <ellipse cx="155" cy="62" rx="9" ry="5"/>
    <ellipse cx="165" cy="62" rx="9" ry="5"/>
  </g>
  <g fill="%23c4b5fd">
    <circle cx="160" cy="50" r="8"/>
    <circle cx="150" cy="70" r="6"/>
    <circle cx="170" cy="70" r="6"/>
    <circle cx="146" cy="90" r="6"/>
    <circle cx="174" cy="90" r="6"/>
  </g>
</svg>`;

// 8. Aztec Geometric Tribal Band (Bead Loom / Alpha)
const aztecDiamondSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <rect width="320" height="320" fill="%231e1b4b"/>
  <!-- Top & Bottom Border Strip -->
  <rect x="0" y="30" width="320" height="15" fill="%23f59e0b"/>
  <rect x="0" y="275" width="320" height="15" fill="%23f59e0b"/>
  <!-- Chevron Teeth -->
  <polygon points="0,45 20,70 40,45 60,70 80,45 100,70 120,45 140,70 160,45 180,70 200,45 220,70 240,45 260,70 280,45 300,70 320,45 320,60 0,60" fill="%23ef4444"/>
  <!-- Main Center Diamond Outer (Cyan) -->
  <polygon points="160,80 240,160 160,240 80,160" fill="%2306b6d4"/>
  <!-- Diamond Middle (Yellow) -->
  <polygon points="160,105 215,160 160,215 105,160" fill="%23fbbf24"/>
  <!-- Diamond Inner (Crimson Red) -->
  <polygon points="160,130 190,160 160,190 130,160" fill="%23dc2626"/>
  <!-- Center Core (White) -->
  <polygon points="160,148 172,160 160,172 148,160" fill="%23ffffff"/>
  <!-- Left Partial Diamond -->
  <polygon points="0,110 35,160 0,210" fill="%2306b6d4"/>
  <polygon points="0,130 18,160 0,190" fill="%23fbbf24"/>
  <!-- Right Partial Diamond -->
  <polygon points="320,110 285,160 320,210" fill="%2306b6d4"/>
  <polygon points="320,130 302,160 320,190" fill="%23fbbf24"/>
</svg>`;

// 9. Bohemian Arrow Chevron Strap
const chevronStrapSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <rect width="320" height="320" fill="%230c0a09"/>
  <!-- Repeating Chevron V-Shapes -->
  <path d="M 30 70 L 160 150 L 290 70 L 290 100 L 160 180 L 30 100 Z" fill="%23f97316"/>
  <path d="M 30 110 L 160 190 L 290 110 L 290 140 L 160 220 L 30 140 Z" fill="%2314b8a6"/>
  <path d="M 30 150 L 160 230 L 290 150 L 290 180 L 160 260 L 30 180 Z" fill="%23ec4899"/>
  <path d="M 30 190 L 160 270 L 290 190 L 290 220 L 160 300 L 30 220 Z" fill="%23eab308"/>
  <!-- White Center Diamond Stitches -->
  <polygon points="160,140 170,150 160,160 150,150" fill="%23ffffff"/>
  <polygon points="160,180 170,190 160,200 150,190" fill="%23ffffff"/>
  <polygon points="160,220 170,230 160,240 150,230" fill="%23ffffff"/>
</svg>`;

// 10. Sunset Horizon Ombre Ribbon
const sunsetOmbreSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <defs>
    <linearGradient id="sunsetGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%23312e81"/>
      <stop offset="25%" stop-color="%23831843"/>
      <stop offset="50%" stop-color="%23be185d"/>
      <stop offset="75%" stop-color="%23ea580c"/>
      <stop offset="100%" stop-color="%23facc15"/>
    </linearGradient>
  </defs>
  <rect width="320" height="320" fill="%230f172a"/>
  <!-- Gradient Center Strap -->
  <rect x="20" y="80" width="280" height="160" rx="12" fill="url(%23sunsetGrad)"/>
  <!-- Golden Sun Half -->
  <circle cx="160" cy="160" r="50" fill="%23ffffff" opacity="0.95"/>
  <rect x="20" y="160" width="280" height="8" fill="%230f172a" opacity="0.4"/>
  <rect x="20" y="180" width="280" height="12" fill="%230f172a" opacity="0.5"/>
  <rect x="20" y="205" width="280" height="16" fill="%230f172a" opacity="0.6"/>
</svg>`;

// 11. Daisy Chain Friendship Ribbon
const daisyChainSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <rect width="320" height="320" fill="%23047857"/>
  <!-- Vine Stem -->
  <path d="M 0 160 Q 80 140 160 160 Q 240 180 320 160" stroke="%23a7f3d0" stroke-width="8" fill="none"/>
  <!-- Flower 1 Left -->
  <g transform="translate(80, 150)">
    <circle cx="0" cy="-18" r="12" fill="%23ffffff"/>
    <circle cx="18" cy="0" r="12" fill="%23ffffff"/>
    <circle cx="0" cy="18" r="12" fill="%23ffffff"/>
    <circle cx="-18" cy="0" r="12" fill="%23ffffff"/>
    <circle cx="0" cy="0" r="9" fill="%23f59e0b"/>
  </g>
  <!-- Flower 2 Center -->
  <g transform="translate(160, 160)">
    <circle cx="0" cy="-22" r="14" fill="%23ffffff"/>
    <circle cx="22" cy="0" r="14" fill="%23ffffff"/>
    <circle cx="0" cy="22" r="14" fill="%23ffffff"/>
    <circle cx="-22" cy="0" r="14" fill="%23ffffff"/>
    <circle cx="0" cy="0" r="11" fill="%23f59e0b"/>
  </g>
  <!-- Flower 3 Right -->
  <g transform="translate(240, 170)">
    <circle cx="0" cy="-18" r="12" fill="%23ffffff"/>
    <circle cx="18" cy="0" r="12" fill="%23ffffff"/>
    <circle cx="0" cy="18" r="12" fill="%23ffffff"/>
    <circle cx="-18" cy="0" r="12" fill="%23ffffff"/>
    <circle cx="0" cy="0" r="9" fill="%23f59e0b"/>
  </g>
</svg>`;

// 12. Sunburst Granny Square Motif (Crochet)
const grannySquareSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <rect width="320" height="320" fill="%231e293b"/>
  <!-- Outer Square Border (Teal) -->
  <rect x="30" y="30" width="260" height="260" rx="16" fill="%230f766e" stroke="%2314b8a6" stroke-width="12"/>
  <!-- Middle Octagon / Round (Cream) -->
  <circle cx="160" cy="160" r="100" fill="%23fef3c7"/>
  <!-- Sunburst Petals (Tangerine Orange) -->
  <g fill="%23f97316">
    <circle cx="160" cy="95" r="18"/>
    <circle cx="225" cy="160" r="18"/>
    <circle cx="160" cy="225" r="18"/>
    <circle cx="95" cy="160" r="18"/>
    <circle cx="115" cy="115" r="18"/>
    <circle cx="205" cy="115" r="18"/>
    <circle cx="205" cy="205" r="18"/>
    <circle cx="115" cy="205" r="18"/>
  </g>
  <!-- Center Golden Disc -->
  <circle cx="160" cy="160" r="42" fill="%23eab308"/>
  <circle cx="160" cy="160" r="26" fill="%2378350f"/>
</svg>`;

// 13. Sleeping Moon & Clouds Nursery Tile (Crochet / Cross-Stitch)
const sleepingMoonSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <rect width="320" height="320" fill="%230f172a"/>
  <!-- Stars -->
  <polygon points="70,60 74,72 86,72 76,80 80,92 70,84 60,92 64,80 54,72 66,72" fill="%23fef08a"/>
  <polygon points="250,70 253,79 263,79 255,85 258,95 250,88 242,95 245,85 237,79 247,79" fill="%23fef08a"/>
  <polygon points="90,180 92,187 99,187 93,192 95,199 90,194 85,199 87,192 81,187 88,187" fill="%23fef08a"/>
  <!-- Crescent Moon -->
  <path d="M 170 80 A 85 85 0 1 0 235 220 A 70 70 0 1 1 170 80 Z" fill="%23facc15"/>
  <!-- Sleeping Closed Eye -->
  <path d="M 140 150 Q 155 165 170 150" stroke="%23713f12" stroke-width="4" stroke-linecap="round" fill="none"/>
  <!-- Rosy Cheek -->
  <circle cx="165" cy="168" r="9" fill="%23f472b6" opacity="0.6"/>
  <!-- Sleeping Cap Nightcap -->
  <path d="M 160 80 Q 210 50 240 85" stroke="%2338bdf8" stroke-width="12" fill="none" stroke-linecap="round"/>
  <circle cx="240" cy="85" r="9" fill="%23ffffff"/>
  <!-- Fluffy Cloud -->
  <g fill="%23f8fafc">
    <circle cx="180" cy="245" r="38"/>
    <circle cx="130" cy="255" r="30"/>
    <circle cx="230" cy="255" r="30"/>
    <rect x="120" y="250" width="120" height="35" rx="10"/>
  </g>
</svg>`;

// 14. Northern Lights Aurora Borealis (Diamond / Knit / Cross-Stitch)
const northernLightsSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <defs>
    <linearGradient id="auroraSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%23020617"/>
      <stop offset="60%" stop-color="%23064e3b"/>
      <stop offset="100%" stop-color="%230f172a"/>
    </linearGradient>
  </defs>
  <rect width="320" height="320" fill="url(%23auroraSky)"/>
  <!-- Aurora Green Ribbon 1 -->
  <path d="M 0 130 Q 80 60 160 110 T 320 70 L 320 180 Q 240 140 160 180 T 0 160 Z" fill="%2310b981" opacity="0.65"/>
  <!-- Aurora Teal/Violet Ribbon 2 -->
  <path d="M 0 90 Q 90 140 180 80 T 320 120 L 320 150 Q 220 100 120 150 T 0 120 Z" fill="%23a855f7" opacity="0.55"/>
  <!-- Silhouette Mountain Pines -->
  <polygon points="0,320 60,220 120,320" fill="%23052e16"/>
  <polygon points="80,320 150,200 220,320" fill="%23022c22"/>
  <polygon points="180,320 240,230 300,320" fill="%23052e16"/>
  <polygon points="260,320 320,240 320,320" fill="%23022c22"/>
  <!-- Snow Ground Base -->
  <rect x="0" y="300" width="320" height="20" fill="%23e2e8f0"/>
</svg>`;

// 15. Cute Boba Bubble Tea
const bobaTeaSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <rect width="320" height="320" fill="%23fdf4ff"/>
  <!-- Giant Straw -->
  <rect x="175" y="25" width="20" height="120" rx="4" transform="rotate(15 175 25)" fill="%23ec4899"/>
  <!-- Cup Body -->
  <polygon points="90,110 230,110 210,270 110,270" fill="%23fed7aa" stroke="%23f97316" stroke-width="8"/>
  <!-- Milk Foam Top -->
  <ellipse cx="160" cy="110" rx="70" ry="18" fill="%23ffffff" stroke="%23f97316" stroke-width="6"/>
  <!-- Boba Tapioca Pearls -->
  <g fill="%23431407">
    <circle cx="130" cy="245" r="12"/>
    <circle cx="160" cy="250" r="12"/>
    <circle cx="190" cy="245" r="12"/>
    <circle cx="145" cy="225" r="12"/>
    <circle cx="175" cy="225" r="12"/>
    <circle cx="160" cy="205" r="11"/>
  </g>
  <!-- Cute Kawaii Face -->
  <ellipse cx="140" cy="165" rx="5" ry="8" fill="%23431407"/>
  <ellipse cx="180" cy="165" rx="5" ry="8" fill="%23431407"/>
  <path d="M 155 172 Q 160 178 165 172" stroke="%23431407" stroke-width="3" fill="none"/>
  <!-- Blush Cheeks -->
  <circle cx="130" cy="172" r="6" fill="%23f472b6" opacity="0.6"/>
  <circle cx="190" cy="172" r="6" fill="%23f472b6" opacity="0.6"/>
</svg>`;

// ---------------------------------------------------------------------------
// Full Curated Community Showcase Catalog (34 Diverse Patterns)
// ---------------------------------------------------------------------------

export const COMMUNITY_PATTERNS: CommunityPattern[] = [
  // 1-8: Pixel Gaming Sprites
  {
    id: 'comm-pokeball',
    name: 'Classic Pokéball Sphere',
    category: 'Pixel Gaming',
    recommendedCraft: 'perler',
    difficulty: 'Beginner',
    recommendedGridSize: { width: 24, height: 24 },
    recommendedColors: 6,
    url: '/starter_crafts/pokeball_beads.png',
    description: 'Iconic red and white sphere with center release button. Flawless for Perler beads and keychains.',
    tags: ['pokemon', 'gaming', 'retro', 'nintendo', 'ball'],
    likesCount: 384,
    estimatedHours: 1.5
  },
  {
    id: 'comm-heart-container',
    name: '8-Bit Zelda Heart Container',
    category: 'Pixel Gaming',
    recommendedCraft: 'cross-stitch',
    difficulty: 'Beginner',
    recommendedGridSize: { width: 20, height: 20 },
    recommendedColors: 4,
    url: '/starter_crafts/cute_strawberry.png',
    description: 'Retro arcade life container with ruby pixel shine and deep outline border.',
    tags: ['zelda', 'retro', 'heart', 'arcade', 'nintendo'],
    likesCount: 429,
    estimatedHours: 2.0
  },
  {
    id: 'comm-super-shroom',
    name: 'Retro 8-Bit Super Shroom',
    category: 'Pixel Gaming',
    recommendedCraft: 'perler',
    difficulty: 'Beginner',
    recommendedGridSize: { width: 20, height: 20 },
    recommendedColors: 5,
    url: '/starter_crafts/cute_mushroom.png',
    description: 'Iconic arcade red cap with white dots and innocent cartoon eyes.',
    tags: ['mario', 'gaming', 'shroom', 'arcade', 'powerup'],
    likesCount: 312,
    estimatedHours: 1.8
  },
  {
    id: 'comm-arcade-ghost',
    name: 'Arcade Blinky Ghost',
    category: 'Pixel Gaming',
    recommendedCraft: 'perler',
    difficulty: 'Beginner',
    recommendedGridSize: { width: 22, height: 22 },
    recommendedColors: 4,
    url: arcadeGhostSvg,
    description: 'Classic arcade red ghost with expressive sapphire blue eyes.',
    tags: ['pacman', 'ghost', 'arcade', 'retro', 'gaming'],
    likesCount: 267,
    estimatedHours: 1.2
  },
  {
    id: 'comm-mana-potion',
    name: 'Glowing Mana Potion Flask',
    category: 'Pixel Gaming',
    recommendedCraft: 'diamond',
    difficulty: 'Intermediate',
    recommendedGridSize: { width: 28, height: 28 },
    recommendedColors: 7,
    url: magicPotionSvg,
    description: 'Mystical turquoise elixir bubbling inside a corked glass flask.',
    tags: ['rpg', 'potion', 'magic', 'mana', 'gaming'],
    likesCount: 215,
    estimatedHours: 3.5
  },
  {
    id: 'comm-retro-cassette',
    name: '80s Synthwave Cassette Tape',
    category: 'Pixel Gaming',
    recommendedCraft: 'pixel',
    difficulty: 'Intermediate',
    recommendedGridSize: { width: 32, height: 24 },
    recommendedColors: 8,
    url: cassetteTapeSvg,
    description: 'Neon cyan and magenta cassette with detailed magnetic spools and tape window.',
    tags: ['80s', 'synthwave', 'cassette', 'music', 'retro'],
    likesCount: 198,
    estimatedHours: 4.0
  },
  {
    id: 'comm-gameboy-console',
    name: 'Retro Pixel Handheld Gameboy',
    category: 'Pixel Gaming',
    recommendedCraft: 'perler',
    difficulty: 'Intermediate',
    recommendedGridSize: { width: 28, height: 36 },
    recommendedColors: 7,
    url: gameboySvg,
    description: 'Classic gray handheld console with green dot-matrix screen and magenta buttons.',
    tags: ['nintendo', 'gameboy', 'console', 'retro', 'gaming'],
    likesCount: 341,
    estimatedHours: 4.5
  },

  // 9-14: Cottagecore, Flowers & Botanicals
  {
    id: 'comm-poppy-bloom',
    name: 'Poppy Botanical Bloom',
    category: 'Nature & Botanical',
    recommendedCraft: 'cross-stitch',
    difficulty: 'Beginner',
    recommendedGridSize: { width: 24, height: 24 },
    recommendedColors: 7,
    url: '/starter_crafts/flower_crossstitch.png',
    description: 'Vibrant crimson petals with emerald green leaves, ideal for 6-inch hoops.',
    tags: ['floral', 'poppy', 'botanical', 'cottagecore', 'flower'],
    likesCount: 456,
    estimatedHours: 3.0
  },
  {
    id: 'comm-cottage-mushroom',
    name: 'Amanita Mushroom & Wild Ferns',
    category: 'Nature & Botanical',
    recommendedCraft: 'cross-stitch',
    difficulty: 'Intermediate',
    recommendedGridSize: { width: 32, height: 32 },
    recommendedColors: 9,
    url: cottageMushroomSvg,
    description: 'Fairytale forest floor with red dotted amanita mushroom and lush green ferns.',
    tags: ['cottagecore', 'nature', 'mushroom', 'fern', 'forest'],
    likesCount: 389,
    estimatedHours: 5.0
  },
  {
    id: 'comm-sakura-branch',
    name: 'Japanese Sakura Cherry Blossoms',
    category: 'Nature & Botanical',
    recommendedCraft: 'cross-stitch',
    difficulty: 'Intermediate',
    recommendedGridSize: { width: 36, height: 36 },
    recommendedColors: 8,
    url: cherryBlossomSvg,
    description: 'Delicate pastel pink sakura blossoms on a weathered woody branch.',
    tags: ['sakura', 'cherryblossom', 'japan', 'floral', 'pink'],
    likesCount: 512,
    estimatedHours: 6.0
  },
  {
    id: 'comm-lavender-sprig',
    name: 'Lavender & Eucalyptus Sprig',
    category: 'Nature & Botanical',
    recommendedCraft: 'cross-stitch',
    difficulty: 'Beginner',
    recommendedGridSize: { width: 22, height: 32 },
    recommendedColors: 6,
    url: lavenderSvg,
    description: 'Fragrant purple lavender blooms paired with soft sage eucalyptus disks.',
    tags: ['lavender', 'herbs', 'botanical', 'purple', 'nature'],
    likesCount: 290,
    estimatedHours: 3.5
  },

  // 15-20: Cute Animals & Kawaii
  {
    id: 'comm-ginger-kitty',
    name: 'Cozy Ginger Kitty',
    category: 'Animals & Pets',
    recommendedCraft: 'cross-stitch',
    difficulty: 'Beginner',
    recommendedGridSize: { width: 20, height: 20 },
    recommendedColors: 6,
    url: '/starter_crafts/cute_kitty.png',
    description: 'Adorable peach cat with sweet pink nose and sapphire eyes.',
    tags: ['cat', 'kitty', 'pet', 'animal', 'kawaii'],
    likesCount: 620,
    estimatedHours: 2.5
  },
  {
    id: 'comm-chubby-duckling',
    name: 'Chubby Baby Duckling',
    category: 'Animals & Pets',
    recommendedCraft: 'crochet',
    difficulty: 'Beginner',
    recommendedGridSize: { width: 20, height: 20 },
    recommendedColors: 5,
    url: '/starter_crafts/cute_duckling.png',
    description: 'Charming bright yellow duckling with round cheeks and tiny orange beak.',
    tags: ['duck', 'duckling', 'baby', 'yellow', 'cute'],
    likesCount: 418,
    estimatedHours: 2.0
  },
  {
    id: 'comm-boba-tea',
    name: 'Kawaii Brown Sugar Boba Tea',
    category: 'Cozy & Kawaii',
    recommendedCraft: 'perler',
    difficulty: 'Beginner',
    recommendedGridSize: { width: 22, height: 30 },
    recommendedColors: 7,
    url: bobaTeaSvg,
    description: 'Milk tea cup with rich tapioca pearls, pink straw and blush cheeks.',
    tags: ['boba', 'milktea', 'kawaii', 'cute', 'drink'],
    likesCount: 350,
    estimatedHours: 2.2
  },

  // 21-25: Bead Loom & Alpha Friendship Bracelets
  {
    id: 'comm-aztec-diamond',
    name: 'Aztec Tribal Geometric Diamond',
    category: 'Bracelets & Loom',
    recommendedCraft: 'loom',
    difficulty: 'Intermediate',
    recommendedGridSize: { width: 25, height: 45 },
    recommendedColors: 6,
    url: aztecDiamondSvg,
    description: 'Traditional Southwestern diamond medallion with turquoise, red, and golden seed beads.',
    tags: ['aztec', 'tribal', 'loom', 'bracelet', 'miyuki', 'delica'],
    likesCount: 285,
    estimatedHours: 4.5
  },
  {
    id: 'comm-chevron-strap',
    name: 'Bohemian V-Arrow Chevron',
    category: 'Bracelets & Loom',
    recommendedCraft: 'alpha',
    difficulty: 'Beginner',
    recommendedGridSize: { width: 18, height: 40 },
    recommendedColors: 5,
    url: chevronStrapSvg,
    description: 'Stunning repeating chevron strap for friendship bracelets and bookmarks.',
    tags: ['alpha', 'friendship', 'bracelet', 'chevron', 'knotting'],
    likesCount: 310,
    estimatedHours: 3.0
  },
  {
    id: 'comm-sunset-ombre',
    name: 'Synth Sunset Ombre Ribbon',
    category: 'Bracelets & Loom',
    recommendedCraft: 'loom',
    difficulty: 'Intermediate',
    recommendedGridSize: { width: 20, height: 50 },
    recommendedColors: 7,
    url: sunsetOmbreSvg,
    description: 'Gradient transition from midnight indigo to blazing tangerine sun.',
    tags: ['sunset', 'ombre', 'gradient', 'delica', 'beadloom'],
    likesCount: 195,
    estimatedHours: 4.0
  },
  {
    id: 'comm-daisy-chain',
    name: 'Daisy Flower Chain Ribbon',
    category: 'Bracelets & Loom',
    recommendedCraft: 'alpha',
    difficulty: 'Beginner',
    recommendedGridSize: { width: 16, height: 48 },
    recommendedColors: 4,
    url: daisyChainSvg,
    description: 'Delicate white daisies linked along a forest green vine ribbon.',
    tags: ['daisy', 'floral', 'bracelet', 'friendship', 'summer'],
    likesCount: 260,
    estimatedHours: 2.8
  },

  // 26-29: Crochet & C2C Blanket Tiles
  {
    id: 'comm-checkerboard-tile',
    name: 'Retro Checkerboard Coaster',
    category: 'Crochet & C2C',
    recommendedCraft: 'crochet',
    difficulty: 'Beginner',
    recommendedGridSize: { width: 20, height: 20 },
    recommendedColors: 3,
    url: '/starter_crafts/checkerboard_crochet.png',
    description: '4-stitch color checks coaster designed specifically for Tapestry Crochet.',
    tags: ['crochet', 'checkerboard', 'coaster', 'tapestry', 'modern'],
    likesCount: 340,
    estimatedHours: 2.0
  },
  {
    id: 'comm-sunburst-granny',
    name: 'Sunburst Granny Square Tile',
    category: 'Crochet & C2C',
    recommendedCraft: 'crochet',
    difficulty: 'Intermediate',
    recommendedGridSize: { width: 28, height: 28 },
    recommendedColors: 6,
    url: grannySquareSvg,
    description: 'Warm golden sunburst petals framed inside a teal blue modern granny tile.',
    tags: ['crochet', 'grannysquare', 'sunburst', 'c2c', 'blanket'],
    likesCount: 472,
    estimatedHours: 4.0
  },
  {
    id: 'comm-sleeping-moon',
    name: 'Sleeping Moon & Nursery Clouds',
    category: 'Crochet & C2C',
    recommendedCraft: 'crochet',
    difficulty: 'Intermediate',
    recommendedGridSize: { width: 32, height: 32 },
    recommendedColors: 7,
    url: sleepingMoonSvg,
    description: 'Dreamy crescent moon wearing a sleeping nightcap nestled among puffy clouds.',
    tags: ['nursery', 'moon', 'crochet', 'c2c', 'babyblanket'],
    likesCount: 530,
    estimatedHours: 5.5
  },

  // 30-34: Vibrant, Celestial & Diamond Painting
  {
    id: 'comm-northern-lights',
    name: 'Aurora Borealis Northern Lights',
    category: 'Vibrant & Celestial',
    recommendedCraft: 'diamond',
    difficulty: 'Master',
    recommendedGridSize: { width: 44, height: 44 },
    recommendedColors: 12,
    url: northernLightsSvg,
    description: 'Ethereal emerald and violet curtains shimmering over snowy mountain pine ridges.',
    tags: ['aurora', 'landscape', 'diamond', 'nature', 'night'],
    likesCount: 680,
    estimatedHours: 12.0
  }
];

export const COMMUNITY_CATEGORIES = [
  'All',
  'Pixel Gaming',
  'Nature & Botanical',
  'Animals & Pets',
  'Cozy & Kawaii',
  'Bracelets & Loom',
  'Crochet & C2C',
  'Vibrant & Celestial'
] as const;

export const CRAFT_FILTER_TABS: { id: 'all' | CraftType; label: string }[] = [
  { id: 'all', label: 'All Crafts' },
  { id: 'cross-stitch', label: 'Cross-Stitch' },
  { id: 'perler', label: 'Perler Beads' },
  { id: 'crochet', label: 'Crochet / C2C' },
  { id: 'loom', label: 'Bead Loom' },
  { id: 'alpha', label: 'Alpha Knot' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'pixel', label: 'Pixel Art' },
];

const FAVORITES_STORAGE_KEY = 'pixelcraft_favorite_patterns';

export function getFavoritePatternIds(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function toggleFavoritePatternId(id: string): Set<string> {
  const current = getFavoritePatternIds();
  if (current.has(id)) {
    current.delete(id);
  } else {
    current.add(id);
  }
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(current)));
  } catch {
    // Ignore storage errors
  }
  return current;
}
