import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Ruler, 
  X, 
  Circle, 
  Square, 
  ShoppingCart, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import type { CraftType, PaletteColor } from '../types/craft';
import { 
  calculateCrossStitchDimensions, 
  calculatePerlerDimensions, 
  calculateDiamondDimensions, 
  calculateCrochetDimensions,
  calculateAlphaDimensions,
  type CrossStitchClothCount,
  type PerlerBeadType,
  DEFAULT_CROCHET_GAUGE
} from '../utils/craftCalculator';

interface SizeAndFrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridData: number[][];
  palette: PaletteColor[];
  craftType: CraftType;
  onTogglePegboardLines?: () => void;
  showPegboardLines?: boolean;
}

type FrameType = 'hoop' | 'frame' | 'raw';

interface HoopOption {
  inches: number;
  label: string;
}

interface FrameOption {
  widthInches: number;
  heightInches: number;
  label: string;
}

const HOOP_OPTIONS: HoopOption[] = [
  { inches: 4, label: '4" Mini Hoop (10 cm)' },
  { inches: 5, label: '5" Small Hoop (12.7 cm)' },
  { inches: 6, label: '6" Standard Hoop (15.2 cm)' },
  { inches: 7, label: '7" Medium Hoop (17.8 cm)' },
  { inches: 8, label: '8" Popular Hoop (20.3 cm)' },
  { inches: 10, label: '10" Large Hoop (25.4 cm)' },
  { inches: 12, label: '12" XL Hoop (30.5 cm)' },
];

const FRAME_OPTIONS: FrameOption[] = [
  { widthInches: 4, heightInches: 6, label: '4" × 6" Photo Frame' },
  { widthInches: 5, heightInches: 7, label: '5" × 7" Standard Frame' },
  { widthInches: 8, heightInches: 8, label: '8" × 8" Square Frame' },
  { widthInches: 8, heightInches: 10, label: '8" × 10" Medium Frame' },
  { widthInches: 11, heightInches: 14, label: '11" × 14" Large Wall Frame' },
  { widthInches: 12, heightInches: 12, label: '12" × 12" Square Album Frame' },
];

export const SizeAndFrameModal: React.FC<SizeAndFrameModalProps> = ({
  isOpen,
  onClose,
  gridData,
  palette,
  craftType: initialCraftType,
  onTogglePegboardLines,
  showPegboardLines = false,
}) => {
  const [selectedCraftType, setSelectedCraftType] = useState<CraftType>(initialCraftType);
  const [aidaCount, setAidaCount] = useState<CrossStitchClothCount>(14);
  const [perlerType, setPerlerType] = useState<PerlerBeadType>('midi-5mm');
  const [frameType, setFrameType] = useState<FrameType>('hoop');
  const [selectedHoop, setSelectedHoop] = useState<number>(8);
  const [selectedFrame, setSelectedFrame] = useState<FrameOption>(FRAME_OPTIONS[3]); // 8x10
  const [frameFinish, setFrameFinish] = useState<'bamboo' | 'dark-wood' | 'white' | 'gold'>('bamboo');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gridHeight = gridData.length;
  const gridWidth = gridHeight > 0 ? gridData[0].length : 0;

  // Calculate physical metrics based on current selections
  const sizingMetrics = useMemo(() => {
    if (selectedCraftType === 'cross-stitch') {
      const cs = calculateCrossStitchDimensions(gridWidth, gridHeight, aidaCount);
      return {
        widthInches: cs.dimensions.widthInches,
        heightInches: cs.dimensions.heightInches,
        widthCm: cs.dimensions.widthCm,
        heightCm: cs.dimensions.heightCm,
        recommendedFabricWInches: cs.recommendedFabricSizeInches.width,
        recommendedFabricHInches: cs.recommendedFabricSizeInches.height,
        recommendedFabricWCm: cs.recommendedFabricSizeCm.width,
        recommendedFabricHCm: cs.recommendedFabricSizeCm.height,
        pegboards: null,
      };
    } else if (selectedCraftType === 'perler') {
      const pb = calculatePerlerDimensions(gridWidth, gridHeight, perlerType);
      return {
        widthInches: pb.dimensions.widthInches,
        heightInches: pb.dimensions.heightInches,
        widthCm: pb.dimensions.widthCm,
        heightCm: pb.dimensions.heightCm,
        recommendedFabricWInches: pb.dimensions.widthInches + 2,
        recommendedFabricHInches: pb.dimensions.heightInches + 2,
        recommendedFabricWCm: pb.dimensions.widthCm + 5,
        recommendedFabricHCm: pb.dimensions.heightCm + 5,
        pegboards: {
          cols: pb.pegboardCols,
          rows: pb.pegboardRows,
          total: pb.totalPegboards,
        },
      };
    } else if (selectedCraftType === 'diamond') {
      const dm = calculateDiamondDimensions(gridWidth, gridHeight, 'square-2.5mm');
      return {
        widthInches: dm.dimensions.widthInches,
        heightInches: dm.dimensions.heightInches,
        widthCm: dm.dimensions.widthCm,
        heightCm: dm.dimensions.heightCm,
        recommendedFabricWInches: dm.dimensions.widthInches + 2,
        recommendedFabricHInches: dm.dimensions.heightInches + 2,
        recommendedFabricWCm: dm.dimensions.widthCm + 5,
        recommendedFabricHCm: dm.dimensions.heightCm + 5,
        pegboards: null,
        alpha: null,
      };
    } else if (selectedCraftType === 'alpha') {
      const al = calculateAlphaDimensions(gridWidth, gridHeight);
      return {
        widthInches: al.dimensions.widthInches,
        heightInches: al.dimensions.heightInches,
        widthCm: al.dimensions.widthCm,
        heightCm: al.dimensions.heightCm,
        recommendedFabricWInches: al.dimensions.widthInches,
        recommendedFabricHInches: al.dimensions.heightInches,
        recommendedFabricWCm: al.dimensions.widthCm,
        recommendedFabricHCm: al.dimensions.heightCm,
        pegboards: null,
        alpha: al,
      };
    } else {
      // Tapestry Crochet / Pixel
      const cr = calculateCrochetDimensions(gridWidth, gridHeight, DEFAULT_CROCHET_GAUGE);
      return {
        widthInches: cr.dimensions.widthInches,
        heightInches: cr.dimensions.heightInches,
        widthCm: cr.dimensions.widthCm,
        heightCm: cr.dimensions.heightCm,
        recommendedFabricWInches: cr.dimensions.widthInches,
        recommendedFabricHInches: cr.dimensions.heightInches,
        recommendedFabricWCm: cr.dimensions.widthCm,
        recommendedFabricHCm: cr.dimensions.heightCm,
        pegboards: null,
        alpha: null,
      };
    }
  }, [selectedCraftType, gridWidth, gridHeight, aidaCount, perlerType]);

  // Check if pattern fits in current hoop or frame
  const fitStatus = useMemo(() => {
    const { widthInches, heightInches } = sizingMetrics;
    if (frameType === 'hoop') {
      const patternDiagonal = Math.sqrt(widthInches * widthInches + heightInches * heightInches);
      const fits = patternDiagonal <= selectedHoop;
      const margin = (selectedHoop - patternDiagonal) / 2;
      return {
        fits,
        marginInches: Math.round(margin * 10) / 10,
        message: fits 
          ? `Fits comfortably inside ${selectedHoop}" hoop with ${Math.round(margin * 10) / 10}" breathing room`
          : `Pattern diagonal (${patternDiagonal.toFixed(1)}") exceeds ${selectedHoop}" hoop! Choose a larger hoop.`,
      };
    } else if (frameType === 'frame') {
      const fits = widthInches <= selectedFrame.widthInches && heightInches <= selectedFrame.heightInches;
      const marginX = (selectedFrame.widthInches - widthInches) / 2;
      const marginY = (selectedFrame.heightInches - heightInches) / 2;
      return {
        fits,
        marginInches: Math.round(Math.min(marginX, marginY) * 10) / 10,
        message: fits
          ? `Fits nicely in ${selectedFrame.label} with ${marginX.toFixed(1)}" × ${marginY.toFixed(1)}" matting margin`
          : `Pattern (${widthInches}" × ${heightInches}") exceeds frame opening! Recommend larger frame.`,
      };
    }
    return { fits: true, marginInches: 3, message: 'Raw fabric with standard 3" framing margin on all sides.' };
  }, [sizingMetrics, frameType, selectedHoop, selectedFrame]);

  // Render Realistic Canvas Frame Mockup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen || gridWidth === 0 || gridHeight === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 500;
    canvas.width = size;
    canvas.height = size;

    // Clear background (Cozy craft table surface)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    const tableGrad = ctx.createLinearGradient(0, 0, size, size);
    tableGrad.addColorStop(0, '#1e293b');
    tableGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = tableGrad;
    ctx.fillRect(0, 0, size, size);

    const center = size / 2;

    const viewSizeInches = frameType === 'hoop' ? selectedHoop * 1.35 : Math.max(selectedFrame.widthInches, selectedFrame.heightInches) * 1.35;
    const pixelsPerInch = (size * 0.8) / Math.max(4, viewSizeInches);

    const fabricRadius = (frameType === 'hoop' ? (selectedHoop * pixelsPerInch) / 2 : (Math.max(selectedFrame.widthInches, selectedFrame.heightInches) * pixelsPerInch) / 2) + 15;

    ctx.save();
    if (frameType === 'hoop') {
      ctx.beginPath();
      ctx.arc(center, center, fabricRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#faf8f5';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;
      ctx.fill();
    } else {
      const fw = selectedFrame.widthInches * pixelsPerInch;
      const fh = selectedFrame.heightInches * pixelsPerInch;
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;
      ctx.fillRect(center - fw / 2, center - fh / 2, fw, fh);
    }
    ctx.restore();

    // Subtle Aida grid weave texture
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    const weaveStep = 4;
    for (let x = center - fabricRadius; x <= center + fabricRadius; x += weaveStep) {
      ctx.beginPath();
      ctx.moveTo(x, center - fabricRadius);
      ctx.lineTo(x, center + fabricRadius);
      ctx.stroke();
    }
    for (let y = center - fabricRadius; y <= center + fabricRadius; y += weaveStep) {
      ctx.beginPath();
      ctx.moveTo(center - fabricRadius, y);
      ctx.lineTo(center + fabricRadius, y);
      ctx.stroke();
    }
    ctx.restore();

    // Render Pattern
    const patternPixelW = (sizingMetrics.widthInches * pixelsPerInch);
    const patternPixelH = (sizingMetrics.heightInches * pixelsPerInch);
    const startX = center - patternPixelW / 2;
    const startY = center - patternPixelH / 2;

    const cellW = patternPixelW / gridWidth;
    const cellH = patternPixelH / gridHeight;

    for (let r = 0; r < gridHeight; r++) {
      for (let c = 0; c < gridWidth; c++) {
        const colorIdx = gridData[r][c];
        const color = palette[colorIdx];
        if (!color || color.hex === 'transparent') continue;

        ctx.fillStyle = color.hex;
        const px = startX + c * cellW;
        const py = startY + r * cellH;

        if (selectedCraftType === 'perler') {
          ctx.beginPath();
          ctx.arc(px + cellW / 2, py + cellH / 2, Math.max(1, cellW * 0.45), 0, Math.PI * 2);
          ctx.fill();
        } else if (selectedCraftType === 'cross-stitch') {
          ctx.fillRect(px, py, cellW, cellH);
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, cellW, cellH);
        } else {
          ctx.fillRect(px, py, cellW, cellH);
        }
      }
    }

    // Render Wooden Hoop or Picture Frame on top
    if (frameType === 'hoop') {
      const hoopR = (selectedHoop * pixelsPerInch) / 2;
      const hoopThickness = 12;

      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, hoopR + hoopThickness, 0, Math.PI * 2);
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;

      const hoopGrad = ctx.createRadialGradient(center, center, hoopR, center, center, hoopR + hoopThickness);
      if (frameFinish === 'bamboo') {
        hoopGrad.addColorStop(0, '#d4a373');
        hoopGrad.addColorStop(0.5, '#faedcd');
        hoopGrad.addColorStop(1, '#bc6c25');
      } else if (frameFinish === 'dark-wood') {
        hoopGrad.addColorStop(0, '#582f0e');
        hoopGrad.addColorStop(0.5, '#7f4f24');
        hoopGrad.addColorStop(1, '#331800');
      } else if (frameFinish === 'gold') {
        hoopGrad.addColorStop(0, '#e0a96d');
        hoopGrad.addColorStop(0.5, '#fefae0');
        hoopGrad.addColorStop(1, '#b07d62');
      } else {
        hoopGrad.addColorStop(0, '#e2e8f0');
        hoopGrad.addColorStop(0.5, '#f8fafc');
        hoopGrad.addColorStop(1, '#cbd5e1');
      }

      ctx.lineWidth = hoopThickness;
      ctx.strokeStyle = hoopGrad;
      ctx.beginPath();
      ctx.arc(center, center, hoopR + hoopThickness / 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(center - 10, center - hoopR - hoopThickness - 8, 20, 10);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(center - 3, center - hoopR - hoopThickness - 14, 6, 8);
      ctx.restore();
    } else if (frameType === 'frame') {
      const fw = selectedFrame.widthInches * pixelsPerInch;
      const fh = selectedFrame.heightInches * pixelsPerInch;
      const frameBorder = 16;

      ctx.save();
      ctx.lineWidth = frameBorder;
      if (frameFinish === 'bamboo') {
        ctx.strokeStyle = '#c68b59';
      } else if (frameFinish === 'dark-wood') {
        ctx.strokeStyle = '#3d2613';
      } else if (frameFinish === 'gold') {
        ctx.strokeStyle = '#d4af37';
      } else {
        ctx.strokeStyle = '#ffffff';
      }
      ctx.strokeRect(center - fw / 2 - frameBorder / 2, center - fh / 2 - frameBorder / 2, fw + frameBorder, fh + frameBorder);
      ctx.restore();
    }
  }, [isOpen, gridData, palette, selectedCraftType, sizingMetrics, frameType, selectedHoop, selectedFrame, frameFinish, gridWidth, gridHeight]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Finished Size & Framing Calculator
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  {gridWidth} × {gridHeight} stitches
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Exact physical dimensions, hoop fitting preview, and material estimates
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
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Visual Mockup */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
              
              {/* Frame Overlay Badge */}
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-200 shadow-md">
                {frameType === 'hoop' ? `${selectedHoop}" Embroidery Hoop` : frameType === 'frame' ? selectedFrame.label : 'Raw Fabric Size'}
              </div>

              {/* Fit Indicator Pill */}
              <div className={`absolute bottom-3 inset-x-3 mx-auto px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border shadow-lg flex items-center gap-2 ${
                fitStatus.fits
                  ? 'bg-emerald-950/85 border-emerald-500/50 text-emerald-200'
                  : 'bg-amber-950/85 border-amber-500/50 text-amber-200'
              }`}>
                {fitStatus.fits ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="text-[11px] leading-tight truncate">{fitStatus.message}</span>
              </div>
            </div>

            {/* Frame Finish Selector */}
            {frameType !== 'raw' && (
              <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400">Frame Finish:</span>
                <div className="flex items-center gap-2">
                  {(['bamboo', 'dark-wood', 'white', 'gold'] as const).map((finish) => (
                    <button
                      key={finish}
                      onClick={() => setFrameFinish(finish)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition ${
                        frameFinish === finish
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {finish.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Controls & Metrics */}
          <div className="lg:col-span-6 flex flex-col gap-4 text-xs">
            {/* Craft Type Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">Craft Simulation Medium:</label>
              <div className="grid grid-cols-5 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { id: 'cross-stitch', label: 'Cross-Stitch' },
                  { id: 'alpha', label: 'Alpha Knot' },
                  { id: 'perler', label: 'Perler' },
                  { id: 'diamond', label: 'Diamond' },
                  { id: 'crochet', label: 'Crochet' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedCraftType(item.id as CraftType)}
                    className={`py-1.5 px-1.5 rounded-lg text-[11px] font-semibold transition truncate text-center ${
                      selectedCraftType === item.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Craft-Specific Density / Count Pickers */}
            {selectedCraftType === 'cross-stitch' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">Aida Cloth Count:</label>
                  <span className="text-indigo-400 font-mono text-[11px]">{aidaCount} stitches / inch</span>
                </div>
                <div className="grid grid-cols-6 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {([11, 14, 16, 18, 22, 28] as CrossStitchClothCount[]).map((count) => (
                    <button
                      key={count}
                      onClick={() => setAidaCount(count)}
                      className={`py-1.5 rounded-lg font-mono font-bold transition ${
                        aidaCount === count
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {count}ct
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedCraftType === 'perler' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-300">Bead Size Standard:</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setPerlerType('midi-5mm')}
                    className={`py-2 px-3 rounded-lg text-left transition ${
                      perlerType === 'midi-5mm'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold">Midi 5.0mm</div>
                    <div className="text-[10px] opacity-75">Standard Perler & Hama</div>
                  </button>
                  <button
                    onClick={() => setPerlerType('mini-2.6mm')}
                    className={`py-2 px-3 rounded-lg text-left transition ${
                      perlerType === 'mini-2.6mm'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold">Mini 2.6mm</div>
                    <div className="text-[10px] opacity-75">Artkal & Perler Mini</div>
                  </button>
                </div>

                {/* Perler Pegboards Counter Card */}
                {sizingMetrics.pegboards && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-amber-200 text-sm">
                        {sizingMetrics.pegboards.total} Standard Pegboard{sizingMetrics.pegboards.total > 1 ? 's' : ''}
                      </div>
                      <div className="text-[11px] text-amber-300/80">
                        {sizingMetrics.pegboards.cols} cols × {sizingMetrics.pegboards.rows} rows (29×29 interlocking boards)
                      </div>
                    </div>
                    {onTogglePegboardLines && (
                      <button
                        onClick={onTogglePegboardLines}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          showPegboardLines
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                            : 'bg-slate-900 border-amber-500/50 text-amber-300 hover:bg-slate-800'
                        }`}
                      >
                        {showPegboardLines ? 'Grid Active' : 'Show Grid on Canvas'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Alpha Keychain & Bracelet Materials Card */}
            {selectedCraftType === 'alpha' && sizingMetrics.alpha && (
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex flex-col gap-2.5">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                  <span className="font-bold text-indigo-200 text-xs flex items-center gap-1.5">
                    <span>🪢</span> Alpha Keychain & Bracelet Specs
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                    {gridWidth} warp threads
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400">Base / Warp Strings:</div>
                    <div className="font-bold text-white font-mono mt-0.5">
                      {sizingMetrics.alpha.baseStringsCount} strings cut to {sizingMetrics.alpha.baseStringLengthInches}" ({sizingMetrics.alpha.baseStringLengthCm} cm)
                    </div>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400">Leading Floss Needed:</div>
                    <div className="font-bold text-emerald-300 font-mono mt-0.5">
                      ~{sizingMetrics.alpha.estimatedLeadingYardsTotal} yds (~{sizingMetrics.alpha.estimatedLeadingSkeinsTotal} skeins)
                    </div>
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Recommended Hardware:</span>
                    <span className="font-bold text-amber-200 text-xs">{sizingMetrics.alpha.recommendedHardware}</span>
                  </div>
                  <a
                    href="https://www.amazon.com/s?k=ribbon+clamps+keychain+hardware&tag=pixelcraft01-20"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-semibold transition"
                  >
                    Find Clamps
                  </a>
                </div>
              </div>
            )}

            {/* Frame / Display Preview Options */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">Display Style:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFrameType('hoop')}
                  className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                    frameType === 'hoop'
                      ? 'bg-indigo-950/70 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Circle className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold">Embroidery Hoop</span>
                </button>
                <button
                  onClick={() => setFrameType('frame')}
                  className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                    frameType === 'frame'
                      ? 'bg-indigo-950/70 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Square className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold">Picture Frame</span>
                </button>
              </div>

              {/* Sub-options for Hoop or Frame */}
              {frameType === 'hoop' ? (
                <div className="grid grid-cols-4 gap-1 mt-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {HOOP_OPTIONS.map((hoop) => (
                    <button
                      key={hoop.inches}
                      onClick={() => setSelectedHoop(hoop.inches)}
                      className={`py-1.5 rounded-lg font-mono font-semibold text-center transition ${
                        selectedHoop === hoop.inches
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {hoop.inches}"
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 mt-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {FRAME_OPTIONS.map((f) => (
                    <button
                      key={f.label}
                      onClick={() => setSelectedFrame(f)}
                      className={`py-1.5 px-2 rounded-lg font-mono text-[11px] font-semibold text-center truncate transition ${
                        selectedFrame.label === f.label
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.widthInches}×{f.heightInches}"
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sizing Results Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-medium">Finished Design Size:</span>
                <span className="text-sm font-bold text-white font-mono">
                  {sizingMetrics.widthInches}" × {sizingMetrics.heightInches}"
                  <span className="text-slate-400 font-normal ml-1">
                    ({sizingMetrics.widthCm} × {sizingMetrics.heightCm} cm)
                  </span>
                </span>
              </div>

              {selectedCraftType === 'cross-stitch' && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Fabric to Cut (3" margins):</span>
                  <span className="font-bold text-indigo-300 font-mono">
                    {sizingMetrics.recommendedFabricWInches}" × {sizingMetrics.recommendedFabricHInches}"
                    <span className="text-slate-400 font-normal ml-1">
                      ({sizingMetrics.recommendedFabricWCm} × {sizingMetrics.recommendedFabricHCm} cm)
                    </span>
                  </span>
                </div>
              )}

              {/* Shopping Quick Finder */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Need frames or fabric?</span>
                <a
                  href={`https://www.amazon.com/s?k=${encodeURIComponent(
                    frameType === 'hoop' 
                      ? `${selectedHoop} inch embroidery hoop wood` 
                      : `${selectedFrame.widthInches}x${selectedFrame.heightInches} picture frame`
                  )}&tag=pixelcraft01-20`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold transition"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Find on Amazon</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
