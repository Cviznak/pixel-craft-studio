import React, { useRef, useState, useEffect } from 'react';
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
  PanelLeft,
  PanelRight,
  MoreHorizontal,
  CheckCircle2
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
  isLeftPanelOpen?: boolean;
  onToggleLeftPanel?: () => void;
  isRightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onUpdateConfig,
  onOpenExportModal,
  onOpenAiModal,
  onOpenStarterGallery,
  onResetProgress,
  onClearEverything,
  onLoadProjectJSON,
  onToggleHelpModal,
  isLeftPanelOpen = true,
  onToggleLeftPanel,
  isRightPanelOpen = true,
  onToggleRightPanel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    };
    if (isProjectMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProjectMenuOpen]);

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as CraftProject;
        if (parsed.gridData && parsed.palette) {
          onLoadProjectJSON(parsed);
          setIsProjectMenuOpen(false);
        } else {
          alert('Invalid project JSON file');
        }
      } catch (err) {
        alert('Could not parse project JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const craftTypes: { id: CraftType; label: string; icon: string }[] = [
    { id: 'perler', label: 'Beads', icon: '🔘' },
    { id: 'cross-stitch', label: 'Cross-Stitch', icon: '🧵' },
    { id: 'crochet', label: 'Crochet', icon: '🧶' },
    { id: 'diamond', label: 'Diamond', icon: '💎' },
    { id: 'pixel', label: 'Pixel', icon: '🔲' },
  ];

  return (
    <header className="h-14 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-3 sm:px-4 z-30 shrink-0 select-none">
      {/* Brand & Left Panel Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleLeftPanel && (
          <button
            onClick={onToggleLeftPanel}
            className={`hidden lg:flex p-1.5 rounded-lg border transition ${
              isLeftPanelOpen
                ? 'bg-slate-900 border-slate-700/80 text-indigo-400 hover:text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={isLeftPanelOpen ? 'Collapse settings sidebar' : 'Show settings sidebar'}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-indigo-600 to-amber-400 p-[1.5px] shadow-md shadow-indigo-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Scissors className="w-4 h-4 text-pink-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold tracking-tight text-white m-0">
                Pixel Craft Studio
              </h1>
              <span className="hidden xl:inline text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Pattern Maker
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Craft Style Segmented Control */}
      <div className="flex items-center bg-slate-900/90 border border-slate-800/90 rounded-xl p-1 gap-0.5 shadow-inner">
        {craftTypes.map((item) => {
          const isActive = config.craftType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onUpdateConfig({ craftType: item.id })}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={`Switch craft simulation to ${item.label}`}
            >
              <span className="text-xs">{item.icon}</span>
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Actions & Utilities */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Starter Gallery Button */}
        {onOpenStarterGallery && (
          <button
            onClick={onOpenStarterGallery}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 transition"
            title="Browse pre-made starter craft patterns"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden md:inline">Starters</span>
          </button>
        )}

        {/* Ask AI Button */}
        <button
          onClick={onOpenAiModal}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition"
          title="Ask AI to generate a craft image from a prompt"
        >
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">Ask AI</span>
        </button>

        {/* Hidden Project JSON Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleJsonUpload}
          className="hidden"
        />

        {/* Project Options Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
            className={`p-1.5 rounded-lg border transition ${
              isProjectMenuOpen
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
            title="Project options (Load JSON, New, Reset tracker)"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isProjectMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl p-1 z-50 text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800 transition text-left"
              >
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Load Project JSON</span>
              </button>

              <button
                onClick={() => {
                  setIsProjectMenuOpen(false);
                  onResetProgress();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800 transition text-left"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reset Stitch Tracker</span>
              </button>

              {onClearEverything && (
                <button
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    onClearEverything();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-300 hover:bg-red-950/40 hover:text-red-200 transition text-left"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                  <span>Start Fresh (Reset All)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Buy Me a Coffee */}
        <a
          href="https://buymeacoffee.com/orjustdosomething"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 shadow-sm transition active:scale-95"
          title="Support Pixel Craft Studio on Buy Me a Coffee"
        >
          <Coffee className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Coffee</span>
        </a>

        {/* Help button */}
        <button
          onClick={onToggleHelpModal}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent hover:border-slate-800 transition"
          title="Guide & craft instructions"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Right Palette Panel Toggle (Desktop) */}
        {onToggleRightPanel && (
          <button
            onClick={onToggleRightPanel}
            className={`hidden lg:flex p-1.5 rounded-lg border transition ${
              isRightPanelOpen
                ? 'bg-slate-900 border-slate-700/80 text-pink-400 hover:text-pink-300'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={isRightPanelOpen ? 'Collapse palette sidebar' : 'Show palette sidebar'}
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}

        {/* Primary Call to Action: Export & Print */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-lg shadow-indigo-600/25 transition active:scale-95 ml-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export & Print</span>
        </button>
      </div>
    </header>
  );
};
