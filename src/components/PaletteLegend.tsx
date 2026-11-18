import React, { useState, useMemo } from 'react';
import type { PaletteColor, CellProgress, CraftType } from '../types/craft';
import { getContrastingTextColor } from '../utils/colorUtils';
import { 
  buildAmazonColorSearchUrl, 
  buildAmazonSuppliesUrl 
} from '../utils/amazonUtils';
import { 
  getAnchorEquivalent, 
  getBeadEquivalents, 
  getPerceptualLuminance, 
  findSimilarPalettePairs 
} from '../utils/threadEquivalents';
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
  ExternalLink,
  Plus,
  ArrowLeftRight,
  ChevronRight,
  ArrowUpDown,
  AlertTriangle
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
  onToggleCollapse?: () => void;
  onAddColor?: (hex: string) => void;
  onSwapColor?: (sourceColorIndex: number, targetColorIndex: number) => void;
  onSwapWithNewColor?: (sourceColorIndex: number, newHex: string) => void;
}

const PaletteLegendComponent: React.FC<PaletteLegendProps> = ({
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
  onToggleCollapse,
  onAddColor,
  onSwapColor,
  onSwapWithNewColor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'todo' | 'done'>('all');
  const [swapSourceIndex, setSwapSourceIndex] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<'count' | 'hue' | 'luminance' | 'code'>('count');
  const [flossSystem, setFlossSystem] = useState<'dmc' | 'anchor' | 'both'>('dmc');
  const [showSimilarAlert, setShowSimilarAlert] = useState<boolean>(true);

  const isThreadCraft = craftType !== 'perler';

  const getAmazonSearchUrl = (color: PaletteColor) => {
    return buildAmazonColorSearchUrl(color, craftType);
  };

  // Helper to calculate Hue angle (0 - 360) for rainbow sorting
  const getHue = (r: number, g: number, b: number): number => {
    const rN = r / 255;
    const gN = g / 255;
    const bN = b / 255;
    const max = Math.max(rN, gN, bN);
    const min = Math.min(rN, gN, bN);
    if (max === min) return 0;
    let h = 0;
    if (max === rN) h = (60 * ((gN - bN) / (max - min)) + 360) % 360;
    else if (max === gN) h = (60 * ((bN - rN) / (max - min)) + 120) % 360;
    else if (max === bN) h = (60 * ((rN - gN) / (max - min)) + 240) % 360;
    return h;
  };

  // Identify low-contrast / confusing color pairs (deltaE < 10)
  const similarPairs = useMemo(() => {
    return findSimilarPalettePairs(palette, 10);
  }, [palette]);

  // Real-time cell count per palette color from gridData (updates live while drawing)
  const realCounts = useMemo(() => {
    const counts: { [colorIdx: number]: number } = {};
    for (let y = 0; y < gridData.length; y++) {
      const row = gridData[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const idx = row[x];
        if (idx >= 0) {
          counts[idx] = (counts[idx] || 0) + 1;
        }
      }
    }
    return counts;
  }, [gridData]);

  // Compute completed count per color (memoized to prevent lag during drag/tracking)
  const completedCounts = useMemo(() => {
    const counts: { [colorIdx: number]: number } = {};
    for (const key of Object.keys(completedCells)) {
      const [xStr, yStr] = key.split(',');
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);
      const colorIdx = gridData[y]?.[x];
      if (colorIdx !== undefined) {
        counts[colorIdx] = (counts[colorIdx] || 0) + 1;
      }
    }
    return counts;
  }, [completedCells, gridData]);

  // Filter palette based on search and progress mode
  const filteredPalette = useMemo(() => {
    return palette.filter((c) => {
      const originalIndex = palette.findIndex((item) => item.id === c.id);
      const done = completedCounts[originalIndex] || 0;
      const total = realCounts[originalIndex] ?? c.count ?? 0;
      const isComplete = total > 0 && done >= total;

      if (filterMode === 'todo' && isComplete) return false;
      if (filterMode === 'done' && !isComplete) return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const anchorMatch = getAnchorEquivalent(c.code);
      const beadMatch = getBeadEquivalents(c.code);
      return (
        c.symbol.toLowerCase().includes(term) ||
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.code && c.code.toLowerCase().includes(term)) ||
        (anchorMatch && anchorMatch.code.toLowerCase().includes(term)) ||
        (anchorMatch && anchorMatch.name.toLowerCase().includes(term)) ||
        (beadMatch && (beadMatch.artkal.toLowerCase().includes(term) || beadMatch.hama.toLowerCase().includes(term))) ||
        c.hex.toLowerCase().includes(term)
      );
    });
  }, [palette, realCounts, completedCounts, filterMode, searchTerm]);

  // Sort filtered palette by count, hue, luminance, or code
  const sortedPalette = useMemo(() => {
    const list = [...filteredPalette];
    if (sortMode === 'hue') {
      return list.sort((a, b) => getHue(a.r, a.g, b.b) - getHue(b.r, b.g, b.b));
    }
    if (sortMode === 'luminance') {
      return list.sort((a, b) => {
        const lumA = getPerceptualLuminance(a.r, a.g, a.b);
        const lumB = getPerceptualLuminance(b.r, b.g, b.b);
        return lumB - lumA; // Lightest to darkest
      });
    }
    if (sortMode === 'code') {
      return list.sort((a, b) => (a.code || a.hex).localeCompare(b.code || b.hex));
    }
    // Default: 'count' (most stitches/beads first)
    return list.sort((a, b) => {
      const idxA = palette.findIndex((item) => item.id === a.id);
      const idxB = palette.findIndex((item) => item.id === b.id);
      const countA = realCounts[idxA] ?? a.count ?? 0;
      const countB = realCounts[idxB] ?? b.count ?? 0;
      return countB - countA;
    });
  }, [filteredPalette, sortMode, palette, realCounts]);

  return (
    <aside className="w-80 max-w-[92vw] sm:w-72 xl:w-80 h-full bg-slate-900 border-l border-slate-800/90 flex flex-col z-10 shrink-0 shadow-2xl lg:shadow-none select-none overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800/90 bg-slate-950/40 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              Palette & Key
            </span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-mono font-bold">
              {palette.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onAddColor && (
              <label
                className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 flex items-center gap-1 transition cursor-pointer"
                title="Add a new custom color to the palette"
              >
                <Plus className="w-3 h-3 text-pink-400" />
                <span>Add</span>
                <input
                  type="color"
                  defaultValue="#FF0055"
                  onChange={(e) => onAddColor(e.target.value)}
                  className="hidden"
                />
              </label>
            )}
            {onCleanConfetti && (
              <button
                onClick={onCleanConfetti}
                className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 transition"
                title="Merge rare stray pixels (<1% count) into their closest matching color"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Clean</span>
              </button>
            )}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Collapse color palette"
              >
                <ChevronRight className="w-4 h-4" />
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
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search code, DMC/Anchor, name, symbol..."
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

        {/* Smart Floss Standards & Sorting Bar */}
        <div className="pt-1 border-t border-slate-800/60 flex flex-col gap-1.5">
          {/* Thread Standard Selector (DMC / Anchor / Both) for fiber/thread crafts */}
          {isThreadCraft ? (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-medium">Floss System:</span>
              <div className="flex items-center bg-slate-950/80 rounded-md p-0.5 border border-slate-800 font-semibold">
                <button
                  onClick={() => setFlossSystem('dmc')}
                  className={`px-2 py-0.5 rounded transition ${
                    flossSystem === 'dmc'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="DMC Stranded Cotton codes"
                >
                  DMC
                </button>
                <button
                  onClick={() => setFlossSystem('anchor')}
                  className={`px-2 py-0.5 rounded transition ${
                    flossSystem === 'anchor'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Anchor stranded cotton equivalent codes"
                >
                  Anchor
                </button>
                <button
                  onClick={() => setFlossSystem('both')}
                  className={`px-2 py-0.5 rounded transition ${
                    flossSystem === 'both'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Show both DMC and Anchor codes"
                >
                  Both
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[9px] text-slate-400 bg-slate-950/40 px-2 py-1 rounded-md border border-slate-800/60 font-mono">
              <span>Bead System:</span>
              <span className="text-amber-300 font-sans font-semibold">Perler • Artkal S • Hama Midi</span>
            </div>
          )}

          {/* Palette Sort Modes (Count | Rainbow | Value | Code) */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              Sort:
            </span>
            <div className="flex items-center bg-slate-950/80 rounded-md p-0.5 border border-slate-800 text-[10px] font-medium">
              <button
                onClick={() => setSortMode('count')}
                className={`px-1.5 py-0.5 rounded transition ${
                  sortMode === 'count'
                    ? 'bg-slate-700 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Sort by stitch/bead count (most used first)"
              >
                Count
              </button>
              <button
                onClick={() => setSortMode('hue')}
                className={`px-1.5 py-0.5 rounded transition ${
                  sortMode === 'hue'
                    ? 'bg-slate-700 text-pink-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Rainbow color order (sorted by hue angle)"
              >
                🌈 Hue
              </button>
              <button
                onClick={() => setSortMode('luminance')}
                className={`px-1.5 py-0.5 rounded transition ${
                  sortMode === 'luminance'
                    ? 'bg-slate-700 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tonal Value order (lightest to darkest luminance)"
              >
                ☯ Value
              </button>
              <button
                onClick={() => setSortMode('code')}
                className={`px-1.5 py-0.5 rounded transition ${
                  sortMode === 'code'
                    ? 'bg-slate-700 text-sky-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Sort alphanumerically by shade code"
              >
                Code
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Palette Color Cards List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 pb-24 lg:pb-2">
        {/* Low Contrast Similarity Alert Banner */}
        {similarPairs.length > 0 && showSimilarAlert && (
          <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-2 text-xs mb-1.5">
            <div className="flex items-center justify-between pb-1 mb-1 border-b border-amber-500/20">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[10px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>{similarPairs.length} color pair{similarPairs.length > 1 ? 's' : ''} have low contrast (ΔE &lt; 10)</span>
              </div>
              <button
                onClick={() => setShowSimilarAlert(false)}
                className="text-amber-400/80 hover:text-amber-200 p-0.5"
                title="Dismiss alert"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
              {similarPairs.map((pair, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 text-[10px]"
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded shrink-0 border border-white/20"
                      style={{ backgroundColor: pair.colorA.hex }}
                    />
                    <span className="text-slate-200 font-bold truncate max-w-[50px]">
                      {pair.colorA.code || pair.colorA.hex}
                    </span>
                    <span className="text-slate-500 text-[9px]">vs</span>
                    <div
                      className="w-3 h-3 rounded shrink-0 border border-white/20"
                      style={{ backgroundColor: pair.colorB.hex }}
                    />
                    <span className="text-slate-200 font-bold truncate max-w-[50px]">
                      {pair.colorB.code || pair.colorB.hex}
                    </span>
                    <span className="text-amber-400/90 font-mono text-[9px]">
                      ΔE {pair.deltaE}
                    </span>
                  </div>
                  {onSwapColor && (
                    <button
                      onClick={() => onSwapColor(pair.indexB, pair.indexA)}
                      className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[9px] transition shrink-0"
                      title={`Merge ${pair.colorB.code || 'B'} into ${pair.colorA.code || 'A'}`}
                    >
                      Merge
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {sortedPalette.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            No colors found matching this filter
          </div>
        ) : (
          sortedPalette.map((color) => {
            const originalIndex = palette.findIndex((c) => c.id === color.id);
            const isSpotlit = spotlightColorId === color.id;
            const isSelected = activeColorIndex === originalIndex;
            const done = completedCounts[originalIndex] || 0;
            const total = realCounts[originalIndex] ?? color.count ?? 0;
            const isColorComplete = total > 0 && done >= total;
            const anchorEquiv = getAnchorEquivalent(color.code);
            const beadEquiv = getBeadEquivalents(color.code);
            const luminance = getPerceptualLuminance(color.r, color.g, color.b);

            // Determine label display based on selected floss system
            let primaryCode = color.code || color.hex;
            let secondaryCode: string | null = null;

            if (isThreadCraft) {
              if (flossSystem === 'anchor') {
                if (anchorEquiv) {
                  primaryCode = `Anchor ${anchorEquiv.code}`;
                  secondaryCode = color.code ? `(DMC ${color.code})` : null;
                }
              } else if (flossSystem === 'both') {
                if (anchorEquiv) {
                  secondaryCode = `• ⚓ Anch ${anchorEquiv.code}`;
                }
              }
            }

            return (
              <div
                key={color.id}
                onClick={() => onSelectColor(originalIndex)}
                className={`group flex flex-col gap-1.5 p-2 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-800/95 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                    : isSpotlit
                    ? 'bg-amber-950/30 border-amber-500/50'
                    : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700/80'
                }`}
              >
                {/* Top Row: Swatch, Symbol, Code & Count / % */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="relative w-7 h-7 rounded-lg shadow-sm flex items-center justify-center font-bold text-xs shrink-0 border border-white/20 select-none"
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

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {primaryCode}
                        </span>
                        {secondaryCode && (
                          <span className="text-[10px] text-slate-400 font-medium truncate">
                            {secondaryCode}
                          </span>
                        )}
                        {color.isLocked && (
                          <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                        )}
                      </div>
                      {/* Bead Equivalents Tag (Artkal & Hama) */}
                      {!isThreadCraft && beadEquiv && (
                        <div className="text-[9px] text-amber-300 font-mono flex items-center gap-1">
                          <span>Artkal {beadEquiv.artkal}</span>
                          <span>•</span>
                          <span>Hama {beadEquiv.hama}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantities, Luminance & Percentage */}
                  <div className="text-right shrink-0 flex items-center gap-1.5 font-mono">
                    <span
                      className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-medium"
                      title={`Perceptual tonal luminance: ${luminance}%`}
                    >
                      L:{luminance}%
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {done > 0 ? (
                        <span className={isColorComplete ? 'text-emerald-400' : 'text-slate-300'}>
                          {done}/{total}
                        </span>
                      ) : (
                        <span>{total}</span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {color.percentage}%
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Full Name & Action Buttons */}
                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/50">
                  <div className="min-w-0 flex items-center gap-1 text-[11px] text-slate-400">
                    <span className="truncate" title={color.name || 'Custom Color'}>
                      {color.name || 'Custom Color'}
                    </span>
                    {craftType === 'cross-stitch' && (
                      <span className="text-[9px] text-indigo-400 font-sans shrink-0" title="Estimated DMC 8m skeins needed">
                        • {total > 1800 ? `${(total / 1800).toFixed(1)} sk` : '1 sk'}
                      </span>
                    )}
                    {craftType === 'perler' && (
                      <span className="text-[9px] text-amber-400 font-sans shrink-0" title="Estimated 1,000-bead packs needed">
                        • {Math.max(1, Math.ceil(total / 1000))} pk
                      </span>
                    )}
                    {craftType === 'crochet' && (
                      <span className="text-[9px] text-pink-400 font-sans shrink-0" title="Estimated yarn yardage & skeins">
                        • ~{Math.round(total * 0.9)} yd
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Amazon Shopping Button */}
                    <a
                      href={getAmazonSearchUrl(color)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md text-slate-500 hover:text-amber-400 hover:bg-slate-700/60 transition"
                      title={
                        craftType === 'crochet'
                          ? `Find ${color.name || ''} crochet yarn on Amazon`
                          : `Find ${color.name || color.code || 'supplies'} on Amazon`
                      }
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
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/60'
                      }`}
                      title={color.isLocked ? 'Unlock color' : 'Lock color'}
                    >
                      {color.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    {/* Swap / Recolor Color Button */}
                    {(onSwapColor || onSwapWithNewColor) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSwapSourceIndex(originalIndex);
                        }}
                        className="p-1 rounded-md text-slate-500 hover:text-pink-400 hover:bg-slate-700/60 transition"
                        title={`Swap / Replace all ${color.code || color.hex} stitches across canvas`}
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>
                    )}

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
          <span>
            {craftType === 'crochet' ? 'Shop Crochet Yarn on Amazon' : 'Shop Craft Supplies on Amazon'}
          </span>
          <ExternalLink className="w-3 h-3 text-amber-400" />
        </a>
        <div className="text-[9px] text-slate-500 text-center">
          Affiliate disclosure: We may earn a small commission on qualifying purchases.
        </div>
      </div>

      {/* Global Color Swap / Recolor Modal */}
      {swapSourceIndex !== null && palette[swapSourceIndex] && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSwapSourceIndex(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-4 flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-bold text-slate-100">Swap / Recolor Color</h3>
              </div>
              <button
                type="button"
                onClick={() => setSwapSourceIndex(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-semibold block mb-1">Source color to replace:</span>
              <div className="flex items-center gap-2.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                <div
                  className="w-7 h-7 rounded-lg shadow-sm border border-white/20 flex items-center justify-center font-bold text-xs shrink-0"
                  style={{
                    backgroundColor: palette[swapSourceIndex].hex,
                    color: getContrastingTextColor(
                      palette[swapSourceIndex].r,
                      palette[swapSourceIndex].g,
                      palette[swapSourceIndex].b
                    ),
                  }}
                >
                  {palette[swapSourceIndex].symbol}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-100 truncate">
                    {palette[swapSourceIndex].code || palette[swapSourceIndex].hex}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {palette[swapSourceIndex].name || 'Custom Color'} • {realCounts[swapSourceIndex] || 0} stitches
                  </div>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
                Replace with existing palette color:
              </span>
              <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                {palette.map((targetColor, targetIdx) => {
                  if (targetIdx === swapSourceIndex) return null;
                  return (
                    <button
                      key={targetColor.id}
                      type="button"
                      onClick={() => {
                        onSwapColor?.(swapSourceIndex, targetIdx);
                        setSwapSourceIndex(null);
                      }}
                      className="group flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-slate-800 border border-transparent hover:border-indigo-500/50 transition text-center"
                      title={`Swap to ${targetColor.name || targetColor.code || targetColor.hex}`}
                    >
                      <div
                        className="w-7 h-7 rounded-md shadow-sm border border-white/20 flex items-center justify-center font-bold text-[10px] group-hover:scale-105 transition"
                        style={{
                          backgroundColor: targetColor.hex,
                          color: getContrastingTextColor(targetColor.r, targetColor.g, targetColor.b),
                        }}
                      >
                        {targetColor.symbol}
                      </div>
                      <span className="text-[9px] text-slate-300 font-mono truncate w-full">
                        {targetColor.code || targetColor.symbol}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between">
              {onSwapWithNewColor && (
                <label className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 flex items-center gap-1.5 transition cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Swap to Custom Hex</span>
                  <input
                    type="color"
                    defaultValue="#38BDF8"
                    onChange={(e) => {
                      onSwapWithNewColor(swapSourceIndex, e.target.value);
                      setSwapSourceIndex(null);
                    }}
                    className="hidden"
                  />
                </label>
              )}
              <button
                type="button"
                onClick={() => setSwapSourceIndex(null)}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export const PaletteLegend = React.memo(PaletteLegendComponent);
