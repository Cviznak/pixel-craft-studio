import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Check,
  X,
  Copy,
  PackageCheck,
  Sparkles,
  ArrowUpDown,
  DollarSign,
  Package
} from 'lucide-react';
import type { PaletteColor, CraftType } from '../types/craft';
import { getContrastingTextColor } from '../utils/colorUtils';
import { getMyStash, saveMyStash } from '../utils/stashManager';
import { getAnchorEquivalent, getBeadEquivalents } from '../utils/threadEquivalents';

interface ShoppingTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  palette: PaletteColor[];
  gridData: number[][];
  craftType: CraftType;
  onStashUpdated?: () => void;
  onOpenMaterialKit?: () => void;
}

type CurrencySymbol = '$' | '€' | '£';

function getDefaultUnitPrice(craftType: CraftType): number {
  if (craftType === 'perler') return 2.99;
  if (craftType === 'crochet' || craftType === 'knitting') return 4.50;
  return 0.79; // Standard embroidery skein
}

function getQuantityRequired(count: number, craftType: CraftType): { units: number; label: string } {
  if (craftType === 'perler') {
    const packs = Math.max(1, Math.ceil(count / 1000));
    return { units: packs, label: `${packs} pk` };
  }
  if (craftType === 'crochet' || craftType === 'knitting') {
    const yards = count * 0.9;
    const skeins = Math.max(1, Math.ceil(yards / 200));
    return { units: skeins, label: `${skeins} sk` };
  }
  if (craftType === 'loom') {
    const tubes = Math.max(1, Math.ceil(count / 1000));
    return { units: tubes, label: `${tubes} tb` };
  }
  const skeins = Math.max(1, Math.ceil(count / 1800));
  return { units: skeins, label: `${skeins} sk` };
}

function parseSortableCode(raw?: string): { num: number; text: string } {
  if (!raw) return { num: 999999, text: '' };
  const match = raw.match(/(\d+)/);
  return {
    num: match ? parseInt(match[1], 10) : 999999,
    text: raw.toUpperCase(),
  };
}

export const ShoppingTripModal: React.FC<ShoppingTripModalProps> = ({
  isOpen,
  onClose,
  palette,
  gridData,
  craftType,
  onStashUpdated,
  onOpenMaterialKit,
}) => {
  const stashBrand: 'DMC' | 'Perler' = craftType === 'perler' ? 'Perler' : 'DMC';
  const [stashCodes, setStashCodes] = useState<Set<string>>(() => getMyStash(stashBrand));
  const [basketCodes, setBasketCodes] = useState<Set<string>>(new Set());
  const [filterTab, setFilterTab] = useState<'all' | 'todo' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'code' | 'count'>('code');
  const [currency, setCurrency] = useState<CurrencySymbol>('$');
  const [unitPrice, setUnitPrice] = useState<number>(() => getDefaultUnitPrice(craftType));
  const [copiedChecklist, setCopiedChecklist] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Sync stash & default unit price when opening or changing craft
  useEffect(() => {
    if (!isOpen) return;
    setStashCodes(getMyStash(stashBrand));
    setUnitPrice(getDefaultUnitPrice(craftType));
  }, [isOpen, stashBrand, craftType]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const liveCounts = useMemo(() => {
    const counts: Record<number, number> = {};
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

  const shoppingItems = useMemo(() => {
    const items = palette.map((color, idx) => {
      const codeKey = color.code || color.hex;
      const count = liveCounts[idx] ?? color.count ?? 0;
      const req = getQuantityRequired(count, craftType);
      const inStash = stashCodes.has(codeKey);
      const inBasket = basketCodes.has(codeKey);
      return {
        color,
        idx,
        codeKey,
        count,
        unitsNeeded: req.units,
        unitLabel: req.label,
        inStash,
        inBasket,
        isCovered: inStash || inBasket,
      };
    });

    items.sort((a, b) => {
      if (sortBy === 'count') {
        return b.count - a.count;
      }
      const pa = parseSortableCode(a.codeKey);
      const pb = parseSortableCode(b.codeKey);
      if (pa.num !== pb.num) return pa.num - pb.num;
      return pa.text.localeCompare(pb.text);
    });

    return items;
  }, [palette, liveCounts, craftType, stashCodes, basketCodes, sortBy]);

  const filteredItems = useMemo(() => {
    if (filterTab === 'todo') return shoppingItems.filter((item) => !item.isCovered);
    if (filterTab === 'done') return shoppingItems.filter((item) => item.isCovered);
    return shoppingItems;
  }, [shoppingItems, filterTab]);

  const stats = useMemo(() => {
    let totalUnitsToBuy = 0;
    let remainingToBuyCount = 0;
    let coveredCount = 0;
    for (const item of shoppingItems) {
      if (item.isCovered) {
        coveredCount++;
      } else {
        remainingToBuyCount++;
        totalUnitsToBuy += item.unitsNeeded;
      }
    }
    return {
      totalItems: shoppingItems.length,
      coveredCount,
      remainingToBuyCount,
      totalUnitsToBuy,
      estimatedCost: (totalUnitsToBuy * Math.max(0, unitPrice)).toFixed(2),
    };
  }, [shoppingItems, unitPrice]);

  if (!isOpen) return null;

  const toggleBasketItem = (codeKey: string, currentlyInStash: boolean) => {
    if (currentlyInStash) {
      const nextStash = new Set(stashCodes);
      nextStash.delete(codeKey);
      setStashCodes(nextStash);
      saveMyStash(stashBrand, nextStash);
      onStashUpdated?.();
      return;
    }

    setBasketCodes((prev) => {
      const next = new Set(prev);
      if (next.has(codeKey)) next.delete(codeKey);
      else next.add(codeKey);
      return next;
    });
  };

  const handleSaveBasketToStash = () => {
    if (basketCodes.size === 0) return;
    const merged = new Set(stashCodes);
    basketCodes.forEach((code) => merged.add(code));
    saveMyStash(stashBrand, merged);
    setStashCodes(merged);
    setBasketCodes(new Set());
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
    onStashUpdated?.();
  };

  const handleCopyChecklist = async () => {
    const lines = shoppingItems.map((item) => {
      const status = item.inStash ? '[STASH]' : item.inBasket ? '[BASKET]' : '[BUY]';
      return `${status} ${item.codeKey} (${item.color.name || 'Custom'}) — ${item.unitLabel} (${item.count} sts)`;
    });
    const text = `Pixel Craft Studio Shopping List (${craftType.toUpperCase()}):\nEstimated Remaining Cost: ${currency}${stats.estimatedCost}\n\n${lines.join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedChecklist(true);
      setTimeout(() => setCopiedChecklist(false), 2500);
    } catch {
      window.prompt('Copy shopping checklist:', text);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-150 select-none"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[94vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">In-Store Shopping Trip Mode</h2>
              <p className="text-[11px] text-slate-400">
                One-thumb aisle checklist sorted by shade code
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenMaterialKit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMaterialKit();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition"
                title="View complete physical kit (fabric, hoop, tools & threads)"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Full Supply Kit</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary & Pricing Bar */}
        <div className="shrink-0 p-3.5 bg-slate-950/60 border-b border-slate-800 space-y-2.5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400">Need to Buy</div>
              <div className="text-sm font-extrabold text-amber-300 font-mono">
                {stats.remainingToBuyCount} colors ({stats.totalUnitsToBuy})
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400">Stash / Basket</div>
              <div className="text-sm font-extrabold text-emerald-400 font-mono">
                {stats.coveredCount}/{stats.totalItems}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400">Est. Trip Cost</div>
              <div className="text-sm font-extrabold text-white font-mono">
                {currency}{stats.estimatedCost}
              </div>
            </div>
          </div>

          {/* Filter Pills + Unit Price + Sort */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-2.5 py-1 rounded-md transition ${
                  filterTab === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({stats.totalItems})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('todo')}
                className={`px-2.5 py-1 rounded-md transition ${
                  filterTab === 'todo' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Buy ({stats.remainingToBuyCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('done')}
                className={`px-2.5 py-1 rounded-md transition ${
                  filterTab === 'done' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Have ({stats.coveredCount})
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-0.5 text-[11px]">
                <DollarSign className="w-3 h-3 text-slate-500 mr-0.5" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencySymbol)}
                  className="bg-transparent text-slate-200 font-bold focus:outline-none mr-1"
                  aria-label="Currency"
                >
                  <option value="$" className="bg-slate-900">$</option>
                  <option value="€" className="bg-slate-900">€</option>
                  <option value="£" className="bg-slate-900">£</option>
                </select>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-12 bg-transparent text-amber-300 font-mono font-bold text-right focus:outline-none"
                  title="Price per skein / bead pack"
                />
              </div>

              <button
                type="button"
                onClick={() => setSortBy((prev) => (prev === 'code' ? 'count' : 'code'))}
                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1 transition"
                title="Toggle sort order"
              >
                <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                <span>{sortBy === 'code' ? 'By Code' : 'By Qty'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Checklist Rows (Large Tap Targets) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              {filterTab === 'todo'
                ? 'Everything needed is already in your stash or basket!'
                : 'No matching items in this view.'}
            </div>
          ) : (
            filteredItems.map((item) => {
              const anchor = getAnchorEquivalent(item.color.code);
              const bead = getBeadEquivalents(item.color.code);

              return (
                <button
                  key={item.color.id}
                  type="button"
                  onClick={() => toggleBasketItem(item.codeKey, item.inStash)}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition active:scale-[0.99] ${
                    item.isCovered
                      ? 'bg-emerald-950/25 border-emerald-500/40 opacity-85'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Large Checkbox Indicator */}
                    <div
                      className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 transition ${
                        item.isCovered
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-slate-600 bg-slate-900'
                      }`}
                    >
                      {item.isCovered && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>

                    {/* Swatch */}
                    <div
                      className="w-10 h-10 rounded-xl shadow-sm shrink-0 border border-white/20 flex items-center justify-center font-bold text-sm"
                      style={{
                        backgroundColor: item.color.hex,
                        color: getContrastingTextColor(item.color.r, item.color.g, item.color.b),
                      }}
                    >
                      {item.color.symbol}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-sm font-extrabold font-mono ${item.isCovered ? 'line-through text-slate-400' : 'text-white'}`}>
                          {item.codeKey}
                        </span>
                        {item.inStash && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                            In Stash
                          </span>
                        )}
                        {item.inBasket && !item.inStash && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            In Basket
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {item.color.name || 'Custom Color'}
                        {craftType !== 'perler' && anchor ? ` • Anch ${anchor.code}` : ''}
                        {craftType === 'perler' && bead ? ` • Artkal ${bead.artkal}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Right Quantity + Cost Badge */}
                  <div className="text-right shrink-0">
                    <div className="text-xs font-extrabold text-amber-300 font-mono">
                      {item.unitLabel}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.count} sts • {currency}{(item.unitsNeeded * unitPrice).toFixed(2)}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 p-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyChecklist}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            {copiedChecklist ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
            <span>{copiedChecklist ? 'Checklist Copied!' : 'Copy Text List'}</span>
          </button>

          <div className="flex items-center gap-2">
            {basketCodes.size > 0 && (
              <button
                type="button"
                onClick={handleSaveBasketToStash}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Save {basketCodes.size} to My Stash</span>
              </button>
            )}
            {savedToast && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
