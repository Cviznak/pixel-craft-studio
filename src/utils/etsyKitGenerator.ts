import JSZip from 'jszip';
import type { GridConfig, PaletteColor, BackstitchLine, CraftType } from '../types/craft';
import { getCraftDimensionsSummary } from './craftCalculator';

export interface EtsyListingData {
  title: string;
  tags: string[];
  description: string;
  suggestedPrice: string;
}

// ==========================================
// MOCKUP 1: HERO HOOP / FLATLAY (2000x2000)
// ==========================================

export function renderHeroMockupCanvas(
  gridData: number[][],
  palette: PaletteColor[],
  config: GridConfig,
  patternName: string,
  designerName: string = 'Pixel Craft Studio',
  backstitches: BackstitchLine[] = []
): HTMLCanvasElement {
  const size = 1600;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background: Warm modern studio desk
  const bgGrad = ctx.createLinearGradient(0, 0, size, size);
  bgGrad.addColorStop(0, '#f8fafc');
  bgGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Subtle linen / fabric shadow overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
  for (let i = 0; i < size; i += 8) {
    ctx.fillRect(i, 0, 1, size);
    ctx.fillRect(0, i, size, 1);
  }

  // Central Hoop Parameters
  const hoopCenterX = size / 2;
  const hoopCenterY = size / 2 - 20;
  const hoopRadius = 520;

  // Hoop Drop Shadow
  ctx.save();
  ctx.beginPath();
  ctx.arc(hoopCenterX + 10, hoopCenterY + 25, hoopRadius + 25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
  ctx.filter = 'blur(30px)';
  ctx.fill();
  ctx.restore();

  // Wooden Hoop Outer Ring
  const woodGrad = ctx.createLinearGradient(
    hoopCenterX - hoopRadius,
    hoopCenterY - hoopRadius,
    hoopCenterX + hoopRadius,
    hoopCenterY + hoopRadius
  );
  woodGrad.addColorStop(0, '#d4a373');
  woodGrad.addColorStop(0.3, '#faedcd');
  woodGrad.addColorStop(0.7, '#d4a373');
  woodGrad.addColorStop(1, '#bc6c25');

  ctx.beginPath();
  ctx.arc(hoopCenterX, hoopCenterY, hoopRadius + 22, 0, Math.PI * 2);
  ctx.lineWidth = 44;
  ctx.strokeStyle = woodGrad;
  ctx.stroke();

  // Inner Hoop Shadow
  ctx.beginPath();
  ctx.arc(hoopCenterX, hoopCenterY, hoopRadius - 1, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.stroke();

  // Brass Tension Screw Hardware at top of hoop
  ctx.fillStyle = '#b45309';
  ctx.fillRect(hoopCenterX - 18, hoopCenterY - hoopRadius - 48, 36, 30);
  ctx.fillStyle = '#d97706';
  ctx.fillRect(hoopCenterX - 24, hoopCenterY - hoopRadius - 58, 48, 12);
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(hoopCenterX - 4, hoopCenterY - hoopRadius - 62, 8, 8);

  // Aida Cloth Background inside hoop (Clipped)
  ctx.save();
  ctx.beginPath();
  ctx.arc(hoopCenterX, hoopCenterY, hoopRadius, 0, Math.PI * 2);
  ctx.clip();

  // Fabric Color
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Subtle Aida grid weave simulation
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
  ctx.lineWidth = 1;
  const aidaStep = 12;
  for (let x = hoopCenterX - hoopRadius; x <= hoopCenterX + hoopRadius; x += aidaStep) {
    ctx.beginPath();
    ctx.moveTo(x, hoopCenterY - hoopRadius);
    ctx.lineTo(x, hoopCenterY + hoopRadius);
    ctx.stroke();
  }
  for (let y = hoopCenterY - hoopRadius; y <= hoopCenterY + hoopRadius; y += aidaStep) {
    ctx.beginPath();
    ctx.moveTo(hoopCenterX - hoopRadius, y);
    ctx.lineTo(hoopCenterX + hoopRadius, y);
    ctx.stroke();
  }

  // Draw Pattern centered inside the hoop
  const rows = gridData.length;
  const cols = gridData[0]?.length || 1;
  const maxPatternDim = hoopRadius * 1.5;
  const cellSize = Math.floor(maxPatternDim / Math.max(rows, cols));
  const patternW = cols * cellSize;
  const patternH = rows * cellSize;
  const startX = hoopCenterX - patternW / 2;
  const startY = hoopCenterY - patternH / 2;

  // Stitches
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const colorIdx = gridData[r][c];
      if (colorIdx >= 0 && colorIdx < palette.length) {
        const hex = palette[colorIdx].hex;
        const cx = startX + c * cellSize;
        const cy = startY + r * cellSize;

        if (config.craftType === 'cross-stitch') {
          // Render realistic 'X' cross-stitch
          ctx.strokeStyle = hex;
          ctx.lineWidth = Math.max(2, cellSize * 0.28);
          ctx.lineCap = 'round';
          const pad = cellSize * 0.12;
          ctx.beginPath();
          ctx.moveTo(cx + pad, cy + pad);
          ctx.lineTo(cx + cellSize - pad, cy + cellSize - pad);
          ctx.moveTo(cx + cellSize - pad, cy + pad);
          ctx.lineTo(cx + pad, cy + cellSize - pad);
          ctx.stroke();
        } else if (config.craftType === 'perler') {
          // Render cylindrical bead with hole
          ctx.fillStyle = hex;
          ctx.beginPath();
          ctx.arc(cx + cellSize / 2, cy + cellSize / 2, cellSize * 0.44, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx + cellSize / 2, cy + cellSize / 2, cellSize * 0.16, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Clean solid pixel
          ctx.fillStyle = hex;
          ctx.fillRect(cx, cy, cellSize, cellSize);
        }
      }
    }
  }

  // Draw backstitches if any
  if (backstitches.length > 0) {
    for (const line of backstitches) {
      ctx.beginPath();
      ctx.moveTo(startX + line.x1 * cellSize, startY + line.y1 * cellSize);
      ctx.lineTo(startX + line.x2 * cellSize, startY + line.y2 * cellSize);
      ctx.strokeStyle = line.colorHex || '#111827';
      ctx.lineWidth = Math.max(2.5, cellSize * 0.25);
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  ctx.restore(); // End hoop clipping

  // Top Chic Header Banner
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  ctx.fillText(patternName.toUpperCase(), size / 2, 90);

  ctx.fillStyle = '#64748b';
  ctx.font = '600 24px system-ui, -apple-system, sans-serif';
  const craftLabel = config.craftType.replace('-', ' ').toUpperCase();
  ctx.fillText(
    `${craftLabel} PATTERN  •  DIGITAL PDF DOWNLOAD  •  BY ${designerName.toUpperCase()}`,
    size / 2,
    130
  );

  // Bottom Product Badge Box
  const badgeW = 1050;
  const badgeH = 130;
  const badgeX = (size - badgeW) / 2;
  const badgeY = size - 170;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 24);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Badge Text
  const dimsStr = getCraftDimensionsSummary(
    config.width,
    config.height,
    config.craftType,
    14,
    config.crochetGauge,
    config.knitGauge,
    config.beadLoom,
    config.unitSystem
  );

  ctx.textAlign = 'center';
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('★ OFFICIAL INSTANT DOWNLOAD PATTERN ★', size / 2, badgeY + 42);

  ctx.fillStyle = '#1e293b';
  ctx.font = '600 24px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    `Stitch Count: ${config.width} × ${config.height}  |  Palette: ${palette.length} Colors  |  ${dimsStr}`,
    size / 2,
    badgeY + 84
  );

  return canvas;
}

// ==========================================
// MOCKUP 2: COLOR PALETTE SWATCHES (1600x1600)
// ==========================================

export function renderPaletteMockupCanvas(
  palette: PaletteColor[],
  patternName: string,
  craftType: CraftType
): HTMLCanvasElement {
  const size = 1600;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, size, size);

  // Header Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 46px system-ui, sans-serif';
  ctx.fillText('COLOR PALETTE & THREAD GUIDE', size / 2, 90);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '22px system-ui, sans-serif';
  const craftLabel = craftType.toUpperCase();
  ctx.fillText(`${patternName}  •  ${craftLabel}  •  ${palette.length} Curated Colors with Exact Counts`, size / 2, 130);

  // Swatches Grid
  const margin = 80;
  const startY = 180;
  const availableW = size - margin * 2;
  const cols = palette.length > 16 ? 4 : 3;
  const itemW = availableW / cols;
  const itemH = 130;

  palette.forEach((color, idx) => {
    const colIdx = idx % cols;
    const rowIdx = Math.floor(idx / cols);
    const x = margin + colIdx * itemW;
    const y = startY + rowIdx * itemH;

    if (y + itemH > size - 140) return; // Keep inside bounds

    // Swatch Card Background
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 6, itemW - 16, itemH - 12, 16);
    ctx.fill();

    // Color Circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 52, y + itemH / 2, 34, 0, Math.PI * 2);
    ctx.fillStyle = color.hex;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // Details text
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui, sans-serif';
    const brandCode = color.code ? `${color.brand || 'DMC'} #${color.code}` : color.hex;
    ctx.fillText(brandCode, x + 100, y + 46);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 16px system-ui, sans-serif';
    ctx.fillText(color.name || 'Solid Shade', x + 100, y + 72);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(`${color.count} stitches (${color.percentage}%)`, x + 100, y + 96);
  });

  // Bottom Quality Banner
  const totalStitches = palette.reduce((acc, c) => acc + c.count, 0);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, size - 110, size, 110);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText(`✓ TOTAL: ${totalStitches.toLocaleString()} STITCHES  •  NO CONFETTI  •  CLEAN THREAD TRANSITIONS`, size / 2, size - 50);

  return canvas;
}

// ==========================================
// MOCKUP 3: CHART QUALITY CLOSEUP (1600x1600)
// ==========================================

export function renderChartQualityMockupCanvas(
  gridData: number[][],
  palette: PaletteColor[],
  patternName: string
): HTMLCanvasElement {
  const size = 1600;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Top Banner
  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(0, 0, size, 140);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText('HIGH-CONTRAST CHART & SYMBOLS', size / 2, 70);

  ctx.fillStyle = '#c7d2fe';
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText(`${patternName} • Clear, Easy-To-Read Symbols • Multi-Page Poster PDF`, size / 2, 110);

  // Sample Section of Grid with symbols
  const sampleRows = Math.min(gridData.length, 18);
  const sampleCols = Math.min(gridData[0]?.length || 1, 18);
  const chartW = 1200;
  const startX = (size - chartW) / 2;
  const startY = 220;
  const cellSize = Math.floor(chartW / sampleCols);

  for (let r = 0; r < sampleRows; r++) {
    for (let c = 0; c < sampleCols; c++) {
      const colorIdx = gridData[r][c];
      const cx = startX + c * cellSize;
      const cy = startY + r * cellSize;

      if (colorIdx >= 0 && colorIdx < palette.length) {
        const col = palette[colorIdx];
        ctx.fillStyle = col.hex;
        ctx.fillRect(cx, cy, cellSize, cellSize);

        // Draw symbol
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.floor(cellSize * 0.52)}px monospace`;
        ctx.fillStyle = '#000000';
        ctx.fillText(col.symbol || '•', cx + cellSize / 2, cy + cellSize / 2);
      }

      // Grid line
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, cellSize, cellSize);
    }
  }

  // Major 10x10 lines
  for (let c = 0; c <= sampleCols; c += 10) {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX + c * cellSize, startY);
    ctx.lineTo(startX + c * cellSize, startY + sampleRows * cellSize);
    ctx.stroke();
  }
  for (let r = 0; r <= sampleRows; r += 10) {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY + r * cellSize);
    ctx.lineTo(startX + sampleCols * cellSize, startY + r * cellSize);
    ctx.stroke();
  }

  // Bottom Quality Badges
  const bottomY = size - 220;
  const badges = [
    '📱 Tablet & iPad Ready',
    '🖨️ A4 & US Letter PDF',
    '🔲 Black & White Symbols',
    '🧵 3-Stitch Overlap Guides',
  ];

  badges.forEach((b, idx) => {
    const bx = 160 + idx * 330;
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(bx, bottomY, 300, 70, 16);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(b, bx + 150, bottomY + 42);
  });

  return canvas;
}

// ==========================================
// MOCKUP 4: SIZE & FABRIC GUIDE (1600x1600)
// ==========================================

export function renderSizeGuideMockupCanvas(
  width: number,
  height: number,
  patternName: string,
  craftType: CraftType
): HTMLCanvasElement {
  const size = 1600;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, size, size);

  // Top Banner
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 46px system-ui, sans-serif';
  ctx.fillText('FINISHED SIZE & FABRIC GUIDE', size / 2, 100);

  ctx.fillStyle = '#64748b';
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText(`${patternName} • ${craftType.toUpperCase()} Dimensions: ${width}w × ${height}h Stitches`, size / 2, 145);

  // Table Parameters
  const counts = [
    { count: '14 Count Aida', inW: (width / 14).toFixed(1), inH: (height / 14).toFixed(1), cmW: (width / 14 * 2.54).toFixed(1), cmH: (height / 14 * 2.54).toFixed(1), hoop: '6" to 8"' },
    { count: '16 Count Aida', inW: (width / 16).toFixed(1), inH: (height / 16).toFixed(1), cmW: (width / 16 * 2.54).toFixed(1), cmH: (height / 16 * 2.54).toFixed(1), hoop: '5" to 7"' },
    { count: '18 Count Aida', inW: (width / 18).toFixed(1), inH: (height / 18).toFixed(1), cmW: (width / 18 * 2.54).toFixed(1), cmH: (height / 18 * 2.54).toFixed(1), hoop: '5" to 6"' },
    { count: '22 Count Hardanger', inW: (width / 22).toFixed(1), inH: (height / 22).toFixed(1), cmW: (width / 22 * 2.54).toFixed(1), cmH: (height / 22 * 2.54).toFixed(1), hoop: '4" to 5"' },
  ];

  const tableX = 140;
  const tableY = 240;
  const tableW = size - tableX * 2;
  const rowH = 110;

  // Table Header
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.roundRect(tableX, tableY, tableW, 80, [16, 16, 0, 0]);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('FABRIC COUNT', tableX + 30, tableY + 48);
  ctx.fillText('INCHES', tableX + 400, tableY + 48);
  ctx.fillText('CENTIMETERS', tableX + 700, tableY + 48);
  ctx.fillText('RECOMMENDED HOOP', tableX + 980, tableY + 48);

  // Table Rows
  counts.forEach((item, idx) => {
    const ry = tableY + 80 + idx * rowH;
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f1f5f9';
    ctx.fillRect(tableX, ry, tableW, rowH);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, ry, tableW, rowH);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(item.count, tableX + 30, ry + 62);

    ctx.font = '600 20px system-ui, sans-serif';
    ctx.fillText(`${item.inW}" × ${item.inH}"`, tableX + 400, ry + 62);
    ctx.fillText(`${item.cmW} × ${item.cmH} cm`, tableX + 700, ry + 62);

    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(item.hoop, tableX + 980, ry + 62);
  });

  // Bottom Framing Tips Box
  const tipsY = tableY + 80 + counts.length * rowH + 60;
  ctx.fillStyle = '#eef2ff';
  ctx.strokeStyle = '#c7d2fe';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(tableX, tipsY, tableW, 220, 20);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#3730a3';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('💡 FABRIC CUTTING & FRAMING PRO-TIPS', tableX + 40, tipsY + 50);

  ctx.fillStyle = '#4338ca';
  ctx.font = '500 18px system-ui, sans-serif';
  ctx.fillText('• Always add at least 2 to 3 inches (5-8 cm) of extra fabric on all 4 sides for framing or hooping.', tableX + 40, tipsY + 95);
  ctx.fillText('• Recommended embroidery floss: 2 strands of thread on 14ct or 16ct Aida cloth.', tableX + 40, tipsY + 135);
  ctx.fillText('• Pattern includes both full color chart and black & white symbol charts for ink-saving printing.', tableX + 40, tipsY + 175);

  return canvas;
}

// ==========================================
// ETSY LISTING COPY & 13 TAGS GENERATOR
// ==========================================

export function generateEtsyListingCopy(
  patternTitle: string,
  craftType: CraftType,
  width: number,
  height: number,
  palette: PaletteColor[],
  designerName: string = 'Pixel Craft Studio'
): EtsyListingData {
  const craftCapitalized = craftType === 'perler' ? 'Perler Bead' : craftType === 'crochet' ? 'Tapestry Crochet' : 'Cross Stitch';
  const totalStitches = palette.reduce((a, b) => a + b.count, 0);

  // SEO-Rich Listing Title (under 140 chars)
  const title = `${patternTitle} ${craftCapitalized} Pattern PDF | Modern DMC Embroidery Chart | Instant Download Pattern`;

  // 13 High-Intent Etsy Tags (Max 20 chars each)
  const tags: string[] = [
    `${craftType} pattern`,
    'cross stitch pdf',
    'modern cross stitch',
    'dmc floss pattern',
    'instant download',
    'digital chart pdf',
    'diy embroidery',
    'beginner stitch',
    'printable chart',
    'pixel art pattern',
    'craft pattern pdf',
    'cute cross stitch',
    'hand embroidery',
  ].map((t) => t.substring(0, 20));

  // Full Formatted Description
  const description = `✨ ${patternTitle} — ${craftCapitalized} Digital PDF Pattern ✨

Create your own beautiful handmade project with this easy-to-read, professional ${craftCapitalized} chart. Ready for instant download immediately after purchase!

────────────
📐 PATTERN DETAILS:
────────────
• Stitch Count: ${width} wide × ${height} high (${totalStitches.toLocaleString()} total stitches)
• Floss / Colors: ${palette.length} Colors (Official DMC Embroidery Floss)
• Stitches Used: Full Cross Stitches (No fractional quarter stitches!)

Finished Dimensions:
• 14 Count Aida: ${(width / 14).toFixed(1)}" × ${(height / 14).toFixed(1)}" (${(width / 14 * 2.54).toFixed(1)} × ${(height / 14 * 2.54).toFixed(1)} cm)
• 16 Count Aida: ${(width / 16).toFixed(1)}" × ${(height / 16).toFixed(1)}" (${(width / 16 * 2.54).toFixed(1)} × ${(height / 16 * 2.54).toFixed(1)} cm)
• 18 Count Aida: ${(width / 18).toFixed(1)}" × ${(height / 18).toFixed(1)}" (${(width / 18 * 2.54).toFixed(1)} × ${(height / 18 * 2.54).toFixed(1)} cm)

────────────
📦 WHAT YOU RECEIVE:
────────────
1. Full-Color Pattern Booklet PDF with high-contrast symbols
2. Black & White Ink-Saver Symbol Chart (ideal for printing at home)
3. One-Page Quick View (perfect for viewing on iPad or tablet)
4. Multi-Page Poster Chart with 3-stitch shaded overlap guides
5. Complete DMC Floss Color Key with exact stitch counts & skein estimates

────────────
⚡ HOW TO DOWNLOAD:
────────────
Your PDF files will be available to download once payment is confirmed. You will receive an email with your download link, or you can access them anytime under "Purchases and Reviews" in your Etsy account.

Please note: This is a DIGITAL pattern only. No physical fabric, threads, or finished item will be shipped.

Designed with love by ${designerName}. Happy crafting! 🧵✨`;

  return {
    title,
    tags,
    description,
    suggestedPrice: '$4.99',
  };
}

// ==========================================
// 1-CLICK ZIP BUNDLE GENERATOR
// ==========================================

export async function createEtsySellerZip(
  heroCanvas: HTMLCanvasElement,
  paletteCanvas: HTMLCanvasElement,
  chartCanvas: HTMLCanvasElement,
  sizeCanvas: HTMLCanvasElement,
  listingData: EtsyListingData,
  patternName: string
): Promise<Blob> {
  const zip = new JSZip();

  // Helper to convert canvas to blob
  const canvasToBlob = (c: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve) => {
      c.toBlob((b) => resolve(b || new Blob()), 'image/png');
    });
  };

  const [heroBlob, paletteBlob, chartBlob, sizeBlob] = await Promise.all([
    canvasToBlob(heroCanvas),
    canvasToBlob(paletteCanvas),
    canvasToBlob(chartCanvas),
    canvasToBlob(sizeCanvas),
  ]);

  // Add mockups to zip
  zip.file('01_hero_listing_mockup.png', heroBlob);
  zip.file('02_color_palette_guide.png', paletteBlob);
  zip.file('03_chart_symbols_quality.png', chartBlob);
  zip.file('04_finished_size_guide.png', sizeBlob);

  // Add Listing Info text file
  const infoText = `ETSY LISTING INFORMATION
========================
PATTERN: ${patternName}

1. LISTING TITLE (Copy & Paste):
${listingData.title}

2. SUGGESTED PRICE:
${listingData.suggestedPrice}

3. 13 ETSY SEARCH TAGS:
${listingData.tags.join(', ')}

4. LISTING DESCRIPTION:
----------------------------------------
${listingData.description}
`;

  zip.file('Etsy_Listing_Info.txt', infoText);

  return zip.generateAsync({ type: 'blob' });
}
