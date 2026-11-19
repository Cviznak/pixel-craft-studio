import type { CraftType, GridConfig, PaletteColor } from '../types/craft';

export interface SharedPatternData {
  title?: string;
  craftType: CraftType;
  width: number;
  height: number;
  palette: PaletteColor[];
  gridData: number[][];
}

/**
 * Compresses 2D grid numbers using Run-Length Encoding (e.g. [0,0,0,1,1] -> "0:3,1:2")
 */
export function compressGridRLE(grid: number[][]): string {
  const flat: number[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      flat.push(grid[y][x]);
    }
  }

  const runs: string[] = [];
  let curVal = flat[0];
  let curLen = 0;

  for (let i = 0; i < flat.length; i++) {
    if (flat[i] === curVal) {
      curLen++;
    } else {
      runs.push(`${curVal}:${curLen}`);
      curVal = flat[i];
      curLen = 1;
    }
  }
  if (curLen > 0) {
    runs.push(`${curVal}:${curLen}`);
  }

  return runs.join(';');
}

/**
 * Decompresses Run-Length Encoded string back to 2D grid numbers
 */
export function decompressGridRLE(rle: string, width: number, height: number): number[][] {
  const flat: number[] = [];
  const parts = rle.split(';');
  for (const part of parts) {
    if (!part) continue;
    const [valStr, lenStr] = part.split(':');
    const val = parseInt(valStr, 10);
    const len = parseInt(lenStr, 10);
    for (let i = 0; i < len; i++) {
      flat.push(val);
    }
  }

  const grid: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      row.push(flat[y * width + x] ?? -1);
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Encodes pattern configuration and grid into a compact, URL-safe base64 string
 */
export function encodePatternToHash(
  config: GridConfig,
  gridData: number[][],
  palette: PaletteColor[],
  title = 'My Pattern'
): string {
  try {
    const compactPalette = palette.map((c) => ({
      i: c.id,
      h: c.hex,
      s: c.symbol,
      c: c.code || '',
      n: c.name || '',
      r: c.r,
      g: c.g,
      b: c.b,
    }));

    const payload = {
      t: title,
      c: config.craftType,
      w: config.width,
      h: config.height,
      u: config.unitSystem || 'imperial',
      p: compactPalette,
      g: compressGridRLE(gridData),
    };

    const jsonStr = JSON.stringify(payload);
    // URL-safe base64 encoding
    const b64 = btoa(encodeURIComponent(jsonStr));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Failed to encode pattern to hash:', err);
    return '';
  }
}

/**
 * Decodes a URL-safe base64 string back into full pattern data
 */
export function decodePatternFromHash(hashString: string): SharedPatternData | null {
  try {
    let clean = hashString.replace(/^#\/?/, '').replace(/^pattern=/, '');
    if (!clean) return null;

    // Restore standard base64 padding
    clean = clean.replace(/-/g, '+').replace(/_/g, '/');
    while (clean.length % 4 !== 0) {
      clean += '=';
    }

    const jsonStr = decodeURIComponent(atob(clean));
    const payload = JSON.parse(jsonStr);

    if (!payload.w || !payload.h || !payload.g || !Array.isArray(payload.p)) {
      return null;
    }

    const palette: PaletteColor[] = payload.p.map((item: any, idx: number) => ({
      id: item.i || `color-${idx}`,
      hex: item.h,
      symbol: item.s,
      code: item.c || undefined,
      name: item.n || undefined,
      r: item.r ?? 0,
      g: item.g ?? 0,
      b: item.b ?? 0,
      count: 0,
      percentage: 0,
    }));

    const gridData = decompressGridRLE(payload.g, payload.w, payload.h);

    return {
      title: payload.t,
      craftType: payload.c || 'cross-stitch',
      width: payload.w,
      height: payload.h,
      palette,
      gridData,
    };
  } catch (err) {
    console.warn('Failed to parse pattern hash:', err);
    return null;
  }
}

/**
 * Builds the full shareable URL with the pattern hash
 */
export function buildShareablePatternUrl(
  config: GridConfig,
  gridData: number[][],
  palette: PaletteColor[],
  title = 'My Pattern'
): string {
  const hash = encodePatternToHash(config, gridData, palette, title);
  if (!hash) return window.location.href;
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  return `${baseUrl}#pattern=${hash}`;
}
