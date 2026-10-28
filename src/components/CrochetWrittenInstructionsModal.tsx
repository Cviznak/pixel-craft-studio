import React, { useState, useMemo, useEffect } from 'react';
import type { PaletteColor } from '../types/craft';
import { 
  generateCrochetInstructions, 
  formatInstructionsAsPlainText,
  DEFAULT_INSTRUCTIONS_CONFIG,
  type WrittenInstructionsConfig
} from '../utils/crochetInstructions';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Search, 
  RotateCcw,
  BookOpen,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Palette,
  CheckCircle2,
  ListFilter
} from 'lucide-react';

interface CrochetWrittenInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridData: number[][];
  palette: PaletteColor[];
  projectName?: string;
}

export const CrochetWrittenInstructionsModal: React.FC<CrochetWrittenInstructionsModalProps> = ({
  isOpen,
  onClose,
  gridData,
  palette,
  projectName = 'Tapestry Crochet Pattern',
}) => {
  const [config, setConfig] = useState<WrittenInstructionsConfig>(DEFAULT_INSTRUCTIONS_CONFIG);
  const [completedRows, setCompletedRows] = useState<{ [rowNum: number]: boolean }>(() => {
    try {
      const saved = localStorage.getItem('crochet_completed_rows');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'todo' | 'done'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showKey, setShowKey] = useState(true);
  const [displayMode, setDisplayMode] = useState<'chips' | 'text'>('chips');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Persist completed rows
  useEffect(() => {
    try {
      localStorage.setItem('crochet_completed_rows', JSON.stringify(completedRows));
    } catch {
      // ignore
    }
  }, [completedRows]);

  const instructions = useMemo(() => {
    return generateCrochetInstructions(gridData, palette, config);
  }, [gridData, palette, config]);

  const toggleRow = (rowNum: number) => {
    setCompletedRows((prev) => ({
      ...prev,
      [rowNum]: !prev[rowNum],
    }));
  };

  const handleCopyText = async () => {
    const text = formatInstructionsAsPlainText(instructions, projectName);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadTxt = () => {
    const text = formatInstructionsAsPlainText(instructions, projectName);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-written-instructions.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetProgress = () => {
    if (window.confirm('Reset your crochet row progress?')) {
      setCompletedRows({});
    }
  };

  if (!isOpen) return null;

  const doneCount = Object.values(completedRows).filter(Boolean).length;
  const totalRows = instructions.totalRows;
  const percentDone = totalRows > 0 ? Math.round((doneCount / totalRows) * 100) : 0;

  const filteredRows = instructions.rows.filter((r) => {
    const isDone = !!completedRows[r.rowNumber];
    if (filterMode === 'todo' && isDone) return false;
    if (filterMode === 'done' && !isDone) return false;
    if (searchQuery) {
      return (
        String(r.rowNumber).includes(searchQuery) ||
        r.fullText.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-150 select-none"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* 1. Sleek Header Bar */}
        <div className="shrink-0 p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-100 truncate">
                  Written Row-by-Row Instructions
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 shrink-0">
                  Tapestry Crochet
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {totalRows} Rows • {instructions.totalStitches} stitches • Interactive progress tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Live Progress Pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-emerald-400 rounded-full transition-all duration-300" 
                  style={{ width: `${percentDone}%` }}
                />
              </div>
              <span className="font-mono font-bold text-slate-200 text-[11px]">
                {doneCount}/{totalRows}
              </span>
              <span className="text-emerald-400 font-bold text-[10px]">
                ({percentDone}%)
              </span>
            </div>

            {/* Copy All */}
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Copy all row instructions to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy All'}</span>
            </button>

            {/* Save .txt */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Download instructions as a text file"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Save .txt</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close tracker (Esc)"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Unified Toolbar (Search, Filter, Format & Settings) */}
        <div className="shrink-0 p-2.5 sm:p-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Left: Search input */}
          <div className="relative flex-1 min-w-[140px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or jump to row #..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Center: Filter Segments (All, To Do, Done) */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md transition ${filterMode === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All ({totalRows})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('todo')}
              className={`px-2.5 py-1 rounded-md transition ${filterMode === 'todo' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              To Do ({totalRows - doneCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('done')}
              className={`px-2.5 py-1 rounded-md transition ${filterMode === 'done' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Done ({doneCount})
            </button>
          </div>

          {/* Right: Quick Formatting & Settings Toggles */}
          <div className="flex items-center gap-1.5">
            {/* Format Style Pill */}
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setConfig({ ...config, formatStyle: 'abbreviation' })}
                className={`px-2 py-1 rounded-md transition ${config.formatStyle === 'abbreviation' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="Shorthand codes: (A) x 12, (B) x 4"
              >
                Codes (A, B)
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, formatStyle: 'color-name' })}
                className={`px-2 py-1 rounded-md transition ${config.formatStyle === 'color-name' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="Full color names: (Black) x 12"
              >
                Full Names
              </button>
            </div>

            {/* Display Mode (Chips vs Compact Text) */}
            <button
              type="button"
              onClick={() => setDisplayMode(displayMode === 'chips' ? 'text' : 'chips')}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition ${
                displayMode === 'text' 
                  ? 'bg-purple-600/20 border-purple-500/40 text-purple-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle visual chips or monospaced sentence format"
            >
              <ListFilter className="w-3 h-3" />
              <span className="hidden sm:inline">{displayMode === 'chips' ? 'Chips' : 'Text'}</span>
            </button>

            {/* Color Key Toggle */}
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition ${
                showKey 
                  ? 'bg-pink-600/20 border-pink-500/40 text-pink-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle color key overview"
            >
              <Palette className="w-3 h-3" />
              <span>Key ({instructions.colorLegend.length})</span>
              {showKey ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Direction & Turns Options Dropdown Toggle */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg border text-slate-400 hover:text-slate-200 transition ${
                showSettings ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' : 'bg-slate-900 border-slate-800'
              }`}
              title="Configure crochet direction & turn mode"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Expandable Advanced Direction & Turns Settings Bar */}
        {showSettings && (
          <div className="shrink-0 px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center gap-4 text-xs animate-in slide-in-from-top-2 duration-150">
            {/* Direction */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Direction:
              </span>
              <select
                value={config.directionMode}
                onChange={(e) => setConfig({ ...config, directionMode: e.target.value as any })}
                className="bg-slate-900 border border-slate-700 text-indigo-300 font-semibold rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
              >
                <option value="bottom-to-top">Bottom to Top (Universal Tapestry)</option>
                <option value="top-to-bottom">Top to Bottom</option>
              </select>
            </div>

            {/* Turning Mode */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Turning:
              </span>
              <select
                value={config.turnMode}
                onChange={(e) => setConfig({ ...config, turnMode: e.target.value as any })}
                className="bg-slate-900 border border-slate-700 text-indigo-300 font-semibold rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
              >
                <option value="alternating">Alternating RS/WS (Turn each row)</option>
                <option value="all-rtl">All Right-to-Left (← RS only)</option>
                <option value="all-ltr">All Left-to-Right (→ RS only)</option>
              </select>
            </div>

            {doneCount > 0 && (
              <button
                type="button"
                onClick={handleResetProgress}
                className="ml-auto text-xs text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset row progress</span>
              </button>
            )}
          </div>
        )}

        {/* 4. Color Key Grid (Wraps cleanly without ANY ugly horizontal scrollbars) */}
        {showKey && (
          <div className="shrink-0 px-4 py-2 bg-slate-950/90 border-b border-slate-800/80 max-h-28 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                Color Key:
              </span>
              {instructions.colorLegend.map((item) => (
                <div
                  key={item.abbreviation}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition shrink-0"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full border border-white/30 shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color.hex }}
                  />
                  <span className="font-bold text-pink-400 font-mono text-[11px]">
                    {item.abbreviation}
                  </span>
                  <span className="text-slate-300 text-[11px] font-medium">
                    {item.color.name || item.color.code}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({item.color.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Row-by-Row Interactive List */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2.5 [scrollbar-width:thin] [scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {filteredRows.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No rows match your current filter or search query.
            </div>
          ) : (
            filteredRows.map((row) => {
              const isDone = !!completedRows[row.rowNumber];

              return (
                <div
                  key={row.rowNumber}
                  onClick={() => toggleRow(row.rowNumber)}
                  className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isDone
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-80'
                      : 'bg-slate-950/75 border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850/60 shadow-sm'
                  }`}
                >
                  {/* Row Completion Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRow(row.rowNumber);
                    }}
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                        : 'border-slate-700 bg-slate-900 hover:border-indigo-500 text-transparent'
                    }`}
                    title={isDone ? 'Mark as to-do' : 'Mark as done'}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  {/* Row Content */}
                  <div className="flex-1 min-w-0">
                    {/* Row Header Line */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`font-mono text-xs font-bold ${isDone ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                        Row {row.rowNumber}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        row.side === 'RS' ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30' : 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                      }`}>
                        {row.direction} {row.side}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({row.totalStitches} sts)
                      </span>
                      {isDone && (
                        <span className="ml-auto text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      )}
                    </div>

                    {/* Visual Segment Chips OR Monospaced Text */}
                    {displayMode === 'text' ? (
                      <p className="font-mono text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        {config.formatStyle === 'abbreviation' ? row.shorthandText : row.fullText}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {row.segments.map((seg, sIdx) => (
                          <div
                            key={sIdx}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs shadow-inner transition ${
                              isDone ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-slate-900/90 border-slate-800 text-slate-200'
                            }`}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                              style={{ backgroundColor: seg.colorHex }}
                            />
                            <span className="font-bold text-white font-mono">
                              {seg.count}
                            </span>
                            <span className="text-[11px] text-slate-300 font-medium">
                              {config.formatStyle === 'abbreviation' ? seg.abbreviation : seg.colorName}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 6. Sticky Footer */}
        <div className="shrink-0 p-3 sm:p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>Tip: Click any row or checkbox to track your progress as you crochet</span>
          </div>

          <div className="flex items-center gap-2">
            {doneCount > 0 && (
              <button
                type="button"
                onClick={handleResetProgress}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-300 hover:bg-slate-800 transition"
              >
                Reset Progress
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
