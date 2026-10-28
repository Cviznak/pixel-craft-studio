import type { PaletteColor } from '../types/craft';

export interface RowSegment {
  colorIndex: number;
  colorName: string;
  colorCode: string;
  colorHex: string;
  colorSymbol: string;
  abbreviation: string;
  count: number;
}

export interface RowInstruction {
  rowNumber: number;
  gridY: number;
  side: 'RS' | 'WS';
  direction: '←' | '→';
  directionText: string;
  totalStitches: number;
  segments: RowSegment[];
  shorthandText: string;
  fullText: string;
}

export interface WrittenInstructionsConfig {
  directionMode: 'bottom-to-top' | 'top-to-bottom'; // tapestry is almost always bottom-to-top
  turnMode: 'alternating' | 'all-ltr' | 'all-rtl';  // standard turned rows vs single direction
  formatStyle: 'color-name' | 'abbreviation' | 'symbol';
}

export const DEFAULT_INSTRUCTIONS_CONFIG: WrittenInstructionsConfig = {
  directionMode: 'bottom-to-top',
  turnMode: 'alternating',
  formatStyle: 'color-name',
};

// Generates alphabetical letter abbreviations for colors (A, B, C, ... Z, AA, AB)
export function getColorAbbreviation(index: number): string {
  if (index < 26) {
    return String.fromCharCode(65 + index); // A - Z
  }
  const first = String.fromCharCode(65 + Math.floor(index / 26) - 1);
  const second = String.fromCharCode(65 + (index % 26));
  return `${first}${second}`;
}

/**
 * Generates complete row-by-row written instructions from grid data and palette
 */
export function generateCrochetInstructions(
  gridData: number[][],
  palette: PaletteColor[],
  config: WrittenInstructionsConfig = DEFAULT_INSTRUCTIONS_CONFIG
): {
  colorLegend: { abbreviation: string; color: PaletteColor }[];
  rows: RowInstruction[];
  totalRows: number;
  totalStitches: number;
} {
  const height = gridData.length;
  const width = height > 0 ? gridData[0].length : 0;

  if (width === 0 || height === 0) {
    return { colorLegend: [], rows: [], totalRows: 0, totalStitches: 0 };
  }

  // Build color legend
  const colorLegend = palette.map((color, idx) => ({
    abbreviation: getColorAbbreviation(idx),
    color,
  }));

  const rows: RowInstruction[] = [];
  const isBottomToTop = config.directionMode === 'bottom-to-top';

  for (let r = 0; r < height; r++) {
    const rowNumber = r + 1;
    // If bottom-to-top, Row 1 is gridData[height - 1]
    const gridY = isBottomToTop ? height - 1 - r : r;
    const rowData = gridData[gridY] || [];

    // Determine working direction
    let isReversed = false;
    let side: 'RS' | 'WS' = rowNumber % 2 === 1 ? 'RS' : 'WS';

    if (config.turnMode === 'alternating') {
      // Row 1 (RS): Right-to-Left (or Left-to-Right depending on convention).
      // Standard crochet: Row 1 worked right-to-left (x from width-1 down to 0)
      isReversed = rowNumber % 2 === 0; // Even rows turned
    } else if (config.turnMode === 'all-rtl') {
      isReversed = true;
      side = 'RS';
    } else if (config.turnMode === 'all-ltr') {
      isReversed = false;
      side = 'RS';
    }

    const direction: '←' | '→' = isReversed ? '←' : '→';
    const directionText = isReversed ? 'Right to Left' : 'Left to Right';

    // Collect sequence of color indices across the row
    const cellIndices: number[] = [];
    if (isReversed) {
      for (let x = width - 1; x >= 0; x--) {
        cellIndices.push(rowData[x] ?? 0);
      }
    } else {
      for (let x = 0; x < width; x++) {
        cellIndices.push(rowData[x] ?? 0);
      }
    }

    // Group into segments
    const segments: RowSegment[] = [];
    let currentIdx = -1;
    let currentCount = 0;

    for (let i = 0; i < cellIndices.length; i++) {
      const cIdx = cellIndices[i];
      if (cIdx === currentIdx) {
        currentCount++;
      } else {
        if (currentCount > 0) {
          if (currentIdx === -1) {
            segments.push({
              colorIndex: -1,
              colorName: 'Skip / Empty',
              colorCode: 'Skip',
              colorHex: '#475569',
              colorSymbol: '—',
              abbreviation: 'Skip',
              count: currentCount,
            });
          } else {
            const col = palette[currentIdx];
            segments.push({
              colorIndex: currentIdx,
              colorName: col?.name || `Color ${currentIdx + 1}`,
              colorCode: col?.code || col?.hex || '',
              colorHex: col?.hex || '#ffffff',
              colorSymbol: col?.symbol || '?',
              abbreviation: getColorAbbreviation(currentIdx),
              count: currentCount,
            });
          }
        }
        currentIdx = cIdx;
        currentCount = 1;
      }
    }

    if (currentCount > 0) {
      if (currentIdx === -1) {
        segments.push({
          colorIndex: -1,
          colorName: 'Skip / Empty',
          colorCode: 'Skip',
          colorHex: '#475569',
          colorSymbol: '—',
          abbreviation: 'Skip',
          count: currentCount,
        });
      } else {
        const col = palette[currentIdx];
        segments.push({
          colorIndex: currentIdx,
          colorName: col?.name || `Color ${currentIdx + 1}`,
          colorCode: col?.code || col?.hex || '',
          colorHex: col?.hex || '#ffffff',
          colorSymbol: col?.symbol || '?',
          abbreviation: getColorAbbreviation(currentIdx),
          count: currentCount,
        });
      }
    }

    // Format texts
    const shorthandParts = segments.map((s) => `(${s.abbreviation}) x ${s.count}`);
    const fullParts = segments.map((s) => `(${s.colorName}) x ${s.count}`);

    const shorthandText = `${direction} Row ${rowNumber} [${side}]: ${shorthandParts.join(', ')}`;
    const fullText = `${direction} Row ${rowNumber} [${side}]: ${fullParts.join(', ')}`;

    rows.push({
      rowNumber,
      gridY,
      side,
      direction,
      directionText,
      totalStitches: width,
      segments,
      shorthandText,
      fullText,
    });
  }

  return {
    colorLegend,
    rows,
    totalRows: height,
    totalStitches: width * height,
  };
}

/**
 * Formats all rows as plain text for easy copying or export
 */
export function formatInstructionsAsPlainText(
  instructions: ReturnType<typeof generateCrochetInstructions>,
  projectName = 'Pixel Craft Pattern'
): string {
  const lines: string[] = [];

  lines.push(`=== ${projectName} ===`);
  lines.push(`Written Row-by-Row Tapestry Crochet Instructions`);
  lines.push(`Total Rows: ${instructions.totalRows} | Stitches per row: ${instructions.rows[0]?.totalStitches || 0}`);
  lines.push('');

  lines.push('--- Color Key ---');
  instructions.colorLegend.forEach((item) => {
    lines.push(`[${item.abbreviation}] = ${item.color.name || item.color.code || item.color.hex} (${item.color.hex}) - Total: ${item.color.count} sts`);
  });
  lines.push('');

  lines.push('--- Instructions ---');
  instructions.rows.forEach((r) => {
    lines.push(r.fullText);
  });

  return lines.join('\n');
}
