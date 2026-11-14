import type { PaletteColor } from '../types/craft';
import { hexToRgb } from './colorUtils';
import { getCraftSymbol } from './symbols';

export interface PalettePreset {
  id: string;
  name: string;
  description: string;
  colors: { hex: string; name: string; code?: string; brand?: 'DMC' | 'Perler' | 'Custom' }[];
}

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: 'pico8',
    name: 'PICO-8 Classic',
    description: 'The iconic 16-color fantasy console palette, beloved by pixel artists worldwide.',
    colors: [
      { hex: '#000000', name: 'Black' },
      { hex: '#1D2B53', name: 'Dark Blue' },
      { hex: '#7E2553', name: 'Dark Purple' },
      { hex: '#008751', name: 'Dark Green' },
      { hex: '#AB5236', name: 'Brown' },
      { hex: '#5F574F', name: 'Dark Gray' },
      { hex: '#C2C3C7', name: 'Light Gray' },
      { hex: '#FFF1E8', name: 'White' },
      { hex: '#FF004D', name: 'Red' },
      { hex: '#FFA300', name: 'Orange' },
      { hex: '#FFEC27', name: 'Yellow' },
      { hex: '#00E436', name: 'Green' },
      { hex: '#29ADFF', name: 'Blue' },
      { hex: '#83769C', name: 'Lavender' },
      { hex: '#FF77A8', name: 'Pink' },
      { hex: '#FFCCAA', name: 'Peach' },
    ],
  },
  {
    id: 'perler',
    name: 'Perler Beads Essentials',
    description: '16 most popular fusible bead colors for physical pegboard creations.',
    colors: [
      { hex: '#000000', name: 'Black', code: 'P18', brand: 'Perler' },
      { hex: '#FFFFFF', name: 'White', code: 'P01', brand: 'Perler' },
      { hex: '#E53935', name: 'Red', code: 'P05', brand: 'Perler' },
      { hex: '#FB8C00', name: 'Orange', code: 'P04', brand: 'Perler' },
      { hex: '#FDD835', name: 'Yellow', code: 'P03', brand: 'Perler' },
      { hex: '#43A047', name: 'Green', code: 'P10', brand: 'Perler' },
      { hex: '#7CB342', name: 'Light Green', code: 'P11', brand: 'Perler' },
      { hex: '#1E88E5', name: 'Blue', code: 'P08', brand: 'Perler' },
      { hex: '#00ACC1', name: 'Turquoise', code: 'P31', brand: 'Perler' },
      { hex: '#8E24AA', name: 'Purple', code: 'P07', brand: 'Perler' },
      { hex: '#F06292', name: 'Pink', code: 'P33', brand: 'Perler' },
      { hex: '#C2185B', name: 'Magenta', code: 'P23', brand: 'Perler' },
      { hex: '#FFCCBC', name: 'Peach', code: 'P22', brand: 'Perler' },
      { hex: '#5D4037', name: 'Brown', code: 'P12', brand: 'Perler' },
      { hex: '#9E9E9E', name: 'Grey', code: 'P17', brand: 'Perler' },
      { hex: '#37474F', name: 'Charcoal', code: 'P37', brand: 'Perler' },
    ],
  },
  {
    id: 'dmc',
    name: 'DMC Embroidery Floss',
    description: '16 core DMC embroidery floss colors with official catalog numbers.',
    colors: [
      { hex: '#000000', name: 'Black', code: '310', brand: 'DMC' },
      { hex: '#FFFFFF', name: 'White', code: 'Blanc', brand: 'DMC' },
      { hex: '#C72435', name: 'Red', code: '321', brand: 'DMC' },
      { hex: '#FF7800', name: 'Tangerine', code: '740', brand: 'DMC' },
      { hex: '#FED648', name: 'Yellow Medium', code: '743', brand: 'DMC' },
      { hex: '#156B3A', name: 'Kelly Green', code: '700', brand: 'DMC' },
      { hex: '#77BD3D', name: 'Parrot Green', code: '906', brand: 'DMC' },
      { hex: '#174A82', name: 'Navy Blue', code: '796', brand: 'DMC' },
      { hex: '#00A8B5', name: 'Electric Blue', code: '996', brand: 'DMC' },
      { hex: '#63256A', name: 'Lavender Dark', code: '208', brand: 'DMC' },
      { hex: '#DF3873', name: 'Cranberry Medium', code: '602', brand: 'DMC' },
      { hex: '#FEDDD8', name: 'Baby Pink', code: '818', brand: 'DMC' },
      { hex: '#FEC9B8', name: 'Peach Flesh', code: '353', brand: 'DMC' },
      { hex: '#5B3727', name: 'Coffee Brown', code: '898', brand: 'DMC' },
      { hex: '#DDD8CB', name: 'Beige Gray', code: '644', brand: 'DMC' },
      { hex: '#717578', name: 'Steel Gray Dark', code: '414', brand: 'DMC' },
    ],
  },
  {
    id: 'gameboy',
    name: 'GameBoy Classic',
    description: 'Iconic 4-shade greenish palette from the original 1989 Nintendo Game Boy.',
    colors: [
      { hex: '#0F380F', name: 'Deepest Olive' },
      { hex: '#306230', name: 'Dark Olive' },
      { hex: '#8BAC0F', name: 'Medium Green' },
      { hex: '#9BBC0F', name: 'Light Green' },
    ],
  },
  {
    id: 'arcade',
    name: 'Retro Arcade 16',
    description: 'High-contrast 16-color palette inspired by 80s arcade cabinets and CRT displays.',
    colors: [
      { hex: '#000000', name: 'Void Black' },
      { hex: '#FFFFFF', name: 'Pure White' },
      { hex: '#FF0033', name: 'Neon Red' },
      { hex: '#FF6600', name: 'Blaze Orange' },
      { hex: '#FFCC00', name: 'Arcade Yellow' },
      { hex: '#33CC33', name: 'Laser Green' },
      { hex: '#00CCCC', name: 'Cyan Beam' },
      { hex: '#0066FF', name: 'Electric Blue' },
      { hex: '#6600FF', name: 'Deep Violet' },
      { hex: '#FF00CC', name: 'Synth Magenta' },
      { hex: '#FF6699', name: 'Bubble Pink' },
      { hex: '#993300', name: 'Brick Rust' },
      { hex: '#666666', name: 'CRT Gray' },
      { hex: '#CCCCCC', name: 'Silver' },
      { hex: '#003366', name: 'Deep Ocean' },
      { hex: '#66FF66', name: 'Toxic Lime' },
    ],
  },
  {
    id: 'pastel',
    name: 'Pastel Dreams',
    description: 'Soft, gentle, cozy pastel tones perfect for cute cross-stitch, plushies, and flowers.',
    colors: [
      { hex: '#FFFFFF', name: 'Milk White' },
      { hex: '#4A4E69', name: 'Muted Slate' },
      { hex: '#FDE2E4', name: 'Blush Pink' },
      { hex: '#FFCAD4', name: 'Soft Rose' },
      { hex: '#B5E2FA', name: 'Baby Sky' },
      { hex: '#97D2FB', name: 'Cool Breeze' },
      { hex: '#D6E2E9', name: 'Powder Blue' },
      { hex: '#CCD5AE', name: 'Sage Green' },
      { hex: '#E9EDC9', name: 'Pale Lime' },
      { hex: '#FEFAE0', name: 'Warm Cream' },
      { hex: '#FAEDCD', name: 'Butter Sand' },
      { hex: '#D4A373', name: 'Warm Cookie' },
      { hex: '#E2ECE9', name: 'Seafoam Mist' },
      { hex: '#DFCCF1', name: 'Soft Lilac' },
      { hex: '#F7D6E0', name: 'Cotton Candy' },
      { hex: '#C5BAAF', name: 'Mushroom Gray' },
    ],
  },
];

/**
 * Creates a fully initialized PaletteColor array from a chosen preset.
 */
export function createPaletteFromPreset(presetId: string): PaletteColor[] {
  const preset = PALETTE_PRESETS.find((p) => p.id === presetId) || PALETTE_PRESETS[0];

  return preset.colors.map((c, i) => {
    const rgb = hexToRgb(c.hex);
    return {
      id: `palette-${preset.id}-${i}-${Date.now().toString(36)}`,
      hex: c.hex.toUpperCase(),
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      symbol: getCraftSymbol(i),
      count: 0,
      percentage: 0,
      name: c.name,
      code: c.code || c.hex.toUpperCase(),
      brand: c.brand || 'Custom',
      isLocked: false,
    };
  });
}

/**
 * Creates blank grid data and corresponding initial palette with correct counts.
 */
export function createBlankCanvasGrid(
  width: number,
  height: number,
  backgroundMode: 'transparent' | 'white' | 'dark',
  palette: PaletteColor[]
): { gridData: number[][]; palette: PaletteColor[]; initialActiveColor: number } {
  let gridData: number[][] = [];
  const totalCells = width * height;

  if (backgroundMode === 'transparent') {
    // Fill all cells with -1 (empty/transparent)
    gridData = Array.from({ length: height }, () => Array(width).fill(-1));
    return {
      gridData,
      palette,
      initialActiveColor: palette.length > 0 ? 0 : -1,
    };
  }

  // Find or insert background color into palette
  const targetHex = backgroundMode === 'white' ? '#FFFFFF' : '#000000';
  let bgIdx = palette.findIndex((c) => c.hex.toUpperCase() === targetHex);

  let updatedPalette = [...palette];

  if (bgIdx === -1) {
    // Add background color to start of palette
    const rgb = hexToRgb(targetHex);
    const newColor: PaletteColor = {
      id: `palette-bg-${Date.now().toString(36)}`,
      hex: targetHex,
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      symbol: getCraftSymbol(updatedPalette.length),
      count: totalCells,
      percentage: 100,
      name: backgroundMode === 'white' ? 'White Background' : 'Dark Background',
      code: targetHex,
      brand: 'Custom',
      isLocked: true,
    };
    updatedPalette = [newColor, ...updatedPalette];
    bgIdx = 0;
  } else {
    updatedPalette[bgIdx] = {
      ...updatedPalette[bgIdx],
      count: totalCells,
      percentage: 100,
    };
  }

  gridData = Array.from({ length: height }, () => Array(width).fill(bgIdx));

  // Default active color to contrasting draw color (e.g., if white bg, pick black/first non-white color)
  let activeDrawColor = 0;
  for (let i = 0; i < updatedPalette.length; i++) {
    if (i !== bgIdx) {
      activeDrawColor = i;
      break;
    }
  }

  return {
    gridData,
    palette: updatedPalette,
    initialActiveColor: activeDrawColor,
  };
}

/**
 * Creates a 1:1 PNG Data URL representing the grid so that export,
 * inspect, and beforeunload persistence work seamlessly without null images.
 */
export function generateCanvasDataUrl(gridData: number[][], palette: PaletteColor[]): string {
  if (gridData.length === 0 || gridData[0].length === 0) return '';
  const height = gridData.length;
  const width = gridData[0].length;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pIdx = (y * width + x) * 4;
      const colorIdx = gridData[y][x];

      if (colorIdx === -1 || !palette[colorIdx]) {
        // Transparent
        data[pIdx] = 0;
        data[pIdx + 1] = 0;
        data[pIdx + 2] = 0;
        data[pIdx + 3] = 0;
      } else {
        const color = palette[colorIdx];
        data[pIdx] = color.r;
        data[pIdx + 1] = color.g;
        data[pIdx + 2] = color.b;
        data[pIdx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}
