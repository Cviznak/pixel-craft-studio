import type { PaletteColor } from '../types/craft';
import { rgbToLab, deltaE } from './colorUtils';

export interface ConfettiCleanResult {
  newGrid: number[][];
  newPalette: PaletteColor[];
  removedCount: number;
  mergedColorsCount: number;
}

/**
 * Removes "confetti" colors (colors with very few stitches/pixels, < thresholdPercent)
 * by merging each into its nearest CIELAB neighbor in the palette.
 */
export function cleanConfettiColors(
  gridData: number[][],
  palette: PaletteColor[],
  thresholdPercent = 1.0 // 1% threshold
): ConfettiCleanResult {
  const height = gridData.length;
  if (height === 0) {
    return { newGrid: gridData, newPalette: palette, removedCount: 0, mergedColorsCount: 0 };
  }
  const width = gridData[0].length;
  const totalPixels = width * height;

  // 1. Calculate counts for each color index
  const counts: number[] = new Array(palette.length).fill(0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = gridData[y][x];
      if (idx >= 0 && idx < palette.length) {
        counts[idx]++;
      }
    }
  }

  // 2. Identify rare / confetti colors vs keeper colors
  // Never remove locked colors or colors with count >= threshold
  const minCount = Math.max(3, Math.round((totalPixels * thresholdPercent) / 100));
  const isRare: boolean[] = palette.map((color, idx) => {
    if (color.isLocked) return false;
    return counts[idx] < minCount;
  });

  const keeperIndices = palette
    .map((_, idx) => idx)
    .filter((idx) => !isRare[idx]);

  // If all or none are rare, don't remove anything
  if (keeperIndices.length === 0 || keeperIndices.length === palette.length) {
    return { newGrid: gridData, newPalette: palette, removedCount: 0, mergedColorsCount: 0 };
  }

  // 3. Precompute LAB for all palette colors
  const labs = palette.map((c) => rgbToLab(c.r, c.g, c.b));

  // 4. For each rare color, find closest keeper by CIELAB Delta E
  const targetIndexMap: number[] = new Array(palette.length).fill(0);
  let totalMergedPixels = 0;
  let removedCount = 0;

  for (let i = 0; i < palette.length; i++) {
    if (!isRare[i]) {
      targetIndexMap[i] = i;
    } else {
      removedCount++;
      totalMergedPixels += counts[i];
      let bestKeeper = keeperIndices[0];
      let bestDist = Infinity;

      for (const keeperIdx of keeperIndices) {
        const dist = deltaE(labs[i], labs[keeperIdx]);
        if (dist < bestDist) {
          bestDist = dist;
          bestKeeper = keeperIdx;
        }
      }
      targetIndexMap[i] = bestKeeper;
    }
  }

  // 4. Build mapping from old keeper indices to new contiguous 0..N-1 indices
  const newPalette: PaletteColor[] = [];
  const oldToNewIndexMap: { [oldIdx: number]: number } = {};

  keeperIndices.forEach((oldIdx, newIdx) => {
    oldToNewIndexMap[oldIdx] = newIdx;
    newPalette.push({ ...palette[oldIdx] });
  });

  // 5. Remap gridData
  const newGrid: number[][] = new Array(height);
  const newCounts: number[] = new Array(newPalette.length).fill(0);

  for (let y = 0; y < height; y++) {
    newGrid[y] = new Array(width);
    for (let x = 0; x < width; x++) {
      const oldIdx = gridData[y][x];
      if (oldIdx < 0) {
        newGrid[y][x] = -1;
        continue;
      }
      const targetKeeper = targetIndexMap[oldIdx] ?? 0;
      const finalNewIdx = oldToNewIndexMap[targetKeeper] ?? 0;
      newGrid[y][x] = finalNewIdx;
      newCounts[finalNewIdx]++;
    }
  }

  // 6. Update counts and percentages
  newPalette.forEach((c, idx) => {
    c.count = newCounts[idx];
    c.percentage = totalPixels > 0 ? Math.round((newCounts[idx] / totalPixels) * 1000) / 10 : 0;
  });

  return {
    newGrid,
    newPalette,
    removedCount,
    mergedColorsCount: totalMergedPixels,
  };
}

/**
 * Manually merges a source color into a target color
 */
export function mergeColors(
  gridData: number[][],
  palette: PaletteColor[],
  sourceIndex: number,
  targetIndex: number
): { newGrid: number[][]; newPalette: PaletteColor[] } {
  if (sourceIndex === targetIndex || sourceIndex < 0 || sourceIndex >= palette.length || targetIndex < 0 || targetIndex >= palette.length) {
    return { newGrid: gridData, newPalette: palette };
  }

  const height = gridData.length;
  const width = gridData[0].length;
  const totalPixels = width * height;

  // Build mapping from old indices to new contiguous indices
  const newPalette: PaletteColor[] = [];
  const oldToNewMap: number[] = [];

  for (let i = 0; i < palette.length; i++) {
    if (i === sourceIndex) {
      // Points to target (will be remapped next)
      oldToNewMap[i] = -1; // Temp placeholder
    } else {
      oldToNewMap[i] = newPalette.length;
      newPalette.push({ ...palette[i] });
    }
  }
  // Source points to the new index of target
  oldToNewMap[sourceIndex] = oldToNewMap[targetIndex];

  // Remap grid
  const newGrid: number[][] = new Array(height);
  const newCounts: number[] = new Array(newPalette.length).fill(0);

  for (let y = 0; y < height; y++) {
    newGrid[y] = new Array(width);
    for (let x = 0; x < width; x++) {
      const oldIdx = gridData[y][x];
      if (oldIdx < 0) {
        newGrid[y][x] = -1;
        continue;
      }
      const newIdx = oldToNewMap[oldIdx] ?? 0;
      newGrid[y][x] = newIdx;
      newCounts[newIdx]++;
    }
  }

  // Update counts
  newPalette.forEach((c, idx) => {
    c.count = newCounts[idx];
    c.percentage = totalPixels > 0 ? Math.round((newCounts[idx] / totalPixels) * 1000) / 10 : 0;
  });

  return { newGrid, newPalette };
}
