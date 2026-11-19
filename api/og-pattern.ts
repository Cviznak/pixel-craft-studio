import { deflateSync } from 'node:zlib';

const WIDTH = 1200;
const HEIGHT = 630;

interface SimplePaletteColor {
  hex?: string;
  r?: number;
  g?: number;
  b?: number;
}

interface PublishedPatternRow {
  title?: string;
  craft_type?: string;
  width?: number;
  height?: number;
  grid_rle?: string;
  palette?: SimplePaletteColor[];
  bead_stitch_style?: string;
  color_count?: number;
}

const FONT_5X7: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10011', '10101', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Uint8Array): Buffer {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function encodeRgbaToPng(rgba: Uint8Array, width: number, height: number): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.allocUnsafe(height * (1 + stride));
  for (let y = 0; y < height; y++) {
    const dstOffset = y * (1 + stride);
    raw[dstOffset] = 0;
    const srcOffset = y * stride;
    raw.set(rgba.subarray(srcOffset, srcOffset + stride), dstOffset + 1);
  }

  const compressed = deflateSync(raw, { level: 6 });

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function parseColor(c?: SimplePaletteColor): [number, number, number] {
  if (!c) return [30, 41, 59];
  if (typeof c.r === 'number' && typeof c.g === 'number' && typeof c.b === 'number') {
    return [c.r & 255, c.g & 255, c.b & 255];
  }
  const hex = (c.hex || '').replace('#', '').trim();
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  return [99, 102, 241];
}

function fillRect(
  rgba: Uint8Array,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
  a = 255
) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(WIDTH, Math.ceil(x + w));
  const y1 = Math.min(HEIGHT, Math.ceil(y + h));
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const idx = (py * WIDTH + px) * 4;
      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = a;
    }
  }
}

function drawBitmapText(
  rgba: Uint8Array,
  text: string,
  startX: number,
  startY: number,
  scale: number,
  r: number,
  g: number,
  b: number
) {
  const clean = text.toUpperCase();
  let cursorX = startX;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const glyph = FONT_5X7[ch] || FONT_5X7[' '];
    for (let row = 0; row < glyph.length; row++) {
      const line = glyph[row];
      for (let col = 0; col < line.length; col++) {
        if (line[col] === '1') {
          fillRect(
            rgba,
            cursorX + col * scale,
            startY + row * scale,
            scale,
            scale,
            r,
            g,
            b
          );
        }
      }
    }
    cursorX += 6 * scale;
  }
}

function decompressGridRLE(rle: string, width: number, height: number): number[][] {
  const flat: number[] = [];
  const parts = rle.split(';');
  for (const part of parts) {
    if (!part) continue;
    const [valStr, lenStr] = part.split(':');
    const val = parseInt(valStr, 10);
    const len = parseInt(lenStr, 10);
    if (Number.isNaN(val) || Number.isNaN(len) || len <= 0) continue;
    for (let i = 0; i < len && flat.length < width * height; i++) {
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

export function renderPatternOgPngBuffer(pattern: PublishedPatternRow | null, shortId?: string): Buffer {
  const rgba = new Uint8Array(WIDTH * HEIGHT * 4);

  // Subtle dark slate-to-indigo gradient background
  for (let y = 0; y < HEIGHT; y++) {
    const ty = y / HEIGHT;
    for (let x = 0; x < WIDTH; x++) {
      const tx = x / WIDTH;
      const mix = 0.55 * ty + 0.45 * tx;
      const idx = (y * WIDTH + x) * 4;
      rgba[idx] = Math.round(11 + 19 * mix);
      rgba[idx + 1] = Math.round(17 + 12 * mix);
      rgba[idx + 2] = Math.round(32 + 46 * mix);
      rgba[idx + 3] = 255;
    }
  }

  // Top gradient accent bar
  for (let x = 0; x < WIDTH; x++) {
    const t = x / WIDTH;
    const r = Math.round(99 + (236 - 99) * t);
    const g = Math.round(102 + (72 - 102) * t);
    const b = Math.round(241 + (153 - 241) * t);
    fillRect(rgba, x, 0, 1, 8, r, g, b);
  }

  // Left pattern showcase card
  const frameX = 54;
  const frameY = 48;
  const frameSize = 534;
  fillRect(rgba, frameX - 2, frameY - 2, frameSize + 4, frameSize + 4, 51, 65, 85);
  fillRect(rgba, frameX, frameY, frameSize, frameSize, 15, 23, 42);

  const palette = Array.isArray(pattern?.palette) ? pattern.palette : [];
  const pWidth = Math.max(1, Math.min(250, Number(pattern?.width) || 16));
  const pHeight = Math.max(1, Math.min(250, Number(pattern?.height) || 16));
  const hasGrid = Boolean(pattern?.grid_rle && palette.length > 0);

  if (hasGrid && pattern?.grid_rle) {
    const grid = decompressGridRLE(pattern.grid_rle, pWidth, pHeight);
    const pad = 28;
    const innerSize = frameSize - pad * 2;
    const isPeyote = pattern.craft_type === 'loom' && pattern.bead_stitch_style === 'peyote';
    const isBrick = pattern.craft_type === 'loom' && pattern.bead_stitch_style === 'brick';
    const effCols = pWidth + (isBrick && pHeight > 1 ? 0.5 : 0);
    const effRows = pHeight + (isPeyote && pWidth > 1 ? 0.5 : 0);
    const cell = Math.max(1, Math.floor(Math.min(innerSize / effCols, innerSize / effRows)));
    const drawW = Math.round(effCols * cell);
    const drawH = Math.round(effRows * cell);
    const originX = frameX + Math.floor((frameSize - drawW) / 2);
    const originY = frameY + Math.floor((frameSize - drawH) / 2);

    for (let y = 0; y < pHeight; y++) {
      for (let x = 0; x < pWidth; x++) {
        const ci = grid[y][x];
        if (ci < 0 || !palette[ci]) continue;
        const [cr, cg, cb] = parseColor(palette[ci]);
        const ox = isBrick && y % 2 === 1 ? Math.floor(cell * 0.5) : 0;
        const oy = isPeyote && x % 2 === 1 ? Math.floor(cell * 0.5) : 0;
        const gap = cell >= 8 ? 1 : 0;
        fillRect(rgba, originX + x * cell + ox, originY + y * cell + oy, cell - gap, cell - gap, cr, cg, cb);
      }
    }
  } else {
    // Clean geometric mosaic fallback when pattern unavailable
    const swatchFallbacks: [number, number, number][] = [
      [99, 102, 241],
      [236, 72, 153],
      [16, 185, 129],
      [245, 158, 11],
    ];
    const blk = 96;
    const startX = frameX + 168;
    const startY = frameY + 168;
    for (let gy = 0; gy < 2; gy++) {
      for (let gx = 0; gx < 2; gx++) {
        const [r, g, b] = swatchFallbacks[gy * 2 + gx];
        fillRect(rgba, startX + gx * (blk + 12), startY + gy * (blk + 12), blk, blk, r, g, b);
      }
    }
  }

  // Right-side editorial text & swatch card
  const infoX = 636;
  drawBitmapText(rgba, 'PIXEL CRAFT STUDIO', infoX, 74, 4, 165, 180, 252);

  const rawTitle = (pattern?.title || 'SHARED CRAFT PATTERN').slice(0, 18);
  drawBitmapText(rgba, rawTitle, infoX, 134, 4, 248, 250, 252);

  const craftLabel = (pattern?.craft_type || 'CRAFT').replace(/-/g, ' ');
  drawBitmapText(rgba, craftLabel, infoX, 198, 3, 244, 114, 182);

  const dimLine = `${pWidth} X ${pHeight}  -  ${pattern?.color_count || palette.length || 0} COLORS`;
  drawBitmapText(rgba, dimLine, infoX, 248, 3, 203, 213, 225);

  if (shortId) {
    drawBitmapText(rgba, `/P/${shortId}`.slice(0, 20), infoX, 296, 3, 34, 211, 238);
  }

  // Render up to 18 crisp color swatches
  const maxSwatches = Math.min(18, palette.length);
  for (let i = 0; i < maxSwatches; i++) {
    const [sr, sg, sb] = parseColor(palette[i]);
    const col = i % 9;
    const row = Math.floor(i / 9);
    const sx = infoX + col * 56;
    const sy = 368 + row * 56;
    fillRect(rgba, sx - 2, sy - 2, 46, 46, 51, 65, 85);
    fillRect(rgba, sx, sy, 42, 42, sr, sg, sb);
  }

  drawBitmapText(rgba, 'OPEN + EDIT FREE IN BROWSER', infoX, 536, 3, 148, 163, 184);

  return encodeRgbaToPng(rgba, WIDTH, HEIGHT);
}

export default async function handler(req: any, res: any) {
  try {
    const rawId = String(req.query?.id || '').trim().toLowerCase();
    const validId = /^[a-z0-9]{6,16}$/.test(rawId) ? rawId : '';

    const sbUrl = (
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      ''
    ).trim();
    const sbKey = (
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      ''
    ).trim();

    let patternRow: PublishedPatternRow | null = null;

    if (validId && sbUrl && sbKey) {
      const endpoint = `${sbUrl}/rest/v1/published_patterns?short_id=eq.${encodeURIComponent(
        validId
      )}&select=title,craft_type,width,height,grid_rle,palette,bead_stitch_style,color_count&limit=1`;
      const upstream = await fetch(endpoint, {
        headers: {
          apikey: sbKey,
          Accept: 'application/json',
        },
      });
      if (upstream.ok) {
        const rows = (await upstream.json()) as PublishedPatternRow[];
        if (Array.isArray(rows) && rows.length > 0) {
          patternRow = rows[0];
        }
      }
    }

    const png = renderPatternOgPngBuffer(patternRow, validId || undefined);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(png);
  } catch {
    const fallbackPng = renderPatternOgPngBuffer(null);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).send(fallbackPng);
  }
}
