import type { CellProgress } from '../types/craft';

/**
 * Canvas transformations: auto-center, nudge/shift, flips, and rotations.
 * Also handles transforming tracked completedCells ("x,y": true) seamlessly.
 */

function parseKey(key: string): { x: number; y: number } | null {
  const parts = key.split(',');
  if (parts.length !== 2) return null;
  const x = parseInt(parts[0], 10);
  const y = parseInt(parts[1], 10);
  if (isNaN(x) || isNaN(y)) return null;
  return { x, y };
}

export function autoCenterGrid(
  grid: number[][],
  completedCells: CellProgress = {}
): { newGrid: number[][]; newCompletedCells: CellProgress; moved: boolean } {
  const height = grid.length;
  if (height === 0) return { newGrid: grid, newCompletedCells: completedCells, moved: false };
  const width = grid[0].length;

  let minX = width, maxX = -1;
  let minY = height, maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] !== -1) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If grid is empty, nothing to center
  if (maxX === -1) return { newGrid: grid, newCompletedCells: completedCells, moved: false };

  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;

  const targetMinX = Math.floor((width - contentWidth) / 2);
  const targetMinY = Math.floor((height - contentHeight) / 2);

  const dx = targetMinX - minX;
  const dy = targetMinY - minY;

  if (dx === 0 && dy === 0) return { newGrid: grid, newCompletedCells: completedCells, moved: false };

  const newGrid = Array.from({ length: height }, () => Array(width).fill(-1));
  const newCompletedCells: CellProgress = {};

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const ny = y + dy;
      const nx = x + dx;
      if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
        newGrid[ny][nx] = grid[y][x];
        if (completedCells[`${x},${y}`]) {
          newCompletedCells[`${nx},${ny}`] = true;
        }
      }
    }
  }

  return { newGrid, newCompletedCells, moved: true };
}

export function shiftGrid(
  grid: number[][],
  dx: number,
  dy: number,
  completedCells: CellProgress = {},
  wrap = false
): { newGrid: number[][]; newCompletedCells: CellProgress } {
  const height = grid.length;
  if (height === 0) return { newGrid: grid, newCompletedCells: completedCells };
  const width = grid[0].length;
  const newGrid = Array.from({ length: height }, () => Array(width).fill(-1));
  const newCompletedCells: CellProgress = {};

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let nx = x + dx;
      let ny = y + dy;

      if (wrap) {
        nx = (nx + width) % width;
        ny = (ny + height) % height;
        newGrid[ny][nx] = grid[y][x];
        if (completedCells[`${x},${y}`]) {
          newCompletedCells[`${nx},${ny}`] = true;
        }
      } else {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          newGrid[ny][nx] = grid[y][x];
          if (completedCells[`${x},${y}`]) {
            newCompletedCells[`${nx},${ny}`] = true;
          }
        }
      }
    }
  }

  return { newGrid, newCompletedCells };
}

export function flipGridHorizontal(
  grid: number[][],
  completedCells: CellProgress = {}
): { newGrid: number[][]; newCompletedCells: CellProgress } {
  const height = grid.length;
  if (height === 0) return { newGrid: grid, newCompletedCells: completedCells };
  const width = grid[0].length;

  const newGrid = grid.map((row) => [...row].reverse());
  const newCompletedCells: CellProgress = {};

  Object.keys(completedCells).forEach((key) => {
    const pt = parseKey(key);
    if (pt) {
      const nx = width - 1 - pt.x;
      if (nx >= 0 && nx < width) {
        newCompletedCells[`${nx},${pt.y}`] = true;
      }
    }
  });

  return { newGrid, newCompletedCells };
}

export function flipGridVertical(
  grid: number[][],
  completedCells: CellProgress = {}
): { newGrid: number[][]; newCompletedCells: CellProgress } {
  const height = grid.length;
  if (height === 0 || grid[0].length === 0) return { newGrid: grid, newCompletedCells: completedCells };

  const newGrid = [...grid].reverse().map((row) => [...row]);
  const newCompletedCells: CellProgress = {};

  Object.keys(completedCells).forEach((key) => {
    const pt = parseKey(key);
    if (pt) {
      const ny = height - 1 - pt.y;
      if (ny >= 0 && ny < height) {
        newCompletedCells[`${pt.x},${ny}`] = true;
      }
    }
  });

  return { newGrid, newCompletedCells };
}

export function rotateGrid(
  grid: number[][],
  direction: 'cw' | 'ccw',
  completedCells: CellProgress = {}
): { newGrid: number[][]; newCompletedCells: CellProgress; newWidth: number; newHeight: number } {
  const h = grid.length;
  if (h === 0) return { newGrid: grid, newCompletedCells: completedCells, newWidth: 0, newHeight: 0 };
  const w = grid[0].length;

  const newHeight = w;
  const newWidth = h;
  const newGrid = Array.from({ length: newHeight }, () => Array(newWidth).fill(-1));
  const newCompletedCells: CellProgress = {};

  if (direction === 'cw') {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ny = x;
        const nx = h - 1 - y;
        newGrid[ny][nx] = grid[y][x];
      }
    }

    Object.keys(completedCells).forEach((key) => {
      const pt = parseKey(key);
      if (pt) {
        const ny = pt.x;
        const nx = h - 1 - pt.y;
        if (ny >= 0 && ny < newHeight && nx >= 0 && nx < newWidth) {
          newCompletedCells[`${nx},${ny}`] = true;
        }
      }
    });
  } else {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ny = w - 1 - x;
        const nx = y;
        newGrid[ny][nx] = grid[y][x];
      }
    }

    Object.keys(completedCells).forEach((key) => {
      const pt = parseKey(key);
      if (pt) {
        const ny = w - 1 - pt.x;
        const nx = pt.y;
        if (ny >= 0 && ny < newHeight && nx >= 0 && nx < newWidth) {
          newCompletedCells[`${nx},${ny}`] = true;
        }
      }
    });
  }

  return { newGrid, newCompletedCells, newWidth, newHeight };
}
