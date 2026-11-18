import React, { useState, useRef, useEffect } from 'react';
import { 
  Palette, 
  X, 
  Upload, 
  Sparkles, 
  Check 
} from 'lucide-react';
import type { PaletteColor, CraftStandard, ExtractionMode } from '../types/craft';
import { extractBeautifulPalette } from '../utils/paletteExtractor';

interface PhotoPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPaletteToGrid: (newPalette: PaletteColor[]) => void;
  onSetActivePaletteOnly: (newPalette: PaletteColor[]) => void;
}

const INSPIRATION_PRESETS = [
  {
    id: 'sunset',
    name: 'Sunset Glow',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80',
    description: 'Warm gold, coral, rose & twilight lavender'
  },
  {
    id: 'forest',
    name: 'Earthy Forest',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=500&q=80',
    description: 'Moss green, pine, warm bark & mist'
  },
  {
    id: 'lavender',
    name: 'Lavender Meadow',
    url: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=500&q=80',
    description: 'Lilac, soft violet, sage green & linen'
  },
  {
    id: 'retro-arcade',
    name: 'Neon Cyberpunk',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=500&q=80',
    description: 'Vibrant cyan, electric magenta & midnight'
  },
  {
    id: 'autumn',
    name: 'Cottage Autumn',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=80',
    description: 'Burnt orange, mustard, terracotta & amber'
  }
];

export const PhotoPaletteModal: React.FC<PhotoPaletteModalProps> = ({
  isOpen,
  onClose,
  onApplyPaletteToGrid,
  onSetActivePaletteOnly,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>(INSPIRATION_PRESETS[0].url);
  const [colorCount, setColorCount] = useState<number>(8);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('vibrant');
  const [standard, setStandard] = useState<CraftStandard>('dmc');
  const [extractedPalette, setExtractedPalette] = useState<PaletteColor[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract palette from image url
  const processImage = (url: string) => {
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 300;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.floor(img.width * scale));
        canvas.height = Math.max(1, Math.floor(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const pal = extractBeautifulPalette(
          imgData,
          colorCount,
          extractionMode,
          standard,
          []
        );

        setExtractedPalette(pal);
      } catch (err) {
        console.error('Extraction error:', err);
      } finally {
        setIsProcessing(false);
      }
    };
    img.onerror = () => {
      setIsProcessing(false);
    };
    img.src = url;
  };

  useEffect(() => {
    if (isOpen) {
      processImage(photoUrl);
    }
  }, [isOpen, photoUrl, colorCount, extractionMode, standard]);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPhotoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Clipboard paste support
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setPhotoUrl(event.target?.result as string);
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Photo & Inspiration Palette Extractor
              </h2>
              <p className="text-xs text-slate-400">
                Extract aesthetic color harmonies from any photo and map them to official DMC or Perler codes.
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {/* Top Inspiration Photo Selector & Upload Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* Image Preview Box */}
            <div className="relative aspect-video md:aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner group">
              <img 
                src={photoUrl} 
                alt="Inspiration Source" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white text-xs font-semibold"
              >
                <Upload className="w-5 h-5 text-indigo-400" />
                <span>Upload Custom Photo</span>
                <span className="text-[10px] text-slate-400">(Or press Ctrl+V to paste)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Inspiration Presets */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Curated Aesthetic Presets</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose My Own Photo</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INSPIRATION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setPhotoUrl(preset.url)}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition ${
                      photoUrl === preset.url
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="w-full h-12 rounded-lg overflow-hidden bg-slate-900 mb-1">
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-white truncate">{preset.name}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{preset.description}</span>
                  </button>
                ))}
              </div>

              {/* Extraction Controls Bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                {/* Colors Count */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Colors Count</label>
                  <select
                    value={colorCount}
                    onChange={(e) => setColorCount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={5}>5 Colors (Minimal)</option>
                    <option value={8}>8 Colors (Harmonic)</option>
                    <option value={12}>12 Colors (Rich)</option>
                    <option value={16}>16 Colors (Detailed)</option>
                  </select>
                </div>

                {/* Extraction Mode */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Vibrance & Mood</label>
                  <select
                    value={extractionMode}
                    onChange={(e) => setExtractionMode(e.target.value as ExtractionMode)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="vibrant">Vibrant & Pop</option>
                    <option value="balanced">Natural Balanced</option>
                    <option value="pastel">Pastel & Soft</option>
                    <option value="dominant">True Photographic</option>
                  </select>
                </div>

                {/* Craft Standard */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Color Catalog</label>
                  <select
                    value={standard}
                    onChange={(e) => setStandard(e.target.value as CraftStandard)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="dmc">Official DMC Floss</option>
                    <option value="perler">Perler Fuse Beads</option>
                    <option value="custom">Pure Hex (Custom)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Swatches Display */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Extracted Color Harmony ({extractedPalette.length} Shades)</span>
                {isProcessing && (
                  <span className="text-[10px] text-indigo-400 animate-pulse ml-2">Extracting...</span>
                )}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Matched to {standard === 'dmc' ? 'DMC Cotton Floss' : standard === 'perler' ? 'Perler Beads' : 'Aesthetic Hex'}
              </span>
            </div>

            {/* Continuous Palette Strip */}
            <div className="h-6 w-full rounded-xl overflow-hidden flex shadow-md border border-slate-800">
              {extractedPalette.map((col, idx) => (
                <div 
                  key={idx} 
                  className="flex-1 h-full transition-transform hover:scale-110" 
                  style={{ backgroundColor: col.hex }}
                  title={`${col.brand || 'DMC'} #${col.code || col.hex} - ${col.name || ''}`}
                />
              ))}
            </div>

            {/* Swatch Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {extractedPalette.map((col, idx) => (
                <div 
                  key={idx} 
                  className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5"
                >
                  <div 
                    className="w-7 h-7 rounded-lg shadow-sm border border-white/20 shrink-0" 
                    style={{ backgroundColor: col.hex }} 
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {col.code ? `${col.brand || 'DMC'} ${col.code}` : col.hex}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{col.name || 'Custom Shade'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-400">
            Tip: You can re-color your current design or just load these swatches into your palette drawer.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSetActivePaletteOnly(extractedPalette);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Add these colors to your palette without modifying the current canvas"
            >
              Set as Active Palette Only
            </button>

            <button
              onClick={() => {
                onApplyPaletteToGrid(extractedPalette);
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 via-indigo-600 to-indigo-500 hover:from-pink-500 hover:to-indigo-400 text-white shadow-md active:scale-95 transition flex items-center gap-1.5"
              title="Remap every stitch/pixel on the canvas to this new color harmony"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Remap Canvas to this Harmony</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
