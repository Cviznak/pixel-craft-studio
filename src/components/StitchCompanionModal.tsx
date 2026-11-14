import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Smartphone
} from 'lucide-react';
import type { PaletteColor, CellProgress } from '../types/craft';
import { audioFeedback } from '../utils/audioFeedback';

interface StitchCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridData: number[][];
  palette: PaletteColor[];
  completedCells: CellProgress;
  onBatchSetCellsCompleted: (updates: { x: number; y: number; completed: boolean }[]) => void;
}

export const StitchCompanionModal: React.FC<StitchCompanionModalProps> = ({
  isOpen,
  onClose,
  gridData,
  palette,
  completedCells,
  onBatchSetCellsCompleted,
}) => {
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const wakeLockRef = useRef<any>(null);

  const gridHeight = gridData.length;
  const gridWidth = gridHeight > 0 ? gridData[0].length : 0;

  // Screen Wake Lock API to prevent phone/tablet screen from sleeping
  useEffect(() => {
    if (!isOpen) return;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock not available or denied:', err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isOpen]);

  // Current row runs (contiguous blocks of same color for effortless reading)
  const rowRuns = useMemo(() => {
    if (currentRow < 0 || currentRow >= gridHeight) return [];
    const row = gridData[currentRow];
    if (!row) return [];

    interface Run {
      colorIdx: number;
      color: PaletteColor;
      count: number;
      startX: number;
      endX: number;
      isDone: boolean;
    }

    const runs: Run[] = [];
    let curColor = row[0];
    let curCount = 0;
    let runStartX = 0;

    for (let x = 0; x < gridWidth; x++) {
      const colorIdx = row[x];
      if (colorIdx === curColor) {
        curCount++;
      } else {
        const color = palette[curColor] || palette[0];
        let allDone = true;
        for (let bx = runStartX; bx < x; bx++) {
          if (!completedCells[`${bx},${currentRow}`]) {
            allDone = false;
            break;
          }
        }

        runs.push({
          colorIdx: curColor,
          color,
          count: curCount,
          startX: runStartX,
          endX: x - 1,
          isDone: allDone,
        });

        curColor = colorIdx;
        curCount = 1;
        runStartX = x;
      }
    }

    if (curCount > 0) {
      const color = palette[curColor] || palette[0];
      let allDone = true;
      for (let bx = runStartX; bx < gridWidth; bx++) {
        if (!completedCells[`${bx},${currentRow}`]) {
          allDone = false;
          break;
        }
      }
      runs.push({
        colorIdx: curColor,
        color,
        count: curCount,
        startX: runStartX,
        endX: gridWidth - 1,
        isDone: allDone,
      });
    }

    return runs;
  }, [currentRow, gridData, palette, completedCells, gridWidth, gridHeight]);

  // Mark current row complete and advance to next row
  const handleMarkRowCompleteAndAdvance = () => {
    const cellsToMark: { x: number; y: number; completed: boolean }[] = [];
    for (let x = 0; x < gridWidth; x++) {
      cellsToMark.push({ x, y: currentRow, completed: true });
    }
    onBatchSetCellsCompleted(cellsToMark);

    if (soundEnabled) {
      audioFeedback.playCelebrationChime();
    }

    if (currentRow < gridHeight - 1) {
      setCurrentRow((prev) => prev + 1);
    }
  };

  // Keyboard navigation (Space, ArrowRight, ArrowLeft)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleMarkRowCompleteAndAdvance();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentRow((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentRow, gridHeight, soundEnabled]);

  if (!isOpen) return null;

  const rowProgressPct = Math.round(((currentRow + 1) / Math.max(1, gridHeight)) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Ambient Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              Stitch Companion Focus Mode
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                WakeLock Active 📱
              </span>
            </h2>
            <span className="text-[11px] text-slate-400">
              Screen stays awake • Tap anywhere or press Space to advance
            </span>
          </div>
        </div>

        {/* Audio Toggle & Exit */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute sound' : 'Enable audio feedback'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Focus</span>
          </button>
        </div>
      </div>

      {/* Main Companion Body */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-between p-4 sm:p-8 max-w-4xl mx-auto w-full">
        {/* Row Header Information */}
        <div className="flex flex-col gap-2 text-center">
          <div className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
            {currentRow % 2 === 0 ? 'Right Side (L → R)' : 'Wrong Side (R → L)'}
          </div>

          <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Row {currentRow + 1} <span className="text-slate-500 text-2xl font-normal">of {gridHeight}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 mt-2">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-pink-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${rowProgressPct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400">{rowProgressPct}% Pattern Progress</span>
        </div>

        {/* Visual High-Contrast Row Breakdown */}
        <div className="my-6 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>Color Sequences in Row {currentRow + 1}:</span>
            <span>{gridWidth} stitches total</span>
          </div>

          {/* Graphic Bar of the row */}
          <div className="h-10 w-full rounded-2xl overflow-hidden flex border-2 border-slate-700 shadow-2xl">
            {rowRuns.map((run, i) => (
              <div
                key={i}
                className="h-full relative group transition-all"
                style={{
                  width: `${(run.count / gridWidth) * 100}%`,
                  backgroundColor: run.color.hex,
                }}
                title={`${run.count}x ${run.color.name || run.color.code}`}
              />
            ))}
          </div>

          {/* Large Color Run Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mt-2">
            {rowRuns.map((run, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition ${
                  run.isDone
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : 'bg-slate-900/90 border-slate-700/80 shadow-lg'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl shadow-md shrink-0 border border-white/20 flex items-center justify-center font-bold text-sm text-white"
                  style={{ backgroundColor: run.color.hex }}
                >
                  {run.color.symbol}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-black text-white font-mono leading-none">
                    {run.count} <span className="text-xs font-sans text-slate-400 font-semibold">stitches</span>
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate mt-0.5">
                    {run.color.code || run.color.hex}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {run.color.name || 'Custom'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Giant Next / Complete Row Action Buttons */}
        <div className="flex items-center gap-3 w-full max-w-xl mx-auto pt-4">
          <button
            onClick={() => setCurrentRow((prev) => Math.max(0, prev - 1))}
            disabled={currentRow === 0}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition active:scale-95 disabled:opacity-40"
            title="Previous Row"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleMarkRowCompleteAndAdvance}
            className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-2xl shadow-emerald-600/30 transition active:scale-98 flex items-center justify-center gap-3"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-200" />
            <span>Mark Row Complete & Advance</span>
            <ChevronRight className="w-5 h-5 opacity-75" />
          </button>
        </div>
      </div>
    </div>
  );
};
