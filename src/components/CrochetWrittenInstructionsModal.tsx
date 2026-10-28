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
  BookOpen
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100">Written Row-by-Row Instructions</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Tapestry Crochet
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Total {totalRows} Rows • {instructions.totalStitches} stitches • Interactive row tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Copy all row instructions to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy All'}</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Download instructions as a text file"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Save .txt</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Controls & Options Bar */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Direction & Format Settings */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Direction */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Direction:</span>
              <select
                value={config.directionMode}
                onChange={(e) => setConfig({ ...config, directionMode: e.target.value as any })}
                className="bg-transparent text-indigo-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="bottom-to-top" className="bg-slate-900">Bottom to Top (Standard)</option>
                <option value="top-to-bottom" className="bg-slate-900">Top to Bottom</option>
              </select>
            </div>

            {/* Turning Mode */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Turns:</span>
              <select
                value={config.turnMode}
                onChange={(e) => setConfig({ ...config, turnMode: e.target.value as any })}
                className="bg-transparent text-indigo-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="alternating" className="bg-slate-900">Alternating RS/WS (Turn each row)</option>
                <option value="all-ltr" className="bg-slate-900">All Left-to-Right (→)</option>
                <option value="all-rtl" className="bg-slate-900">All Right-to-Left (←)</option>
              </select>
            </div>

            {/* Format Style */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Format:</span>
              <select
                value={config.formatStyle}
                onChange={(e) => setConfig({ ...config, formatStyle: e.target.value as any })}
                className="bg-transparent text-indigo-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="color-name" className="bg-slate-900">Color Names: (Black) x 12</option>
                <option value="abbreviation" className="bg-slate-900">Letter Codes: (A) x 12</option>
              </select>
            </div>
          </div>

          {/* Progress Tracker Counter */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-xs font-bold font-mono text-slate-200">
                {doneCount} / {totalRows} rows
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold ml-1.5">
                ({percentDone}%)
              </span>
            </div>
            {doneCount > 0 && (
              <button
                onClick={handleResetProgress}
                className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                title="Reset row checkboxes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Color Legend Chips Bar */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-thin text-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
            Key:
          </span>
          {instructions.colorLegend.map((item) => (
            <div
              key={item.abbreviation}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0"
            >
              <div
                className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                style={{ backgroundColor: item.color.hex }}
              />
              <span className="font-bold text-pink-400 font-mono text-[11px]">{item.abbreviation}</span>
              <span className="text-slate-300 text-[11px] font-medium">{item.color.name || item.color.code}</span>
              <span className="text-[10px] text-slate-500 font-mono">({item.color.count})</span>
            </div>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/30 flex items-center justify-between text-xs gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or jump to row (e.g. 14)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-semibold">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-md transition ${filterMode === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode('todo')}
              className={`px-3 py-1 rounded-md transition ${filterMode === 'todo' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              To Do ({totalRows - doneCount})
            </button>
            <button
              onClick={() => setFilterMode('done')}
              className={`px-3 py-1 rounded-md transition ${filterMode === 'done' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Done ({doneCount})
            </button>
          </div>
        </div>

        {/* Row-by-Row List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredRows.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No rows match your filter
            </div>
          ) : (
            filteredRows.map((row) => {
              const isDone = !!completedRows[row.rowNumber];

              return (
                <div
                  key={row.rowNumber}
                  onClick={() => toggleRow(row.rowNumber)}
                  className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isDone
                      ? 'bg-slate-950/30 border-slate-850 opacity-60'
                      : 'bg-slate-950/70 border-slate-800 hover:border-indigo-500/70 hover:bg-slate-850/60 shadow-sm'
                  }`}
                >
                  {/* Row Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRow(row.rowNumber);
                    }}
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-slate-700 bg-slate-900 hover:border-indigo-500 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  {/* Row Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`font-mono text-xs font-bold ${isDone ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                        Row {row.rowNumber}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-800 text-indigo-300">
                        {row.direction} {row.side}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({row.totalStitches} stitches)
                      </span>
                    </div>

                    {/* Visual Segment Chips */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {row.segments.map((seg, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs shadow-inner"
                        >
                          <div
                            className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                            style={{ backgroundColor: seg.colorHex }}
                          />
                          <span className="font-bold text-slate-100 font-mono">
                            {seg.count}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {config.formatStyle === 'abbreviation' ? seg.abbreviation : seg.colorName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Tip: Click any row to mark it completed as you crochet
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
