import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileText,
  FolderOpen,
  Grid,
  Image as ImageIcon,
  Layers,
  Pencil,
  Ruler,
  Sparkles,
  Upload,
} from 'lucide-react';
import { PageShell } from '../components/PageShell';
import type { CraftProject, GridConfig } from '../types/craft';
import { getContrastingTextColor } from '../utils/colorUtils';
import {
  calculateCrossStitchDimensions,
  estimateDmcSkeins,
  type CrossStitchClothCount,
} from '../utils/craftCalculator';
import { STANDALONE_PAGE_ROUTES, updateDocumentMeta } from '../utils/craftRoutes';
import {
  exportPixelArtPNG,
  generatePatternKeeperPDF,
  generatePatternPDF,
} from '../utils/exportUtils';
import { buildOXSString, exportPatternToSVG, parseOXSFile } from '../utils/oxsFormat';
import { queueProjectForStudio } from '../utils/studioHandoff';
import { getAnchorEquivalent } from '../utils/threadEquivalents';

const CLOTH_COUNTS: CrossStitchClothCount[] = [11, 14, 16, 18, 22, 28];

function createSampleOxsProject(): CraftProject {
  // 16x16 Cottage Mushroom with Leaf & Backstitch highlight
  const grid = [
    [-1, -1, -1, -1, -1, 0, 0, 0, 0, 0, 0, -1, -1, -1, -1, -1],
    [-1, -1, -1, 0, 0, 1, 1, 0, 0, 1, 0, 0, -1, -1, -1, -1],
    [-1, -1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, -1, -1, -1],
    [-1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, -1, -1],
    [-1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, -1, -1],
    [0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, -1],
    [0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, -1],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1],
    [-1, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, -1, -1],
    [-1, -1, -1, -1, -1, 2, 2, 3, 2, 2, 2, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, 2, 2, 2, 2, 2, 2, -1, 4, 4, -1, -1],
    [-1, -1, -1, -1, -1, 2, 2, 3, 2, 2, 4, 4, 4, -1, -1, -1],
    [-1, -1, -1, -1, -1, 2, 2, 2, 2, 4, 4, -1, -1, -1, -1, -1],
    [-1, -1, -1, 4, 4, 2, 2, 2, 2, 2, 2, -1, -1, -1, -1, -1],
    [-1, -1, 4, 4, 4, 4, 2, 2, 2, 2, 4, 4, -1, -1, -1, -1],
    [-1, -1, -1, -1, 4, 4, 4, 4, 4, 4, 4, -1, -1, -1, -1, -1],
  ];
  const palette = [
    { id: 'c0', hex: '#D92638', r: 217, g: 38, b: 56, symbol: 'X', count: 0, percentage: 0, name: 'Bright Red', code: '666', brand: 'DMC' as const },
    { id: 'c1', hex: '#FDFBF7', r: 253, g: 251, b: 247, symbol: 'O', count: 0, percentage: 0, name: 'White', code: 'Blanc', brand: 'DMC' as const },
    { id: 'c2', hex: '#F3DFC1', r: 243, g: 223, b: 193, symbol: '+', count: 0, percentage: 0, name: 'Very Light Tan', code: '739', brand: 'DMC' as const },
    { id: 'c3', hex: '#C69F73', r: 198, g: 159, b: 115, symbol: '#', count: 0, percentage: 0, name: 'Tan', code: '436', brand: 'DMC' as const },
    { id: 'c4', hex: '#3D994B', r: 61, g: 153, b: 75, symbol: '▲', count: 0, percentage: 0, name: 'Kelly Green', code: '702', brand: 'DMC' as const },
    { id: 'c5', hex: '#1A1A1A', r: 26, g: 26, b: 26, symbol: '●', count: 0, percentage: 0, name: 'Black', code: '310', brand: 'DMC' as const },
  ];
  const config: GridConfig = {
    width: 16,
    height: 16,
    lockAspectRatio: true,
    colorsCount: palette.length,
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
  const backstitches = [
    { id: 'bs-1', x1: 5, y1: 9, x2: 11, y2: 9, colorHex: '#1A1A1A', colorCode: '310', strands: 1 as const },
    { id: 'bs-2', x1: 5, y1: 9, x2: 5, y2: 15, colorHex: '#1A1A1A', colorCode: '310', strands: 1 as const },
    { id: 'bs-3', x1: 11, y1: 9, x2: 11, y2: 15, colorHex: '#1A1A1A', colorCode: '310', strands: 1 as const },
  ];
  const xml = buildOXSString(grid, palette, config, {
    title: 'Sample Woodland Toadstool',
    author: 'Pixel Craft Studio',
    backstitches,
  });
  return parseOXSFile(xml);
}

export const OxsViewerPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [project, setProject] = useState<CraftProject | null>(null);
  const [rawXmlSizeKb, setRawXmlSizeKb] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [showSymbols, setShowSymbols] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showBackstitches, setShowBackstitches] = useState(true);
  const [zoomScale, setZoomScale] = useState<'fit' | 1 | 1.5 | 2>('fit');
  const [spotlightIdx, setSpotlightIdx] = useState<number | null>(null);
  const [clothCount, setClothCount] = useState<CrossStitchClothCount>(14);
  const [copiedShopping, setCopiedShopping] = useState(false);

  useEffect(() => {
    const meta = STANDALONE_PAGE_ROUTES['/oxs-viewer'];
    updateDocumentMeta(meta, {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: meta.metaTitle,
      description: meta.metaDescription,
      url: meta.canonicalUrl,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    });
  }, []);

  const handleLoadOxsText = (text: string, label: string, byteSize = text.length) => {
    try {
      const parsed = parseOXSFile(text);
      setProject(parsed);
      setFileName(label);
      setRawXmlSizeKb(Math.max(1, Math.round(byteSize / 1024)));
      setSpotlightIdx(null);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Could not read that file. Please verify it is a valid Open Cross-Stitch (.oxs) XML file.'
      );
    }
  };

  const handleFileSelected = async (file: File) => {
    const text = await file.text();
    handleLoadOxsText(text, file.name, file.size);
  };

  const handleLoadSample = () => {
    const sample = createSampleOxsProject();
    setProject(sample);
    setFileName('sample-woodland-toadstool.oxs');
    setRawXmlSizeKb(4);
    setSpotlightIdx(null);
    setErrorMsg(null);
  };

  // Compute physical dimensions and shopping metrics
  const metrics = useMemo(() => {
    if (!project) return null;
    const { width, height } = project.gridConfig;
    const dims = calculateCrossStitchDimensions(width, height, clothCount);
    const totalStitches = project.palette.reduce((sum, c) => sum + c.count, 0);
    const totalSkeins = project.palette.reduce(
      (sum, c) => sum + estimateDmcSkeins(c.count).skeinsToBuy,
      0
    );
    return { dims, totalStitches, totalSkeins };
  }, [project, clothCount]);

  // Draw preview canvas whenever project or display toggles change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !project) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = project.gridConfig.width;
    const h = project.gridConfig.height;
    const fitCell = Math.max(8, Math.min(28, Math.floor(620 / Math.max(w, h))));
    const cellPx = zoomScale === 'fit' ? fitCell : Math.round(fitCell * zoomScale);
    const pad = 16;

    const canvasW = w * cellPx + pad * 2;
    const canvasH = h * cellPx + pad * 2;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Cloth background
    ctx.fillStyle = '#f8f5ef';
    ctx.fillRect(pad, pad, w * cellPx, h * cellPx);

    // Draw stitches
    for (let y = 0; y < h; y++) {
      const row = project.gridData[y] || [];
      for (let x = 0; x < w; x++) {
        const ci = row[x];
        if (ci < 0 || !project.palette[ci]) continue;
        const color = project.palette[ci];
        const isDimmed = spotlightIdx !== null && spotlightIdx !== ci;

        ctx.save();
        if (isDimmed) ctx.globalAlpha = 0.16;
        ctx.fillStyle = color.hex;
        ctx.fillRect(pad + x * cellPx, pad + y * cellPx, cellPx, cellPx);

        if (showSymbols && cellPx >= 11 && color.symbol) {
          ctx.fillStyle = getContrastingTextColor(color.r, color.g, color.b);
          ctx.font = `700 ${Math.max(8, Math.floor(cellPx * 0.56))}px ui-monospace, SFMono-Regular, monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            color.symbol,
            pad + x * cellPx + cellPx / 2,
            pad + y * cellPx + cellPx / 2 + 0.5
          );
        }
        ctx.restore();
      }
    }

    // Grid lines
    if (showGrid) {
      for (let x = 0; x <= w; x++) {
        const isMajor = x % 10 === 0;
        ctx.strokeStyle = isMajor ? 'rgba(15, 23, 42, 0.55)' : 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = isMajor ? 1.4 : 0.7;
        ctx.beginPath();
        ctx.moveTo(pad + x * cellPx, pad);
        ctx.lineTo(pad + x * cellPx, pad + h * cellPx);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y++) {
        const isMajor = y % 10 === 0;
        ctx.strokeStyle = isMajor ? 'rgba(15, 23, 42, 0.55)' : 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = isMajor ? 1.4 : 0.7;
        ctx.beginPath();
        ctx.moveTo(pad, pad + y * cellPx);
        ctx.lineTo(pad + w * cellPx, pad + y * cellPx);
        ctx.stroke();
      }
    }

    // Backstitches
    if (showBackstitches && project.backstitches && project.backstitches.length > 0) {
      ctx.save();
      ctx.lineCap = 'round';
      for (const bs of project.backstitches) {
        const x1 = pad + bs.x1 * cellPx;
        const y1 = pad + bs.y1 * cellPx;
        const x2 = pad + bs.x2 * cellPx;
        const y2 = pad + bs.y2 * cellPx;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = Math.max(2.6, cellPx * 0.22);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.strokeStyle = bs.colorHex || '#111111';
        ctx.lineWidth = Math.max(1.5, cellPx * 0.13);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [project, showSymbols, showGrid, showBackstitches, zoomScale, spotlightIdx]);

  const handleOpenInStudio = () => {
    if (!project) return;
    queueProjectForStudio(project);
    navigate('/cross-stitch');
  };

  const handleCopyShoppingList = async () => {
    if (!project) return;
    const lines = project.palette.map((c) => {
      const sk = estimateDmcSkeins(c.count).skeinsToBuy;
      const anchor = getAnchorEquivalent(c.code);
      return `${c.brand === 'DMC' ? `DMC ${c.code}` : c.code || c.hex} (${c.name || c.hex})${
        anchor ? ` [Anchor ${anchor.code}]` : ''
      } — ${c.count.toLocaleString()} stitches • ${sk} ${sk === 1 ? 'skein' : 'skeins'}`;
    });
    const text = `${project.name} (${project.gridConfig.width}×${project.gridConfig.height}, ${clothCount}ct Aida)\n` + lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedShopping(true);
      setTimeout(() => setCopiedShopping(false), 2200);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleDownloadCsv = () => {
    if (!project) return;
    const header = 'Symbol,Brand,Code,Name,Hex,Anchor Equivalent,Stitches,Percent,Estimated Skeins (8m)';
    const rows = project.palette.map((c) => {
      const anchor = getAnchorEquivalent(c.code);
      const sk = estimateDmcSkeins(c.count).skeinsToBuy;
      const safeName = `"${(c.name || c.hex).replace(/"/g, '""')}"`;
      return `${c.symbol},${c.brand || 'DMC'},${c.code || ''},${safeName},${c.hex},${anchor?.code || ''},${c.count},${c.percentage}%,${sk}`;
    });
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-floss-list.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell>
      {/* Hero Banner */}
      <div className="space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <FileCode2 className="w-3.5 h-3.5" />
          <span>Open Cross-Stitch (.OXS v1.0) Inspector &amp; Converter</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Free Online <span className="text-emerald-400">.OXS</span> Pattern Viewer
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Preview charts from Pattern Keeper, WinStitch, MacStitch, or FlossCross right in your browser. Inspect exact DMC skein counts, Aida fabric dimensions, backstitches, and convert to printable PDF or Cricut-ready layered SVG.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Open .OXS File</span>
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Try Sample .OXS</span>
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".oxs,.xml"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileSelected(f);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Upload / Dropzone */}
      {!project ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFileSelected(f);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-3xl border-2 border-dashed p-10 sm:p-16 text-center transition space-y-4 ${
            isDragging
              ? 'border-emerald-400 bg-emerald-500/10'
              : 'border-slate-700/80 bg-slate-900/50 hover:border-indigo-500/60 hover:bg-slate-900/80'
          }`}
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FolderOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">Drop any .OXS pattern file here</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              100% private — your chart is parsed locally in browser memory and never uploaded to any server.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
              WinStitch &amp; MacStitch
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
              Pattern Keeper
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
              FlossCross
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
              Markup R-XP
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Loaded Pattern Summary & Quick Exports */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">{project.name}</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                  {fileName} ({rawXmlSizeKb} KB)
                </span>
              </div>
              {metrics && (
                <p className="text-xs text-slate-400">
                  {project.gridConfig.width} × {project.gridConfig.height} stitches •{' '}
                  {metrics.totalStitches.toLocaleString()} filled stitches •{' '}
                  {project.palette.length} colors •{' '}
                  {project.backstitches?.length || 0} backstitch lines
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenInStudio}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit &amp; Track in Studio</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  generatePatternPDF(project.gridData, project.palette, project.gridConfig, project.name, {
                    multiPage:
                      project.gridConfig.width > 50 || project.gridConfig.height > 50
                        ? '2x2'
                        : 'single',
                    includeWritten: false,
                    colorMode: 'color',
                    backstitches: project.backstitches,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <FileText className="w-3.5 h-3.5 text-pink-400" />
                <span>Printable PDF</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  generatePatternKeeperPDF(
                    project.gridData,
                    project.palette,
                    project.gridConfig,
                    project.name,
                    { colorMode: 'color', backstitches: project.backstitches }
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pattern Keeper PDF</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  exportPatternToSVG(project.gridData, project.palette, project.gridConfig, `${project.name}.svg`, {
                    title: project.name,
                    includeGridLines: true,
                    backstitches: project.backstitches,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Layered .SVG</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  exportPixelArtPNG(project.gridData, project.palette, 16, `${project.name}.png`)
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Crisp PNG</span>
              </button>
            </div>
          </div>

          {/* Two-Column Preview + Physical Fabric & Legend */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Interactive Canvas Preview */}
            <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSymbols((s) => !s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      showSymbols
                        ? 'bg-indigo-600/25 border-indigo-500/40 text-indigo-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Symbols
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGrid((g) => !g)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      showGrid
                        ? 'bg-indigo-600/25 border-indigo-500/40 text-indigo-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Grid className="w-3 h-3" />
                    <span>10×10 Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBackstitches((b) => !b)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      showBackstitches
                        ? 'bg-indigo-600/25 border-indigo-500/40 text-indigo-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Backstitches ({project.backstitches?.length || 0})
                  </button>
                  {spotlightIdx !== null && (
                    <button
                      type="button"
                      onClick={() => setSpotlightIdx(null)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-200"
                    >
                      Clear Spotlight
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                  {(['fit', 1, 1.5, 2] as const).map((z) => (
                    <button
                      key={String(z)}
                      type="button"
                      onClick={() => setZoomScale(z)}
                      className={`px-2 py-0.5 rounded font-semibold transition ${
                        zoomScale === z
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {z === 'fit' ? 'Fit' : `${z * 100}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-auto max-h-[580px] rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2">
                <canvas ref={canvasRef} className="rounded-lg shadow-xl" />
              </div>

              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Tip: Click any row in the floss key on the right to isolate and highlight its stitches.</span>
              </p>
            </div>

            {/* Right: Aida Sizing + Floss Shopping List */}
            <div className="lg:col-span-5 space-y-4">
              {/* Fabric Calculator Card */}
              {metrics && (
                <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-amber-400" />
                      <span>Finished Size &amp; Fabric Cut</span>
                    </h3>
                    <div className="flex items-center gap-1">
                      {CLOTH_COUNTS.map((ct) => (
                        <button
                          key={ct}
                          type="button"
                          onClick={() => setClothCount(ct)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                            clothCount === ct
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {ct}ct
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Design Area ({clothCount}ct)</div>
                      <div className="font-bold text-white mt-0.5">
                        {metrics.dims.dimensions.summary}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Recommended Cut (+3" margin)</div>
                      <div className="font-bold text-emerald-300 mt-0.5">
                        {metrics.dims.recommendedFabricSizeInches.width}" ×{' '}
                        {metrics.dims.recommendedFabricSizeInches.height}" ({metrics.dims.recommendedFabricSizeCm.width} ×{' '}
                        {metrics.dims.recommendedFabricSizeCm.height} cm)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Floss Legend & Skein Estimator */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Floss Key &amp; Shopping List
                    </h3>
                    {metrics && (
                      <p className="text-[11px] text-slate-400">
                        {project.palette.length} shades • ~{metrics.totalSkeins} total skeins (8m)
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyShoppingList}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 transition"
                    >
                      {copiedShopping ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy List</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCsv}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 transition"
                    >
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-800/80 border border-slate-800 rounded-xl bg-slate-950/70">
                  {project.palette.map((color, idx) => {
                    const anchor = getAnchorEquivalent(color.code);
                    const skeins = estimateDmcSkeins(color.count).skeinsToBuy;
                    const active = spotlightIdx === idx;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setSpotlightIdx((cur) => (cur === idx ? null : idx))}
                        className={`w-full px-3 py-2 flex items-center justify-between gap-3 text-left transition ${
                          active ? 'bg-indigo-600/20' : 'hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-7 h-7 rounded-lg border border-white/20 flex items-center justify-center font-mono text-xs font-bold shrink-0"
                            style={{
                              backgroundColor: color.hex,
                              color: getContrastingTextColor(color.r, color.g, color.b),
                            }}
                          >
                            {color.symbol}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {color.brand === 'DMC' ? `DMC ${color.code}` : color.code || color.hex}{' '}
                              <span className="font-normal text-slate-400">— {color.name || color.hex}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {color.hex}
                              {anchor ? ` • Anchor ${anchor.code}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-semibold text-slate-200">
                            {color.count.toLocaleString()} sts
                          </div>
                          <div className="text-[11px] text-emerald-400 font-medium">
                            {skeins} {skeins === 1 ? 'skein' : 'skeins'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
          {errorMsg}
        </div>
      )}

      {/* SEO & Compatibility Info Cards */}
      <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-1.5">
          <h3 className="font-bold text-white text-sm">What is an .OXS File?</h3>
          <p className="text-slate-400 leading-relaxed">
            Open Cross-Stitch (.oxs) is a human-readable XML exchange format used across WinStitch, MacStitch, FlossCross, Pattern Keeper, and Markup R-XP.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-1.5">
          <h3 className="font-bold text-white text-sm">Full Client-Side Privacy</h3>
          <p className="text-slate-400 leading-relaxed">
            Bought a chart from an indie designer or Etsy shop? Your `.oxs` stays strictly inside your browser tab — nothing is uploaded or stored online.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-1.5">
          <h3 className="font-bold text-white text-sm">Convert to PDF, SVG &amp; Crochet</h3>
          <p className="text-slate-400 leading-relaxed">
            Export high-contrast multi-page PDF booklets, Pattern Keeper vector charts, color-grouped Cricut SVG layers, or open in Studio to switch crafts.
          </p>
        </div>
      </section>
    </PageShell>
  );
};
