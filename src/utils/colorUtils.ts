// Color utility functions: RGB, Hex, LAB, Vibrance, Delta E

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface LAB {
  l: number;
  a: number;
  b: number;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgb(hex: string): RGB {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert sRGB to CIELAB
export function rgbToLab(r: number, g: number, b: number): LAB {
  // 1. Normalize sRGB to [0, 1] and apply inverse companding
  let R = r / 255;
  let G = g / 255;
  let B = b / 255;

  R = R > 0.04045 ? Math.pow((R + 0.055) / 1.055, 2.4) : R / 12.92;
  G = G > 0.04045 ? Math.pow((G + 0.055) / 1.055, 2.4) : G / 12.92;
  B = B > 0.04045 ? Math.pow((B + 0.055) / 1.055, 2.4) : B / 12.92;

  // 2. Linear sRGB to XYZ (D65 illuminant)
  let X = (R * 0.4124 + G * 0.3576 + B * 0.1805) * 100;
  let Y = (R * 0.2126 + G * 0.7152 + B * 0.0722) * 100;
  let Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) * 100;

  // 3. XYZ to LAB (Reference white D65)
  const Xn = 95.047;
  const Yn = 100.000;
  const Zn = 108.883;

  let x = X / Xn;
  let y = Y / Yn;
  let z = Z / Zn;

  const eps = 0.008856;
  const kappa = 903.3;

  const fx = x > eps ? Math.cbrt(x) : (kappa * x + 16) / 116;
  const fy = y > eps ? Math.cbrt(y) : (kappa * y + 16) / 116;
  const fz = z > eps ? Math.cbrt(z) : (kappa * z + 16) / 116;

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const labB = 200 * (fy - fz);

  return { l, a, b: labB };
}

// Perceptual distance (Delta E CIE76 or weighted)
export function deltaE(lab1: LAB, lab2: LAB): number {
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

// Calculate saturation/vibrance of an RGB color (0 to 1)
export function getVibrance(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  const delta = max - min;
  const sat = delta / max; // HSV saturation
  // Penalize pure black or pure white
  const lum = (max + min) / (2 * 255);
  const lumWeight = 1 - Math.abs(lum - 0.5) * 1.5;
  return sat * Math.max(0.1, lumWeight);
}

// Get contrasting text color (black or white) for symbols overlay
export function getContrastingTextColor(r: number, g: number, b: number): string {
  // Relative luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#1a1a1a' : '#ffffff';
}

// Apply pre-filters: Brightness, Contrast, Saturation
export function adjustPixel(
  r: number,
  g: number,
  b: number,
  brightness: number, // -100 to 100
  contrast: number,   // -100 to 100
  saturation: number  // -100 to 100
): RGB {
  // 1. Brightness (-100 to 100 -> -255 to 255)
  let nr = r + (brightness * 255) / 100;
  let ng = g + (brightness * 255) / 100;
  let nb = b + (brightness * 255) / 100;

  // 2. Contrast
  if (contrast !== 0) {
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    nr = factor * (nr - 128) + 128;
    ng = factor * (ng - 128) + 128;
    nb = factor * (nb - 128) + 128;
  }

  // 3. Saturation
  if (saturation !== 0) {
    const gray = 0.2989 * nr + 0.587 * ng + 0.114 * nb;
    const satMult = 1 + saturation / 100;
    nr = gray + (nr - gray) * satMult;
    ng = gray + (ng - gray) * satMult;
    nb = gray + (nb - gray) * satMult;
  }

  return {
    r: Math.max(0, Math.min(255, Math.round(nr))),
    g: Math.max(0, Math.min(255, Math.round(ng))),
    b: Math.max(0, Math.min(255, Math.round(nb))),
  };
}
