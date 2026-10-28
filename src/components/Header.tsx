import React, { useRef } from 'react';
import type { CraftType, GridConfig, CraftProject } from '../types/craft';
import { 
  Download, 
  FolderOpen, 
  RotateCcw, 
  HelpCircle,
  Scissors,
  Wand2,
  Coffee,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface HeaderProps {
  config: GridConfig;
  onUpdateConfig: (newConfig: Partial<GridConfig>) => void;
  onOpenExportModal: () => void;
  onOpenAiModal: () => void;
  onOpenStarterGallery?: () => void;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
  onResetProgress: () => void;
  onClearEverything?: () => void;
  onLoadProjectJSON: (project: CraftProject) => void;
  onToggleHelpModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onUpdateConfig,
  onOpenExportModal,
  onOpenAiModal,
  onOpenStarterGallery,
  isZenMode = false,
  onToggleZenMode,
  onResetProgress,
  onClearEverything,
  onLoadProjectJSON,
  onToggleHelpModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as CraftProject;
        if (parsed.gridData && parsed.palette) {
          onLoadProjectJSON(parsed);
        } else {
          alert('Invalid project JSON file');
        }
      } catch (err) {
        alert('Could not parse project JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 z-30 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-indigo-600 to-amber-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Scissors className="w-4 h-4 text-pink-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5 m-0">
              Pixel Craft Studio
            </h1>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Pattern Maker
            </span>
          </div>
          <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
            Turn pictures into pixel art craft charts with the most beautiful colors
          </p>
        </div>
      </div>

      {/* Craft Style Quick Buttons in Header */}
      <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
        {[
          { id: 'perler' as CraftType, label: 'Beads', icon: '🔘' },
          { id: 'cross-stitch' as CraftType, label: 'Cross-Stitch', icon: '🧵' },
          { id: 'diamond' as CraftType, label: 'Diamond', icon: '💎' },
          { id: 'pixel' as CraftType, label: 'Pixel', icon: '🔲' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onUpdateConfig({ craftType: item.id })}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              config.craftType === item.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Load Project JSON */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleJsonUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition"
          title="Load saved project JSON"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>Load</span>
        </button>

        {/* Start Fresh */}
        {onClearEverything && (
          <button
            onClick={onClearEverything}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-300 bg-slate-900 hover:bg-red-950/30 border border-slate-800 hover:border-red-500/40 transition"
            title="Start fresh with default pattern"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        )}

        {/* Starter Designs Gallery */}
        {onOpenStarterGallery && (
          <button
            onClick={onOpenStarterGallery}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 transition shadow-sm"
            title="Browse starter pattern gallery"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Starters</span>
          </button>
        )}

        {/* Tablet / Zen Craft Mode */}
        {onToggleZenMode && (
          <button
            onClick={onToggleZenMode}
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isZenMode
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/50'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-700/80'
            }`}
            title={isZenMode ? 'Exit Tablet Craft Mode (Show controls)' : 'Tablet Craft Mode: Focus on stitching with full-width canvas'}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isZenMode ? 'Exit Focus' : 'Focus Mode'}</span>
          </button>
        )}

        {/* Ask AI Button */}
        <button
          onClick={onOpenAiModal}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/20 transition active:scale-98"
          title="Ask AI to generate a picture from prompt"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>

        {/* Reset Craft Tracker */}
        <button
          onClick={onResetProgress}
          className="hidden md:flex p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition items-center gap-1"
          title="Reset craft completion checkboxes"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Done</span>
        </button>

        {/* Buy Me a Coffee */}
        <a
          href="https://buymeacoffee.com/orjustdosomething"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 shadow-sm shadow-amber-400/20 transition active:scale-98"
          title="Enjoying the craft studio? Buy me a coffee!"
        >
          <Coffee className="w-3.5 h-3.5 text-amber-950" />
          <span className="hidden sm:inline">Coffee</span>
        </a>

        {/* Export & Print */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-md shadow-indigo-600/20 transition active:scale-98"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export & Print</span>
          <span className="sm:hidden">Export</span>
        </button>

        {/* Help button */}
        <button
          onClick={onToggleHelpModal}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          title="How to use & crafting tips"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
