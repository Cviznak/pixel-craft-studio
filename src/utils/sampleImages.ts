import type { SampleImage } from '../types/craft';

// High-fidelity SVG artwork encoded as data URLs with vibrant colors
const flowerSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%231a362a"/>
      <stop offset="100%" stop-color="%230b1712"/>
    </radialGradient>
    <linearGradient id="petal1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23ff1493"/>
      <stop offset="50%" stop-color="%23ff4500"/>
      <stop offset="100%" stop-color="%23ffd700"/>
    </linearGradient>
    <linearGradient id="petal2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%23e91e63"/>
      <stop offset="100%" stop-color="%239c27b0"/>
    </linearGradient>
    <linearGradient id="leaf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%234caf50"/>
      <stop offset="100%" stop-color="%231b5e20"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(%23bg)"/>
  <!-- Leaves -->
  <path d="M 120 280 C 60 220, 60 140, 150 170 C 180 230, 160 270, 120 280 Z" fill="url(%23leaf)"/>
  <path d="M 280 280 C 340 220, 340 140, 250 170 C 220 230, 240 270, 280 280 Z" fill="url(%23leaf)"/>
  <!-- Stem -->
  <path d="M 200 240 Q 200 360 210 400" stroke="%232e7d32" stroke-width="12" fill="none" stroke-linecap="round"/>
  <!-- Outer Petals -->
  <circle cx="200" cy="130" r="50" fill="url(%23petal1)" opacity="0.95"/>
  <circle cx="260" cy="165" r="50" fill="url(%23petal2)" opacity="0.95"/>
  <circle cx="240" cy="235" r="50" fill="url(%23petal1)" opacity="0.95"/>
  <circle cx="160" cy="235" r="50" fill="url(%23petal2)" opacity="0.95"/>
  <circle cx="140" cy="165" r="50" fill="url(%23petal1)" opacity="0.95"/>
  <!-- Inner Bloom -->
  <circle cx="200" cy="190" r="42" fill="%23ff0055"/>
  <circle cx="200" cy="190" r="28" fill="%23ff9800"/>
  <circle cx="200" cy="190" r="16" fill="%23ffeb3b"/>
  <!-- Center Pistil Dots -->
  <circle cx="195" cy="185" r="4" fill="%23ffffff"/>
  <circle cx="205" cy="186" r="3.5" fill="%23ffffff"/>
  <circle cx="200" cy="196" r="3.5" fill="%23ffffff"/>
  <circle cx="192" cy="193" r="3" fill="%23ffffff"/>
</svg>`;

const catSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <radialGradient id="warmBg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%23ffe0b2"/>
      <stop offset="100%" stop-color="%23ffb74d"/>
    </radialGradient>
    <linearGradient id="gingerFur" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%23ff7043"/>
      <stop offset="100%" stop-color="%23d84315"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(%23warmBg)"/>
  <!-- Cat Ears -->
  <polygon points="120,180 90,80 180,130" fill="%23e64a19"/>
  <polygon points="125,170 105,95 170,135" fill="%23ffab91"/>
  <polygon points="280,180 310,80 220,130" fill="%23e64a19"/>
  <polygon points="275,170 295,95 230,135" fill="%23ffab91"/>
  <!-- Head -->
  <ellipse cx="200" cy="220" rx="100" ry="85" fill="url(%23gingerFur)"/>
  <!-- Cheeks White Fur -->
  <ellipse cx="160" cy="245" rx="45" ry="35" fill="%23ffffff"/>
  <ellipse cx="240" cy="245" rx="45" ry="35" fill="%23ffffff"/>
  <ellipse cx="200" cy="205" rx="30" ry="40" fill="%23ffe082"/>
  <!-- Eyes -->
  <ellipse cx="155" cy="205" rx="20" ry="24" fill="%230288d1"/>
  <ellipse cx="155" cy="205" rx="10" ry="22" fill="%2301579b"/>
  <ellipse cx="155" cy="205" rx="6" ry="18" fill="%231a237e"/>
  <circle cx="150" cy="198" r="6" fill="%23ffffff"/>
  <circle cx="160" cy="212" r="3" fill="%23ffffff"/>
  <ellipse cx="245" cy="205" rx="20" ry="24" fill="%230288d1"/>
  <ellipse cx="245" cy="205" rx="10" ry="22" fill="%2301579b"/>
  <ellipse cx="245" cy="205" rx="6" ry="18" fill="%231a237e"/>
  <circle cx="240" cy="198" r="6" fill="%23ffffff"/>
  <circle cx="250" cy="212" r="3" fill="%23ffffff"/>
  <!-- Nose & Mouth -->
  <polygon points="200,240 190,230 210,230" fill="%23f48fb1"/>
  <path d="M 200 240 Q 185 255 175 250" stroke="%23ad1457" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M 200 240 Q 215 255 225 250" stroke="%23ad1457" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Whiskers -->
  <line x1="140" y1="240" x2="80" y2="230" stroke="%23ffffff" stroke-width="3" stroke-linecap="round"/>
  <line x1="140" y1="250" x2="75" y2="255" stroke="%23ffffff" stroke-width="3" stroke-linecap="round"/>
  <line x1="260" y1="240" x2="320" y2="230" stroke="%23ffffff" stroke-width="3" stroke-linecap="round"/>
  <line x1="260" y1="250" x2="325" y2="255" stroke="%23ffffff" stroke-width="3" stroke-linecap="round"/>
</svg>`;

const sunsetSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%231a0842"/>
      <stop offset="35%" stop-color="%237b1fa2"/>
      <stop offset="65%" stop-color="%23e91e63"/>
      <stop offset="85%" stop-color="%23ff9800"/>
      <stop offset="100%" stop-color="%23ffd54f"/>
    </linearGradient>
    <linearGradient id="sun" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%23fff59d"/>
      <stop offset="50%" stop-color="%23ff80ab"/>
      <stop offset="100%" stop-color="%23d81b60"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(%23sky)"/>
  <!-- Glowing Sun -->
  <circle cx="200" cy="210" r="75" fill="url(%23sun)"/>
  <!-- Sun stripes (synthwave style) -->
  <rect x="120" y="215" width="160" height="5" fill="%237b1fa2"/>
  <rect x="125" y="228" width="150" height="7" fill="%237b1fa2"/>
  <rect x="135" y="243" width="130" height="9" fill="%237b1fa2"/>
  <rect x="150" y="260" width="100" height="12" fill="%237b1fa2"/>
  <!-- Mountain Silhouettes -->
  <polygon points="0,320 80,240 180,310 260,230 360,330 400,310 400,400 0,400" fill="%23240046"/>
  <!-- Sea / Grid Base -->
  <polygon points="0,320 400,320 400,400 0,400" fill="%230d0121"/>
  <!-- Palm Trees -->
  <path d="M 50 350 Q 80 260 70 200" stroke="%23120129" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M 70 200 Q 110 205 130 225" stroke="%23120129" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M 70 200 Q 90 170 120 180" stroke="%23120129" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M 70 200 Q 40 170 10 180" stroke="%23120129" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M 70 200 Q 30 215 10 230" stroke="%23120129" stroke-width="5" fill="none" stroke-linecap="round"/>
</svg>`;

const parrotSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <radialGradient id="jungle" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%231b5e20"/>
      <stop offset="100%" stop-color="%23002f08"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(%23jungle)"/>
  <!-- Tropical Foliage -->
  <circle cx="80" cy="80" r="100" fill="%232e7d32" opacity="0.6"/>
  <circle cx="340" cy="340" r="120" fill="%23388e3c" opacity="0.6"/>
  <!-- Branch -->
  <path d="M 20 300 Q 200 270 380 320" stroke="%234e342e" stroke-width="16" fill="none" stroke-linecap="round"/>
  <!-- Parrot Body -->
  <ellipse cx="210" cy="210" rx="50" ry="90" fill="%23d50000"/>
  <!-- Wing -->
  <path d="M 210 160 C 270 170, 280 270, 200 280 C 180 250, 190 190, 210 160 Z" fill="%232979ff"/>
  <path d="M 210 190 C 260 200, 260 250, 200 260 Z" fill="%23ffd600"/>
  <path d="M 200 230 C 240 240, 250 270, 195 275 Z" fill="%2300c853"/>
  <!-- Head -->
  <circle cx="180" cy="115" r="45" fill="%23d50000"/>
  <circle cx="160" cy="115" r="22" fill="%23ffffff"/>
  <circle cx="160" cy="115" r="9" fill="%23212121"/>
  <circle cx="158" cy="112" r="3" fill="%23ffffff"/>
  <!-- Beak -->
  <path d="M 140 100 Q 90 110 100 155 Q 135 130 145 130 Z" fill="%23fff176"/>
  <path d="M 125 125 Q 105 135 102 153 Q 130 140 138 135 Z" fill="%23212121"/>
  <!-- Tail Feathers -->
  <polygon points="190,290 220,290 205,390" fill="%2300b0ff"/>
  <polygon points="180,290 205,290 190,370" fill="%23ff1744"/>
</svg>`;

const mushroomSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="skyPix" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%234fc3f7"/>
      <stop offset="100%" stop-color="%23b3e5fc"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(%23skyPix)"/>
  <!-- Rolling Green Hill -->
  <circle cx="200" cy="460" r="200" fill="%2343a047"/>
  <circle cx="200" cy="460" r="185" fill="%2366bb6a"/>
  <!-- Stem -->
  <rect x="150" y="210" width="100" height="110" rx="40" fill="%23fff8e1"/>
  <ellipse cx="170" cy="255" rx="8" ry="16" fill="%23212121"/>
  <ellipse cx="230" cy="255" rx="8" ry="16" fill="%23212121"/>
  <circle cx="168" cy="250" r="3" fill="%23ffffff"/>
  <circle cx="228" cy="250" r="3" fill="%23ffffff"/>
  <!-- Mushroom Cap -->
  <path d="M 70 220 C 70 90, 330 90, 330 220 C 330 240, 70 240, 70 220 Z" fill="%23e53935"/>
  <!-- White Spots -->
  <circle cx="200" cy="140" r="30" fill="%23ffffff"/>
  <circle cx="120" cy="170" r="22" fill="%23ffffff"/>
  <circle cx="280" cy="170" r="22" fill="%23ffffff"/>
  <circle cx="180" cy="210" r="16" fill="%23ffffff"/>
  <circle cx="250" cy="205" r="14" fill="%23ffffff"/>
</svg>`;

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'flower',
    name: 'Vibrant Hibiscus',
    category: 'Nature & Botanical',
    url: flowerSvg,
    description: 'Rich magenta, fiery orange, and deep emerald greens'
  },
  {
    id: 'cat',
    name: 'Kawaii Ginger Cat',
    category: 'Animals & Pets',
    url: catSvg,
    description: 'Warm ginger fur and sapphire blue eyes'
  },
  {
    id: 'sunset',
    name: 'Synthwave Horizon',
    category: 'Vibrant Gradients',
    url: sunsetSvg,
    description: 'Purple, neon pink, and golden sun tones'
  },
  {
    id: 'parrot',
    name: 'Tropical Macaw',
    category: 'Exotic Birds',
    url: parrotSvg,
    description: 'Primary reds, vivid blues, and lush forest greens'
  },
  {
    id: 'mushroom',
    name: 'Retro 8-bit Shroom',
    category: 'Pixel Gaming',
    url: mushroomSvg,
    description: 'Iconic red cap, white dots, and sky blue backdrop'
  }
];
