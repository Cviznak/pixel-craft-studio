import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Scissors,
  X,
  Check,
  Wand2,
  Eraser,
  Paintbrush,
  RotateCcw,
  Undo2,
  Eye,
  Sparkles,
  Crosshair,
} from 'lucide-react';
import {
  removeImageBackground,
  type BgRemovalMode,
  type BgSeedPoint,
  type BgBrushStroke,
} from '../utils/backgroundRemover';

interface BackgroundRemoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  gridWidth: number;
  gridHeight: number;
  onApplyCutout: (cutoutDataUrl: string) => void;
}

type BackdropPreset = 'dark' | 'light' | 'aida';
type TouchUpTool = 'seed' | 'erase' | 'restore';

export const BackgroundRemoverModal: React.FC<BackgroundRemoverModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  gridWidth,
  gridHeight,
  onApplyCutout,
}) => {
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<BgRemovalMode>('auto-edge');
  const [tolerance, setTolerance] = useState<number>(26);
  const [smoothEdges, setSmoothEdges] = useState<boolean>(true);
  const [autoTrim, setAutoTrim] = useState<boolean>(true);
  const [backdrop, setBackdrop] = useState<BackdropPreset>('dark');
  const [touchTool, setTouchTool] = useState<TouchUpTool>('seed');
  const [brushSize, setBrushSize] = useState<number>(0.045);

  const [seeds, setSeeds] = useState<BgSeedPoint[]>([]);
  const [strokes, setStrokes] = useState<BgBrushStroke[]>([]);
  const [actionStack, setActionStack] = useState<Array<'seed' | { count: number }>>([]);
  const [isComparingOriginal, setIsComparingOriginal] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentBatchCountRef = useRef<number>(0);

  const [prevSessionKey, setPrevSessionKey] = useState<string>('');
  const sessionKey = isOpen ? imageUrl : '';
  if (sessionKey !== prevSessionKey) {
    setPrevSessionKey(sessionKey);
    if (isOpen) {
      setSeeds([]);
      setStrokes([]);
      setActionStack([]);
      setTouchTool('seed');
      setMode('auto-edge');
      setTolerance(26);
    }
  }

  // Load image whenever URL changes while open
  useEffect(() => {
    if (!isOpen || !imageUrl) return;
    let active = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (active) setImgElement(img);
    };
    img.src = imageUrl;
    return () => {
      active = false;
    };
  }, [isOpen, imageUrl]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute interactive untrimmed preview (keeps cursor coordinates 1:1 with source image)
  const previewResult = useMemo(() => {
    if (!isOpen || !imgElement) return null;
    try {
      return removeImageBackground(
        imgElement,
        {
          mode,
          tolerance,
          smoothEdges,
          autoTrim: false,
          seeds,
          strokes,
        },
        560
      );
    } catch {
      return null;
    }
  }, [isOpen, imgElement, mode, tolerance, smoothEdges, seeds, strokes]);

  // Paint preview canvas (either cutout result or original compare)
  useEffect(() => {
    const targetCanvas = canvasRef.current;
    if (!targetCanvas || !imgElement || !previewResult) return;

    targetCanvas.width = previewResult.canvas.width;
    targetCanvas.height = previewResult.canvas.height;
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    if (isComparingOriginal) {
      ctx.drawImage(imgElement, 0, 0, targetCanvas.width, targetCanvas.height);
    } else {
      ctx.drawImage(previewResult.canvas, 0, 0);
    }
  }, [imgElement, previewResult, isComparingOriginal]);

  const getNormalizedCoords = (e: React.PointerEvent<HTMLCanvasElement>): BgSeedPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getNormalizedCoords(e);
    if (!pt) return;

    if (touchTool === 'seed') {
      // If clicking on Auto mode without seeds, switch smoothly or append seed
      setSeeds((prev) => [...prev, pt]);
      setActionStack((prev) => [...prev, 'seed']);
      return;
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    currentBatchCountRef.current = 1;
    const stroke: BgBrushStroke = {
      x: pt.x,
      y: pt.y,
      radius: brushSize,
      action: touchTool === 'erase' ? 'erase' : 'restore',
    };
    setStrokes((prev) => [...prev, stroke]);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || touchTool === 'seed') return;
    const pt = getNormalizedCoords(e);
    if (!pt) return;
    currentBatchCountRef.current += 1;
    const stroke: BgBrushStroke = {
      x: pt.x,
      y: pt.y,
      radius: brushSize,
      action: touchTool === 'erase' ? 'erase' : 'restore',
    };
    setStrokes((prev) => [...prev, stroke]);
  };

  const finishStroke = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const count = currentBatchCountRef.current;
    currentBatchCountRef.current = 0;
    if (count > 0) {
      setActionStack((prev) => [...prev, { count }]);
    }
  };

  const handleUndoLast = () => {
    if (actionStack.length === 0) return;
    const last = actionStack[actionStack.length - 1];
    setActionStack((prev) => prev.slice(0, -1));
    if (last === 'seed') {
      setSeeds((prev) => prev.slice(0, -1));
    } else {
      setStrokes((prev) => prev.slice(0, Math.max(0, prev.length - last.count)));
    }
  };

  const handleResetAll = () => {
    setSeeds([]);
    setStrokes([]);
    setActionStack([]);
    setMode('auto-edge');
    setTolerance(26);
    setSmoothEdges(true);
    setAutoTrim(true);
  };

  const handleApplyCutoutClick = () => {
    if (!imgElement) return;
    setIsApplying(true);
    setTimeout(() => {
      try {
        const finalResult = removeImageBackground(
          imgElement,
          {
            mode,
            tolerance,
            smoothEdges,
            autoTrim,
            seeds,
            strokes,
          },
          1024
        );
        onApplyCutout(finalResult.dataUrl);
        onClose();
      } finally {
        setIsApplying(false);
      }
    }, 30);
  };

  if (!isOpen) return null;

  const removedPercent = previewResult?.removedPercent ?? 0;
  const totalGridCells = Math.max(1, gridWidth * gridHeight);
  const estimatedSavedCells = Math.round((removedPercent / 100) * totalGridCells);

  const backdropStyle: React.CSSProperties =
    backdrop === 'dark'
      ? {
          backgroundColor: '#0f172a',
          backgroundImage:
            'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }
      : backdrop === 'light'
      ? {
          backgroundColor: '#e2e8f0',
          backgroundImage:
            'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }
      : {
          backgroundColor: '#f5efe2',
        };

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
        {/* 1. Pinned Header */}
        <div className="shrink-0 p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 shrink-0">
              <Scissors className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  Smart Background Remover & Subject Cutout
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
                  Zero API Cost • Instant
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Strip noisy photo backgrounds so empty cells are automatically skipped when stitching or beading
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

        {/* 2. Body: Left Preview Canvas + Right Controls */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          {/* Preview Canvas Stage */}
          <div className="flex-1 min-h-[280px] p-3 sm:p-4 bg-slate-950/70 flex flex-col items-center justify-between gap-3">
            {/* Top Preview Utility Bar */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold px-1.5">Backdrop:</span>
                {(
                  [
                    { id: 'dark', label: 'Dark Grid' },
                    { id: 'light', label: 'Light Grid' },
                    { id: 'aida', label: 'Aida Cream' },
                  ] as const
                ).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBackdrop(b.id)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition ${
                      backdrop === b.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onPointerDown={() => setIsComparingOriginal(true)}
                onPointerUp={() => setIsComparingOriginal(false)}
                onPointerLeave={() => setIsComparingOriginal(false)}
                className={`px-3 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                  isComparingOriginal
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>{isComparingOriginal ? 'Showing Original' : 'Hold to Compare Original'}</span>
              </button>
            </div>

            {/* Canvas Wrapper */}
            <div
              className="flex-1 w-full min-h-[240px] max-h-[54vh] rounded-2xl border border-slate-800 flex items-center justify-center p-3 overflow-hidden relative shadow-inner"
              style={backdropStyle}
            >
              {imgElement ? (
                <canvas
                  ref={canvasRef}
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={finishStroke}
                  onPointerCancel={finishStroke}
                  className={`max-w-full max-h-full object-contain touch-none rounded shadow-xl ${
                    touchTool === 'seed' ? 'cursor-crosshair' : 'cursor-cell'
                  }`}
                />
              ) : (
                <div className="text-xs text-slate-400">Loading image...</div>
              )}
            </div>

            {/* Live Stitch Savings Stat Banner */}
            <div className="w-full p-2.5 sm:px-3.5 rounded-xl bg-teal-950/30 border border-teal-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-teal-200">
                <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
                <span>
                  Background removed: <strong className="font-mono text-white">{removedPercent}%</strong>
                </span>
              </div>
              <div className="text-[11px] font-mono font-bold text-emerald-300">
                ~{estimatedSavedCells.toLocaleString()} background stitches/beads saved!
              </div>
            </div>
          </div>

          {/* Right Controls Sidebar */}
          <div className="w-full lg:w-80 shrink-0 p-3.5 sm:p-4 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900 space-y-4 overflow-y-auto [scrollbar-width:thin]">
            {/* 1. Detection Mode */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                1. Cutout Mode
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  {
                    id: 'auto-edge' as const,
                    label: 'Auto Border Cutout',
                    desc: 'Flood-fills outer backdrop automatically',
                  },
                  {
                    id: 'magic-wand' as const,
                    label: 'Click Regions (Wand)',
                    desc: 'Click isolated backdrop pockets or loops',
                  },
                  {
                    id: 'global-color' as const,
                    label: 'Global Color Key',
                    desc: 'Removes matching shades anywhere inside holes',
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={`p-2 rounded-xl border text-left transition ${
                      mode === m.id
                        ? 'bg-teal-500/15 border-teal-500/60 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{m.label}</div>
                    <div className="text-[10px] text-slate-400">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Interactive Touch-Up Tools */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                2. Touch-Up Canvas Tool
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTouchTool('seed')}
                  className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                    touchTool === 'seed'
                      ? 'bg-indigo-600/25 border-indigo-400 text-indigo-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Pick Area</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTouchTool('erase')}
                  className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                    touchTool === 'erase'
                      ? 'bg-rose-600/25 border-rose-400 text-rose-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Erase BG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTouchTool('restore')}
                  className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                    touchTool === 'restore'
                      ? 'bg-emerald-600/25 border-emerald-400 text-emerald-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                {touchTool === 'seed'
                  ? 'Click any background area on the image to add it to the cutout.'
                  : touchTool === 'erase'
                  ? 'Paint across unwanted artifacts to erase them cleanly.'
                  : 'Paint over subject details to bring them back.'}
              </p>

              {touchTool !== 'seed' && (
                <div className="pt-1 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Brush Radius</span>
                    <span className="font-mono text-indigo-300">
                      {Math.round(brushSize * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.015"
                    max="0.12"
                    step="0.005"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* 3. Sensitivity & Refinements */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-200 font-semibold">
                  <span>Color Tolerance (ΔE)</span>
                  <span className="font-mono text-teal-300">{tolerance}</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="68"
                  step="1"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Tight Edge</span>
                  <span>Aggressive</span>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smoothEdges}
                  onChange={(e) => setSmoothEdges(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Defringe halos & clean dust specks</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoTrim}
                  onChange={(e) => setAutoTrim(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Auto-trim empty outer borders on apply</span>
              </label>
            </div>

            {/* 4. Undo / Reset */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleUndoLast}
                disabled={actionStack.length === 0}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo Edit</span>
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Pinned Footer */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Transparent cells will switch to "Empty / Skip" mode automatically.</span>
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
              onClick={handleApplyCutoutClick}
              disabled={!imgElement || isApplying}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isApplying ? 'Processing Cutout...' : 'Apply Cutout to Pattern'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
