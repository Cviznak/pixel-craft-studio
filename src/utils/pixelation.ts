import type { GridConfig, PaletteColor } from '../types/craft';
import { adjustPixel, rgbToLab, deltaE, type LAB } from './colorUtils';

export interface PixelationResult {
  gridData: number[][]; // [y][x] = paletteIndex
  paletteWithCounts: PaletteColor[];
}

// 4x4 Bayer matrix for ordered dithering
const BAYER_4X4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5],
];

// Find closest color index in palette using CIELAB distance
function getClosestPaletteIndex(r: number, g: number, b: number, paletteLabs: LAB[]): number {
  const pixelLab = rgbToLab(r, g, b);
  let bestIdx = 0;
  let minDist = Infinity;

  for (let i = 0; i < paletteLabs.length; i++) {
    const d = deltaE(pixelLab, paletteLabs[i]);
    if (d < minDist) {
      minDist = d;
      bestIdx = i;
    }
  }

  return bestIdx;
}

export function processImageToGrid(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  gridWidth: number,
  gridHeight: number,
  palette: PaletteColor[],
  config: Pick<GridConfig, 'brightness' | 'contrast' | 'saturation' | 'dither'>
): PixelationResult {
  if (palette.length === 0 || gridWidth <= 0 || gridHeight <= 0) {
    return {
      gridData: [],
      paletteWithCounts: palette,
    };
  }

  // 1. Render scaled down image onto an offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = gridWidth;
  canvas.height = gridHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not create offscreen canvas context');
  }

  // Use crisp image smoothing settings for nice downsample
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceImage, 0, 0, gridWidth, gridHeight);

  const imgData = ctx.getImageData(0, 0, gridWidth, gridHeight);
  const data = imgData.data;

  // Pre-calculate CIELAB for all palette colors
  const paletteLabs = palette.map(p => rgbToLab(p.r, p.g, p.b));

  // Initialize 2D grid
  const grid: number[][] = Array.from({ length: gridHeight }, () => new Array(gridWidth).fill(0));
  const counts = new Array(palette.length).fill(0);

  // 2. Pre-filter and store float RGB buffer for dithering error diffusion
  const bufferR = new Float32Array(gridWidth * gridHeight);
  const bufferG = new Float32Array(gridWidth * gridHeight);
  const bufferB = new Float32Array(gridWidth * gridHeight);

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const idx = (y * gridWidth + x) * 4;
      const rawR = data[idx];
      const rawG = data[idx + 1];
      const rawB = data[idx + 2];

      const adj = adjustPixel(rawR, rawG, rawB, config.brightness, config.contrast, config.saturation);
      const bIdx = y * gridWidth + x;
      bufferR[bIdx] = adj.r;
      bufferG[bIdx] = adj.g;
      bufferB[bIdx] = adj.b;
    }
  }

  // 3. Pixel quantization & optional dithering
  const dither = config.dither;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const bIdx = y * gridWidth + x;
      let r = bufferR[bIdx];
      let g = bufferG[bIdx];
      let b = bufferB[bIdx];

      // Ordered Bayer dithering threshold adjustment
      if (dither === 'bayer') {
        const threshold = (BAYER_4X4[y % 4][x % 4] / 16 - 0.5) * 32;
        r = Math.max(0, Math.min(255, r + threshold));
        g = Math.max(0, Math.min(255, g + threshold));
        b = Math.max(0, Math.min(255, b + threshold));
      }

      // Clamp
      const cr = Math.max(0, Math.min(255, Math.round(r)));
      const cg = Math.max(0, Math.min(255, Math.round(g)));
      const cb = Math.max(0, Math.min(255, Math.round(b)));

      // Find best match in palette
      const chosenIdx = getClosestPaletteIndex(cr, cg, cb, paletteLabs);
      grid[y][x] = chosenIdx;
      counts[chosenIdx]++;

      const matchedColor = palette[chosenIdx];
      const errR = cr - matchedColor.r;
      const errG = cg - matchedColor.g;
      const errB = cb - matchedColor.b;

      // Distribute error if error-diffusion dither is selected
      if (dither === 'floyd-steinberg') {
        // [   *   7/16 ]
        // [ 3/16 5/16 1/16 ]
        distributeError(bufferR, bufferG, bufferB, gridWidth, gridHeight, x + 1, y, errR, errG, errB, 7 / 16);
        distributeError(bufferR, bufferG, bufferB, gridWidth, gridHeight, x - 1, y + 1, errR, errG, errB, 3 / 16);
        distributeError(bufferR, bufferG, bufferB, gridWidth, gridHeight, x, y + 1, errR, errG, errB, 5 / 16);
        distributeError(bufferR, bufferG, bufferB, gridWidth, gridHeight, x + 1, y + 1, errR, errG, errB, 1 / 16);
      } else if (dither === 'atkinson') {
        // Atkinson dithering gives crisp retro pixel texture (1/8 each)
        // [   *   1/8  1/8 ]
        // [ 1/8 1/8  1/8 ]
        // [     1/8      ]
        const frac = 1 / 8;
        distributeError(bufferR, bufferG, bufferB, gridWidth, gridHeight, x + 1, y, errR, errG, errB, frac);
        distributeError(bufferR, bufferG, bufferB, gridWidth, gridHeight, x + 2, y, errR, errG, errB, frac);
        distributeError(bufferR, bufferG, bufferB, gridWidth, gridHeight, x - 1, y + 1, errR, errG, errB, frac);
        distributeError(bufferR, bufferG, bufferB, gridWidth, gridHeight, x, y + 1, errR, errG, errB, frac);
        distributeError(bufferR, bufferG, bufferB, gridWidth, gridHeight, x + 1, y + 1, errR, errG, errB, frac);
        distributeError(bufferR, bufferG, bufferB, gridWidth, gridHeight, x, y + 2, errR, errG, errB, frac);
      }
    }
  }

  // 4. Update counts and percentages
  const totalCells = gridWidth * gridHeight;
  const paletteWithCounts = palette.map((color, idx) => {
    const count = counts[idx] || 0;
    const percentage = totalCells > 0 ? parseFloat(((count / totalCells) * 100).toFixed(1)) : 0;
    return {
      ...color,
      count,
      percentage,
    };
  });

  return {
    gridData: grid,
    paletteWithCounts,
  };
}

function distributeError(
  bufR: Float32Array,
  bufG: Float32Array,
  bufB: Float32Array,
  w: number,
  h: number,
  x: number,
  y: number,
  errR: number,
  errG: number,
  errB: number,
  weight: number
) {
  if (x < 0 || x >= w || y < 0 || y >= h) return;
  const idx = y * w + x;
  bufR[idx] += errR * weight;
  bufG[idx] += errG * weight;
  bufB[idx] += errB * weight;
}
