import { jsPDF } from 'jspdf';
import type { GridConfig, PaletteColor, CraftProject, CellProgress } from '../types/craft';
import { getContrastingTextColor } from './colorUtils';
import { getCraftDimensionsSummary } from './craftCalculator';
import { generateCrochetInstructions } from './crochetInstructions';
import { getAnchorEquivalent, getBeadEquivalents } from './threadEquivalents';

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
  filename = 'craft-pattern-grid.png'
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
  colorMode: 'color' | 'bw' = 'color'
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

  return canvas.toDataURL('image/png');
}

export interface PdfExportOptions {
  multiPage?: 'single' | '2x2';
  includeWritten?: boolean;
  colorMode?: 'color' | 'bw';
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

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text(projectName, margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  const totalCells = config.width * config.height;
  const sizeSummary = getCraftDimensionsSummary(config.width, config.height, config.craftType);
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

    const sliceDataUrl = renderGridSliceCanvas(gridData, palette, 0, config.width, 0, config.height, 18, options.colorMode || 'color');
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

    const quadrants = [
      { name: 'Top-Left (Part 1 of 4)', x0: 0, x1: midX, y0: 0, y1: midY, mapCol: 0, mapRow: 0 },
      { name: 'Top-Right (Part 2 of 4)', x0: midX, x1: config.width, y0: 0, y1: midY, mapCol: 1, mapRow: 0 },
      { name: 'Bottom-Left (Part 3 of 4)', x0: 0, x1: midX, y0: midY, y1: config.height, mapCol: 0, mapRow: 1 },
      { name: 'Bottom-Right (Part 4 of 4)', x0: midX, x1: config.width, y0: midY, y1: config.height, mapCol: 1, mapRow: 1 },
    ];

    quadrants.forEach((q) => {
      doc.addPage();

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(33, 37, 41);
      doc.text(`Chart: ${q.name}`, margin, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(108, 117, 125);
      doc.text(`Columns ${q.x0 + 1}–${q.x1} • Rows ${q.y0 + 1}–${q.y1}`, margin, 24);

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

      const sliceDataUrl = renderGridSliceCanvas(gridData, palette, q.x0, q.x1, q.y0, q.y1, 22, options.colorMode || 'color');
      if (sliceDataUrl) {
        const availableWidth = pageWidth - margin * 2;
        const availableHeight = pageHeight - 35 - margin;
        const qW = q.x1 - q.x0;
        const qH = q.y1 - q.y0;
        const aspect = qW / qH;

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

// Project JSON Save & Load
export function saveProjectJSON(
  name: string,
  gridConfig: GridConfig,
  gridData: number[][],
  palette: PaletteColor[],
  completedCells: CellProgress
) {
  const project: CraftProject = {
    version: '1.0',
    name,
    createdAt: new Date().toISOString(),
    gridConfig,
    gridData,
    palette,
    completedCells,
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
