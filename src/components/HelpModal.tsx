import React from 'react';
import { X, Sparkles, CheckSquare, Eye, Printer } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2.5 sm:p-4 animate-in fade-in duration-150 select-none"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] my-auto"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold text-slate-100">Pixel Craft Studio Guide</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs text-slate-300 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
          {/* Tip 0: AI Generation */}
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 flex gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 h-fit">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm mb-1 flex items-center gap-1.5">
                AI Picture Generator
                <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded font-normal">
                  New
                </span>
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Click <strong>Ask AI</strong> to describe any craft subject (e.g., <em>"cute corgi eating pizza"</em> or <em>"stained glass butterfly"</em>). AI draws it instantly and turns it into a high-contrast pixel art grid!
              </p>
            </div>
          </div>

          {/* Tip 1 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3">
            <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400 shrink-0 h-fit">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm mb-1">
                Capturing the Most Beautiful Colors
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Our algorithm uses perceptual CIELAB color clustering with saturation & vibrance weighting. It prioritizes vibrant jewel tones (flowers, eyes, sunset highlights) over muddy gray backgrounds. You can also boost Saturation in the Photo Adjustments slider!
              </p>
            </div>
          </div>

          {/* Tip 2 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 h-fit">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm mb-1">
                Color Spotlight Mode (Crafting by Color)
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Click the <strong>Eye icon</strong> next to any color in the right-hand Shopping List to isolate that color across the canvas. All other cells will be dimmed so you can easily place every bead or stitch of that color!
              </p>
            </div>
          </div>

          {/* Tip 3 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 h-fit">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm mb-1">
                Craft Progress Tracker
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Activate the <strong>Craft Tracker</strong> tool in the canvas toolbar. Click or drag across cells to mark them as completed. Your progress is saved automatically so you can resume crafting tomorrow!
              </p>
            </div>
          </div>

          {/* Tip 4: Pencil & Undo */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 h-fit">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm mb-1">
                Pixel Pencil with Undo / Redo (Ctrl+Z)
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Use the <strong>Pencil</strong> tool to edit or touch up any pixel with your selected color. Easily undo mistakes with <strong>Ctrl+Z</strong> (or <strong>Cmd+Z</strong>) and redo with <strong>Ctrl+Y</strong> / <strong>Ctrl+Shift+Z</strong> or the canvas toolbar buttons!
              </p>
            </div>
          </div>

          {/* Tip 5 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 h-fit">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm mb-1">
                Printable PDF Charts & DMC/Perler Codes
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Export a high-contrast pattern PDF complete with 10×10 numbered grid lines, symbols, and a shopping list with DMC embroidery thread or Perler bead codes so you know exactly which materials to buy!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
          >
            Got it, let's craft!
          </button>
        </div>
      </div>
    </div>
  );
};
