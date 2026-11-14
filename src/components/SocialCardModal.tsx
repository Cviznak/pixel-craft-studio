import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GridConfig, PaletteColor } from '../types/craft';
import { generateSocialCard, type SocialCardOptions } from '../utils/socialCardGenerator';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Share2, 
  LayoutGrid, 
  Smartphone
} from 'lucide-react';

interface SocialCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridData: number[][];
  palette: PaletteColor[];
  config: GridConfig;
  defaultTitle?: string;
}

export const SocialCardModal: React.FC<SocialCardModalProps> = ({
  isOpen,
  onClose,
  gridData,
  palette,
  config,
  defaultTitle = 'Pixel Craft Pattern',
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [aspectRatio, setAspectRatio] = useState<'square' | 'story'>('square');
  const [theme, setTheme] = useState<'slate' | 'linen' | 'pastel' | 'arcade'>('slate');
  const [renderStyle, setRenderStyle] = useState<'pixel' | 'cross-stitch' | 'perler'>(() => {
    if (config.craftType === 'cross-stitch') return 'cross-stitch';
    if (config.craftType === 'perler') return 'perler';
    return 'pixel';
  });
  const [showPaletteStrip, setShowPaletteStrip] = useState(true);
  const [showDimensionsBadge, setShowDimensionsBadge] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Generate card on state change
  const updateCard = useCallback(() => {
    const options: SocialCardOptions = {
      title,
      aspectRatio,
      theme,
      renderStyle,
      showPaletteStrip,
      showDimensionsBadge,
    };

    const card = generateSocialCard(gridData, palette, config, options);
    fullCanvasRef.current = card;

    const preview = previewCanvasRef.current;
    if (preview) {
      preview.width = card.width;
      preview.height = card.height;
      const ctx = preview.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, preview.width, preview.height);
        ctx.drawImage(card, 0, 0);
      }
    }
  }, [gridData, palette, config, title, aspectRatio, theme, renderStyle, showPaletteStrip, showDimensionsBadge]);

  useEffect(() => {
    if (isOpen) {
      updateCard();
    }
  }, [isOpen, updateCard]);

  if (!isOpen) return null;

  const handleCopyToClipboard = async () => {
    const card = fullCanvasRef.current;
    if (!card) return;

    try {
      setIsGenerating(true);
      card.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          // Fallback if direct clipboard fails (e.g. mobile or permission denied)
          alert('Could not copy directly to clipboard. Please use the Download button below.');
        } finally {
          setIsGenerating(false);
        }
      }, 'image/png');
    } catch {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const card = fullCanvasRef.current;
    if (!card) return;

    const link = document.createElement('a');
    link.download = `${(title || 'pattern').toLowerCase().replace(/\s+/g, '-')}-social-card.png`;
    link.href = card.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 select-none animate-in fade-in duration-150"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/85">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-pink-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">Aesthetic Social Card Generator</h2>
              <p className="text-xs text-slate-400">Share on Pinterest, TikTok, Instagram & Discord with 1-click clipboard copy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split Left Preview & Right Customization */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Responsive Canvas Preview Container */}
          <div className="md:col-span-7 flex flex-col items-center justify-center bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 min-h-[340px] max-h-[580px] overflow-hidden">
            <div className="relative max-w-full max-h-[520px] flex items-center justify-center shadow-2xl rounded-xl overflow-hidden border border-slate-700/60">
              <canvas
                ref={previewCanvasRef}
                className="max-w-full max-h-[500px] object-contain rounded-xl block"
              />
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-3">
              Output: {aspectRatio === 'square' ? '1080 × 1080 px (1:1)' : '1000 × 1500 px (2:3)'} • High-Res PNG
            </div>
          </div>

          {/* Right: Controls & Options */}
          <div className="md:col-span-5 flex flex-col gap-4">
            {/* Title Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Design Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cute Mushroom Pixel Art"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Aspect Ratio Toggle: 1:1 vs 2:3 */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Format & Aspect Ratio
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('square')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    aspectRatio === 'square'
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Square (1:1)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('story')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    aspectRatio === 'story'
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Pin / Story (2:3)</span>
                </button>
              </div>
            </div>

            {/* Theme Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Aesthetic Background Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'slate', label: 'Modern Slate', dot: '#1e293b' },
                  { id: 'linen', label: 'Warm Linen', dot: '#f8f5ee' },
                  { id: 'pastel', label: 'Pastel Dream', dot: '#f5f3ff' },
                  { id: 'arcade', label: 'Retro Arcade', dot: '#05070f' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setTheme(th.id as any)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                      theme === th.id
                        ? 'bg-pink-600/20 border-pink-500/80 text-pink-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: th.dot }}
                    />
                    <span>{th.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Render Style */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Artwork Render Style
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'pixel', label: 'Pixel Art' },
                  { id: 'cross-stitch', label: 'Stitched X' },
                  { id: 'perler', label: 'Bead Grid' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setRenderStyle(st.id as any)}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-semibold transition ${
                      renderStyle === st.id
                        ? 'bg-purple-600/25 border-purple-500 text-purple-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Detail Toggles */}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-300 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showPaletteStrip}
                  onChange={(e) => setShowPaletteStrip(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Palette Dots</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showDimensionsBadge}
                  onChange={(e) => setShowDimensionsBadge(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Sizing Badges</span>
              </label>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleCopyToClipboard}
                disabled={isGenerating}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 active:scale-[0.98] transition disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copied! Ready to Paste in TikTok/Pinterest</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Image to Clipboard</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700/80 active:scale-[0.98] transition"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Download High-Res PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
