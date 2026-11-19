import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  X,
  Play,
  Pause,
  CheckCircle2,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  TrendingUp,
  Timer,
} from 'lucide-react';
import type { GridConfig, PaletteColor, CellProgress } from '../types/craft';
import {
  loadWipStats,
  saveWipStats,
  formatDurationClock,
  formatDurationHuman,
  calculateWipMetrics,
  renderWipStatsCardCanvas,
  type WipStats,
  type WipSessionLog,
} from '../utils/wipTracker';

interface WipTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridData: number[][];
  palette: PaletteColor[];
  config: GridConfig;
  completedCells: CellProgress;
  isTimerRunning: boolean;
  activeSessionSeconds: number;
  activeSessionStartStitches: number;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onSaveAndResetTimer: (note?: string) => void;
  wipStats: WipStats;
  onUpdateWipStats: (next: WipStats) => void;
}

export const WipTrackerModal: React.FC<WipTrackerModalProps> = ({
  isOpen,
  onClose,
  gridData,
  palette,
  config,
  completedCells,
  isTimerRunning,
  activeSessionSeconds,
  activeSessionStartStitches,
  onStartTimer,
  onPauseTimer,
  onSaveAndResetTimer,
  wipStats,
  onUpdateWipStats,
}) => {
  const [activeTab, setActiveTab] = useState<'timer' | 'card'>('timer');
  const [sessionNote, setSessionNote] = useState('');
  const [offlineMinutes, setOfflineMinutes] = useState(30);
  const [offlineNote, setOfflineNote] = useState('Evening couch session');
  const [projectTitle, setProjectTitle] = useState('My Pixel Craft WIP');
  const [milestoneDraft, setMilestoneDraft] = useState(wipStats.milestoneNote);
  const [copiedCard, setCopiedCard] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const counts = useMemo(() => {
    let totalValid = 0;
    let doneCount = 0;
    for (let y = 0; y < gridData.length; y++) {
      for (let x = 0; x < (gridData[y]?.length || 0); x++) {
        if (gridData[y][x] >= 0) {
          totalValid++;
          if (completedCells[`${x},${y}`]) doneCount++;
        }
      }
    }
    return { totalValid, doneCount };
  }, [gridData, completedCells]);

  const combinedTotalSeconds = wipStats.totalSeconds + activeSessionSeconds;
  const sessionStitchesDelta = Math.max(0, counts.doneCount - activeSessionStartStitches);
  const metrics = calculateWipMetrics(counts.doneCount, counts.totalValid, combinedTotalSeconds);

  const effectiveStatsForCard: WipStats = useMemo(
    () => ({
      ...wipStats,
      totalSeconds: combinedTotalSeconds,
      milestoneNote: milestoneDraft,
    }),
    [wipStats, combinedTotalSeconds, milestoneDraft]
  );

  const cardPreview = useMemo(() => {
    if (!isOpen || activeTab !== 'card') return null;
    const canvas = renderWipStatsCardCanvas(
      gridData,
      palette,
      config,
      completedCells,
      effectiveStatsForCard,
      projectTitle
    );
    return { canvas, url: canvas.toDataURL('image/png') };
  }, [isOpen, activeTab, gridData, palette, config, completedCells, effectiveStatsForCard, projectTitle]);

  const handleLogOfflineSession = (mins: number) => {
    const secs = Math.max(60, Math.round(mins * 60));
    const newSession: WipSessionLog = {
      id: `wip-${Date.now().toString(36)}`,
      dateIso: new Date().toISOString(),
      durationSeconds: secs,
      stitchesCompleted: 0,
      note: offlineNote.trim() || 'Offline session',
    };
    const next: WipStats = {
      ...wipStats,
      totalSeconds: wipStats.totalSeconds + secs,
      sessions: [newSession, ...wipStats.sessions].slice(0, 50),
    };
    saveWipStats(next);
    onUpdateWipStats(next);
  };

  const handleDeleteSession = (id: string) => {
    const target = wipStats.sessions.find((s) => s.id === id);
    if (!target) return;
    const next: WipStats = {
      ...wipStats,
      totalSeconds: Math.max(0, wipStats.totalSeconds - target.durationSeconds),
      sessions: wipStats.sessions.filter((s) => s.id !== id),
    };
    saveWipStats(next);
    onUpdateWipStats(next);
  };

  const handleResetAllStats = () => {
    if (!window.confirm('Clear all logged WIP sessions and start fresh?')) return;
    const fresh: WipStats = {
      ...loadWipStats(),
      totalSeconds: 0,
      sessions: [],
      milestoneNote: '',
      startedAtIso: new Date().toISOString(),
    };
    saveWipStats(fresh);
    onUpdateWipStats(fresh);
    setMilestoneDraft('');
  };

  const handleDownloadStatsPng = () => {
    if (!cardPreview?.url) return;
    const a = document.createElement('a');
    a.href = cardPreview.url;
    a.download = `${projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-wip-stats.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyCardClipboard = async () => {
    const canvas = cardPreview?.canvas;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (blob && 'ClipboardItem' in window) {
        await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
        setCopiedCard(true);
        setTimeout(() => setCopiedCard(false), 2000);
      }
    } catch {
      handleDownloadStatsPng();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[93vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Pinned Header */}
        <div className="shrink-0 p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Timer className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  WIP Time Tracker &amp; Stitch Pace Journal
                </h2>
                {isTimerRunning && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    Live Timing
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Track session hours, stitches/hour pace, ETA to finish &amp; export shareable WIP stats cards
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

        {/* Sub-Navigation Tabs */}
        <div className="shrink-0 px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('timer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'timer'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timer &amp; WIP Journal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'card'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Export Stats Card (PNG)</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-5 [scrollbar-width:thin]">
          {activeTab === 'timer' ? (
            <>
              {/* Live Stopwatch Hero */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    Current Session Stopwatch
                  </div>
                  <div className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight mt-1">
                    {formatDurationClock(activeSessionSeconds)}
                  </div>
                  <div className="text-xs text-emerald-300 font-semibold mt-1">
                    +{sessionStitchesDelta.toLocaleString()} stitches tracked this session
                  </div>
                </div>

                <div className="space-y-2.5 flex-1 md:max-w-sm">
                  <input
                    type="text"
                    value={sessionNote}
                    onChange={(e) => setSessionNote(e.target.value)}
                    placeholder="Optional note (e.g. Border leaves finished)..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex items-center gap-2">
                    {isTimerRunning ? (
                      <button
                        type="button"
                        onClick={onPauseTimer}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause Timer</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onStartTimer}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{activeSessionSeconds > 0 ? 'Resume' : 'Start Session'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={activeSessionSeconds === 0 && sessionStitchesDelta === 0}
                      onClick={() => {
                        onSaveAndResetTimer(sessionNote);
                        setSessionNote('');
                      }}
                      className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Log Session</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 KPI Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold">Progress</div>
                  <div className="text-lg font-extrabold font-mono text-white mt-0.5">
                    {metrics.percentDone}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {counts.doneCount.toLocaleString()} / {counts.totalValid.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold">Total Logged Time</div>
                  <div className="text-lg font-extrabold font-mono text-sky-300 mt-0.5">
                    {formatDurationHuman(combinedTotalSeconds)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {wipStats.sessions.length} saved session(s)
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-pink-400" /> Stitch Pace
                  </div>
                  <div className="text-lg font-extrabold font-mono text-pink-300 mt-0.5">
                    {metrics.stitchesPerHour > 0 ? `${metrics.stitchesPerHour}/hr` : '--'}
                  </div>
                  <div className="text-[10px] text-slate-500">Completed ÷ Hours</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold">Est. Remaining</div>
                  <div className="text-lg font-extrabold font-mono text-amber-300 mt-0.5">
                    {metrics.estimatedHoursRemaining !== null
                      ? `~${metrics.estimatedHoursRemaining} hrs`
                      : '--'}
                  </div>
                  <div className="text-[10px] text-slate-500">At current pace</div>
                </div>
              </div>

              {/* Log Offline Time Quickly */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">Crafted Offline? Add Quick Time:</div>
                  <div className="text-[11px] text-slate-400">Log paper-chart or couch hours manually.</div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="text"
                    value={offlineNote}
                    onChange={(e) => setOfflineNote(e.target.value)}
                    placeholder="Note"
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white w-36"
                  />
                  <button
                    type="button"
                    onClick={() => handleLogOfflineSession(30)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    +30m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogOfflineSession(60)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    +1h
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={offlineMinutes}
                    onChange={(e) => setOfflineMinutes(Math.max(1, parseInt(e.target.value || '1', 10)))}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleLogOfflineSession(offlineMinutes)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Min
                  </button>
                </div>
              </div>

              {/* Session History List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider">
                    Saved Work Sessions ({wipStats.sessions.length})
                  </span>
                  {wipStats.sessions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetAllStats}
                      className="text-[11px] text-rose-400 hover:text-rose-300 underline"
                    >
                      Clear Journal
                    </button>
                  )}
                </div>

                {wipStats.sessions.length === 0 ? (
                  <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-500">
                    No sessions logged yet. Start the stopwatch above while stitching or log offline couch hours!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin]">
                    {wipStats.sessions.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-emerald-300">
                              {formatDurationHuman(s.durationSeconds)}
                            </span>
                            {s.stitchesCompleted > 0 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                                +{s.stitchesCompleted} sts
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-normal">
                              {new Date(s.dateIso).toLocaleDateString()}
                            </span>
                          </div>
                          {s.note && (
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">{s.note}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(s.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition shrink-0"
                          title="Delete session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* TAB 2: Export WIP Stats Card */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <div className="md:col-span-6 flex justify-center bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                {cardPreview?.url ? (
                  <img
                    src={cardPreview.url}
                    alt="WIP Progress Stats Card Preview"
                    className="max-h-[420px] rounded-xl shadow-2xl object-contain"
                  />
                ) : (
                  <div className="text-xs text-slate-400 py-16">Rendering card...</div>
                )}
              </div>

              <div className="md:col-span-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    WIP Card Title
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Milestone Quote / Caption
                  </label>
                  <input
                    type="text"
                    value={milestoneDraft}
                    onChange={(e) => {
                      setMilestoneDraft(e.target.value);
                      const next = { ...wipStats, milestoneNote: e.target.value };
                      saveWipStats(next);
                      onUpdateWipStats(next);
                    }}
                    placeholder="e.g. Page 1 complete on 14ct Aida!"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  1080×1350 portrait card shows completed stitches in full color against faded unworked areas, total logged hours, stitch pace, and remaining ETA — built for <strong className="text-slate-200">r/CrossStitch</strong>, <strong className="text-slate-200">r/crochet</strong>, and Instagram Stories.
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadStatsPng}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Stats Card PNG (1080×1350)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCardClipboard}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    {copiedCard ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-indigo-400" />
                    )}
                    <span>{copiedCard ? 'Copied Card to Clipboard!' : 'Copy Card Image to Clipboard'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 p-3 sm:p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Timer keeps running in Header while you work on the canvas!
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
