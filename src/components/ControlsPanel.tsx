import React, { useState, useRef } from 'react';
import type { 
  ExtractionMode, 
  DitherType, 
  CraftStandard, 
  GridConfig, 
  SampleImage, 
  AiHistoryItem,
  UploadHistoryItem,
  CrochetYarnWeight
} from '../types/craft';
import { SAMPLE_IMAGES } from '../utils/sampleImages';
import { 
  calculateCrossStitchDimensions, 
  calculatePerlerDimensions, 
  calculateDiamondDimensions,
  calculateCrochetDimensions,
  CROCHET_YARN_PRESETS,
  DEFAULT_CROCHET_GAUGE,
  type CrossStitchClothCount 
} from '../utils/craftCalculator';
import { 
  Grid3X3, 
  Palette, 
  Upload, 
  Lock, 
  Unlock, 
  Sparkles, 
  Wand2, 
  History, 
  Maximize2, 
  X, 
  RefreshCw, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Ruler,
  Crop,
  FileText
} from 'lucide-react';

interface ControlsPanelProps {
  config: GridConfig;
  onUpdateConfig: (newConfig: Partial<GridConfig>) => void;
  onSelectSampleImage: (sample: SampleImage) => void;
  onUploadImage: (file: File) => void;
  onRegenerate: () => void;
  onOpenAiModal: () => void;
  onOpenCropModal?: () => void;
  onInspectCurrentPhoto?: () => void;
  onOpenStarterGallery?: () => void;
  onOpenWrittenInstructions?: () => void;
  onClose?: () => void;
  aiHistory?: AiHistoryItem[];
  onSelectHistoryImage?: (item: AiHistoryItem) => void;
  uploadHistory?: UploadHistoryItem[];
  onSelectUploadItem?: (item: UploadHistoryItem) => void;
  onOpenHistoryModal?: () => void;
  aspectRatio: number;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  config,
  onUpdateConfig,
  onSelectSampleImage,
  onUploadImage,
  onRegenerate,
  onOpenAiModal,
  onOpenCropModal,
  onInspectCurrentPhoto,
  onOpenStarterGallery,
  onOpenWrittenInstructions,
  onClose,
  aiHistory = [],
  onSelectHistoryImage,
  uploadHistory = [],
  onSelectUploadItem,
  onOpenHistoryModal,
  aspectRatio,
}) => {
  const [activeTab, setActiveTab] = useState<'grid' | 'colors'>('grid');
  const [thumbTab, setThumbTab] = useState<'presets' | 'uploads' | 'ai'>('presets');
  const [showPreFilters, setShowPreFilters] = useState<boolean>(false);
  const [clothCount, setClothCount] = useState<CrossStitchClothCount>(14);
  const thumbStripRef = useRef<HTMLDivElement>(null);

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbStripRef.current) {
      const scrollAmount = direction === 'left' ? -130 : 130;
      thumbStripRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
    <aside className="w-80 max-w-[88vw] h-full bg-slate-900 border-r border-slate-800/90 flex flex-col z-10 shrink-0 overflow-hidden shadow-2xl lg:shadow-none select-none">
      {/* 1. Top Section: Picture Source */}
      <div className="p-3.5 border-b border-slate-800/90 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>📷</span> Source Image
          </span>
          <div className="flex items-center gap-1.5">
            {onOpenHistoryModal && (
              <button
                type="button"
                onClick={onOpenHistoryModal}
                className="p-1 rounded-md text-slate-400 hover:text-pink-300 hover:bg-slate-800 transition"
                title="View picture library & upload history"
              >
                <History className="w-3.5 h-3.5 text-pink-400" />
              </button>
            )}
            {onInspectCurrentPhoto && (
              <button
                type="button"
                onClick={onInspectCurrentPhoto}
                className="p-1 rounded-md text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition"
                title="Inspect picture in full resolution"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition"
                title="Close settings"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action Button Row: Upload / Crop / AI Draw / Starters */}
        <div className="grid grid-cols-4 gap-1 mb-2.5">
          <label className="cursor-pointer py-1.5 px-1 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition text-center">
            <Upload className="w-3 h-3" />
            <span>Upload</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {onOpenCropModal && (
            <button
              type="button"
              onClick={onOpenCropModal}
              className="py-1.5 px-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
              title="Cut & crop the image"
            >
              <Crop className="w-3 h-3" />
              <span>Crop</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAiModal}
            className="py-1.5 px-1 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
          >
            <Wand2 className="w-3 h-3" />
            <span>AI Draw</span>
          </button>

          {onOpenStarterGallery && (
            <button
              type="button"
              onClick={onOpenStarterGallery}
              className="py-1.5 px-1 bg-pink-600/15 hover:bg-pink-600/25 border border-pink-500/30 text-pink-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
            >
              <Sparkles className="w-3 h-3" />
              <span>Starters</span>
            </button>
          )}
        </div>

        {/* Thumbnail Selector Strip with Presets / Uploads / AI Tabs */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setThumbTab('presets')}
                className={`transition ${thumbTab === 'presets' ? 'text-indigo-300 font-bold' : 'hover:text-slate-300'}`}
              >
                Presets
              </button>
              {uploadHistory.length > 0 && (
                <button
                  onClick={() => setThumbTab('uploads')}
                  className={`transition ${thumbTab === 'uploads' ? 'text-indigo-300 font-bold' : 'hover:text-slate-300'}`}
                >
                  Uploads ({uploadHistory.length})
                </button>
              )}
              {aiHistory.length > 0 && (
                <button
                  onClick={() => setThumbTab('ai')}
                  className={`transition ${thumbTab === 'ai' ? 'text-purple-300 font-bold' : 'hover:text-slate-300'}`}
                >
                  AI ({aiHistory.length})
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollThumbnails('left')}
                className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"
                title="Scroll thumbnails left"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => scrollThumbnails('right')}
                className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"
                title="Scroll thumbnails right"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
              {onOpenHistoryModal && (
                <button
                  onClick={onOpenHistoryModal}
                  className="text-pink-400 hover:text-pink-300 underline font-semibold flex items-center gap-0.5 ml-1"
                >
                  All
                </button>
              )}
            </div>
          </div>

          <div 
            ref={thumbStripRef}
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
            className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-slate-950/40 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-indigo-500 [&::-webkit-scrollbar-button]:hidden"
          >
            {thumbTab === 'presets' &&
              SAMPLE_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onSelectSampleImage(sample)}
                  className="group relative w-10 h-10 rounded-lg overflow-hidden border border-slate-700/80 hover:border-indigo-500 transition shrink-0 shadow-sm"
                  title={`${sample.name} - ${sample.description}`}
                >
                  <img
                    src={sample.url}
                    alt={sample.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}

            {thumbTab === 'uploads' &&
              uploadHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectUploadItem?.(item)}
                  className="group relative w-10 h-10 rounded-lg overflow-hidden border border-indigo-500/50 hover:border-pink-500 transition shrink-0 shadow-sm"
                  title={`Uploaded: ${item.name}`}
                >
                  <img
                    src={item.dataUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}

            {thumbTab === 'ai' &&
              aiHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectHistoryImage?.(item)}
                  className="group relative w-10 h-10 rounded-lg overflow-hidden border border-purple-500/50 hover:border-pink-500 transition shrink-0 shadow-sm"
                  title={`AI picture: "${item.prompt}"`}
                >
                  <img
                    src={item.dataUrl}
                    alt={item.prompt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* 2. Simplified Two-Tab Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-950/30 px-3 pt-2 gap-2 text-xs">
        <button
          onClick={() => setActiveTab('grid')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-t-lg font-semibold transition border-b-2 ${
            activeTab === 'grid'
              ? 'border-indigo-500 text-indigo-300 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          <span>Grid & Sizing</span>
        </button>
        <button
          onClick={() => setActiveTab('colors')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-t-lg font-semibold transition border-b-2 ${
            activeTab === 'colors'
              ? 'border-indigo-500 text-indigo-300 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Colors & Floss</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      <div className="p-3.5 space-y-4 flex-1 overflow-y-auto">
        {/* TAB 1: GRID & SIZING */}
        {activeTab === 'grid' && (
          <div className="space-y-4">
            {/* Dimensions Control */}
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 space-y-3">
              {/* Width */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Width</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="8"
                      max="160"
                      value={config.width}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 16)}
                      className="w-12 text-center py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-slate-500 text-[10px]">cells</span>
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
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Height</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="8"
                      max="160"
                      value={config.height}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 16)}
                      className="w-12 text-center py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-slate-500 text-[10px]">cells</span>
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

              {/* Aspect Ratio Lock */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <span className="text-[11px] text-slate-300 flex items-center gap-1.5 font-medium">
                  {config.lockAspectRatio ? (
                    <Lock className="w-3 h-3 text-indigo-400" />
                  ) : (
                    <Unlock className="w-3 h-3 text-slate-500" />
                  )}
                  Lock Proportions
                </span>
                <button
                  onClick={() => onUpdateConfig({ lockAspectRatio: !config.lockAspectRatio })}
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    config.lockAspectRatio ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                      config.lockAspectRatio ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Quick Craft Presets */}
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                Standard Sizes
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { label: 'Perler Pegboard', sub: '29 × 29 standard', w: 29, h: 29 },
                  { label: 'Craft Hoop', sub: '32 × 32 small', w: 32, h: 32 },
                  { label: 'Medium Chart', sub: '50 × 50 detailed', w: 50, h: 50 },
                  { label: 'Large 4-Boards', sub: '58 × 58 large', w: 58, h: 58 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => onUpdateConfig({ width: preset.w, height: preset.h })}
                    className="p-2 bg-slate-950/60 hover:bg-slate-800/80 rounded-lg text-left border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="font-semibold text-slate-200 text-xs">{preset.label}</div>
                    <div className="text-[10px] text-slate-400">{preset.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Real-World Sizing Calculator Card */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-amber-400" />
                  {config.craftType === 'crochet' ? 'Crochet Tapestry Gauge' : 'Physical Size'}
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

              {/* Cross Stitch Sizing */}
              {config.craftType === 'cross-stitch' && (() => {
                const res = calculateCrossStitchDimensions(config.width, config.height, clothCount);
                return (
                  <div className="space-y-1 text-xs">
                    <div className="text-amber-200 font-bold font-mono">
                      {res.dimensions.summary}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Recommended cut: <span className="text-slate-200 font-medium">{res.recommendedFabricSizeInches.width}" × {res.recommendedFabricSizeInches.height}"</span> (with 3" margins)
                    </div>
                  </div>
                );
              })()}

              {/* Crochet Tapestry Gauge Calculator */}
              {config.craftType === 'crochet' && (() => {
                const currentGauge = config.crochetGauge || DEFAULT_CROCHET_GAUGE;
                const res = calculateCrochetDimensions(config.width, config.height, currentGauge);

                return (
                  <div className="space-y-2.5 text-xs">
                    <div className="text-amber-200 font-bold font-mono">
                      {res.dimensions.summary}
                    </div>

                    {/* Yarn Weight Preset */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Yarn Weight & Hook</label>
                      <select
                        value={currentGauge.yarnWeight}
                        onChange={(e) => {
                          const weight = e.target.value as CrochetYarnWeight;
                          const preset = CROCHET_YARN_PRESETS[weight];
                          onUpdateConfig({
                            crochetGauge: {
                              ...currentGauge,
                              yarnWeight: weight,
                              stitchesPer4Inches: preset.defaultStsPer4In,
                              rowsPer4Inches: preset.defaultRowsPer4In,
                              hookSizeMm: preset.hookMm,
                            },
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 font-medium focus:outline-none"
                      >
                        {Object.entries(CROCHET_YARN_PRESETS).map(([key, val]) => (
                          <option key={key} value={key}>
                            {val.name} ({val.hookMm}mm hook)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Swatch Gauge Inputs */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400 mb-0.5">Stitches in 4" (10cm)</div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="2"
                            max="60"
                            value={currentGauge.stitchesPer4Inches}
                            onChange={(e) => {
                              onUpdateConfig({
                                crochetGauge: {
                                  ...currentGauge,
                                  stitchesPer4Inches: Math.max(2, parseInt(e.target.value) || 15),
                                },
                              });
                            }}
                            className="w-14 bg-slate-950 border border-slate-700 rounded text-center py-0.5 text-slate-100 font-mono text-xs focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500">sts</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 mb-0.5">Rows in 4" (10cm)</div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="2"
                            max="60"
                            value={currentGauge.rowsPer4Inches}
                            onChange={(e) => {
                              onUpdateConfig({
                                crochetGauge: {
                                  ...currentGauge,
                                  rowsPer4Inches: Math.max(2, parseInt(e.target.value) || 17),
                                },
                              });
                            }}
                            className="w-14 bg-slate-950 border border-slate-700 rounded text-center py-0.5 text-slate-100 font-mono text-xs focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500">rows</span>
                        </div>
                      </div>
                    </div>

                    {/* Stitch Aspect Ratio & Yarn Estimate */}
                    <div className="text-[10px] text-slate-400 space-y-1 bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
                      <div className="flex justify-between items-center">
                        <span>Stitch Aspect Ratio:</span>
                        <span className="text-amber-300 font-bold font-mono">
                          {res.stitchAspectRatio} : 1
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Total Yarn Needed:</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          ~{res.estimatedYardsTotal} yds ({res.estimatedMetersTotal} m)
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Estimated Skeins:</span>
                        <span className="text-slate-200 font-semibold font-mono">
                          ~{res.estimatedSkeinsTotal} sk (100g standard)
                        </span>
                      </div>
                    </div>

                    {/* Open Written Instructions direct launch button */}
                    {onOpenWrittenInstructions && (
                      <button
                        type="button"
                        onClick={onOpenWrittenInstructions}
                        className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-pink-600/20 to-purple-600/20 hover:from-pink-600/30 hover:to-purple-600/30 border border-pink-500/40 hover:border-pink-500/60 text-pink-300 hover:text-pink-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 text-pink-400" />
                        <span>Open Row-by-Row Written Instructions</span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Perler Beads Sizing */}
              {config.craftType === 'perler' && (() => {
                const res = calculatePerlerDimensions(config.width, config.height, 'midi-5mm');
                return (
                  <div className="space-y-1 text-xs">
                    <div className="text-amber-200 font-bold font-mono">
                      {res.dimensions.summary}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Boards required: <span className="text-slate-200 font-bold">{res.totalPegboards} standard pegboards</span> ({res.pegboardCols} × {res.pegboardRows})
                    </div>
                  </div>
                );
              })()}

              {/* Diamond Painting Sizing */}
              {config.craftType === 'diamond' && (() => {
                const res = calculateDiamondDimensions(config.width, config.height, 'square-2.5mm');
                return (
                  <div className="space-y-1 text-xs">
                    <div className="text-amber-200 font-bold font-mono">
                      {res.dimensions.summary}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      2.5mm square resin drills
                    </div>
                  </div>
                );
              })()}

              {/* Pixel Art Sizing */}
              {config.craftType === 'pixel' && (
                <div className="text-xs text-amber-200 font-bold font-mono">
                  {config.width} × {config.height} pixels
                </div>
              )}
            </div>

            {/* Pattern Chart Guides Toggles */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                Visual Guides
              </span>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer text-xs">
                <span className="text-slate-300 font-medium">Show Craft Symbols</span>
                <input
                  type="checkbox"
                  checked={config.showSymbols}
                  onChange={(e) => onUpdateConfig({ showSymbols: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer text-xs">
                <span className="text-slate-300 font-medium">Show Rulers & Numbers</span>
                <input
                  type="checkbox"
                  checked={config.showRulers}
                  onChange={(e) => onUpdateConfig({ showRulers: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer text-xs">
                <span className="text-slate-300 font-medium">10×10 Major Lines</span>
                <input
                  type="checkbox"
                  checked={config.show10x10MajorLines}
                  onChange={(e) => onUpdateConfig({ show10x10MajorLines: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer text-xs">
                <span className="text-slate-300 font-medium">Grid Lines</span>
                <input
                  type="checkbox"
                  checked={config.showGridLines}
                  onChange={(e) => onUpdateConfig({ showGridLines: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 2: COLORS & PALETTE */}
        {activeTab === 'colors' && (
          <div className="space-y-4">
            {/* Palette Color Count */}
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Total Colors</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="2"
                    max="48"
                    value={config.colorsCount}
                    onChange={(e) => onUpdateConfig({ colorsCount: parseInt(e.target.value) || 12 })}
                    className="w-12 text-center py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
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
                <span>Minimal (6)</span>
                <span className="text-indigo-400 font-semibold">Ideal (12–16)</span>
                <span>Photo (32+)</span>
              </div>
            </div>

            {/* Snap to Craft Standard Floss / Bead Codes */}
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                Snap to Color Catalog
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'dmc' as CraftStandard, label: 'DMC Floss' },
                  { id: 'perler' as CraftStandard, label: 'Perler Beads' },
                  { id: 'custom' as CraftStandard, label: 'Custom RGB' },
                ].map((std) => (
                  <button
                    key={std.id}
                    onClick={() => onUpdateConfig({ craftStandard: std.id })}
                    className={`py-2 px-1 rounded-lg border text-center transition text-xs font-semibold ${
                      config.craftStandard === std.id
                        ? 'bg-pink-950/50 border-pink-500 text-pink-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {std.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Beauty Harmony Engine */}
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                Color Harmony Mode
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { id: 'vibrant' as ExtractionMode, title: '✨ Vibrant', desc: 'Saturated & striking' },
                  { id: 'balanced' as ExtractionMode, title: '🎨 Balanced', desc: 'Perceptual CIELAB' },
                  { id: 'dominant' as ExtractionMode, title: '📊 Dominant', desc: 'Most common tones' },
                  { id: 'pastel' as ExtractionMode, title: '🌸 Pastel', desc: 'Soft & dreamy' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => onUpdateConfig({ extractionMode: mode.id })}
                    className={`p-2 rounded-lg border text-left transition ${
                      config.extractionMode === mode.id
                        ? 'bg-indigo-950/50 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/40'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-200">{mode.title}</div>
                    <div className="text-[10px] text-slate-500">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dithering Mode */}
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                Dither / Texture
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { id: 'none' as DitherType, label: 'Clean Blocks', desc: 'Best for craft' },
                  { id: 'floyd-steinberg' as DitherType, label: 'Floyd-Steinberg', desc: 'Smooth gradient' },
                  { id: 'atkinson' as DitherType, label: 'Atkinson', desc: 'Retro pixel' },
                  { id: 'bayer' as DitherType, label: 'Bayer Matrix', desc: 'Cross-hatch' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onUpdateConfig({ dither: d.id })}
                    className={`p-2 rounded-lg border text-left transition ${
                      config.dither === d.id
                        ? 'bg-indigo-950/50 border-indigo-500 text-indigo-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-200">{d.label}</div>
                    <div className="text-[10px] text-slate-500">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Adjustments Collapsible */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setShowPreFilters(!showPreFilters)}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 transition font-semibold"
              >
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  Photo Adjustments (Vibrance)
                </span>
                {showPreFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showPreFilters && (
                <div className="space-y-2.5 pt-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 mt-1.5">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Saturation</span>
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

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
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

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
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
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 underline pt-1"
                  >
                    Reset adjustments
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Sticky Bottom Action: Update Pattern */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        <button
          onClick={onRegenerate}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition active:scale-98"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Apply & Update Pattern</span>
        </button>
      </div>
    </aside>
  );
};
