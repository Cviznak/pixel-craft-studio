import { jsPDF } from 'jspdf';
import type { GridConfig, PaletteColor, CraftProject, CellProgress } from '../types/craft';
import { getContrastingTextColor } from './colorUtils';
import { getCraftDimensionsSummary } from './craftCalculator';

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

  // Cells & Symbols
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

// Generate complete PDF Pattern Document with jsPDF
export function generatePatternPDF(
  gridData: number[][],
  palette: PaletteColor[],
  config: GridConfig,
  projectName = 'Pixel Craft Pattern'
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
  const colWidths = [12, 16, 32, 60, 25, 20];
  const headers = ['Sym', 'Color', 'Code', 'Color Name', 'Count', '%'];

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
    doc.setFillColor(color.r, color.g, color.b);
    doc.rect(x + 2, rowY + 1.2, 10, 4, 'F');
    doc.setDrawColor(180, 180, 180);
    doc.rect(x + 2, rowY + 1.2, 10, 4, 'S');
    x += colWidths[1];

    // Code
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    doc.text(color.code || color.hex, x + 2, rowY + 4.5);
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

  // Second page or section: Grid Pattern
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(33, 37, 41);
  doc.text('Craft Symbol Chart', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(108, 117, 125);
  doc.text('Each square corresponds to 1 bead, cross-stitch, or drill. Bold lines every 10 squares.', margin, 24);

  // Render high-res grid image to embed in PDF
  const renderCellSize = 18;
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = config.width * renderCellSize;
  tempCanvas.height = config.height * renderCellSize;
  const tempCtx = tempCanvas.getContext('2d');

  if (tempCtx) {
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cIdx = gridData[y]?.[x] ?? 0;
        const color = palette[cIdx];
        tempCtx.fillStyle = color ? color.hex : '#ffffff';
        tempCtx.fillRect(x * renderCellSize, y * renderCellSize, renderCellSize, renderCellSize);

        // Symbol
        if (color) {
          tempCtx.fillStyle = getContrastingTextColor(color.r, color.g, color.b);
          tempCtx.font = `bold ${Math.floor(renderCellSize * 0.65)}px sans-serif`;
          tempCtx.textAlign = 'center';
          tempCtx.textBaseline = 'middle';
          tempCtx.fillText(
            color.symbol,
            x * renderCellSize + renderCellSize / 2,
            y * renderCellSize + renderCellSize / 2 + 1
          );
        }

        // Cell boundary
        tempCtx.strokeStyle = '#cccccc';
        tempCtx.lineWidth = 1;
        tempCtx.strokeRect(x * renderCellSize, y * renderCellSize, renderCellSize, renderCellSize);
      }
    }

    // 10x10 lines
    tempCtx.strokeStyle = '#111827';
    tempCtx.lineWidth = 2;
    for (let x = 0; x <= config.width; x += 10) {
      tempCtx.beginPath();
      tempCtx.moveTo(x * renderCellSize, 0);
      tempCtx.lineTo(x * renderCellSize, config.height * renderCellSize);
      tempCtx.stroke();
    }
    for (let y = 0; y <= config.height; y += 10) {
      tempCtx.beginPath();
      tempCtx.moveTo(0, y * renderCellSize);
      tempCtx.lineTo(config.width * renderCellSize, y * renderCellSize);
      tempCtx.stroke();
    }

    const imgData = tempCanvas.toDataURL('image/png');
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - 35 - margin;
    const aspect = (config.width * renderCellSize) / (config.height * renderCellSize);

    let drawW = availableWidth;
    let drawH = drawW / aspect;
    if (drawH > availableHeight) {
      drawH = availableHeight;
      drawW = drawH * aspect;
    }

    const drawX = margin + (availableWidth - drawW) / 2;
    doc.addImage(imgData, 'PNG', drawX, 30, drawW, drawH);
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
