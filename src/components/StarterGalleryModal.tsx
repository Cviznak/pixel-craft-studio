import React, { useState } from 'react';
import { SAMPLE_IMAGES } from '../utils/sampleImages';
import type { SampleImage, CraftType } from '../types/craft';
import { Sparkles, X, Wand2, ArrowRight } from 'lucide-react';

interface StarterGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStarter: (sample: SampleImage, craftType?: CraftType) => void;
  onOpenAiGenerator: () => void;
}

const CATEGORIES = ['All', 'Pixel Gaming', 'Animals & Pets', 'Nature & Botanical', 'Vibrant Gradients', 'Exotic Birds'] as const;

export const StarterGalleryModal: React.FC<StarterGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectStarter,
  onOpenAiGenerator,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const filtered = selectedCategory === 'All'
    ? SAMPLE_IMAGES
    : SAMPLE_IMAGES.filter((s) => s.category === selectedCategory);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Starter Pattern Gallery
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Instant 1-Click Load
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose a pre-made design or generate your own custom art with AI
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

        {/* Category Tabs & AI Callout */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenAiGenerator();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Generate with AI instead</span>
          </button>
        </div>

        {/* Grid of Starter Designs */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col"
            >
              {/* Image Preview */}
              <div className="relative aspect-square w-full bg-slate-950 overflow-hidden flex items-center justify-center p-4">
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm text-slate-300 border border-slate-700/60">
                  {item.category}
                </span>
              </div>

              {/* Info & Action */}
              <div className="p-3.5 flex-1 flex flex-col justify-between border-t border-slate-800/80">
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      onSelectStarter(item);
                      onClose();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition active:scale-98"
                  >
                    <span>Load Pattern</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950/70 border-t border-slate-800 text-center text-xs text-slate-400">
          💡 Clicking any starter pattern will automatically calculate the best colors, stitch counts, and physical dimensions.
        </div>
      </div>
    </div>
  );
};
