import type {
  BackstitchLine,
  CraftProject,
  GridConfig,
  PaletteColor,
} from '../types/craft';
import { getCraftSymbol } from './symbols';
import { hexToRgb } from './colorUtils';

export interface OxsExportOptions {
  title?: string;
  author?: string;
  backstitches?: BackstitchLine[];
}

export interface SvgExportOptions {
  title?: string;
  includeGridLines?: boolean;
  backgroundColor?: string | null;
  backstitches?: BackstitchLine[];
}

function escapeXml(raw: string): string {
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function unescapeXml(raw: string): string {
  return raw
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function downloadBlob(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates an Open Cross-Stitch (.oxs) v1.0 XML chart compatible with
 * Pattern Keeper, Markup R-XP, WinStitch, MacStitch, and FlossCross.
 */
export function buildOXSString(
  gridData: number[][],
  palette: PaletteColor[],
  config: GridConfig,
  options: OxsExportOptions = {}
): string {
  const height = gridData.length;
  const width = height > 0 ? gridData[0].length : config.width;
  const title = (options.title || 'Pixel Craft Pattern').trim() || 'Pixel Craft Pattern';
  const author = (options.author || 'Pixel Craft Studio').trim() || 'Pixel Craft Studio';
  const backstitches = options.backstitches || [];

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<chart>',
    '  <format comments01="Created with Pixel Craft Studio (.oxs v1.0)" />',
    `  <properties oxsversion="1.0" software="Pixel Craft Studio" chartwidth="${width}" chartheight="${height}" charttitle="${escapeXml(title)}" author="${escapeXml(author)}" copyright="${escapeXml(author)}" stitchesperinch="14" stitchesperinch_y="14" palettecount="${palette.length}" />`,
    '  <palette>',
    '    <palette_item index="0" number="cloth" name="Aida Cloth" color="FAF8F5" strands="2" symbol="0" printsymbol="" />',
  ];

  const colorCodeMap = new Map<string, number>();

  palette.forEach((c, idx) => {
    const palIndex = idx + 1;
    const rawHex = (c.hex || '#000000').replace('#', '').toUpperCase().padStart(6, '0').slice(0, 6);
    const numStr = c.brand === 'DMC' && c.code ? `DMC ${c.code}` : (c.code || `PCS-${palIndex}`);
    const nameStr = c.name || c.code || c.hex;
    const sym = c.symbol || getCraftSymbol(idx);
    const symCode = sym.codePointAt(0) || 65 + (idx % 26);

    colorCodeMap.set(c.hex.toLowerCase(), palIndex);

    lines.push(
      `    <palette_item index="${palIndex}" number="${escapeXml(numStr)}" name="${escapeXml(nameStr)}" color="${escapeXml(rawHex)}" strands="2" symbol="${symCode}" printsymbol="${escapeXml(sym)}" />`
    );
  });

  lines.push('  </palette>');
  lines.push('  <fullstitches>');

  for (let y = 0; y < height; y++) {
    const row = gridData[y];
    for (let x = 0; x < row.length; x++) {
      const idx = row[x];
      if (idx >= 0 && idx < palette.length) {
        lines.push(`    <stitch x="${x}" y="${y}" palindex="${idx + 1}" />`);
      }
    }
  }

  lines.push('  </fullstitches>');

  if (backstitches.length > 0) {
    lines.push('  <backstitches>');
    for (const bs of backstitches) {
      let palIndex = colorCodeMap.get((bs.colorHex || '').toLowerCase());
      if (!palIndex && bs.colorCode) {
        const matchIdx = palette.findIndex((p) => p.code === bs.colorCode);
        if (matchIdx >= 0) palIndex = matchIdx + 1;
      }
      const strands = bs.strands || 1;
      lines.push(
        `    <backstitch x1="${bs.x1}" y1="${bs.y1}" x2="${bs.x2}" y2="${bs.y2}" palindex="${palIndex || 1}" objecttype="backstitch" strands="${strands}" />`
      );
    }
    lines.push('  </backstitches>');
  }

  lines.push('</chart>');
  return lines.join('\n');
}

export function exportPatternToOXS(
  gridData: number[][],
  palette: PaletteColor[],
  config: GridConfig,
  filename = 'pattern.oxs',
  options: OxsExportOptions = {}
): void {
  const xml = buildOXSString(gridData, palette, config, options);
  const finalName = filename.toLowerCase().endsWith('.oxs') ? filename : `${filename}.oxs`;
  downloadBlob(xml, 'application/xml;charset=utf-8', finalName);
}

interface ParsedXmlNode {
  attrs: Record<string, string>;
}

function extractTagAttributes(rawAttrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = attrRegex.exec(rawAttrStr)) !== null) {
    attrs[m[1].toLowerCase()] = unescapeXml(m[2] ?? m[3] ?? '');
  }
  return attrs;
}

function parseXmlNodesFallback(xmlText: string, tagName: string): ParsedXmlNode[] {
  const nodes: ParsedXmlNode[] = [];
  const regex = new RegExp(`<${tagName}\\b([^>]*?)/?>`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xmlText)) !== null) {
    nodes.push({ attrs: extractTagAttributes(m[1] || '') });
  }
  return nodes;
}

function getOxsElements(
  xmlText: string,
  domDoc: Document | null,
  tagName: string
): Record<string, string>[] {
  if (domDoc) {
    const els = Array.from(domDoc.getElementsByTagName(tagName));
    return els.map((el) => {
      const attrs: Record<string, string> = {};
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        attrs[attr.name.toLowerCase()] = attr.value;
      }
      return attrs;
    });
  }
  return parseXmlNodesFallback(xmlText, tagName).map((n) => n.attrs);
}

/**
 * Parses an Open Cross-Stitch (.oxs) XML document into a studio CraftProject.
 */
export function parseOXSFile(xmlText: string): CraftProject {
  if (!xmlText || !xmlText.includes('<chart')) {
    throw new Error('Invalid .oxs file: missing <chart> root element.');
  }

  let domDoc: Document | null = null;
  if (typeof DOMParser !== 'undefined') {
    const parsed = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (!parsed.querySelector('parsererror')) {
      domDoc = parsed;
    }
  }

  const propsList = getOxsElements(xmlText, domDoc, 'properties');
  const props = propsList[0] || {};
  const width = Math.max(4, Math.min(250, parseInt(props.chartwidth || '0', 10) || 32));
  const height = Math.max(4, Math.min(250, parseInt(props.chartheight || '0', 10) || 32));
  const title = props.charttitle || 'Imported OXS Pattern';

  const paletteNodes = getOxsElements(xmlText, domDoc, 'palette_item');
  const palette: PaletteColor[] = [];
  const oxsIndexToPaletteIdx = new Map<number, number>();

  for (const attrs of paletteNodes) {
    const rawIdx = parseInt(attrs.index || '-1', 10);
    const numRaw = (attrs.number || '').trim();
    if (rawIdx === 0 || numRaw.toLowerCase() === 'cloth') continue;

    let hex = (attrs.color || '000000').replace('#', '').trim();
    if (!/^[0-9a-f]{6}$/i.test(hex)) {
      hex = '6366F1';
    }
    const normHex = `#${hex.toUpperCase()}`;
    const rgb = hexToRgb(normHex) || { r: 99, g: 102, b: 241 };

    const paletteIdx = palette.length;
    if (!Number.isNaN(rawIdx) && rawIdx >= 0) {
      oxsIndexToPaletteIdx.set(rawIdx, paletteIdx);
    } else {
      oxsIndexToPaletteIdx.set(paletteIdx + 1, paletteIdx);
    }

    const dmcMatch = /^dmc[\s:-]*([a-z0-9]+)$/i.exec(numRaw);
    const isNumericCode = /^\d{2,4}$|^blanc$|^ecru$|^b5200$/i.test(numRaw);
    const code = dmcMatch ? dmcMatch[1].toUpperCase() : numRaw || undefined;
    const brand: PaletteColor['brand'] =
      dmcMatch || isNumericCode ? 'DMC' : 'Custom';

    const printSym = (attrs.printsymbol || '').trim();
    const symChar = printSym.length === 1 ? printSym : getCraftSymbol(paletteIdx);

    palette.push({
      id: `oxs-${paletteIdx}-${Date.now()}`,
      hex: normHex,
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      symbol: symChar,
      count: 0,
      percentage: 0,
      name: attrs.name || code || normHex,
      code,
      brand,
    });
  }

  if (palette.length === 0) {
    throw new Error('Invalid .oxs file: no color entries found in <palette>.');
  }

  const gridData: number[][] = Array.from({ length: height }, () =>
    new Array(width).fill(-1)
  );

  const stitches = getOxsElements(xmlText, domDoc, 'stitch');
  for (const st of stitches) {
    const x = parseInt(st.x || '-1', 10);
    const y = parseInt(st.y || '-1', 10);
    const palIdxRaw = parseInt(st.palindex || '-1', 10);
    const mapped = oxsIndexToPaletteIdx.get(palIdxRaw);
    if (
      mapped !== undefined &&
      x >= 0 &&
      x < width &&
      y >= 0 &&
      y < height
    ) {
      gridData[y][x] = mapped;
    }
  }

  // Recalculate exact stitch counts and percentages
  const counts = new Array(palette.length).fill(0);
  let totalValid = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = gridData[y][x];
      if (idx >= 0 && idx < counts.length) {
        counts[idx]++;
        totalValid++;
      }
    }
  }
  const finalizedPalette = palette.map((c, idx) => ({
    ...c,
    count: counts[idx],
    percentage: totalValid > 0 ? Math.round((counts[idx] / totalValid) * 1000) / 10 : 0,
  }));

  const backstitches: BackstitchLine[] = [];
  const bsNodes = getOxsElements(xmlText, domDoc, 'backstitch');
  bsNodes.forEach((bs, i) => {
    const x1 = parseFloat(bs.x1 || '0');
    const y1 = parseFloat(bs.y1 || '0');
    const x2 = parseFloat(bs.x2 || '0');
    const y2 = parseFloat(bs.y2 || '0');
    if ([x1, y1, x2, y2].some((v) => Number.isNaN(v))) return;
    const rawPal = parseInt(bs.palindex || '1', 10);
    const palIdx = oxsIndexToPaletteIdx.get(rawPal) ?? 0;
    const col = finalizedPalette[palIdx];
    const strandsRaw = parseInt(bs.strands || '1', 10);
    backstitches.push({
      id: `oxs-bs-${i}-${Date.now()}`,
      x1,
      y1,
      x2,
      y2,
      colorHex: col?.hex || '#000000',
      colorCode: col?.code,
      strands: strandsRaw === 2 ? 2 : 1,
    });
  });

  const gridConfig: GridConfig = {
    width,
    height,
    lockAspectRatio: false,
    colorsCount: finalizedPalette.length,
    craftType: 'cross-stitch',
    extractionMode: 'balanced',
    dither: 'none',
    craftStandard: 'dmc',
    brightness: 0,
    contrast: 0,
    saturation: 0,
    showGridLines: true,
    show10x10MajorLines: true,
    showRulers: true,
    showSymbols: true,
    cellSize: 24,
    transparentMode: 'empty',
    unitSystem: 'imperial',
  };

  return {
    version: '2.0',
    name: title,
    createdAt: new Date().toISOString(),
    gridConfig,
    gridData,
    palette: finalizedPalette,
    completedCells: {},
    backstitches,
  };
}

/**
 * Generates a color-layered scalable vector (.svg) suitable for Cricut/cutters,
 * poster printing, and vector editing tools (Illustrator, Inkscape, Figma).
 */
export function buildSVGString(
  gridData: number[][],
  palette: PaletteColor[],
  config: GridConfig,
  options: SvgExportOptions = {}
): string {
  const height = gridData.length;
  const width = height > 0 ? gridData[0].length : config.width;
  const cellPx = 20;

  const beadStyle = config.craftType === 'loom' ? config.beadLoom?.stitchStyle || 'loom' : 'loom';
  const extraW = beadStyle === 'brick' && height > 1 ? 0.5 : 0;
  const extraH = beadStyle === 'peyote' && width > 1 ? 0.5 : 0;

  const svgW = Math.round((width + extraW) * cellPx);
  const svgH = Math.round((height + extraH) * cellPx);
  const title = (options.title || 'Pixel Craft Pattern').trim();
  const includeGridLines = options.includeGridLines ?? false;
  const backstitches = options.backstitches || [];

  const buckets: { x: number; y: number }[][] = Array.from({ length: palette.length }, () => []);
  for (let y = 0; y < height; y++) {
    const row = gridData[y];
    for (let x = 0; x < row.length; x++) {
      const idx = row[x];
      if (idx >= 0 && idx < palette.length) {
        buckets[idx].push({ x, y });
      }
    }
  }

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}" shape-rendering="crispEdges">`,
    `  <title>${escapeXml(title)}</title>`,
  ];

  if (options.backgroundColor) {
    lines.push(
      `  <rect id="background" x="0" y="0" width="${svgW}" height="${svgH}" fill="${escapeXml(options.backgroundColor)}" />`
    );
  }

  palette.forEach((c, idx) => {
    const cells = buckets[idx];
    if (cells.length === 0) return;
    const rawCode = (c.code || `c${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '');
    const safeName = escapeXml(c.name || c.code || c.hex);
    lines.push(
      `  <g id="color-${idx + 1}-${escapeXml(rawCode)}" data-color-name="${safeName}" fill="${escapeXml(c.hex)}">`
    );
    for (const pt of cells) {
      const ox = beadStyle === 'brick' && pt.y % 2 === 1 ? cellPx * 0.5 : 0;
      const oy = beadStyle === 'peyote' && pt.x % 2 === 1 ? cellPx * 0.5 : 0;
      lines.push(
        `    <rect x="${pt.x * cellPx + ox}" y="${pt.y * cellPx + oy}" width="${cellPx}" height="${cellPx}" />`
      );
    }
    lines.push('  </g>');
  });

  if (includeGridLines && beadStyle === 'loom') {
    lines.push('  <g id="grid-lines" stroke="#94a3b8" stroke-opacity="0.35" stroke-width="0.6" fill="none">');
    for (let x = 0; x <= width; x++) {
      lines.push(`    <line x1="${x * cellPx}" y1="0" x2="${x * cellPx}" y2="${svgH}" />`);
    }
    for (let y = 0; y <= height; y++) {
      lines.push(`    <line x1="0" y1="${y * cellPx}" x2="${svgW}" y2="${y * cellPx}" />`);
    }
    lines.push('  </g>');
  }

  if (backstitches.length > 0) {
    lines.push('  <g id="backstitches" stroke-linecap="round" fill="none">');
    for (const bs of backstitches) {
      lines.push(
        `    <line x1="${bs.x1 * cellPx}" y1="${bs.y1 * cellPx}" x2="${bs.x2 * cellPx}" y2="${bs.y2 * cellPx}" stroke="${escapeXml(bs.colorHex || '#000000')}" stroke-width="${Math.max(2, cellPx * 0.16)}" />`
      );
    }
    lines.push('  </g>');
  }

  lines.push('</svg>');
  return lines.join('\n');
}

export function exportPatternToSVG(
  gridData: number[][],
  palette: PaletteColor[],
  config: GridConfig,
  filename = 'pattern.svg',
  options: SvgExportOptions = {}
): void {
  const svg = buildSVGString(gridData, palette, config, options);
  const finalName = filename.toLowerCase().endsWith('.svg') ? filename : `${filename}.svg`;
  downloadBlob(svg, 'image/svg+xml;charset=utf-8', finalName);
}
