import type { CanvasLayer, PaletteColor } from '../types/craft';

export const MAX_LAYERS = 10;

export function createEmptyLayerGrid(width: number, height: number): number[][] {
  if (width <= 0 || height <= 0) return [];
  return Array.from({ length: height }, () => new Array<number>(width).fill(-1));
}

export function cloneGrid(grid: number[][]): number[][] {
  return grid.map((row) => [...row]);
}

export function cloneLayers(layers: CanvasLayer[]): CanvasLayer[] {
  return layers.map((layer) => ({
    ...layer,
    grid: cloneGrid(layer.grid),
  }));
}

export function createLayer(
  name: string,
  grid: number[][],
  overrides?: Partial<Omit<CanvasLayer, 'id' | 'name' | 'grid'>> & { id?: string }
): CanvasLayer {
  const id =
    overrides?.id ||
    `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const rawOpacity = overrides?.opacity ?? 1;
  const clampedOpacity = Math.max(0.1, Math.min(1, Number.isFinite(rawOpacity) ? rawOpacity : 1));
  return {
    id,
    name,
    visible: overrides?.visible ?? true,
    locked: overrides?.locked ?? false,
    opacity: clampedOpacity,
    grid: cloneGrid(grid),
  };
}

export function createSingleLayerStack(
  grid: number[][],
  name = 'Layer 1'
): { layers: CanvasLayer[]; activeLayerId: string } {
  if (!grid || grid.length === 0 || (grid[0]?.length ?? 0) === 0) {
    return { layers: [], activeLayerId: '' };
  }
  const baseLayer = createLayer(name, grid);
  return { layers: [baseLayer], activeLayerId: baseLayer.id };
}

export function normalizeLayersForGrid(
  layers: CanvasLayer[] | undefined,
  activeLayerId: string | undefined,
  fallbackGrid: number[][]
): { layers: CanvasLayer[]; activeLayerId: string } {
  if (!layers || layers.length === 0) {
    return createSingleLayerStack(fallbackGrid);
  }

  const firstGrid = layers[0]?.grid;
  const h = firstGrid?.length ?? 0;
  const w = h > 0 ? firstGrid[0]?.length ?? 0 : 0;
  if (h === 0 || w === 0) {
    return createSingleLayerStack(fallbackGrid);
  }

  const valid = layers.slice(0, MAX_LAYERS).every(
    (l) =>
      l &&
      typeof l.id === 'string' &&
      l.id.length > 0 &&
      Array.isArray(l.grid) &&
      l.grid.length === h &&
      l.grid.every((row) => Array.isArray(row) && row.length === w)
  );

  if (!valid) {
    return createSingleLayerStack(fallbackGrid);
  }

  const normalized: CanvasLayer[] = layers.slice(0, MAX_LAYERS).map((l, idx) => ({
    id: l.id,
    name: typeof l.name === 'string' && l.name.trim() ? l.name.trim() : `Layer ${idx + 1}`,
    visible: typeof l.visible === 'boolean' ? l.visible : true,
    locked: typeof l.locked === 'boolean' ? l.locked : false,
    opacity: Math.max(0.1, Math.min(1, Number.isFinite(l.opacity) ? l.opacity : 1)),
    grid: cloneGrid(l.grid),
  }));

  const resolvedActiveId =
    activeLayerId && normalized.some((l) => l.id === activeLayerId)
      ? activeLayerId
      : normalized[normalized.length - 1].id;

  return { layers: normalized, activeLayerId: resolvedActiveId };
}

/**
 * Composites visible layers bottom-to-top into a single 2D palette-index grid.
 * Cell values >= 0 overwrite lower layers; -1 acts as transparent.
 */
export function flattenLayers(layers: CanvasLayer[]): number[][] {
  if (!layers || layers.length === 0) return [];
  const height = layers[0].grid.length;
  if (height === 0) return [];
  const width = layers[0].grid[0]?.length ?? 0;
  if (width === 0) return [];

  const out = createEmptyLayerGrid(width, height);
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    if (!layer.visible) continue;
    const grid = layer.grid;
    const rows = Math.min(height, grid.length);
    for (let y = 0; y < rows; y++) {
      const row = grid[y];
      const outRow = out[y];
      const cols = Math.min(width, row.length);
      for (let x = 0; x < cols; x++) {
        const val = row[x];
        if (val !== -1 && val !== undefined) {
          outRow[x] = val;
        }
      }
    }
  }
  return out;
}

export function resizeLayerGrid(
  grid: number[][],
  newWidth: number,
  newHeight: number,
  offsetX = 0,
  offsetY = 0
): number[][] {
  const next = createEmptyLayerGrid(newWidth, newHeight);
  const oldH = grid.length;
  const oldW = oldH > 0 ? grid[0]?.length ?? 0 : 0;

  for (let y = 0; y < oldH; y++) {
    const ny = y + offsetY;
    if (ny < 0 || ny >= newHeight) continue;
    const row = grid[y];
    for (let x = 0; x < oldW; x++) {
      const nx = x + offsetX;
      if (nx < 0 || nx >= newWidth) continue;
      next[ny][nx] = row[x];
    }
  }
  return next;
}

export function rotateLayerGrid(grid: number[][], direction: 'cw' | 'ccw'): number[][] {
  const h = grid.length;
  if (h === 0) return [];
  const w = grid[0]?.length ?? 0;
  if (w === 0) return [];

  const newHeight = w;
  const newWidth = h;
  const next = createEmptyLayerGrid(newWidth, newHeight);

  if (direction === 'cw') {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        next[x][h - 1 - y] = grid[y][x];
      }
    }
  } else {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        next[w - 1 - x][y] = grid[y][x];
      }
    }
  }
  return next;
}

export function remapLayersColorIndices(
  layers: CanvasLayer[],
  remapFn: (index: number) => number
): CanvasLayer[] {
  return layers.map((layer) => ({
    ...layer,
    grid: layer.grid.map((row) => row.map((cell) => (cell >= 0 ? remapFn(cell) : -1))),
  }));
}

/**
 * Infers an oldPaletteIndex -> newPaletteIndex lookup table after global palette
 * conversions (e.g. Clean Confetti, Mood Shifter, Craft Cross-Converter) so multi-layer
 * stacks preserve individual layers cleanly without collapsing into a single layer.
 */
export function inferColorIndexRemap(
  oldGrid: number[][],
  newGrid: number[][],
  oldPalette: PaletteColor[],
  newPalette: PaletteColor[]
): number[] {
  const map = new Array<number>(oldPalette.length).fill(-1);

  const h = Math.min(oldGrid.length, newGrid.length);
  for (let y = 0; y < h; y++) {
    const oldRow = oldGrid[y];
    const newRow = newGrid[y];
    const w = Math.min(oldRow?.length ?? 0, newRow?.length ?? 0);
    for (let x = 0; x < w; x++) {
      const oldIdx = oldRow[x];
      const newIdx = newRow[x];
      if (oldIdx >= 0 && oldIdx < oldPalette.length && newIdx >= 0 && newIdx < newPalette.length) {
        if (map[oldIdx] === -1) {
          map[oldIdx] = newIdx;
        }
      }
    }
  }

  for (let oldIdx = 0; oldIdx < oldPalette.length; oldIdx++) {
    if (map[oldIdx] !== -1) continue;
    const oldColor = oldPalette[oldIdx];
    if (!oldColor || newPalette.length === 0) {
      map[oldIdx] = 0;
      continue;
    }

    const oldHex = oldColor.hex.toLowerCase();
    const exactIdx = newPalette.findIndex((c) => c.hex.toLowerCase() === oldHex);
    if (exactIdx !== -1) {
      map[oldIdx] = exactIdx;
      continue;
    }

    let bestIdx = 0;
    let bestDist = Infinity;
    for (let ni = 0; ni < newPalette.length; ni++) {
      const nc = newPalette[ni];
      const dr = oldColor.r - nc.r;
      const dg = oldColor.g - nc.g;
      const db = oldColor.b - nc.b;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = ni;
      }
    }
    map[oldIdx] = bestIdx;
  }

  return map;
}

export function mergeLayerDown(
  layers: CanvasLayer[],
  layerId: string
): { layers: CanvasLayer[]; activeLayerId: string } | null {
  const idx = layers.findIndex((l) => l.id === layerId);
  if (idx <= 0) return null;

  const upper = layers[idx];
  const lower = layers[idx - 1];
  const mergedGrid = cloneGrid(lower.grid);
  const h = Math.min(mergedGrid.length, upper.grid.length);
  for (let y = 0; y < h; y++) {
    const w = Math.min(mergedGrid[y].length, upper.grid[y].length);
    for (let x = 0; x < w; x++) {
      const val = upper.grid[y][x];
      if (val !== -1) {
        mergedGrid[y][x] = val;
      }
    }
  }

  const next = cloneLayers(layers);
  next[idx - 1] = {
    ...next[idx - 1],
    grid: mergedGrid,
  };
  next.splice(idx, 1);

  return {
    layers: next,
    activeLayerId: next[idx - 1].id,
  };
}

export function moveLayerOrder(
  layers: CanvasLayer[],
  layerId: string,
  direction: 'up' | 'down'
): CanvasLayer[] | null {
  const idx = layers.findIndex((l) => l.id === layerId);
  if (idx === -1) return null;
  const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
  if (targetIdx < 0 || targetIdx >= layers.length) return null;

  const next = cloneLayers(layers);
  const [moved] = next.splice(idx, 1);
  next.splice(targetIdx, 0, moved);
  return next;
}

export function duplicateLayer(
  layers: CanvasLayer[],
  layerId: string
): { layers: CanvasLayer[]; activeLayerId: string } | null {
  if (layers.length >= MAX_LAYERS) return null;
  const idx = layers.findIndex((l) => l.id === layerId);
  if (idx === -1) return null;

  const src = layers[idx];
  const copyName = getUniqueLayerName(layers, `${src.name} Copy`);
  const copy = createLayer(copyName, src.grid, {
    visible: true,
    locked: false,
    opacity: src.opacity,
  });

  const next = cloneLayers(layers);
  next.splice(idx + 1, 0, copy);
  return {
    layers: next,
    activeLayerId: copy.id,
  };
}

/**
 * Extracts only the newly added/modified border frame cells from a framed grid relative
 * to the unframed flattened grid shifted by (offsetX, offsetY).
 */
export function extractBorderDiffGrid(
  beforeFlattened: number[][],
  framedGrid: number[][],
  offsetX: number,
  offsetY: number
): number[][] {
  const framedH = framedGrid.length;
  const framedW = framedH > 0 ? framedGrid[0]?.length ?? 0 : 0;
  const borderGrid = createEmptyLayerGrid(framedW, framedH);

  const beforeH = beforeFlattened.length;
  const beforeW = beforeH > 0 ? beforeFlattened[0]?.length ?? 0 : 0;

  for (let y = 0; y < framedH; y++) {
    for (let x = 0; x < framedW; x++) {
      const val = framedGrid[y][x];
      if (val === -1) continue;
      const ox = x - offsetX;
      const oy = y - offsetY;
      const inOriginalBounds = oy >= 0 && oy < beforeH && ox >= 0 && ox < beforeW;
      if (!inOriginalBounds || beforeFlattened[oy][ox] !== val) {
        borderGrid[y][x] = val;
      }
    }
  }
  return borderGrid;
}

export function countLayerFilledCells(grid: number[][]): number {
  let count = 0;
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] >= 0) count++;
    }
  }
  return count;
}

export function getUniqueLayerName(layers: CanvasLayer[], baseName: string): string {
  const existing = new Set(layers.map((l) => l.name.trim().toLowerCase()));
  if (!existing.has(baseName.toLowerCase())) {
    return baseName;
  }
  let suffix = 2;
  while (existing.has(`${baseName} ${suffix}`.toLowerCase())) {
    suffix++;
  }
  return `${baseName} ${suffix}`;
}
