import React, { useState, useRef, useEffect } from 'react';
import { Crop, X, Check } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onApplyCrop: (croppedDataUrl: string) => void;
  gridAspectRatio?: number; // width / height
}

type AspectPreset = 'free' | '1:1' | 'grid' | '4:3' | '16:9';

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onApplyCrop,
  gridAspectRatio = 1,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<AspectPreset>('grid');
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  // Normalized crop rectangle: 0 to 1 relative to image dimensions
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.1,
    y: 0.1,
    w: 0.8,
    h: 0.8,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    isDragging: boolean;
    dragType: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | null;
    startX: number;
    startY: number;
    startCrop: { x: number; y: number; w: number; h: number };
  }>({
    isDragging: false,
    dragType: null,
    startX: 0,
    startY: 0,
    startCrop: { x: 0, y: 0, w: 1, h: 1 },
  });

  // Load image
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgElement(img);

      // Initialize crop matching aspect ratio
      const imgRatio = img.width / img.height;
      let targetRatio = gridAspectRatio;
      if (selectedPreset === '1:1') targetRatio = 1;
      else if (selectedPreset === '4:3') targetRatio = 4 / 3;
      else if (selectedPreset === '16:9') targetRatio = 16 / 9;
      else if (selectedPreset === 'free') targetRatio = imgRatio;

      let w = 0.8;
      let h = (w * imgRatio) / targetRatio;
      if (h > 0.8) {
        h = 0.8;
        w = (h * targetRatio) / imgRatio;
      }
      setCrop({
        x: (1 - w) / 2,
        y: (1 - h) / 2,
        w: Math.min(1, Math.max(0.1, w)),
        h: Math.min(1, Math.max(0.1, h)),
      });
    };
    img.src = imageUrl;
  }, [imageUrl, gridAspectRatio, selectedPreset]);

  // Handle Preset change
  const handlePresetSelect = (preset: AspectPreset) => {
    setSelectedPreset(preset);
    if (!imgElement) return;

    const imgRatio = imgElement.width / imgElement.height;
    let targetRatio = imgRatio;
    if (preset === '1:1') targetRatio = 1;
    else if (preset === 'grid') targetRatio = gridAspectRatio;
    else if (preset === '4:3') targetRatio = 4 / 3;
    else if (preset === '16:9') targetRatio = 16 / 9;

    let w = 0.8;
    let h = (w * imgRatio) / targetRatio;
    if (h > 0.8) {
      h = 0.8;
      w = (h * targetRatio) / imgRatio;
    }
    setCrop({
      x: Math.max(0, (1 - w) / 2),
      y: Math.max(0, (1 - h) / 2),
      w: Math.min(1, Math.max(0.1, w)),
      h: Math.min(1, Math.max(0.1, h)),
    });
  };

  // Drag handlers
  const handlePointerDown = (
    e: React.PointerEvent,
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    dragRef.current = {
      isDragging: true,
      dragType: type,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.isDragging || !containerRef.current || !imgElement) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragRef.current.startX) / rect.width;
    const dy = (e.clientY - dragRef.current.startY) / rect.height;
    const start = dragRef.current.startCrop;
    const type = dragRef.current.dragType;

    let newCrop = { ...start };

    if (type === 'move') {
      newCrop.x = Math.max(0, Math.min(1 - start.w, start.x + dx));
      newCrop.y = Math.max(0, Math.min(1 - start.h, start.y + dy));
    } else {
      // Resize
      if (type === 'se' || type === 'e' || type === 's') {
        newCrop.w = Math.max(0.08, Math.min(1 - start.x, start.w + dx));
        newCrop.h = Math.max(0.08, Math.min(1 - start.y, start.h + dy));
      }
      if (type === 'nw' || type === 'w' || type === 'n') {
        const potentialW = start.w - dx;
        const potentialX = start.x + dx;
        if (potentialX >= 0 && potentialW >= 0.08) {
          newCrop.x = potentialX;
          newCrop.w = potentialW;
        }
        const potentialH = start.h - dy;
        const potentialY = start.y + dy;
        if (potentialY >= 0 && potentialH >= 0.08) {
          newCrop.y = potentialY;
          newCrop.h = potentialH;
        }
      }
      if (type === 'ne') {
        newCrop.w = Math.max(0.08, Math.min(1 - start.x, start.w + dx));
        const potentialH = start.h - dy;
        const potentialY = start.y + dy;
        if (potentialY >= 0 && potentialH >= 0.08) {
          newCrop.y = potentialY;
          newCrop.h = potentialH;
        }
      }
      if (type === 'sw') {
        newCrop.h = Math.max(0.08, Math.min(1 - start.y, start.h + dy));
        const potentialW = start.w - dx;
        const potentialX = start.x + dx;
        if (potentialX >= 0 && potentialW >= 0.08) {
          newCrop.x = potentialX;
          newCrop.w = potentialW;
        }
      }
    }

    setCrop(newCrop);
  };

  const handlePointerUp = () => {
    dragRef.current.isDragging = false;
  };

  // Perform Crop & Export
  const handleApply = () => {
    if (!imgElement) return;

    const canvas = document.createElement('canvas');
    const sourceX = Math.round(crop.x * imgElement.naturalWidth);
    const sourceY = Math.round(crop.y * imgElement.naturalHeight);
    const sourceW = Math.max(1, Math.round(crop.w * imgElement.naturalWidth));
    const sourceH = Math.max(1, Math.round(crop.h * imgElement.naturalHeight));

    canvas.width = sourceW;
    canvas.height = sourceH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imgElement,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      0,
      0,
      sourceW,
      sourceH
    );

    const croppedDataUrl = canvas.toDataURL('image/png');
    onApplyCrop(croppedDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  const pixelW = imgElement ? Math.round(crop.w * imgElement.naturalWidth) : 0;
  const pixelH = imgElement ? Math.round(crop.h * imgElement.naturalHeight) : 0;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2.5 sm:p-4 animate-in fade-in duration-150 select-none"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Modal Header */}
        <div className="shrink-0 p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Cut & Crop Picture</h2>
              <p className="text-[11px] text-slate-400">Select the region to pixelate into your craft grid</p>
            </div>
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

        {/* Aspect Ratio Presets Bar */}
        <div className="shrink-0 px-3 sm:px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs overflow-x-auto gap-2 [scrollbar-width:none]">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0">
            Ratio:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'grid' as AspectPreset, label: `Match Grid (${gridAspectRatio.toFixed(2)})` },
              { id: '1:1' as AspectPreset, label: '1:1 Square' },
              { id: 'free' as AspectPreset, label: 'Freeform' },
              { id: '4:3' as AspectPreset, label: '4:3' },
              { id: '16:9' as AspectPreset, label: '16:9' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition ${
                  selectedPreset === p.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-mono text-slate-400 font-bold shrink-0">
            {pixelW} × {pixelH} px
          </div>
        </div>

        {/* Cropping Canvas Preview Container */}
        <div 
          className="flex-1 bg-slate-950/90 flex items-center justify-center p-4 min-h-[320px] max-h-[55vh] overflow-hidden"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {imgElement && (
            <div
              ref={containerRef}
              className="relative select-none max-w-full max-h-[50vh] shadow-xl inline-block"
              style={{
                aspectRatio: `${imgElement.naturalWidth} / ${imgElement.naturalHeight}`,
              }}
            >
              {/* Image */}
              <img
                src={imgElement.src}
                alt="Crop preview"
                className="max-h-[50vh] max-w-full block object-contain pointer-events-none"
              />

              {/* Darkened overlay outside crop */}
              <div
                className="absolute inset-0 bg-black/60 pointer-events-none"
                style={{
                  clipPath: `polygon(
                    0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
                    ${crop.x * 100}% ${crop.y * 100}%,
                    ${(crop.x + crop.w) * 100}% ${crop.y * 100}%,
                    ${(crop.x + crop.w) * 100}% ${(crop.y + crop.h) * 100}%,
                    ${crop.x * 100}% ${(crop.y + crop.h) * 100}%,
                    ${crop.x * 100}% ${crop.y * 100}%
                  )`,
                }}
              />

              {/* Draggable Crop Box */}
              <div
                className="absolute border-2 border-indigo-400 shadow-2xl cursor-move touch-none"
                style={{
                  left: `${crop.x * 100}%`,
                  top: `${crop.y * 100}%`,
                  width: `${crop.w * 100}%`,
                  height: `${crop.h * 100}%`,
                }}
                onPointerDown={(e) => handlePointerDown(e, 'move')}
              >
                {/* Rule of Thirds Guide Lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                  <div className="border-r border-b border-indigo-300 border-dashed" />
                  <div className="border-r border-b border-indigo-300 border-dashed" />
                  <div className="border-b border-indigo-300 border-dashed" />
                  <div className="border-r border-b border-indigo-300 border-dashed" />
                  <div className="border-r border-b border-indigo-300 border-dashed" />
                  <div className="border-b border-indigo-300 border-dashed" />
                  <div className="border-r border-indigo-300 border-dashed" />
                  <div className="border-r border-indigo-300 border-dashed" />
                  <div />
                </div>

                {/* Handles */}
                {/* Top-Left */}
                <div
                  className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md"
                  onPointerDown={(e) => handlePointerDown(e, 'nw')}
                />
                {/* Top-Right */}
                <div
                  className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md"
                  onPointerDown={(e) => handlePointerDown(e, 'ne')}
                />
                {/* Bottom-Left */}
                <div
                  className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md"
                  onPointerDown={(e) => handlePointerDown(e, 'sw')}
                />
                {/* Bottom-Right */}
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md"
                  onPointerDown={(e) => handlePointerDown(e, 'se')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 p-3 sm:p-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={() => {
              setCrop({ x: 0, y: 0, w: 1, h: 1 });
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Reset Selection (Full Image)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 border border-slate-700/80 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
