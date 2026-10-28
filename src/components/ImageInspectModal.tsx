import React, { useState, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ExternalLink, 
  Download, 
  Copy, 
  Check, 
  Sparkles,
  Layers
} from 'lucide-react';

interface ImageInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  prompt?: string;
  styleName?: string;
  onUseForCraft?: (url: string) => void;
}

export const ImageInspectModal: React.FC<ImageInspectModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Image Inspection',
  prompt,
  styleName,
  onUseForCraft,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Reset zoom whenever image changes or opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
    }
  }, [isOpen, imageUrl]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleCopyPrompt = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenInNewTab = () => {
    // Open in separate browser window/tab
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title || 'Inspect Image'}</title>
            <style>
              body {
                margin: 0;
                background: #0f172a;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                color: #e2e8f0;
                font-family: system-ui, sans-serif;
              }
              img {
                max-width: 90vw;
                max-height: 85vh;
                object-fit: contain;
                border-radius: 12px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
              }
              p {
                margin-top: 16px;
                font-size: 14px;
                color: #94a3b8;
                max-width: 600px;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" alt="Full Resolution Inspection" />
            ${prompt ? `<p>"${prompt}"</p>` : ''}
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `pixelcraft-inspection-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {title}
                {styleName && (
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium border border-slate-700">
                    {styleName}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Inspect image quality, vibrant colors, and fine details
              </p>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInNewTab}
              className="p-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5"
              title="Open full image in a new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5"
              title="Save image to computer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Inspection Viewport */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-6 min-h-[350px]">
          {/* Zoom floating controls */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
            <button
              onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-xs font-mono px-2"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
          </div>

          {/* Rendered Image */}
          <div className="w-full h-full flex items-center justify-center overflow-auto max-h-[60vh]">
            <img
              src={imageUrl}
              alt="Inspected Artwork"
              style={{
                transform: `scale(${zoom})`,
                transition: 'transform 0.15s ease-out',
              }}
              className="max-h-[55vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800/80 select-none"
            />
          </div>
        </div>

        {/* Footer with prompt info & Use for Craft button */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          {prompt ? (
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <span className="text-slate-500 text-xs shrink-0 font-medium">Prompt:</span>
              <p className="text-xs text-slate-300 font-medium truncate" title={prompt}>
                &ldquo;{prompt}&rdquo;
              </p>
              <button
                onClick={handleCopyPrompt}
                className="p-1 text-slate-400 hover:text-slate-200 transition shrink-0"
                title="Copy prompt"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full resolution craft source photo</span>
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onUseForCraft && (
              <button
                onClick={() => {
                  onUseForCraft(imageUrl);
                  onClose();
                }}
                className="py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-98"
              >
                <Layers className="w-3.5 h-3.5" />
                Turn into Pixel Craft Grid!
              </button>
            )}
            <button
              onClick={onClose}
              className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
