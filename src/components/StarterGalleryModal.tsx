import React, { useState, useEffect, useMemo } from 'react';
import { 
  COMMUNITY_PATTERNS, 
  COMMUNITY_CATEGORIES, 
  CRAFT_FILTER_TABS,
  getFavoritePatternIds,
  toggleFavoritePatternId 
} from '../utils/communityPatterns';
import type { SampleImage, CraftType } from '../types/craft';
import { 
  Sparkles, 
  X, 
  Wand2, 
  ArrowRight, 
  Heart, 
  Search, 
  Clock, 
  Palette, 
  Maximize2, 
  Filter,
  Share2,
  Check
} from 'lucide-react';

interface StarterGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStarter: (
    sample: SampleImage, 
    craftType?: CraftType, 
    gridSize?: { width: number; height: number },
    colorsCount?: number
  ) => void;
  onOpenAiGenerator: () => void;
  onOpenSocialCard?: () => void;
}

export const StarterGalleryModal: React.FC<StarterGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectStarter,
  onOpenAiGenerator,
  onOpenSocialCard,
}) => {
  const [selectedCraft, setSelectedCraft] = useState<'all' | CraftType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'Beginner' | 'Intermediate' | 'Master'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<Set<string>>(() => getFavoritePatternIds());
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Sync favorites when opening
  useEffect(() => {
    if (!isOpen) return;
    setFavorites(getFavoritePatternIds());
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Toggle favorite
  const handleToggleFavorite = (patternId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleFavoritePatternId(patternId);
    setFavorites(new Set(updated));
  };

  // Copy gallery link
  const handleCopyGalleryLink = () => {
    const url = `${window.location.origin}/gallery`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    });
  };

  // Filter patterns
  const filteredPatterns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return COMMUNITY_PATTERNS.filter((pattern) => {
      // Favorites filter
      if (onlyFavorites && !favorites.has(pattern.id)) {
        return false;
      }

      // Craft type filter
      if (selectedCraft !== 'all' && pattern.recommendedCraft !== selectedCraft) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && pattern.category !== selectedCategory) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== 'all' && pattern.difficulty !== selectedDifficulty) {
        return false;
      }

      // Search query
      if (query) {
        const inName = pattern.name.toLowerCase().includes(query);
        const inDesc = pattern.description.toLowerCase().includes(query);
        const inTags = pattern.tags.some(t => t.toLowerCase().includes(query));
        const inCat = pattern.category.toLowerCase().includes(query);
        if (!inName && !inDesc && !inTags && !inCat) {
          return false;
        }
      }

      return true;
    });
  }, [selectedCraft, selectedCategory, selectedDifficulty, searchQuery, favorites, onlyFavorites]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2.5 sm:p-4 select-none animate-in fade-in duration-150"
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[94vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Header (Pinned) */}
        <div className="shrink-0 p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  Community Pattern Showcase & Discovery
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  {COMMUNITY_PATTERNS.length} Calibrated Designs
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Curated patterns across all 8 crafts with 1-click loading into your interactive canvas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAiGenerator();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition shadow-sm"
            >
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Ask AI Generator</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close showcase (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Primary Filter Controls Bar */}
        <div className="shrink-0 p-2.5 sm:p-3 border-b border-slate-800/80 bg-slate-950/50 space-y-2.5">
          {/* Row A: Craft Type Pill Selectors */}
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-0.5">
            {CRAFT_FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCraft(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                  selectedCraft === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Row B: Search, Category, Difficulty, & Favorites */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search motifs, tags, themes..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
            >
              {COMMUNITY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            {/* Difficulty Dropdown */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              aria-label="Filter by difficulty"
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Difficulties</option>
              <option value="Beginner">Beginner (&lt;25px)</option>
              <option value="Intermediate">Intermediate (25-40px)</option>
              <option value="Master">Master (&gt;40px)</option>
            </select>

            {/* Favorites Toggle */}
            <button
              type="button"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                onlyFavorites
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>Favorites ({favorites.size})</span>
            </button>
          </div>
        </div>

        {/* 3. Showcase Grid of Designs */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
          {filteredPatterns.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              <Filter className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-300">No patterns match your search filters</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the craft, category, or search keywords.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCraft('all');
                  setSelectedCategory('All');
                  setSelectedDifficulty('all');
                  setSearchQuery('');
                  setOnlyFavorites(false);
                }}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredPatterns.map((pattern) => {
              const isFav = favorites.has(pattern.id);
              const craftColor = 
                pattern.recommendedCraft === 'cross-stitch' ? 'text-pink-400 bg-pink-500/10 border-pink-500/20' :
                pattern.recommendedCraft === 'crochet' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                pattern.recommendedCraft === 'perler' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                pattern.recommendedCraft === 'loom' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
                pattern.recommendedCraft === 'alpha' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                pattern.recommendedCraft === 'diamond' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';

              return (
                <div
                  key={pattern.id}
                  className="group bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between shrink-0"
                >
                  {/* Image Preview */}
                  <div className="relative aspect-square w-full bg-slate-950 flex items-center justify-center p-4 overflow-hidden border-b border-slate-800/80">
                    <img
                      src={pattern.url}
                      alt={pattern.name}
                      className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Craft Badge Top-Left */}
                    <span className={`absolute top-2.5 left-2.5 text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${craftColor}`}>
                      {pattern.recommendedCraft}
                    </span>

                    {/* Favorite Button Top-Right */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(pattern.id, e)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 transition shadow"
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-rose-400'}`} />
                    </button>
                  </div>

                  {/* Pattern Info & Specs */}
                  <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between bg-slate-900/30">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] text-slate-400 font-semibold truncate">
                          {pattern.category}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          pattern.difficulty === 'Beginner' ? 'bg-emerald-500/15 text-emerald-300' :
                          pattern.difficulty === 'Intermediate' ? 'bg-amber-500/15 text-amber-300' :
                          'bg-rose-500/15 text-rose-300'
                        }`}>
                          {pattern.difficulty}
                        </span>
                      </div>

                      <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-indigo-300 transition mt-1 truncate">
                        {pattern.name}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {pattern.description}
                      </p>

                      {/* Specs Row */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Maximize2 className="w-2.5 h-2.5 text-slate-500" />
                          {pattern.recommendedGridSize.width}×{pattern.recommendedGridSize.height}
                        </span>
                        <span className="flex items-center gap-1">
                          <Palette className="w-2.5 h-2.5 text-slate-500" />
                          {pattern.recommendedColors} cols
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-slate-500" />
                          ~{pattern.estimatedHours}h
                        </span>
                      </div>
                    </div>

                    {/* Load Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectStarter(
                          pattern, 
                          pattern.recommendedCraft, 
                          pattern.recommendedGridSize, 
                          pattern.recommendedColors
                        );
                        onClose();
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition active:scale-95"
                    >
                      <span>Open in Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Footer Actions (Pinned) */}
        <div className="shrink-0 p-3 sm:p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyGalleryLink}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-semibold flex items-center gap-1.5 transition"
              title="Copy link to the pattern discovery showcase"
            >
              {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{copiedShare ? 'Gallery Link Copied!' : 'Share Showcase'}</span>
            </button>

            {onOpenSocialCard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSocialCard();
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Create Social Card for Current Pattern</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Showing {filteredPatterns.length} of {COMMUNITY_PATTERNS.length} designs
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
