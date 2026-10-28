import React, { useState } from 'react';
import type { CraftType, ExtractionMode, DitherType, CraftStandard, GridConfig, SampleImage, AiHistoryItem } from '../types/craft';
import { SAMPLE_IMAGES } from '../utils/sampleImages';
import { 
  calculateCrossStitchDimensions, 
  calculatePerlerDimensions, 
  calculateDiamondDimensions,
  type CrossStitchClothCount 
} from '../utils/craftCalculator';
import { 
  Grid3X3, 
  Palette, 
  Image as ImageIcon, 
  Lock, 
  Unlock, 
  Sparkles, 
  Layers, 
  Upload,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  SlidersHorizontal,
  Wand2,
  History,
  Maximize2
} from 'lucide-react';

interface ControlsPanelProps {
  config: GridConfig;
  onUpdateConfig: (newConfig: Partial<GridConfig>) => void;
  onSelectSampleImage: (sample: SampleImage) => void;
  onUploadImage: (file: File) => void;
  onRegenerate: () => void;
  onOpenAiModal: () => void;
  onInspectCurrentPhoto?: () => void;
  onOpenStarterGallery?: () => void;
  aiHistory?: AiHistoryItem[];
  onSelectHistoryImage?: (item: AiHistoryItem) => void;
  aspectRatio: number;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  config,
  onUpdateConfig,
  onSelectSampleImage,
  onUploadImage,
  onRegenerate,
  onOpenAiModal,
  onInspectCurrentPhoto,
  onOpenStarterGallery,
  aiHistory = [],
  onSelectHistoryImage,
  aspectRatio,
}) => {
  const [showPreFilters, setShowPreFilters] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'colors' | 'craft'>('grid');
  const [clothCount, setClothCount] = useState<CrossStitchClothCount>(14);

  const handleWidthChange = (newWidth: number) => {
    const clampedW = Math.max(8, Math.min(160, newWidth));
    if (config.lockAspectRatio && aspectRatio > 0) {
      const newHeight = Math.max(8, Math.min(160, Math.round(clampedW / aspectRatio)));
      onUpdateConfig({ width: clampedW, height: newHeight });
    } else {
      onUpdateConfig({ width: clampedW });
    }
  };

  const handleHeightChange = (newHeight: number) => {
    const clampedH = Math.max(8, Math.min(160, newHeight));
    if (config.lockAspectRatio && aspectRatio > 0) {
      const newWidth = Math.max(8, Math.min(160, Math.round(clampedH * aspectRatio)));
      onUpdateConfig({ width: newWidth, height: clampedH });
    } else {
      onUpdateConfig({ height: clampedH });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
    }
  };

  return (
    <aside className="w-84 h-full bg-slate-900 border-r border-slate-800 flex flex-col z-10 shrink-0 overflow-y-auto">
      {/* Picture Selection Section */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              Picture Source
            </span>
            {onInspectCurrentPhoto && (
              <button
                type="button"
                onClick={onInspectCurrentPhoto}
                className="p-1 rounded text-slate-400 hover:text-indigo-300 transition"
                title="Inspect current picture in full resolution"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <label className="cursor-pointer text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition">
            <Upload className="w-3 h-3" />
            Upload Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Sample Images Strip */}
        <div className="grid grid-cols-5 gap-1.5 mt-2">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSampleImage(sample)}
              className="group relative aspect-square rounded-lg overflow-hidden border border-slate-700/80 hover:border-indigo-500 transition-all hover:scale-105 shadow-sm"
              title={`${sample.name} - ${sample.description}`}
            >
              <img
                src={sample.url}
                alt={sample.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-indigo-900/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Browse Starter Patterns Gallery Button */}
        {onOpenStarterGallery && (
          <button
            type="button"
            onClick={onOpenStarterGallery}
            className="w-full mt-2 py-1.5 px-3 bg-slate-800/90 hover:bg-slate-700 text-pink-300 hover:text-pink-200 rounded-xl font-bold text-xs border border-pink-500/30 flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Browse Starter Gallery</span>
          </button>
        )}

        {/* Ask AI to Draw Picture Button */}
        <button
          type="button"
          onClick={onOpenAiModal}
          className="w-full mt-2.5 py-2 px-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition active:scale-98"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Ask AI to Draw Picture</span>
        </button>

        {/* Recent AI Pictures if available */}
        {aiHistory.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1 text-pink-300">
                <History className="w-3 h-3 text-pink-400" />
                AI History ({aiHistory.length})
              </span>
              <button 
                type="button" 
                onClick={onOpenAiModal} 
                className="text-indigo-400 hover:text-indigo-300 hover:underline capitalize font-semibold"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {aiHistory.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectHistoryImage?.(item)}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-purple-500/40 hover:border-pink-500 transition-all hover:scale-105 shadow-sm"
                  title={`Click to load AI picture: "${item.prompt}"`}
                >
                  <img
                    src={item.dataUrl}
                    alt={item.prompt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-purple-900/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 px-2 pt-2 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('grid')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold transition border-b-2 ${
            activeTab === 'grid'
              ? 'border-indigo-500 text-indigo-300 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          Grid Size
        </button>
        <button
          onClick={() => setActiveTab('colors')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold transition border-b-2 ${
            activeTab === 'colors'
              ? 'border-indigo-500 text-indigo-300 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          Colors & Palette
        </button>
        <button
          onClick={() => setActiveTab('craft')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-semibold transition border-b-2 ${
            activeTab === 'craft'
              ? 'border-indigo-500 text-indigo-300 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Craft Style
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-5 flex-1">
        {/* TAB 1: GRID SIZE */}
        {activeTab === 'grid' && (
          <div className="space-y-4">
            {/* Width */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-medium">Grid Width (Cells / Beads)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="8"
                    max="160"
                    value={config.width}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 16)}
                    className="w-14 text-center py-0.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-slate-500 text-[10px]">px</span>
                </div>
              </div>
              <input
                type="range"
                min="8"
                max="160"
                value={config.width}
                onChange={(e) => handleWidthChange(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Height */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-medium">Grid Height (Cells / Stitches)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="8"
                    max="160"
                    value={config.height}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value) || 16)}
                    className="w-14 text-center py-0.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-slate-500 text-[10px]">px</span>
                </div>
              </div>
              <input
                type="range"
                min="8"
                max="160"
                value={config.height}
                onChange={(e) => handleHeightChange(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Aspect Ratio Lock Toggle */}
            <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-2">
                {config.lockAspectRatio ? (
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-slate-500" />
                )}
                Lock Aspect Ratio
              </span>
              <button
                onClick={() => onUpdateConfig({ lockAspectRatio: !config.lockAspectRatio })}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  config.lockAspectRatio ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    config.lockAspectRatio ? 'left-5' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Quick Craft Presets */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                Quick Craft Board Presets
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => onUpdateConfig({ width: 29, height: 29 })}
                  className="p-2 bg-slate-800/70 hover:bg-slate-700 rounded-lg text-left border border-slate-700/60 transition"
                >
                  <div className="font-semibold text-slate-200">Perler Pegboard</div>
                  <div className="text-[10px] text-slate-400">29 × 29 standard</div>
                </button>
                <button
                  onClick={() => onUpdateConfig({ width: 32, height: 32 })}
                  className="p-2 bg-slate-800/70 hover:bg-slate-700 rounded-lg text-left border border-slate-700/60 transition"
                >
                  <div className="font-semibold text-slate-200">Cross-Stitch Hoop</div>
                  <div className="text-[10px] text-slate-400">32 × 32 small</div>
                </button>
                <button
                  onClick={() => onUpdateConfig({ width: 50, height: 50 })}
                  className="p-2 bg-slate-800/70 hover:bg-slate-700 rounded-lg text-left border border-slate-700/60 transition"
                >
                  <div className="font-semibold text-slate-200">Medium Craft</div>
                  <div className="text-[10px] text-slate-400">50 × 50 detailed</div>
                </button>
                <button
                  onClick={() => onUpdateConfig({ width: 58, height: 58 })}
                  className="p-2 bg-slate-800/70 hover:bg-slate-700 rounded-lg text-left border border-slate-700/60 transition"
                >
                  <div className="font-semibold text-slate-200">Perler 4-Boards</div>
                  <div className="text-[10px] text-slate-400">58 × 58 large</div>
                </button>
              </div>
            </div>

            {/* Real-World Sizing & Material Calculator */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📏</span> Real-World Sizing
                </span>
                {config.craftType === 'cross-stitch' && (
                  <select
                    value={clothCount}
                    onChange={(e) => setClothCount(Number(e.target.value) as CrossStitchClothCount)}
                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-indigo-300 font-medium focus:outline-none"
                  >
                    {[11, 14, 16, 18, 22].map((ct) => (
                      <option key={ct} value={ct}>{ct}-count Aida</option>
                    ))}
                  </select>
                )}
              </div>

              {config.craftType === 'cross-stitch' && (() => {
                const res = calculateCrossStitchDimensions(config.width, config.height, clothCount);
                return (
                  <div className="space-y-1 text-xs">
                    <div className="text-amber-300 font-bold font-mono">
                      {res.dimensions.summary}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Recommended fabric cut: <span className="text-slate-300 font-medium">{res.recommendedFabricSizeInches.width}" × {res.recommendedFabricSizeInches.height}"</span> (with 3" margins)
                    </div>
                  </div>
                );
              })()}

              {config.craftType === 'perler' && (() => {
                const res = calculatePerlerDimensions(config.width, config.height, 'midi-5mm');
                return (
                  <div className="space-y-1 text-xs">
                    <div className="text-amber-300 font-bold font-mono">
                      {res.dimensions.summary}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Standard 29×29 pegboards: <span className="text-slate-300 font-bold">{res.totalPegboards} {res.totalPegboards === 1 ? 'board' : `boards (${res.pegboardCols} × ${res.pegboardRows})`}</span>
                    </div>
                  </div>
                );
              })()}

              {config.craftType === 'diamond' && (() => {
                const res = calculateDiamondDimensions(config.width, config.height, 'square-2.5mm');
                return (
                  <div className="space-y-1 text-xs">
                    <div className="text-amber-300 font-bold font-mono">
                      {res.dimensions.summary}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      2.5mm square drills
                    </div>
                  </div>
                );
              })()}

              {config.craftType === 'pixel' && (
                <div className="text-xs text-amber-300 font-bold font-mono">
                  {config.width} × {config.height} pixels
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COLORS & PALETTE */}
        {activeTab === 'colors' && (
          <div className="space-y-4">
            {/* Colors Amount */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-medium">Palette Colors Amount</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="2"
                    max="48"
                    value={config.colorsCount}
                    onChange={(e) => onUpdateConfig({ colorsCount: parseInt(e.target.value) || 12 })}
                    className="w-12 text-center py-0.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-slate-500 text-[10px]">colors</span>
                </div>
              </div>
              <input
                type="range"
                min="2"
                max="48"
                value={config.colorsCount}
                onChange={(e) => onUpdateConfig({ colorsCount: parseInt(e.target.value) })}
                className="w-full accent-pink-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>2 (Minimal)</span>
                <span>12-16 (Ideal Craft)</span>
                <span>48 (Photo)</span>
              </div>
            </div>

            {/* Color Beauty Selection Engine */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Color Beauty Extraction Mode
              </label>
              <div className="space-y-1.5 text-xs">
                {[
                  {
                    id: 'vibrant' as ExtractionMode,
                    title: '✨ Most Beautiful & Vibrant',
                    desc: 'Boosts saturation & jewel tones; prioritizes striking craft colors',
                  },
                  {
                    id: 'balanced' as ExtractionMode,
                    title: '🎨 Harmonious & Balanced',
                    desc: 'Smooth CIELAB perceptual balance with natural tones',
                  },
                  {
                    id: 'dominant' as ExtractionMode,
                    title: '📊 Dominant Tones',
                    desc: 'Clustering weighted by image area',
                  },
                  {
                    id: 'pastel' as ExtractionMode,
                    title: '🌸 Pastel & Soft',
                    desc: 'Dreamy soft shades for delicate crafts',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => onUpdateConfig({ extractionMode: mode.id })}
                    className={`w-full text-left p-2 rounded-lg border transition ${
                      config.extractionMode === mode.id
                        ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-200">{mode.title}</div>
                    <div className="text-[10px] text-slate-400">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Craft Standard Matching (DMC Floss / Perler Beads) */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                Snap to Craft Floss / Bead Codes
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'custom' as CraftStandard, label: 'Custom (RGB)' },
                  { id: 'dmc' as CraftStandard, label: 'DMC Thread' },
                  { id: 'perler' as CraftStandard, label: 'Perler Beads' },
                ].map((std) => (
                  <button
                    key={std.id}
                    onClick={() => onUpdateConfig({ craftStandard: std.id })}
                    className={`p-2 rounded-lg border text-center transition ${
                      config.craftStandard === std.id
                        ? 'bg-pink-950/40 border-pink-500 text-pink-200 font-semibold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {std.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dithering Mode */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                Dithering / Texture
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { id: 'none' as DitherType, label: 'None (Clean Blocks)', desc: 'Best for craft' },
                  { id: 'floyd-steinberg' as DitherType, label: 'Floyd-Steinberg', desc: 'Smooth gradient' },
                  { id: 'atkinson' as DitherType, label: 'Atkinson', desc: 'Retro pixel' },
                  { id: 'bayer' as DitherType, label: 'Bayer Ordered', desc: 'Stylized mesh' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onUpdateConfig({ dither: d.id })}
                    className={`p-2 rounded-lg border text-left transition ${
                      config.dither === d.id
                        ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200 font-semibold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-medium text-slate-200">{d.label}</div>
                    <div className="text-[10px] text-slate-500">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CRAFT STYLE & DISPLAY */}
        {activeTab === 'craft' && (
          <div className="space-y-4">
            {/* Craft Type Selector */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                Craft Simulation Look
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'perler' as CraftType, icon: '🔘', title: 'Perler Beads', desc: '3D beads on pegboard' },
                  { id: 'cross-stitch' as CraftType, icon: '🧵', title: 'Cross-Stitch', desc: 'Thread stitches on linen' },
                  { id: 'diamond' as CraftType, icon: '💎', title: 'Diamond Art', desc: 'Faceted sparkly drills' },
                  { id: 'pixel' as CraftType, icon: '🔲', title: 'Pixel Art', desc: 'Crisp classic blocks' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => onUpdateConfig({ craftType: type.id })}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      config.craftType === type.id
                        ? 'bg-indigo-900/30 border-indigo-500 ring-1 ring-indigo-500/50 text-indigo-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-lg mb-1">{type.icon}</div>
                    <div className="font-semibold text-slate-200 text-xs">{type.title}</div>
                    <div className="text-[10px] text-slate-500">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Overlays & Guides */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Pattern Chart Guides
              </label>

              {/* Show Symbols */}
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer">
                <span className="text-xs text-slate-300 font-medium">Show Craft Symbols</span>
                <input
                  type="checkbox"
                  checked={config.showSymbols}
                  onChange={(e) => onUpdateConfig({ showSymbols: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0 w-4 h-4"
                />
              </label>

              {/* 10x10 Bold Lines */}
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer">
                <div>
                  <div className="text-xs text-slate-300 font-medium">10×10 Major Grid Lines</div>
                  <div className="text-[10px] text-slate-500">Universal craft counting grid</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.show10x10MajorLines}
                  onChange={(e) => onUpdateConfig({ show10x10MajorLines: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0 w-4 h-4"
                />
              </label>

              {/* Cell Borders */}
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer">
                <span className="text-xs text-slate-300 font-medium">Cell Grid Lines</span>
                <input
                  type="checkbox"
                  checked={config.showGridLines}
                  onChange={(e) => onUpdateConfig({ showGridLines: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0 w-4 h-4"
                />
              </label>
            </div>
          </div>
        )}

        {/* Pre-Processing Image Filters Collapsible */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={() => setShowPreFilters(!showPreFilters)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1.5 transition font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              Photo Adjustments (Vibrance & Tone)
            </span>
            {showPreFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showPreFilters && (
            <div className="space-y-3 pt-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800 mt-2">
              {/* Saturation */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Color Saturation</span>
                  <span className="font-mono text-slate-300">{config.saturation > 0 ? `+${config.saturation}%` : `${config.saturation}%`}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="100"
                  value={config.saturation}
                  onChange={(e) => onUpdateConfig({ saturation: parseInt(e.target.value) })}
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Contrast</span>
                  <span className="font-mono text-slate-300">{config.contrast > 0 ? `+${config.contrast}%` : `${config.contrast}%`}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={config.contrast}
                  onChange={(e) => onUpdateConfig({ contrast: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Brightness */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Brightness</span>
                  <span className="font-mono text-slate-300">{config.brightness > 0 ? `+${config.brightness}%` : `${config.brightness}%`}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={config.brightness}
                  onChange={(e) => onUpdateConfig({ brightness: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <button
                onClick={() => onUpdateConfig({ saturation: 0, contrast: 0, brightness: 0 })}
                className="text-[10px] text-slate-400 hover:text-slate-200 underline pt-1"
              >
                Reset photo adjustments
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Re-Generate Button */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70">
        <button
          onClick={onRegenerate}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition active:scale-98"
        >
          <RefreshCw className="w-4 h-4" />
          Re-Extract Palette & Grid
        </button>
      </div>
    </aside>
  );
};
