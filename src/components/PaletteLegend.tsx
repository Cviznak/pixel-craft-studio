import React, { useState } from 'react';
import type { PaletteColor, CellProgress, CraftType } from '../types/craft';
import { getContrastingTextColor } from '../utils/colorUtils';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Palette, 
  Search, 
  ShoppingCart, 
  Tag, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Coffee 
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
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showTagConfig, setShowTagConfig] = useState(false);
  const [affiliateTag, setAffiliateTag] = useState(() => {
    try {
      return localStorage.getItem('amazon_affiliate_tag') || '';
    } catch {
      return '';
    }
  });

  const handleSaveTag = (tag: string) => {
    setAffiliateTag(tag);
    try {
      localStorage.setItem('amazon_affiliate_tag', tag);
    } catch {
      // Ignore
    }
  };

  const getAmazonSearchUrl = (color: PaletteColor) => {
    let query = '';
    if (craftType === 'perler') {
      query = `perler beads ${color.name || color.code || ''}`.trim();
    } else if (craftType === 'cross-stitch') {
      const codeOnly = color.code ? color.code.replace('DMC', '').replace('~', '').trim() : '';
      query = `dmc ${codeOnly || color.name || ''} embroidery floss`.trim();
    } else if (craftType === 'diamond') {
      query = `diamond painting drills ${color.code || color.name || ''}`.trim();
    } else {
      query = `pixel craft supplies ${color.name || ''}`.trim();
    }

    const base = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
    return affiliateTag ? `${base}&tag=${encodeURIComponent(affiliateTag)}` : base;
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

  const filteredPalette = palette.filter((c) => {
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
    <aside className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-10 shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Color Key & Shopping List
            </h3>
          </div>
          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 font-mono">
            {palette.length} colors
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search code, name, or symbol..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950/70 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Palette List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
        {filteredPalette.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No colors match your search
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
                className={`group flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 ring-1 ring-indigo-500/80 shadow-md'
                    : 'hover:bg-slate-850/60'
                } ${isSpotlit ? 'bg-amber-950/30 border border-amber-500/40' : ''}`}
              >
                {/* Left: Swatch & Symbol */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="relative w-8 h-8 rounded-lg shadow-inner flex items-center justify-center font-bold text-sm shrink-0 border border-white/20"
                    style={{
                      backgroundColor: color.hex,
                      color: getContrastingTextColor(color.r, color.g, color.b),
                    }}
                  >
                    <span>{color.symbol}</span>
                    {/* Color picker input hidden trigger */}
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
                      <span className="text-xs font-bold text-slate-200 truncate">
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

                {/* Right: Quantity & Actions */}
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
                    <div className="text-[10px] text-slate-500">
                      {color.percentage}%
                    </div>
                  </div>

                  {/* Amazon Shopping Link */}
                  <a
                    href={getAmazonSearchUrl(color)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-700/60 transition opacity-70 group-hover:opacity-100"
                    title={`Buy ${color.name || color.code || 'supplies'} on Amazon`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </a>

                  {/* Spotlight Isolation Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSpotlight(color.id);
                    }}
                    className={`p-1.5 rounded-lg transition ${
                      isSpotlit
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:bg-slate-700/60 hover:text-amber-300'
                    }`}
                    title={isSpotlit ? 'Clear spotlight' : 'Spotlight this color on grid'}
                  >
                    {isSpotlit ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Lock Color Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLockColor(originalIndex);
                    }}
                    className={`p-1.5 rounded-lg transition ${
                      color.isLocked
                        ? 'text-amber-400 hover:bg-slate-700/60'
                        : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-slate-300'
                    }`}
                    title={color.isLocked ? 'Unlock color' : 'Lock color (preserves it during re-quantization)'}
                  >
                    {color.isLocked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info & Supplies */}
      <div className="border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-400 p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">💡 Tap swatch to fine-tune color</span>
          <button
            onClick={() => onToggleSpotlight('')}
            disabled={!spotlightColorId}
            className="text-xs text-indigo-400 hover:underline disabled:opacity-30 disabled:hover:no-underline font-medium"
          >
            Reset Spotlight
          </button>
        </div>

        {/* Quick Links: Buy Supplies & Coffee */}
        <div className="flex items-center gap-1.5 pt-1">
          <a
            href={`https://www.amazon.com/s?k=${encodeURIComponent(
              craftType === 'perler'
                ? 'perler beads craft kit'
                : craftType === 'cross-stitch'
                ? 'dmc embroidery floss kit'
                : 'diamond painting supplies kit'
            )}${affiliateTag ? `&tag=${encodeURIComponent(affiliateTag)}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition"
          >
            <ShoppingCart className="w-3 h-3 text-amber-400" />
            <span>Amazon Supplies</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>

          <a
            href="https://buymeacoffee.com/orjustdosomething"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/30 text-yellow-300 text-[11px] font-semibold transition"
            title="Support this project on Buy Me a Coffee"
          >
            <Coffee className="w-3 h-3 text-yellow-400" />
            <span>Coffee</span>
          </a>
        </div>

        {/* Affiliate Tag Configuration (Collapsible) */}
        <div className="pt-1">
          <button
            onClick={() => setShowTagConfig((prev) => !prev)}
            className="flex items-center justify-between w-full text-[10px] text-slate-500 hover:text-slate-400 py-0.5"
          >
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-500" />
              <span>Affiliate Tag: <span className="font-mono text-slate-300">{affiliateTag || 'none'}</span></span>
            </span>
            {showTagConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showTagConfig && (
            <div className="mt-1.5 p-2 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5">
              <label className="text-[10px] text-slate-400 block">
                Your Amazon Associate Tag (e.g. <span className="font-mono text-indigo-300">myid-20</span>):
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={affiliateTag}
                  onChange={(e) => handleSaveTag(e.target.value.trim())}
                  placeholder="e.g. craftstudio-20"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
                {affiliateTag && (
                  <button
                    onClick={() => handleSaveTag('')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] rounded"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[9px] text-slate-500 leading-tight">
                All Amazon links in this app will use your tag so you earn commission on purchases.
              </p>
            </div>
          )}
        </div>

        {/* Required FTC / Amazon Disclosure */}
        <p className="text-[9px] text-slate-500 text-center italic">
          As an Amazon Associate I earn from qualifying purchases.
        </p>
      </div>
    </aside>
  );
};
