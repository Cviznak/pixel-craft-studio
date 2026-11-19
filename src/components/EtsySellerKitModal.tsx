import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShoppingBag, 
  X, 
  Download, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  FileText, 
  Tag 
} from 'lucide-react';
import type { GridConfig, PaletteColor, BackstitchLine } from '../types/craft';
import { 
  renderHeroMockupCanvas, 
  renderPaletteMockupCanvas, 
  renderChartQualityMockupCanvas, 
  renderSizeGuideMockupCanvas,
  generateEtsyListingCopy,
  createEtsySellerZip
} from '../utils/etsyKitGenerator';
import { generatePatternKeeperPDF } from '../utils/exportUtils';

interface EtsySellerKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GridConfig;
  gridData: number[][];
  palette: PaletteColor[];
  backstitches?: BackstitchLine[];
}

export const EtsySellerKitModal: React.FC<EtsySellerKitModalProps> = ({
  isOpen,
  onClose,
  config,
  gridData,
  palette,
  backstitches = [],
}) => {
  const [activeTab, setActiveTab] = useState<'mockups' | 'listing'>('mockups');
  const [patternTitle, setPatternTitle] = useState<string>('Cozy Blossom');
  const [designerName, setDesignerName] = useState<string>('Pixel Craft Studio');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);

  // Pre-rendered canvas refs
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const paletteCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Data URLs for UI preview
  const [heroUrl, setHeroUrl] = useState<string>('');
  const [paletteUrl, setPaletteUrl] = useState<string>('');
  const [chartUrl, setChartUrl] = useState<string>('');
  const [sizeUrl, setSizeUrl] = useState<string>('');

  // Default title on open
  useEffect(() => {
    if (isOpen) {
      const defaultName = `${config.craftType === 'crochet' ? 'Crochet' : 'Cross Stitch'} Motif ${config.width}×${config.height}`;
      setPatternTitle(defaultName);
    }
  }, [isOpen, config.craftType, config.width, config.height]);

  // Render all 4 mockup canvases whenever title, designer, or canvas state changes
  useEffect(() => {
    if (!isOpen || !gridData || gridData.length === 0) return;

    try {
      const hero = renderHeroMockupCanvas(gridData, palette, config, patternTitle, designerName, backstitches);
      heroCanvasRef.current = hero;
      setHeroUrl(hero.toDataURL('image/png'));

      const pal = renderPaletteMockupCanvas(palette, patternTitle, config.craftType);
      paletteCanvasRef.current = pal;
      setPaletteUrl(pal.toDataURL('image/png'));

      const chart = renderChartQualityMockupCanvas(gridData, palette, patternTitle);
      chartCanvasRef.current = chart;
      setChartUrl(chart.toDataURL('image/png'));

      const sz = renderSizeGuideMockupCanvas(config.width, config.height, patternTitle, config.craftType);
      sizeCanvasRef.current = sz;
      setSizeUrl(sz.toDataURL('image/png'));
    } catch (err) {
      console.error('Error rendering mockups:', err);
    }
  }, [isOpen, gridData, palette, config, patternTitle, designerName, backstitches]);

  // Generated listing data
  const listingData = useMemo(() => {
    return generateEtsyListingCopy(patternTitle, config.craftType, config.width, config.height, palette, designerName);
  }, [patternTitle, config.craftType, config.width, config.height, palette, designerName]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Download single image
  const handleDownloadImage = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download complete ZIP
  const handleDownloadZip = async () => {
    if (!heroCanvasRef.current || !paletteCanvasRef.current || !chartCanvasRef.current || !sizeCanvasRef.current) return;

    setIsGeneratingZip(true);
    try {
      const pkBlob = generatePatternKeeperPDF(gridData, palette, config, patternTitle, {
        colorMode: 'color',
        designerName,
        backstitches,
        returnBlob: true,
      }) as Blob | undefined;

      const zipBlob = await createEtsySellerZip(
        heroCanvasRef.current,
        paletteCanvasRef.current,
        chartCanvasRef.current,
        sizeCanvasRef.current,
        listingData,
        patternTitle,
        pkBlob
      );

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${patternTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-etsy-seller-kit.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to bundle ZIP:', err);
      alert('Could not generate ZIP bundle. Please download images individually.');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Etsy & Seller Commercial Kit
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Ready to List
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Turn your craft into ready-to-sell Etsy products with mockups, tags, descriptions &amp; Pattern Keeper PDF (`05_Pattern_Keeper_Digital_Chart.pdf` in ZIP).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 1-Click Complete ZIP Download */}
            <button
              onClick={handleDownloadZip}
              disabled={isGeneratingZip}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 shadow-md active:scale-95 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingZip ? 'Packaging ZIP...' : 'Download Seller ZIP Bundle'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center gap-4 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="font-semibold text-slate-400 shrink-0">Listing Name:</span>
            <input
              type="text"
              value={patternTitle}
              onChange={(e) => setPatternTitle(e.target.value)}
              placeholder="e.g. Lavender Garden"
              className="flex-1 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-indigo-400 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 min-w-[160px]">
            <span className="font-semibold text-slate-400 shrink-0">Shop/Designer:</span>
            <input
              type="text"
              value={designerName}
              onChange={(e) => setDesignerName(e.target.value)}
              placeholder="e.g. My Craft Studio"
              className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-indigo-400 text-xs w-44"
            />
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 ml-auto">
            <button
              onClick={() => setActiveTab('mockups')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'mockups'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>4 Mockup Photos</span>
            </button>
            <button
              onClick={() => setActiveTab('listing')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'listing'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Copy & 13 Tags</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {activeTab === 'mockups' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Ready-to-Upload 1600×1600 Product Photos (Optimized for Etsy Square Viewports)
                </span>
                <span className="text-[11px] text-slate-500">
                  Click 'Download PNG' on any card to save individually.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Mockup 1: Hero Hoop */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">01. Hero Craft Hoop Mockup</h4>
                      <p className="text-[11px] text-slate-400">Main thumbnail with wooden hoop and pattern dimensions</p>
                    </div>
                    <button
                      onClick={() => handleDownloadImage(heroUrl, `${patternTitle}-01-hero-mockup.png`)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PNG</span>
                    </button>
                  </div>
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                    {heroUrl ? (
                      <img src={heroUrl} alt="Hero Mockup" className="w-full h-full object-contain" />
                    ) : (
                      <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    )}
                  </div>
                </div>

                {/* Mockup 2: Color Palette Swatches */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">02. Palette & Thread Swatches</h4>
                      <p className="text-[11px] text-slate-400">DMC code keys, stitch percentages, and skein estimates</p>
                    </div>
                    <button
                      onClick={() => handleDownloadImage(paletteUrl, `${patternTitle}-02-palette-guide.png`)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PNG</span>
                    </button>
                  </div>
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                    {paletteUrl ? (
                      <img src={paletteUrl} alt="Palette Guide" className="w-full h-full object-contain" />
                    ) : (
                      <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    )}
                  </div>
                </div>

                {/* Mockup 3: Symbols & Chart Quality */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">03. High-Contrast Chart Quality</h4>
                      <p className="text-[11px] text-slate-400">Symbol clarity preview that builds buyer trust</p>
                    </div>
                    <button
                      onClick={() => handleDownloadImage(chartUrl, `${patternTitle}-03-chart-quality.png`)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PNG</span>
                    </button>
                  </div>
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                    {chartUrl ? (
                      <img src={chartUrl} alt="Chart Quality" className="w-full h-full object-contain" />
                    ) : (
                      <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    )}
                  </div>
                </div>

                {/* Mockup 4: Sizing & Fabric Guide */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">04. Finished Sizing & Fabric Guide</h4>
                      <p className="text-[11px] text-slate-400">14ct, 16ct, 18ct dimensions in inches & cm with hoop advice</p>
                    </div>
                    <button
                      onClick={() => handleDownloadImage(sizeUrl, `${patternTitle}-04-size-guide.png`)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PNG</span>
                    </button>
                  </div>
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                    {sizeUrl ? (
                      <img src={sizeUrl} alt="Size Guide" className="w-full h-full object-contain" />
                    ) : (
                      <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Listing Title */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Optimized Etsy Listing Title</span>
                    <span className="text-[10px] text-slate-500 font-mono">({listingData.title.length} chars)</span>
                  </div>
                  <button
                    onClick={() => handleCopy(listingData.title, 'title')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 transition"
                  >
                    {copiedKey === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'title' ? 'Copied!' : 'Copy Title'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-medium text-xs text-slate-200">
                  {listingData.title}
                </div>
              </div>

              {/* 13 Etsy Tags */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-bold text-white">13 Etsy Search Tags</span>
                    <span className="text-[10px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/30">
                      Exact 13 Maximum
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(listingData.tags.join(', '), 'tags')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-pink-600/30 hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/40 transition"
                  >
                    {copiedKey === 'tags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'tags' ? 'Copied 13 Tags!' : 'Copy All 13 Tags'}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {listingData.tags.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCopy(t, `tag_${idx}`)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition flex items-center gap-1"
                      title="Click to copy single tag"
                    >
                      <span>{t}</span>
                      {copiedKey === `tag_${idx}` ? (
                        <Check className="w-3 h-3 text-emerald-400 ml-1" />
                      ) : (
                        <span className="text-[10px] text-slate-500 ml-1">#{idx + 1}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formatted Listing Description */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Buyer Description (Formatted Markdown)</span>
                  <button
                    onClick={() => handleCopy(listingData.description, 'description')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 transition"
                  >
                    {copiedKey === 'description' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'description' ? 'Copied Description!' : 'Copy Description'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto scrollbar-thin">
                  {listingData.description}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
