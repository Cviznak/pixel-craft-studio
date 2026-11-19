import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Layers,
  Palette,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { hexToRgb } from '../utils/colorUtils';
import { STANDALONE_PAGE_ROUTES, updateDocumentMeta } from '../utils/craftRoutes';
import { DMC_COLORS } from '../utils/craftData';
import {
  findTwoStrandTweedingBlends,
  runBatchSubstitution,
  type SourceColorBrand,
  type TargetSubstituteBrand,
} from '../utils/colorSubstitutor';
import {
  getMyStash,
  POPULAR_DMC_STARTER,
  POPULAR_PERLER_STARTER,
  saveMyStash,
} from '../utils/stashManager';

const SAMPLE_LISTS: Record<SourceColorBrand, string> = {
  DMC: 'DMC 310 - Black\n666, 321, 743\n702, 798, 553\n434, 818, B5200',
  Perler: 'P01, P03, P05, P07, P10, P18, P22, P31',
  Miyuki: 'DB-0010, DB-0200, DB-0721, DB-0726, DB-0794',
  Hex: '#E11D48, #2563EB, #10B981, #F59E0B, #7C3AED',
};

const TARGET_OPTIONS: { id: TargetSubstituteBrand; label: string; group: string }[] = [
  { id: 'Anchor', label: 'Anchor Cotton Floss', group: 'Thread' },
  { id: 'DMC', label: 'DMC Closest Alternative', group: 'Thread' },
  { id: 'MyDMCStash', label: 'My Owned DMC Stash', group: 'Stash' },
  { id: 'Perler', label: 'Perler Fuse Beads', group: 'Beads' },
  { id: 'Artkal', label: 'Artkal S-Series 5mm', group: 'Beads' },
  { id: 'Hama', label: 'Hama Midi 5mm', group: 'Beads' },
  { id: 'Miyuki', label: 'Miyuki Delica 11/0', group: 'Beads' },
  { id: 'MyPerlerStash', label: 'My Owned Perler Stash', group: 'Stash' },
];

export const ColorSubstitutorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'batch' | 'blends'>('batch');

  // Batch substitutor state
  const [sourceBrand, setSourceBrand] = useState<SourceColorBrand>('DMC');
  const [targetBrand, setTargetBrand] = useState<TargetSubstituteBrand>('Anchor');
  const [inputText, setInputText] = useState<string>(SAMPLE_LISTS.DMC);
  const [selectedAltIndexByRow, setSelectedAltIndexByRow] = useState<Record<number, number>>({});
  const [stashVersion, setStashVersion] = useState(0);
  const [copiedBatch, setCopiedBatch] = useState(false);

  // 2-Strand Tweeding Blend Finder state
  const [blendMode, setBlendMode] = useState<'dmc' | 'hex'>('dmc');
  const [dmcSearch, setDmcSearch] = useState('');
  const [targetDmcCode, setTargetDmcCode] = useState('3845');
  const [targetHex, setTargetHex] = useState('#7B68EE');
  const [limitBlendsToStash, setLimitBlendsToStash] = useState(false);

  useEffect(() => {
    const meta = STANDALONE_PAGE_ROUTES['/tools/color-substitutor'];
    updateDocumentMeta(meta, {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: meta.metaTitle,
      description: meta.metaDescription,
      url: meta.canonicalUrl,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    });
  }, []);

  const dmcStash = useMemo(() => {
    void stashVersion;
    return getMyStash('DMC');
  }, [stashVersion]);

  const perlerStash = useMemo(() => {
    void stashVersion;
    return getMyStash('Perler');
  }, [stashVersion]);

  const activeStashForBatch =
    targetBrand === 'MyPerlerStash'
      ? perlerStash
      : targetBrand === 'MyDMCStash'
      ? dmcStash
      : undefined;

  const batchRows = useMemo(
    () => runBatchSubstitution(inputText, sourceBrand, targetBrand, activeStashForBatch),
    [inputText, sourceBrand, targetBrand, activeStashForBatch]
  );

  const handleLoadStarterStash = (brand: 'DMC' | 'Perler') => {
    const preset = brand === 'DMC' ? POPULAR_DMC_STARTER : POPULAR_PERLER_STARTER;
    saveMyStash(brand, new Set(preset));
    setStashVersion((v) => v + 1);
  };

  const handleCopyBatchResults = async () => {
    const lines = batchRows.map((row, idx) => {
      if (!row.resolved) return `${row.rawToken} -> Unrecognized`;
      const altIdx = selectedAltIndexByRow[idx] ?? 0;
      const chosen = row.alternatives[altIdx] || row.bestMatch;
      if (!chosen) return `${row.resolved.brand} ${row.resolved.code} -> No match`;
      return `${row.resolved.brand} ${row.resolved.code} (${row.resolved.name}) -> ${chosen.brandLabel} ${chosen.code} (${chosen.name}) [ΔE ${chosen.deltaE}, ${chosen.matchPercent}%]`;
    });
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedBatch(true);
      setTimeout(() => setCopiedBatch(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleDownloadCsv = () => {
    const header = 'Source Code,Source Name,Source Hex,Substitute Brand,Substitute Code,Substitute Name,Substitute Hex,Delta E,Match Percent,Quality';
    const rows = batchRows.map((row, idx) => {
      const altIdx = selectedAltIndexByRow[idx] ?? 0;
      const chosen = row.alternatives[altIdx] || row.bestMatch;
      const srcName = `"${(row.resolved?.name || '').replace(/"/g, '""')}"`;
      const subName = `"${(chosen?.name || '').replace(/"/g, '""')}"`;
      return [
        row.resolved?.code || row.rawToken,
        srcName,
        row.resolved?.hex || '',
        chosen?.brandLabel || '',
        chosen?.code || '',
        subName,
        chosen?.hex || '',
        chosen?.deltaE ?? '',
        chosen ? `${chosen.matchPercent}%` : '',
        chosen?.quality || row.error || '',
      ].join(',');
    });
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color-substitutions-${sourceBrand.toLowerCase()}-to-${targetBrand.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered DMC selector for Blend Finder
  const filteredDmcList = useMemo(() => {
    const q = dmcSearch.trim().toLowerCase();
    if (!q) return DMC_COLORS;
    return DMC_COLORS.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [dmcSearch]);

  const selectedDmcObj = useMemo(
    () => DMC_COLORS.find((c) => c.code === targetDmcCode) || DMC_COLORS[0],
    [targetDmcCode]
  );

  const normalizedCustomHex = useMemo(() => {
    const cleaned = targetHex.trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(cleaned)) return `#${cleaned.toUpperCase()}`;
    return '#7B68EE';
  }, [targetHex]);

  const targetRgbForBlend = useMemo(() => {
    if (blendMode === 'dmc') {
      return { r: selectedDmcObj.r, g: selectedDmcObj.g, b: selectedDmcObj.b, hex: selectedDmcObj.hex };
    }
    const rgb = hexToRgb(normalizedCustomHex);
    return { ...rgb, hex: normalizedCustomHex };
  }, [blendMode, selectedDmcObj, normalizedCustomHex]);

  const blendPool = useMemo(() => {
    if (!limitBlendsToStash) return DMC_COLORS;
    if (dmcStash.size < 2) return [];
    return DMC_COLORS.filter((c) => dmcStash.has(c.code));
  }, [limitBlendsToStash, dmcStash]);

  const tweedingBlends = useMemo(
    () =>
      findTwoStrandTweedingBlends(
        { r: targetRgbForBlend.r, g: targetRgbForBlend.g, b: targetRgbForBlend.b },
        blendPool,
        {
          excludeCode: blendMode === 'dmc' ? selectedDmcObj.code : undefined,
          limit: 6,
          maxPairSpread: 44,
        }
      ),
    [targetRgbForBlend, blendPool, blendMode, selectedDmcObj.code]
  );

  const singleBestDmc = useMemo(() => {
    if (blendPool.length === 0) return null;
    const pool = blendMode === 'dmc'
      ? blendPool.filter((c) => c.code !== selectedDmcObj.code)
      : blendPool;
    const candidates = runBatchSubstitution(
      targetRgbForBlend.hex,
      'Hex',
      limitBlendsToStash ? 'MyDMCStash' : 'DMC',
      limitBlendsToStash ? dmcStash : undefined
    );
    const alts = candidates[0]?.alternatives || [];
    const match = alts.find((a) => pool.some((p) => p.code === a.code)) || alts[0];
    return match || null;
  }, [blendPool, blendMode, selectedDmcObj.code, targetRgbForBlend.hex, limitBlendsToStash, dmcStash]);

  return (
    <PageShell>
      {/* Header */}
      <div className="space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Perceptual CIELAB ΔE Batch Color Substitutor</span>
        </div>

        <div className="space-y-2 max-w-3xl">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Batch Thread &amp; Bead <span className="text-indigo-400">Color Substitutor</span>
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Paste a whole pattern shopping list to convert DMC floss codes to Anchor, Perler, Artkal, Hama, Miyuki Delica, or only shades you already own in your stash — or discover optical 2-strand tweeding blends for missing floss.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="inline-flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'batch'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch List Converter</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blends')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'blends'
                ? 'bg-pink-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2-Strand Tweeding Blend Finder</span>
          </button>
        </div>
      </div>

      {activeTab === 'batch' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Input & Controls */}
          <div className="lg:col-span-4 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Input Color Format
                </label>
                <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(['DMC', 'Perler', 'Miyuki', 'Hex'] as SourceColorBrand[]).map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => {
                        setSourceBrand(brand);
                        setSelectedAltIndexByRow({});
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition ${
                        sourceBrand === brand
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Convert Every Code To
                </label>
                <select
                  value={targetBrand}
                  onChange={(e) => {
                    setTargetBrand(e.target.value as TargetSubstituteBrand);
                    setSelectedAltIndexByRow({});
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                >
                  {TARGET_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.group}: {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Paste Color Codes (max 80)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setInputText(SAMPLE_LISTS[sourceBrand]);
                    setSelectedAltIndexByRow({});
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Load {sourceBrand} Sample
                </button>
              </div>
              <textarea
                rows={8}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setSelectedAltIndexByRow({});
                }}
                placeholder="Example:&#10;DMC 310 - Black&#10;666, 321, 743&#10;B5200"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Accepts comma-separated codes, multi-line shopping lists, Pattern Keeper exports, or `#Hex` strings.
              </p>
            </div>

            {(targetBrand === 'MyDMCStash' && dmcStash.size === 0) ||
            (targetBrand === 'MyPerlerStash' && perlerStash.size === 0) ? (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-2 text-xs">
                <p className="text-amber-200 font-semibold">
                  Your {targetBrand === 'MyDMCStash' ? 'DMC' : 'Perler'} stash is currently empty.
                </p>
                <p className="text-slate-400 text-[11px]">
                  Load our 36-color starter kit or customize your inventory in Studio.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    handleLoadStarterStash(targetBrand === 'MyPerlerStash' ? 'Perler' : 'DMC')
                  }
                  className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition"
                >
                  Load Popular {targetBrand === 'MyPerlerStash' ? 'Perler' : 'DMC'} Starter Stash
                </button>
              </div>
            ) : null}
          </div>

          {/* Results */}
          <div className="lg:col-span-8 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-white">
                  Conversion Results ({batchRows.length}{' '}
                  {batchRows.length === 1 ? 'shade' : 'shades'})
                </h2>
                <p className="text-[11px] text-slate-400">
                  Click any runner-up alternative chip to swap your preferred substitute before exporting.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyBatchResults}
                  disabled={batchRows.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 disabled:opacity-40 transition"
                >
                  {copiedBatch ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy List</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  disabled={batchRows.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-40 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {batchRows.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Paste color codes on the left to compute substitutes.
              </div>
            ) : (
              <div className="space-y-2.5">
                {batchRows.map((row, idx) => {
                  const chosenIdx = selectedAltIndexByRow[idx] ?? 0;
                  const chosen = row.alternatives[chosenIdx] || row.bestMatch;

                  return (
                    <div
                      key={`${row.rawToken}-${idx}`}
                      className="rounded-xl bg-slate-950/90 border border-slate-800 p-3 space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Source Color */}
                        <div className="flex items-center gap-2.5 min-w-0 sm:w-56 shrink-0">
                          <span
                            className="w-8 h-8 rounded-lg border border-white/15 shrink-0"
                            style={{ backgroundColor: row.resolved?.hex || '#1e293b' }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {row.resolved ? `${row.resolved.brand} ${row.resolved.code}` : row.rawToken}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {row.resolved ? `${row.resolved.name} • ${row.resolved.hex}` : row.error}
                            </div>
                          </div>
                        </div>

                        <ArrowRight className="hidden sm:block w-4 h-4 text-slate-600 shrink-0" />

                        {/* Chosen Best Match */}
                        {chosen ? (
                          <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-8 h-8 rounded-lg border border-white/15 shrink-0"
                                style={{ backgroundColor: chosen.hex }}
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-emerald-300 truncate">
                                  {chosen.brandLabel} {chosen.code}{' '}
                                  <span className="font-normal text-slate-200">— {chosen.name}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {chosen.hex}
                                  {chosen.note ? ` • ${chosen.note}` : ''}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  chosen.quality === 'Exact'
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                    : chosen.quality === 'Very Close'
                                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                                    : chosen.quality === 'Good'
                                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40'
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                }`}
                              >
                                {chosen.quality} ({chosen.matchPercent}%)
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                ΔE {chosen.deltaE}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 text-xs text-slate-500 italic">
                            {row.resolved ? 'No matching shades found in selected target.' : 'Invalid code'}
                          </div>
                        )}
                      </div>

                      {/* Alternative runner-ups */}
                      {row.alternatives.length > 1 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-900">
                          <span className="text-[10px] font-semibold text-slate-500 mr-1">
                            Options:
                          </span>
                          {row.alternatives.map((alt, altIdx) => (
                            <button
                              key={`${alt.brandLabel}-${alt.code}`}
                              type="button"
                              onClick={() =>
                                setSelectedAltIndexByRow((prev) => ({ ...prev, [idx]: altIdx }))
                              }
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border transition ${
                                chosenIdx === altIdx
                                  ? 'bg-indigo-600/25 border-indigo-500/50 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/20"
                                style={{ backgroundColor: alt.hex }}
                              />
                              <span>
                                {alt.code} ({alt.matchPercent}%)
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: 2-Strand Tweeding Blend Finder */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Missing Shade to Recreate
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setBlendMode('dmc')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition ${
                    blendMode === 'dmc' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pick DMC Code
                </button>
                <button
                  type="button"
                  onClick={() => setBlendMode('hex')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition ${
                    blendMode === 'hex' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Custom Hex
                </button>
              </div>
            </div>

            {blendMode === 'dmc' ? (
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={dmcSearch}
                    onChange={(e) => setDmcSearch(e.target.value)}
                    placeholder="Filter DMC code or name..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <select
                  value={selectedDmcObj.code}
                  onChange={(e) => setTargetDmcCode(e.target.value)}
                  size={6}
                  className="w-full px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                >
                  {filteredDmcList.map((c) => (
                    <option key={c.code} value={c.code} className="py-1">
                      DMC {c.code} — {c.name} ({c.hex})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={normalizedCustomHex}
                  onChange={(e) => setTargetHex(e.target.value)}
                  className="w-12 h-11 rounded-xl bg-transparent border border-slate-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={targetHex}
                  onChange={(e) => setTargetHex(e.target.value)}
                  placeholder="#7B68EE"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                />
              </div>
            )}

            {/* Target Preview Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl border border-white/20 shrink-0 shadow"
                style={{ backgroundColor: targetRgbForBlend.hex }}
              />
              <div>
                <div className="text-xs font-bold text-white">
                  {blendMode === 'dmc'
                    ? `Target: DMC ${selectedDmcObj.code}`
                    : `Target Hex: ${targetRgbForBlend.hex}`}
                </div>
                <div className="text-[11px] text-slate-400">
                  {blendMode === 'dmc' ? selectedDmcObj.name : 'Optical 1+1 strand blend match'}
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={limitBlendsToStash}
                onChange={(e) => setLimitBlendsToStash(e.target.checked)}
                className="mt-0.5 accent-pink-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-white block">
                  Only Blend From My DMC Stash ({dmcStash.size})
                </span>
                <span className="text-[11px] text-slate-400">
                  Combines threads you already own to avoid buying another skein.
                </span>
              </div>
            </label>

            {limitBlendsToStash && dmcStash.size < 2 && (
              <button
                type="button"
                onClick={() => handleLoadStarterStash('DMC')}
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
              >
                Load Popular 36-Color DMC Starter Stash
              </button>
            )}
          </div>

          <div className="lg:col-span-8 space-y-4">
            {/* Baseline Solid Thread Comparison */}
            {singleBestDmc && (
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-slate-400" />
                  <div className="text-xs">
                    <span className="text-slate-400">Single Solid Alternative: </span>
                    <strong className="text-white">
                      DMC {singleBestDmc.code} ({singleBestDmc.name})
                    </strong>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="w-5 h-5 rounded border border-white/20"
                    style={{ backgroundColor: singleBestDmc.hex }}
                  />
                  <span className="text-slate-300 font-mono">
                    ΔE {singleBestDmc.deltaE} ({singleBestDmc.matchPercent}%)
                  </span>
                </div>
              </div>
            )}

            {/* Top Optical Tweeding Blends */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 space-y-3">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Recommended 2-Strand Tweeding Recipes (1 Strand A + 1 Strand B)
                </h2>
                <p className="text-[11px] text-slate-400">
                  Evaluates optical linear sRGB blending of two embroidery strands held together in your needle.
                </p>
              </div>

              {tweedingBlends.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Add at least 2 colors to your DMC stash (or uncheck stash filter) to find blends.
                </div>
              ) : (
                <div className="space-y-3">
                  {tweedingBlends.map((blend, i) => (
                    <div
                      key={`${blend.colorA.code}-${blend.colorB.code}`}
                      className="rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Side-by-side Target vs Blended vs Tweed Stripe */}
                        <div className="flex items-center rounded-xl overflow-hidden border border-white/15 shrink-0 shadow">
                          <div
                            title="Target color"
                            className="w-8 h-12"
                            style={{ backgroundColor: targetRgbForBlend.hex }}
                          />
                          <div
                            title={`Blended optical mix ${blend.blendedHex}`}
                            className="w-8 h-12"
                            style={{ backgroundColor: blend.blendedHex }}
                          />
                          <div
                            title="Two-strand diagonal tweed texture preview"
                            className="w-8 h-12"
                            style={{
                              backgroundImage: `repeating-linear-gradient(45deg, ${blend.colorA.hex} 0px, ${blend.colorA.hex} 5px, ${blend.colorB.hex} 5px, ${blend.colorB.hex} 10px)`,
                            }}
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-white">
                            <span className="text-slate-400">#{i + 1}</span>
                            <span>1× DMC {blend.colorA.code}</span>
                            <span className="text-pink-400">+</span>
                            <span>1× DMC {blend.colorB.code}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {blend.colorA.name} + {blend.colorB.name}
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold border ${
                                blend.speckleRating === 'Smooth'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : blend.speckleRating === 'Subtle Tweed'
                                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {blend.speckleRating} Weave
                            </span>
                            <span className="text-slate-500 font-mono">
                              Mix {blend.blendedHex}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-sm font-extrabold text-pink-300">
                          {blend.matchPercent}% Match
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ΔE {blend.deltaE} (spread {blend.pairContrastDeltaE})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};
