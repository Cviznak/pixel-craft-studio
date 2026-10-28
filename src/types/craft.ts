export type CraftType = 'perler' | 'cross-stitch' | 'diamond' | 'pixel';

export type ExtractionMode = 'vibrant' | 'balanced' | 'dominant' | 'pastel';

export type DitherType = 'none' | 'floyd-steinberg' | 'atkinson' | 'bayer';

export type CraftStandard = 'custom' | 'dmc' | 'perler';

export interface PaletteColor {
  id: string;
  hex: string;
  r: number;
  g: number;
  b: number;
  symbol: string;
  count: number;
  percentage: number;
  name?: string;
  code?: string; // DMC code or Perler code
  brand?: 'DMC' | 'Perler' | 'Custom';
  isLocked?: boolean;
}

export interface GridConfig {
  width: number;
  height: number;
  lockAspectRatio: boolean;
  colorsCount: number;
  craftType: CraftType;
  extractionMode: ExtractionMode;
  dither: DitherType;
  craftStandard: CraftStandard;
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  showGridLines: boolean;
  show10x10MajorLines: boolean;
  showRulers: boolean;
  showSymbols: boolean;
  cellSize: number; // visual scale in canvas
}

export interface CellProgress {
  [cellKey: string]: boolean; // "x,y": true
}

export interface SampleImage {
  id: string;
  name: string;
  category: string;
  url: string;
  description: string;
}

export interface AiHistoryItem {
  id: string;
  prompt: string;
  styleId: string;
  dataUrl: string;
  createdAt: string;
}

export interface CraftProject {
  version: string;
  name: string;
  createdAt: string;
  gridConfig: GridConfig;
  gridData: number[][]; // 2D array of palette indices
  palette: PaletteColor[];
  completedCells: CellProgress;
}
