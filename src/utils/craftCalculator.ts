import type { CraftType } from '../types/craft';

export type CrossStitchClothCount = 11 | 14 | 16 | 18 | 22 | 28;
export type PerlerBeadType = 'midi-5mm' | 'mini-2.6mm';
export type DiamondDrillType = 'square-2.5mm' | 'round-2.8mm';

export interface PhysicalDimensions {
  widthInches: number;
  heightInches: number;
  widthCm: number;
  heightCm: number;
  summary: string;
}

export interface CrossStitchMaterials {
  clothCount: CrossStitchClothCount;
  dimensions: PhysicalDimensions;
  recommendedFabricSizeInches: { width: number; height: number };
  recommendedFabricSizeCm: { width: number; height: number };
}

export interface PerlerMaterials {
  beadType: PerlerBeadType;
  dimensions: PhysicalDimensions;
  pegboardCols: number;
  pegboardRows: number;
  totalPegboards: number; // based on standard 29x29 interlocking pegboard
}

export interface DiamondMaterials {
  drillType: DiamondDrillType;
  dimensions: PhysicalDimensions;
}

/**
 * Calculates physical dimensions for Cross-Stitch based on Aida cloth count
 */
export function calculateCrossStitchDimensions(
  gridWidth: number,
  gridHeight: number,
  clothCount: CrossStitchClothCount = 14
): CrossStitchMaterials {
  const widthInches = Math.round((gridWidth / clothCount) * 10) / 10;
  const heightInches = Math.round((gridHeight / clothCount) * 10) / 10;
  const widthCm = Math.round(widthInches * 2.54 * 10) / 10;
  const heightCm = Math.round(heightInches * 2.54 * 10) / 10;

  // Standard 3 inches (7.5 cm) framing margin on each side
  const marginInches = 3;
  const recommendedFabricSizeInches = {
    width: Math.round((widthInches + marginInches * 2) * 10) / 10,
    height: Math.round((heightInches + marginInches * 2) * 10) / 10,
  };
  const recommendedFabricSizeCm = {
    width: Math.round(recommendedFabricSizeInches.width * 2.54 * 10) / 10,
    height: Math.round(recommendedFabricSizeInches.height * 2.54 * 10) / 10,
  };

  return {
    clothCount,
    dimensions: {
      widthInches,
      heightInches,
      widthCm,
      heightCm,
      summary: `${widthInches}" × ${heightInches}" (${widthCm} × ${heightCm} cm)`,
    },
    recommendedFabricSizeInches,
    recommendedFabricSizeCm,
  };
}

/**
 * Calculates physical dimensions and required 29x29 pegboards for Perler beads
 */
export function calculatePerlerDimensions(
  gridWidth: number,
  gridHeight: number,
  beadType: PerlerBeadType = 'midi-5mm'
): PerlerMaterials {
  const beadDiameterMm = beadType === 'midi-5mm' ? 5.0 : 2.6;
  const widthMm = gridWidth * beadDiameterMm;
  const heightMm = gridHeight * beadDiameterMm;

  const widthCm = Math.round((widthMm / 10) * 10) / 10;
  const heightCm = Math.round((heightMm / 10) * 10) / 10;
  const widthInches = Math.round((widthCm / 2.54) * 10) / 10;
  const heightInches = Math.round((heightCm / 2.54) * 10) / 10;

  // Standard interlocking pegboard is 29x29 beads
  const boardSize = 29;
  const pegboardCols = Math.ceil(gridWidth / boardSize);
  const pegboardRows = Math.ceil(gridHeight / boardSize);
  const totalPegboards = pegboardCols * pegboardRows;

  return {
    beadType,
    dimensions: {
      widthInches,
      heightInches,
      widthCm,
      heightCm,
      summary: `${widthCm} × ${heightCm} cm (${widthInches}" × ${heightInches}")`,
    },
    pegboardCols,
    pegboardRows,
    totalPegboards,
  };
}

/**
 * Calculates physical dimensions for Diamond Painting
 */
export function calculateDiamondDimensions(
  gridWidth: number,
  gridHeight: number,
  drillType: DiamondDrillType = 'square-2.5mm'
): DiamondMaterials {
  const drillMm = drillType === 'square-2.5mm' ? 2.5 : 2.8;
  const widthMm = gridWidth * drillMm;
  const heightMm = gridHeight * drillMm;

  const widthCm = Math.round((widthMm / 10) * 10) / 10;
  const heightCm = Math.round((heightMm / 10) * 10) / 10;
  const widthInches = Math.round((widthCm / 2.54) * 10) / 10;
  const heightInches = Math.round((heightCm / 2.54) * 10) / 10;

  return {
    drillType,
    dimensions: {
      widthInches,
      heightInches,
      widthCm,
      heightCm,
      summary: `${widthCm} × ${heightCm} cm (${widthInches}" × ${heightInches}")`,
    },
  };
}

/**
 * Estimates required standard DMC floss skeins (8m / 8.7yd standard skein)
 * Assuming 2 strands on 14-count Aida yielding ~1,800 stitches per full skein
 */
export function estimateDmcSkeins(stitchCount: number): {
  skeinsToBuy: number;
  exactSkeins: number;
  percentageOfSkein: number;
} {
  const stitchesPerSkein = 1800;
  const exactSkeins = stitchCount / stitchesPerSkein;
  const skeinsToBuy = stitchCount > 0 ? Math.ceil(exactSkeins) : 0;
  const percentageOfSkein = Math.min(100, Math.round(exactSkeins * 100));

  return {
    skeinsToBuy,
    exactSkeins: Math.round(exactSkeins * 10) / 10,
    percentageOfSkein,
  };
}

/**
 * Estimates required Perler bead packs (standard 1,000-count bags)
 */
export function estimateBeadPacks(beadCount: number): {
  packsToBuy: number;
  surplusBeads: number;
} {
  const packSize = 1000;
  const packsToBuy = beadCount > 0 ? Math.ceil(beadCount / packSize) : 0;
  const surplusBeads = packsToBuy * packSize - beadCount;

  return {
    packsToBuy,
    surplusBeads,
  };
}

/**
 * General helper to format sizing summary for any craft
 */
export function getCraftDimensionsSummary(
  gridWidth: number,
  gridHeight: number,
  craftType: CraftType,
  clothCount: CrossStitchClothCount = 14
): string {
  if (craftType === 'cross-stitch') {
    const res = calculateCrossStitchDimensions(gridWidth, gridHeight, clothCount);
    return `${res.dimensions.summary} on ${clothCount}-count Aida`;
  }
  if (craftType === 'perler') {
    const res = calculatePerlerDimensions(gridWidth, gridHeight, 'midi-5mm');
    return `${res.dimensions.summary} • ${res.totalPegboards} ${res.totalPegboards === 1 ? 'board' : 'boards'}`;
  }
  if (craftType === 'diamond') {
    const res = calculateDiamondDimensions(gridWidth, gridHeight, 'square-2.5mm');
    return `${res.dimensions.summary} (2.5mm drills)`;
  }
  return `${gridWidth} × ${gridHeight} pixels`;
}
