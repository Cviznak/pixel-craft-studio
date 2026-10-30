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
  <path d="M 120 280 C 60 220, 60 140, 150 170 C 180 230, 160 270, 120 280 Z" fill="url(%23leaf)"/>
  <path d="M 280 280 C 340 220, 340 140, 250 170 C 220 230, 240 270, 280 280 Z" fill="url(%23leaf)"/>
  <path d="M 200 240 Q 200 360 210 400" stroke="%232e7d32" stroke-width="12" fill="none" stroke-linecap="round"/>
  <circle cx="200" cy="130" r="50" fill="url(%23petal1)" opacity="0.95"/>
  <circle cx="260" cy="165" r="50" fill="url(%23petal2)" opacity="0.95"/>
  <circle cx="240" cy="235" r="50" fill="url(%23petal1)" opacity="0.95"/>
  <circle cx="160" cy="235" r="50" fill="url(%23petal2)" opacity="0.95"/>
  <circle cx="140" cy="165" r="50" fill="url(%23petal1)" opacity="0.95"/>
  <circle cx="200" cy="190" r="42" fill="%23ff0055"/>
  <circle cx="200" cy="190" r="28" fill="%23ff9800"/>
  <circle cx="200" cy="190" r="16" fill="%23ffeb3b"/>
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
  <polygon points="120,180 90,80 180,130" fill="%23e64a19"/>
  <polygon points="125,170 105,95 170,135" fill="%23ffab91"/>
  <polygon points="280,180 310,80 220,130" fill="%23e64a19"/>
  <polygon points="275,170 295,95 230,135" fill="%23ffab91"/>
  <ellipse cx="200" cy="220" rx="100" ry="85" fill="url(%23gingerFur)"/>
  <ellipse cx="160" cy="245" rx="45" ry="35" fill="%23ffffff"/>
  <ellipse cx="240" cy="245" rx="45" ry="35" fill="%23ffffff"/>
  <ellipse cx="200" cy="205" rx="30" ry="40" fill="%23ffe082"/>
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
  <polygon points="200,240 190,230 210,230" fill="%23f48fb1"/>
  <path d="M 200 240 Q 185 255 175 250" stroke="%23ad1457" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M 200 240 Q 215 255 225 250" stroke="%23ad1457" stroke-width="3" fill="none" stroke-linecap="round"/>
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
  <circle cx="200" cy="210" r="75" fill="url(%23sun)"/>
  <rect x="120" y="215" width="160" height="5" fill="%237b1fa2"/>
  <rect x="125" y="228" width="150" height="7" fill="%237b1fa2"/>
  <rect x="135" y="243" width="130" height="9" fill="%237b1fa2"/>
  <rect x="150" y="260" width="100" height="12" fill="%237b1fa2"/>
  <polygon points="0,320 80,240 180,310 260,230 360,330 400,310 400,400 0,400" fill="%23240046"/>
  <polygon points="0,320 400,320 400,400 0,400" fill="%230d0121"/>
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
  <circle cx="80" cy="80" r="100" fill="%232e7d32" opacity="0.6"/>
  <circle cx="340" cy="340" r="120" fill="%23388e3c" opacity="0.6"/>
  <path d="M 20 300 Q 200 270 380 320" stroke="%234e342e" stroke-width="16" fill="none" stroke-linecap="round"/>
  <ellipse cx="210" cy="210" rx="50" ry="90" fill="%23d50000"/>
  <path d="M 210 160 C 270 170, 280 270, 200 280 C 180 250, 190 190, 210 160 Z" fill="%232979ff"/>
  <path d="M 210 190 C 260 200, 260 250, 200 260 Z" fill="%23ffd600"/>
  <path d="M 200 230 C 240 240, 250 270, 195 275 Z" fill="%2300c853"/>
  <circle cx="180" cy="115" r="45" fill="%23d50000"/>
  <circle cx="160" cy="115" r="22" fill="%23ffffff"/>
  <circle cx="160" cy="115" r="9" fill="%23212121"/>
  <circle cx="158" cy="112" r="3" fill="%23ffffff"/>
  <path d="M 140 100 Q 90 110 100 155 Q 135 130 145 130 Z" fill="%23fff176"/>
  <path d="M 125 125 Q 105 135 102 153 Q 130 140 138 135 Z" fill="%23212121"/>
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
  <circle cx="200" cy="460" r="200" fill="%2343a047"/>
  <circle cx="200" cy="460" r="185" fill="%2366bb6a"/>
  <rect x="150" y="210" width="100" height="110" rx="40" fill="%23fff8e1"/>
  <ellipse cx="170" cy="255" rx="8" ry="16" fill="%23212121"/>
  <ellipse cx="230" cy="255" rx="8" ry="16" fill="%23212121"/>
  <circle cx="168" cy="250" r="3" fill="%23ffffff"/>
  <circle cx="228" cy="250" r="3" fill="%23ffffff"/>
  <path d="M 70 220 C 70 90, 330 90, 330 220 C 330 240, 70 240, 70 220 Z" fill="%23e53935"/>
  <circle cx="200" cy="140" r="30" fill="%23ffffff"/>
  <circle cx="120" cy="170" r="22" fill="%23ffffff"/>
  <circle cx="280" cy="170" r="22" fill="%23ffffff"/>
  <circle cx="180" cy="210" r="16" fill="%23ffffff"/>
  <circle cx="250" cy="205" r="14" fill="%23ffffff"/>
</svg>`;

const pokeballSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <radialGradient id="pokeBg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%231e293b"/>
      <stop offset="100%" stop-color="%230f172a"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(%23pokeBg)"/>
  <!-- Pokeball outer circle -->
  <circle cx="200" cy="200" r="130" fill="%23ffffff" stroke="%23111827" stroke-width="16"/>
  <!-- Top Red Half -->
  <path d="M 70 200 A 130 130 0 0 1 330 200 Z" fill="%23ef4444"/>
  <!-- Highlight on red -->
  <path d="M 110 140 A 100 100 0 0 1 200 100" stroke="%23fca5a5" stroke-width="14" stroke-linecap="round" fill="none"/>
  <!-- Center Black Belt -->
  <line x1="70" y1="200" x2="330" y2="200" stroke="%23111827" stroke-width="18"/>
  <!-- Center Button Outer Ring -->
  <circle cx="200" cy="200" r="42" fill="%23111827"/>
  <!-- Center Button White Core -->
  <circle cx="200" cy="200" r="26" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="4"/>
  <circle cx="200" cy="200" r="14" fill="%23f8fafc"/>
</svg>`;

const heartSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="%230f172a"/>
  <!-- Retro 8-bit Zelda Pixel Heart -->
  <g fill="%23000000">
    <rect x="100" y="80" width="80" height="20"/>
    <rect x="220" y="80" width="80" height="20"/>
    <rect x="80" y="100" width="20" height="80"/>
    <rect x="180" y="100" width="40" height="40"/>
    <rect x="300" y="100" width="20" height="80"/>
    <rect x="80" y="180" width="20" height="40"/>
    <rect x="300" y="180" width="20" height="40"/>
    <rect x="100" y="220" width="20" height="40"/>
    <rect x="280" y="220" width="20" height="40"/>
    <rect x="120" y="260" width="20" height="40"/>
    <rect x="260" y="260" width="20" height="40"/>
    <rect x="140" y="300" width="20" height="40"/>
    <rect x="240" y="300" width="20" height="40"/>
    <rect x="160" y="340" width="80" height="20"/>
  </g>
  <!-- Red Crimson Core -->
  <g fill="%23dc2626">
    <rect x="100" y="100" width="80" height="80"/>
    <rect x="220" y="100" width="80" height="80"/>
    <rect x="100" y="180" width="200" height="40"/>
    <rect x="120" y="220" width="160" height="40"/>
    <rect x="140" y="260" width="120" height="40"/>
    <rect x="160" y="300" width="80" height="40"/>
  </g>
  <!-- Bright Ruby Layer -->
  <g fill="%23ef4444">
    <rect x="120" y="120" width="40" height="60"/>
    <rect x="240" y="120" width="40" height="60"/>
    <rect x="120" y="180" width="160" height="20"/>
    <rect x="140" y="200" width="120" height="20"/>
    <rect x="160" y="220" width="80" height="40"/>
  </g>
  <!-- Specular Pixel Highlights -->
  <g fill="%23ffffff">
    <rect x="120" y="100" width="20" height="20"/>
    <rect x="100" y="120" width="20" height="40"/>
    <rect x="240" y="100" width="20" height="20"/>
  </g>
</svg>`;

const foxSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="forestBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%231e3a2f"/>
      <stop offset="100%" stop-color="%230f1e18"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(%23forestBg)"/>
  <!-- Fox Ears Outer -->
  <polygon points="120,200 90,80 190,150" fill="%23ea580c"/>
  <polygon points="280,200 310,80 210,150" fill="%23ea580c"/>
  <!-- Ears Inner Dark -->
  <polygon points="125,185 105,100 175,150" fill="%23431407"/>
  <polygon points="275,185 295,100 225,150" fill="%23431407"/>
  <!-- Head Main Orange -->
  <polygon points="200,320 80,180 320,180" fill="%23f97316"/>
  <!-- White Cheeks -->
  <polygon points="200,320 80,180 150,230" fill="%23fff7ed"/>
  <polygon points="200,320 320,180 250,230" fill="%23fff7ed"/>
  <polygon points="200,320 150,230 250,230" fill="%23ffedd5"/>
  <!-- Fox Eyes (Almond Sleek) -->
  <ellipse cx="155" cy="195" rx="14" ry="8" transform="rotate(-15 155 195)" fill="%231c1917"/>
  <ellipse cx="245" cy="195" rx="14" ry="8" transform="rotate(15 245 195)" fill="%231c1917"/>
  <circle cx="157" cy="193" r="3" fill="%23ffffff"/>
  <circle cx="243" cy="193" r="3" fill="%23ffffff"/>
  <!-- Cute Black Nose -->
  <polygon points="200,320 188,304 212,304" fill="%230c0a09"/>
</svg>`;

const coffeeSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="%23261612"/>
  <!-- Saucer -->
  <ellipse cx="200" cy="330" rx="120" ry="25" fill="%23d7ccc8"/>
  <ellipse cx="200" cy="326" rx="95" ry="18" fill="%23bcaaa4"/>
  <!-- Handle -->
  <path d="M 270 210 Q 350 210 330 270 Q 310 300 260 290" stroke="%23ffedd5" stroke-width="20" fill="none" stroke-linecap="round"/>
  <!-- Mug Body -->
  <rect x="120" y="190" width="160" height="120" rx="20" fill="%23fff7ed"/>
  <ellipse cx="200" cy="190" rx="80" ry="25" fill="%23ffedd5"/>
  <ellipse cx="200" cy="190" rx="70" ry="20" fill="%234a2810"/>
  <!-- Latte Art Swirl Heart -->
  <ellipse cx="190" cy="188" rx="16" ry="12" fill="%23fed7aa"/>
  <ellipse cx="210" cy="188" rx="16" ry="12" fill="%23fed7aa"/>
  <polygon points="200,202 176,190 224,190" fill="%23fed7aa"/>
  <!-- Steam Trails -->
  <path d="M 170 140 Q 150 100 170 60" stroke="%23fed7aa" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.7"/>
  <path d="M 200 130 Q 220 90 200 50" stroke="%23fed7aa" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.8"/>
  <path d="M 230 140 Q 250 100 230 60" stroke="%23fed7aa" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.7"/>
</svg>`;

const sunflowerSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <radialGradient id="skyB" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%230284c7"/>
      <stop offset="100%" stop-color="%230369a1"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(%23skyB)"/>
  <!-- Leaves -->
  <path d="M 200 250 Q 80 270 90 380 Q 200 360 200 250" fill="%2316a34a"/>
  <path d="M 200 250 Q 320 270 310 380 Q 200 360 200 250" fill="%2315803d"/>
  <!-- Stem -->
  <line x1="200" y1="200" x2="200" y2="400" stroke="%2314532d" stroke-width="16"/>
  <!-- Outer Petals (Ring 1) -->
  <g fill="%23eab308">
    <ellipse cx="200" cy="90" rx="18" ry="48"/>
    <ellipse cx="200" cy="270" rx="18" ry="48"/>
    <ellipse cx="110" cy="180" rx="48" ry="18"/>
    <ellipse cx="290" cy="180" rx="48" ry="18"/>
    <ellipse cx="135" cy="115" rx="48" ry="18" transform="rotate(45 135 115)"/>
    <ellipse cx="265" cy="245" rx="48" ry="18" transform="rotate(45 265 245)"/>
    <ellipse cx="265" cy="115" rx="48" ry="18" transform="rotate(-45 265 115)"/>
    <ellipse cx="135" cy="245" rx="48" ry="18" transform="rotate(-45 135 245)"/>
  </g>
  <!-- Inner Petals (Ring 2 Golden Orange) -->
  <g fill="%23f59e0b">
    <ellipse cx="200" cy="105" rx="14" ry="40"/>
    <ellipse cx="200" cy="255" rx="14" ry="40"/>
    <ellipse cx="125" cy="180" rx="40" ry="14"/>
    <ellipse cx="275" cy="180" rx="40" ry="14"/>
    <ellipse cx="145" cy="125" rx="40" ry="14" transform="rotate(45 145 125)"/>
    <ellipse cx="255" cy="235" rx="40" ry="14" transform="rotate(45 255 235)"/>
    <ellipse cx="255" cy="125" rx="40" ry="14" transform="rotate(-45 255 125)"/>
    <ellipse cx="145" cy="235" rx="40" ry="14" transform="rotate(-45 145 235)"/>
  </g>
  <!-- Seed Disc Center -->
  <circle cx="200" cy="180" r="56" fill="%23451a03"/>
  <circle cx="200" cy="180" r="42" fill="%2378350f"/>
  <circle cx="200" cy="180" r="26" fill="%2392400e"/>
</svg>`;

const rainbowSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="cloudSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%2338bdf8"/>
      <stop offset="100%" stop-color="%23bae6fd"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(%23cloudSky)"/>
  <!-- Rainbow Arcs -->
  <circle cx="200" cy="280" r="150" stroke="%23ef4444" stroke-width="16" fill="none"/>
  <circle cx="200" cy="280" r="134" stroke="%23f97316" stroke-width="16" fill="none"/>
  <circle cx="200" cy="280" r="118" stroke="%23eab308" stroke-width="16" fill="none"/>
  <circle cx="200" cy="280" r="102" stroke="%2322c55e" stroke-width="16" fill="none"/>
  <circle cx="200" cy="280" r="86" stroke="%233b82f6" stroke-width="16" fill="none"/>
  <circle cx="200" cy="280" r="70" stroke="%23a855f7" stroke-width="16" fill="none"/>
  <!-- Left Puffy Cloud -->
  <g fill="%23ffffff">
    <circle cx="90" cy="280" r="40"/>
    <circle cx="60" cy="290" r="30"/>
    <circle cx="120" cy="295" r="32"/>
    <rect x="50" y="285" width="80" height="35" rx="10"/>
  </g>
  <!-- Right Puffy Cloud -->
  <g fill="%23ffffff">
    <circle cx="310" cy="280" r="40"/>
    <circle cx="280" cy="295" r="32"/>
    <circle cx="340" cy="290" r="30"/>
    <rect x="270" y="285" width="80" height="35" rx="10"/>
  </g>
</svg>`;

const swordSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="%230f172a"/>
  <!-- 8-Bit Pixel Hero Sword on Diagonal -->
  <!-- Blade Tip & Edge -->
  <g fill="%23e2e8f0">
    <rect x="300" y="60" width="25" height="25"/>
    <rect x="275" y="85" width="25" height="25"/>
    <rect x="250" y="110" width="25" height="25"/>
    <rect x="225" y="135" width="25" height="25"/>
    <rect x="200" y="160" width="25" height="25"/>
    <rect x="175" y="185" width="25" height="25"/>
  </g>
  <!-- Blade Steel Blue Core -->
  <g fill="%2338bdf8">
    <rect x="275" y="60" width="25" height="25"/>
    <rect x="250" y="85" width="25" height="25"/>
    <rect x="225" y="110" width="25" height="25"/>
    <rect x="200" y="135" width="25" height="25"/>
    <rect x="175" y="160" width="25" height="25"/>
    <rect x="150" y="185" width="25" height="25"/>
  </g>
  <!-- Blade Dark Edge -->
  <g fill="%230284c7">
    <rect x="250" y="60" width="25" height="25"/>
    <rect x="225" y="85" width="25" height="25"/>
    <rect x="200" y="110" width="25" height="25"/>
    <rect x="175" y="135" width="25" height="25"/>
    <rect x="150" y="160" width="25" height="25"/>
  </g>
  <!-- Golden Crossguard -->
  <g fill="%23eab308">
    <rect x="125" y="210" width="25" height="25"/>
    <rect x="100" y="210" width="25" height="25"/>
    <rect x="75" y="185" width="25" height="25"/>
    <rect x="150" y="210" width="25" height="25"/>
    <rect x="175" y="235" width="25" height="25"/>
  </g>
  <!-- Brown Grip -->
  <g fill="%2378350f">
    <rect x="100" y="235" width="25" height="25"/>
    <rect x="75" y="260" width="25" height="25"/>
  </g>
  <!-- Pommel Ruby Gem -->
  <g fill="%23ef4444">
    <rect x="50" y="285" width="25" height="25"/>
  </g>
  <!-- Black Outlines -->
  <g fill="%23000000" opacity="0.6">
    <rect x="325" y="60" width="10" height="25"/>
    <rect x="300" y="35" width="25" height="10"/>
  </g>
</svg>`;

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'starter-pokeball',
    name: 'Pokéball (Heat Beads)',
    category: 'Pixel Gaming',
    url: '/starter_crafts/pokeball_beads.png',
    description: '16x16 pixel-calibrated sprite ready for Perler & heat beads'
  },
  {
    id: 'starter-checkerboard',
    name: 'Checkerboard Coaster',
    category: 'Pop & Cozy',
    url: '/starter_crafts/checkerboard_crochet.png',
    description: '20x20 4-stitch checks coaster for Tapestry Crochet'
  },
  {
    id: 'starter-flower',
    name: 'Poppy Bloom (Cross-Stitch)',
    category: 'Nature & Botanical',
    url: '/starter_crafts/flower_crossstitch.png',
    description: '20x20 botanical blossom with DMC embroidery floss matching'
  },
  {
    id: 'starter-strawberry',
    name: 'Kawaii Strawberry',
    category: 'Pop & Cozy',
    url: '/starter_crafts/cute_strawberry.png',
    description: '16x16 sweet strawberry with blush cheeks and DMC floss matching'
  },
  {
    id: 'starter-duckling',
    name: 'Chubby Duckling',
    category: 'Animals & Pets',
    url: '/starter_crafts/cute_duckling.png',
    description: '16x16 bright yellow baby chick with orange beak'
  },
  {
    id: 'starter-mushroom',
    name: 'Retro 8-bit Mushroom',
    category: 'Pixel Gaming',
    url: '/starter_crafts/cute_mushroom.png',
    description: '16x16 arcade red mushroom cap with cartoon eyes'
  },
  {
    id: 'starter-kitty',
    name: 'Ginger Kitty',
    category: 'Animals & Pets',
    url: '/starter_crafts/cute_kitty.png',
    description: '16x16 cute peach cat with pink nose and inner ears'
  },
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
    id: 'pokeball',
    name: 'Classic Pokéball',
    category: 'Pixel Gaming',
    url: pokeballSvg,
    description: 'Iconic red and white sphere with center release button'
  },
  {
    id: 'heart',
    name: '8-Bit Zelda Heart',
    category: 'Pixel Gaming',
    url: heartSvg,
    description: 'Retro arcade life container with ruby shine and pixel border'
  },
  {
    id: 'fox',
    name: 'Autumn Forest Fox',
    category: 'Animals & Pets',
    url: foxSvg,
    description: 'Charming geometric orange fox with cream cheeks and ears'
  },
  {
    id: 'mushroom',
    name: 'Retro 8-bit Shroom',
    category: 'Pixel Gaming',
    url: mushroomSvg,
    description: 'Iconic red cap, white dots, and sky blue backdrop'
  },
  {
    id: 'sword',
    name: 'Hero Pixel Sword',
    category: 'Pixel Gaming',
    url: swordSvg,
    description: 'Master 8-bit steel blade with golden guard and ruby pommel'
  },
  {
    id: 'sunflower',
    name: 'Golden Sunflower',
    category: 'Nature & Botanical',
    url: sunflowerSvg,
    description: 'Radiant yellow petals with textured chocolate seed center'
  },
  {
    id: 'rainbow',
    name: 'Retro Sky Rainbow',
    category: 'Vibrant Gradients',
    url: rainbowSvg,
    description: 'Cheerful 6-color rainbow arch anchored by fluffy white clouds'
  },
  {
    id: 'coffee',
    name: 'Cozy Morning Coffee',
    category: 'Pop & Cozy',
    url: coffeeSvg,
    description: 'Steaming latte art cup with warm espresso tones and saucer'
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
  }
];
