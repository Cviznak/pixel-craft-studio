import React, { useState } from 'react';
import type { PaletteColor, CellProgress, CraftType } from '../types/craft';
import { getContrastingTextColor } from '../utils/colorUtils';
import { 
  buildAmazonColorSearchUrl, 
  buildAmazonSuppliesUrl 
} from '../utils/amazonUtils';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Palette, 
  Search, 
  ShoppingCart, 
  Sparkles, 
  X,
  ExternalLink
} from 'lucide-react';

interface PaletteLegendProps {
  palette: PaletteColor[];
  gridData: number[][];
  spotlightColorId: string | null;
  activeColorIndex: number;
  completedCells: CellProgress;
  craftType?: CraftType;
  onSelectColor: (index: number) => void;
  onToggleSpotlight: (colorId: string) => void;
  onUpdateColorHex: (index: number, newHex: string) => void;
  onToggleLockColor: (index: number) => void;
  onCleanConfetti?: () => void;
  onClose?: () => void;
}

export const PaletteLegend: React.FC<PaletteLegendProps> = ({
  palette,
  gridData,
  spotlightColorId,
  activeColorIndex,
  completedCells,
  craftType = 'perler',
  onSelectColor,
  onToggleSpotlight,
  onUpdateColorHex,
  onToggleLockColor,
  onCleanConfetti,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'todo' | 'done'>('all');

  const getAmazonSearchUrl = (color: PaletteColor) => {
    return buildAmazonColorSearchUrl(color, craftType);
  };

  // Compute completed count per color
  const completedCounts: { [colorIdx: number]: number } = {};
  for (const key of Object.keys(completedCells)) {
    const [xStr, yStr] = key.split(',');
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);
    const colorIdx = gridData[y]?.[x];
    if (colorIdx !== undefined) {
      completedCounts[colorIdx] = (completedCounts[colorIdx] || 0) + 1;
    }
  }

  // Filter palette based on search and progress mode
  const filteredPalette = palette.filter((c) => {
    const originalIndex = palette.findIndex((item) => item.id === c.id);
    const done = completedCounts[originalIndex] || 0;
    const total = c.count || 0;
    const isComplete = total > 0 && done >= total;

    if (filterMode === 'todo' && isComplete) return false;
    if (filterMode === 'done' && !isComplete) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.symbol.toLowerCase().includes(term) ||
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.code && c.code.toLowerCase().includes(term)) ||
      c.hex.toLowerCase().includes(term)
    );
  });

  return (
    <aside className="w-80 max-w-[88vw] h-full bg-slate-900 border-l border-slate-800/90 flex flex-col z-10 shrink-0 shadow-2xl lg:shadow-none select-none overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800/90 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              Palette & Thread Key
            </span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-mono font-bold">
              {palette.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onCleanConfetti && (
              <button
                onClick={onCleanConfetti}
                className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 transition"
                title="Merge rare stray pixels (<1% count) into their closest matching color"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Clean Strays</span>
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition"
                title="Close palette"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Box */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search code, name, or symbol..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-2 text-slate-500 hover:text-slate-300 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Progress Filter Pills: All | To Do | Done */}
        <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80 text-[10px] font-semibold">
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-1 rounded-md transition text-center ${
              filterMode === 'all'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({palette.length})
          </button>
          <button
            onClick={() => setFilterMode('todo')}
            className={`flex-1 py-1 rounded-md transition text-center ${
              filterMode === 'todo'
                ? 'bg-slate-800 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            To Do
          </button>
          <button
            onClick={() => setFilterMode('done')}
            className={`flex-1 py-1 rounded-md transition text-center ${
              filterMode === 'done'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Done
          </button>
        </div>
      </div>

      {/* Palette Color Cards List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredPalette.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            No colors found matching this filter
          </div>
        ) : (
          filteredPalette.map((color) => {
            const originalIndex = palette.findIndex((c) => c.id === color.id);
            const isSpotlit = spotlightColorId === color.id;
            const isSelected = activeColorIndex === originalIndex;
            const done = completedCounts[originalIndex] || 0;
            const total = color.count || 0;
            const isColorComplete = total > 0 && done >= total;

            return (
              <div
                key={color.id}
                onClick={() => onSelectColor(originalIndex)}
                className={`group flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-800/95 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                    : isSpotlit
                    ? 'bg-amber-950/30 border-amber-500/50'
                    : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700/80'
                }`}
              >
                {/* Left: Swatch & Symbol */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="relative w-8 h-8 rounded-lg shadow-sm flex items-center justify-center font-bold text-sm shrink-0 border border-white/20 select-none"
                    style={{
                      backgroundColor: color.hex,
                      color: getContrastingTextColor(color.r, color.g, color.b),
                    }}
                  >
                    <span>{color.symbol}</span>
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => onUpdateColorHex(originalIndex, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Click to tweak this color"
                    />
                  </div>

                  <div className="min-w-0 flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {color.code || color.hex}
                      </span>
                      {color.isLocked && (
                        <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 truncate">
                      {color.name || 'Custom Color'}
                    </span>
                  </div>
                </div>

                {/* Right: Quantities & Quick Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-slate-200">
                      {done > 0 ? (
                        <span className={isColorComplete ? 'text-emerald-400' : 'text-slate-300'}>
                          {done}/{total}
                        </span>
                      ) : (
                        <span>{total}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 font-mono">
                      <span>{color.percentage}%</span>
                      {craftType === 'cross-stitch' && (
                        <span className="text-[9px] text-indigo-400 font-sans" title="Estimated DMC 8m skeins needed">
                          • {total > 1800 ? `${(total / 1800).toFixed(1)} sk` : '1 sk'}
                        </span>
                      )}
                      {craftType === 'perler' && (
                        <span className="text-[9px] text-amber-400 font-sans" title="Estimated 1,000-bead packs needed">
                          • {Math.max(1, Math.ceil(total / 1000))} pk
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amazon Shopping Button */}
                  <a
                    href={getAmazonSearchUrl(color)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-md text-slate-500 hover:text-amber-400 hover:bg-slate-700/60 transition"
                    title={`Find ${color.name || color.code || 'supplies'} on Amazon`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </a>

                  {/* Lock Color Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLockColor(originalIndex);
                    }}
                    className={`p-1 rounded-md transition ${
                      color.isLocked
                        ? 'text-amber-400 bg-amber-500/20'
                        : 'text-slate-600 hover:text-slate-300 hover:bg-slate-700/60'
                    }`}
                    title={color.isLocked ? 'Unlock color' : 'Lock color'}
                  >
                    {color.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  {/* Spotlight Isolation Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSpotlight(color.id);
                    }}
                    className={`p-1 rounded-md transition ${
                      isSpotlit
                        ? 'text-amber-400 bg-amber-500/20'
                        : 'text-slate-500 hover:text-amber-300 hover:bg-slate-700/60'
                    }`}
                    title={isSpotlit ? 'Clear spotlight' : 'Highlight only this color on canvas'}
                  >
                    {isSpotlit ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Supplies & Shopping Footer */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/80 flex flex-col gap-1.5 text-xs">
        <a
          href={buildAmazonSuppliesUrl(craftType)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-1.5 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 flex items-center justify-center gap-1.5 font-semibold transition"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
          <span>Shop Craft Supplies on Amazon</span>
          <ExternalLink className="w-3 h-3 text-amber-400" />
        </a>
        <div className="text-[9px] text-slate-500 text-center">
          Affiliate disclosure: We may earn a small commission on qualifying purchases.
        </div>
      </div>
    </aside>
  );
};
