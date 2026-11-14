import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  X, 
  Search, 
  Check, 
  Trash2, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';
import { DMC_COLORS, PERLER_COLORS } from '../utils/craftData';
import { 
  getMyStash, 
  saveMyStash, 
  POPULAR_DMC_STARTER, 
  POPULAR_PERLER_STARTER 
} from '../utils/stashManager';

interface MyStashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStashUpdated?: () => void;
}

export const MyStashModal: React.FC<MyStashModalProps> = ({
  isOpen,
  onClose,
  onStashUpdated,
}) => {
  const [brand, setBrand] = useState<'DMC' | 'Perler'>('DMC');
  const [search, setSearch] = useState<string>('');
  const [dmcStash, setDmcStash] = useState<Set<string>>(new Set());
  const [perlerStash, setPerlerStash] = useState<Set<string>>(new Set());

  // Load from localStorage on open
  useEffect(() => {
    if (isOpen) {
      setDmcStash(getMyStash('DMC'));
      setPerlerStash(getMyStash('Perler'));
    }
  }, [isOpen]);

  const activeCatalog = useMemo(() => {
    return brand === 'DMC' ? DMC_COLORS : PERLER_COLORS;
  }, [brand]);

  const activeStash = brand === 'DMC' ? dmcStash : perlerStash;

  const filteredColors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeCatalog;
    return activeCatalog.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [activeCatalog, search]);

  const toggleColor = (code: string) => {
    if (brand === 'DMC') {
      setDmcStash((prev) => {
        const next = new Set(prev);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        saveMyStash('DMC', next);
        if (onStashUpdated) onStashUpdated();
        return next;
      });
    } else {
      setPerlerStash((prev) => {
        const next = new Set(prev);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        saveMyStash('Perler', next);
        if (onStashUpdated) onStashUpdated();
        return next;
      });
    }
  };

  const handleLoadStarterKit = () => {
    if (brand === 'DMC') {
      const next = new Set([...Array.from(dmcStash), ...POPULAR_DMC_STARTER]);
      setDmcStash(next);
      saveMyStash('DMC', next);
    } else {
      const next = new Set([...Array.from(perlerStash), ...POPULAR_PERLER_STARTER]);
      setPerlerStash(next);
      saveMyStash('Perler', next);
    }
    if (onStashUpdated) onStashUpdated();
  };

  const handleSelectAll = () => {
    const allCodes = activeCatalog.map((c) => c.code);
    const next = new Set(allCodes);
    if (brand === 'DMC') {
      setDmcStash(next);
      saveMyStash('DMC', next);
    } else {
      setPerlerStash(next);
      saveMyStash('Perler', next);
    }
    if (onStashUpdated) onStashUpdated();
  };

  const handleClearAll = () => {
    const next = new Set<string>();
    if (brand === 'DMC') {
      setDmcStash(next);
      saveMyStash('DMC', next);
    } else {
      setPerlerStash(next);
      saveMyStash('Perler', next);
    }
    if (onStashUpdated) onStashUpdated();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white shadow-lg shadow-emerald-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                My Physical Craft Stash
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {activeStash.size} of {activeCatalog.length} Owned
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Check off floss & beads in your home inventory to create patterns with zero new purchases
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Brand Switcher, Search & Quick Actions */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between text-xs">
          {/* Brand Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setBrand('DMC')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                brand === 'DMC'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DMC Floss (175+)
            </button>
            <button
              onClick={() => setBrand('Perler')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                brand === 'Perler'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Perler Beads (40)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or color name..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quick Batch Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleLoadStarterKit}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1 transition"
              title="Add common 36+ starter colors to stash"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Starter Kit</span>
            </button>
            <button
              onClick={handleSelectAll}
              className="px-2 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
              title="Select all catalog colors"
            >
              All
            </button>
            <button
              onClick={handleClearAll}
              className="px-2 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
              title="Clear stash"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Color Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {filteredColors.map((color) => {
            const isOwned = activeStash.has(color.code);
            return (
              <button
                key={color.code}
                onClick={() => toggleColor(color.code)}
                className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition relative select-none ${
                  isOwned
                    ? 'bg-slate-850 border-emerald-500/80 shadow-sm ring-1 ring-emerald-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850/60 opacity-60 hover:opacity-100'
                }`}
              >
                {/* Swatch */}
                <div
                  className="w-7 h-7 rounded-lg shrink-0 border border-white/20 shadow-sm flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: color.hex }}
                >
                  {isOwned && (
                    <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="font-mono font-bold text-xs text-slate-200 truncate flex items-center justify-between">
                    <span>{color.code}</span>
                    {isOwned && (
                      <span className="text-[9px] font-sans text-emerald-400 font-semibold">OWNED</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {color.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Stash is auto-saved locally on your device.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
