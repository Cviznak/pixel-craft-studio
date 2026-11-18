import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  X,
  Scissors,
  Sparkles,
  ArrowLeftRight,
  Layers,
  Check
} from 'lucide-react';
import type { CrochetYarnWeight, UnitSystem } from '../types/craft';
import {
  CROCHET_YARN_PRESETS,
  calculateCrossStitchDimensions,
  formatDimensionSummary,
  type CrossStitchClothCount
} from '../utils/craftCalculator';

interface CraftCalculatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGridWidth: number;
  currentGridHeight: number;
  unitSystem?: UnitSystem;
  onApplyGridSize?: (width: number, height: number) => void;
}

type CalculatorTab = 'floss' | 'beads' | 'c2c';

interface BeadSpec {
  id: string;
  label: string;
  beadsPerGram: number;
  unitLabel: string;
  beadsPerUnit: number;
  defaultUnitCost: number;
}

const BEAD_SPECS: BeadSpec[] = [
  { id: 'delica-11', label: 'Miyuki Delica 11/0 Cylinder', beadsPerGram: 200, unitLabel: '5g Tube', beadsPerUnit: 1000, defaultUnitCost: 3.95 },
  { id: 'round-11', label: 'Round Seed Bead 11/0', beadsPerGram: 110, unitLabel: '10g Tube', beadsPerUnit: 1100, defaultUnitCost: 2.50 },
  { id: 'round-8', label: 'Round Seed Bead 8/0', beadsPerGram: 38, unitLabel: '15g Tube', beadsPerUnit: 570, defaultUnitCost: 2.75 },
  { id: 'perler-5mm', label: 'Perler / Hama Midi (5mm)', beadsPerGram: 15, unitLabel: '1,000-Bead Bag', beadsPerUnit: 1000, defaultUnitCost: 2.99 },
  { id: 'mini-26mm', label: 'Perler / Artkal Mini (2.6mm)', beadsPerGram: 85, unitLabel: '2,000-Bead Bag', beadsPerUnit: 2000, defaultUnitCost: 3.29 },
];

interface BlanketPreset {
  id: string;
  label: string;
  widthInches: number;
  heightInches: number;
}

const BLANKET_PRESETS: BlanketPreset[] = [
  { id: 'baby', label: 'Baby Blanket (30" × 36")', widthInches: 30, heightInches: 36 },
  { id: 'lapghan', label: 'Lapghan (36" × 48")', widthInches: 36, heightInches: 48 },
  { id: 'throw', label: 'Couch Throw (50" × 60")', widthInches: 50, heightInches: 60 },
  { id: 'twin', label: 'Twin Bed (66" × 90")', widthInches: 66, heightInches: 90 },
  { id: 'queen', label: 'Queen Bed (90" × 90")', widthInches: 90, heightInches: 90 },
];

export const CraftCalculatorsModal: React.FC<CraftCalculatorsModalProps> = ({
  isOpen,
  onClose,
  currentGridWidth,
  currentGridHeight,
  unitSystem = 'imperial',
  onApplyGridSize,
}) => {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('floss');

  // 1. Floss Estimator State
  const [stitchCount, setStitchCount] = useState<number>(() => Math.max(100, currentGridWidth * currentGridHeight));
  const [aidaCount, setAidaCount] = useState<CrossStitchClothCount>(14);
  const [strands, setStrands] = useState<number>(2);
  const [skeinPrice, setSkeinPrice] = useState<number>(0.79);

  // 2. Bead Weight <-> Count Converter State
  const [selectedBeadId, setSelectedBeadId] = useState<string>('delica-11');
  const [beadCountInput, setBeadCountInput] = useState<number>(2000);
  const [beadGramsInput, setBeadGramsInput] = useState<number>(10);

  // 3. C2C & Blanket Sizer State
  const [blanketMethod, setBlanketMethod] = useState<'c2c' | 'sc'>('c2c');
  const [blanketYarnWeight, setBlanketYarnWeight] = useState<CrochetYarnWeight>('worsted');
  const [blanketCols, setBlanketCols] = useState<number>(60);
  const [blanketRows, setBlanketRows] = useState<number>(75);
  const [appliedBlanketToast, setAppliedBlanketToast] = useState(false);

  // Refresh default stitch count when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setStitchCount(Math.max(100, currentGridWidth * currentGridHeight));
  }, [isOpen, currentGridWidth, currentGridHeight]);

  // Escape handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const flossMetrics = useMemo(() => {
    // Standard estimate: 14-count with 2 strands uses ~1800 stitches per 8m skein (6-strand divisible)
    // Lower count (larger squares) and more strands consume proportionally more floss.
    const countFactor = 14 / aidaCount;
    const strandFactor = strands / 2;
    const stitchesPerSkein = Math.max(150, Math.round(1800 / (countFactor * strandFactor)));
    const exactSkeins = stitchCount / stitchesPerSkein;
    const skeinsNeeded = Math.max(1, Math.ceil(exactSkeins * 1.1)); // +10% anchor/tail buffer
    const metersNeeded = Math.round(exactSkeins * 8 * 1.1 * 10) / 10;
    const yardsNeeded = Math.round(metersNeeded * 1.09361 * 10) / 10;
    const totalCost = (skeinsNeeded * Math.max(0, skeinPrice)).toFixed(2);
    const patternCross = calculateCrossStitchDimensions(currentGridWidth, currentGridHeight, aidaCount);

    return {
      stitchesPerSkein,
      skeinsNeeded,
      metersNeeded,
      yardsNeeded,
      totalCost,
      fabricCutLabel:
        unitSystem === 'metric'
          ? `${patternCross.recommendedFabricSizeCm.width} × ${patternCross.recommendedFabricSizeCm.height} cm`
          : `${patternCross.recommendedFabricSizeInches.width}" × ${patternCross.recommendedFabricSizeInches.height}"`,
    };
  }, [stitchCount, aidaCount, strands, skeinPrice, currentGridWidth, currentGridHeight, unitSystem]);

  const activeBeadSpec = useMemo(() => {
    return BEAD_SPECS.find((b) => b.id === selectedBeadId) || BEAD_SPECS[0];
  }, [selectedBeadId]);

  const beadMetrics = useMemo(() => {
    const units = Math.max(1, Math.ceil(beadCountInput / activeBeadSpec.beadsPerUnit));
    const estCost = (units * activeBeadSpec.defaultUnitCost).toFixed(2);
    return { units, estCost };
  }, [beadCountInput, activeBeadSpec]);

  const blanketMetrics = useMemo(() => {
    const preset = CROCHET_YARN_PRESETS[blanketYarnWeight] || CROCHET_YARN_PRESETS.worsted;
    // Standard C2C tile sizes relative to yarn weight: worsted is ~0.75" (4 sts / 4 rows wide), bulky ~0.95", dk ~0.62"
    const stsPer4In = blanketMethod === 'c2c' ? Math.max(3, preset.defaultStsPer4In / 3.4) : preset.defaultStsPer4In;
    const rowsPer4In = blanketMethod === 'c2c' ? stsPer4In : preset.defaultRowsPer4In;

    const widthInches = Math.round(((blanketCols / stsPer4In) * 4) * 10) / 10;
    const heightInches = Math.round(((blanketRows / rowsPer4In) * 4) * 10) / 10;
    const widthCm = Math.round(widthInches * 2.54 * 10) / 10;
    const heightCm = Math.round(heightInches * 2.54 * 10) / 10;

    const totalTilesOrStitches = blanketCols * blanketRows;
    const yardsPerUnit = blanketMethod === 'c2c' ? preset.yardsPerStitch * 6.5 : preset.yardsPerStitch;
    const totalYards = Math.round(totalTilesOrStitches * yardsPerUnit);
    const totalMeters = Math.round(totalYards * 0.9144);
    const skeins100g = Math.max(1, Math.ceil(totalYards / 200));

    return {
      widthInches,
      heightInches,
      widthCm,
      heightCm,
      totalTilesOrStitches,
      totalYards,
      totalMeters,
      skeins100g,
      dimSummary: formatDimensionSummary(widthInches, heightInches, widthCm, heightCm, unitSystem),
      hookMm: preset.hookMm,
      stsPer4In,
    };
  }, [blanketMethod, blanketYarnWeight, blanketCols, blanketRows, unitSystem]);

  if (!isOpen) return null;

  const handleBeadCountChange = (val: number) => {
    const safeCount = Math.max(0, val);
    setBeadCountInput(safeCount);
    setBeadGramsInput(Math.round((safeCount / activeBeadSpec.beadsPerGram) * 10) / 10);
  };

  const handleBeadGramsChange = (val: number) => {
    const safeGrams = Math.max(0, val);
    setBeadGramsInput(safeGrams);
    setBeadCountInput(Math.round(safeGrams * activeBeadSpec.beadsPerGram));
  };

  const applyBlanketPreset = (preset: BlanketPreset) => {
    const presetYarn = CROCHET_YARN_PRESETS[blanketYarnWeight] || CROCHET_YARN_PRESETS.worsted;
    const stsPer4In = blanketMethod === 'c2c' ? Math.max(3, presetYarn.defaultStsPer4In / 3.4) : presetYarn.defaultStsPer4In;
    const rowsPer4In = blanketMethod === 'c2c' ? stsPer4In : presetYarn.defaultRowsPer4In;

    setBlanketCols(Math.max(10, Math.min(200, Math.round((preset.widthInches / 4) * stsPer4In))));
    setBlanketRows(Math.max(10, Math.min(200, Math.round((preset.heightInches / 4) * rowsPer4In))));
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150 select-none"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Craft Calculators Suite</h2>
              <p className="text-[11px] text-slate-400">
                Floss skein cost, bead weight converter & C2C blanket sizer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="shrink-0 flex bg-slate-950/70 p-2 gap-1.5 border-b border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('floss')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'floss'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>🧵</span>
            <span>Floss & Skein Cost</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('beads')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'beads'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>📿</span>
            <span>Bead Grams ↔ Count</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('c2c')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'c2c'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>🧶</span>
            <span>C2C & Blanket Sizer</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'floss' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Total Stitches in Design
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stitchCount}
                    onChange={(e) => setStitchCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setStitchCount(Math.max(1, currentGridWidth * currentGridHeight))}
                    className="mt-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Use Active Grid ({currentGridWidth * currentGridHeight} sts)
                  </button>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Aida / Linen Fabric Count
                  </label>
                  <select
                    value={aidaCount}
                    onChange={(e) => setAidaCount(Number(e.target.value) as CrossStitchClothCount)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {[11, 14, 16, 18, 22].map((ct) => (
                      <option key={ct} value={ct}>{ct}-count Aida</option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Strands Used ({strands} of 6 strands)
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStrands(s)}
                        className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                          strands === s
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {s} str
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Price per 8m Floss Skein ($)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={skeinPrice}
                    onChange={(e) => setSkeinPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-mono text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">8m Skeins (+10%)</div>
                  <div className="text-xl font-black text-white font-mono mt-0.5">{flossMetrics.skeinsNeeded}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Thread Length</div>
                  <div className="text-base font-extrabold text-emerald-300 font-mono mt-1">
                    {unitSystem === 'metric' ? `${flossMetrics.metersNeeded} m` : `${flossMetrics.yardsNeeded} yds`}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Est. Floss Cost</div>
                  <div className="text-xl font-black text-amber-300 font-mono mt-0.5">${flossMetrics.totalCost}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                    <Scissors className="w-3 h-3" /> Fabric Cut
                  </div>
                  <div className="text-xs font-bold text-indigo-200 font-mono mt-1.5">{flossMetrics.fabricCutLabel}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'beads' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Bead Brand & Size Standard
                </label>
                <select
                  value={selectedBeadId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedBeadId(nextId);
                    const nextSpec = BEAD_SPECS.find((b) => b.id === nextId) || BEAD_SPECS[0];
                    setBeadGramsInput(Math.round((beadCountInput / nextSpec.beadsPerGram) * 10) / 10);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-amber-500 focus:outline-none"
                >
                  {BEAD_SPECS.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.label} (~{spec.beadsPerGram} beads/gram)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center">
                <div className="sm:col-span-5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Bead Count (Exact Beads)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={beadCountInput}
                    onChange={(e) => handleBeadCountChange(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-mono text-base font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-1 flex items-center justify-center text-slate-500 py-1">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>

                <div className="sm:col-span-5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Total Weight (Grams)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={beadGramsInput}
                    onChange={(e) => handleBeadGramsChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-teal-300 font-mono text-base font-bold focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/40 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Packages Needed</div>
                  <div className="text-lg font-black text-white font-mono mt-0.5">
                    {beadMetrics.units} × {activeBeadSpec.unitLabel}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Grid Beads</div>
                  <div className="text-lg font-black text-amber-300 font-mono mt-0.5">
                    {currentGridWidth * currentGridHeight}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Est. Supply Cost</div>
                  <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">${beadMetrics.estCost}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'c2c' && (
            <div className="space-y-4">
              {/* Quick Blanket Presets */}
              <div className="flex flex-wrap gap-1.5">
                {BLANKET_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyBlanketPreset(preset)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/40 text-[11px] font-semibold text-slate-300 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Crochet Method</label>
                  <select
                    value={blanketMethod}
                    onChange={(e) => setBlanketMethod(e.target.value as 'c2c' | 'sc')}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs focus:outline-none"
                  >
                    <option value="c2c">C2C Tiles (Corner-to-Corner)</option>
                    <option value="sc">Single Crochet Graphgan</option>
                  </select>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Yarn Weight</label>
                  <select
                    value={blanketYarnWeight}
                    onChange={(e) => setBlanketYarnWeight(e.target.value as CrochetYarnWeight)}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs focus:outline-none"
                  >
                    {Object.entries(CROCHET_YARN_PRESETS).map(([k, val]) => (
                      <option key={k} value={k}>{val.name}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Width ({blanketMethod === 'c2c' ? 'Tiles' : 'Sts'})
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="250"
                    value={blanketCols}
                    onChange={(e) => setBlanketCols(Math.max(8, Math.min(250, parseInt(e.target.value, 10) || 10)))}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Height ({blanketMethod === 'c2c' ? 'Tiles' : 'Rows'})
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="250"
                    value={blanketRows}
                    onChange={(e) => setBlanketRows(Math.max(8, Math.min(250, parseInt(e.target.value, 10) || 10)))}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-pink-950/25 border border-pink-500/40 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-pink-400" />
                    Finished Blanket Size:
                  </span>
                  <span className="text-sm font-black text-amber-300 font-mono">{blanketMetrics.dimSummary}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-pink-500/20 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">Yarn Needed</div>
                    <div className="text-sm font-extrabold text-emerald-300 font-mono">
                      {unitSystem === 'metric' ? `~${blanketMetrics.totalMeters} m` : `~${blanketMetrics.totalYards} yds`}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">100g Skeins</div>
                    <div className="text-sm font-extrabold text-white font-mono">~{blanketMetrics.skeins100g} skeins</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Recommended Hook</div>
                    <div className="text-sm font-extrabold text-pink-300 font-mono">{blanketMetrics.hookMm} mm</div>
                  </div>
                </div>
              </div>

              {onApplyGridSize && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyGridSize(Math.min(160, blanketCols), Math.min(160, blanketRows));
                    setAppliedBlanketToast(true);
                    setTimeout(() => setAppliedBlanketToast(false), 2000);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition"
                >
                  {appliedBlanketToast ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  <span>
                    {appliedBlanketToast
                      ? 'Applied Grid Size to Studio Canvas!'
                      : `Apply ${Math.min(160, blanketCols)} × ${Math.min(160, blanketRows)} Grid to Studio Canvas`}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 p-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Active Unit Mode: <strong className="text-slate-300">{unitSystem === 'metric' ? 'Meters / cm' : 'Yards / Inches'}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
