import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Frame, X, Check, Sparkles, Maximize2, Layers } from 'lucide-react';
import type { PaletteColor } from '../types/craft';
import {
  BORDER_PRESETS,
  generateFramedGrid,
  type BorderStyleId,
} from '../utils/borderGenerator';

interface BorderBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridData: number[][];
  palette: PaletteColor[];
  onApplyFramedGrid: (newGrid: number[][], newWidth: number, newHeight: number) => void;
}

export const BorderBuilderModal: React.FC<BorderBuilderModalProps> = ({
  isOpen,
  onClose,
  gridData,
  palette,
  onApplyFramedGrid,
}) => {
  const [style, setStyle] = useState<BorderStyleId>('floral-vine');
  const [placement, setPlacement] = useState<'expand' | 'overlay'>('expand');
  const [padding, setPadding] = useState<number>(2);
  const [primaryIdx, setPrimaryIdx] = useState<number>(0);
  const [accentIdx, setAccentIdx] = useState<number>(Math.min(1, Math.max(0, palette.length - 1)));
  const [bgIdx, setBgIdx] = useState<number>(-1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [prevOpen, setPrevOpen] = useState(false);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen && palette.length > 0) {
      // Pick dark contrast as default primary & vibrant color as accent
      let darkestIdx = 0;
      let darkestLum = 999;
      let brightestIdx = 0;
      let maxSat = -1;
      palette.forEach((c, idx) => {
        const lum = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
        if (lum < darkestLum) {
          darkestLum = lum;
          darkestIdx = idx;
        }
        const maxC = Math.max(c.r, c.g, c.b);
        const minC = Math.min(c.r, c.g, c.b);
        const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
        if (sat > maxSat) {
          maxSat = sat;
          brightestIdx = idx;
        }
      });
      setPrimaryIdx(darkestIdx);
      setAccentIdx(brightestIdx !== darkestIdx ? brightestIdx : Math.min(1, palette.length - 1));
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const safePrimary = Math.max(0, Math.min(Math.max(0, palette.length - 1), primaryIdx));
  const safeAccent = Math.max(0, Math.min(Math.max(0, palette.length - 1), accentIdx));
  const safeBg = bgIdx >= palette.length ? -1 : bgIdx;

  const previewResult = useMemo(() => {
    if (!isOpen || gridData.length === 0) return null;
    return generateFramedGrid(gridData, {
      style,
      placement,
      padding,
      primaryColorIndex: safePrimary,
      accentColorIndex: safeAccent,
      bgColorIndex: safeBg,
    });
  }, [isOpen, gridData, style, placement, padding, safePrimary, safeAccent, safeBg]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !previewResult || previewResult.newWidth === 0 || previewResult.newHeight === 0) {
      return;
    }

    const maxSize = 420;
    const w = previewResult.newWidth;
    const h = previewResult.newHeight;
    const cell = Math.max(2, Math.floor(Math.min(maxSize / w, maxSize / h)));

    canvas.width = w * cell;
    canvas.height = h * cell;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = previewResult.newGrid[y][x];
        if (idx < 0 || !palette[idx]) {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#1e293b' : '#0f172a';
        } else {
          ctx.fillStyle = palette[idx].hex;
        }
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }, [previewResult, palette]);

  if (!isOpen || !previewResult) return null;

  const origH = gridData.length;
  const origW = origH > 0 ? gridData[0].length : 0;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[93vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Pinned Header */}
        <div className="shrink-0 p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <Frame className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  Decorative Border &amp; Sampler Frame Builder
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  8 Heirloom Styles
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Wrap any motif, monogram, or Etsy chart with symmetrical botanical or geometric corners
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Left Preview + Right Controls */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          {/* Live Canvas Preview */}
          <div className="flex-1 p-4 bg-slate-950/70 flex flex-col items-center justify-center gap-3 min-h-[260px]">
            <div className="flex-1 w-full flex items-center justify-center p-2">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[46vh] object-contain rounded-lg border border-slate-700/80 shadow-2xl"
              />
            </div>

            {/* Dimension Summary Strip */}
            <div className="w-full p-2.5 sm:px-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Size: <strong className="font-mono text-slate-400">{origW}×{origH}</strong> →{' '}
                  <strong className="font-mono text-white">
                    {previewResult.newWidth}×{previewResult.newHeight}
                  </strong>
                </span>
              </div>
              <div className="text-[11px] font-mono font-bold text-amber-300">
                +{previewResult.borderCellsCount.toLocaleString()} frame stitches/beads
              </div>
            </div>

            {previewResult.clampedToOverlay && (
              <p className="text-[11px] text-amber-300 bg-amber-950/30 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                Expanded size exceeds 160 max grid width/height — switched automatically to Outer Edge Overlay.
              </p>
            )}
          </div>

          {/* Right Configuration Panel */}
          <div className="w-full lg:w-96 shrink-0 p-4 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900 space-y-4 overflow-y-auto [scrollbar-width:thin]">
            {/* 1. Frame Style Presets */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                1. Choose Frame Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
                {BORDER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setStyle(preset.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-start justify-between gap-2 ${
                      style === preset.id
                        ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{preset.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {preset.thickness}px
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {preset.description}
                      </p>
                    </div>
                    <span className="text-[9px] font-semibold text-amber-300/90 shrink-0">
                      {preset.bestFor}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Placement & Margin */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>2. Placement &amp; Breathing Space</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPlacement('expand')}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition ${
                    placement === 'expand'
                      ? 'bg-indigo-600/25 border-indigo-400 text-indigo-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Expand Canvas
                </button>
                <button
                  type="button"
                  onClick={() => setPlacement('overlay')}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition ${
                    placement === 'overlay'
                      ? 'bg-indigo-600/25 border-indigo-400 text-indigo-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Overlay Edge
                </button>
              </div>

              {placement === 'expand' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Inner Padding (Gap)</span>
                    <span className="font-mono text-amber-300">{padding} cells</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    value={padding}
                    onChange={(e) => setPadding(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* 3. Frame Colors */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div>
                <div className="text-[11px] font-bold text-slate-300 mb-1.5">
                  Primary Line / Vine Color
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {palette.map((c, idx) => (
                    <button
                      key={`prim-${c.id}`}
                      type="button"
                      onClick={() => setPrimaryIdx(idx)}
                      className={`w-6 h-6 rounded-lg border-2 transition ${
                        safePrimary === idx
                          ? 'border-white scale-110 ring-2 ring-amber-400/60'
                          : 'border-white/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name || c.code || c.hex}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-300 mb-1.5">
                  Accent Flower / Corner Color
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {palette.map((c, idx) => (
                    <button
                      key={`acc-${c.id}`}
                      type="button"
                      onClick={() => setAccentIdx(idx)}
                      className={`w-6 h-6 rounded-lg border-2 transition ${
                        safeAccent === idx
                          ? 'border-white scale-110 ring-2 ring-pink-400/60'
                          : 'border-white/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name || c.code || c.hex}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-300 mb-1.5">
                  Margin Background Fill
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <button
                    type="button"
                    onClick={() => setBgIdx(-1)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                      safeBg === -1
                        ? 'bg-emerald-600/25 border-emerald-400 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Empty / Skip
                  </button>
                  {palette.slice(0, 10).map((c, idx) => (
                    <button
                      key={`bg-${c.id}`}
                      type="button"
                      onClick={() => setBgIdx(idx)}
                      className={`w-6 h-6 rounded-lg border-2 transition ${
                        safeBg === idx
                          ? 'border-white scale-110 ring-2 ring-indigo-400/60'
                          : 'border-white/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name || c.code || c.hex}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Saves cleanly to Undo history (`Ctrl+Z` reverts anytime).</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onApplyFramedGrid(
                  previewResult.newGrid,
                  previewResult.newWidth,
                  previewResult.newHeight
                );
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Apply Frame to Pattern</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
