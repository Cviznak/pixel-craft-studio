import React, { useState } from 'react';
import type { GridConfig, PaletteColor, CellProgress } from '../types/craft';
import { 
  exportPixelArtPNG, 
  exportPrintableGridPNG, 
  generatePatternPDF, 
  saveProjectJSON 
} from '../utils/exportUtils';
import { buildAmazonSuppliesUrl } from '../utils/amazonUtils';
import { 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Printer, 
  X, 
  Sparkles,
  Save,
  Coffee,
  ShoppingCart,
  ExternalLink
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridData: number[][];
  palette: PaletteColor[];
  config: GridConfig;
  completedCells: CellProgress;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  gridData,
  palette,
  config,
  completedCells,
}) => {
  const [projectName, setProjectName] = useState('My Pixel Craft Pattern');
  const [scale, setScale] = useState(16);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const totalCells = config.width * config.height;

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      generatePatternPDF(gridData, palette, config, projectName);
      setIsExporting(false);
    }, 100);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">Export & Print Craft Pattern</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm">
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

          {/* Quick Stats Pill */}
          <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
            <div className="text-slate-400">
              Grid: <span className="font-bold text-slate-200">{config.width} × {config.height}</span> ({totalCells} stitches/beads)
            </div>
            <div className="text-slate-400">
              Palette: <span className="font-bold text-pink-400">{palette.length} colors</span>
            </div>
          </div>

          {/* Export Options Cards */}
          <div className="space-y-2.5">
            {/* 1. PDF Printable Pattern */}
            <div className="p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-950/20 hover:bg-indigo-950/30 transition flex items-center justify-between">
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
                    Includes 10x10 numbered symbol chart and thread/bead shopping list with DMC/Perler codes.
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

            {/* 5. Craft Supplies & Support Banner */}
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
                    <h5 className="font-bold text-slate-200 text-xs">Craft Supplies on Amazon</h5>
                    <p className="text-[10px] text-slate-400">Find beads, thread & boards</p>
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
