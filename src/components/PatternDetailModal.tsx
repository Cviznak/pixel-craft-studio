import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Heart,
  Clock,
  Palette,
  Maximize2,
  Grid3X3,
  ShoppingCart,
  ExternalLink,
  Link2,
  Check,
  Ruler,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import type { UnitSystem, CraftType } from '../types/craft';
import {
  getRelatedPatterns,
  getFavoritePatternIds,
  toggleFavoritePatternId,
  type CommunityPattern,
} from '../utils/communityPatterns';
import {
  calculateCrossStitchDimensions,
  calculatePerlerDimensions,
  calculateCrochetDimensions,
  calculateKnittingDimensions,
  calculateBeadLoomDimensions,
  calculateAlphaDimensions,
  calculateDiamondDimensions,
} from '../utils/craftCalculator';
import { buildAmazonKitUrl } from '../utils/craftKitBuilder';

interface PatternDetailModalProps {
  pattern: CommunityPattern | null;
  onClose: () => void;
  onBackToGallery: () => void;
  onOpenInStudio: (pattern: CommunityPattern) => void;
  unitSystem?: UnitSystem;
}

const CRAFT_LABEL: Record<CraftType, string> = {
  'cross-stitch': 'Cross-Stitch (DMC)',
  perler: 'Perler / Fuse Beads',
  crochet: 'Crochet / C2C',
  knitting: 'Intarsia & Fair Isle Knitting',
  loom: 'Miyuki Bead Loom',
  alpha: 'Alpha Friendship Bracelet',
  diamond: 'Diamond Painting',
  pixel: 'Pixel Art Sprite',
};

const CRAFT_TIPS: Record<CraftType, string[]> = {
  'cross-stitch': [
    'Fold your Aida cloth into quarters to find the center point and begin stitching outward for balanced margins.',
    'Use 2 strands of 6-strand DMC cotton floss for clean, crisp coverage on 14-count or 16-count Aida.',
    'Keep stitches consistent by crossing every top leg in the same direction across your pattern.',
  ],
  perler: [
    'Place a sheet of reusable parchment ironing paper over the beads and move a medium-heat dry iron in slow circular motions.',
    'Check that neighboring interlocking pegboards click together snugly before starting larger sprites.',
    'Press fused artwork under a heavy hardcover book while cooling to keep keychains and coasters perfectly flat.',
  ],
  crochet: [
    'Turn work with clean color changes by finishing the last yarn-over of the previous stitch using the new shade.',
    'Wind small yarn bobbins or butterflies for short color blocks to keep working strands from tangling.',
    'Open Written Pattern inside Pixel Craft Studio for row-by-row color counts you can tap off on mobile.',
  ],
  knitting: [
    'Keep floats across the wrong side loose for Fair Isle motifs, or twist yarns neatly on intarsia color joins.',
    'Use a rectangular stitch gauge ratio inside Studio so your finished garment or pillow never stretches tall.',
    'Block finished stockinette colorwork flat with lukewarm water to relax stitch tension around color transitions.',
  ],
  loom: [
    'String warp threads equal to columns + 1 using strong WildFire or Nymo thread with steady tension.',
    'Keep bead holes aligned horizontally above the warp threads and pass the needle through twice (over and under the warp).',
    'Leave 8–10 inch warp tails at each end so you can neatly weave ends in or crimp a slide clasp tube.',
  ],
  alpha: [
    'Cut base cords equal to your columns with at least 8 inches extra for buckle loops or keychain clasps.',
    'Use a clipboard or foam macrame knotting board to hold base cords cleanly in column order.',
    'Follow left-to-right on odd rows and right-to-left on even rows for dense, gap-free double half-hitch knots.',
  ],
  diamond: [
    'Peel back only a small section of the clear protective film at a time so your adhesive grid stays tacky and lint-free.',
    'Use wax-loaded multi-placer tips for large background blocks, and single tips for confetti accent drills.',
    'Roll gently with a diamond painting roller once completed to lock all 2.5mm resin drills evenly in place.',
  ],
  pixel: [
    'Toggle live mirror symmetry inside Studio to tweak outlines evenly on both sides in half the time.',
    'Use the 1-click Retro Palettes (Pico-8, GameBoy, or Arcade) to lock to authentic console colors.',
    'Export crisp nearest-neighbor PNGs at 16× or 24× scale for social feeds, stickers, and game assets.',
  ],
};

function getAmazonQueryForPattern(craft: CraftType): string {
  switch (craft) {
    case 'cross-stitch':
      return 'cross stitch kit 14 count aida cloth embroidery floss hoop needles';
    case 'perler':
      return 'perler beads bucket 10000 with interlocking pegboards tweezers';
    case 'crochet':
      return 'ergonomic crochet hook set worsted yarn stitch markers';
    case 'knitting':
      return 'circular knitting needles intarsia yarn bobbins set';
    case 'loom':
      return 'bead loom kit miyuki delica 11/0 seed beads wildfire thread';
    case 'alpha':
      return 'friendship bracelet embroidery floss bundle macrame board';
    case 'diamond':
      return 'diamond painting accessories tools kit drills trays storage box';
    default:
      return 'pixel craft art supplies grid storage kit';
  }
}

export const PatternDetailModal: React.FC<PatternDetailModalProps> = ({
  pattern,
  onClose,
  onBackToGallery,
  onOpenInStudio,
  unitSystem = 'imperial',
}) => {
  const [favorites, setFavorites] = useState<Set<string>>(() => getFavoritePatternIds());
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [prevPatternId, setPrevPatternId] = useState<string | null>(pattern?.id || null);

  if ((pattern?.id || null) !== prevPatternId) {
    setPrevPatternId(pattern?.id || null);
    if (pattern) {
      setFavorites(getFavoritePatternIds());
    }
  }

  useEffect(() => {
    if (!pattern) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pattern, onClose]);

  const relatedPatterns = useMemo(() => {
    if (!pattern) return [];
    return getRelatedPatterns(pattern, 4);
  }, [pattern]);

  const materialBreakdown = useMemo(() => {
    if (!pattern) return null;
    const { width, height } = pattern.recommendedGridSize;
    const craft = pattern.recommendedCraft;
    const metric = unitSystem === 'metric';

    if (craft === 'cross-stitch') {
      const c14 = calculateCrossStitchDimensions(width, height, 14);
      const c16 = calculateCrossStitchDimensions(width, height, 16);
      const c18 = calculateCrossStitchDimensions(width, height, 18);
      const fabricSpec = metric
        ? `${c14.recommendedFabricSizeCm.width} × ${c14.recommendedFabricSizeCm.height} cm`
        : `${c14.recommendedFabricSizeInches.width}" × ${c14.recommendedFabricSizeInches.height}"`;
      const maxDim = Math.max(c14.dimensions.widthInches, c14.dimensions.heightInches);
      const hoop = maxDim > 7 ? '10" Hoop' : maxDim > 5 ? '8" Hoop' : '6" Hoop';
      return {
        headline: 'Aida Fabric Count Sizing & Framing',
        cards: [
          { label: '14ct Aida Finish', value: c14.dimensions.summary },
          { label: '16ct / 18ct Finish', value: `${c16.dimensions.widthInches}"×${c16.dimensions.heightInches}" / ${c18.dimensions.widthInches}"×${c18.dimensions.heightInches}"` },
          { label: 'Recommended Cut (+3" Margin)', value: `${fabricSpec} + ${hoop}` },
        ],
      };
    }

    if (craft === 'perler') {
      const p = calculatePerlerDimensions(width, height, 'midi-5mm');
      return {
        headline: 'Fuse Bead Pegboards & Finished Size',
        cards: [
          { label: 'Finished Size (5mm Midi)', value: p.dimensions.summary },
          { label: '29×29 Pegboard Matrix', value: `${p.pegboardCols} across × ${p.pegboardRows} down` },
          { label: 'Total Boards & Paper', value: `${p.totalPegboards} interlocking board(s) + parchment` },
        ],
      };
    }

    if (craft === 'crochet') {
      const cr = calculateCrochetDimensions(width, height);
      const yarnAmt = metric ? `~${cr.estimatedMetersTotal} m` : `~${cr.estimatedYardsTotal} yds`;
      return {
        headline: 'Tapestry Crochet / C2C Gauge Estimate',
        cards: [
          { label: 'Est. Finished Size (SC)', value: cr.dimensions.summary },
          { label: 'Total Yarn Length', value: `${yarnAmt} worsted weight` },
          { label: 'Recommended Tools', value: `5.0mm (US H-8) hook + ${cr.estimatedSkeinsTotal}+ skeins` },
        ],
      };
    }

    if (craft === 'knitting') {
      const kn = calculateKnittingDimensions(width, height);
      const yarnAmt = metric ? `~${kn.estimatedTotalMeters} m` : `~${kn.estimatedTotalYards} yds`;
      return {
        headline: 'Stockinette Knit Gauge & Needles',
        cards: [
          { label: 'Est. Finished Size', value: kn.dimensions.summary },
          { label: 'Recommended Needles', value: kn.needleRecommendation },
          { label: 'Total Yarn Length', value: `${yarnAmt} (~${kn.estimatedSkeins} skeins)` },
        ],
      };
    }

    if (craft === 'loom') {
      const lm = calculateBeadLoomDimensions(width, height);
      return {
        headline: 'Miyuki Delica 11/0 Loom Specifications',
        cards: [
          { label: 'Finished Beaded Strip', value: lm.dimensions.summary },
          { label: 'Total Seed Beads', value: `${lm.totalBeads.toLocaleString()} beads (~${lm.totalGrams}g)` },
          { label: 'Warp & Clasp Hardware', value: `${lm.warpThreadsCount} warps • ${lm.recommendedClaspSize}` },
        ],
      };
    }

    if (craft === 'alpha') {
      const al = calculateAlphaDimensions(width, height);
      const cutLen = metric ? `${al.baseStringLengthCm} cm` : `${al.baseStringLengthInches}"`;
      return {
        headline: 'Alpha Friendship Knotting Setup',
        cards: [
          { label: 'Finished Strap Size', value: al.dimensions.summary },
          { label: 'Base Cords Needed', value: `${al.baseStringsCount} cords × ${cutLen} each` },
          { label: 'Clasp / Clamp Size', value: al.recommendedHardware },
        ],
      };
    }

    if (craft === 'diamond') {
      const dm = calculateDiamondDimensions(width, height, 'square-2.5mm');
      return {
        headline: '2.5mm Square Drill Canvas Specs',
        cards: [
          { label: 'Finished Canvas Size', value: dm.dimensions.summary },
          { label: 'Total Resin Drills', value: `${(width * height).toLocaleString()} DMC-matched drills` },
          { label: 'Recommended Accessories', value: 'Drill tray + wax + multi-placer pen' },
        ],
      };
    }

    return {
      headline: 'Sprite Canvas & Export Dimensions',
      cards: [
        { label: 'Native Pixel Grid', value: `${width} × ${height} px` },
        { label: '16× Export Resolution', value: `${width * 16} × ${height * 16} px crisp PNG` },
        { label: 'Palette Complexity', value: `${pattern.recommendedColors} indexed colors` },
      ],
    };
  }, [pattern, unitSystem]);

  if (!pattern || !materialBreakdown) return null;

  const isFav = favorites.has(pattern.id);
  const totalPieces = pattern.recommendedGridSize.width * pattern.recommendedGridSize.height;
  const craftLabel = CRAFT_LABEL[pattern.recommendedCraft] || pattern.recommendedCraft;
  const tips = CRAFT_TIPS[pattern.recommendedCraft] || CRAFT_TIPS.pixel;
  const shareUrl = `https://www.pixel-craft-studio.com/patterns/${pattern.slug}`;

  const handleToggleFav = () => {
    const next = toggleFavoritePatternId(pattern.id);
    setFavorites(new Set(next));
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
    });
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[93vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* 1. Pinned Top Breadcrumb Bar */}
        <div className="shrink-0 p-3 sm:p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs min-w-0">
            <button
              type="button"
              onClick={onBackToGallery}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold flex items-center gap-1.5 shrink-0 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Showcase</span>
            </button>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <Link
              to="/gallery"
              className="hidden sm:inline text-slate-400 hover:text-indigo-300 font-medium truncate transition"
            >
              Pattern Gallery
            </Link>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-indigo-300 font-bold truncate hidden md:inline">
              {pattern.name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleFav}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                isFav
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{pattern.likesCount + (isFav ? 1 : 0)}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close pattern detail"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 space-y-6 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
          {/* Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Artwork Preview */}
            <div className="md:col-span-5 rounded-2xl bg-slate-950 border border-slate-800 p-5 flex flex-col items-center justify-center relative">
              <div className="w-full aspect-square max-w-[280px] flex items-center justify-center">
                <img
                  src={pattern.url}
                  alt={`${pattern.name} free ${craftLabel} pattern`}
                  className="w-full h-full object-contain drop-shadow-xl"
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase">
                  {craftLabel}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-700">
                  {pattern.category}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    pattern.difficulty === 'Beginner'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : pattern.difficulty === 'Intermediate'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {pattern.difficulty}
                </span>
              </div>
            </div>

            {/* Pattern Metadata & CTAs */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight m-0">
                  {pattern.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                  {pattern.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {pattern.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 4-Card Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-indigo-400" /> Grid Size
                  </div>
                  <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                    {pattern.recommendedGridSize.width}×{pattern.recommendedGridSize.height}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Grid3X3 className="w-3 h-3 text-emerald-400" /> Pieces
                  </div>
                  <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                    {totalPieces.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-pink-400" /> Colors
                  </div>
                  <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                    {pattern.recommendedColors} shades
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> Est. Time
                  </div>
                  <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                    ~{pattern.estimatedHours} hrs
                  </div>
                </div>
              </div>

              {/* Primary CTAs */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenInStudio(pattern)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition active:scale-95"
                >
                  <span>Open & Customize in Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={buildAmazonKitUrl(getAmazonQueryForPattern(pattern.recommendedCraft))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow transition active:scale-95"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Order Supplies on Amazon</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Pattern Link'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Physical Sizing & Material Estimates */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2 m-0">
              <Ruler className="w-4 h-4 text-amber-400" />
              <span>{materialBreakdown.headline}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {materialBreakdown.cards.map((card) => (
                <div
                  key={card.label}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800/90"
                >
                  <div className="text-[11px] text-slate-400 font-medium">{card.label}</div>
                  <div className="text-xs sm:text-sm font-bold text-white font-mono mt-1">
                    {card.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Craft-Specific Quick Tips */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2 m-0">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              <span>Quick Crafting Tips for {craftLabel}</span>
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 m-0 p-0 list-none">
              {tips.map((tip, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed"
                >
                  <span className="font-bold text-indigo-300 mr-1.5">{idx + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Related Patterns (Crawlable Internal Links) */}
          {relatedPatterns.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 m-0">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>Related Free Patterns</span>
                </h2>
                <Link
                  to="/gallery"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  View all 32 patterns →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedPatterns.map((rel) => (
                  <Link
                    key={rel.id}
                    to={`/patterns/${rel.slug}`}
                    className="group rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 p-2.5 flex flex-col gap-2 transition"
                  >
                    <div className="aspect-square w-full bg-slate-900 rounded-lg flex items-center justify-center p-2 overflow-hidden">
                      <img
                        src={rel.url}
                        alt={rel.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                        {rel.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {rel.recommendedGridSize.width}×{rel.recommendedGridSize.height} • {rel.recommendedCraft}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Pinned Footer */}
        <div className="shrink-0 p-3 sm:p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-2 text-slate-400">
            <Link to="/color-chart" className="text-indigo-300 hover:underline font-semibold">
              DMC & Bead Color Chart
            </Link>
            <span>•</span>
            <Link to="/calculators" className="text-amber-300 hover:underline font-semibold">
              Floss & C2C Calculators
            </Link>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-500 italic">
              As an Amazon Associate we earn from qualifying purchases.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Back to Canvas
          </button>
        </div>
      </div>
    </div>
  );
};
