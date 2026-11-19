import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Palette,
  Search,
  X,
  Check,
  Copy,
  ExternalLink,
  Plus,
  Sparkles,
  ArrowLeftRight,
  Shuffle,
  HelpCircle,
  PackageCheck,
} from 'lucide-react';
import {
  DMC_COLORS,
  PERLER_COLORS,
  MIYUKI_DELICA_COLORS,
  COLOR_FAMILIES,
  findClosestCraftColor,
  findClosestCraftColors,
  getColorFamily,
  type ColorFamily,
  type CraftStandardColor,
} from '../utils/craftData';
import {
  getAnchorEquivalent,
  getBeadEquivalents,
  findDmcByAnchorCode,
  getPerceptualLuminance,
} from '../utils/threadEquivalents';
import { hexToRgb, getContrastingTextColor } from '../utils/colorUtils';
import { getMyStash, saveMyStash } from '../utils/stashManager';
import { buildAmazonKitUrl } from '../utils/craftKitBuilder';

export type ColorChartTab = 'hex-matcher' | 'dmc-anchor' | 'perler' | 'miyuki';

interface ColorChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ColorChartTab;
  onTabChange?: (tab: ColorChartTab) => void;
  onAddColorToPalette?: (hex: string, label?: string) => void;
  onStashUpdated?: () => void;
}

const TRENDING_PRESETS: Array<{ name: string; hex: string }> = [
  { name: 'Sage', hex: '#7A9A7E' },
  { name: 'Terracotta', hex: '#C66B4F' },
  { name: 'Blush', hex: '#F3B8C2' },
  { name: 'Navy', hex: '#182B49' },
  { name: 'Mustard', hex: '#D4A024' },
  { name: 'Lavender', hex: '#A992C9' },
  { name: 'Emerald', hex: '#1B7F5C' },
  { name: 'Charcoal', hex: '#373D43' },
];

type SortMode = 'spectrum' | 'code' | 'lightness';
type MiyukiFinishFilter = 'All' | 'Opaque' | 'Matte' | 'Metallic' | 'Lined & Pearl';

function parseCodeSortKey(code: string): { num: number; text: string } {
  const match = code.match(/(\d+)/);
  return {
    num: match ? parseInt(match[1], 10) : 999999,
    text: code.toUpperCase(),
  };
}

function sortCatalogColors(list: CraftStandardColor[], mode: SortMode): CraftStandardColor[] {
  if (mode === 'spectrum') return list;
  const copy = [...list];
  if (mode === 'code') {
    return copy.sort((a, b) => {
      const ka = parseCodeSortKey(a.code);
      const kb = parseCodeSortKey(b.code);
      if (ka.num !== kb.num) return ka.num - kb.num;
      return ka.text.localeCompare(kb.text);
    });
  }
  return copy.sort(
    (a, b) => getPerceptualLuminance(b.r, b.g, b.b) - getPerceptualLuminance(a.r, a.g, a.b)
  );
}

function normalizeHexInput(value: string): string | null {
  const clean = value.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return `#${clean.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    const expanded = clean
      .split('')
      .map((ch) => ch + ch)
      .join('')
      .toUpperCase();
    return `#${expanded}`;
  }
  return null;
}

export const ColorChartModal: React.FC<ColorChartModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'hex-matcher',
  onTabChange,
  onAddColorToPalette,
  onStashUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<ColorChartTab>(initialTab);
  const [prevInitialTab, setPrevInitialTab] = useState<ColorChartTab>(initialTab);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);

  // Hex Matcher State
  const [matcherHex, setMatcherHex] = useState<string>('#7A9A7E');
  const [hexDraft, setHexDraft] = useState<string>('#7A9A7E');

  // Shared Filter & Sort State for Catalog Tabs
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [familyFilter, setFamilyFilter] = useState<'All' | ColorFamily>('All');
  const [sortMode, setSortMode] = useState<SortMode>('spectrum');
  const [miyukiFinishFilter, setMiyukiFinishFilter] = useState<MiyukiFinishFilter>('All');

  // Personal Stash State & UI Feedback
  const [dmcStash, setDmcStash] = useState<Set<string>>(() => getMyStash('DMC'));
  const [perlerStash, setPerlerStash] = useState<Set<string>>(() => getMyStash('Perler'));
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setDmcStash(getMyStash('DMC'));
      setPerlerStash(getMyStash('Perler'));
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelectTab = (tab: ColorChartTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const handleHexDraftChange = (val: string) => {
    setHexDraft(val);
    const normalized = normalizeHexInput(val);
    if (normalized) {
      setMatcherHex(normalized);
    }
  };

  const handlePickColor = (hex: string) => {
    const upper = hex.toUpperCase();
    setMatcherHex(upper);
    setHexDraft(upper);
  };

  const handleRandomColor = () => {
    const hex = `#${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase()}`;
    handlePickColor(hex);
  };

  const handleCopyText = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCode(idKey);
      setTimeout(() => setCopiedCode(null), 1600);
    });
  };

  const toggleStashItem = (brand: 'DMC' | 'Perler', code: string) => {
    if (brand === 'DMC') {
      const next = new Set(dmcStash);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      setDmcStash(next);
      saveMyStash('DMC', next);
    } else {
      const next = new Set(perlerStash);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      setPerlerStash(next);
      saveMyStash('Perler', next);
    }
    onStashUpdated?.();
  };

  // Top 5 CIELAB Matches for Hex Matcher Tab
  const matcherResults = useMemo(() => {
    const rgb = hexToRgb(matcherHex);
    return {
      rgb,
      dmc: findClosestCraftColors(rgb.r, rgb.g, rgb.b, 'DMC', 5),
      perler: findClosestCraftColors(rgb.r, rgb.g, rgb.b, 'Perler', 5),
      miyuki: findClosestCraftColors(rgb.r, rgb.g, rgb.b, 'Miyuki', 5),
    };
  }, [matcherHex]);

  // Filtered DMC Catalog
  const filteredDmc = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const anchorMatches = q ? new Set(findDmcByAnchorCode(q)) : null;

    const list = DMC_COLORS.filter((c) => {
      if (familyFilter !== 'All' && getColorFamily(c.r, c.g, c.b) !== familyFilter) {
        return false;
      }
      if (!q) return true;
      const anchor = getAnchorEquivalent(c.code);
      return (
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.hex.toLowerCase().includes(q) ||
        (anchor ? anchor.code.toLowerCase().includes(q) : false) ||
        (anchorMatches ? anchorMatches.has(c.code) : false)
      );
    });

    return sortCatalogColors(list, sortMode);
  }, [searchQuery, familyFilter, sortMode]);

  // Filtered Perler Catalog
  const filteredPerler = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = PERLER_COLORS.filter((c) => {
      if (familyFilter !== 'All' && getColorFamily(c.r, c.g, c.b) !== familyFilter) {
        return false;
      }
      if (!q) return true;
      const eq = getBeadEquivalents(c.code);
      return (
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.hex.toLowerCase().includes(q) ||
        (eq
          ? eq.artkal.toLowerCase().includes(q) || eq.hama.toLowerCase().includes(q)
          : false)
      );
    });

    return sortCatalogColors(list, sortMode);
  }, [searchQuery, familyFilter, sortMode]);

  // Filtered Miyuki Delica Catalog
  const filteredMiyuki = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = MIYUKI_DELICA_COLORS.filter((c) => {
      const fin = (c.finish || '').toLowerCase();
      if (miyukiFinishFilter === 'Opaque' && fin !== 'opaque' && fin !== 'duracoat opaque') {
        return false;
      }
      if (miyukiFinishFilter === 'Matte' && fin !== 'matte') {
        return false;
      }
      if (miyukiFinishFilter === 'Metallic' && !fin.includes('metallic')) {
        return false;
      }
      if (
        miyukiFinishFilter === 'Lined & Pearl' &&
        !fin.includes('ceylon') &&
        !fin.includes('silver-lined')
      ) {
        return false;
      }
      if (familyFilter !== 'All' && getColorFamily(c.r, c.g, c.b) !== familyFilter) {
        return false;
      }
      if (!q) return true;
      return (
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.hex.toLowerCase().includes(q) ||
        fin.includes(q)
      );
    });

    return sortCatalogColors(list, sortMode);
  }, [searchQuery, familyFilter, miyukiFinishFilter, sortMode]);

  if (!isOpen) return null;

  const totalCatalogCount = DMC_COLORS.length + PERLER_COLORS.length + MIYUKI_DELICA_COLORS.length;
  const isHexValid = normalizeHexInput(hexDraft) !== null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[93vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* 1. Pinned Header */}
        <div className="shrink-0 p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-white truncate m-0">
                  Interactive Thread & Bead Color Chart & Hex Matcher
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  {totalCatalogCount} Calibrated Shades
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                CIELAB perceptual hex matcher & cross-reference chart for DMC, Anchor, Perler, Artkal, Hama & Miyuki Delica
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            aria-label="Close color chart"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. 4 Navigation Tabs */}
        <div className="shrink-0 px-3 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'hex-matcher' as const, label: 'Hex Matcher (CIELAB)' },
            { id: 'dmc-anchor' as const, label: `DMC ↔ Anchor (${DMC_COLORS.length})` },
            { id: 'perler' as const, label: `Perler / Artkal / Hama (${PERLER_COLORS.length})` },
            { id: 'miyuki' as const, label: `Miyuki Delica 11/0 (${MIYUKI_DELICA_COLORS.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition shrink-0 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 3. Filter Bar for Catalog Tabs */}
        {activeTab !== 'hex-matcher' && (
          <div className="shrink-0 p-2.5 sm:p-3 bg-slate-950/40 border-b border-slate-800/80 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'dmc-anchor'
                      ? 'Search DMC or Anchor code, name, or #hex...'
                      : activeTab === 'perler'
                      ? 'Search Perler (P05), Artkal (S02), Hama, or name...'
                      : 'Search Delica DB code, finish, or color name...'
                  }
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                aria-label="Sort shades"
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="spectrum">Sort: Color Spectrum</option>
                <option value="code">Sort: Shade Code</option>
                <option value="lightness">Sort: Light to Dark</option>
              </select>

              {(familyFilter !== 'All' || searchQuery || miyukiFinishFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setFamilyFilter('All');
                    setSearchQuery('');
                    setMiyukiFinishFilter('All');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Color Family Pills */}
            <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setFamilyFilter('All')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition shrink-0 ${
                  familyFilter === 'All'
                    ? 'bg-pink-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All Families
              </button>
              {COLOR_FAMILIES.map((fam) => (
                <button
                  key={fam}
                  type="button"
                  onClick={() => setFamilyFilter(fam)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition shrink-0 ${
                    familyFilter === fam
                      ? 'bg-pink-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {fam}
                </button>
              ))}
            </div>

            {/* Miyuki Finish Pills */}
            {activeTab === 'miyuki' && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Finish:
                </span>
                {(['All', 'Opaque', 'Matte', 'Metallic', 'Lined & Pearl'] as MiyukiFinishFilter[]).map(
                  (fin) => (
                    <button
                      key={fin}
                      type="button"
                      onClick={() => setMiyukiFinishFilter(fin)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition ${
                        miyukiFinishFilter === fin
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {fin}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. Scrollable Main Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-6 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
          {/* TAB 1: HEX MATCHER */}
          {activeTab === 'hex-matcher' && (
            <div className="space-y-5">
              {/* Target Color Picker Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <label className="relative w-16 h-16 rounded-2xl border-2 border-white/20 shadow-lg cursor-pointer overflow-hidden shrink-0">
                    <input
                      type="color"
                      value={matcherHex}
                      onChange={(e) => handlePickColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="Pick target hex color"
                    />
                    <div
                      className="w-full h-full flex items-center justify-center text-[10px] font-bold font-mono"
                      style={{
                        backgroundColor: matcherHex,
                        color: getContrastingTextColor(
                          matcherResults.rgb.r,
                          matcherResults.rgb.g,
                          matcherResults.rgb.b
                        ),
                      }}
                    >
                      Pick
                    </div>
                  </label>

                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span>Target Color</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        RGB({matcherResults.rgb.r}, {matcherResults.rgb.g}, {matcherResults.rgb.b})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={hexDraft}
                        onChange={(e) => handleHexDraftChange(e.target.value)}
                        placeholder="#7A9A7E"
                        maxLength={7}
                        className={`px-2.5 py-1.5 rounded-xl bg-slate-900 border font-mono text-xs text-white w-28 focus:outline-none ${
                          isHexValid
                            ? 'border-slate-700 focus:border-indigo-500'
                            : 'border-rose-500/70'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleRandomColor}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition"
                        title="Try a random color"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Random</span>
                      </button>
                      {onAddColorToPalette && (
                        <button
                          type="button"
                          onClick={() => onAddColorToPalette(matcherHex, `Matched ${matcherHex}`)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Target</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trending Presets */}
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                    Trending Craft Shades
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TRENDING_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handlePickColor(preset.hex)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold border transition ${
                          matcherHex === preset.hex
                            ? 'bg-indigo-500/20 border-indigo-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3 Columns: Top 5 Matches for DMC, Perler, Miyuki */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Top 5 DMC Floss Matches',
                    subtitle: 'With Anchor cotton cross-ref',
                    accent: 'text-pink-400',
                    items: matcherResults.dmc,
                    kind: 'DMC' as const,
                  },
                  {
                    title: 'Top 5 Perler Bead Matches',
                    subtitle: 'With Artkal S & Hama Midi',
                    accent: 'text-amber-400',
                    items: matcherResults.perler,
                    kind: 'Perler' as const,
                  },
                  {
                    title: 'Top 5 Miyuki Delica 11/0',
                    subtitle: 'Precision glass cylinder beads',
                    accent: 'text-cyan-400',
                    items: matcherResults.miyuki,
                    kind: 'Miyuki' as const,
                  },
                ].map((col) => (
                  <div
                    key={col.title}
                    className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3.5 space-y-2.5"
                  >
                    <div>
                      <h2 className={`text-xs font-bold uppercase tracking-wider m-0 ${col.accent}`}>
                        {col.title}
                      </h2>
                      <p className="text-[11px] text-slate-400">{col.subtitle}</p>
                    </div>

                    <div className="space-y-2">
                      {col.items.map(({ color, deltaE, matchPercent }, idx) => {
                        const anchor = col.kind === 'DMC' ? getAnchorEquivalent(color.code) : null;
                        const beadEq = col.kind === 'Perler' ? getBeadEquivalents(color.code) : null;
                        const amazonQuery =
                          col.kind === 'DMC'
                            ? `dmc ${color.code} embroidery floss`
                            : col.kind === 'Perler'
                            ? `perler beads ${color.name} 1000 pack`
                            : `miyuki delica 11/0 ${color.code}`;
                        const copyId = `match-${col.kind}-${color.code}`;

                        return (
                          <div
                            key={`${col.kind}-${color.code}`}
                            className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="w-9 h-9 rounded-lg border border-white/20 shrink-0 flex items-center justify-center text-[10px] font-bold"
                                  style={{
                                    backgroundColor: color.hex,
                                    color: getContrastingTextColor(color.r, color.g, color.b),
                                  }}
                                >
                                  #{idx + 1}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-extrabold font-mono text-white">
                                      {col.kind === 'DMC' ? `DMC ${color.code}` : color.code}
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                      {matchPercent}%
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-300 truncate">
                                    {color.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {anchor && `Anchor ${anchor.code} • `}
                                    {beadEq && `Artkal ${beadEq.artkal} • Hama ${beadEq.hama} • `}
                                    {color.finish && `${color.finish} • `}
                                    ΔE {deltaE}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/70">
                              <button
                                type="button"
                                onClick={() => handleCopyText(color.hex, copyId)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 flex items-center gap-1 transition"
                              >
                                {copiedCode === copyId ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400" />
                                )}
                                <span>{color.hex}</span>
                              </button>

                              <div className="flex items-center gap-1">
                                {onAddColorToPalette && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onAddColorToPalette(color.hex, `${col.kind} ${color.code}`)
                                    }
                                    className="px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1 transition"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Studio</span>
                                  </button>
                                )}
                                <a
                                  href={buildAmazonKitUrl(amazonQuery)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition"
                                >
                                  <span>Buy</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DMC <-> ANCHOR */}
          {activeTab === 'dmc-anchor' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing <strong className="text-white">{filteredDmc.length}</strong> of{' '}
                  {DMC_COLORS.length} calibrated DMC embroidery floss shades
                </span>
                <span>
                  In Your Stash: <strong className="text-emerald-400">{dmcStash.size}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredDmc.map((c) => {
                  const anchor = getAnchorEquivalent(c.code);
                  const inStash = dmcStash.has(c.code);
                  const copyId = `dmc-${c.code}`;
                  return (
                    <div
                      key={c.code}
                      className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition ${
                        inStash
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl border border-white/20 shrink-0 shadow-inner"
                          style={{ backgroundColor: c.hex }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-extrabold font-mono text-white">
                              DMC {c.code}
                            </span>
                            {anchor && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Anchor {anchor.code}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-300 truncate">{c.name}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-800/70">
                        <button
                          type="button"
                          onClick={() => handleCopyText(c.hex, copyId)}
                          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1"
                        >
                          {copiedCode === copyId ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{c.hex}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleStashItem('DMC', c.code)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition ${
                              inStash
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            <PackageCheck className="w-3 h-3" />
                            <span>{inStash ? 'In Stash' : '+ Stash'}</span>
                          </button>

                          {onAddColorToPalette && (
                            <button
                              type="button"
                              onClick={() => onAddColorToPalette(c.hex, `DMC ${c.code}`)}
                              className="px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold"
                              title="Add to active studio palette"
                            >
                              + Studio
                            </button>
                          )}

                          <a
                            href={buildAmazonKitUrl(`dmc ${c.code} embroidery floss`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30"
                            title={`Buy DMC ${c.code} on Amazon`}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PERLER / ARTKAL / HAMA */}
          {activeTab === 'perler' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing <strong className="text-white">{filteredPerler.length}</strong> of{' '}
                  {PERLER_COLORS.length} Perler / Artkal S / Hama Midi bead shades
                </span>
                <span>
                  In Your Stash: <strong className="text-emerald-400">{perlerStash.size}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredPerler.map((c) => {
                  const eq = getBeadEquivalents(c.code);
                  const inStash = perlerStash.has(c.code);
                  const copyId = `perler-${c.code}`;
                  return (
                    <div
                      key={c.code}
                      className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition ${
                        inStash
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full border-2 border-white/25 shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: c.hex }}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-950/75" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-extrabold font-mono text-white">
                              {c.code} · {c.name}
                            </span>
                          </div>
                          {eq && (
                            <div className="text-[11px] text-amber-300/90 font-mono mt-0.5">
                              Artkal {eq.artkal} • Hama {eq.hama}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-800/70">
                        <button
                          type="button"
                          onClick={() => handleCopyText(c.hex, copyId)}
                          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1"
                        >
                          {copiedCode === copyId ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{c.hex}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleStashItem('Perler', c.code)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition ${
                              inStash
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            <PackageCheck className="w-3 h-3" />
                            <span>{inStash ? 'In Stash' : '+ Stash'}</span>
                          </button>

                          {onAddColorToPalette && (
                            <button
                              type="button"
                              onClick={() => onAddColorToPalette(c.hex, `${c.code} ${c.name}`)}
                              className="px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold"
                            >
                              + Studio
                            </button>
                          )}

                          <a
                            href={buildAmazonKitUrl(`perler beads ${c.name} 1000 pack`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30"
                            title={`Buy Perler ${c.name} on Amazon`}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: MIYUKI DELICA 11/0 */}
          {activeTab === 'miyuki' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing <strong className="text-white">{filteredMiyuki.length}</strong> of{' '}
                  {MIYUKI_DELICA_COLORS.length} Miyuki Delica 11/0 cylinder bead shades
                </span>
                <span>Includes closest CIELAB DMC thread shade</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredMiyuki.map((c) => {
                  const closestDmc = findClosestCraftColor(c.r, c.g, c.b, 'DMC');
                  const copyId = `miyuki-${c.code}`;
                  return (
                    <div
                      key={c.code}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-2.5 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-lg border border-white/20 shrink-0 shadow-inner"
                          style={{ backgroundColor: c.hex }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-extrabold font-mono text-white">
                              {c.code}
                            </span>
                            {c.finish && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                {c.finish}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-200 truncate">{c.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            Closest Floss: DMC {closestDmc.code} ({closestDmc.name})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-800/70">
                        <button
                          type="button"
                          onClick={() => handleCopyText(c.hex, copyId)}
                          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1"
                        >
                          {copiedCode === copyId ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{c.hex}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {onAddColorToPalette && (
                            <button
                              type="button"
                              onClick={() => onAddColorToPalette(c.hex, c.code)}
                              className="px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold"
                            >
                              + Studio
                            </button>
                          )}

                          <a
                            href={buildAmazonKitUrl(`miyuki delica 11/0 ${c.code}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1"
                          >
                            <span>Buy</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Reference Guide & Internal SEO Links */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <h2>About CIELAB Perceptual Matching & Brand Conversion</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-400 leading-relaxed">
              <div>
                <h3 className="text-slate-200 font-bold mb-1">Perceptual ΔE Matching</h3>
                <p>
                  RGB distance treats all channels equally, which often picks wrong hues. Pixel Craft
                  Studio converts target hex values into CIELAB color space so matched threads and
                  beads mirror how the human eye perceives warmth, lightness, and saturation.
                </p>
              </div>
              <div>
                <h3 className="text-slate-200 font-bold mb-1">DMC ↔ Anchor Substitution</h3>
                <p>
                  Substitutions map 6-strand DMC embroidery cotton to close Anchor codes for seamless
                  cross-stitch, embroidery, and alpha knotting. Swatch tests are recommended for
                  skin-tone gradients.
                </p>
              </div>
              <div>
                <h3 className="text-slate-200 font-bold mb-1">Perler, Artkal S & Miyuki Delica</h3>
                <p>
                  Perler and Artkal S-series beads share a 5mm diameter and melt temperature, while
                  Miyuki Delica 11/0 cylinder beads lock cleanly into brick, peyote, and loom patterns.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3" /> Quick Studio Tools:
              </span>
              <Link
                to="/cross-stitch"
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-300 font-semibold transition"
              >
                Cross-Stitch Maker
              </Link>
              <Link
                to="/perler-beads"
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 font-semibold transition"
              >
                Perler Bead Designer
              </Link>
              <Link
                to="/loom-beading"
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-semibold transition"
              >
                Miyuki Bead Loom
              </Link>
              <Link
                to="/calculators/floss-estimator"
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-300 font-semibold transition"
              >
                Floss Skein Calculator
              </Link>
              <Link
                to="/gallery"
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-pink-300 font-semibold transition"
              >
                Pattern Showcase
              </Link>
            </div>
          </div>
        </div>

        {/* 6. Pinned Footer */}
        <div className="shrink-0 p-3 sm:p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              As an Amazon Associate we earn from qualifying purchases. Press{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                Esc
              </kbd>{' '}
              to close.
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
