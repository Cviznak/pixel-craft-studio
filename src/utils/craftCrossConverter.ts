import type { CraftType, PaletteColor, PaletteMoodId } from '../types/craft';
import { findClosestCraftColor } from './craftData';
import { getCraftSymbol } from './symbols';
import { rgbToHex } from './colorUtils';

export interface PaletteMoodOption {
  id: PaletteMoodId;
  label: string;
  emoji: string;
  description: string;
}

export const PALETTE_MOOD_OPTIONS: PaletteMoodOption[] = [
  { id: 'pastel', label: 'Pastel Dream', emoji: '🌸', description: 'Soft airy tones & gentle contrast' },
  { id: 'autumn', label: 'Autumn Forest', emoji: '🍂', description: 'Warm amber, rust & olive foliage' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', emoji: '⚡', description: 'Electric cyan, magenta & violet' },
  { id: 'cottagecore', label: 'Cottagecore', emoji: '🍄', description: 'Dusty rose, sage green & warm cream' },
  { id: 'sunset', label: 'Sunset Warmth', emoji: '🌅', description: 'Plum shadows to golden hour highlights' },
  { id: 'monochrome', label: 'Sepia Monochrome', emoji: '🕰️', description: 'Vintage warm grayscale heirloom look' },
];

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rN:
        h = (gN - bN) / d + (gN < bN ? 6 : 0);
        break;
      case gN:
        h = (bN - rN) / d + 2;
        break;
      case bN:
        h = (rN - gN) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hNorm = (((h % 360) + 360) % 360) / 360;
  const sClamped = Math.max(0, Math.min(1, s));
  const lClamped = Math.max(0, Math.min(1, l));

  if (sClamped === 0) {
    const val = Math.round(lClamped * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = lClamped < 0.5 ? lClamped * (1 + sClamped) : lClamped + sClamped - lClamped * sClamped;
  const p = 2 * lClamped - q;

  return {
    r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNorm) * 255),
    b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
  };
}

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function sampleSunsetRamp(lumNorm: number): { r: number; g: number; b: number } {
  const stops = [
    { pos: 0.0, r: 59, g: 29, b: 84 },    // #3b1d54 deep plum
    { pos: 0.35, r: 232, g: 93, b: 86 },  // #e85d56 crimson/coral
    { pos: 0.7, r: 249, g: 178, b: 72 },  // #f9b248 golden amber
    { pos: 1.0, r: 255, g: 243, b: 196 }, // #fff3c4 pale cream
  ];

  const t = Math.max(0, Math.min(1, lumNorm));
  for (let i = 0; i < stops.length - 1; i++) {
    const start = stops[i];
    const end = stops[i + 1];
    if (t >= start.pos && t <= end.pos) {
      const localT = (t - start.pos) / (end.pos - start.pos);
      return {
        r: lerpChannel(start.r, end.r, localT),
        g: lerpChannel(start.g, end.g, localT),
        b: lerpChannel(start.b, end.b, localT),
      };
    }
  }
  return { r: 255, g: 243, b: 196 };
}

function nearestAngleTarget(hue: number, targets: number[]): number {
  let best = targets[0];
  let bestDist = Infinity;
  for (const target of targets) {
    const diff = Math.abs(((hue - target + 540) % 360) - 180);
    if (diff < bestDist) {
      bestDist = diff;
      best = target;
    }
  }
  return best;
}

function transformRgbByMood(r: number, g: number, b: number, mood: PaletteMoodId): { r: number; g: number; b: number } {
  const lumNorm = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  if (mood === 'monochrome') {
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    return {
      r: Math.max(0, Math.min(255, Math.round(gray * 1.08))),
      g: Math.max(0, Math.min(255, Math.round(gray * 0.98))),
      b: Math.max(0, Math.min(255, Math.round(gray * 0.84))),
    };
  }

  if (mood === 'sunset') {
    const ramp = sampleSunsetRamp(lumNorm);
    return {
      r: lerpChannel(r, ramp.r, 0.65),
      g: lerpChannel(g, ramp.g, 0.65),
      b: lerpChannel(b, ramp.b, 0.65),
    };
  }

  const { h, s, l } = rgbToHsl(r, g, b);

  if (mood === 'pastel') {
    return hslToRgb(h, s * 0.55, l * 0.45 + 0.48);
  }

  if (mood === 'autumn') {
    if (s < 0.08) {
      return hslToRgb(35, 0.15, l * 0.85 + 0.08);
    }
    const warmTargets = [18, 35, 50, 95, 118];
    const targetHue = nearestAngleTarget(h, warmTargets);
    const shiftedHue = h + (((targetHue - h + 540) % 360) - 180) * 0.72;
    return hslToRgb(shiftedHue, Math.min(0.85, s * 0.9), l * 0.85 + 0.08);
  }

  if (mood === 'cyberpunk') {
    if (l < 0.12) {
      return hslToRgb(260, 0.45, Math.max(0.08, l));
    }
    if (l > 0.92 && s < 0.15) {
      return hslToRgb(185, 0.35, 0.9);
    }
    const neonTargets = [185, 320, 275, 55];
    const targetHue = nearestAngleTarget(h, neonTargets);
    return hslToRgb(targetHue, Math.min(1, s * 1.45 + 0.25), Math.max(0.28, Math.min(0.75, l)));
  }

  // 'cottagecore': soft sage (~115), dusty rose (~345), warm cream/terracotta (~28)
  if (s < 0.1) {
    return hslToRgb(36, 0.2, Math.min(0.94, l * 0.9 + 0.08));
  }
  const cottageTargets = [28, 42, 115, 345];
  const targetHue = nearestAngleTarget(h, cottageTargets);
  const shiftedHue = h + (((targetHue - h + 540) % 360) - 180) * 0.65;
  return hslToRgb(shiftedHue, s * 0.65, Math.min(0.86, l * 0.85 + 0.1));
}

function finalizePaletteAndGrid(
  rawMappedPalette: PaletteColor[],
  gridData: number[][]
): { newPalette: PaletteColor[]; newGrid: number[][]; mergedCount: number } {
  const height = gridData.length;
  const width = height > 0 ? gridData[0].length : 0;
  const totalPixels = width * height;

  const dedupPalette: PaletteColor[] = [];
  const keyToNewIdx = new Map<string, number>();
  const oldToNewIdx: number[] = new Array(rawMappedPalette.length).fill(0);

  rawMappedPalette.forEach((c, oldIdx) => {
    const key = c.brand && c.brand !== 'Custom' && c.code ? `${c.brand}:${c.code}` : `HEX:${c.hex.toUpperCase()}`;
    const existing = keyToNewIdx.get(key);
    if (existing !== undefined) {
      oldToNewIdx[oldIdx] = existing;
    } else {
      const newIdx = dedupPalette.length;
      keyToNewIdx.set(key, newIdx);
      oldToNewIdx[oldIdx] = newIdx;
      dedupPalette.push({
        ...c,
        symbol: getCraftSymbol(newIdx),
        count: 0,
        percentage: 0,
      });
    }
  });

  const newCounts = new Array(dedupPalette.length).fill(0);
  const newGrid = gridData.map((row) =>
    row.map((cellIdx) => {
      if (cellIdx < 0) return -1;
      const mapped = oldToNewIdx[cellIdx] ?? 0;
      newCounts[mapped]++;
      return mapped;
    })
  );

  dedupPalette.forEach((c, idx) => {
    c.count = newCounts[idx];
    c.percentage = totalPixels > 0 ? Math.round((newCounts[idx] / totalPixels) * 1000) / 10 : 0;
  });

  return {
    newPalette: dedupPalette,
    newGrid,
    mergedCount: Math.max(0, rawMappedPalette.length - dedupPalette.length),
  };
}

/**
 * Restyles an existing pattern palette into a curated harmonic mood preset
 * while preserving locked colors and snapping to DMC or Perler when applicable.
 */
export function applyPaletteMood(
  palette: PaletteColor[],
  gridData: number[][],
  mood: PaletteMoodId,
  craftType: CraftType
): { newPalette: PaletteColor[]; newGrid: number[][] } {
  const mapped: PaletteColor[] = palette.map((c) => {
    if (c.isLocked) {
      return { ...c };
    }

    const { r, g, b } = transformRgbByMood(c.r, c.g, c.b, mood);

    if (craftType === 'perler') {
      const match = findClosestCraftColor(r, g, b, 'Perler');
      return {
        ...c,
        hex: match.hex,
        r: match.r,
        g: match.g,
        b: match.b,
        code: match.code,
        name: match.name,
        brand: 'Perler',
      };
    }

    if (craftType !== 'pixel') {
      const match = findClosestCraftColor(r, g, b, 'DMC');
      return {
        ...c,
        hex: match.hex,
        r: match.r,
        g: match.g,
        b: match.b,
        code: match.code,
        name: match.name,
        brand: 'DMC',
      };
    }

    const hex = rgbToHex(r, g, b);
    return {
      ...c,
      hex,
      r,
      g,
      b,
      code: hex.toUpperCase(),
      brand: 'Custom',
    };
  });

  const { newPalette, newGrid } = finalizePaletteAndGrid(mapped, gridData);
  return { newPalette, newGrid };
}

/**
 * Converts a pattern from any craft discipline to another with 1 click,
 * remapping palette codes between Perler, DMC, and Custom Pixel formats
 * and deduplicating any duplicate targets.
 */
export function convertPatternToCraft(
  gridData: number[][],
  palette: PaletteColor[],
  targetCraft: CraftType
): { newGrid: number[][]; newPalette: PaletteColor[]; mergedCount: number } {
  const mapped: PaletteColor[] = palette.map((c) => {
    if (targetCraft === 'pixel') {
      return {
        ...c,
        code: c.hex.toUpperCase(),
        brand: 'Custom',
      };
    }

    const targetBrand = targetCraft === 'perler' ? 'Perler' : 'DMC';
    const match = findClosestCraftColor(c.r, c.g, c.b, targetBrand);
    return {
      ...c,
      hex: match.hex,
      r: match.r,
      g: match.g,
      b: match.b,
      code: match.code,
      name: match.name,
      brand: targetBrand,
    };
  });

  return finalizePaletteAndGrid(mapped, gridData);
}
