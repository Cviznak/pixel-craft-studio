import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Type, 
  X, 
  Check, 
  CornerDownRight
} from 'lucide-react';
import type { PaletteColor, CraftType } from '../types/craft';
import { 
  PIXEL_FONTS, 
  renderPixelText, 
  type PixelFontKey 
} from '../utils/pixelFonts';

interface PixelTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  palette: PaletteColor[];
  craftType: CraftType;
  canvasWidth: number;
  canvasHeight: number;
  onStampToCanvas: (textMatrix: number[][], colorIndex: number, startX: number, startY: number) => void;
  onCreateNewFromText?: (width: number, height: number, textMatrix: number[][], colorIndex: number) => void;
}

export const PixelTextModal: React.FC<PixelTextModalProps> = ({
  isOpen,
  onClose,
  palette,
  craftType,
  canvasWidth,
  canvasHeight,
  onStampToCanvas,
  onCreateNewFromText,
}) => {
  const [text, setText] = useState<string>('HELLO ♥');
  const [selectedFont, setSelectedFont] = useState<PixelFontKey>('classic-5x7');
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);
  const [placement, setPlacement] = useState<'center' | 'top' | 'bottom'>('center');

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render text matrix
  const rendered = useMemo(() => {
    return renderPixelText(text || ' ', selectedFont, 1);
  }, [text, selectedFont]);

  // Compute startX and startY on the target canvas
  const { startX, startY } = useMemo(() => {
    if (placement === 'center') {
      return {
        startX: Math.max(0, Math.floor((canvasWidth - rendered.width) / 2)),
        startY: Math.max(0, Math.floor((canvasHeight - rendered.height) / 2)),
      };
    } else if (placement === 'top') {
      return {
        startX: Math.max(0, Math.floor((canvasWidth - rendered.width) / 2)),
        startY: 2,
      };
    } else {
      return {
        startX: Math.max(0, Math.floor((canvasWidth - rendered.width) / 2)),
        startY: Math.max(0, canvasHeight - rendered.height - 2),
      };
    }
  }, [placement, canvasWidth, canvasHeight, rendered.width, rendered.height]);

  // Draw preview onto canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !isOpen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 14;
    const pad = 2;
    const w = (rendered.width + pad * 2) * scale;
    const h = (rendered.height + pad * 2) * scale;

    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#ffffff0f';
    ctx.lineWidth = 1;
    for (let x = 0; x <= rendered.width + pad * 2; x++) {
      ctx.beginPath();
      ctx.moveTo(x * scale, 0);
      ctx.lineTo(x * scale, h);
      ctx.stroke();
    }
    for (let y = 0; y <= rendered.height + pad * 2; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * scale);
      ctx.lineTo(w, y * scale);
      ctx.stroke();
    }

    // Active color
    const activeColor = palette[selectedColorIndex] || palette[0] || { hex: '#6366f1' };

    for (let r = 0; r < rendered.height; r++) {
      for (let c = 0; c < rendered.width; c++) {
        if (rendered.matrix[r][c] === 1) {
          const px = (c + pad) * scale;
          const py = (r + pad) * scale;

          ctx.fillStyle = activeColor.hex;
          if (craftType === 'perler') {
            ctx.beginPath();
            ctx.arc(px + scale / 2, py + scale / 2, scale * 0.44, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px + scale / 2, py + scale / 2, scale * 0.16, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fill();
          } else {
            ctx.fillRect(px + 1, py + 1, scale - 2, scale - 2);
          }
        }
      }
    }
  }, [isOpen, rendered, selectedColorIndex, palette, craftType]);

  const handleStamp = () => {
    onStampToCanvas(rendered.matrix, selectedColorIndex, startX, startY);
    onClose();
  };

  const handleCreateNew = () => {
    if (!onCreateNewFromText) return;
    const pad = 4;
    const newW = rendered.width + pad * 2;
    const newH = rendered.height + pad * 2;
    onCreateNewFromText(newW, newH, rendered.matrix, selectedColorIndex);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-lg shadow-amber-500/20">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Pixel Text & Monogram Tool
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {rendered.width} × {rendered.height} stitches
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Stamp names, initials, quotes, and dates directly onto your craft
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 text-xs">
          {/* Text Input & Quick Symbols */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">Text to Stamp:</label>
              <div className="flex items-center gap-1">
                {['♥', '★', '!', '?', '-'].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setText((prev) => prev + sym)}
                    className="px-2 py-0.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700/60 transition"
                    title={`Add ${sym}`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type anything (e.g. EMMA 2026, LOVE, HOME)..."
              maxLength={32}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm uppercase placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Live Preview Canvas */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto min-h-[140px] shadow-inner">
            <canvas ref={previewCanvasRef} className="max-w-full h-auto rounded-lg shadow-md" />
            <span className="text-[10px] text-slate-500 mt-2 font-mono">
              Pattern footprint: {rendered.width} stitches wide × {rendered.height} stitches high
            </span>
          </div>

          {/* Font Style Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-300">Pixel Font Family:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PIXEL_FONTS.map((font) => (
                <button
                  key={font.key}
                  onClick={() => setSelectedFont(font.key)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                    selectedFont === font.key
                      ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{font.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">{font.charWidth}×{font.charHeight}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 leading-tight">{font.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-300">Stitch Color (from Palette):</label>
            <div className="flex items-center gap-1.5 flex-wrap bg-slate-950 p-2 rounded-xl border border-slate-800">
              {palette.map((color, idx) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColorIndex(idx)}
                  className={`w-7 h-7 rounded-lg relative flex items-center justify-center text-xs font-bold border transition ${
                    selectedColorIndex === idx
                      ? 'border-white scale-110 shadow-lg ring-2 ring-indigo-500'
                      : 'border-white/20 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={`${color.code || color.hex} - ${color.name || ''}`}
                >
                  {selectedColorIndex === idx && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Placement Options on Canvas */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-300">Stamp Placement on Canvas ({canvasWidth}×{canvasHeight}):</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'center', label: 'Center Canvas' },
                { id: 'top', label: 'Top Margin' },
                { id: 'bottom', label: 'Bottom Margin' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlacement(p.id as any)}
                  className={`py-2 px-2.5 rounded-lg font-semibold text-center transition ${
                    placement === p.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2.5">
          {onCreateNewFromText && (
            <button
              onClick={handleCreateNew}
              className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-semibold transition"
            >
              Create New Text Canvas
            </button>
          )}

          <button
            onClick={handleStamp}
            disabled={!text.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50"
          >
            <CornerDownRight className="w-4 h-4" />
            <span>Stamp Text onto Canvas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
