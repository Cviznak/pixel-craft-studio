import React, { useState, useEffect } from 'react';
import type { GridConfig, PaletteColor, CellProgress } from '../types/craft';
import { 
  exportPixelArtPNG, 
  exportPrintableGridPNG, 
  generatePatternPDF, 
  saveProjectJSON,
  exportBobbinLabelsPDF
} from '../utils/exportUtils';
import { buildShareablePatternUrl } from '../utils/shareUtils';
import { buildAmazonSuppliesUrl } from '../utils/amazonUtils';
import { getCraftDimensionsSummary } from '../utils/craftCalculator';
import { 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Printer, 
  X, 
  Sparkles, 
  Save, 
  ShoppingCart, 
  ExternalLink,
  BookOpen,
  Layers,
  Coffee,
  Share2,
  Tag,
  Link2,
  Check
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridData: number[][];
  palette: PaletteColor[];
  config: GridConfig;
  completedCells: CellProgress;
  onOpenWrittenInstructions?: () => void;
  onOpenSocialCard?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  gridData,
  palette,
  config,
  completedCells,
  onOpenWrittenInstructions,
  onOpenSocialCard,
}) => {
  const [projectName, setProjectName] = useState('My Pixel Craft Pattern');
  const [scale, setScale] = useState(16);
  const [isExporting, setIsExporting] = useState(false);
  const [pdfLayout, setPdfLayout] = useState<'single' | '2x2'>('single');
  const [colorMode, setColorMode] = useState<'color' | 'bw'>('color');
  const [includeWritten, setIncludeWritten] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalCells = config.width * config.height;

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      generatePatternPDF(gridData, palette, config, projectName, {
        multiPage: pdfLayout,
        includeWritten,
        colorMode,
      });
      setIsExporting(false);
    }, 100);
  };

  const handleCopyShareLink = async () => {
    const shareUrl = buildShareablePatternUrl(config, gridData, palette, projectName);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2500);
    } catch {
      window.prompt('Copy pattern share link:', shareUrl);
    }
  };

  const handleExportCleanPNG = () => {
    exportPixelArtPNG(gridData, palette, scale, `${projectName.toLowerCase().replace(/\s+/g, '-')}-pixelart.png`);
  };

  const handleExportChartPNG = () => {
    exportPrintableGridPNG(gridData, palette, 24, `${projectName.toLowerCase().replace(/\s+/g, '-')}-chart.png`);
  };

  const handleSaveJSON = () => {
    saveProjectJSON(projectName, config, gridData, palette, completedCells);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150 select-none"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[92vh] shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header - Always visible & pinned */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">Export & Print Craft Pattern</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close dialog (Esc)"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 space-y-4 text-sm overflow-y-auto flex-1 [scrollbar-width:thin] [scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {/* Project Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Pattern / Project Title
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. Cherry Blossom Perler"
            />
          </div>

          {/* Quick Stats & Physical Dimensions Pill */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-slate-400">
                Grid: <span className="font-bold text-slate-200">{config.width} × {config.height}</span> ({totalCells} stitches/beads)
              </div>
              <div className="text-slate-400">
                Palette: <span className="font-bold text-pink-400">{palette.length} colors</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Finished Size:</span>
              <span className="font-mono font-bold text-amber-300">
                {getCraftDimensionsSummary(config.width, config.height, config.craftType)}
              </span>
            </div>
          </div>

          {/* Export Options Cards */}
          <div className="space-y-2.5">
            {/* 1. PDF Printable Pattern */}
            <div className="p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-950/20 hover:bg-indigo-950/30 transition flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600/30 text-indigo-300 mt-0.5">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                      Printable Craft Chart (PDF)
                      <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded font-normal">
                        Recommended
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Includes 10x10 numbered symbol chart and thread/bead shopping list.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md transition shrink-0 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {isExporting ? 'Generating...' : 'Get PDF'}
                </button>
              </div>

              {/* Multi-Page & Written Options */}
              <div className="pt-2 border-t border-indigo-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Layout:</span>
                  <button
                    type="button"
                    onClick={() => setPdfLayout('single')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      pdfLayout === 'single'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Fit 1 Page
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfLayout('2x2')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
                      pdfLayout === '2x2'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Split pattern into 4 quadrant sheets with coordinate maps for easy printing"
                  >
                    <Layers className="w-3 h-3" />
                    <span>2×2 Poster (4 Sheets)</span>
                  </button>
                </div>

                {/* Color Mode: Full Color vs B&W Ink Saver */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Mode:</span>
                  <button
                    type="button"
                    onClick={() => setColorMode('color')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      colorMode === 'color'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Color
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode('bw')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      colorMode === 'bw'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Print black & white symbol chart to save colored printer ink"
                  >
                    B&W (Ink Saver)
                  </button>
                </div>

                {config.craftType === 'crochet' && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-pink-300 font-medium">
                    <input
                      type="checkbox"
                      checked={includeWritten}
                      onChange={(e) => setIncludeWritten(e.target.checked)}
                      className="rounded text-pink-600 focus:ring-0 w-3 h-3"
                    />
                    <span>Attach Written Rows</span>
                  </label>
                )}
              </div>
            </div>

            {/* 2. Floss Bobbin & Bead Drops Printable Labels */}
            <div className="p-3.5 rounded-xl border border-sky-500/40 bg-sky-950/20 hover:bg-sky-950/30 transition flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-sky-600/30 text-sky-300 mt-0.5">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                    <span>Floss Bobbin Labels & Drops (PDF)</span>
                    <span className="text-[10px] bg-sky-500/30 text-sky-300 px-1.5 py-0.2 rounded font-normal">
                      Print & Cut
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Cut-out labels for bobbins & organizer boxes with DMC/Anchor numbers, symbols & skein counts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => exportBobbinLabelsPDF(palette, projectName, config.craftType)}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-md transition shrink-0 flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                Bobbin PDF
              </button>
            </div>

            {/* 3. 1-Click Pattern Sharing Link */}
            <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-slate-950/60 hover:bg-slate-950/80 transition flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 mt-0.5">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                    <span>Share Pattern Link</span>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                      Instant Web Sync
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Copy a direct link to send to friends or open on your mobile or tablet.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCopyShareLink}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold shadow-md transition shrink-0 flex items-center gap-1.5 ${
                  isCopiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {isCopiedLink ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                <span>{isCopiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Written Row-by-Row Crochet Instructions Card */}
            {config.craftType === 'crochet' && onOpenWrittenInstructions && (
              <div className="p-3.5 rounded-xl border border-pink-500/40 bg-pink-950/20 hover:bg-pink-950/30 transition flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-pink-600/30 text-pink-300 mt-0.5">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                      Written Row-by-Row Crochet Instructions
                      <span className="text-[10px] bg-pink-500/30 text-pink-300 px-1.5 py-0.2 rounded font-normal">
                        New
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Read stitch counts row-by-row with interactive completion checkboxes.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenWrittenInstructions();
                  }}
                  className="px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold shadow-md transition shrink-0 flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open</span>
                </button>
              </div>
            )}

            {/* 2. High-Res Symbol Chart PNG */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/70 transition flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 mt-0.5">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-xs">
                    Symbol Chart Image (PNG)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Large image with numbered rulers, 10x10 grid, and high-contrast craft symbols.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportChartPNG}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 shadow-md transition shrink-0 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Chart PNG
              </button>
            </div>

            {/* 3. Crisp Pixel Art PNG */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/70 transition flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-xs">
                    Clean Pixel Art (PNG)
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-400">Scale:</span>
                    {[8, 16, 24].map((s) => (
                      <button
                        key={s}
                        onClick={() => setScale(s)}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          scale === s ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                    <span className="text-[10px] text-slate-500">({config.width * scale}×{config.height * scale}px)</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleExportCleanPNG}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 shadow-md transition shrink-0 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Pixel PNG
              </button>
            </div>

            {/* 4. Save Project JSON */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/70 transition flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 mt-0.5">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-xs">
                    Save Project Data (JSON)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Saves your grid, custom palette edits, and craft tracker progress to reopen anytime.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSaveJSON}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 shadow-md transition shrink-0 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Save JSON
              </button>
            </div>

            {/* 5. Aesthetic Social Card Generator */}
            {onOpenSocialCard && (
              <div className="p-3.5 rounded-xl border border-pink-500/30 bg-gradient-to-r from-pink-950/20 to-purple-950/20 hover:from-pink-950/30 hover:to-purple-950/30 transition flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400 mt-0.5">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                      <span>Social Card Generator</span>
                      <span className="px-1.5 py-0.5 bg-pink-500/20 text-pink-300 text-[9px] rounded-full font-bold">Pinterest • TikTok</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Create aesthetic shareable graphics with color palette dots & 1-click clipboard copy.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSocialCard();
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-lg text-xs font-bold shadow-md transition shrink-0 flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Create Card
                </button>
              </div>
            )}

            {/* 6. Craft Supplies & Support Banner */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Amazon Supplies Kit */}
              <a
                href={buildAmazonSuppliesUrl(config.craftType)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/30 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-200 text-xs">
                      {config.craftType === 'crochet' ? 'Crochet Yarn on Amazon' : 'Craft Supplies on Amazon'}
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      {config.craftType === 'crochet' ? 'Find yarn skeins & hook kits' : 'Find beads, thread & boards'}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition" />
              </a>

              {/* Buy Me a Coffee */}
              <a
                href="https://buymeacoffee.com/orjustdosomething"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl border border-yellow-500/30 bg-yellow-950/20 hover:bg-yellow-950/30 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-yellow-400/20 text-yellow-300">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-200 text-xs">Buy Me a Coffee</h5>
                    <p className="text-[10px] text-slate-400">Support free craft tools</p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-yellow-300 transition" />
              </a>
            </div>

            {/* Amazon Affiliate Legal Disclosure */}
            <p className="text-[10px] text-slate-500 text-center italic pt-1">
              As an Amazon Associate I earn from qualifying purchases.
            </p>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Esc</kbd> to close
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
