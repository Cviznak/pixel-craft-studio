import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CRAFT_ROUTES } from '../utils/craftRoutes';
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
  CheckCircle2,
  Smartphone,
  Share2,
  Paintbrush,
  Ruler,
  Video,
  Type,
  Package,
  Maximize2,
  Minimize2,
  ChevronDown,
  ShoppingCart,
  Calculator,
  FolderArchive,
  ShoppingBag,
  Palette,
  Eraser,
  Command,
  Frame,
  Timer,
  Cloud,
  FileCode2,
  RefreshCw,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { formatDurationClock } from '../utils/wipTracker';
import { parseOXSFile } from '../utils/oxsFormat';

interface HeaderProps {
  config: GridConfig;
  onUpdateConfig: (newConfig: Partial<GridConfig>) => void;
  onOpenExportModal: () => void;
  onOpenSocialCardModal?: () => void;
  onOpenAiModal: () => void;
  onOpenStarterGallery?: () => void;
  onOpenNewCanvasModal?: () => void;
  onOpenSizeAndFrameModal?: () => void;
  onOpenTimelapseModal?: () => void;
  onOpenPixelTextModal?: () => void;
  onOpenMyStashModal?: () => void;
  onOpenStitchCompanionModal?: () => void;
  onOpenShoppingTripModal?: () => void;
  onOpenCalculatorsModal?: () => void;
  onOpenProjectVaultModal?: () => void;
  onOpenEtsyKitModal?: () => void;
  onOpenMaterialKitModal?: () => void;
  onOpenColorChartModal?: () => void;
  onOpenBgRemoverModal?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenBorderModal?: () => void;
  onOpenWipTrackerModal?: () => void;
  isWipTimerRunning?: boolean;
  wipSessionSeconds?: number;
  cloudUserEmail?: string | null;
  isCloudSyncing?: boolean;
  onOpenCloudAuthModal?: () => void;
  onOpenPublishModal?: () => void;
  savedProjectsCount?: number;
  isAutoSaving?: boolean;
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
  onOpenSocialCardModal,
  onOpenAiModal,
  onOpenStarterGallery,
  onOpenNewCanvasModal,
  onOpenSizeAndFrameModal,
  onOpenTimelapseModal,
  onOpenPixelTextModal,
  onOpenMyStashModal,
  onOpenStitchCompanionModal,
  onOpenShoppingTripModal,
  onOpenCalculatorsModal,
  onOpenProjectVaultModal,
  onOpenEtsyKitModal,
  onOpenMaterialKitModal,
  onOpenColorChartModal,
  onOpenBgRemoverModal,
  onOpenCommandPalette,
  onOpenBorderModal,
  onOpenWipTrackerModal,
  isWipTimerRunning = false,
  wipSessionSeconds = 0,
  cloudUserEmail = null,
  isCloudSyncing = false,
  onOpenCloudAuthModal,
  onOpenPublishModal,
  savedProjectsCount = 0,
  isAutoSaving = false,
  isZenMode = false,
  onToggleZenMode,
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
  const [isMobileCraftMenuOpen, setIsMobileCraftMenuOpen] = useState(false);
  const mobileCraftMenuRef = useRef<HTMLDivElement>(null);

  // PWA installation state
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (already installed)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosInstallModal(true);
      } else {
        alert("To install Pixel Craft Studio, click the install icon (⊕) in your browser address bar or menu (⋮) -> 'Install App'.");
      }
    }
  };

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProjectMenuOpen(false);
      }
      if (mobileCraftMenuRef.current && !mobileCraftMenuRef.current.contains(e.target as Node)) {
        setIsMobileCraftMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProjectMenuOpen(false);
        setIsMobileCraftMenuOpen(false);
      }
    };
    if (isProjectMenuOpen || isMobileCraftMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProjectMenuOpen, isMobileCraftMenuOpen]);

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawText = String(event.target?.result || '');
        if (file.name.toLowerCase().endsWith('.oxs') || rawText.trimStart().startsWith('<')) {
          const parsedOxs = parseOXSFile(rawText);
          onLoadProjectJSON(parsedOxs);
          setIsProjectMenuOpen(false);
          return;
        }

        const parsed = JSON.parse(rawText);
        const candidate: CraftProject | undefined =
          parsed?.type === 'pixel-craft-studio-project' && parsed.project
            ? parsed.project
            : parsed;
        if (candidate && candidate.gridData && candidate.palette) {
          onLoadProjectJSON(candidate);
          setIsProjectMenuOpen(false);
        } else {
          alert('Invalid project file. Expected .oxs, .json, or .pixelcraft format.');
        }
      } catch {
        alert('Could not parse project file (JSON or .OXS)');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const craftTypes: { id: CraftType; label: string; icon: string }[] = [
    { id: 'perler', label: 'Beads', icon: '🔘' },
    { id: 'loom', label: 'Bead Loom', icon: '📿' },
    { id: 'cross-stitch', label: 'Cross-Stitch', icon: '🧵' },
    { id: 'alpha', label: 'Alpha Knot', icon: '🪢' },
    { id: 'crochet', label: 'Crochet', icon: '🧶' },
    { id: 'knitting', label: 'Knitting', icon: '🥢' },
    { id: 'diamond', label: 'Diamond', icon: '💎' },
    { id: 'pixel', label: 'Pixel', icon: '🔲' },
  ];

  const currentCraft = craftTypes.find((c) => c.id === config.craftType) || craftTypes[0];

  return (
    <header className="h-14 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-2.5 sm:px-4 z-30 shrink-0 select-none">
      {/* Brand & Left Panel Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-3">
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

        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-indigo-600 to-amber-400 p-[1.5px] shadow-md shadow-indigo-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[9px] sm:rounded-[10px] flex items-center justify-center">
              <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400 group-hover:scale-105 transition" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-white m-0">
                <span className="hidden sm:inline">Pixel Craft Studio</span>
                <span className="sm:hidden">PixelCraft</span>
              </h1>
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  isAutoSaving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400/70'
                }`}
                title={isAutoSaving ? 'Saving to browser vault...' : 'Auto-saved to browser vault'}
              />
            </div>
          </div>
        </Link>
      </div>

      {/* Center: Mobile Craft Dropdown (< md) */}
      <div className="md:hidden relative" ref={mobileCraftMenuRef}>
        <button
          onClick={() => setIsMobileCraftMenuOpen(!isMobileCraftMenuOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-bold text-slate-100 shadow-md active:scale-95 transition"
        >
          <span className="text-sm">{currentCraft.icon}</span>
          <span className="max-w-[85px] truncate font-bold">{currentCraft.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
        </button>

        {isMobileCraftMenuOpen && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-52 bg-slate-950/98 backdrop-blur-2xl border border-slate-700/90 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              Select Craft Mode
            </div>
            {craftTypes.map((item) => {
              const isItemActive = config.craftType === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onUpdateConfig({ craftType: item.id });
                    setIsMobileCraftMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-left transition ${
                    isItemActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {isItemActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Center: Desktop Craft Style Segmented Control (hidden md:flex) */}
      <div className="hidden md:flex items-center bg-slate-900/90 border border-slate-800/90 rounded-xl p-1 gap-0.5 shadow-inner">
        {craftTypes.map((item) => {
          const isActive = config.craftType === item.id;
          return (
            <Link
              key={item.id}
              to={CRAFT_ROUTES[item.id].path}
              onClick={() => onUpdateConfig({ craftType: item.id })}
              className={`px-2 py-1 xl:px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={`Switch craft simulation to ${item.label}`}
            >
              <span className="text-xs">{item.icon}</span>
              <span className={isActive ? 'inline font-bold' : 'hidden 2xl:inline'}>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right Actions & Utilities (Clean, decluttered, high breathing room) */}
      <div className="flex items-center gap-1 sm:gap-1.5 xl:gap-2">
        {/* Hidden Project JSON / .OXS Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.pixelcraft,.oxs"
          onChange={handleJsonUpload}
          className="hidden"
        />

        {/* Live Running WIP Timer Pill */}
        {onOpenWipTrackerModal && isWipTimerRunning && (
          <button
            onClick={onOpenWipTrackerModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 shadow-sm transition animate-pulse"
            title="WIP Stitch Timer running — click to open journal & PNG stats card"
          >
            <Timer className="w-3.5 h-3.5 text-emerald-400" />
            <span>{formatDurationClock(wipSessionSeconds)}</span>
          </button>
        )}

        {/* Quick Command Palette Launcher (Ctrl+K) */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 shadow-sm transition active:scale-95"
            title="Command Palette & Quick Actions (Ctrl+K / Cmd+K)"
          >
            <Command className="w-3.5 h-3.5 text-indigo-400" />
            <kbd className="hidden md:inline text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Unified Projects & Cloud Sync Button */}
        {onOpenProjectVaultModal && (
          <button
            onClick={onOpenProjectVaultModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 shadow-sm transition active:scale-95"
            title={
              cloudUserEmail
                ? `Projects Vault • Cloud Sync active (${cloudUserEmail})`
                : 'Open My Projects Vault (WIPs & saved designs)'
            }
          >
            <FolderArchive className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Projects</span>
            {savedProjectsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                {savedProjectsCount}
              </span>
            )}
            {cloudUserEmail && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCloudSyncing ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'
                }`}
              />
            )}
          </button>
        )}

        {/* Categorized Tools Mega-Popover */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border shadow-sm transition ${
              isProjectMenuOpen
                ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800'
            }`}
            title="All Studio tools, calculators, cloud sync & standalone pages"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Tools</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProjectMenuOpen && (
            <div className="absolute right-0 mt-2 w-[min(94vw,640px)] max-h-[82vh] overflow-y-auto bg-slate-950/98 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Column 1: Create & Edit */}
                <div className="flex flex-col gap-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300/90 border-b border-slate-800/80 mb-1">
                    Create &amp; Edit
                  </div>

                  {onOpenNewCanvasModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenNewCanvasModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-200 hover:bg-slate-800 transition text-left"
                    >
                      <Paintbrush className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>New Blank Canvas</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsProjectMenuOpen(false);
                      onOpenAiModal();
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-purple-300 hover:bg-slate-800 transition text-left"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>AI Motif Generator</span>
                  </button>

                  {onOpenBgRemoverModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenBgRemoverModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-teal-300 hover:bg-slate-800 transition text-left"
                    >
                      <Eraser className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Background Remover</span>
                    </button>
                  )}

                  {onOpenPixelTextModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenPixelTextModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-200 hover:bg-slate-800 transition text-left"
                    >
                      <Type className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Pixel Text &amp; Monogram</span>
                    </button>
                  )}

                  {onOpenBorderModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenBorderModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-pink-200 hover:bg-slate-800 transition text-left"
                    >
                      <Frame className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span>Border &amp; Sampler Frame</span>
                    </button>
                  )}

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 transition text-left"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Import JSON / .OXS</span>
                  </button>

                  <div className="my-1 border-t border-slate-800/80" />

                  <button
                    onClick={() => {
                      setIsProjectMenuOpen(false);
                      onResetProgress();
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition text-left"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Reset Stitch Tracker</span>
                  </button>

                  {onClearEverything && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onClearEverything();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition text-left"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Start Fresh (Reset)</span>
                    </button>
                  )}
                </div>

                {/* Column 2: Stitch & Supplies */}
                <div className="flex flex-col gap-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300/90 border-b border-slate-800/80 mb-1">
                    Stitch &amp; Supplies
                  </div>

                  {onOpenMaterialKitModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenMaterialKitModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-300 hover:bg-slate-800 transition text-left font-semibold"
                    >
                      <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Smart Supply Kit</span>
                    </button>
                  )}

                  {onOpenShoppingTripModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenShoppingTripModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-emerald-300 hover:bg-slate-800 transition text-left"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Shopping Checklist</span>
                    </button>
                  )}

                  {onOpenMyStashModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenMyStashModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-emerald-200 hover:bg-slate-800 transition text-left"
                    >
                      <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>My Floss &amp; Bead Stash</span>
                    </button>
                  )}

                  {onOpenSizeAndFrameModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenSizeAndFrameModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 transition text-left"
                    >
                      <Ruler className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Size &amp; Framing</span>
                    </button>
                  )}

                  {onOpenCalculatorsModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenCalculatorsModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-200 hover:bg-slate-800 transition text-left"
                    >
                      <Calculator className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Craft Calculators</span>
                    </button>
                  )}

                  {onOpenColorChartModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenColorChartModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-indigo-300 hover:bg-slate-800 transition text-left"
                    >
                      <Palette className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Color Chart &amp; Hex</span>
                    </button>
                  )}

                  {onOpenStitchCompanionModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenStitchCompanionModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-teal-300 hover:bg-slate-800 transition text-left"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Stitch Companion</span>
                    </button>
                  )}

                  {onOpenWipTrackerModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenWipTrackerModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-emerald-200 hover:bg-slate-800 transition text-left"
                    >
                      <Timer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>WIP Timer &amp; Stats</span>
                      {isWipTimerRunning && (
                        <span className="ml-auto text-[10px] font-mono text-emerald-400">
                          {formatDurationClock(wipSessionSeconds)}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Column 3: Community & Standalone Pages */}
                <div className="flex flex-col gap-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-pink-300/90 border-b border-slate-800/80 mb-1">
                    Community &amp; Pages
                  </div>

                  {onOpenStarterGallery && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenStarterGallery();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-pink-300 hover:bg-slate-800 transition text-left font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span>Starter Gallery</span>
                    </button>
                  )}

                  {onOpenPublishModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenPublishModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-pink-200 hover:bg-slate-800 transition text-left"
                    >
                      <Share2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span>Publish Short Link</span>
                    </button>
                  )}

                  {onOpenSocialCardModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenSocialCardModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-300 hover:bg-slate-800 transition text-left"
                    >
                      <Share2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Share Social Card</span>
                    </button>
                  )}

                  {onOpenTimelapseModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenTimelapseModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-200 hover:bg-slate-800 transition text-left"
                    >
                      <Video className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Timelapse Video</span>
                    </button>
                  )}

                  {onOpenEtsyKitModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenEtsyKitModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-300 hover:bg-slate-800 transition text-left"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Etsy Seller Kit</span>
                    </button>
                  )}

                  {onOpenCloudAuthModal && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onOpenCloudAuthModal();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-cyan-300 hover:bg-slate-800 transition text-left font-semibold"
                    >
                      <Cloud className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{cloudUserEmail ? 'Cloud Sync (On)' : 'Cloud Sync Sign In'}</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-slate-800/80" />

                  <Link
                    to="/oxs-viewer"
                    onClick={() => setIsProjectMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-emerald-300 hover:bg-slate-800 transition text-left"
                  >
                    <FileCode2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>.OXS Pattern Viewer</span>
                  </Link>

                  <Link
                    to="/tools/color-substitutor"
                    onClick={() => setIsProjectMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-indigo-300 hover:bg-slate-800 transition text-left"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Color Substitutor</span>
                  </Link>

                  <Link
                    to="/community"
                    onClick={() => setIsProjectMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-pink-300 hover:bg-slate-800 transition text-left"
                  >
                    <Globe className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    <span>Community Hub</span>
                  </Link>

                  <Link
                    to="/about"
                    onClick={() => setIsProjectMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition text-left"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>About &amp; License</span>
                  </Link>
                </div>
              </div>

              {/* Utility Bar Footer */}
              <div className="border-t border-slate-800/80 pt-2.5 mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {onToggleZenMode && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onToggleZenMode();
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                        isZenMode
                          ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-200 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                      <span>{isZenMode ? 'Exit Focus Mode' : 'Focus Mode'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsProjectMenuOpen(false);
                      onToggleHelpModal();
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Help &amp; Guide</span>
                  </button>

                  {!isInstalled && (
                    <button
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        handleInstallClick();
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 hover:text-white transition"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Install App</span>
                    </button>
                  )}
                </div>

                <a
                  href="https://buymeacoffee.com/orjustdosomething"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition font-semibold"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Buy Me a Coffee</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Palette Panel Toggle (Desktop) */}
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
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-lg shadow-indigo-600/25 transition active:scale-95"
          title="Export pattern as PDF, PNG, .OXS, or .SVG"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIosInstallModal && (
        <div 
          onClick={() => setShowIosInstallModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Install on iPhone / iPad</h3>
              </div>
              <button 
                onClick={() => setShowIosInstallModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              To install Pixel Craft Studio as a full-screen offline app on iOS:
            </p>

            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <li>Tap the <strong className="text-white">Share</strong> button in Safari's bottom toolbar (<span className="text-indigo-400">⎋</span>).</li>
              <li>Scroll down and tap <strong className="text-white">Add to Home Screen</strong> (<span className="text-indigo-400">⊞</span>).</li>
              <li>Tap <strong className="text-white">Add</strong> at top right.</li>
            </ol>

            <button
              onClick={() => setShowIosInstallModal(false)}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
