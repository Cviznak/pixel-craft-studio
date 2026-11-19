import type { PaletteColor, BeadStitchStyle } from '../types/craft';
import { findClosestCraftColor } from './craftData';
import { getColorAbbreviation } from './crochetInstructions';

export interface BeadWordLegendItem {
  abbreviation: string;
  colorIndex: number;
  colorName: string;
  hex: string;
  delicaCode: string;
  count: number;
}

export interface BeadWordSegment {
  abbreviation: string;
  colorName: string;
  hex: string;
  count: number;
  isEmpty: boolean;
}

export interface BeadWordRow {
  rowLabel: string;
  rowNumber: number;
  direction: '→' | '←';
  segments: BeadWordSegment[];
  notationText: string;
  totalBeads: number;
}

export interface BeadWordChart {
  stitchStyle: BeadStitchStyle;
  legend: BeadWordLegendItem[];
  rows: BeadWordRow[];
  totalBeads: number;
}

/**
 * Generates standard bead-weaving Word Charts ((count)Letter notation, bottom-to-top)
 * with matched Miyuki Delica 11/0 shade codes for Loom, Peyote, and Brick stitch patterns.
 */
export function generateBeadWordChart(
  gridData: number[][],
  palette: PaletteColor[],
  stitchStyle: BeadStitchStyle = 'loom'
): BeadWordChart {
  const height = gridData.length;
  const width = height > 0 ? gridData[0].length : 0;

  if (height === 0 || width === 0) {
    return { stitchStyle, legend: [], rows: [], totalBeads: 0 };
  }

  // Count per color and assign Delica code
  const counts = new Array(palette.length).fill(0);
  let totalBeads = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = gridData[y][x];
      if (idx >= 0 && idx < palette.length) {
        counts[idx]++;
        totalBeads++;
      }
    }
  }

  const legend: BeadWordLegendItem[] = palette.map((c, idx) => {
    const closestDb = findClosestCraftColor(c.r, c.g, c.b, 'Miyuki');
    return {
      abbreviation: getColorAbbreviation(idx),
      colorIndex: idx,
      colorName: c.name || c.code || c.hex,
      hex: c.hex,
      delicaCode: closestDb.code,
      count: counts[idx],
    };
  });

  const rows: BeadWordRow[] = [];

  for (let r = 0; r < height; r++) {
    const rowNumber = r + 1;
    const gridY = height - 1 - r; // Bottom-to-top weaving order
    const rowData = gridData[gridY] || [];

    const isAlternating = stitchStyle === 'peyote' || stitchStyle === 'brick';
    const isReversed = isAlternating && rowNumber % 2 === 0;
    const direction: '→' | '←' = isReversed ? '←' : '→';

    const scanOrder: number[] = [];
    if (isReversed) {
      for (let x = width - 1; x >= 0; x--) scanOrder.push(rowData[x] ?? -1);
    } else {
      for (let x = 0; x < width; x++) scanOrder.push(rowData[x] ?? -1);
    }

    const segments: BeadWordSegment[] = [];
    let curIdx = scanOrder[0];
    let curCount = 0;

    const pushSeg = () => {
      if (curCount <= 0) return;
      const isEmpty = curIdx < 0 || !palette[curIdx];
      if (isEmpty) {
        segments.push({
          abbreviation: '-',
          colorName: 'Skip',
          hex: '#334155',
          count: curCount,
          isEmpty: true,
        });
      } else {
        const leg = legend[curIdx];
        segments.push({
          abbreviation: leg.abbreviation,
          colorName: leg.colorName,
          hex: leg.hex,
          count: curCount,
          isEmpty: false,
        });
      }
    };

    for (let i = 0; i < scanOrder.length; i++) {
      if (scanOrder[i] === curIdx) {
        curCount++;
      } else {
        pushSeg();
        curIdx = scanOrder[i];
        curCount = 1;
      }
    }
    pushSeg();

    const rowLabel =
      stitchStyle === 'peyote' && rowNumber === 1
        ? 'Row 1 & 2 (Base)'
        : `Row ${rowNumber}`;

    const tokens = segments.map((s) =>
      s.isEmpty ? `(${s.count})Skip` : `(${s.count})${s.abbreviation}`
    );
    const notationText = `${rowLabel} (${direction}): ${tokens.join(', ')}`;

    rows.push({
      rowLabel,
      rowNumber,
      direction,
      segments,
      notationText,
      totalBeads: width,
    });
  }

  return {
    stitchStyle,
    legend,
    rows,
    totalBeads,
  };
}

/**
 * Formats a complete Bead Word Chart as copy/downloadable plain text.
 */
export function formatBeadWordChartText(
  chart: BeadWordChart,
  projectName = 'Bead Weaving Pattern'
): string {
  const styleLabel =
    chart.stitchStyle === 'peyote'
      ? 'Even/Odd Count Peyote Stitch'
      : chart.stitchStyle === 'brick'
      ? 'Brick Stitch'
      : 'Square Bead Loom';

  const lines: string[] = [
    `${projectName.toUpperCase()} — BEAD WORD CHART`,
    `Stitch Method: ${styleLabel}`,
    `Total Beads: ${chart.totalBeads.toLocaleString()} | Total Rows: ${chart.rows.length}`,
    `==================================================`,
    ``,
    `COLOR KEY (Miyuki Delica 11/0 Equivalents):`,
  ];

  for (const item of chart.legend) {
    lines.push(
      `  ${item.abbreviation} = ${item.delicaCode} | ${item.colorName} (${item.hex}) — ${item.count} beads`
    );
  }

  lines.push(``);
  lines.push(`ROW-BY-ROW WORD CHART (Worked bottom to top):`);
  lines.push(`--------------------------------------------------`);
  for (const row of chart.rows) {
    lines.push(row.notationText);
  }

  return lines.join('\n');
}
