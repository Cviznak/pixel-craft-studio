import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Volume2,
  VolumeX,
  Smartphone,
  Play,
  Pause,
  Mic,
  ArrowLeftRight,
  SkipForward,
  Square,
} from 'lucide-react';
import type { PaletteColor, CellProgress, CraftType } from '../types/craft';
import { audioFeedback } from '../utils/audioFeedback';
import { getContrastingTextColor } from '../utils/colorUtils';
import {
  isSpeechSupported,
  speakText,
  stopSpeaking,
  getCraftUnitName,
  formatColorRunSpeech,
  formatFullRowSpeech,
} from '../utils/voiceNarrator';

interface StitchCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridData: number[][];
  palette: PaletteColor[];
  completedCells: CellProgress;
  craftType?: CraftType;
  onBatchSetCellsCompleted: (updates: { x: number; y: number; completed: boolean }[]) => void;
}

type ReadingDirectionMode = 'alternating' | 'ltr';

interface RowRun {
  colorIdx: number;
  isEmpty: boolean;
  color: PaletteColor | null;
  count: number;
  startX: number;
  endX: number;
  isDone: boolean;
}

function defaultDirectionForCraft(craftType: CraftType): ReadingDirectionMode {
  return craftType === 'crochet' || craftType === 'knitting' || craftType === 'alpha'
    ? 'alternating'
    : 'ltr';
}

export const StitchCompanionModal: React.FC<StitchCompanionModalProps> = ({
  isOpen,
  onClose,
  gridData,
  palette,
  completedCells,
  craftType = 'crochet',
  onBatchSetCellsCompleted,
}) => {
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [readingDirection, setReadingDirection] = useState<ReadingDirectionMode>(() =>
    defaultDirectionForCraft(craftType)
  );
  const [prevCraftType, setPrevCraftType] = useState<CraftType>(craftType);

  // Hands-Free Voice Read-Aloud & Block Stepper State
  const speechAvailable = isSpeechSupported();
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(speechAvailable);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [activeRunIndex, setActiveRunIndex] = useState<number>(0);
  const [autoPaceSeconds, setAutoPaceSeconds] = useState<0 | 4 | 7 | 12>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState<boolean>(false);

  const wakeLockRef = useRef<any>(null);

  if (craftType !== prevCraftType) {
    setPrevCraftType(craftType);
    setReadingDirection(defaultDirectionForCraft(craftType));
  }

  const gridHeight = gridData.length;
  const gridWidth = gridHeight > 0 ? gridData[0].length : 0;
  const isRowReversed = readingDirection === 'alternating' && currentRow % 2 === 1;
  const rowDirectionLabel =
    readingDirection === 'alternating'
      ? isRowReversed
        ? 'Wrong Side (R → L)'
        : 'Right Side (L → R)'
      : 'Left to Right (L → R)';
  const spokenDirectionLabel =
    readingDirection === 'alternating'
      ? isRowReversed
        ? 'wrong side, right to left'
        : 'right side, left to right'
      : 'left to right';

  // Screen Wake Lock API + speech cleanup
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      return;
    }

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
      stopSpeaking();
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isOpen]);

  // Compute contiguous color runs in actual stitch scan order (handles R->L turn and -1 empty cells safely)
  const buildRunsForRow = useCallback(
    (rowIdx: number): RowRun[] => {
      if (rowIdx < 0 || rowIdx >= gridHeight || gridWidth === 0) return [];
      const row = gridData[rowIdx];
      if (!row) return [];

      const reversed = readingDirection === 'alternating' && rowIdx % 2 === 1;
      const orderedX: number[] = [];
      if (reversed) {
        for (let x = gridWidth - 1; x >= 0; x--) orderedX.push(x);
      } else {
        for (let x = 0; x < gridWidth; x++) orderedX.push(x);
      }

      const runs: RowRun[] = [];
      let curColorIdx = row[orderedX[0]];
      let curCount = 0;
      let segXs: number[] = [];

      const flushRun = () => {
        if (curCount === 0) return;
        const isEmpty = curColorIdx < 0 || !palette[curColorIdx];
        const color = isEmpty ? null : palette[curColorIdx];
        let allDone = true;
        for (let i = 0; i < segXs.length; i++) {
          if (!completedCells[`${segXs[i]},${rowIdx}`]) {
            allDone = false;
            break;
          }
        }
        runs.push({
          colorIdx: curColorIdx,
          isEmpty,
          color,
          count: curCount,
          startX: segXs[0],
          endX: segXs[segXs.length - 1],
          isDone: allDone,
        });
      };

      for (let i = 0; i < orderedX.length; i++) {
        const x = orderedX[i];
        const colorIdx = row[x];
        if (colorIdx === curColorIdx) {
          curCount++;
          segXs.push(x);
        } else {
          flushRun();
          curColorIdx = colorIdx;
          curCount = 1;
          segXs = [x];
        }
      }
      flushRun();

      return runs;
    },
    [gridData, palette, completedCells, gridWidth, gridHeight, readingDirection]
  );

  const rowRuns = useMemo(() => buildRunsForRow(currentRow), [buildRunsForRow, currentRow]);
  const safeActiveRunIndex = rowRuns.length > 0 ? Math.min(activeRunIndex, rowRuns.length - 1) : 0;

  const speakSingleRun = useCallback(
    (run: RowRun, prefix?: string) => {
      if (!speechAvailable) return;
      const phrase = formatColorRunSpeech(
        run.count,
        run.color?.name || run.color?.code || 'Color',
        run.isEmpty,
        craftType
      );
      const fullPhrase = prefix ? `${prefix}: ${phrase}` : phrase;
      speakText(fullPhrase, {
        rate: speechRate,
        onStart: () => setIsSpeakingNow(true),
        onEnd: () => setIsSpeakingNow(false),
      });
    },
    [speechAvailable, craftType, speechRate]
  );

  const handleSpeakWholeRow = useCallback(() => {
    if (!speechAvailable || rowRuns.length === 0) return;
    const text = formatFullRowSpeech(
      currentRow + 1,
      spokenDirectionLabel,
      rowRuns.map((r) => ({
        count: r.count,
        colorName: r.color?.name || r.color?.code || 'Color',
        isEmpty: r.isEmpty,
      })),
      craftType
    );
    speakText(text, {
      rate: speechRate,
      onStart: () => setIsSpeakingNow(true),
      onEnd: () => setIsSpeakingNow(false),
    });
  }, [speechAvailable, rowRuns, currentRow, spokenDirectionLabel, craftType, speechRate]);

  // Mark current row complete and advance to next row
  const handleMarkRowCompleteAndAdvance = useCallback(() => {
    const cellsToMark: { x: number; y: number; completed: boolean }[] = [];
    for (let x = 0; x < gridWidth; x++) {
      cellsToMark.push({ x, y: currentRow, completed: true });
    }
    onBatchSetCellsCompleted(cellsToMark);

    if (soundEnabled) {
      audioFeedback.playCelebrationChime();
    }

    if (currentRow < gridHeight - 1) {
      const nextRow = currentRow + 1;
      setCurrentRow(nextRow);
      setActiveRunIndex(0);

      if (voiceEnabled && speechAvailable) {
        const nextRuns = buildRunsForRow(nextRow);
        if (nextRuns.length > 0) {
          speakSingleRun(nextRuns[0], `Row ${nextRow + 1}`);
        }
      }
    } else {
      setIsAutoPlaying(false);
      if (voiceEnabled && speechAvailable) {
        speakText('Pattern complete! Congratulations.', {
          rate: speechRate,
          onStart: () => setIsSpeakingNow(true),
          onEnd: () => setIsSpeakingNow(false),
        });
      }
    }
  }, [
    gridWidth,
    currentRow,
    gridHeight,
    onBatchSetCellsCompleted,
    soundEnabled,
    voiceEnabled,
    speechAvailable,
    buildRunsForRow,
    speakSingleRun,
    speechRate,
  ]);

  // Advance active color block by 1 (and advance row automatically at end of row)
  const handleStepNextBlock = useCallback(() => {
    if (rowRuns.length === 0) return;
    if (safeActiveRunIndex < rowRuns.length - 1) {
      const nextIdx = safeActiveRunIndex + 1;
      setActiveRunIndex(nextIdx);
      if (voiceEnabled && speechAvailable) {
        speakSingleRun(rowRuns[nextIdx]);
      }
    } else {
      handleMarkRowCompleteAndAdvance();
    }
  }, [
    rowRuns,
    safeActiveRunIndex,
    voiceEnabled,
    speechAvailable,
    speakSingleRun,
    handleMarkRowCompleteAndAdvance,
  ]);

  const stepRef = useRef(handleStepNextBlock);
  const advanceRowRef = useRef(handleMarkRowCompleteAndAdvance);
  useEffect(() => {
    stepRef.current = handleStepNextBlock;
    advanceRowRef.current = handleMarkRowCompleteAndAdvance;
  }, [handleStepNextBlock, handleMarkRowCompleteAndAdvance]);

  // Hands-free Auto-Pace Interval Timer
  useEffect(() => {
    if (!isOpen || !isAutoPlaying || autoPaceSeconds <= 0) return;
    const id = setInterval(() => {
      stepRef.current();
    }, autoPaceSeconds * 1000);
    return () => clearInterval(id);
  }, [isOpen, isAutoPlaying, autoPaceSeconds]);

  // Keyboard navigation (Escape, Space, Arrows, Enter/N for Next Block)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        stopSpeaking();
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        advanceRowRef.current();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentRow((prev) => {
          const next = Math.max(0, prev - 1);
          setActiveRunIndex(0);
          return next;
        });
      } else if (e.key === 'Enter' || e.key.toLowerCase() === 'n') {
        e.preventDefault();
        stepRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rowProgressPct = Math.round(((currentRow + 1) / Math.max(1, gridHeight)) * 100);
  const activeRun = rowRuns[safeActiveRunIndex] || null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Ambient Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-xl shrink-0 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2 flex-wrap">
              <span className="truncate">Stitch Companion Focus Mode</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
                WakeLock Active
              </span>
            </h2>
            <span className="text-[11px] text-slate-400 truncate block">
              Space = Next Row • N / Enter = Next Block • Tap any chip to read block aloud
            </span>
          </div>
        </div>

        {/* Direction, Voice, Audio Toggle & Exit */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              setReadingDirection((prev) => (prev === 'alternating' ? 'ltr' : 'alternating'))
            }
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
            title="Toggle between Alternating RS/WS turns and uniform Left-to-Right reading"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
            <span>{readingDirection === 'alternating' ? 'RS / WS Turns' : 'Always L → R'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute chimes' : 'Enable chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Focus</span>
          </button>
        </div>
      </div>

      {/* Hands-Free Voice Read-Aloud Bar */}
      {speechAvailable && (
        <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                if (!next) {
                  stopSpeaking();
                  setIsAutoPlaying(false);
                }
              }}
              className={`px-2.5 py-1 rounded-xl border font-bold flex items-center gap-1.5 transition ${
                voiceEnabled
                  ? 'bg-indigo-600/25 border-indigo-400 text-indigo-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-indigo-400" />
              <span>Voice: {voiceEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={handleSpeakWholeRow}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition"
              title="Read all blocks in this row aloud"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Speak Row</span>
            </button>

            {isSpeakingNow && (
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setIsSpeakingNow(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-semibold flex items-center gap-1 transition"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            )}
          </div>

          {/* Auto-Pace Timer & Speed */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold px-1.5">Pace:</span>
              {([0, 4, 7, 12] as const).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setAutoPaceSeconds(sec);
                    if (sec === 0) setIsAutoPlaying(false);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition ${
                    autoPaceSeconds === sec
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sec === 0 ? 'Manual' : `${sec}s`}
                </button>
              ))}
            </div>

            {autoPaceSeconds > 0 && (
              <button
                type="button"
                onClick={() => {
                  const nextPlay = !isAutoPlaying;
                  setIsAutoPlaying(nextPlay);
                  if (nextPlay && activeRun && voiceEnabled) {
                    speakSingleRun(activeRun, `Row ${currentRow + 1}`);
                  } else if (!nextPlay) {
                    stopSpeaking();
                  }
                }}
                className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition ${
                  isAutoPlaying
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isAutoPlaying ? 'Pause' : 'Auto Play'}</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold px-1.5">Speed:</span>
              {[0.8, 1.0, 1.25].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSpeechRate(rate)}
                  className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold transition ${
                    speechRate === rate
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rate}×
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Companion Body */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-between p-4 sm:p-8 max-w-4xl mx-auto w-full">
        {/* Row Header Information */}
        <div className="flex flex-col gap-2 text-center">
          <div className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
            {rowDirectionLabel}
          </div>

          <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Row {currentRow + 1}{' '}
            <span className="text-slate-500 text-2xl font-normal">of {gridHeight}</span>
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
            <span>
              Color Sequences in Row {currentRow + 1} (Block {safeActiveRunIndex + 1} of{' '}
              {Math.max(1, rowRuns.length)}):
            </span>
            <span>
              {gridWidth} {getCraftUnitName(craftType, gridWidth)} total
            </span>
          </div>

          {/* Graphic Bar of the row */}
          <div className="h-10 w-full rounded-2xl overflow-hidden flex border-2 border-slate-700 shadow-2xl">
            {rowRuns.map((run, i) => (
              <div
                key={i}
                onClick={() => {
                  setActiveRunIndex(i);
                  if (voiceEnabled && speechAvailable) {
                    speakSingleRun(run);
                  }
                }}
                className={`h-full relative group transition-all cursor-pointer ${
                  i === safeActiveRunIndex ? 'ring-2 ring-inset ring-white brightness-110' : ''
                }`}
                style={{
                  width: `${(run.count / Math.max(1, gridWidth)) * 100}%`,
                  backgroundColor: run.isEmpty ? '#0f172a' : run.color?.hex || '#1e293b',
                }}
                title={`${run.count}x ${run.isEmpty ? 'Skip Empty' : run.color?.name || run.color?.code}`}
              />
            ))}
          </div>

          {/* Large Color Run Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mt-2">
            {rowRuns.map((run, i) => {
              const isActiveBlock = i === safeActiveRunIndex;
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    setActiveRunIndex(i);
                    if (voiceEnabled && speechAvailable) {
                      speakSingleRun(run);
                    }
                  }}
                  className={`p-3 rounded-2xl border flex items-center gap-3 text-left transition ${
                    isActiveBlock
                      ? 'bg-indigo-950/70 border-indigo-400 ring-2 ring-indigo-500/40 shadow-xl scale-[1.02]'
                      : run.isDone
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600 shadow-lg'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl shadow-md shrink-0 border flex items-center justify-center font-bold text-sm ${
                      run.isEmpty ? 'border-dashed border-slate-600 bg-slate-950 text-slate-400' : 'border-white/20'
                    }`}
                    style={
                      run.isEmpty || !run.color
                        ? undefined
                        : {
                            backgroundColor: run.color.hex,
                            color: getContrastingTextColor(run.color.r, run.color.g, run.color.b),
                          }
                    }
                  >
                    {run.isEmpty ? '∅' : run.color?.symbol}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-black text-white font-mono leading-none">
                      {run.count}{' '}
                      <span className="text-xs font-sans text-slate-400 font-semibold">
                        {getCraftUnitName(craftType, run.count)}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-200 truncate mt-0.5">
                      {run.isEmpty ? 'Empty / Skip' : run.color?.code || run.color?.hex}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {run.isEmpty ? 'No stitch' : run.color?.name || 'Custom'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Giant Next Block & Next Row Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full max-w-2xl mx-auto pt-4">
          <button
            type="button"
            onClick={() => {
              setCurrentRow((prev) => Math.max(0, prev - 1));
              setActiveRunIndex(0);
            }}
            disabled={currentRow === 0}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition active:scale-95 disabled:opacity-40"
            title="Previous Row (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handleStepNextBlock}
            className="py-4 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/25 transition active:scale-95 flex items-center justify-center gap-2"
            title="Advance to next color block and read aloud (N or Enter)"
          >
            <SkipForward className="w-5 h-5" />
            <span>Next Block</span>
          </button>

          <button
            type="button"
            onClick={handleMarkRowCompleteAndAdvance}
            className="flex-1 min-w-[200px] py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-2xl shadow-emerald-600/30 transition active:scale-98 flex items-center justify-center gap-2.5"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-200 shrink-0" />
            <span>Complete Row &amp; Next</span>
            <ChevronRight className="w-5 h-5 opacity-75 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
