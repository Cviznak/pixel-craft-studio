import type { PaletteColor } from '../types/craft';

export type BorderStyleId =
  | 'classic-double'
  | 'floral-vine'
  | 'cottage-leaves'
  | 'vintage-sampler'
  | 'pixel-hearts'
  | 'geometric-diamond'
  | 'scalloped-lace'
  | 'greek-key';

export interface BorderPreset {
  id: BorderStyleId;
  name: string;
  description: string;
  thickness: number;
  bestFor: string;
}

export interface BorderConfig {
  style: BorderStyleId;
  placement: 'expand' | 'overlay';
  padding: number;
  primaryColorIndex: number;
  accentColorIndex: number;
  bgColorIndex: number;
}

export const BORDER_PRESETS: BorderPreset[] = [
  {
    id: 'classic-double',
    name: 'Classic Double Rule',
    description: 'Clean heritage heirloom frame with twin ruled lines & crisp corner squares',
    thickness: 5,
    bestFor: 'Monograms & Gifts',
  },
  {
    id: 'floral-vine',
    name: 'Floral Vine',
    description: 'Climbing botanical vine with repeating petals & blossom corner medallions',
    thickness: 6,
    bestFor: 'Cottagecore & Hoops',
  },
  {
    id: 'cottage-leaves',
    name: 'Cottage Leaves',
    description: 'Organic alternating leaf sprigs with berry accent buds',
    thickness: 5,
    bestFor: 'Botanicals & Animals',
  },
  {
    id: 'vintage-sampler',
    name: 'Vintage Sampler',
    description: 'Traditional cross-stitch sampler sawtooth edge & quatrefoil corners',
    thickness: 6,
    bestFor: 'Cross-Stitch & Etsy',
  },
  {
    id: 'pixel-hearts',
    name: 'Pixel Hearts',
    description: 'Charming mini pixel hearts framed around a delicate dotted border',
    thickness: 6,
    bestFor: 'Kawaii & Sprites',
  },
  {
    id: 'geometric-diamond',
    name: 'Geometric Diamond',
    description: 'Crisp Navajo & Southwest repeating diamond tessellation',
    thickness: 5,
    bestFor: 'Bead Loom & Crochet',
  },
  {
    id: 'scalloped-lace',
    name: 'Scalloped Lace',
    description: 'Delicate arched doily scallop motif with eyelet cutout dots',
    thickness: 5,
    bestFor: 'Nursery & Pastels',
  },
  {
    id: 'greek-key',
    name: 'Greek Key Meander',
    description: 'Classical architectural meander fretwork with bold interlocking corners',
    thickness: 6,
    bestFor: 'Blankets & Knitting',
  },
];

function paintCornerCell(
  grid: number[][],
  w: number,
  h: number,
  r: number,
  c: number,
  val: number
) {
  const coords: [number, number][] = [
    [r, c],
    [r, w - 1 - c],
    [h - 1 - r, c],
    [h - 1 - r, w - 1 - c],
  ];
  for (const [yy, xx] of coords) {
    if (yy >= 0 && yy < h && xx >= 0 && xx < w) {
      grid[yy][xx] = val;
    }
  }
}

function paintEdgeSymmetric(
  grid: number[][],
  w: number,
  h: number,
  depth: number,
  pos: number,
  val: number,
  band: number
) {
  if (pos >= band && pos < w - band && depth < band) {
    grid[depth][pos] = val;
    grid[h - 1 - depth][pos] = val;
  }
  if (pos >= band && pos < h - band && depth < band) {
    grid[pos][depth] = val;
    grid[pos][w - 1 - depth] = val;
  }
}

/**
 * Wraps or frames a pattern grid with one of 8 symmetrical procedural pixel borders
 * including matching 4-corner medallions.
 */
export function generateFramedGrid(
  gridData: number[][],
  borderConfig: BorderConfig
): {
  newGrid: number[][];
  newWidth: number;
  newHeight: number;
  borderCellsCount: number;
  clampedToOverlay: boolean;
} {
  const origH = gridData.length;
  const origW = origH > 0 ? gridData[0].length : 0;
  if (origW === 0 || origH === 0) {
    return { newGrid: [], newWidth: 0, newHeight: 0, borderCellsCount: 0, clampedToOverlay: false };
  }

  const preset = BORDER_PRESETS.find((p) => p.id === borderConfig.style) || BORDER_PRESETS[0];
  const band = preset.thickness;
  const pad = Math.max(0, borderConfig.padding);
  const totalMargin = band + pad;

  const canExpand = origW + totalMargin * 2 <= 160 && origH + totalMargin * 2 <= 160;
  const effectivePlacement = borderConfig.placement === 'expand' && canExpand ? 'expand' : 'overlay';
  const clampedToOverlay = borderConfig.placement === 'expand' && !canExpand;

  let newW = origW;
  let newH = origH;
  let newGrid: number[][];

  if (effectivePlacement === 'expand') {
    newW = origW + totalMargin * 2;
    newH = origH + totalMargin * 2;
    newGrid = Array.from({ length: newH }, () => new Array(newW).fill(borderConfig.bgColorIndex));
    for (let y = 0; y < origH; y++) {
      for (let x = 0; x < origW; x++) {
        newGrid[y + totalMargin][x + totalMargin] = gridData[y][x];
      }
    }
  } else {
    newGrid = gridData.map((row) => [...row]);
    // Clear only the outer band to bg before stamping overlay pattern
    for (let y = 0; y < newH; y++) {
      for (let x = 0; x < newW; x++) {
        if (x < band || x >= newW - band || y < band || y >= newH - band) {
          newGrid[y][x] = borderConfig.bgColorIndex;
        }
      }
    }
  }

  const P = borderConfig.primaryColorIndex;
  const A = borderConfig.accentColorIndex;
  const BG = borderConfig.bgColorIndex;
  let borderCellsCount = 0;

  // Stamp all 4 edges cleanly with periodic tiling between corners
  const maxSpan = Math.max(newW, newH);

  for (let i = band; i < maxSpan - band; i++) {
    const k = i - band;
    switch (borderConfig.style) {
      case 'classic-double': {
        paintEdgeSymmetric(newGrid, newW, newH, 0, i, P, band);
        paintEdgeSymmetric(newGrid, newW, newH, 2, i, A, band);
        paintEdgeSymmetric(newGrid, newW, newH, 3, i, k % 2 === 0 ? P : BG, band);
        break;
      }
      case 'floral-vine': {
        paintEdgeSymmetric(newGrid, newW, newH, 0, i, P, band);
        paintEdgeSymmetric(newGrid, newW, newH, 5, i, P, band);
        const mod = k % 6;
        if (mod === 0 || mod === 1 || mod === 2) {
          paintEdgeSymmetric(newGrid, newW, newH, 2, i, P, band);
          if (mod === 1) paintEdgeSymmetric(newGrid, newW, newH, 1, i, A, band);
        } else {
          paintEdgeSymmetric(newGrid, newW, newH, 3, i, P, band);
          if (mod === 4) {
            paintEdgeSymmetric(newGrid, newW, newH, 2, i, A, band);
            paintEdgeSymmetric(newGrid, newW, newH, 4, i, A, band);
          }
        }
        break;
      }
      case 'cottage-leaves': {
        paintEdgeSymmetric(newGrid, newW, newH, 2, i, P, band);
        const mod = k % 4;
        if (mod === 1) {
          paintEdgeSymmetric(newGrid, newW, newH, 1, i, P, band);
          paintEdgeSymmetric(newGrid, newW, newH, 0, i, A, band);
        } else if (mod === 3) {
          paintEdgeSymmetric(newGrid, newW, newH, 3, i, P, band);
          paintEdgeSymmetric(newGrid, newW, newH, 4, i, A, band);
        }
        break;
      }
      case 'vintage-sampler': {
        paintEdgeSymmetric(newGrid, newW, newH, 0, i, P, band);
        paintEdgeSymmetric(newGrid, newW, newH, 5, i, P, band);
        const mod = k % 4;
        if (mod === 0) paintEdgeSymmetric(newGrid, newW, newH, 3, i, A, band);
        else if (mod === 2) paintEdgeSymmetric(newGrid, newW, newH, 2, i, P, band);
        else {
          paintEdgeSymmetric(newGrid, newW, newH, 2, i, A, band);
          paintEdgeSymmetric(newGrid, newW, newH, 3, i, P, band);
        }
        break;
      }
      case 'pixel-hearts': {
        paintEdgeSymmetric(newGrid, newW, newH, 0, i, k % 2 === 0 ? P : BG, band);
        const mod = k % 6;
        // 5x4 micro pixel heart centered inside 6-cell band
        if (mod === 1 || mod === 3) paintEdgeSymmetric(newGrid, newW, newH, 2, i, A, band);
        if (mod >= 1 && mod <= 3) paintEdgeSymmetric(newGrid, newW, newH, 3, i, A, band);
        if (mod === 2) paintEdgeSymmetric(newGrid, newW, newH, 4, i, A, band);
        if (mod === 5) paintEdgeSymmetric(newGrid, newW, newH, 3, i, P, band);
        break;
      }
      case 'geometric-diamond': {
        paintEdgeSymmetric(newGrid, newW, newH, 0, i, P, band);
        paintEdgeSymmetric(newGrid, newW, newH, 4, i, P, band);
        const mod = k % 4;
        if (mod === 0 || mod === 2) paintEdgeSymmetric(newGrid, newW, newH, 2, i, A, band);
        if (mod === 1) {
          paintEdgeSymmetric(newGrid, newW, newH, 1, i, A, band);
          paintEdgeSymmetric(newGrid, newW, newH, 3, i, A, band);
          paintEdgeSymmetric(newGrid, newW, newH, 2, i, P, band);
        }
        break;
      }
      case 'scalloped-lace': {
        paintEdgeSymmetric(newGrid, newW, newH, 0, i, P, band);
        const mod = k % 4;
        if (mod === 0) {
          paintEdgeSymmetric(newGrid, newW, newH, 1, i, P, band);
          paintEdgeSymmetric(newGrid, newW, newH, 2, i, P, band);
        } else if (mod === 1 || mod === 3) {
          paintEdgeSymmetric(newGrid, newW, newH, 3, i, P, band);
          paintEdgeSymmetric(newGrid, newW, newH, 2, i, A, band);
        } else {
          paintEdgeSymmetric(newGrid, newW, newH, 4, i, P, band);
          paintEdgeSymmetric(newGrid, newW, newH, 2, i, A, band);
        }
        break;
      }
      case 'greek-key': {
        paintEdgeSymmetric(newGrid, newW, newH, 0, i, P, band);
        paintEdgeSymmetric(newGrid, newW, newH, 5, i, P, band);
        const mod = k % 6;
        if (mod >= 1 && mod <= 4) paintEdgeSymmetric(newGrid, newW, newH, 2, i, A, band);
        if (mod === 1 || mod === 4) paintEdgeSymmetric(newGrid, newW, newH, 3, i, A, band);
        if (mod === 3 || mod === 4 || mod === 5) paintEdgeSymmetric(newGrid, newW, newH, 4, i, A, band);
        break;
      }
    }
  }

  // Stamp crisp 4-corner medallions (0..band-1 x 0..band-1 mirrored symmetrically)
  for (let r = 0; r < band; r++) {
    for (let c = 0; c < band; c++) {
      let val = BG;
      if (borderConfig.style === 'classic-double') {
        if (r === 0 || c === 0) val = P;
        else if (r === 2 || c === 2) val = A;
        else if (r === band - 1 && c === band - 1) val = P;
      } else if (borderConfig.style === 'pixel-hearts') {
        if (r === 0 || c === 0) val = P;
        else if ((r === 2 || r === 3) && (c === 2 || c === 3)) val = A;
        else if (r === 4 && c === 3) val = P;
      } else if (borderConfig.style === 'floral-vine' || borderConfig.style === 'vintage-sampler') {
        if (r === 0 || c === 0) val = P;
        else if (r === 2 && (c === 1 || c === 3)) val = A;
        else if (c === 2 && (r === 1 || r === 3)) val = A;
        else if (r === 2 && c === 2) val = P;
        else if (r === band - 1 || c === band - 1) val = P;
      } else {
        if (r === 0 || c === 0) val = P;
        else if (r === 1 || c === 1) val = BG;
        else if (r === 2 && c === 2) val = A;
        else if ((r === 2 || c === 2) && r < band - 1 && c < band - 1) val = P;
        else if (r === band - 1 || c === band - 1) val = A;
      }
      paintCornerCell(newGrid, newW, newH, r, c, val);
    }
  }

  // Count non-empty cells added in the border frame region
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      if (x < band || x >= newW - band || y < band || y >= newH - band) {
        if (newGrid[y][x] >= 0) borderCellsCount++;
      }
    }
  }

  return {
    newGrid,
    newWidth: newW,
    newHeight: newH,
    borderCellsCount,
    clampedToOverlay,
  };
}

/**
 * Recomputes stitch/bead counts and percentages for each palette entry from the grid.
 */
export function recalculatePaletteCounts(
  gridData: number[][],
  palette: PaletteColor[]
): PaletteColor[] {
  const counts = new Array(palette.length).fill(0);
  let totalValid = 0;

  for (let y = 0; y < gridData.length; y++) {
    const row = gridData[y];
    for (let x = 0; x < row.length; x++) {
      const idx = row[x];
      if (idx >= 0 && idx < counts.length) {
        counts[idx]++;
        totalValid++;
      }
    }
  }

  return palette.map((c, idx) => ({
    ...c,
    count: counts[idx],
    percentage: totalValid > 0 ? Math.round((counts[idx] / totalValid) * 1000) / 10 : 0,
  }));
}
