import { jsPDF } from 'jspdf';
import type { GridConfig, PaletteColor, CraftProject, CellProgress, BackstitchLine } from '../types/craft';
import { getContrastingTextColor } from './colorUtils';
import { getCraftDimensionsSummary, estimateDmcSkeins } from './craftCalculator';
import { generateCrochetInstructions } from './crochetInstructions';
import { getAnchorEquivalent, getBeadEquivalents, extractDmcNumber } from './threadEquivalents';
import { getPatternKeeperSymbol } from './symbols';

/**
 * Shared helper to draw backstitch lines onto a 2D canvas slice with white casing halo.
 */
function drawBackstitchLinesOnCanvas(
  ctx: CanvasRenderingContext2D,
  backstitches: BackstitchLine[],
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  rulerSize: number,
  cellSize: number,
  forceBlack = false
) {
  if (!backstitches || backstitches.length === 0) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rulerSize, rulerSize, (endX - startX) * cellSize, (endY - startY) * cellSize);
  ctx.clip();
  ctx.lineCap = 'round';

  for (const line of backstitches) {
    const px1 = rulerSize + (line.x1 - startX) * cellSize;
    const py1 = rulerSize + (line.y1 - startY) * cellSize;
    const px2 = rulerSize + (line.x2 - startX) * cellSize;
    const py2 = rulerSize + (line.y2 - startY) * cellSize;

    // White halo for legibility over dark stitches
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(3, cellSize * 0.22);
    ctx.beginPath();
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();

    // Inner backstitch thread line
    ctx.strokeStyle = forceBlack ? '#000000' : line.colorHex;
    ctx.lineWidth = Math.max(1.8, cellSize * 0.13);
    ctx.beginPath();
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renders a clean full-color square preview PNG of the finished pattern for the booklet cover.
 */
function renderCoverPreviewDataUrl(gridData: number[][], palette: PaletteColor[]): string {
  const height = gridData.length;
  const width = height > 0 ? gridData[0].length : 0;
  if (width === 0 || height === 0) return '';

  const scale = Math.max(4, Math.min(16, Math.floor(480 / Math.max(width, height))));
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = gridData[y][x];
      const color = idx >= 0 ? palette[idx] : undefined;
      ctx.fillStyle = color ? color.hex : '#f8fafc';
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  return canvas.toDataURL('image/png');
}

// Export crisp, pixelated PNG (scale factor like 16x per pixel)
export function exportPixelArtPNG(
  gridData: number[][],
  palette: PaletteColor[],
  scale = 16,
  filename = 'pixel-art-grid.png'
) {
  const height = gridData.length;
  const width = height > 0 ? gridData[0].length : 0;
  if (width === 0 || height === 0) return;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const colorIdx = gridData[y][x];
      const color = palette[colorIdx];
      ctx.fillStyle = color ? color.hex : '#ffffff';
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Export high resolution Printable Chart PNG (with 10x10 lines and symbols)
export function exportPrintableGridPNG(
  gridData: number[][],
  palette: PaletteColor[],
  cellSize = 24,
  filename = 'craft-pattern-grid.png',
  backstitches: BackstitchLine[] = []
) {
  const height = gridData.length;
  const width = height > 0 ? gridData[0].length : 0;
  if (width === 0 || height === 0) return;

  const rulerSize = 30;
  const canvasWidth = width * cellSize + rulerSize;
  const canvasHeight = height * cellSize + rulerSize;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Rulers background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, canvasWidth, rulerSize);
  ctx.fillRect(0, 0, rulerSize, canvasHeight);

  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#4b5563';

  // Top ruler (columns)
  for (let x = 0; x < width; x++) {
    if ((x + 1) % 10 === 0 || x === 0) {
      ctx.fillText(`${x + 1}`, rulerSize + x * cellSize + cellSize / 2, rulerSize / 2);
    }
  }

  // Left ruler (rows)
  for (let y = 0; y < height; y++) {
    if ((y + 1) % 10 === 0 || y === 0) {
      ctx.fillText(`${y + 1}`, rulerSize / 2, rulerSize + y * cellSize + cellSize / 2);
    }
  }

  // Draw cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const colorIdx = gridData[y][x];
      const color = palette[colorIdx];
      const px = rulerSize + x * cellSize;
      const py = rulerSize + y * cellSize;

      ctx.fillStyle = color ? color.hex : '#ffffff';
      ctx.fillRect(px, py, cellSize, cellSize);

      // Symbol
      if (color) {
        ctx.fillStyle = getContrastingTextColor(color.r, color.g, color.b);
        ctx.font = `bold ${Math.floor(cellSize * 0.55)}px sans-serif`;
        ctx.fillText(color.symbol, px + cellSize / 2, py + cellSize / 2 + 1);
      }

      // 1px cell grid line
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, cellSize, cellSize);
    }
  }

  // 10x10 Bold grid lines
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  for (let x = 0; x <= width; x += 10) {
    const px = rulerSize + x * cellSize;
    ctx.beginPath();
    ctx.moveTo(px, rulerSize);
    ctx.lineTo(px, canvasHeight);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 10) {
    const py = rulerSize + y * cellSize;
    ctx.beginPath();
    ctx.moveTo(rulerSize, py);
    ctx.lineTo(canvasWidth, py);
    ctx.stroke();
  }

  drawBackstitchLinesOnCanvas(ctx, backstitches, 0, width, 0, height, rulerSize, cellSize, false);

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Renders a high-resolution grid slice with rulers and coordinates for PDF pages
 */
function renderGridSliceCanvas(
  gridData: number[][],
  palette: PaletteColor[],
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  renderCellSize = 22,
  colorMode: 'color' | 'bw' = 'color',
  backstitches: BackstitchLine[] = [],
  overlapBounds?: { origX0: number; origX1: number; origY0: number; origY1: number }
): string {
  const sliceW = endX - startX;
  const sliceH = endY - startY;
  const rulerSize = 24;
  const canvasW = sliceW * renderCellSize + rulerSize;
  const canvasH = sliceH * renderCellSize + rulerSize;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Rulers bg
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, canvasW, rulerSize);
  ctx.fillRect(0, 0, rulerSize, canvasH);

  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#4b5563';

  // Columns ruler
  for (let x = startX; x < endX; x++) {
    const colNum = x + 1;
    if (colNum % 5 === 0 || x === startX || x === endX - 1) {
      const rx = rulerSize + (x - startX) * renderCellSize + renderCellSize / 2;
      ctx.fillText(`${colNum}`, rx, rulerSize / 2);
    }
  }

  // Rows ruler
  for (let y = startY; y < endY; y++) {
    const rowNum = y + 1;
    if (rowNum % 5 === 0 || y === startY || y === endY - 1) {
      const ry = rulerSize + (y - startY) * renderCellSize + renderCellSize / 2;
      ctx.fillText(`${rowNum}`, rulerSize / 2, ry);
    }
  }

  // Draw cells
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const cIdx = gridData[y]?.[x] ?? 0;
      const color = palette[cIdx];
      const px = rulerSize + (x - startX) * renderCellSize;
      const py = rulerSize + (y - startY) * renderCellSize;

      // Fill cell
      if (colorMode === 'bw') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px, py, renderCellSize, renderCellSize);
        if (color) {
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${Math.floor(renderCellSize * 0.65)}px sans-serif`;
          ctx.fillText(color.symbol, px + renderCellSize / 2, py + renderCellSize / 2 + 1);
        }
      } else {
        ctx.fillStyle = color ? color.hex : '#ffffff';
        ctx.fillRect(px, py, renderCellSize, renderCellSize);
        if (color) {
          ctx.fillStyle = getContrastingTextColor(color.r, color.g, color.b);
          ctx.font = `bold ${Math.floor(renderCellSize * 0.62)}px sans-serif`;
          ctx.fillText(color.symbol, px + renderCellSize / 2, py + renderCellSize / 2 + 1);
        }
      }

      if (overlapBounds) {
        const isOverlapCell =
          x < overlapBounds.origX0 ||
          x >= overlapBounds.origX1 ||
          y < overlapBounds.origY0 ||
          y >= overlapBounds.origY1;
        if (isOverlapCell) {
          ctx.fillStyle = 'rgba(100, 116, 139, 0.28)';
          ctx.fillRect(px, py, renderCellSize, renderCellSize);
        }
      }

      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, renderCellSize, renderCellSize);
    }
  }

  // 10x10 Bold Lines
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2.5;
  for (let x = startX; x <= endX; x++) {
    if (x % 10 === 0) {
      const px = rulerSize + (x - startX) * renderCellSize;
      ctx.beginPath();
      ctx.moveTo(px, rulerSize);
      ctx.lineTo(px, canvasH);
      ctx.stroke();
    }
  }
  for (let y = startY; y <= endY; y++) {
    if (y % 10 === 0) {
      const py = rulerSize + (y - startY) * renderCellSize;
      ctx.beginPath();
      ctx.moveTo(rulerSize, py);
      ctx.lineTo(canvasW, py);
      ctx.stroke();
    }
  }

  drawBackstitchLinesOnCanvas(
    ctx,
    backstitches,
    startX,
    endX,
    startY,
    endY,
    rulerSize,
    renderCellSize,
    colorMode === 'bw'
  );

  return canvas.toDataURL('image/png');
}

export interface PdfExportOptions {
  multiPage?: 'single' | '2x2';
  includeWritten?: boolean;
  colorMode?: 'color' | 'bw';
  includeCoverPage?: boolean;
  designerName?: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  patternNotes?: string;
  showOverlapMargins?: boolean;
  backstitches?: BackstitchLine[];
}

// Generate complete PDF Pattern Document with jsPDF
export function generatePatternPDF(
  gridData: number[][],
  palette: PaletteColor[],
  config: GridConfig,
  projectName = 'Pixel Craft Pattern',
  options: PdfExportOptions = { multiPage: 'single', includeWritten: false, colorMode: 'color' }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const totalCells = config.width * config.height;
  const sizeSummary = getCraftDimensionsSummary(
    config.width,
    config.height,
    config.craftType,
    14,
    config.crochetGauge,
    config.knitGauge,
    config.beadLoom,
    config.unitSystem
  );
  const backstitches = options.backstitches || [];

  // Optional Commercial / Etsy Pattern Booklet Cover Page (Page 1)
  if (options.includeCoverPage) {
    // Top Accent Header Banner
    doc.setFillColor(79, 70, 229);
    doc.rect(margin, 14, pageWidth - margin * 2, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    const levelLabel = (options.skillLevel || 'Intermediate').toUpperCase();
    doc.text(`OFFICIAL CRAFT PATTERN BOOKLET  •  SKILL LEVEL: ${levelLabel}`, margin + 4, 20.5);

    // Pattern Title & Designer Attribution
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39);
    doc.text(projectName, margin, 36);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99);
    doc.text(`Designed by ${options.designerName?.trim() || 'Independent Craft Designer'}`, margin, 43);

    // Full-Color Mockup Preview Frame
    const frameX = margin;
    const frameY = 52;
    const frameW = pageWidth - margin * 2;
    const frameH = 100;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(frameX, frameY, frameW, frameH, 'FD');

    const previewDataUrl = renderCoverPreviewDataUrl(gridData, palette);
    if (previewDataUrl) {
      const innerPad = 6;
      const maxImgW = frameW - innerPad * 2;
      const maxImgH = frameH - innerPad * 2;
      const aspect = config.width / Math.max(1, config.height);
      let drawW = maxImgW;
      let drawH = drawW / aspect;
      if (drawH > maxImgH) {
        drawH = maxImgH;
        drawW = drawH * aspect;
      }
      const imgX = frameX + (frameW - drawW) / 2;
      const imgY = frameY + (frameH - drawH) / 2;
      doc.addImage(previewDataUrl, 'PNG', imgX, imgY, drawW, drawH);
    }

    // Pattern Specifications Box
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(209, 213, 219);
    doc.rect(margin, 160, pageWidth - margin * 2, 35, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text('Pattern Specifications', margin + 4, 167);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(55, 65, 81);
    doc.text(`• Craft Discipline: ${config.craftType.toUpperCase()}`, margin + 4, 174);
    doc.text(`• Stitch / Bead Grid: ${config.width} × ${config.height} (${totalCells.toLocaleString()} total)`, margin + 4, 180);
    doc.text(`• Palette Shades: ${palette.length} colors${backstitches.length > 0 ? ` (+ ${backstitches.length} backstitch lines)` : ''}`, margin + 4, 186);
    const wrappedSize = doc.splitTextToSize(`• Finished Size: ${sizeSummary}`, pageWidth - margin * 2 - 8);
    doc.text(wrappedSize[0] || '', margin + 4, 192);

    // Designer Notes & Stitching Instructions Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(209, 213, 219);
    doc.rect(margin, 202, pageWidth - margin * 2, 63, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text('Designer Notes & Instructions', margin + 4, 210);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(75, 85, 99);
    const defaultNotes =
      'Start stitching from the center of your fabric/canvas outward. Each square on the chart corresponds to one full stitch or bead. Check off your completed colors using the material shopping key on the following page.';
    const notesText = options.patternNotes?.trim() ? options.patternNotes.trim() : defaultNotes;
    const wrappedNotes = doc.splitTextToSize(notesText, pageWidth - margin * 2 - 8);
    doc.text(wrappedNotes.slice(0, 9), margin + 4, 217);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated with Pixel Craft Studio • www.pixel-craft-studio.com', margin, 282);

    doc.addPage();
  }

  // Header Title (Page 1 if no cover page, or Page 2 Color Key)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text(projectName, margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  const subtitle = `Craft: ${config.craftType.toUpperCase()} | Grid: ${config.width} x ${config.height} (${totalCells} cells) | Size: ${sizeSummary}`;
  doc.text(subtitle, margin, 26);

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 30, pageWidth - margin, 30);

  // Palette Legend Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(33, 37, 41);
  doc.text('Color Key & Material Shopping List', margin, 38);

  let startY = 44;
  const colWidths = [12, 16, 40, 52, 25, 20];
  const headers = ['Sym', 'Color', 'Code / Equiv', 'Color Name', 'Count', '%'];

  // Table header
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, startY, pageWidth - margin * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);

  let curX = margin;
  headers.forEach((h, i) => {
    doc.text(h, curX + 2, startY + 5);
    curX += colWidths[i];
  });

  startY += 7;

  // Rows
  palette.forEach((color, i) => {
    if (startY > pageHeight - 30) {
      doc.addPage();
      startY = 20;
    }

    const rowY = startY;
    if (i % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, rowY, pageWidth - margin * 2, 6.5, 'F');
    }

    let x = margin;

    // Symbol
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(33, 37, 41);
    doc.text(color.symbol, x + 4, rowY + 4.8);
    x += colWidths[0];

    // Swatch box
    if (options.colorMode === 'bw') {
      doc.setFillColor(255, 255, 255);
      doc.rect(x + 2, rowY + 1.2, 10, 4, 'F');
      doc.setDrawColor(40, 40, 40);
      doc.rect(x + 2, rowY + 1.2, 10, 4, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(color.symbol, x + 6, rowY + 4.2);
    } else {
      doc.setFillColor(color.r, color.g, color.b);
      doc.rect(x + 2, rowY + 1.2, 10, 4, 'F');
      doc.setDrawColor(180, 180, 180);
      doc.rect(x + 2, rowY + 1.2, 10, 4, 'S');
    }
    x += colWidths[1];

    // Code & Equivalents
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    const anchorEquiv = getAnchorEquivalent(color.code);
    const beadEquiv = getBeadEquivalents(color.code);
    let codeStr = color.code || color.hex;
    if (config.craftType !== 'perler' && anchorEquiv) {
      codeStr = `${color.code} (Anch ${anchorEquiv.code})`;
    } else if (config.craftType === 'perler' && beadEquiv) {
      codeStr = `${color.code} (${beadEquiv.artkal}/${beadEquiv.hama})`;
    }
    doc.text(codeStr, x + 2, rowY + 4.5);
    x += colWidths[2];

    // Name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text(color.name || 'Custom Color', x + 2, rowY + 4.5);
    x += colWidths[3];

    // Count
    doc.setFont('helvetica', 'bold');
    doc.text(`${color.count}`, x + 2, rowY + 4.5);
    x += colWidths[4];

    // %
    doc.setFont('helvetica', 'normal');
    doc.text(`${color.percentage}%`, x + 2, rowY + 4.5);

    startY += 6.5;
  });

  // Render Pattern Grid
  const isMultiPage = options.multiPage === '2x2';

  if (!isMultiPage) {
    // Single page chart
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text('Craft Symbol Chart', margin, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(108, 117, 125);
    doc.text('Each square corresponds to 1 bead, cross-stitch, or stitch. Bold lines every 10 squares.', margin, 24);

    const sliceDataUrl = renderGridSliceCanvas(
      gridData,
      palette,
      0,
      config.width,
      0,
      config.height,
      18,
      options.colorMode || 'color',
      backstitches
    );
    if (sliceDataUrl) {
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - 35 - margin;
      const aspect = config.width / config.height;

      let drawW = availableWidth;
      let drawH = drawW / aspect;
      if (drawH > availableHeight) {
        drawH = availableHeight;
        drawW = drawH * aspect;
      }

      const drawX = margin + (availableWidth - drawW) / 2;
      doc.addImage(sliceDataUrl, 'PNG', drawX, 30, drawW, drawH);
    }
  } else {
    // 2x2 Multi-Page Poster Split (4 Pages)
    const midX = Math.ceil(config.width / 2);
    const midY = Math.ceil(config.height / 2);
    const overlap = options.showOverlapMargins ? 3 : 0;

    const quadrants = [
      { name: 'Top-Left (Part 1 of 4)', x0: 0, x1: midX, y0: 0, y1: midY, mapCol: 0, mapRow: 0 },
      { name: 'Top-Right (Part 2 of 4)', x0: midX, x1: config.width, y0: 0, y1: midY, mapCol: 1, mapRow: 0 },
      { name: 'Bottom-Left (Part 3 of 4)', x0: 0, x1: midX, y0: midY, y1: config.height, mapCol: 0, mapRow: 1 },
      { name: 'Bottom-Right (Part 4 of 4)', x0: midX, x1: config.width, y0: midY, y1: config.height, mapCol: 1, mapRow: 1 },
    ];

    quadrants.forEach((q) => {
      doc.addPage();

      const drawX0 = q.x0 > 0 ? Math.max(0, q.x0 - overlap) : 0;
      const drawX1 = q.x1 < config.width ? Math.min(config.width, q.x1 + overlap) : q.x1;
      const drawY0 = q.y0 > 0 ? Math.max(0, q.y0 - overlap) : 0;
      const drawY1 = q.y1 < config.height ? Math.min(config.height, q.y1 + overlap) : q.y1;

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(33, 37, 41);
      doc.text(`Chart: ${q.name}`, margin, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(108, 117, 125);
      const overlapNote = overlap > 0 ? ` (includes shaded ${overlap}-stitch overlap)` : '';
      doc.text(`Columns ${q.x0 + 1}–${q.x1} • Rows ${q.y0 + 1}–${q.y1}${overlapNote}`, margin, 24);

      // Mini page map indicator in top-right
      const mapX = pageWidth - margin - 22;
      const mapY = 12;
      doc.setDrawColor(180, 180, 180);
      doc.rect(mapX, mapY, 20, 14);
      doc.line(mapX + 10, mapY, mapX + 10, mapY + 14);
      doc.line(mapX, mapY + 7, mapX + 20, mapY + 7);

      // Highlight active quadrant
      doc.setFillColor(99, 102, 241);
      doc.rect(mapX + q.mapCol * 10, mapY + q.mapRow * 7, 10, 7, 'F');

      const sliceDataUrl = renderGridSliceCanvas(
        gridData,
        palette,
        drawX0,
        drawX1,
        drawY0,
        drawY1,
        22,
        options.colorMode || 'color',
        backstitches,
        overlap > 0 ? { origX0: q.x0, origX1: q.x1, origY0: q.y0, origY1: q.y1 } : undefined
      );
      if (sliceDataUrl) {
        const availableWidth = pageWidth - margin * 2;
        const availableHeight = pageHeight - 35 - margin;
        const qW = drawX1 - drawX0;
        const qH = drawY1 - drawY0;
        const aspect = qW / Math.max(1, qH);

        let drawW = availableWidth;
        let drawH = drawW / aspect;
        if (drawH > availableHeight) {
          drawH = availableHeight;
          drawW = drawH * aspect;
        }

        const drawX = margin + (availableWidth - drawW) / 2;
        doc.addImage(sliceDataUrl, 'PNG', drawX, 30, drawW, drawH);
      }
    });
  }

  // Optional: Append Written Crochet Instructions
  if (options.includeWritten) {
    const instructions = generateCrochetInstructions(gridData, palette);
    doc.addPage();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(33, 37, 41);
    doc.text('Written Row-by-Row Crochet Instructions', margin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(108, 117, 125);
    doc.text(`Tapestry Crochet • Total ${instructions.totalRows} Rows (Worked bottom to top, alternating turns)`, margin, 26);
    doc.line(margin, 30, pageWidth - margin, 30);

    let textY = 38;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);

    instructions.rows.forEach((row) => {
      if (textY > pageHeight - 20) {
        doc.addPage();
        textY = 20;
      }
      doc.text(row.fullText, margin, textY);
      textY += 5.5;
    });
  }

  doc.save(`${projectName.toLowerCase().replace(/\s+/g, '-')}-chart.pdf`);
}

export interface PatternKeeperPdfOptions {
  colorMode?: 'color' | 'bw';
  designerName?: string;
  backstitches?: BackstitchLine[];
  returnBlob?: boolean;
}

/**
 * Generates a single-page true vector symbol chart PDF + machine-parseable floss legend table
 * optimized for Pattern Keeper & Markup R-XP digital chart import apps.
 */
export function generatePatternKeeperPDF(
  gridData: number[][],
  palette: PaletteColor[],
  config: GridConfig,
  projectName = 'Pixel Craft Pattern',
  options: PatternKeeperPdfOptions = {}
): Blob | void {
  const colorMode = options.colorMode || 'color';
  const backstitches = options.backstitches || [];
  const gridWidth = config.width;
  const gridHeight = config.height;

  const cellMm =
    gridWidth > 100 || gridHeight > 100
      ? 2.8
      : gridWidth > 60 || gridHeight > 60
      ? 3.5
      : 4.2;

  const rulerPad = 10;
  const margin = 14;
  const headerPad = 24;
  const gridWmm = gridWidth * cellMm;
  const gridHmm = gridHeight * cellMm;

  const pageW = Math.max(210, gridWmm + margin * 2 + rulerPad * 2);
  const pageH = Math.max(297, gridHmm + margin * 2 + headerPad + rulerPad);

  const doc = new jsPDF({
    orientation: pageW > pageH ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageW, pageH],
  });

  // Page 1 Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(17, 24, 39);
  doc.text(projectName, margin, margin + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${gridWidth}w × ${gridHeight}h • ${palette.length} Colors • Digital Vector Chart (Pattern Keeper & Markup R-XP Compatible)`,
    margin,
    margin + 11
  );

  const originX = (pageW - gridWmm) / 2;
  const originY = margin + headerPad;
  const symFontSize = Math.max(5.2, cellMm * 2.1);

  // Render Vector Stitches (skip empty/negative indices)
  doc.setFont('courier', 'bold');
  doc.setFontSize(symFontSize);

  for (let y = 0; y < gridHeight; y++) {
    const row = gridData[y];
    if (!row) continue;
    for (let x = 0; x < gridWidth; x++) {
      const cellIdx = row[x];
      if (cellIdx < 0 || !palette[cellIdx]) continue;
      const color = palette[cellIdx];
      const cellX = originX + x * cellMm;
      const cellY = originY + y * cellMm;
      const sym = getPatternKeeperSymbol(cellIdx);

      if (colorMode === 'color') {
        doc.setFillColor(color.r, color.g, color.b);
        doc.rect(cellX, cellY, cellMm, cellMm, 'F');
        const lum = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
        if (lum > 0.55) {
          doc.setTextColor(20, 20, 20);
        } else {
          doc.setTextColor(255, 255, 255);
        }
      } else {
        doc.setTextColor(15, 23, 42);
      }

      doc.text(sym, cellX + cellMm / 2, cellY + cellMm / 2, {
        align: 'center',
        baseline: 'middle',
      });
    }
  }

  // Vector Minor Grid Lines
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.12);
  for (let x = 0; x <= gridWidth; x++) {
    if (x % 10 === 0) continue;
    const lx = originX + x * cellMm;
    doc.line(lx, originY, lx, originY + gridHmm);
  }
  for (let y = 0; y <= gridHeight; y++) {
    if (y % 10 === 0) continue;
    const ly = originY + y * cellMm;
    doc.line(originX, ly, originX + gridWmm, ly);
  }

  // Vector Major 10x10 Grid Lines
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.45);
  for (let x = 10; x < gridWidth; x += 10) {
    const lx = originX + x * cellMm;
    doc.line(lx, originY, lx, originY + gridHmm);
  }
  for (let y = 10; y < gridHeight; y += 10) {
    const ly = originY + y * cellMm;
    doc.line(originX, ly, originX + gridWmm, ly);
  }

  // Outer Frame Border
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.65);
  doc.rect(originX, originY, gridWmm, gridHmm, 'S');

  // Column & Row Ruler Coordinates (every 10 stitches)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  for (let x = 0; x <= gridWidth; x += 10) {
    const lx = originX + x * cellMm;
    doc.text(`${x}`, lx, originY - 2, { align: 'center' });
  }
  for (let y = 0; y <= gridHeight; y += 10) {
    const ly = originY + y * cellMm;
    doc.text(`${y}`, originX - 2, ly + 0.8, { align: 'right' });
  }

  // Vector Center Midpoint Triangles on All 4 Edges
  const midX = originX + gridWmm / 2;
  const midY = originY + gridHmm / 2;
  doc.setFillColor(225, 29, 72);
  doc.triangle(midX - 1.5, originY - 1.2, midX + 1.5, originY - 1.2, midX, originY, 'F');
  doc.triangle(midX - 1.5, originY + gridHmm + 1.2, midX + 1.5, originY + gridHmm + 1.2, midX, originY + gridHmm, 'F');
  doc.triangle(originX - 1.2, midY - 1.5, originX - 1.2, midY + 1.5, originX, midY, 'F');
  doc.triangle(originX + gridWmm + 1.2, midY - 1.5, originX + gridWmm + 1.2, midY + 1.5, originX + gridWmm, midY, 'F');

  // Optional Vector Backstitch Lines
  if (backstitches.length > 0) {
    doc.setLineWidth(0.55);
    for (const line of backstitches) {
      const hex = (line.colorHex || '#111827').replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 17;
      const g = parseInt(hex.substring(2, 4), 16) || 24;
      const b = parseInt(hex.substring(4, 6), 16) || 39;
      doc.setDrawColor(r, g, b);
      doc.line(
        originX + line.x1 * cellMm,
        originY + line.y1 * cellMm,
        originX + line.x2 * cellMm,
        originY + line.y2 * cellMm
      );
    }
  }

  // Page 2+: Machine-Parseable Floss Key & DMC Color Legend (A4 Portrait)
  doc.addPage('a4', 'portrait');
  const a4W = 210;
  const a4Margin = 15;
  const totalStitches = palette.reduce((sum, c) => sum + c.count, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text('Floss Key & DMC Color Legend', a4Margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(75, 85, 99);
  doc.text(
    `Pattern: ${projectName}   |   Grid: ${gridWidth} x ${gridHeight}   |   Stitches: ${totalStitches.toLocaleString()}   |   Designer: ${options.designerName?.trim() || 'Pixel Craft Studio'}`,
    a4Margin,
    27
  );

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(a4Margin, 31, a4W - a4Margin, 31);

  const colWidths = [16, 16, 20, 32, 56, 22, 18]; // Sum = 180mm (matches 210 - 30)
  const headers = ['Sym', 'Color', 'Brand', 'Code', 'Shade Name', 'Stitches', 'Skeins'];

  const renderLegendHeader = (yPos: number): number => {
    doc.setFillColor(241, 245, 249);
    doc.rect(a4Margin, yPos, 180, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    let cx = a4Margin;
    headers.forEach((h, i) => {
      doc.text(h, cx + 2, yPos + 5.5);
      cx += colWidths[i];
    });
    return yPos + 10;
  };

  let curY = renderLegendHeader(36);

  palette.forEach((color, idx) => {
    if (curY > 278) {
      doc.addPage('a4', 'portrait');
      curY = renderLegendHeader(20);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(a4Margin, curY, 180, 7, 'F');
    }

    let cx = a4Margin;
    const sym = getPatternKeeperSymbol(idx);

    // Sym
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(sym, cx + 5, curY + 5);
    cx += colWidths[0];

    // Swatch
    doc.setFillColor(color.r, color.g, color.b);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.2);
    doc.rect(cx + 2, curY + 1.5, 10, 4, 'FD');
    cx += colWidths[1];

    // Brand
    const brandStr =
      color.brand ||
      (config.craftType === 'perler' ? 'Perler' : config.craftStandard === 'dmc' ? 'DMC' : 'DMC');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(brandStr, cx + 2, curY + 5);
    cx += colWidths[2];

    // Clean Code (e.g. "310" for DMC 310)
    const cleanCode = extractDmcNumber(color.code) || color.code || color.hex;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(cleanCode, cx + 2, curY + 5);
    cx += colWidths[3];

    // Shade Name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text((color.name || 'Custom Color').slice(0, 32), cx + 2, curY + 5);
    cx += colWidths[4];

    // Stitches
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`${color.count}`, cx + 2, curY + 5);
    cx += colWidths[5];

    // Skeins
    const skeins = Math.max(1, estimateDmcSkeins(color.count).skeinsToBuy);
    doc.setFont('helvetica', 'normal');
    doc.text(`${skeins}`, cx + 2, curY + 5);

    curY += 7;
  });

  if (options.returnBlob) {
    return doc.output('blob');
  }

  doc.save(`${projectName.toLowerCase().replace(/\s+/g, '-')}-pattern-keeper.pdf`);
}

// Project JSON Save & Load
export function saveProjectJSON(
  name: string,
  gridConfig: GridConfig,
  gridData: number[][],
  palette: PaletteColor[],
  completedCells: CellProgress,
  backstitches?: BackstitchLine[]
) {
  const project: CraftProject = {
    version: '1.0',
    name,
    createdAt: new Date().toISOString(),
    gridConfig,
    gridData,
    palette,
    completedCells,
    backstitches: backstitches && backstitches.length > 0 ? backstitches : undefined,
  };

  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.toLowerCase().replace(/\s+/g, '-')}-project.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generates a printable PDF sheet of cut-out Floss Bobbin Labels / Bead Organizer Drops
 */
export function exportBobbinLabelsPDF(
  palette: PaletteColor[],
  projectName = 'Floss Bobbin Labels',
  craftType = 'cross-stitch'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const marginX = 14;
  const marginY = 22;

  const cardW = 43;
  const cardH = 39;
  const gapX = 3;
  const gapY = 4;
  const cols = 4;
  const rows = 6;
  const cardsPerPage = cols * rows; // 24

  let cardIndex = 0;

  const drawPageHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(33, 37, 41);
    doc.text(`${projectName} — Floss Bobbin Labels & Swatch Tags`, marginX, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(108, 117, 125);
    doc.text('Cut along dashed lines to slot or tape onto standard plastic floss bobbins & organizer boxes', marginX, 16);
  };

  drawPageHeader();

  palette.forEach((color, i) => {
    if (i > 0 && i % cardsPerPage === 0) {
      doc.addPage();
      drawPageHeader();
      cardIndex = 0;
    }

    const col = cardIndex % cols;
    const row = Math.floor(cardIndex / cols);

    const x = marginX + col * (cardW + gapX);
    const y = marginY + row * (cardH + gapY);

    // Dashed cut outline
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([2, 1], 0);
    doc.rect(x, y, cardW, cardH, 'S');

    // Solid border for content box
    doc.setLineDashPattern([], 0);

    // Top color swatch bar
    doc.setFillColor(color.r, color.g, color.b);
    doc.rect(x + 1.5, y + 1.5, cardW - 3, 7, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(x + 1.5, y + 1.5, cardW - 3, 7, 'S');

    // Craft Symbol in swatch bar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const textColor = getContrastingTextColor(color.r, color.g, color.b);
    const rgbText = textColor === '#000000' ? 0 : 255;
    doc.setTextColor(rgbText, rgbText, rgbText);
    doc.text(color.symbol, x + 3.5, y + 6.2);

    // Main shade code
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(17, 24, 39);
    const anchor = getAnchorEquivalent(color.code);
    const bead = getBeadEquivalents(color.code);

    const mainCode = color.code || color.hex;
    doc.text(mainCode, x + 3, y + 14);

    // Anchor or Bead equivalent
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    if (craftType !== 'perler' && anchor) {
      doc.text(`Anch: ${anchor.code}`, x + 3, y + 18);
    } else if (craftType === 'perler' && bead) {
      doc.text(`Artkal ${bead.artkal} • Hama ${bead.hama}`, x + 3, y + 18);
    }

    // Color name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    const rawName = color.name || 'Custom Color';
    const truncatedName = rawName.length > 20 ? rawName.substring(0, 18) + '..' : rawName;
    doc.text(truncatedName, x + 3, y + 23);

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(x + 2, y + 26, x + cardW - 2, y + 26);

    // Stitches count & skeins
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`${color.count} sts`, x + 3, y + 32);

    // Skein estimate
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const skeinText = craftType === 'perler'
      ? `${Math.max(1, Math.ceil(color.count / 1000))} pk`
      : `${color.count > 1800 ? `${(color.count / 1800).toFixed(1)} sk` : '1 sk'}`;
    doc.text(skeinText, x + cardW - 12, y + 32);

    cardIndex++;
  });

  doc.save(`${projectName.toLowerCase().replace(/\s+/g, '-')}-bobbin-labels.pdf`);
}
