import React, { useState, useEffect } from 'react';
import { SAMPLE_IMAGES } from '../utils/sampleImages';
import type { SampleImage, CraftType } from '../types/craft';
import { Sparkles, X, Wand2, ArrowRight } from 'lucide-react';

interface StarterGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStarter: (sample: SampleImage, craftType?: CraftType) => void;
  onOpenAiGenerator: () => void;
}

const CATEGORIES = [
  'All',
  'Pixel Gaming',
  'Animals & Pets',
  'Nature & Botanical',
  'Pop & Cozy',
  'Vibrant Gradients',
  'Exotic Birds'
] as const;

export const StarterGalleryModal: React.FC<StarterGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectStarter,
  onOpenAiGenerator,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

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

  const filtered = selectedCategory === 'All'
    ? SAMPLE_IMAGES
    : SAMPLE_IMAGES.filter((s) => s.category === selectedCategory);

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2.5 sm:p-4 select-none animate-in fade-in duration-150"
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Header (Pinned / shrink-0) */}
        <div className="shrink-0 p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  Starter Pattern Gallery
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  Instant 1-Click Load
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Choose a pre-made design or generate your own custom art with AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 ml-2"
            title="Close gallery (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Category Tabs & AI Callout (Single horizontally scrollable strip on mobile) */}
        <div className="shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1.5 shrink-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 ${
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
            type="button"
            onClick={() => {
              onClose();
              onOpenAiGenerator();
            }}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 transition whitespace-nowrap ml-1"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Generate with AI</span>
            <span className="sm:hidden">AI Draw</span>
          </button>
        </div>

        {/* 3. Grid of Starter Designs (flex-1 min-h-0 with unconstrained card height) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-5 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 [scrollbar-width:thin] [scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col shrink-0 min-h-[240px] sm:min-h-[280px]"
            >
              {/* Image Preview with explicit minimum height so it can NEVER collapse */}
              <div className="relative aspect-square w-full min-h-[120px] sm:min-h-[160px] bg-slate-950 overflow-hidden flex items-center justify-center p-3 sm:p-4">
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-2 left-2 text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-sm text-slate-300 border border-slate-700/60 shadow">
                  {item.category}
                </span>
              </div>

              {/* Info & Action */}
              <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between border-t border-slate-800/80 bg-slate-900/40">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-indigo-300 transition truncate">
                    {item.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectStarter(item);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition active:scale-98"
                  >
                    <span>Load Pattern</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Footer Info (Pinned / shrink-0) */}
        <div className="shrink-0 p-2.5 sm:p-3 bg-slate-950/80 border-t border-slate-800 text-center text-[10px] sm:text-xs text-slate-400">
          💡 Tap any starter pattern to immediately calculate the best colors, stitch counts, and physical sizing.
        </div>
      </div>
    </div>
  );
};
