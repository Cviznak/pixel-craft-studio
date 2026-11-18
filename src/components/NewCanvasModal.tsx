import React, { useState, useEffect } from 'react';
import type { CraftType, PaletteColor } from '../types/craft';
import { PALETTE_PRESETS } from '../utils/pixelStudioPalettes';
import { Paintbrush, X, Check, Grid, Sparkles, Layers } from 'lucide-react';

interface NewCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPalette: PaletteColor[];
  currentCraftType: CraftType;
  onCreateCanvas: (params: {
    width: number;
    height: number;
    background: 'transparent' | 'white' | 'dark';
    palettePresetId: string;
    craftType: CraftType;
  }) => void;
}

const SIZE_PRESETS = [
  { id: '16x16', w: 16, h: 16, label: '16×16', desc: 'Mini Icon' },
  { id: '32x32', w: 32, h: 32, label: '32×32', desc: 'Standard Sprite' },
  { id: '24x24', w: 24, h: 24, label: '24×24', desc: 'Perler Pegboard' },
  { id: '15x80', w: 15, h: 80, label: '15×80', desc: 'Loom Bracelet (Delica)' },
  { id: '9x30', w: 9, h: 30, label: '9×30', desc: 'Peyote Ring' },
  { id: '25x90', w: 25, h: 90, label: '25×90', desc: 'Wide Delica Cuff' },
  { id: '12x40', w: 12, h: 40, label: '12×40', desc: 'Mini Alpha Keychain' },
  { id: '16x50', w: 16, h: 50, label: '16×50', desc: 'Standard Name Keychain' },
  { id: '20x60', w: 20, h: 60, label: '20×60', desc: 'Wide Strap / Bracelet' },
  { id: '28x36', w: 28, h: 36, label: '28×36', desc: 'Knitting Intarsia Motif' },
  { id: '40x50', w: 40, h: 50, label: '40×50', desc: 'Knit Pillow / Cushion' },
];

const CRAFT_OPTIONS: { type: CraftType; label: string; icon: string }[] = [
  { type: 'pixel', label: 'Pixel Art', icon: '👾' },
  { type: 'loom', label: 'Bead Loom & Peyote', icon: '📿' },
  { type: 'knitting', label: 'Knitting (Intarsia)', icon: '🥢' },
  { type: 'alpha', label: 'Alpha Keychain', icon: '🪢' },
  { type: 'cross-stitch', label: 'Cross-Stitch', icon: '🧵' },
  { type: 'perler', label: 'Perler Beads', icon: '🔴' },
  { type: 'diamond', label: 'Diamond Painting', icon: '💎' },
  { type: 'crochet', label: 'Crochet', icon: '🧶' },
];

export const NewCanvasModal: React.FC<NewCanvasModalProps> = ({
  isOpen,
  onClose,
  currentPalette,
  currentCraftType,
  onCreateCanvas,
}) => {
  const [selectedSizePreset, setSelectedSizePreset] = useState<string>('32x32');
  const [customWidth, setCustomWidth] = useState<number>(32);
  const [customHeight, setCustomHeight] = useState<number>(32);
  const [backgroundMode, setBackgroundMode] = useState<'transparent' | 'white' | 'dark'>('transparent');
  const [selectedCraftType, setSelectedCraftType] = useState<CraftType>(currentCraftType || 'pixel');
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(
    currentCraftType === 'perler' ? 'perler' : currentCraftType === 'cross-stitch' || currentCraftType === 'alpha' || currentCraftType === 'loom' ? 'dmc' : 'pico8'
  );

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPreset = SIZE_PRESETS.find(p => p.id === selectedSizePreset);
  const activeWidth = selectedSizePreset === 'custom' ? customWidth : (currentPreset?.w || 32);
  const activeHeight = selectedSizePreset === 'custom' ? customHeight : (currentPreset?.h || 32);

  const handleCreate = () => {
    const w = Math.max(8, Math.min(160, activeWidth));
    const h = Math.max(8, Math.min(160, activeHeight));
    onCreateCanvas({
      width: w,
      height: h,
      background: backgroundMode,
      palettePresetId: selectedPaletteId,
      craftType: selectedCraftType,
    });
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 select-none animate-in fade-in duration-150"
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Paintbrush className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                New Pixel Art Canvas
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  Studio
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Create a blank canvas to draw freely, design sprites, or craft motifs
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* 1. Canvas Dimensions */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Grid className="w-3.5 h-3.5 text-indigo-400" />
              1. Canvas Dimensions ({activeWidth} × {activeHeight} pixels)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2.5">
              {SIZE_PRESETS.map((preset) => {
                const isSelected = selectedSizePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedSizePreset(preset.id);
                      if (preset.id.includes('40') || preset.id.includes('50') || preset.id.includes('60')) {
                        setSelectedCraftType('alpha');
                        setSelectedPaletteId('dmc');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col items-center justify-center text-center ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className="text-sm font-bold font-mono">{preset.label}</span>
                    <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Dimension Option */}
            <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-800/80 p-2.5 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedSizePreset('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedSizePreset === 'custom'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Custom Size
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-mono">W:</span>
                  <input
                    type="number"
                    min={8}
                    max={160}
                    value={customWidth}
                    onChange={(e) => {
                      setSelectedSizePreset('custom');
                      setCustomWidth(Math.max(8, Math.min(160, parseInt(e.target.value) || 8)));
                    }}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <span className="text-slate-500 font-bold">×</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-mono">H:</span>
                  <input
                    type="number"
                    min={8}
                    max={160}
                    value={customHeight}
                    onChange={(e) => {
                      setSelectedSizePreset('custom');
                      setCustomHeight(Math.max(8, Math.min(160, parseInt(e.target.value) || 8)));
                    }}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Initial Background */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              2. Canvas Background
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBackgroundMode('transparent')}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition text-left ${
                  backgroundMode === 'transparent'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="w-6 h-6 rounded-lg border border-slate-700 bg-[conic-gradient(#334155_90deg,#1e293b_90deg_180deg,#334155_180deg_270deg,#1e293b_270deg)] bg-[size:8px_8px] shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold block">Transparent</span>
                  <span className="text-[10px] text-slate-400 leading-tight">Empty stitches/beads</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBackgroundMode('white')}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition text-left ${
                  backgroundMode === 'white'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="w-6 h-6 rounded-lg border border-white/60 bg-white shrink-0 shadow-sm" />
                <div className="min-w-0">
                  <span className="text-xs font-bold block">Solid White</span>
                  <span className="text-[10px] text-slate-400 leading-tight">Filled with white</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBackgroundMode('dark')}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition text-left ${
                  backgroundMode === 'dark'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="w-6 h-6 rounded-lg border border-slate-700 bg-slate-950 shrink-0 shadow-sm" />
                <div className="min-w-0">
                  <span className="text-xs font-bold block">Solid Dark</span>
                  <span className="text-[10px] text-slate-400 leading-tight">Filled with black</span>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Starting Palette */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              3. Starting Color Palette
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {currentPalette && currentPalette.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedPaletteId('current')}
                  className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                    selectedPaletteId === 'current'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold flex items-center gap-2">
                      Keep Current Palette
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                        {currentPalette.length} colors
                      </span>
                    </span>
                    <div className="flex items-center gap-1 mt-1.5 overflow-x-hidden">
                      {currentPalette.slice(0, 16).map((c, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-sm border border-black/20 shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                      {currentPalette.length > 16 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          +{currentPalette.length - 16}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedPaletteId === 'current' && (
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />
                  )}
                </button>
              )}

              {PALETTE_PRESETS.map((preset) => {
                const isSelected = selectedPaletteId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPaletteId(preset.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mr-2">
                        <span className="text-xs font-bold text-slate-100">{preset.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {preset.colors.length} colors
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5 mb-1.5">
                        {preset.description}
                      </p>
                      {/* Swatches Strip */}
                      <div className="flex items-center gap-1 overflow-x-hidden">
                        {preset.colors.map((c, idx) => (
                          <div
                            key={idx}
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm border border-black/30 shrink-0 shadow-sm"
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Craft Physical Simulation Mode */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <span>🎯</span> 4. Craft Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CRAFT_OPTIONS.map((craft) => {
                const isSelected = selectedCraftType === craft.type;
                return (
                  <button
                    key={craft.type}
                    type="button"
                    onClick={() => setSelectedCraftType(craft.type)}
                    className={`p-2 rounded-xl border flex items-center gap-2 transition text-left ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">{craft.icon}</span>
                    <span className="text-xs font-semibold truncate">{craft.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-950/60 backdrop-blur-md flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition active:scale-95"
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Create {activeWidth}×{activeHeight} Canvas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
