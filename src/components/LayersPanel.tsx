import React, { useEffect, useRef, useState } from 'react';
import type { CanvasLayer, PaletteColor } from '../types/craft';
import { MAX_LAYERS, countLayerFilledCells } from '../utils/layerUtils';
import {
  Layers,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowDownToLine,
  Eraser,
  Edit2,
  Combine,
  Sparkles,
} from 'lucide-react';

interface LayerThumbnailProps {
  grid: number[][];
  palette: PaletteColor[];
  visible: boolean;
}

const LayerThumbnail: React.FC<LayerThumbnailProps> = React.memo(({ grid, palette, visible }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 32;
    ctx.clearRect(0, 0, size, size);

    // Subtle dark checkerboard background to indicate transparency
    for (let cy = 0; cy < 4; cy++) {
      for (let cx = 0; cx < 4; cx++) {
        ctx.fillStyle = (cx + cy) % 2 === 0 ? '#1e293b' : '#0f172a';
        ctx.fillRect(cx * 8, cy * 8, 8, 8);
      }
    }

    const h = grid.length;
    const w = h > 0 ? grid[0]?.length ?? 0 : 0;
    if (h === 0 || w === 0) return;

    const scale = Math.min(size / w, size / h);
    const drawW = w * scale;
    const drawH = h * scale;
    const offX = (size - drawW) / 2;
    const offY = (size - drawH) / 2;

    for (let y = 0; y < h; y++) {
      const row = grid[y];
      for (let x = 0; x < w; x++) {
        const idx = row[x];
        if (idx < 0) continue;
        const color = palette[idx];
        if (!color) continue;
        ctx.fillStyle = color.hex;
        ctx.fillRect(
          offX + x * scale,
          offY + y * scale,
          Math.max(1, Math.ceil(scale)),
          Math.max(1, Math.ceil(scale))
        );
      }
    }
  }, [grid, palette]);

  return (
    <canvas
      ref={canvasRef}
      width={32}
      height={32}
      className={`w-8 h-8 rounded-lg border border-slate-700/80 shrink-0 transition-opacity ${
        visible ? 'opacity-100' : 'opacity-40'
      }`}
    />
  );
});

export interface LayersPanelProps {
  layers: CanvasLayer[];
  activeLayerId: string;
  palette: PaletteColor[];
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
  onToggleLayerVisible: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  onChangeLayerOpacity: (id: string, opacity: number) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onMergeLayerDown: (id: string) => void;
  onClearLayer: (id: string) => void;
  onFlattenLayers: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  palette,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onRenameLayer,
  onToggleLayerVisible,
  onToggleLayerLock,
  onChangeLayerOpacity,
  onMoveLayer,
  onMergeLayerDown,
  onClearLayer,
  onFlattenLayers,
}) => {
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState<string>('');

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[layers.length - 1];
  const atLayerLimit = layers.length >= MAX_LAYERS;

  const commitRename = (layerId: string) => {
    const trimmed = draftName.trim();
    if (trimmed) {
      onRenameLayer(layerId, trimmed);
    }
    setEditingLayerId(null);
  };

  // Display top-most composited layer first
  const reversedLayers = [...layers].reverse();

  return (
    <div className="flex-1 min-h-0 flex flex-col select-none">
      {/* Top Action Bar */}
      <div className="px-3.5 py-2.5 border-b border-slate-800/90 bg-slate-950/40 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onAddLayer}
            disabled={atLayerLimit}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/40 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-200 border border-indigo-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            title={atLayerLimit ? `Maximum of ${MAX_LAYERS} layers reached` : 'Add a blank transparent layer on top'}
          >
            <Plus className="w-3.5 h-3.5 text-indigo-300" />
            <span>New Layer</span>
          </button>

          <span
            className="text-[10px] bg-slate-800/90 border border-slate-700/70 px-2 py-1 rounded-lg text-slate-300 font-mono font-bold shrink-0"
            title={`${layers.length} of ${MAX_LAYERS} layers used`}
          >
            {layers.length}/{MAX_LAYERS}
          </span>

          {layers.length > 1 && (
            <button
              type="button"
              onClick={onFlattenLayers}
              className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition shrink-0"
              title="Merge all visible layers into a single base layer"
            >
              <Combine className="w-3.5 h-3.5 text-emerald-400" />
              <span>Flatten</span>
            </button>
          )}
        </div>

        {/* Active Layer Opacity Control */}
        {activeLayer && (
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-2.5 py-2 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5 truncate">
                <Layers className="w-3 h-3 text-indigo-400 shrink-0" />
                <span className="truncate">{activeLayer.name} Opacity</span>
              </span>
              <span className="font-mono font-bold text-indigo-300">
                {Math.round(activeLayer.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={Math.round(activeLayer.opacity * 100)}
              onChange={(e) => onChangeLayerOpacity(activeLayer.id, Number(e.target.value) / 100)}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              aria-label="Active layer opacity"
            />
          </div>
        )}
      </div>

      {/* Layers Stack List (Top layer first) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 pb-24 lg:pb-2">
        {reversedLayers.map((layer) => {
          const realIdx = layers.findIndex((l) => l.id === layer.id);
          const isActive = layer.id === activeLayer?.id;
          const isEditing = editingLayerId === layer.id;
          const stitchCount = countLayerFilledCells(layer.grid);
          const isTop = realIdx === layers.length - 1;
          const isBottom = realIdx === 0;

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`rounded-xl border p-2 transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-950/45 border-indigo-500/70 shadow-lg shadow-indigo-950/40'
                  : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <LayerThumbnail
                  grid={layer.grid}
                  palette={palette}
                  visible={layer.visible}
                />

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={draftName}
                      autoFocus
                      maxLength={32}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setDraftName(e.target.value)}
                      onBlur={() => commitRename(layer.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          commitRename(layer.id);
                        } else if (e.key === 'Escape') {
                          setEditingLayerId(null);
                        }
                      }}
                      className="w-full px-1.5 py-0.5 bg-slate-900 border border-indigo-500 rounded text-xs font-semibold text-white focus:outline-none"
                    />
                  ) : (
                    <div
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingLayerId(layer.id);
                        setDraftName(layer.name);
                      }}
                      className="flex items-center gap-1 min-w-0"
                      title="Double-click to rename layer"
                    >
                      <span
                        className={`text-xs font-semibold truncate ${
                          layer.visible ? 'text-slate-100' : 'text-slate-500 line-through'
                        }`}
                      >
                        {layer.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLayerId(layer.id);
                          setDraftName(layer.name);
                        }}
                        className="p-0.5 text-slate-500 hover:text-indigo-300 opacity-60 hover:opacity-100 transition shrink-0"
                        title="Rename layer"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                    <span className="font-mono">{stitchCount} px</span>
                    {layer.opacity < 0.999 && (
                      <span className="px-1 py-0 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px]">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    )}
                    {layer.locked && (
                      <span className="px-1 py-0 rounded bg-amber-500/20 text-amber-300 font-semibold text-[9px]">
                        Locked
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Visibility & Lock Toggles */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLayerVisible(layer.id);
                    }}
                    className={`p-1.5 rounded-lg border transition ${
                      layer.visible
                        ? 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                  >
                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLayerLock(layer.id);
                    }}
                    className={`p-1.5 rounded-lg border transition ${
                      layer.locked
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                        : 'bg-slate-900/90 border-slate-700/80 text-slate-400 hover:text-white'
                    }`}
                    title={layer.locked ? 'Unlock layer for editing' : 'Lock layer against accidental edits'}
                  >
                    {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Active Layer Actions Toolbar */}
              {isActive && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 pt-2 border-t border-indigo-500/25 flex items-center justify-between gap-1"
                >
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onMoveLayer(layer.id, 'up')}
                      disabled={isTop}
                      className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition"
                      title="Move layer up (forward)"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveLayer(layer.id, 'down')}
                      disabled={isBottom}
                      className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition"
                      title="Move layer down (backward)"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateLayer(layer.id)}
                      disabled={atLayerLimit}
                      className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition"
                      title={atLayerLimit ? 'Layer limit reached' : 'Duplicate layer'}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMergeLayerDown(layer.id)}
                      disabled={isBottom}
                      className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition"
                      title="Merge down into layer below"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onClearLayer(layer.id)}
                      disabled={layer.locked}
                      className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-amber-300 transition"
                      title={layer.locked ? 'Unlock layer to clear' : 'Clear all stitches on this layer'}
                    >
                      <Eraser className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteLayer(layer.id)}
                      disabled={layers.length <= 1}
                      className="p-1 rounded-md bg-slate-900 hover:bg-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-rose-300 transition"
                      title={layers.length <= 1 ? 'At least 1 layer is required' : 'Delete layer'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Subtle Bottom Tip */}
      <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/60 text-[10px] text-slate-400 flex items-start gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
        <span>Pixel Text &amp; Borders automatically land on dedicated layers so you can toggle or nudge them independently.</span>
      </div>
    </div>
  );
};
