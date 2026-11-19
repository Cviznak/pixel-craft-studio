import React, { useState, useEffect, useMemo } from 'react';
import type { GridConfig, PaletteColor, CellProgress } from '../types/craft';
import { 
  buildCraftSupplyKit, 
  buildAmazonKitUrl,
  type CraftSupplyKit 
} from '../utils/craftKitBuilder';
import { getActiveAffiliateTag, setCustomAffiliateTag, DEFAULT_AMAZON_TAG } from '../utils/amazonUtils';
import { getMyStash, saveMyStash } from '../utils/stashManager';
import { getContrastingTextColor } from '../utils/colorUtils';
import { 
  ShoppingCart, 
  Package, 
  ExternalLink, 
  Check, 
  X, 
  Copy, 
  Sparkles, 
  Layers, 
  Scissors, 
  Settings2,
  Tag
} from 'lucide-react';

interface MaterialKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GridConfig;
  palette: PaletteColor[];
  gridData: number[][];
  completedCells?: CellProgress;
  onOpenShoppingTrip?: () => void;
}

export const MaterialKitModal: React.FC<MaterialKitModalProps> = ({
  isOpen,
  onClose,
  config,
  palette,
  gridData,
  completedCells,
  onOpenShoppingTrip,
}) => {
  const stashBrand = config.craftType === 'perler' ? 'Perler' : 'DMC';
  const [stashCodes, setStashCodes] = useState<Set<string>>(() => getMyStash(stashBrand));
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'missing' | 'stash'>('missing');
  const [copiedChecklist, setCopiedChecklist] = useState<boolean>(false);
  const [showTagSettings, setShowTagSettings] = useState<boolean>(false);
  const [customTagInput, setCustomTagInput] = useState<string>(() => getActiveAffiliateTag());
  const [checkedTools, setCheckedTools] = useState<Record<string, boolean>>({});

  // Sync stash on open
  useEffect(() => {
    if (!isOpen) return;
    setStashCodes(getMyStash(stashBrand));
    setCustomTagInput(getActiveAffiliateTag());
  }, [isOpen, stashBrand]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Generate kit specifications
  const kit: CraftSupplyKit = useMemo(() => {
    return buildCraftSupplyKit(config, palette, gridData, completedCells, stashCodes);
  }, [config, palette, gridData, completedCells, stashCodes]);

  // Toggle stash item
  const handleToggleStash = (codeKey: string) => {
    const nextStash = new Set(stashCodes);
    if (nextStash.has(codeKey)) {
      nextStash.delete(codeKey);
    } else {
      nextStash.add(codeKey);
    }
    setStashCodes(nextStash);
    saveMyStash(stashBrand, nextStash);
  };

  // Toggle optional tool check
  const handleToggleToolCheck = (toolId: string) => {
    setCheckedTools((prev) => ({
      ...prev,
      [toolId]: !prev[toolId]
    }));
  };

  // Copy full checklist to clipboard
  const handleCopyChecklist = () => {
    const lines: string[] = [
      `🎨 Pixel Craft Studio - Supply Checklist`,
      `Craft: ${config.craftType.toUpperCase()} | Size: ${config.width}×${config.height} (${kit.dimensionsSummary})`,
      `Total Pieces: ${kit.totalPieces.toLocaleString()} | Palette: ${palette.length} Colors`,
      `------------------------------------------`,
      `📦 BASE & FRAMING:`,
      ...kit.baseAndFrameItems.map(item => `• [ ] ${item.name} (${item.specs}) - Qty: ${item.quantityNeeded}`),
      ``,
      `✂️ ESSENTIAL TOOLS:`,
      ...kit.essentialTools.map(tool => `• [ ] ${tool.name} (${tool.specs})`),
      ``,
      `🧵 PALETTE COLORS (${palette.length} total):`,
    ];

    kit.paletteSupplies.forEach(p => {
      const code = p.color.code || p.color.hex;
      const status = p.inStash ? '[✓ HAVE IN STASH]' : `[ ] NEED ${p.unitLabel}`;
      lines.push(`• ${status} ${code} ${p.color.name || ''} (${p.color.count} sts)`);
    });

    lines.push(``);
    lines.push(`🛒 Order kit on Amazon: ${kit.oneClickAmazonUrl}`);

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopiedChecklist(true);
      setTimeout(() => setCopiedChecklist(false), 2200);
    });
  };

  // Save custom affiliate tag
  const handleSaveAffiliateTag = () => {
    setCustomAffiliateTag(customTagInput);
    setShowTagSettings(false);
  };

  const missingPaletteCount = kit.paletteSupplies.filter(p => !p.inStash).length;
  const inStashCount = kit.paletteSupplies.filter(p => p.inStash).length;

  const filteredPalette = kit.paletteSupplies.filter(p => {
    if (paletteFilter === 'missing') return !p.inStash;
    if (paletteFilter === 'stash') return p.inStash;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2.5 sm:p-4 select-none animate-in fade-in duration-150"
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header (Pinned) */}
        <div className="shrink-0 p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  Smart Craft Supply Kit & Materials
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider shrink-0">
                  {config.craftType}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {kit.dimensionsSummary} • {palette.length} colors • {kit.totalPieces.toLocaleString()} pieces
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => setShowTagSettings(!showTagSettings)}
              className={`p-1.5 rounded-xl border transition ${
                showTagSettings
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'
              }`}
              title="Affiliate Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Custom Affiliate Tag Drawer (if open) */}
        {showTagSettings && (
          <div className="shrink-0 p-3 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-bold text-slate-200">Amazon Associates Tag:</span>
                <p className="text-[10px] text-slate-400">
                  Creators can insert their own affiliate tag to earn commissions from shared kits.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="tag-20"
                className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs w-36 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleSaveAffiliateTag}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs transition"
              >
                Save Tag
              </button>
              {customTagInput !== DEFAULT_AMAZON_TAG && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomTagInput(DEFAULT_AMAZON_TAG);
                    setCustomAffiliateTag(DEFAULT_AMAZON_TAG);
                  }}
                  className="text-[10px] text-slate-400 hover:text-white underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. Primary 1-Click Amazon Checkout Action Banner */}
        <div className="shrink-0 p-3 sm:p-4 bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-amber-950/40 border-b border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>1-Click Smart Supplies Order</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
              Launch pre-filtered search with all matching fabric, tools, and materials on Amazon.
            </p>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-3">
              <span>Estimated kit total: <strong className="text-amber-300 font-mono text-xs">${kit.estimatedTotalUsd.toFixed(2)}</strong></span>
              <span>•</span>
              <span className="text-slate-500 italic">As an Amazon Associate I earn from qualifying purchases</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={kit.oneClickAmazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition active:scale-95"
            >
              <ShoppingCart className="w-4 h-4 fill-slate-950" />
              <span>Order Kit on Amazon</span>
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
            </a>
          </div>
        </div>

        {/* 4. Scrollable Kit Contents */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-5 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
          {/* Section A: Base Surface & Framing */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Base Materials & Framing Sizing</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {kit.baseAndFrameItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-white text-xs sm:text-sm">
                        {item.name}
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 shrink-0">
                        ~${item.estimatedPriceUsd.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 font-medium mt-1">
                      {item.specs}
                    </p>
                    {item.notes && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Qty: {item.quantityNeeded}
                    </span>
                    <a
                      href={buildAmazonKitUrl(item.amazonQuery)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <span>Find on Amazon</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Recommended Starter Bundle */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 to-purple-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    {kit.starterBundleRecommendation.name}
                  </h4>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Best Value Starter Pack
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200/90 mt-0.5 font-medium">
                  {kit.starterBundleRecommendation.specs}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {kit.starterBundleRecommendation.notes}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center shrink-0">
              <span className="text-xs font-bold font-mono text-amber-300 mr-1">
                ~${kit.starterBundleRecommendation.estimatedPriceUsd.toFixed(2)}
              </span>
              <a
                href={buildAmazonKitUrl(kit.starterBundleRecommendation.amazonQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <span>View Bundle</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Section C: Essential Tools Checklist */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-emerald-400" />
              <span>Essential Crafting Tools Checklist</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {kit.essentialTools.map((tool) => {
                const isChecked = checkedTools[tool.id] ?? false;
                return (
                  <div
                    key={tool.id}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition ${
                      isChecked
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleToolCheck(tool.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'bg-slate-900 border-slate-700 text-transparent hover:border-slate-500'
                          }`}
                          title="Mark as already owned"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>
                        <div className="min-w-0">
                          <h5 className={`font-bold text-xs ${isChecked ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {tool.name}
                          </h5>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {tool.specs}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">
                        ~${tool.estimatedPriceUsd.toFixed(2)}
                      </span>
                      <a
                        href={buildAmazonKitUrl(tool.amazonQuery)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <span>Amazon</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section D: Thread / Bead / Yarn Palette Breakdown */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-pink-400" />
                <span>Palette Floss & Beads Checklist ({palette.length} colors)</span>
              </h3>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPaletteFilter('missing')}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition ${
                    paletteFilter === 'missing'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Need ({missingPaletteCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPaletteFilter('stash')}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition ${
                    paletteFilter === 'stash'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  In Stash ({inStashCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPaletteFilter('all')}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition ${
                    paletteFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({palette.length})
                </button>
              </div>
            </div>

            {/* Color list grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {filteredPalette.length === 0 ? (
                <div className="col-span-full p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                  {paletteFilter === 'missing' 
                    ? '🎉 Amazing! You already have all palette colors in your stash!'
                    : 'No colors matching this filter.'}
                </div>
              ) : (
                filteredPalette.map((p) => {
                  const codeKey = p.color.code ? p.color.code.toUpperCase().replace('DMC', '').replace('~', '').trim() : '';
                  return (
                    <div
                      key={p.color.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition ${
                        p.inStash
                          ? 'bg-emerald-950/20 border-emerald-500/30 opacity-80'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Swatch */}
                        <div
                          className="w-8 h-8 rounded-lg shadow-inner shrink-0 border border-white/20 flex items-center justify-center font-bold text-xs"
                          style={{
                            backgroundColor: p.color.hex,
                            color: getContrastingTextColor(p.color.r, p.color.g, p.color.b),
                          }}
                        >
                          {p.color.symbol}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-bold font-mono ${p.inStash ? 'line-through text-slate-400' : 'text-white'}`}>
                              {codeKey || p.color.hex}
                            </span>
                            {p.inStash && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                                In Stash
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {p.color.name || 'Custom Shade'} • {p.color.count} sts
                          </div>
                          <div className="text-[10px] font-bold text-amber-300 font-mono">
                            {p.unitLabel}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <a
                          href={buildAmazonKitUrl(p.amazonQuery)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition"
                          title="Search color on Amazon"
                        >
                          <span>Buy</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleToggleStash(codeKey || p.color.id || p.color.hex)}
                          className={`text-[9px] px-1.5 py-0.5 rounded transition ${
                            p.inStash
                              ? 'bg-slate-800 text-slate-400 hover:text-white'
                              : 'text-slate-400 hover:text-emerald-300 underline'
                          }`}
                        >
                          {p.inStash ? 'Remove' : '+ I have this'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 5. Sticky Footer (Pinned) */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyChecklist}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copiedChecklist ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedChecklist ? 'Checklist Copied!' : 'Copy Supply List'}</span>
            </button>

            {onOpenShoppingTrip && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShoppingTrip();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-indigo-400" />
                <span>In-Store Shopping Mode</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={kit.oneClickAmazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Checkout Amazon Kit</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
