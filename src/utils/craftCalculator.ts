import type { 
  CraftType, 
  CrochetGaugeConfig, 
  CrochetYarnWeight 
} from '../types/craft';

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

export interface CrochetMaterials {
  gauge: CrochetGaugeConfig;
  dimensions: PhysicalDimensions;
  stitchesPerInch: number;
  rowsPerInch: number;
  stitchAspectRatio: number; // width / height
  totalStitches: number;
  estimatedYardsTotal: number;
  estimatedMetersTotal: number;
  estimatedSkeinsTotal: number;
}

export const CROCHET_YARN_PRESETS: {
  [weight in CrochetYarnWeight]: {
    name: string;
    hookMm: number;
    defaultStsPer4In: number;
    defaultRowsPer4In: number;
    yardsPerStitch: number;
  };
} = {
  fingering: {
    name: 'Fingering / Sock (#1-#2)',
    hookMm: 3.25,
    defaultStsPer4In: 24,
    defaultRowsPer4In: 28,
    yardsPerStitch: 0.5,
  },
  dk: {
    name: 'DK / Light Worsted (#3)',
    hookMm: 4.0,
    defaultStsPer4In: 18,
    defaultRowsPer4In: 22,
    yardsPerStitch: 0.7,
  },
  worsted: {
    name: 'Worsted / Medium (#4)',
    hookMm: 5.0,
    defaultStsPer4In: 15,
    defaultRowsPer4In: 17,
    yardsPerStitch: 0.9,
  },
  bulky: {
    name: 'Bulky / Chunky (#5)',
    hookMm: 6.5,
    defaultStsPer4In: 12,
    defaultRowsPer4In: 14,
    yardsPerStitch: 1.2,
  },
  'super-bulky': {
    name: 'Super Bulky (#6)',
    hookMm: 9.0,
    defaultStsPer4In: 8,
    defaultRowsPer4In: 10,
    yardsPerStitch: 1.8,
  },
};

export const DEFAULT_CROCHET_GAUGE: CrochetGaugeConfig = {
  stitchType: 'sc',
  yarnWeight: 'worsted',
  stitchesPer4Inches: 15,
  rowsPer4Inches: 17,
  hookSizeMm: 5.0,
};

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
 * Calculates physical dimensions for Perler / Hama / Artkal beads
 */
export function calculatePerlerDimensions(
  gridWidth: number,
  gridHeight: number,
  beadType: PerlerBeadType = 'midi-5mm'
): PerlerMaterials {
  const beadDiameterMm = beadType === 'mini-2.6mm' ? 2.6 : 5.0;

  const widthCm = Math.round(((gridWidth * beadDiameterMm) / 10) * 10) / 10;
  const heightCm = Math.round(((gridHeight * beadDiameterMm) / 10) * 10) / 10;
  const widthInches = Math.round((widthCm / 2.54) * 10) / 10;
  const heightInches = Math.round((heightCm / 2.54) * 10) / 10;

  // Standard square interlocking pegboards are 29x29 beads
  const pegboardCols = Math.ceil(gridWidth / 29);
  const pegboardRows = Math.ceil(gridHeight / 29);
  const totalPegboards = pegboardCols * pegboardRows;

  return {
    beadType,
    dimensions: {
      widthInches,
      heightInches,
      widthCm,
      heightCm,
      summary: `${widthInches}" × ${heightInches}" (${widthCm} × ${heightCm} cm)`,
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
  const drillMm = drillType === 'round-2.8mm' ? 2.8 : 2.5;

  const widthCm = Math.round(((gridWidth * drillMm) / 10) * 10) / 10;
  const heightCm = Math.round(((gridHeight * drillMm) / 10) * 10) / 10;
  const widthInches = Math.round((widthCm / 2.54) * 10) / 10;
  const heightInches = Math.round((heightCm / 2.54) * 10) / 10;

  return {
    drillType,
    dimensions: {
      widthInches,
      heightInches,
      widthCm,
      heightCm,
      summary: `${widthInches}" × ${heightInches}" (${widthCm} × ${heightCm} cm)`,
    },
  };
}

/**
 * Calculates physical dimensions and yardage for Tapestry Crochet based on custom swatch gauge
 */
export function calculateCrochetDimensions(
  gridWidth: number,
  gridHeight: number,
  gauge: CrochetGaugeConfig = DEFAULT_CROCHET_GAUGE
): CrochetMaterials {
  const stsPer4 = Math.max(2, gauge.stitchesPer4Inches || 15);
  const rowsPer4 = Math.max(2, gauge.rowsPer4Inches || 17);

  const stitchesPerInch = stsPer4 / 4;
  const rowsPerInch = rowsPer4 / 4;

  const widthInches = Math.round((gridWidth / stitchesPerInch) * 10) / 10;
  const heightInches = Math.round((gridHeight / rowsPerInch) * 10) / 10;
  const widthCm = Math.round(widthInches * 2.54 * 10) / 10;
  const heightCm = Math.round(heightInches * 2.54 * 10) / 10;

  const stitchWidth = 4 / stsPer4;
  const stitchHeight = 4 / rowsPer4;
  const stitchAspectRatio = Math.round((stitchWidth / stitchHeight) * 100) / 100;

  const totalStitches = gridWidth * gridHeight;
  const preset = CROCHET_YARN_PRESETS[gauge.yarnWeight] || CROCHET_YARN_PRESETS.worsted;
  let yardsPerStitch = preset.yardsPerStitch;

  if (gauge.stitchType === 'hdc') yardsPerStitch *= 1.35;
  if (gauge.stitchType === 'c2c') yardsPerStitch *= 2.5;

  const estimatedYardsTotal = Math.round(totalStitches * yardsPerStitch);
  const estimatedMetersTotal = Math.round(estimatedYardsTotal * 0.9144);
  const standardSkeinYards = 200;
  const estimatedSkeinsTotal = Math.max(1, Math.ceil(estimatedYardsTotal / standardSkeinYards));

  return {
    gauge,
    dimensions: {
      widthInches,
      heightInches,
      widthCm,
      heightCm,
      summary: `${widthInches}" × ${heightInches}" (${widthCm} × ${heightCm} cm)`,
    },
    stitchesPerInch,
    rowsPerInch,
    stitchAspectRatio,
    totalStitches,
    estimatedYardsTotal,
    estimatedMetersTotal,
    estimatedSkeinsTotal,
  };
}

/**
 * Estimates required crochet yarn per color
 */
export function estimateCrochetYarnPerColor(
  colorCount: number,
  gauge: CrochetGaugeConfig = DEFAULT_CROCHET_GAUGE
): {
  yards: number;
  meters: number;
  skeins: number;
} {
  const preset = CROCHET_YARN_PRESETS[gauge.yarnWeight] || CROCHET_YARN_PRESETS.worsted;
  let yardsPerStitch = preset.yardsPerStitch;
  if (gauge.stitchType === 'hdc') yardsPerStitch *= 1.35;
  if (gauge.stitchType === 'c2c') yardsPerStitch *= 2.5;

  const yards = Math.round(colorCount * yardsPerStitch);
  const meters = Math.round(yards * 0.9144);
  const skeins = Math.max(1, Math.ceil(yards / 200));

  return { yards, meters, skeins };
}

/**
 * Estimates required DMC embroidery skeins (standard 8-meter / 8.7-yard skeins)
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
  clothCount: CrossStitchClothCount = 14,
  crochetGauge: CrochetGaugeConfig = DEFAULT_CROCHET_GAUGE
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
  if (craftType === 'crochet') {
    const res = calculateCrochetDimensions(gridWidth, gridHeight, crochetGauge);
    return `${res.dimensions.summary} • Tapestry Crochet (${crochetGauge.stitchesPer4Inches} sts × ${crochetGauge.rowsPer4Inches} rows / 4")`;
  }
  return `${gridWidth} × ${gridHeight} pixels`;
}
