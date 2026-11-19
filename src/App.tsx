import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import type { 
  GridConfig, 
  PaletteColor, 
  CellProgress, 
  SampleImage, 
  CraftProject,
  SavedProject,
  AiHistoryItem,
  UploadHistoryItem,
  BackstitchLine,
  PaletteMoodId,
  CraftType,
  CanvasShapeMask,
  CanvasLayer
} from './types/craft';
import { SAMPLE_IMAGES } from './utils/sampleImages';
import { extractBeautifulPalette } from './utils/paletteExtractor';
import { processImageToGrid } from './utils/pixelation';
import { saveAppState, loadAppState, clearSavedAppState, getAllVaultProjects, saveProjectToVault } from './utils/storage';
import { DEFAULT_CROCHET_GAUGE } from './utils/craftCalculator';
import { Header } from './components/Header';
import { ControlsPanel } from './components/ControlsPanel';
import { CraftCanvas } from './components/CraftCanvas';
import { PaletteLegend } from './components/PaletteLegend';
import type { ColorChartTab } from './components/ColorChartModal';
import type { CommandPaletteItem } from './components/CommandPaletteModal';

const ExportModal = lazy(() => import('./components/ExportModal').then((m) => ({ default: m.ExportModal })));
const HelpModal = lazy(() => import('./components/HelpModal').then((m) => ({ default: m.HelpModal })));
const AiGenerateModal = lazy(() => import('./components/AiGenerateModal').then((m) => ({ default: m.AiGenerateModal })));
const ImageInspectModal = lazy(() => import('./components/ImageInspectModal').then((m) => ({ default: m.ImageInspectModal })));
const StarterGalleryModal = lazy(() => import('./components/StarterGalleryModal').then((m) => ({ default: m.StarterGalleryModal })));
const ImageCropModal = lazy(() => import('./components/ImageCropModal').then((m) => ({ default: m.ImageCropModal })));
const ImageHistoryModal = lazy(() => import('./components/ImageHistoryModal').then((m) => ({ default: m.ImageHistoryModal })));
const CrochetWrittenInstructionsModal = lazy(() => import('./components/CrochetWrittenInstructionsModal').then((m) => ({ default: m.CrochetWrittenInstructionsModal })));
const NewCanvasModal = lazy(() => import('./components/NewCanvasModal').then((m) => ({ default: m.NewCanvasModal })));
const SocialCardModal = lazy(() => import('./components/SocialCardModal').then((m) => ({ default: m.SocialCardModal })));
const SizeAndFrameModal = lazy(() => import('./components/SizeAndFrameModal').then((m) => ({ default: m.SizeAndFrameModal })));
const TimelapseModal = lazy(() => import('./components/TimelapseModal').then((m) => ({ default: m.TimelapseModal })));
const PixelTextModal = lazy(() => import('./components/PixelTextModal').then((m) => ({ default: m.PixelTextModal })));
const MyStashModal = lazy(() => import('./components/MyStashModal').then((m) => ({ default: m.MyStashModal })));
const StitchCompanionModal = lazy(() => import('./components/StitchCompanionModal').then((m) => ({ default: m.StitchCompanionModal })));
const ShoppingTripModal = lazy(() => import('./components/ShoppingTripModal').then((m) => ({ default: m.ShoppingTripModal })));
const CraftCalculatorsModal = lazy(() => import('./components/CraftCalculatorsModal').then((m) => ({ default: m.CraftCalculatorsModal })));
const ProjectVaultModal = lazy(() => import('./components/ProjectVaultModal').then((m) => ({ default: m.ProjectVaultModal })));
const EtsySellerKitModal = lazy(() => import('./components/EtsySellerKitModal').then((m) => ({ default: m.EtsySellerKitModal })));
const PhotoPaletteModal = lazy(() => import('./components/PhotoPaletteModal').then((m) => ({ default: m.PhotoPaletteModal })));
const MaterialKitModal = lazy(() => import('./components/MaterialKitModal').then((m) => ({ default: m.MaterialKitModal })));
const ColorChartModal = lazy(() => import('./components/ColorChartModal').then((m) => ({ default: m.ColorChartModal })));
const PatternDetailModal = lazy(() => import('./components/PatternDetailModal').then((m) => ({ default: m.PatternDetailModal })));
const BackgroundRemoverModal = lazy(() => import('./components/BackgroundRemoverModal').then((m) => ({ default: m.BackgroundRemoverModal })));
const BorderBuilderModal = lazy(() => import('./components/BorderBuilderModal').then((m) => ({ default: m.BorderBuilderModal })));
const WipTrackerModal = lazy(() => import('./components/WipTrackerModal').then((m) => ({ default: m.WipTrackerModal })));
const CommandPaletteModal = lazy(() => import('./components/CommandPaletteModal').then((m) => ({ default: m.CommandPaletteModal })));
const CloudAuthModal = lazy(() => import('./components/CloudAuthModal').then((m) => ({ default: m.CloudAuthModal })));
const PublishPatternModal = lazy(() => import('./components/PublishPatternModal').then((m) => ({ default: m.PublishPatternModal })));
const SharedPatternModal = lazy(() => import('./components/SharedPatternModal').then((m) => ({ default: m.SharedPatternModal })));

import { recalculatePaletteCounts } from './utils/borderGenerator';
import {
  MAX_LAYERS,
  cloneGrid,
  cloneLayers,
  countLayerFilledCells,
  createEmptyLayerGrid,
  createLayer,
  createSingleLayerStack,
  duplicateLayer as duplicateCanvasLayer,
  extractBorderDiffGrid,
  flattenLayers,
  getUniqueLayerName,
  inferColorIndexRemap,
  mergeLayerDown as mergeCanvasLayerDown,
  moveLayerOrder as moveCanvasLayerOrder,
  normalizeLayersForGrid,
  remapLayersColorIndices,
  resizeLayerGrid,
  rotateLayerGrid,
} from './utils/layerUtils';
import { exportPatternToOXS, exportPatternToSVG } from './utils/oxsFormat';
import { loadWipStats, saveWipStats, type WipStats, type WipSessionLog } from './utils/wipTracker';
import { isSupabaseConfigured, supabase } from './utils/supabaseClient';
import {
  fetchUserLikedPatternIds,
  pushPreferencesToCloud,
  pushSingleProjectToCloud,
  syncProjectsWithCloud,
  syncStashAndWipWithCloud,
  toggleCommunityPatternLike,
  type CloudSyncSummary,
  type PublishedPatternRecord,
} from './utils/cloudSync';
import { applyPaletteMood, convertPatternToCraft } from './utils/craftCrossConverter';
import { getMyStash } from './utils/stashManager';
import { hexToRgb, rgbToLab, deltaE } from './utils/colorUtils';
import { 
  createPaletteFromPreset, 
  createBlankCanvasGrid, 
  generateCanvasDataUrl 
} from './utils/pixelStudioPalettes';
import { getCraftSymbol } from './utils/symbols';
import { cleanConfettiColors } from './utils/paletteOperations';
import { 
  GALLERY_ROUTE,
  getRouteByPath, 
  getPathForCraft, 
  updateDocumentMeta, 
  getCalculatorRoute,
  getColorChartRoute,
  getPatternRouteInfo,
  getSharedPatternRouteId,
  buildSharedPatternMeta
} from './utils/craftRoutes';
import { getPatternBySlug } from './utils/communityPatterns';
import { decodePatternFromHash } from './utils/shareUtils';
import { consumePendingStudioProject } from './utils/studioHandoff';
import {
  SlidersHorizontal,
  Sparkles,
  Wand2,
  Palette,
  ChevronLeft,
  ChevronRight,
  FileText,
  Smartphone,
  FolderArchive,
  Frame,
  Timer,
  SplitSquareHorizontal,
  Download,
  Ruler,
  Video,
  Type,
  Package,
  Calculator,
  Eraser,
  Undo2,
  Redo2,
  Maximize2,
  ShoppingCart,
  ShoppingBag,
  Cloud,
  Globe,
  Share2,
  RefreshCw,
  Layers,
} from 'lucide-react';

const DEFAULT_CONFIG: GridConfig = {
  width: 32,
  height: 32,
  lockAspectRatio: true,
  colorsCount: 14,
  craftType: 'perler',
  extractionMode: 'balanced',
  dither: 'none',
  craftStandard: 'custom',
  brightness: 0,
  contrast: 0,
  saturation: 0,
  showGridLines: true,
  show10x10MajorLines: true,
  showRulers: true,
  showSymbols: true,
  cellSize: 24,
  transparentMode: 'white',
  unitSystem: 'imperial',
  crochetGauge: DEFAULT_CROCHET_GAUGE,
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [config, setConfig] = useState<GridConfig>(() => {
    const route = getRouteByPath(window.location.pathname);
    return route ? { ...DEFAULT_CONFIG, craftType: route.craftType } : DEFAULT_CONFIG;
  });
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceImageDataUrl, setSourceImageDataUrl] = useState<string | null>(null);
  const [sampleImageId, setSampleImageId] = useState<string>('flower');
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>('');
  const [rightSidebarTab, setRightSidebarTab] = useState<'palette' | 'layers'>('palette');
  const gridData = useMemo(() => flattenLayers(layers), [layers]);
  const [spotlightColorId, setSpotlightColorId] = useState<string | null>(null);
  const [activeColorIndex, setActiveColorIndex] = useState<number>(0);
  const [completedCells, setCompletedCells] = useState<CellProgress>({});
  const [hasTransparency, setHasTransparency] = useState<boolean>(false);
  const [isInitialLoaded, setIsInitialLoaded] = useState<boolean>(false);
  
  // Undo & Redo History for Layer Stack
  const [gridHistory, setGridHistory] = useState<{ layers: CanvasLayer[]; activeLayerId: string }[]>([]);
  const [gridFuture, setGridFuture] = useState<{ layers: CanvasLayer[]; activeLayerId: string }[]>([]);

  // AI generation state & history
  const [lastAiPrompt, setLastAiPrompt] = useState<string>('');
  const [lastAiStyle, setLastAiStyle] = useState<string>('pixel-art');
  const [aiHistory, setAiHistory] = useState<AiHistoryItem[]>([]);

  // User uploaded pictures history
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isWrittenInstructionsOpen, setIsWrittenInstructionsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isStarterGalleryOpen, setIsStarterGalleryOpen] = useState<boolean>(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isNewCanvasModalOpen, setIsNewCanvasModalOpen] = useState<boolean>(false);
  const [isSocialCardOpen, setIsSocialCardOpen] = useState<boolean>(false);
  const [isSizeAndFrameOpen, setIsSizeAndFrameOpen] = useState<boolean>(false);
  const [isTimelapseOpen, setIsTimelapseOpen] = useState<boolean>(false);
  const [isPixelTextOpen, setIsPixelTextOpen] = useState<boolean>(false);
  const [isMyStashOpen, setIsMyStashOpen] = useState<boolean>(false);
  const [isStitchCompanionOpen, setIsStitchCompanionOpen] = useState<boolean>(false);
  const [isShoppingTripOpen, setIsShoppingTripOpen] = useState<boolean>(false);
  const [isCalculatorsOpen, setIsCalculatorsOpen] = useState<boolean>(false);
  const [calculatorInitialTab, setCalculatorInitialTab] = useState<'floss' | 'beads' | 'c2c'>('floss');
  const [isProjectVaultOpen, setIsProjectVaultOpen] = useState<boolean>(false);
  const [isEtsyKitOpen, setIsEtsyKitOpen] = useState<boolean>(false);
  const [isPhotoPaletteOpen, setIsPhotoPaletteOpen] = useState<boolean>(false);
  const [isMaterialKitOpen, setIsMaterialKitOpen] = useState<boolean>(false);
  const [isColorChartOpen, setIsColorChartOpen] = useState<boolean>(false);
  const [colorChartInitialTab, setColorChartInitialTab] = useState<ColorChartTab>('hex-matcher');
  const [activePatternSlug, setActivePatternSlug] = useState<string | null>(null);
  const [isBgRemoverOpen, setIsBgRemoverOpen] = useState<boolean>(false);
  const [isBorderModalOpen, setIsBorderModalOpen] = useState<boolean>(false);
  const [isWipTrackerOpen, setIsWipTrackerOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [splitCompareSignal, setSplitCompareSignal] = useState<number>(0);

  // Wave 4: Cloud Auth, Sync, Publishing & Shared Pattern Modal States
  const [isCloudAuthOpen, setIsCloudAuthOpen] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [activeSharedPatternId, setActiveSharedPatternId] = useState<string | null>(null);
  const [galleryInitialTab, setGalleryInitialTab] = useState<'curated' | 'community'>('curated');
  const [galleryAuthorFilter, setGalleryAuthorFilter] = useState<string | null>(null);
  const [remixedFrom, setRemixedFrom] = useState<{ shortId: string; title: string } | null>(null);
  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const [cloudDisplayName, setCloudDisplayName] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('pcs_cloud_display_name') || '' : ''
  );
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastCloudSyncedAt, setLastCloudSyncedAt] = useState<string | null>(null);
  const [lastCloudSyncSummary, setLastCloudSyncSummary] = useState<CloudSyncSummary | null>(null);
  const [likedPatternIds, setLikedPatternIds] = useState<Set<string>>(new Set());

  // WIP Time Tracker, Stitch Speed & Session Journal
  const [wipStats, setWipStats] = useState<WipStats>(() => loadWipStats());
  const wipStatsRef = useRef<WipStats>(wipStats);
  useEffect(() => {
    wipStatsRef.current = wipStats;
  }, [wipStats]);
  const isSyncInFlightRef = useRef<boolean>(false);
  const [isWipTimerRunning, setIsWipTimerRunning] = useState<boolean>(false);
  const [wipSessionSeconds, setWipSessionSeconds] = useState<number>(0);
  const [wipSessionStartStitches, setWipSessionStartStitches] = useState<number>(0);

  useEffect(() => {
    if (!isWipTimerRunning) return;
    const id = window.setInterval(() => {
      setWipSessionSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isWipTimerRunning]);
  const [vaultProjectsCount, setVaultProjectsCount] = useState<number>(0);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [backstitches, setBackstitches] = useState<BackstitchLine[]>([]);
  const [showPegboardLines, setShowPegboardLines] = useState<boolean>(false);
  const [useMyStashOnly, setUseMyStashOnly] = useState<boolean>(false);
  const useMyStashOnlyRef = useRef<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState<boolean>(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState<boolean>(false);
  const [inspectModalOpen, setInspectModalOpen] = useState<boolean>(false);
  const [inspectData, setInspectData] = useState<{
    url: string;
    title?: string;
    prompt?: string;
    styleName?: string;
  } | null>(null);

  // Drag and drop state
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  // Persistent refs for zero-lag config and image pipeline synchronization
  const latestConfigRef = useRef<GridConfig>(config);
  const paletteRef = useRef<PaletteColor[]>(palette);
  const layersRef = useRef<CanvasLayer[]>(layers);
  const activeLayerIdRef = useRef<string>(activeLayerId);
  const sourceImageRef = useRef<HTMLImageElement | null>(sourceImage);
  const reprocessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLayerGuardToastRef = useRef<number>(0);

  useEffect(() => {
    latestConfigRef.current = config;
  }, [config]);

  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    activeLayerIdRef.current = activeLayerId;
  }, [activeLayerId]);

  useEffect(() => {
    sourceImageRef.current = sourceImage;
  }, [sourceImage]);

  const applyLayerState = useCallback((nextLayers: CanvasLayer[], nextActiveId?: string) => {
    const fallbackActive = nextLayers[nextLayers.length - 1]?.id || '';
    const resolvedActive =
      nextActiveId && nextLayers.some((l) => l.id === nextActiveId)
        ? nextActiveId
        : fallbackActive;
    layersRef.current = nextLayers;
    activeLayerIdRef.current = resolvedActive;
    setLayers(nextLayers);
    setActiveLayerId(resolvedActive);
  }, []);

  const setSingleLayerGrid = useCallback(
    (grid: number[][], layerName = 'Layer 1') => {
      const stack = createSingleLayerStack(grid, layerName);
      applyLayerState(stack.layers, stack.activeLayerId);
    },
    [applyLayerState]
  );

  const syncPaletteCountsFromLayers = useCallback((targetLayers: CanvasLayer[], basePalette?: PaletteColor[]) => {
    const pal = basePalette ?? paletteRef.current;
    if (pal.length === 0) return;
    const flat = flattenLayers(targetLayers);
    const updated = recalculatePaletteCounts(flat, pal);
    paletteRef.current = updated;
    setPalette(updated);
  }, []);

  // Reference for synchronous beforeunload save
  const currentStateRef = useRef({
    config,
    palette,
    gridData,
    layers,
    activeLayerId,
    completedCells,
    spotlightColorId,
    activeColorIndex,
    sourceImageDataUrl,
    sampleImageId,
    lastAiPrompt,
    lastAiStyle,
    aiHistory,
    uploadHistory,
  });

  useEffect(() => {
    currentStateRef.current = {
      config,
      palette,
      gridData,
      layers,
      activeLayerId,
      completedCells,
      spotlightColorId,
      activeColorIndex,
      sourceImageDataUrl,
      sampleImageId,
      lastAiPrompt,
      lastAiStyle,
      aiHistory,
      uploadHistory,
    };
  }, [
    config,
    palette,
    gridData,
    layers,
    activeLayerId,
    completedCells,
    spotlightColorId,
    activeColorIndex,
    sourceImageDataUrl,
    sampleImageId,
    lastAiPrompt,
    lastAiStyle,
    aiHistory,
    uploadHistory,
  ]);

  // Push snapshot to undo history before pencil/layer stroke begins
  const handleBeforePencilStroke = useCallback(() => {
    if (layersRef.current.length === 0) return;
    setGridHistory((prev) => [
      ...prev.slice(-29),
      { layers: cloneLayers(layersRef.current), activeLayerId: activeLayerIdRef.current },
    ]);
    setGridFuture([]); // clear redo stack on new action
  }, []);

  // Undo (Ctrl+Z)
  const handleUndo = useCallback(() => {
    if (gridHistory.length === 0) return;
    const previous = gridHistory[gridHistory.length - 1];
    setGridHistory((prev) => prev.slice(0, prev.length - 1));
    setGridFuture((prev) => [
      ...prev.slice(-29),
      { layers: cloneLayers(layersRef.current), activeLayerId: activeLayerIdRef.current },
    ]);
    applyLayerState(previous.layers, previous.activeLayerId);
    syncPaletteCountsFromLayers(previous.layers);
    const prevH = previous.layers[0]?.grid.length ?? 0;
    const prevW = prevH > 0 ? previous.layers[0].grid[0]?.length ?? 0 : 0;
    if (prevW > 0 && prevH > 0 && (prevW !== latestConfigRef.current.width || prevH !== latestConfigRef.current.height)) {
      const updatedCfg = { ...latestConfigRef.current, width: prevW, height: prevH };
      latestConfigRef.current = updatedCfg;
      setConfig(updatedCfg);
      setAspectRatio(prevW / prevH);
    }
  }, [gridHistory, applyLayerState, syncPaletteCountsFromLayers]);

  // Redo (Ctrl+Y or Ctrl+Shift+Z)
  const handleRedo = useCallback(() => {
    if (gridFuture.length === 0) return;
    const next = gridFuture[gridFuture.length - 1];
    setGridFuture((prev) => prev.slice(0, prev.length - 1));
    setGridHistory((prev) => [
      ...prev.slice(-29),
      { layers: cloneLayers(layersRef.current), activeLayerId: activeLayerIdRef.current },
    ]);
    applyLayerState(next.layers, next.activeLayerId);
    syncPaletteCountsFromLayers(next.layers);
    const nextH = next.layers[0]?.grid.length ?? 0;
    const nextW = nextH > 0 ? next.layers[0].grid[0]?.length ?? 0 : 0;
    if (nextW > 0 && nextH > 0 && (nextW !== latestConfigRef.current.width || nextH !== latestConfigRef.current.height)) {
      const updatedCfg = { ...latestConfigRef.current, width: nextW, height: nextH };
      latestConfigRef.current = updatedCfg;
      setConfig(updatedCfg);
      setAspectRatio(nextW / nextH);
    }
  }, [gridFuture, applyLayerState, syncPaletteCountsFromLayers]);

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === '[') {
        e.preventDefault();
        setIsLeftPanelOpen((prev) => !prev);
      } else if (e.key === ']') {
        e.preventDefault();
        setIsRightPanelOpen((prev) => !prev);
      } else if (e.key === '\\') {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Open inspect lightbox
  const handleOpenInspect = (url: string, title?: string, prompt?: string, styleName?: string) => {
    if (!url) return;
    setInspectData({ url, title, prompt, styleName });
    setInspectModalOpen(true);
  };

  // Direct pipeline to apply a new image and build the grid
  const applyImageAndProcess = useCallback((
    img: HTMLImageElement,
    dataUrl: string,
    sampleId = '',
    targetConfig = latestConfigRef.current
  ) => {
    const aspect = img.width / img.height;
    setAspectRatio(aspect);
    setSourceImage(img);
    sourceImageRef.current = img;
    setSourceImageDataUrl(dataUrl);
    setSampleImageId(sampleId);
    setRemixedFrom(null);

    let activeConfig = { ...targetConfig };
    let targetWidth = activeConfig.width;
    let targetHeight = activeConfig.height;

    if (activeConfig.lockAspectRatio) {
      targetHeight = Math.max(8, Math.min(160, Math.round(targetWidth / aspect)));
      activeConfig = { ...activeConfig, height: targetHeight };
    }

    latestConfigRef.current = activeConfig;
    setConfig(activeConfig);

    // Detect transparency in loaded image
    const checkCanvas = document.createElement('canvas');
    checkCanvas.width = Math.min(100, img.width);
    checkCanvas.height = Math.min(100, img.height);
    const checkCtx = checkCanvas.getContext('2d');
    let detectedTransparency = false;
    if (checkCtx) {
      checkCtx.drawImage(img, 0, 0, checkCanvas.width, checkCanvas.height);
      const checkData = checkCtx.getImageData(0, 0, checkCanvas.width, checkCanvas.height).data;
      for (let i = 3; i < checkData.length; i += 4) {
        if (checkData[i] < 240) {
          detectedTransparency = true;
          break;
        }
      }
    }
    setHasTransparency(detectedTransparency);

    const tempCanvas = document.createElement('canvas');
    const maxDimension = 300;
    let sampleW = img.width;
    let sampleH = img.height;

    if (sampleW > maxDimension || sampleH > maxDimension) {
      if (sampleW > sampleH) {
        sampleH = Math.round((sampleH * maxDimension) / sampleW);
        sampleW = maxDimension;
      } else {
        sampleW = Math.round((sampleW * maxDimension) / sampleH);
        sampleH = maxDimension;
      }
    }

    tempCanvas.width = sampleW;
    tempCanvas.height = sampleH;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Fill background for transparent PNGs so black details never disappear into black void
    const transparentMode = activeConfig.transparentMode || 'white';
    if (transparentMode === 'white') {
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, sampleW, sampleH);
    } else if (transparentMode === 'dark') {
      tempCtx.fillStyle = '#000000';
      tempCtx.fillRect(0, 0, sampleW, sampleH);
    } else if (transparentMode === 'custom' && activeConfig.transparentCustomColor) {
      tempCtx.fillStyle = activeConfig.transparentCustomColor;
      tempCtx.fillRect(0, 0, sampleW, sampleH);
    }
    // If 'empty', leave transparent!

    tempCtx.drawImage(img, 0, 0, sampleW, sampleH);
    const imgData = tempCtx.getImageData(0, 0, sampleW, sampleH);

    const stashCodes = useMyStashOnlyRef.current
      ? getMyStash(activeConfig.craftStandard === 'perler' ? 'Perler' : 'DMC')
      : undefined;

    // Extract palette using vibrant aesthetic algorithm
    const newPalette = extractBeautifulPalette(
      imgData,
      activeConfig.colorsCount,
      activeConfig.extractionMode,
      activeConfig.craftStandard,
      [],
      stashCodes
    );

    // Quantize onto craft grid
    const { gridData: newGrid, paletteWithCounts } = processImageToGrid(
      img,
      targetWidth,
      targetHeight,
      newPalette,
      activeConfig
    );

    setPalette(paletteWithCounts);
    paletteRef.current = paletteWithCounts;
    setSingleLayerGrid(newGrid, 'Layer 1');
    setCompletedCells({});
    setGridHistory([]);
    setGridFuture([]);
  }, [setSingleLayerGrid]);

  // Load saved state on mount (restores on page refresh)
  useEffect(() => {
    const restoreState = async () => {
      try {
        if (window.location.hash && window.location.hash.includes('pattern=')) {
          const shared = decodePatternFromHash(window.location.hash);
          if (shared) {
            setConfig({
              ...DEFAULT_CONFIG,
              craftType: shared.craftType,
              width: shared.width,
              height: shared.height,
            });
            setSingleLayerGrid(shared.gridData, shared.title || 'Layer 1');
            setPalette(shared.palette);
            paletteRef.current = shared.palette;
            setToastMessage(`Loaded shared pattern: "${shared.title || 'Shared Pattern'}"`);
            setTimeout(() => setToastMessage(null), 3500);
            setIsInitialLoaded(true);
            return;
          }
        }

        const pendingProject = consumePendingStudioProject();
        if (pendingProject) {
          setConfig(pendingProject.gridConfig);
          latestConfigRef.current = pendingProject.gridConfig;
          const restoredPending = normalizeLayersForGrid(
            pendingProject.layers,
            pendingProject.activeLayerId,
            pendingProject.gridData
          );
          applyLayerState(restoredPending.layers, restoredPending.activeLayerId);
          setPalette(pendingProject.palette);
          paletteRef.current = pendingProject.palette;
          setCompletedCells(pendingProject.completedCells || {});
          setBackstitches(pendingProject.backstitches || []);
          setGridHistory([]);
          setGridFuture([]);
          setRemixedFrom(null);
          setToastMessage(`📂 Opened "${pendingProject.name}" in Studio!`);
          setTimeout(() => setToastMessage(null), 3500);
          setIsInitialLoaded(true);
          return;
        }

        const saved = await loadAppState();
        if (saved) {
          const route = getRouteByPath(location.pathname);
          const initialCraft = route ? route.craftType : (saved.config?.craftType || DEFAULT_CONFIG.craftType);
          setConfig({
            ...(saved.config || DEFAULT_CONFIG),
            craftType: initialCraft,
          });
          if (saved.palette && saved.palette.length > 0) {
            setPalette(saved.palette);
            paletteRef.current = saved.palette;
          }
          const restoredSaved = normalizeLayersForGrid(
            saved.layers,
            saved.activeLayerId,
            saved.gridData || []
          );
          if (restoredSaved.layers.length > 0) {
            applyLayerState(restoredSaved.layers, restoredSaved.activeLayerId);
          }
          setCompletedCells(saved.completedCells || {});
          setSpotlightColorId(saved.spotlightColorId || null);
          setActiveColorIndex(saved.activeColorIndex || 0);
          setLastAiPrompt(saved.lastAiPrompt || '');
          setLastAiStyle(saved.lastAiStyle || 'pixel-art');
          if (saved.aiHistory) {
            setAiHistory(saved.aiHistory);
          }
          if (saved.uploadHistory) {
            setUploadHistory(saved.uploadHistory);
          }

          if (saved.sourceImageDataUrl) {
            setSourceImageDataUrl(saved.sourceImageDataUrl);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              setAspectRatio(img.width / img.height);
              setSourceImage(img);
              setIsInitialLoaded(true);
            };
            img.onerror = () => {
              loadInitialDefault();
            };
            img.src = saved.sourceImageDataUrl;
            return;
          } else if (saved.sampleImageId) {
            const found = SAMPLE_IMAGES.find((s) => s.id === saved.sampleImageId) || SAMPLE_IMAGES[0];
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              setAspectRatio(img.width / img.height);
              setSourceImage(img);
              setSourceImageDataUrl(found.url);
              setSampleImageId(found.id);
              setIsInitialLoaded(true);
            };
            img.src = found.url;
            return;
          }
        }
      } catch (e) {
        console.warn('Could not restore saved app state:', e);
      }

      loadInitialDefault();
    };

    const loadInitialDefault = () => {
      const defaultSample = SAMPLE_IMAGES[0];
      const route = getRouteByPath(location.pathname);
      const initialCfg = route ? { ...DEFAULT_CONFIG, craftType: route.craftType } : DEFAULT_CONFIG;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        applyImageAndProcess(img, defaultSample.url, defaultSample.id, initialCfg);
        setIsInitialLoaded(true);
      };
      img.src = defaultSample.url;
    };

    restoreState();
  }, []);

  // Refresh saved projects vault count
  const refreshVaultCount = useCallback(async () => {
    try {
      const list = await getAllVaultProjects();
      setVaultProjectsCount(list.length);
    } catch (err) {
      console.warn('Vault count check:', err);
    }
  }, []);

  useEffect(() => {
    refreshVaultCount();
  }, [refreshVaultCount]);

  // Synchronize browser URL route with active craft and dynamic SEO metadata
  useEffect(() => {
    const cleanPath = location.pathname.replace(/\/+$/, '') || '/';
    const route = getRouteByPath(cleanPath);
    const calcRoute = getCalculatorRoute(cleanPath);
    const colorChartRoute = getColorChartRoute(cleanPath);
    const patternRouteInfo = getPatternRouteInfo(cleanPath);
    const sharedPatternId = getSharedPatternRouteId(cleanPath);

    if (route) {
      if (latestConfigRef.current.craftType !== route.craftType) {
        const next = { ...latestConfigRef.current, craftType: route.craftType };
        latestConfigRef.current = next;
        setConfig(next);
      }
      setActivePatternSlug(null);
      setActiveSharedPatternId(null);
      setIsColorChartOpen(false);
      setIsStarterGalleryOpen(false);
      setIsCalculatorsOpen(false);
      updateDocumentMeta(route, null);
    } else if (calcRoute) {
      setIsCalculatorsOpen(true);
      setActivePatternSlug(null);
      setActiveSharedPatternId(null);
      setIsColorChartOpen(false);
      setIsStarterGalleryOpen(false);
      if (cleanPath === '/calculators/floss-estimator') {
        setCalculatorInitialTab('floss');
      } else if (cleanPath === '/calculators/bead-converter') {
        setCalculatorInitialTab('beads');
      } else if (cleanPath === '/calculators/c2c-blanket-size') {
        setCalculatorInitialTab('c2c');
      }
      updateDocumentMeta(calcRoute, null);
    } else if (colorChartRoute) {
      if (cleanPath === '/color-chart/dmc-to-anchor') {
        setColorChartInitialTab('dmc-anchor');
      } else if (cleanPath === '/color-chart/perler-bead-colors') {
        setColorChartInitialTab('perler');
      } else if (cleanPath === '/color-chart/miyuki-delica') {
        setColorChartInitialTab('miyuki');
      } else {
        setColorChartInitialTab('hex-matcher');
      }
      setIsColorChartOpen(true);
      setIsStarterGalleryOpen(false);
      setActivePatternSlug(null);
      setActiveSharedPatternId(null);
      setIsCalculatorsOpen(false);
      updateDocumentMeta(colorChartRoute, {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: colorChartRoute.metaTitle,
        description: colorChartRoute.metaDescription,
        url: colorChartRoute.canonicalUrl,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      });
    } else if (patternRouteInfo) {
      const { pattern, meta } = patternRouteInfo;
      setActivePatternSlug(pattern.slug);
      setActiveSharedPatternId(null);
      setIsStarterGalleryOpen(false);
      setIsColorChartOpen(false);
      setIsCalculatorsOpen(false);
      updateDocumentMeta(meta, {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CreativeWork',
            name: pattern.name,
            description: meta.metaDescription,
            url: meta.canonicalUrl,
            keywords: pattern.tags.join(', '),
            genre: pattern.category,
            isAccessibleForFree: true,
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.pixel-craft-studio.com/' },
              { '@type': 'ListItem', position: 2, name: 'Pattern Showcase', item: 'https://www.pixel-craft-studio.com/gallery' },
              { '@type': 'ListItem', position: 3, name: pattern.name, item: meta.canonicalUrl },
            ],
          },
        ],
      });
    } else if (cleanPath.startsWith('/patterns/')) {
      navigate('/gallery', { replace: true });
    } else if (sharedPatternId) {
      setActiveSharedPatternId(sharedPatternId);
      setActivePatternSlug(null);
      setIsStarterGalleryOpen(false);
      setIsColorChartOpen(false);
      setIsCalculatorsOpen(false);
      updateDocumentMeta(buildSharedPatternMeta(sharedPatternId), null);
    } else if (cleanPath === '/gallery') {
      setIsStarterGalleryOpen(true);
      setActivePatternSlug(null);
      setActiveSharedPatternId(null);
      setIsColorChartOpen(false);
      setIsCalculatorsOpen(false);
      updateDocumentMeta(GALLERY_ROUTE, null);
    } else {
      setActivePatternSlug(null);
      setActiveSharedPatternId(null);
      setIsColorChartOpen(false);
      setIsCalculatorsOpen(false);
      updateDocumentMeta(null, null);
    }
  }, [location.pathname, navigate]);

  // Save state continuously (debounced auto-save)
  useEffect(() => {
    if (!isInitialLoaded || gridData.length === 0) return;

    setIsAutoSaving(true);
    const timer = setTimeout(async () => {
      try {
        await saveAppState({
          version: 2,
          updatedAt: new Date().toISOString(),
          config,
          palette,
          gridData,
          layers,
          activeLayerId,
          completedCells,
          spotlightColorId,
          activeColorIndex,
          sourceImageDataUrl,
          sampleImageId,
          lastAiPrompt,
          lastAiStyle,
          aiHistory,
          backstitches,
        });
      } catch (err) {
        console.warn('Auto-save error:', err);
      } finally {
        setIsAutoSaving(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    isInitialLoaded,
    config,
    palette,
    gridData,
    layers,
    activeLayerId,
    completedCells,
    spotlightColorId,
    activeColorIndex,
    sourceImageDataUrl,
    sampleImageId,
    lastAiPrompt,
    lastAiStyle,
    aiHistory,
    backstitches,
  ]);

  // Synchronous beforeunload backup save
  useEffect(() => {
    const handleBeforeUnload = () => {
      const cur = currentStateRef.current;
      if (cur.gridData.length > 0) {
        saveAppState({
          version: 1,
          updatedAt: new Date().toISOString(),
          ...cur,
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleSelectSample = (
    sample: SampleImage,
    targetCraft?: CraftType,
    gridSize?: { width: number; height: number },
    colorsCount?: number
  ) => {
    let nextConfig = { ...latestConfigRef.current };
    if (targetCraft && targetCraft !== nextConfig.craftType) {
      nextConfig.craftType = targetCraft;
      navigate(getPathForCraft(targetCraft), { replace: true });
    }
    if (gridSize) {
      nextConfig.width = gridSize.width;
      nextConfig.height = gridSize.height;
    }
    if (colorsCount) {
      nextConfig.colorsCount = colorsCount;
    }
    latestConfigRef.current = nextConfig;
    setConfig(nextConfig);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      applyImageAndProcess(img, sample.url, sample.id, nextConfig);
    };
    img.src = sample.url;
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  const handleUploadFile = useCallback((file: File, customName?: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        applyImageAndProcess(img, dataUrl, '');
        const newItem: UploadHistoryItem = {
          id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: customName || file.name,
          dataUrl,
          timestamp: Date.now(),
          width: img.width,
          height: img.height,
        };
        setUploadHistory((prev) => [newItem, ...prev.filter((p) => p.dataUrl !== dataUrl)].slice(0, 25));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [applyImageAndProcess]);

  // Global clipboard Paste (Ctrl+V / Cmd+V) support
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // 1. Check for image files in clipboardData.items or clipboardData.files
      let imageFile: File | null = null;

      if (clipboardData.items && clipboardData.items.length > 0) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.type.startsWith('image/')) {
            imageFile = item.getAsFile();
            break;
          }
        }
      }

      if (!imageFile && clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (file.type.startsWith('image/')) {
            imageFile = file;
            break;
          }
        }
      }

      if (imageFile) {
        e.preventDefault();
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const customName =
          !imageFile.name || imageFile.name === 'image.png' || imageFile.name === 'blob'
            ? `Pasted Image (${timeStr})`
            : imageFile.name;
        handleUploadFile(imageFile, customName);
        showToast('📋 Pasted image imported!');
        return;
      }

      // 2. If not actively typing in an input field, check if clipboard contains an image URL or data URL
      if (!isInputFocused) {
        const text = clipboardData.getData('text/plain')?.trim();
        if (text) {
          const isDataUrl = text.startsWith('data:image/');
          const isImageUrl = /\.(png|jpe?g|webp|svg|gif)(\?.*)?$/i.test(text);

          if (isDataUrl || isImageUrl) {
            e.preventDefault();
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              applyImageAndProcess(img, text, '');
              const newItem: UploadHistoryItem = {
                id: `paste-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: `Pasted Image (${timeStr})`,
                dataUrl: text,
                timestamp: Date.now(),
                width: img.width,
                height: img.height,
              };
              setUploadHistory((prev) => [newItem, ...prev.filter((p) => p.dataUrl !== text)].slice(0, 25));
              showToast('📋 Pasted image URL imported!');
            };
            img.src = text;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [handleUploadFile, applyImageAndProcess, showToast]);

  const handleOpenCropModal = () => {
    const currentUrl = sourceImageDataUrl || sourceImage?.src;
    if (currentUrl) {
      setCropImageUrl(currentUrl);
      setIsCropModalOpen(true);
    }
  };

  const handleApplyCrop = (croppedDataUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      applyImageAndProcess(img, croppedDataUrl, '');
      const newItem: UploadHistoryItem = {
        id: `crop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `Cropped Image`,
        dataUrl: croppedDataUrl,
        timestamp: Date.now(),
        width: img.width,
        height: img.height,
      };
      setUploadHistory((prev) => [newItem, ...prev.filter((p) => p.dataUrl !== croppedDataUrl)].slice(0, 25));
    };
    img.src = croppedDataUrl;
  };

  const handleApplyBgCutout = (cutoutDataUrl: string) => {
    const nextConfig: GridConfig = {
      ...latestConfigRef.current,
      transparentMode: 'empty',
    };
    latestConfigRef.current = nextConfig;
    setConfig(nextConfig);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      applyImageAndProcess(img, cutoutDataUrl, '', nextConfig);
      const newItem: UploadHistoryItem = {
        id: `cutout-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `Subject Cutout (No BG)`,
        dataUrl: cutoutDataUrl,
        timestamp: Date.now(),
        width: img.width,
        height: img.height,
      };
      setUploadHistory((prev) => [newItem, ...prev.filter((p) => p.dataUrl !== cutoutDataUrl)].slice(0, 25));
      showToast('✂️ Background removed! Empty cells are skipped automatically.');
    };
    img.src = cutoutDataUrl;
  };

  const handleSelectUploadItem = (item: UploadHistoryItem) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      applyImageAndProcess(img, item.dataUrl, '');
    };
    img.src = item.dataUrl;
  };

  const handleDeleteUploadItem = (id: string) => {
    setUploadHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllUploadHistory = () => {
    setUploadHistory([]);
  };

  const handleOpenCropForImage = (url: string) => {
    setCropImageUrl(url);
    setIsCropModalOpen(true);
  };

  // Turn into Pixel Craft Grid from AI Generator
  const handleAiImageGenerated = (dataUrl: string, promptUsed: string, styleUsed: string) => {
    setLastAiPrompt(promptUsed);
    setLastAiStyle(styleUsed);

    // Save to AI Generation History
    const historyItem: AiHistoryItem = {
      id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      prompt: promptUsed,
      styleId: styleUsed,
      dataUrl,
      createdAt: new Date().toISOString(),
    };
    setAiHistory((prev) => [historyItem, ...prev.filter((p) => p.dataUrl !== dataUrl)].slice(0, 40));

    // Instantly load image and turn into pixel craft grid!
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      applyImageAndProcess(img, dataUrl, '');
    };
    img.src = dataUrl;
  };

  const handleSelectHistoryImage = (item: AiHistoryItem) => {
    setLastAiPrompt(item.prompt);
    setLastAiStyle(item.styleId);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      applyImageAndProcess(img, item.dataUrl, '');
    };
    img.src = item.dataUrl;
  };

  const handleDeleteHistoryItem = (id: string) => {
    setAiHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all AI picture generation history?')) {
      setAiHistory([]);
    }
  };

  // Create New Blank Canvas (Pixel Art Studio)
  const handleCreateBlankCanvas = useCallback(({
    width,
    height,
    background,
    palettePresetId,
    craftType,
  }: {
    width: number;
    height: number;
    background: 'transparent' | 'white' | 'dark';
    palettePresetId: string;
    craftType: any;
  }) => {
    // 1. Get or create palette
    let startingPalette: PaletteColor[];
    if (palettePresetId === 'current' && palette.length > 0) {
      startingPalette = [...palette];
    } else {
      startingPalette = createPaletteFromPreset(palettePresetId);
    }

    // 2. Generate blank grid
    const { gridData: newGrid, palette: updatedPalette, initialActiveColor } = createBlankCanvasGrid(
      width,
      height,
      background,
      startingPalette
    );

    // 3. Generate a 1:1 preview data URL for sourceImageDataUrl
    const previewDataUrl = generateCanvasDataUrl(newGrid, updatedPalette);

    const newConfig: GridConfig = {
      ...latestConfigRef.current,
      width,
      height,
      craftType,
      craftStandard: palettePresetId === 'perler' ? 'perler' : palettePresetId === 'dmc' ? 'dmc' : 'custom',
    };

    latestConfigRef.current = newConfig;
    setConfig(newConfig);
    setSingleLayerGrid(newGrid, 'Layer 1');
    setPalette(updatedPalette);
    paletteRef.current = updatedPalette;
    setActiveColorIndex(initialActiveColor);
    setCompletedCells({});
    setSpotlightColorId(null);
    setGridHistory([]);
    setGridFuture([]);
    setRemixedFrom(null);

    if (previewDataUrl) {
      setSourceImageDataUrl(previewDataUrl);
      const img = new Image();
      img.onload = () => {
        setSourceImage(img);
        sourceImageRef.current = img;
        setAspectRatio(width / height);
      };
      img.src = previewDataUrl;
    }

    showToast(`🎨 New ${width}×${height} canvas ready to draw!`);
  }, [palette, setSingleLayerGrid, showToast]);

  // Add custom color to palette while drawing
  const handleAddCustomColor = useCallback((hex: string) => {
    const clean = hex.replace('#', '').toUpperCase();
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);

    const newColor: PaletteColor = {
      id: `palette-custom-${Date.now().toString(36)}`,
      hex: `#${clean}`,
      r,
      g,
      b,
      symbol: getCraftSymbol(palette.length),
      count: 0,
      percentage: 0,
      name: `Custom #${clean}`,
      code: `#${clean}`,
      brand: 'Custom',
      isLocked: false,
    };

    setPalette((prev) => {
      const next = [...prev, newColor];
      paletteRef.current = next;
      return next;
    });
    setActiveColorIndex(palette.length);
    showToast(`✨ Added color #${clean} to palette!`);
  }, [palette.length, showToast]);

  // Clean confetti colors (<1% stitches) into their nearest CIELAB neighbor
  const handleCleanConfetti = useCallback(() => {
    if (gridData.length === 0 || palette.length <= 1) return;

    handleBeforePencilStroke();

    const result = cleanConfettiColors(gridData, palette, 1.0);
    if (result.removedCount > 0) {
      const remap = inferColorIndexRemap(gridData, result.newGrid, palette, result.newPalette);
      const remappedLayers = remapLayersColorIndices(
        layersRef.current,
        (idx) => remap[idx] ?? 0
      );
      applyLayerState(remappedLayers, activeLayerIdRef.current);
      syncPaletteCountsFromLayers(remappedLayers, result.newPalette);
      if (activeColorIndex >= result.newPalette.length) {
        setActiveColorIndex(0);
      }
      showToast(`🧹 Merged ${result.removedCount} confetti color${result.removedCount > 1 ? 's' : ''}!`);
    }
  }, [
    gridData,
    palette,
    activeColorIndex,
    handleBeforePencilStroke,
    applyLayerState,
    syncPaletteCountsFromLayers,
    showToast,
  ]);

  // Re-run color extraction and grid quantization on existing image
  const reprocessCurrentImage = useCallback((targetConfig?: GridConfig) => {
    const img = sourceImageRef.current;
    if (!img) return;

    const activeConfig = targetConfig || latestConfigRef.current;

    // Detect transparency in loaded image
    const checkCanvas = document.createElement('canvas');
    checkCanvas.width = Math.min(100, img.width);
    checkCanvas.height = Math.min(100, img.height);
    const checkCtx = checkCanvas.getContext('2d');
    let detectedTransparency = false;
    if (checkCtx) {
      checkCtx.drawImage(img, 0, 0, checkCanvas.width, checkCanvas.height);
      const checkData = checkCtx.getImageData(0, 0, checkCanvas.width, checkCanvas.height).data;
      for (let i = 3; i < checkData.length; i += 4) {
        if (checkData[i] < 240) {
          detectedTransparency = true;
          break;
        }
      }
    }
    setHasTransparency(detectedTransparency);

    const tempCanvas = document.createElement('canvas');
    const maxDimension = 300;
    let sampleW = img.width;
    let sampleH = img.height;

    if (sampleW > maxDimension || sampleH > maxDimension) {
      if (sampleW > sampleH) {
        sampleH = Math.round((sampleH * maxDimension) / sampleW);
        sampleW = maxDimension;
      } else {
        sampleW = Math.round((sampleW * maxDimension) / sampleH);
        sampleH = maxDimension;
      }
    }

    tempCanvas.width = sampleW;
    tempCanvas.height = sampleH;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Fill background for transparent PNGs so black details never disappear into black void
    const transparentMode = activeConfig.transparentMode || 'white';
    if (transparentMode === 'white') {
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, sampleW, sampleH);
    } else if (transparentMode === 'dark') {
      tempCtx.fillStyle = '#000000';
      tempCtx.fillRect(0, 0, sampleW, sampleH);
    } else if (transparentMode === 'custom' && activeConfig.transparentCustomColor) {
      tempCtx.fillStyle = activeConfig.transparentCustomColor;
      tempCtx.fillRect(0, 0, sampleW, sampleH);
    }
    // If 'empty', leave transparent!

    tempCtx.drawImage(img, 0, 0, sampleW, sampleH);
    const imgData = tempCtx.getImageData(0, 0, sampleW, sampleH);

    const locked = paletteRef.current.filter((c) => c.isLocked);
    const stashCodes = useMyStashOnlyRef.current
      ? getMyStash(activeConfig.craftStandard === 'perler' ? 'Perler' : 'DMC')
      : undefined;

    const newPalette = extractBeautifulPalette(
      imgData,
      activeConfig.colorsCount,
      activeConfig.extractionMode,
      activeConfig.craftStandard,
      locked,
      stashCodes
    );

    const { gridData: newGrid, paletteWithCounts } = processImageToGrid(
      img,
      activeConfig.width,
      activeConfig.height,
      newPalette,
      activeConfig
    );

    setPalette(paletteWithCounts);
    paletteRef.current = paletteWithCounts;
    setSingleLayerGrid(newGrid, 'Layer 1');
  }, [setSingleLayerGrid]);

  // Update Config Helper
  const handleUpdateConfig = useCallback((newConfig: Partial<GridConfig>) => {
    if (newConfig.craftType && newConfig.craftType !== latestConfigRef.current.craftType) {
      const targetPath = getPathForCraft(newConfig.craftType);
      if (window.location.pathname !== targetPath) {
        navigate(targetPath);
      }
    }

    const next = { ...latestConfigRef.current, ...newConfig };
    latestConfigRef.current = next;
    setConfig(next);

    const needsReprocess = 
      newConfig.width !== undefined ||
      newConfig.height !== undefined ||
      newConfig.colorsCount !== undefined ||
      newConfig.extractionMode !== undefined ||
      newConfig.craftStandard !== undefined ||
      newConfig.transparentMode !== undefined ||
      newConfig.transparentCustomColor !== undefined ||
      newConfig.dither !== undefined ||
      newConfig.brightness !== undefined ||
      newConfig.contrast !== undefined ||
      newConfig.saturation !== undefined;

    if (needsReprocess && sourceImageRef.current) {
      if (reprocessTimerRef.current) {
        clearTimeout(reprocessTimerRef.current);
      }
      reprocessTimerRef.current = setTimeout(() => {
        reprocessCurrentImage(next);
      }, 35);
    }
  }, [reprocessCurrentImage, navigate]);

  const warnActiveLayerBlocked = useCallback((layer: CanvasLayer) => {
    const now = Date.now();
    if (now - lastLayerGuardToastRef.current < 1500) return;
    lastLayerGuardToastRef.current = now;
    if (layer.locked) {
      showToast(`🔒 "${layer.name}" is locked — unlock it in the Layers tab to edit.`);
    } else if (!layer.visible) {
      showToast(`👁️ "${layer.name}" is hidden — unhide it in the Layers tab to edit.`);
    }
  }, [showToast]);

  // Handle Stamping Pixel Text onto dedicated "Text" layer (or active empty layer)
  const handleStampText = useCallback((textMatrix: number[][], colorIndex: number, startX: number, startY: number) => {
    const currentLayers = layersRef.current;
    if (currentLayers.length === 0) return;
    const h = currentLayers[0].grid.length;
    const w = h > 0 ? currentLayers[0].grid[0]?.length ?? 0 : 0;
    if (w === 0 || h === 0) return;

    handleBeforePencilStroke();

    const sparseTextGrid = createEmptyLayerGrid(w, h);
    for (let r = 0; r < textMatrix.length; r++) {
      for (let c = 0; c < textMatrix[r].length; c++) {
        if (textMatrix[r][c] === 1) {
          const y = startY + r;
          const x = startX + c;
          if (y >= 0 && y < h && x >= 0 && x < w) {
            sparseTextGrid[y][x] = colorIndex;
          }
        }
      }
    }

    const activeIdx = currentLayers.findIndex((l) => l.id === activeLayerIdRef.current);
    const activeLayer = activeIdx >= 0 ? currentLayers[activeIdx] : undefined;

    if (
      activeLayer &&
      activeLayer.visible &&
      !activeLayer.locked &&
      countLayerFilledCells(activeLayer.grid) === 0
    ) {
      const nextLayers = cloneLayers(currentLayers);
      const renamed = /^Layer\s+\d+$/i.test(activeLayer.name)
        ? getUniqueLayerName(currentLayers, 'Text')
        : activeLayer.name;
      nextLayers[activeIdx] = {
        ...nextLayers[activeIdx],
        name: renamed,
        grid: sparseTextGrid,
      };
      applyLayerState(nextLayers, activeLayer.id);
      syncPaletteCountsFromLayers(nextLayers);
      showToast(`✨ Stamped pixel text onto "${renamed}" layer!`);
      return;
    }

    if (currentLayers.length < MAX_LAYERS) {
      const textName = getUniqueLayerName(currentLayers, 'Text');
      const newLayer = createLayer(textName, sparseTextGrid);
      const nextLayers = [...cloneLayers(currentLayers), newLayer];
      applyLayerState(nextLayers, newLayer.id);
      syncPaletteCountsFromLayers(nextLayers);
      showToast(`✨ Stamped pixel text onto new "${textName}" layer!`);
      return;
    }

    // Fallback at MAX_LAYERS limit: stamp into active or topmost unlocked layer
    const targetIdx =
      activeLayer && !activeLayer.locked && activeLayer.visible
        ? activeIdx
        : currentLayers.findIndex((l) => !l.locked && l.visible);
    if (targetIdx === -1) {
      showToast('🔒 All layers are locked or hidden — unlock a layer first!');
      return;
    }
    const nextLayers = cloneLayers(currentLayers);
    const targetGrid = nextLayers[targetIdx].grid;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (sparseTextGrid[y][x] !== -1) {
          targetGrid[y][x] = sparseTextGrid[y][x];
        }
      }
    }
    applyLayerState(nextLayers, nextLayers[targetIdx].id);
    syncPaletteCountsFromLayers(nextLayers);
    showToast(`Stamped pixel text onto "${nextLayers[targetIdx].name}"! ✨`);
  }, [handleBeforePencilStroke, applyLayerState, syncPaletteCountsFromLayers, showToast]);

  // Handle Creating New Canvas from Pixel Text
  const handleCreateNewFromText = useCallback((width: number, height: number, textMatrix: number[][], colorIndex: number) => {
    handleBeforePencilStroke();
    const newGrid: number[][] = Array.from({ length: height }, () => new Array(width).fill(0));
    const startX = Math.floor((width - textMatrix[0].length) / 2);
    const startY = Math.floor((height - textMatrix.length) / 2);
    for (let r = 0; r < textMatrix.length; r++) {
      for (let c = 0; c < textMatrix[r].length; c++) {
        if (textMatrix[r][c] === 1) {
          newGrid[startY + r][startX + c] = colorIndex;
        }
      }
    }
    handleUpdateConfig({ width, height });
    const stack = createSingleLayerStack(newGrid, 'Text');
    applyLayerState(stack.layers, stack.activeLayerId);
    syncPaletteCountsFromLayers(stack.layers);
    setCompletedCells({});
    showToast(`Created new text canvas (${width}×${height}) ✨`);
  }, [handleBeforePencilStroke, handleUpdateConfig, applyLayerState, syncPaletteCountsFromLayers, showToast]);

  // Handle Stash Restriction Toggle
  const handleToggleMyStashOnly = useCallback((enabled: boolean) => {
    setUseMyStashOnly(enabled);
    useMyStashOnlyRef.current = enabled;
    if (sourceImageRef.current) {
      reprocessCurrentImage();
    }
    showToast(enabled ? 'Matching strictly to your physical stash!' : 'Standard color catalog active');
  }, [reprocessCurrentImage, showToast]);

  // Cell Interaction Handlers
  const handleToggleCellCompleted = (x: number, y: number) => {
    const key = `${x},${y}`;
    setCompletedCells((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const handleBatchSetCellsCompleted = useCallback((updates: { x: number; y: number; completed: boolean }[]) => {
    if (updates.length === 0) return;
    setCompletedCells((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const { x, y, completed } of updates) {
        const key = `${x},${y}`;
        if (completed && !next[key]) {
          next[key] = true;
          changed = true;
        } else if (!completed && next[key]) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const handlePaintCell = useCallback((x: number, y: number, colorIndex: number) => {
    const currentLayers = layersRef.current;
    if (currentLayers.length === 0) return;
    const activeIdx = currentLayers.findIndex((l) => l.id === activeLayerIdRef.current);
    const targetIdx = activeIdx >= 0 ? activeIdx : currentLayers.length - 1;
    const activeLayer = currentLayers[targetIdx];
    if (!activeLayer) return;

    if (activeLayer.locked || !activeLayer.visible) {
      warnActiveLayerBlocked(activeLayer);
      return;
    }

    const grid = activeLayer.grid;
    if (y < 0 || y >= grid.length || x < 0 || x >= (grid[0]?.length ?? 0)) return;
    if (grid[y][x] === colorIndex) return;

    const nextGrid = cloneGrid(grid);
    nextGrid[y][x] = colorIndex;
    const nextLayers = currentLayers.map((l, idx) =>
      idx === targetIdx ? { ...l, grid: nextGrid } : l
    );
    applyLayerState(nextLayers, activeLayer.id);
    syncPaletteCountsFromLayers(nextLayers);
  }, [applyLayerState, syncPaletteCountsFromLayers, warnActiveLayerBlocked]);

  const handleBatchPaintCells = useCallback((updates: { x: number; y: number; colorIndex: number }[]) => {
    if (updates.length === 0) return;
    const currentLayers = layersRef.current;
    if (currentLayers.length === 0) return;
    const activeIdx = currentLayers.findIndex((l) => l.id === activeLayerIdRef.current);
    const targetIdx = activeIdx >= 0 ? activeIdx : currentLayers.length - 1;
    const activeLayer = currentLayers[targetIdx];
    if (!activeLayer) return;

    if (activeLayer.locked || !activeLayer.visible) {
      warnActiveLayerBlocked(activeLayer);
      return;
    }

    const prevGrid = activeLayer.grid;
    if (prevGrid.length === 0) return;
    const height = prevGrid.length;
    const width = prevGrid[0]?.length ?? 0;

    let nextGrid: number[][] | null = null;
    let changed = false;
    for (const { x, y, colorIndex } of updates) {
      if (y >= 0 && y < height && x >= 0 && x < width) {
        if (prevGrid[y][x] !== colorIndex) {
          if (!nextGrid) {
            nextGrid = cloneGrid(prevGrid);
          }
          nextGrid[y][x] = colorIndex;
          changed = true;
        }
      }
    }

    if (changed && nextGrid) {
      const nextLayers = currentLayers.map((l, idx) =>
        idx === targetIdx ? { ...l, grid: nextGrid } : l
      );
      applyLayerState(nextLayers, activeLayer.id);
      syncPaletteCountsFromLayers(nextLayers);
    }
  }, [applyLayerState, syncPaletteCountsFromLayers, warnActiveLayerBlocked]);

  // Feature 1: Canvas / Layer Transforms (Auto-Center, Nudge, Flip, Rotate)
  const handleTransformGrid = useCallback(
    (
      newGrid: number[][],
      newCompletedCells?: CellProgress,
      newWidth?: number,
      newHeight?: number,
      meta?: { kind: 'rotate'; direction: 'cw' | 'ccw' } | { kind: 'same-size' }
    ) => {
      const currentLayers = layersRef.current;
      if (currentLayers.length === 0) return;

      let nextLayers: CanvasLayer[];
      if (meta?.kind === 'rotate') {
        // Rotate all layers together to keep grid dimensions synchronized
        nextLayers = currentLayers.map((layer) => ({
          ...layer,
          grid: rotateLayerGrid(layer.grid, meta.direction),
        }));
        applyLayerState(nextLayers, activeLayerIdRef.current);
        if (newCompletedCells !== undefined) {
          setCompletedCells(newCompletedCells);
        }
        if (newWidth && newHeight && (newWidth !== config.width || newHeight !== config.height)) {
          const updatedConfig = { ...config, width: newWidth, height: newHeight };
          setConfig(updatedConfig);
          latestConfigRef.current = updatedConfig;
          setAspectRatio(newWidth / newHeight);
        }
      } else {
        const activeIdx = currentLayers.findIndex((l) => l.id === activeLayerIdRef.current);
        const targetIdx = activeIdx >= 0 ? activeIdx : currentLayers.length - 1;
        const activeLayer = currentLayers[targetIdx];
        if (!activeLayer) return;

        if (activeLayer.locked || !activeLayer.visible) {
          warnActiveLayerBlocked(activeLayer);
          return;
        }

        nextLayers = currentLayers.map((l, idx) =>
          idx === targetIdx ? { ...l, grid: cloneGrid(newGrid) } : l
        );
        applyLayerState(nextLayers, activeLayer.id);
        if (newCompletedCells !== undefined && currentLayers.length <= 1) {
          setCompletedCells(newCompletedCells);
        }
      }

      const flatNext = flattenLayers(nextLayers);
      syncPaletteCountsFromLayers(nextLayers);
      const previewDataUrl = generateCanvasDataUrl(flatNext, paletteRef.current);
      if (previewDataUrl) {
        setSourceImageDataUrl(previewDataUrl);
        const img = new Image();
        img.onload = () => {
          setSourceImage(img);
          sourceImageRef.current = img;
        };
        img.src = previewDataUrl;
      }
      showToast(
        meta?.kind === 'rotate' || currentLayers.length <= 1
          ? '✨ Canvas transformed!'
          : `✨ Transformed "${currentLayers.find((l) => l.id === activeLayerIdRef.current)?.name || 'layer'}"!`
      );
    },
    [config, applyLayerState, syncPaletteCountsFromLayers, warnActiveLayerBlocked, showToast]
  );

  // Feature 2: Global Color Swap / Recolor Tool
  const handleSwapColor = useCallback(
    (sourceIndex: number, targetIndex: number) => {
      if (sourceIndex === targetIndex) return;
      handleBeforePencilStroke();
      const nextLayers = remapLayersColorIndices(layersRef.current, (cell) =>
        cell === sourceIndex ? targetIndex : cell
      );
      applyLayerState(nextLayers, activeLayerIdRef.current);
      syncPaletteCountsFromLayers(nextLayers);
      const sourceName = palette[sourceIndex]?.name || palette[sourceIndex]?.code || palette[sourceIndex]?.hex;
      const targetName = palette[targetIndex]?.name || palette[targetIndex]?.code || palette[targetIndex]?.hex;
      showToast(`🔄 Swapped all ${sourceName} stitches to ${targetName}!`);
    },
    [handleBeforePencilStroke, applyLayerState, syncPaletteCountsFromLayers, palette, showToast]
  );

  const handleSwapWithNewColor = useCallback(
    (sourceIndex: number, newHex: string) => {
      handleBeforePencilStroke();
      const rgb = hexToRgb(newHex) || { r: 0, g: 0, b: 0 };
      const newColor: PaletteColor = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        hex: newHex,
        r: rgb.r,
        g: rgb.g,
        b: rgb.b,
        symbol: getCraftSymbol(palette.length),
        count: 0,
        percentage: 0,
        name: 'Custom Swapped Color',
        code: newHex,
        brand: 'Custom',
      };
      const newPalette = [...palette, newColor];
      const targetIndex = newPalette.length - 1;
      const nextLayers = remapLayersColorIndices(layersRef.current, (cell) =>
        cell === sourceIndex ? targetIndex : cell
      );
      applyLayerState(nextLayers, activeLayerIdRef.current);
      syncPaletteCountsFromLayers(nextLayers, newPalette);
      showToast(`🎨 Recaptured stitches into new color ${newHex}!`);
    },
    [handleBeforePencilStroke, palette, applyLayerState, syncPaletteCountsFromLayers, showToast]
  );

  // Palette Handlers
  const handleToggleSpotlight = (colorId: string) => {
    setSpotlightColorId((prev) => (prev === colorId ? null : colorId));
  };

  const handleUpdateColorHex = (index: number, newHex: string) => {
    let updatedPalette: PaletteColor[] = [];
    setPalette((prev) => {
      const next = [...prev];
      if (next[index]) {
        const clean = newHex.replace('#', '');
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        next[index] = { ...next[index], hex: newHex, r, g, b, isLocked: true };
      }
      updatedPalette = next;
      paletteRef.current = next;
      return next;
    });

    const img = sourceImageRef.current;
    if (img && layersRef.current.length <= 1) {
      setTimeout(() => {
        if (layersRef.current.length > 1) return;
        const curConfig = latestConfigRef.current;
        const { gridData: newGrid, paletteWithCounts } = processImageToGrid(
          img,
          curConfig.width,
          curConfig.height,
          updatedPalette.length > 0 ? updatedPalette : paletteRef.current,
          curConfig
        );
        setSingleLayerGrid(newGrid, layersRef.current[0]?.name || 'Layer 1');
        setPalette(paletteWithCounts);
        paletteRef.current = paletteWithCounts;
      }, 30);
    }
  };

  const handleToggleLockColor = (index: number) => {
    setPalette((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], isLocked: !next[index].isLocked };
      }
      return next;
    });
  };

  const handleApplyPaletteMood = useCallback(
    (mood: PaletteMoodId) => {
      if (palette.length === 0 || gridData.length === 0) return;
      handleBeforePencilStroke();
      const { newPalette, newGrid } = applyPaletteMood(palette, gridData, mood, config.craftType);
      const remap = inferColorIndexRemap(gridData, newGrid, palette, newPalette);
      const nextLayers = remapLayersColorIndices(layersRef.current, (idx) => remap[idx] ?? 0);
      applyLayerState(nextLayers, activeLayerIdRef.current);
      syncPaletteCountsFromLayers(nextLayers, newPalette);
      showToast(`✨ Applied "${mood}" harmony to palette!`);
    },
    [
      palette,
      gridData,
      config.craftType,
      handleBeforePencilStroke,
      applyLayerState,
      syncPaletteCountsFromLayers,
      showToast,
    ]
  );

  const handleCrossConvertCraft = useCallback(
    (targetCraft: CraftType) => {
      if (palette.length === 0 || gridData.length === 0) {
        handleUpdateConfig({ craftType: targetCraft });
        return;
      }
      handleBeforePencilStroke();
      const { newGrid, newPalette, mergedCount } = convertPatternToCraft(gridData, palette, targetCraft);
      const remap = inferColorIndexRemap(gridData, newGrid, palette, newPalette);
      const nextLayers = remapLayersColorIndices(layersRef.current, (idx) => remap[idx] ?? 0);
      applyLayerState(nextLayers, activeLayerIdRef.current);
      syncPaletteCountsFromLayers(nextLayers, newPalette);
      const nextStandard =
        targetCraft === 'perler' ? 'perler' : targetCraft === 'pixel' ? 'custom' : 'dmc';
      handleUpdateConfig({ craftType: targetCraft, craftStandard: nextStandard });
      showToast(
        `🔄 Converted pattern to ${targetCraft.toUpperCase()} (${newPalette.length} colors${
          mergedCount > 0 ? `, ${mergedCount} merged` : ''
        })!`
      );
    },
    [
      palette,
      gridData,
      handleBeforePencilStroke,
      applyLayerState,
      syncPaletteCountsFromLayers,
      handleUpdateConfig,
      showToast,
    ]
  );

  const handleApplyPhotoPaletteToGrid = useCallback(
    (newPalette: PaletteColor[]) => {
      if (newPalette.length === 0 || gridData.length === 0) return;
      handleBeforePencilStroke();

      // Map old palette indices to nearest new palette indices via CIELAB
      const indexMapping: number[] = palette.map((oldCol) => {
        let closestIdx = 0;
        let minDistance = Infinity;
        const oldRgb = hexToRgb(oldCol.hex);
        const oldLab = rgbToLab(oldRgb.r, oldRgb.g, oldRgb.b);

        newPalette.forEach((newCol, newIdx) => {
          const newRgb = hexToRgb(newCol.hex);
          const newLab = rgbToLab(newRgb.r, newRgb.g, newRgb.b);
          const dist = deltaE(oldLab, newLab);
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = newIdx;
          }
        });
        return closestIdx;
      });

      const nextLayers = remapLayersColorIndices(layersRef.current, (idx) =>
        idx >= 0 && idx < indexMapping.length ? indexMapping[idx] : idx
      );
      applyLayerState(nextLayers, activeLayerIdRef.current);
      syncPaletteCountsFromLayers(nextLayers, newPalette);
      showToast(`✨ Remapped pattern to photo palette harmony!`);
    },
    [
      palette,
      gridData,
      handleBeforePencilStroke,
      applyLayerState,
      syncPaletteCountsFromLayers,
      showToast,
    ]
  );

  const handleSetPhotoPaletteOnly = useCallback(
    (newPalette: PaletteColor[]) => {
      setPalette(newPalette);
      paletteRef.current = newPalette;
      showToast(`🎨 Loaded ${newPalette.length} photo colors into your palette drawer!`);
    },
    [showToast]
  );

  const handleToggleShapeMask = useCallback(() => {
    const cycle: Record<CanvasShapeMask, CanvasShapeMask> = {
      none: 'round-hoop',
      'round-hoop': 'oval-hoop',
      'oval-hoop': 'heart',
      heart: 'none',
    };
    const next = cycle[config.shapeMask || 'none'];
    handleUpdateConfig({ shapeMask: next });
    showToast(
      `Hoop Mask: ${
        next === 'round-hoop'
          ? 'Round Hoop ⭕'
          : next === 'oval-hoop'
          ? 'Oval Frame ⬭'
          : next === 'heart'
          ? 'Heart Shape 💖'
          : 'OFF'
      }`
    );
  }, [config.shapeMask, handleUpdateConfig, showToast]);

  // WIP Time Tracker Handlers
  const completedCountNow = useMemo(
    () => Object.values(completedCells).filter(Boolean).length,
    [completedCells]
  );

  const handleUpdateWipStats = useCallback((next: WipStats) => {
    setWipStats(next);
    saveWipStats(next);
  }, []);

  const handleStartWipTimer = useCallback(() => {
    if (wipSessionSeconds === 0) {
      setWipSessionStartStitches(completedCountNow);
    }
    setIsWipTimerRunning(true);
  }, [wipSessionSeconds, completedCountNow]);

  const handlePauseWipTimer = useCallback(() => {
    setIsWipTimerRunning(false);
  }, []);

  const handleSaveAndResetWipTimer = useCallback(
    (note?: string) => {
      setIsWipTimerRunning(false);
      if (wipSessionSeconds <= 0) return;

      const stitchesCompleted = Math.max(0, completedCountNow - wipSessionStartStitches);
      const newLog: WipSessionLog = {
        id: `wip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        dateIso: new Date().toISOString(),
        durationSeconds: wipSessionSeconds,
        stitchesCompleted,
        note: note?.trim() || undefined,
      };

      const nextStats: WipStats = {
        ...wipStats,
        totalSeconds: wipStats.totalSeconds + wipSessionSeconds,
        sessions: [newLog, ...wipStats.sessions].slice(0, 60),
      };
      handleUpdateWipStats(nextStats);
      setWipSessionSeconds(0);
      setWipSessionStartStitches(completedCountNow);
      showToast(`⏱️ Saved WIP session (+${stitchesCompleted} stitches)!`);
    },
    [wipSessionSeconds, completedCountNow, wipSessionStartStitches, wipStats, handleUpdateWipStats, showToast]
  );

  // Decorative Border & Sampler Frame Builder Apply Handler (places border onto dedicated "Border" layer)
  const handleApplyFramedGrid = useCallback(
    (newGrid: number[][], newWidth: number, newHeight: number) => {
      const currentLayers = layersRef.current;
      if (currentLayers.length === 0) return;

      handleBeforePencilStroke();

      const dx = newWidth !== config.width ? Math.floor((newWidth - config.width) / 2) : 0;
      const dy = newHeight !== config.height ? Math.floor((newHeight - config.height) / 2) : 0;
      const beforeFlattened = flattenLayers(currentLayers);
      const borderDiffGrid = extractBorderDiffGrid(beforeFlattened, newGrid, dx, dy);

      const resizedExisting = currentLayers.map((layer) => ({
        ...layer,
        grid: resizeLayerGrid(layer.grid, newWidth, newHeight, dx, dy),
      }));

      let nextLayers: CanvasLayer[];
      let targetActiveId = activeLayerIdRef.current;
      let toastText: string;

      if (resizedExisting.length < MAX_LAYERS) {
        const borderName = getUniqueLayerName(resizedExisting, 'Border');
        const borderLayer = createLayer(borderName, borderDiffGrid);
        nextLayers = [...resizedExisting, borderLayer];
        targetActiveId = borderLayer.id;
        toastText = `🖼️ Applied decorative frame on new "${borderName}" layer (${newWidth}×${newHeight})!`;
      } else {
        const topIdx = resizedExisting.length - 1;
        const topGrid = cloneGrid(resizedExisting[topIdx].grid);
        for (let y = 0; y < newHeight; y++) {
          for (let x = 0; x < newWidth; x++) {
            if (borderDiffGrid[y][x] !== -1) {
              topGrid[y][x] = borderDiffGrid[y][x];
            }
          }
        }
        nextLayers = resizedExisting.map((l, idx) =>
          idx === topIdx ? { ...l, grid: topGrid } : l
        );
        targetActiveId = resizedExisting[topIdx].id;
        toastText = `🖼️ Applied decorative frame (${newWidth}×${newHeight})!`;
      }

      applyLayerState(nextLayers, targetActiveId);
      syncPaletteCountsFromLayers(nextLayers);

      if (newWidth !== config.width || newHeight !== config.height) {
        const updatedConfig = { ...config, width: newWidth, height: newHeight };
        setConfig(updatedConfig);
        latestConfigRef.current = updatedConfig;
        setAspectRatio(newWidth / newHeight);

        if (dx > 0 || dy > 0) {
          setCompletedCells((prev) => {
            const shifted: CellProgress = {};
            for (const [key, val] of Object.entries(prev)) {
              if (!val) continue;
              const [sx, sy] = key.split(',').map(Number);
              if (!Number.isNaN(sx) && !Number.isNaN(sy)) {
                shifted[`${sx + dx},${sy + dy}`] = true;
              }
            }
            return shifted;
          });
        }
      }

      showToast(toastText);
    },
    [config, handleBeforePencilStroke, applyLayerState, syncPaletteCountsFromLayers, showToast]
  );

  // Wave 9: Smart Layers Panel CRUD Actions
  const handleSelectLayer = useCallback((id: string) => {
    activeLayerIdRef.current = id;
    setActiveLayerId(id);
  }, []);

  const handleAddLayer = useCallback(() => {
    const currentLayers = layersRef.current;
    if (currentLayers.length === 0) return;
    if (currentLayers.length >= MAX_LAYERS) {
      showToast(`Layers limit (${MAX_LAYERS}) reached — merge or delete a layer first.`);
      return;
    }
    const h = currentLayers[0].grid.length;
    const w = h > 0 ? currentLayers[0].grid[0]?.length ?? 0 : 0;
    if (w === 0 || h === 0) return;

    handleBeforePencilStroke();
    const newName = getUniqueLayerName(currentLayers, `Layer ${currentLayers.length + 1}`);
    const newLayer = createLayer(newName, createEmptyLayerGrid(w, h));
    const nextLayers = [...cloneLayers(currentLayers), newLayer];
    applyLayerState(nextLayers, newLayer.id);
    showToast(`✨ Added "${newName}"`);
  }, [handleBeforePencilStroke, applyLayerState, showToast]);

  const handleDeleteLayer = useCallback(
    (id: string) => {
      const currentLayers = layersRef.current;
      if (currentLayers.length <= 1) return;
      const idx = currentLayers.findIndex((l) => l.id === id);
      if (idx === -1) return;
      const removedName = currentLayers[idx].name;

      handleBeforePencilStroke();
      const nextLayers = cloneLayers(currentLayers.filter((l) => l.id !== id));
      const fallbackActive =
        activeLayerIdRef.current === id
          ? (nextLayers[Math.max(0, idx - 1)] || nextLayers[0]).id
          : activeLayerIdRef.current;
      applyLayerState(nextLayers, fallbackActive);
      syncPaletteCountsFromLayers(nextLayers);
      showToast(`🗑️ Deleted "${removedName}"`);
    },
    [handleBeforePencilStroke, applyLayerState, syncPaletteCountsFromLayers, showToast]
  );

  const handleDuplicateLayer = useCallback(
    (id: string) => {
      const result = duplicateCanvasLayer(layersRef.current, id);
      if (!result) {
        if (layersRef.current.length >= MAX_LAYERS) {
          showToast(`Layers limit (${MAX_LAYERS}) reached!`);
        }
        return;
      }
      handleBeforePencilStroke();
      applyLayerState(result.layers, result.activeLayerId);
      syncPaletteCountsFromLayers(result.layers);
      const copy = result.layers.find((l) => l.id === result.activeLayerId);
      showToast(`📋 Duplicated layer as "${copy?.name || 'Copy'}"`);
    },
    [handleBeforePencilStroke, applyLayerState, syncPaletteCountsFromLayers, showToast]
  );

  const handleRenameLayer = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const nextLayers = layersRef.current.map((l) =>
        l.id === id ? { ...l, name: trimmed } : l
      );
      applyLayerState(nextLayers, activeLayerIdRef.current);
    },
    [applyLayerState]
  );

  const handleToggleLayerVisible = useCallback(
    (id: string) => {
      const nextLayers = layersRef.current.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      );
      applyLayerState(nextLayers, activeLayerIdRef.current);
      syncPaletteCountsFromLayers(nextLayers);
    },
    [applyLayerState, syncPaletteCountsFromLayers]
  );

  const handleToggleLayerLock = useCallback(
    (id: string) => {
      const nextLayers = layersRef.current.map((l) =>
        l.id === id ? { ...l, locked: !l.locked } : l
      );
      applyLayerState(nextLayers, activeLayerIdRef.current);
    },
    [applyLayerState]
  );

  const handleChangeLayerOpacity = useCallback(
    (id: string, opacity: number) => {
      const clamped = Math.max(0.1, Math.min(1, opacity));
      const nextLayers = layersRef.current.map((l) =>
        l.id === id ? { ...l, opacity: clamped } : l
      );
      applyLayerState(nextLayers, activeLayerIdRef.current);
    },
    [applyLayerState]
  );

  const handleMoveLayer = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const nextLayers = moveCanvasLayerOrder(layersRef.current, id, direction);
      if (!nextLayers) return;
      handleBeforePencilStroke();
      applyLayerState(nextLayers, activeLayerIdRef.current);
      syncPaletteCountsFromLayers(nextLayers);
    },
    [handleBeforePencilStroke, applyLayerState, syncPaletteCountsFromLayers]
  );

  const handleMergeLayerDown = useCallback(
    (id: string) => {
      const result = mergeCanvasLayerDown(layersRef.current, id);
      if (!result) return;
      handleBeforePencilStroke();
      applyLayerState(result.layers, result.activeLayerId);
      syncPaletteCountsFromLayers(result.layers);
      showToast('⬇️ Merged layer down!');
    },
    [handleBeforePencilStroke, applyLayerState, syncPaletteCountsFromLayers, showToast]
  );

  const handleClearLayer = useCallback(
    (id: string) => {
      const target = layersRef.current.find((l) => l.id === id);
      if (!target) return;
      if (target.locked) {
        warnActiveLayerBlocked(target);
        return;
      }
      const h = target.grid.length;
      const w = h > 0 ? target.grid[0]?.length ?? 0 : 0;
      if (w === 0 || h === 0) return;

      handleBeforePencilStroke();
      const nextLayers = layersRef.current.map((l) =>
        l.id === id ? { ...l, grid: createEmptyLayerGrid(w, h) } : l
      );
      applyLayerState(nextLayers, activeLayerIdRef.current);
      syncPaletteCountsFromLayers(nextLayers);
      showToast(`🧹 Cleared "${target.name}"`);
    },
    [handleBeforePencilStroke, applyLayerState, syncPaletteCountsFromLayers, warnActiveLayerBlocked, showToast]
  );

  const handleFlattenLayers = useCallback(() => {
    const currentLayers = layersRef.current;
    if (currentLayers.length <= 1) return;
    handleBeforePencilStroke();
    const flattened = flattenLayers(currentLayers);
    const stack = createSingleLayerStack(flattened, 'Layer 1');
    applyLayerState(stack.layers, stack.activeLayerId);
    syncPaletteCountsFromLayers(stack.layers);
    showToast('🧩 Flattened visible layers into Layer 1!');
  }, [handleBeforePencilStroke, applyLayerState, syncPaletteCountsFromLayers, showToast]);

  // Wave 4: Cloud Sync, Community Publishing & /p/:shortId Handlers
  const handleSyncCloudAll = useCallback(
    async (targetUser?: User | null, silent = false) => {
      const activeUser = targetUser ?? cloudUser;
      if (!activeUser || !isSupabaseConfigured || isSyncInFlightRef.current) return;

      isSyncInFlightRef.current = true;
      setIsCloudSyncing(true);
      try {
        const [projRes, prefRes, liked] = await Promise.all([
          syncProjectsWithCloud(activeUser.id),
          syncStashAndWipWithCloud(activeUser.id, wipStatsRef.current),
          fetchUserLikedPatternIds(activeUser.id),
        ]);

        setWipStats(prefRes.wipStats);
        setCloudDisplayName(prefRes.displayName);
        setLikedPatternIds(liked);
        await refreshVaultCount();

        const summary: CloudSyncSummary = {
          pulledProjects: projRes.pulledProjects,
          pushedProjects: projRes.pushedProjects,
          mergedStashItems: prefRes.mergedStashItems,
          mergedWipSessions: prefRes.mergedWipSessions,
          syncedAtIso: new Date().toISOString(),
        };
        setLastCloudSyncedAt(summary.syncedAtIso);
        setLastCloudSyncSummary(summary);

        if (!silent) {
          showToast(
            `☁️ Cloud synced (+${projRes.pushedProjects} pushed, +${projRes.pulledProjects} pulled)`
          );
        }
      } catch (err) {
        if (!silent) {
          showToast(
            `Cloud sync failed: ${err instanceof Error ? err.message : 'Network error'}`
          );
        }
      } finally {
        isSyncInFlightRef.current = false;
        setIsCloudSyncing(false);
      }
    },
    [cloudUser, refreshVaultCount, showToast]
  );

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;

    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      const sessionUser = data.session?.user ?? null;
      setCloudUser(sessionUser);
      if (sessionUser) {
        handleSyncCloudAll(sessionUser, true).catch((err) =>
          console.warn('Initial cloud sync failed:', err)
        );
      }
    });

    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      const nextUser = session?.user ?? null;
      setCloudUser(nextUser);
      if (nextUser && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        handleSyncCloudAll(nextUser, false).catch((err) =>
          console.warn('Auth sync failed:', err)
        );
      } else if (!nextUser) {
        setLikedPatternIds(new Set());
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [handleSyncCloudAll]);

  // Debounced cloud push whenever local WIP stats change while signed in
  useEffect(() => {
    if (!cloudUser || !isSupabaseConfigured) return;
    const t = window.setTimeout(() => {
      pushPreferencesToCloud(cloudUser.id, { wipStats }).catch(() => {
        // ignore background push failures
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [cloudUser, wipStats]);

  const handleUpdateCloudDisplayName = useCallback(
    (name: string) => {
      setCloudDisplayName(name);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('pcs_cloud_display_name', name);
        } catch {
          // ignore
        }
      }
      if (cloudUser && isSupabaseConfigured) {
        pushPreferencesToCloud(cloudUser.id, { displayName: name });
      }
      showToast('✨ Creator display name updated!');
    },
    [cloudUser, showToast]
  );

  const handleCloudSignOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCloudUser(null);
    setLikedPatternIds(new Set());
    showToast('Signed out from cloud sync (local projects remain saved).');
  }, [showToast]);

  const handleOpenPublishedPatternInStudio = useCallback(
    (record: PublishedPatternRecord, decodedGrid: number[][]) => {
      handleBeforePencilStroke();
      const nextConfig: GridConfig = {
        ...latestConfigRef.current,
        craftType: record.craft_type,
        width: record.width,
        height: record.height,
        beadLoom:
          record.craft_type === 'loom'
            ? {
                stitchStyle: record.bead_stitch_style || 'loom',
                beadType: latestConfigRef.current.beadLoom?.beadType || 'delica-11',
              }
            : latestConfigRef.current.beadLoom,
      };
      setConfig(nextConfig);
      latestConfigRef.current = nextConfig;
      setAspectRatio(record.width / Math.max(1, record.height));

      const recalculatedPalette = recalculatePaletteCounts(decodedGrid, record.palette);
      setPalette(recalculatedPalette);
      paletteRef.current = recalculatedPalette;
      setSingleLayerGrid(decodedGrid, record.title || 'Layer 1');
      setCompletedCells({});
      setBackstitches(record.backstitches || []);
      setRemixedFrom({ shortId: record.short_id, title: record.title });

      const previewUrl = generateCanvasDataUrl(decodedGrid, recalculatedPalette);
      if (previewUrl) {
        setSourceImageDataUrl(previewUrl);
        const img = new Image();
        img.onload = () => {
          setSourceImage(img);
          sourceImageRef.current = img;
        };
        img.src = previewUrl;
      }

      navigate(getPathForCraft(record.craft_type));
      showToast(`✨ Opened "${record.title}" in Studio!`);
    },
    [handleBeforePencilStroke, setSingleLayerGrid, navigate, showToast]
  );

  const handleSavePublishedToVault = useCallback(
    async (record: PublishedPatternRecord, decodedGrid: number[][]) => {
      const projectConfig: GridConfig = {
        ...latestConfigRef.current,
        craftType: record.craft_type,
        width: record.width,
        height: record.height,
        beadLoom:
          record.craft_type === 'loom'
            ? {
                stitchStyle: record.bead_stitch_style || 'loom',
                beadType: latestConfigRef.current.beadLoom?.beadType || 'delica-11',
              }
            : latestConfigRef.current.beadLoom,
      };
      const saved = await saveProjectToVault({
        name: record.title,
        craftType: record.craft_type,
        gridConfig: projectConfig,
        gridData: decodedGrid,
        palette: recalculatePaletteCounts(decodedGrid, record.palette),
        completedCells: {},
        backstitches: record.backstitches || [],
        thumbnailDataUrl: record.thumbnail_data_url || undefined,
        width: record.width,
        height: record.height,
        colorCount: record.color_count || record.palette.length,
      });

      if (cloudUser && isSupabaseConfigured) {
        pushSingleProjectToCloud(cloudUser.id, saved).catch((err) =>
          console.warn('Cloud push failed:', err)
        );
      }
      await refreshVaultCount();
      showToast(`💾 Saved "${record.title}" to My Projects Vault!`);
    },
    [cloudUser, refreshVaultCount, showToast]
  );

  const handleToggleCommunityLike = useCallback(
    async (patternId: string) => {
      if (!cloudUser) {
        setIsCloudAuthOpen(true);
        return;
      }
      const currentlyLiked = likedPatternIds.has(patternId);
      setLikedPatternIds((prev) => {
        const next = new Set(prev);
        if (currentlyLiked) next.delete(patternId);
        else next.add(patternId);
        return next;
      });
      try {
        await toggleCommunityPatternLike(patternId, cloudUser.id, currentlyLiked);
      } catch (err) {
        // Revert optimistic update on error
        setLikedPatternIds((prev) => {
          const next = new Set(prev);
          if (currentlyLiked) next.add(patternId);
          else next.delete(patternId);
          return next;
        });
        showToast(err instanceof Error ? err.message : 'Could not update like');
      }
    },
    [cloudUser, likedPatternIds, showToast]
  );

  // Quick Command Palette Items (Ctrl+K / Cmd+K)
  const commandPaletteItems = useMemo<CommandPaletteItem[]>(() => {
    const craftEntries: { id: CraftType; label: string; desc: string; kw: string[] }[] = [
      { id: 'perler', label: 'Switch to Perler & Fuse Beads', desc: '5mm & 2.6mm Hama / Artkal / Perler pegboards', kw: ['fuse', 'hama', 'artkal', 'bead'] },
      { id: 'cross-stitch', label: 'Switch to Cross-Stitch & DMC', desc: 'Aida count fabric & DMC embroidery floss key', kw: ['embroidery', 'aida', 'floss', 'dmc'] },
      { id: 'crochet', label: 'Switch to Tapestry Crochet & C2C', desc: 'Row-by-row tapestry & corner-to-corner graphghan', kw: ['yarn', 'graphghan', 'c2c', 'tapestry'] },
      { id: 'pixel', label: 'Switch to Digital Pixel Art & Latch Hook', desc: 'Clean square pixels, retro sprites & latch-hook grids', kw: ['pixel', 'sprite', 'rug', 'latch'] },
      { id: 'diamond', label: 'Switch to Diamond Painting', desc: 'Round & square 5D DMC resin drills', kw: ['drills', 'gem', '5d'] },
      { id: 'knitting', label: 'Switch to Intarsia Knitting Chart', desc: 'Non-square stitch gauge & RS/WS knitting chart', kw: ['knit', 'purl', 'gauge', 'fair isle'] },
      { id: 'alpha', label: 'Switch to Friendship Alpha Pattern', desc: 'Bracketed knotting strings & keychain guide', kw: ['bracelet', 'knot', 'keychain'] },
      { id: 'loom', label: 'Switch to Seed Bead Loom / Peyote / Brick', desc: 'Miyuki Delica 11/0, staggered peyote & word charts', kw: ['miyuki', 'delica', 'peyote', 'brick', 'bead'] },
    ];

    return [
      {
        id: 'tool-publish-share',
        label: 'Publish Pattern & Short Link (/p/:id)',
        description: 'Publish to the Community Feed or create a compact /p/:id share URL',
        category: 'Export & Shop',
        keywords: ['publish', 'share', 'short link', 'community', 'url'],
        icon: <Share2 className="w-4 h-4 text-pink-400" />,
        onExecute: () => setIsPublishModalOpen(true),
      },
      {
        id: 'tool-community-feed',
        label: 'Live Community Pattern Feed',
        description: 'Browse user-published patterns across all crafts, like, and remix in Studio',
        category: 'Tools',
        keywords: ['community', 'feed', 'showcase', 'browse', 'remix'],
        icon: <Globe className="w-4 h-4 text-pink-400" />,
        onExecute: () => {
          setGalleryInitialTab('community');
          setIsStarterGalleryOpen(true);
        },
      },
      {
        id: 'tool-cloud-auth',
        label: cloudUser ? 'Cloud Account & Sync Settings' : 'Sign In for Cloud Vault & Stash Sync',
        description: 'Manage cross-device sync for Projects Vault, DMC/Perler Stash & WIP Journal',
        category: 'Tools',
        keywords: ['cloud', 'sync', 'account', 'login', 'supabase'],
        icon: <Cloud className="w-4 h-4 text-cyan-400" />,
        onExecute: () => setIsCloudAuthOpen(true),
      },
      {
        id: 'action-cloud-sync-now',
        label: 'Sync Vault & Stash with Cloud Now',
        description: 'Merge local Projects Vault, Stash inventory, Favorites & WIP sessions with Supabase',
        category: 'Canvas Actions',
        keywords: ['sync', 'cloud', 'upload', 'backup'],
        icon: <RefreshCw className="w-4 h-4 text-emerald-400" />,
        onExecute: () => {
          if (!cloudUser) {
            setIsCloudAuthOpen(true);
            return;
          }
          handleSyncCloudAll(cloudUser, false);
        },
      },
      {
        id: 'tool-border-builder',
        label: 'Border & Sampler Frame Builder',
        description: 'Add heirloom double-rule, floral vine, scalloped lace, or geometric borders',
        category: 'Tools',
        keywords: ['frame', 'border', 'sampler', 'vine', 'corner'],
        icon: <Frame className="w-4 h-4 text-pink-400" />,
        onExecute: () => setIsBorderModalOpen(true),
      },
      {
        id: 'tool-wip-tracker',
        label: 'WIP Time Tracker & Stats Card',
        description: 'Start stitch stopwatch, view stitches/hour speed, and export 1080×1350 PNG card',
        category: 'Tools',
        keywords: ['timer', 'stopwatch', 'speed', 'wip', 'stats', 'journal', 'png'],
        icon: <Timer className="w-4 h-4 text-emerald-400" />,
        onExecute: () => setIsWipTrackerOpen(true),
      },
      {
        id: 'action-split-compare',
        label: 'Before / After Photo Split Slider',
        description: 'Toggle interactive divider comparing original photo vs live craft pattern',
        category: 'Canvas Actions',
        keywords: ['split', 'compare', 'before', 'after', 'photo', 'slider'],
        icon: <SplitSquareHorizontal className="w-4 h-4 text-cyan-400" />,
        onExecute: () => {
          if (!sourceImage) {
            showToast('Upload or select an image first to compare!');
            return;
          }
          setSplitCompareSignal((s) => s + 1);
        },
      },
      {
        id: 'tool-written-instructions',
        label: config.craftType === 'loom' ? 'Bead Word Chart & Miyuki DB Key' : 'Written Row-by-Row Instructions',
        description: 'View printable row instructions, voice read-aloud, or (count)A bead word chart',
        category: 'Tools',
        keywords: ['word chart', 'written', 'rows', 'miyuki', 'peyote', 'crochet', 'instructions'],
        icon: <FileText className="w-4 h-4 text-teal-400" />,
        onExecute: () => setIsWrittenInstructionsOpen(true),
      },
      {
        id: 'tool-ai-generator',
        label: 'AI Motif Generator',
        description: 'Generate custom pixel & cross-stitch art directly from a text prompt',
        category: 'Tools',
        keywords: ['ai', 'generate', 'prompt', 'create'],
        icon: <Wand2 className="w-4 h-4 text-purple-400" />,
        onExecute: () => setIsAiModalOpen(true),
      },
      {
        id: 'tool-bg-remover',
        label: 'Smart Background Remover',
        description: 'Remove photo backgrounds with CIELAB segmentation & manual brush touch-up',
        category: 'Tools',
        keywords: ['background', 'transparent', 'cutout', 'remove'],
        icon: <Eraser className="w-4 h-4 text-teal-400" />,
        onExecute: () => setIsBgRemoverOpen(true),
      },
      {
        id: 'tool-pixel-text',
        label: 'Pixel Text & Monogram Stamping',
        description: 'Stamp classic pixel fonts, initials & dates onto your pattern canvas',
        category: 'Tools',
        keywords: ['text', 'font', 'letters', 'monogram', 'name'],
        icon: <Type className="w-4 h-4 text-amber-400" />,
        onExecute: () => setIsPixelTextOpen(true),
      },
      {
        id: 'tool-color-chart',
        label: 'Thread & Bead Color Chart / Hex Matcher',
        description: 'DMC to Anchor, Perler to Artkal/Hama, and Miyuki Delica hex conversions',
        category: 'Tools',
        keywords: ['color', 'hex', 'dmc', 'anchor', 'artkal', 'chart', 'convert'],
        icon: <Palette className="w-4 h-4 text-indigo-400" />,
        onExecute: () => navigate('/color-chart'),
      },
      {
        id: 'tool-stitch-companion',
        label: 'Stitch Companion (Hands-Free Phone Mode)',
        description: 'Focused row tracking & voice narration for stitching away from your desk',
        category: 'Tools',
        keywords: ['companion', 'phone', 'voice', 'narrator', 'couch'],
        icon: <Smartphone className="w-4 h-4 text-teal-400" />,
        onExecute: () => setIsStitchCompanionOpen(true),
      },
      {
        id: 'tool-calculators',
        label: 'Craft Calculators Suite',
        description: 'Floss skein estimator, bead grams-to-count, and C2C blanket sizer',
        category: 'Tools',
        keywords: ['calculator', 'skein', 'grams', 'blanket', 'c2c'],
        icon: <Calculator className="w-4 h-4 text-amber-400" />,
        onExecute: () => setIsCalculatorsOpen(true),
      },
      {
        id: 'tool-size-frame',
        label: 'Size & Framing Calculator',
        description: 'Check finished dimensions across fabric counts & standard picture frame sizes',
        category: 'Tools',
        keywords: ['size', 'dimensions', 'hoop', 'inch', 'cm'],
        icon: <Ruler className="w-4 h-4 text-indigo-400" />,
        onExecute: () => setIsSizeAndFrameOpen(true),
      },
      {
        id: 'tool-timelapse',
        label: 'Social Timelapse Video Generator',
        description: 'Record & export an animated pixel reveal video for TikTok & Reels',
        category: 'Tools',
        keywords: ['video', 'timelapse', 'tiktok', 'reels', 'animation'],
        icon: <Video className="w-4 h-4 text-rose-400" />,
        onExecute: () => setIsTimelapseOpen(true),
      },
      {
        id: 'tool-projects-vault',
        label: 'My Projects Vault',
        description: 'Switch between auto-saved WIPs or import/export .pixelcraft backups',
        category: 'Tools',
        keywords: ['vault', 'save', 'projects', 'load'],
        icon: <FolderArchive className="w-4 h-4 text-indigo-400" />,
        onExecute: () => setIsProjectVaultOpen(true),
      },
      {
        id: 'page-oxs-viewer',
        label: '.OXS Pattern Viewer & Converter',
        description: 'Open external .oxs charts, calculate Aida & skeins, or export PDF/SVG',
        category: 'Tools',
        keywords: ['oxs', 'viewer', 'converter', 'winstitch', 'flosscross', 'page'],
        icon: <FileText className="w-4 h-4 text-emerald-400" />,
        onExecute: () => navigate('/oxs-viewer'),
      },
      {
        id: 'page-color-substitutor',
        label: 'Batch Color Substitutor & 2-Strand Blend Finder',
        description: 'Convert thread/bead shopping lists and compute optical 2-strand blends',
        category: 'Tools',
        keywords: ['substitutor', 'substitute', 'anchor', 'blend', 'tweeding', 'batch'],
        icon: <RefreshCw className="w-4 h-4 text-indigo-400" />,
        onExecute: () => navigate('/tools/color-substitutor'),
      },
      {
        id: 'page-community-hub',
        label: 'Community Pattern Showcase Hub',
        description: 'Explore public community patterns, creator portfolios & trending remixes',
        category: 'Tools',
        keywords: ['community', 'hub', 'showcase', 'explore', 'remix'],
        icon: <Globe className="w-4 h-4 text-pink-400" />,
        onExecute: () => navigate('/community'),
      },
      {
        id: 'page-license',
        label: 'Commercial & Etsy Seller License',
        description: 'Read creator commercial rights and seller kit usage terms',
        category: 'Tools',
        keywords: ['license', 'commercial', 'etsy', 'rights', 'terms'],
        icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
        onExecute: () => navigate('/license'),
      },
      {
        id: 'page-about-privacy',
        label: 'About Studio & Privacy Architecture',
        description: 'View multi-craft capabilities and local-first privacy details',
        category: 'Tools',
        keywords: ['about', 'privacy', 'storage', 'info'],
        icon: <Package className="w-4 h-4 text-cyan-400" />,
        onExecute: () => navigate('/about'),
      },
      ...craftEntries.map((c) => ({
        id: `craft-${c.id}`,
        label: c.label,
        description: c.desc,
        category: 'Crafts' as const,
        keywords: c.kw,
        icon: <Sparkles className="w-4 h-4 text-pink-400" />,
        onExecute: () => handleUpdateConfig({ craftType: c.id }),
      })),
      {
        id: 'action-undo',
        label: 'Undo Last Canvas Edit',
        description: 'Step back one grid or border edit',
        category: 'Canvas Actions',
        shortcut: 'Ctrl+Z',
        keywords: ['undo', 'revert', 'back'],
        icon: <Undo2 className="w-4 h-4 text-slate-300" />,
        onExecute: handleUndo,
      },
      {
        id: 'action-redo',
        label: 'Redo Canvas Edit',
        description: 'Re-apply the previously undone edit',
        category: 'Canvas Actions',
        shortcut: 'Ctrl+Y',
        keywords: ['redo', 'forward'],
        icon: <Redo2 className="w-4 h-4 text-slate-300" />,
        onExecute: handleRedo,
      },
      {
        id: 'action-toggle-left',
        label: 'Toggle Controls Sidebar',
        description: 'Expand or collapse the left pattern generation panel',
        category: 'Canvas Actions',
        shortcut: '[',
        keywords: ['sidebar', 'controls', 'left', 'panel'],
        icon: <SlidersHorizontal className="w-4 h-4 text-indigo-400" />,
        onExecute: () => setIsLeftPanelOpen((p) => !p),
      },
      {
        id: 'action-toggle-right',
        label: 'Toggle Palette & Layers Sidebar',
        description: 'Expand or collapse the right palette & layers panel',
        category: 'Canvas Actions',
        shortcut: ']',
        keywords: ['palette', 'legend', 'right', 'panel', 'layers'],
        icon: <Palette className="w-4 h-4 text-pink-400" />,
        onExecute: () => setIsRightPanelOpen((p) => !p),
      },
      {
        id: 'layers-open-panel',
        label: 'Open Layers Panel',
        description: 'Inspect layers, toggle visibility/lock, adjust opacity, or reorder stack',
        category: 'Canvas Actions',
        keywords: ['layer', 'layers', 'panel', 'opacity', 'visibility'],
        icon: <Layers className="w-4 h-4 text-indigo-400" />,
        onExecute: () => {
          setIsRightPanelOpen(true);
          setRightSidebarTab('layers');
        },
      },
      {
        id: 'layers-add-new',
        label: 'Add New Canvas Layer',
        description: 'Create a transparent top layer (up to 10 layers) for edits, text or shading',
        category: 'Canvas Actions',
        keywords: ['new layer', 'add layer', 'stack'],
        icon: <Layers className="w-4 h-4 text-emerald-400" />,
        onExecute: () => {
          handleAddLayer();
          setIsRightPanelOpen(true);
          setRightSidebarTab('layers');
        },
      },
      {
        id: 'layers-flatten-all',
        label: 'Flatten All Layers',
        description: 'Merge all visible canvas layers into a single flattened Layer 1',
        category: 'Canvas Actions',
        keywords: ['flatten', 'merge layers', 'combine'],
        icon: <Layers className="w-4 h-4 text-amber-400" />,
        onExecute: handleFlattenLayers,
      },
      {
        id: 'action-zen-mode',
        label: 'Toggle Focus Zen Mode',
        description: 'Hide sidebars for distraction-free stitching or drawing',
        category: 'Canvas Actions',
        shortcut: '\\',
        keywords: ['zen', 'focus', 'fullscreen', 'hide'],
        icon: <Maximize2 className="w-4 h-4 text-indigo-400" />,
        onExecute: () => setIsZenMode((p) => !p),
      },
      {
        id: 'export-pdf-png',
        label: 'Export & Print Pattern (PDF, PNG, Pattern Keeper)',
        description: 'Generate multi-page symbol charts, Pattern Keeper vector PDF, or JSON',
        category: 'Export & Shop',
        keywords: ['export', 'print', 'pdf', 'png', 'pattern keeper', 'download'],
        icon: <Download className="w-4 h-4 text-pink-400" />,
        onExecute: () => setIsExportOpen(true),
      },
      {
        id: 'export-oxs',
        label: 'Export Open Cross-Stitch (.OXS)',
        description: 'Universal XML cross-stitch chart for Pattern Keeper, Saga & WinStitch',
        category: 'Export & Shop',
        keywords: ['oxs', 'xml', 'saga', 'winstitch', 'pattern keeper', 'export'],
        icon: <Download className="w-4 h-4 text-emerald-400" />,
        onExecute: () => {
          exportPatternToOXS(gridData, palette, config, 'pixel-craft-pattern.oxs', {
            title: lastAiPrompt || 'Pixel Craft Pattern',
            author: cloudDisplayName || undefined,
            backstitches,
          });
          showToast('🧵 Exported .OXS Open Cross-Stitch XML file!');
        },
      },
      {
        id: 'export-svg',
        label: 'Export Layered Vector (.SVG)',
        description: 'Color-grouped Inkscape, Illustrator & Cricut cut-ready SVG layers',
        category: 'Export & Shop',
        keywords: ['svg', 'vector', 'illustrator', 'inkscape', 'cricut', 'export'],
        icon: <Download className="w-4 h-4 text-indigo-400" />,
        onExecute: () => {
          exportPatternToSVG(gridData, palette, config, 'pixel-craft-vector.svg', {
            title: lastAiPrompt || 'Pixel Craft Pattern',
            includeGridLines: config.showGridLines,
            backstitches,
          });
          showToast('✨ Exported color-layered .SVG vector chart!');
        },
      },
      {
        id: 'export-supply-kit',
        label: 'Smart Craft Supply Kit & Amazon Lookup',
        description: 'Fabric cut dimensions, hoop sizes, pegboards & missing thread shopping list',
        category: 'Export & Shop',
        keywords: ['supply', 'kit', 'buy', 'amazon', 'materials'],
        icon: <Package className="w-4 h-4 text-amber-400" />,
        onExecute: () => setIsMaterialKitOpen(true),
      },
      {
        id: 'export-shopping-trip',
        label: 'In-Store Shopping Checklist',
        description: 'Mobile store checklist to tick off floss skeins & bead tubes in the aisle',
        category: 'Export & Shop',
        keywords: ['shop', 'shopping', 'checklist', 'store'],
        icon: <ShoppingCart className="w-4 h-4 text-emerald-400" />,
        onExecute: () => setIsShoppingTripOpen(true),
      },
      {
        id: 'export-etsy-kit',
        label: 'Etsy & Commercial Seller Kit',
        description: '4 listing mockups, Etsy tags, pattern description & ZIP bundle export',
        category: 'Export & Shop',
        keywords: ['etsy', 'seller', 'mockup', 'commercial', 'zip'],
        icon: <ShoppingBag className="w-4 h-4 text-amber-400" />,
        onExecute: () => setIsEtsyKitOpen(true),
      },
      {
        id: 'export-my-stash',
        label: 'My Floss & Bead Stash Inventory',
        description: 'Manage owned DMC & bead shades and match patterns to your stash',
        category: 'Export & Shop',
        keywords: ['stash', 'inventory', 'owned'],
        icon: <Package className="w-4 h-4 text-emerald-400" />,
        onExecute: () => setIsMyStashOpen(true),
      },
    ];
  }, [config, gridData, palette, backstitches, lastAiPrompt, cloudDisplayName, sourceImage, cloudUser, handleSyncCloudAll, handleUpdateConfig, handleUndo, handleRedo, handleAddLayer, handleFlattenLayers, navigate, showToast]);

  const handleResetProgress = () => {
    if (Object.keys(completedCells).length === 0) return;
    if (window.confirm('Reset all completed stitches/beads progress?')) {
      setCompletedCells({});
    }
  };

  const handleClearEverything = async () => {
    if (window.confirm('Start fresh with default sample image? This will reset custom edits.')) {
      await clearSavedAppState();
      setCompletedCells({});
      setBackstitches([]);
      setSpotlightColorId(null);
      setGridHistory([]);
      setGridFuture([]);
      setRemixedFrom(null);
      setConfig(DEFAULT_CONFIG);
      handleSelectSample(SAMPLE_IMAGES[0]);
    }
  };

  const handleLoadProjectJSON = (project: CraftProject) => {
    setConfig(project.gridConfig);
    latestConfigRef.current = project.gridConfig;
    const restored = normalizeLayersForGrid(project.layers, project.activeLayerId, project.gridData);
    applyLayerState(restored.layers, restored.activeLayerId);
    setPalette(project.palette);
    paletteRef.current = project.palette;
    setCompletedCells(project.completedCells || {});
    setBackstitches(project.backstitches || []);
    setGridHistory([]);
    setGridFuture([]);
    setRemixedFrom(null);
    showToast(`📂 Loaded ${project.gridConfig.width}×${project.gridConfig.height} pattern (${project.palette.length} colors)!`);
  };

  const handleLoadVaultProject = useCallback((project: SavedProject) => {
    setConfig(project.gridConfig);
    latestConfigRef.current = project.gridConfig;
    const restored = normalizeLayersForGrid(project.layers, project.activeLayerId, project.gridData);
    applyLayerState(restored.layers, restored.activeLayerId);
    setPalette(project.palette);
    paletteRef.current = project.palette;
    setCompletedCells(project.completedCells || {});
    setBackstitches(project.backstitches || []);
    if (project.sourceImageDataUrl) {
      setSourceImageDataUrl(project.sourceImageDataUrl);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setSourceImage(img);
        sourceImageRef.current = img;
      };
      img.src = project.sourceImageDataUrl;
    } else {
      setSourceImage(null);
      sourceImageRef.current = null;
      setSourceImageDataUrl(null);
    }
    setGridHistory([]);
    setGridFuture([]);
    showToast(`Loaded "${project.name}" from Vault! ✨`);
    refreshVaultCount();
  }, [applyLayerState, showToast, refreshVaultCount]);

  // Drag & drop picture over window
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none touch-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Header */}
      {/* Top Application Header */}
      <Header
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenSocialCardModal={() => setIsSocialCardOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenStarterGallery={() => setIsStarterGalleryOpen(true)}
        onOpenNewCanvasModal={() => setIsNewCanvasModalOpen(true)}
        onOpenSizeAndFrameModal={() => setIsSizeAndFrameOpen(true)}
        onOpenTimelapseModal={() => setIsTimelapseOpen(true)}
        onOpenPixelTextModal={() => setIsPixelTextOpen(true)}
        onOpenMyStashModal={() => setIsMyStashOpen(true)}
        onOpenStitchCompanionModal={() => setIsStitchCompanionOpen(true)}
        onOpenShoppingTripModal={() => setIsShoppingTripOpen(true)}
        onOpenCalculatorsModal={() => setIsCalculatorsOpen(true)}
        onOpenProjectVaultModal={() => setIsProjectVaultOpen(true)}
        onOpenEtsyKitModal={() => setIsEtsyKitOpen(true)}
        onOpenMaterialKitModal={() => setIsMaterialKitOpen(true)}
        onOpenColorChartModal={() => navigate('/color-chart')}
        onOpenBgRemoverModal={() => setIsBgRemoverOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenBorderModal={() => setIsBorderModalOpen(true)}
        onOpenWipTrackerModal={() => setIsWipTrackerOpen(true)}
        isWipTimerRunning={isWipTimerRunning}
        wipSessionSeconds={wipSessionSeconds}
        cloudUserEmail={cloudUser?.email || null}
        isCloudSyncing={isCloudSyncing}
        onOpenCloudAuthModal={() => setIsCloudAuthOpen(true)}
        onOpenPublishModal={() => setIsPublishModalOpen(true)}
        savedProjectsCount={vaultProjectsCount}
        isAutoSaving={isAutoSaving}
        isZenMode={isZenMode}
        onToggleZenMode={() => setIsZenMode((prev) => !prev)}
        onResetProgress={handleResetProgress}
        onClearEverything={handleClearEverything}
        onLoadProjectJSON={handleLoadProjectJSON}
        onToggleHelpModal={() => setIsHelpOpen(true)}
        isLeftPanelOpen={isLeftPanelOpen}
        onToggleLeftPanel={() => setIsLeftPanelOpen((prev) => !prev)}
        isRightPanelOpen={isRightPanelOpen}
        onToggleRightPanel={() => setIsRightPanelOpen((prev) => !prev)}
      />

      {/* Main Workspace: Left Controls + Center Canvas + Right Palette */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Controls (Desktop Sidebar & Mobile Drawer) */}
        {!isZenMode && (
          <div
            className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out ${
              isMobileControlsOpen
                ? 'translate-x-0'
                : '-translate-x-full'
            } lg:static lg:z-auto ${
              isLeftPanelOpen ? 'lg:translate-x-0 lg:flex' : 'lg:-translate-x-full lg:hidden'
            }`}
          >
            {/* Mobile Backdrop */}
            {isMobileControlsOpen && (
              <div
                onClick={() => setIsMobileControlsOpen(false)}
                className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm lg:hidden -z-10"
              />
            )}
            <ControlsPanel
              config={config}
              onUpdateConfig={handleUpdateConfig}
              onSelectSampleImage={(sample) => {
                handleSelectSample(sample);
                setIsMobileControlsOpen(false);
              }}
              onUploadImage={(file) => {
                handleUploadFile(file);
                setIsMobileControlsOpen(false);
              }}
              onRegenerate={reprocessCurrentImage}
              onOpenAiModal={() => {
                setIsMobileControlsOpen(false);
                setIsAiModalOpen(true);
              }}
              onOpenCropModal={handleOpenCropModal}
              onOpenBgRemoverModal={() => {
                setIsMobileControlsOpen(false);
                setIsBgRemoverOpen(true);
              }}
              onOpenNewCanvasModal={() => {
                setIsMobileControlsOpen(false);
                setIsNewCanvasModalOpen(true);
              }}
              onInspectCurrentPhoto={() => handleOpenInspect(sourceImageDataUrl || sourceImage?.src || '', 'Source Picture')}
              onOpenStarterGallery={() => {
                setIsMobileControlsOpen(false);
                setIsStarterGalleryOpen(true);
              }}
              onClose={() => setIsMobileControlsOpen(false)}
              aiHistory={aiHistory}
              onSelectHistoryImage={(item) => {
                handleSelectHistoryImage(item);
                setIsMobileControlsOpen(false);
              }}
              uploadHistory={uploadHistory}
              onSelectUploadItem={(item) => {
                handleSelectUploadItem(item);
                setIsMobileControlsOpen(false);
              }}
              onOpenHistoryModal={() => {
                setIsMobileControlsOpen(false);
                setIsHistoryModalOpen(true);
              }}
              onOpenWrittenInstructions={() => setIsWrittenInstructionsOpen(true)}
              onOpenSizeAndFrameModal={() => setIsSizeAndFrameOpen(true)}
              onOpenTimelapseModal={() => setIsTimelapseOpen(true)}
              onOpenMyStashModal={() => setIsMyStashOpen(true)}
              useMyStashOnly={useMyStashOnly}
              onToggleMyStashOnly={handleToggleMyStashOnly}
              aspectRatio={aspectRatio}
              hasTransparency={hasTransparency}
              onToggleCollapse={() => setIsLeftPanelOpen(false)}
            />
          </div>
        )}

        {/* Sleek Edge Tab on Left Border (when left panel is closed) */}
        {!isZenMode && !isLeftPanelOpen && (
          <button
            onClick={() => setIsLeftPanelOpen(true)}
            className="hidden lg:flex absolute top-1/2 -translate-y-1/2 left-0 z-30 items-center gap-1 py-3 px-1.5 rounded-r-xl bg-slate-950/90 hover:bg-slate-900 text-slate-400 hover:text-white border-y border-r border-slate-700/80 shadow-2xl backdrop-blur-md text-[11px] font-semibold transition group"
            title="Open settings & controls (or press [)"
          >
            <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition" />
            <span className="[writing-mode:vertical-lr] tracking-wider uppercase text-[9px] font-bold text-slate-300">Controls</span>
          </button>
        )}

        {/* Center Interactive Craft Canvas */}
        <CraftCanvas
          gridData={gridData}
          layers={layers}
          activeLayerId={activeLayerId}
          onOpenLayersTab={() => {
            setIsRightPanelOpen(true);
            setIsMobilePaletteOpen(true);
            setRightSidebarTab('layers');
          }}
          palette={palette}
          config={config}
          spotlightColorId={spotlightColorId}
          activeColorIndex={activeColorIndex}
          completedCells={completedCells}
          onToggleCellCompleted={handleToggleCellCompleted}
          onBatchSetCellsCompleted={handleBatchSetCellsCompleted}
          onPaintCell={handlePaintCell}
          onBatchPaintCells={handleBatchPaintCells}
          canUndo={gridHistory.length > 0}
          canRedo={gridFuture.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onBeforePencilStroke={handleBeforePencilStroke}
          onInspectSourceImage={() => handleOpenInspect(sourceImageDataUrl || sourceImage?.src || '', 'Source Picture')}
          onSelectColor={(idx) => setActiveColorIndex(idx)}
          onTransformGrid={handleTransformGrid}
          onOpenPixelTextModal={() => setIsPixelTextOpen(true)}
          onToggleShapeMask={handleToggleShapeMask}
          showPegboardLines={showPegboardLines}
          backstitches={backstitches}
          onUpdateBackstitches={setBackstitches}
          sourceImage={sourceImage}
          onOpenBorderModal={() => setIsBorderModalOpen(true)}
          splitCompareSignal={splitCompareSignal}
        />

        {/* Right Palette Legend (Desktop Sidebar & Mobile Drawer) */}
        {!isZenMode && (
          <div
            className={`fixed inset-y-0 right-0 z-40 transition-transform duration-300 ease-in-out ${
              isMobilePaletteOpen
                ? 'translate-x-0'
                : 'translate-x-full'
            } lg:static lg:z-auto ${
              isRightPanelOpen ? 'lg:translate-x-0 lg:flex' : 'lg:translate-x-full lg:hidden'
            }`}
          >
            {/* Mobile Backdrop */}
            {isMobilePaletteOpen && (
              <div
                onClick={() => setIsMobilePaletteOpen(false)}
                className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm lg:hidden -z-10"
              />
            )}
            <PaletteLegend
              palette={palette}
              gridData={gridData}
              spotlightColorId={spotlightColorId}
              activeColorIndex={activeColorIndex}
              completedCells={completedCells}
              craftType={config.craftType}
              unitSystem={config.unitSystem}
              onSelectColor={(idx) => setActiveColorIndex(idx)}
              onToggleSpotlight={handleToggleSpotlight}
              onUpdateColorHex={handleUpdateColorHex}
              onToggleLockColor={handleToggleLockColor}
              onCleanConfetti={handleCleanConfetti}
              onClose={() => setIsMobilePaletteOpen(false)}
              onAddColor={handleAddCustomColor}
              onSwapColor={handleSwapColor}
              onSwapWithNewColor={handleSwapWithNewColor}
              onToggleCollapse={() => setIsRightPanelOpen(false)}
              onApplyPaletteMood={handleApplyPaletteMood}
              onCrossConvertCraft={handleCrossConvertCraft}
              onOpenPhotoPalette={() => setIsPhotoPaletteOpen(true)}
              onOpenColorChart={() => {
                setIsMobilePaletteOpen(false);
                navigate('/color-chart');
              }}
              onOpenMaterialKit={() => {
                setIsMobilePaletteOpen(false);
                setIsMaterialKitOpen(true);
              }}
              onOpenShoppingTrip={() => {
                setIsMobilePaletteOpen(false);
                setIsShoppingTripOpen(true);
              }}
              layers={layers}
              activeLayerId={activeLayerId}
              rightSidebarTab={rightSidebarTab}
              onChangeRightSidebarTab={setRightSidebarTab}
              onSelectLayer={handleSelectLayer}
              onAddLayer={handleAddLayer}
              onDeleteLayer={handleDeleteLayer}
              onDuplicateLayer={handleDuplicateLayer}
              onRenameLayer={handleRenameLayer}
              onToggleLayerVisible={handleToggleLayerVisible}
              onToggleLayerLock={handleToggleLayerLock}
              onChangeLayerOpacity={handleChangeLayerOpacity}
              onMoveLayer={handleMoveLayer}
              onMergeLayerDown={handleMergeLayerDown}
              onClearLayer={handleClearLayer}
              onFlattenLayers={handleFlattenLayers}
            />
          </div>
        )}

        {/* Sleek Edge Tab on Right Border (when right panel is closed) */}
        {!isZenMode && !isRightPanelOpen && (
          <button
            onClick={() => setIsRightPanelOpen(true)}
            className="hidden lg:flex absolute top-1/2 -translate-y-1/2 right-0 z-30 items-center gap-1 py-3 px-1.5 rounded-l-xl bg-slate-950/90 hover:bg-slate-900 text-slate-400 hover:text-white border-y border-l border-slate-700/80 shadow-2xl backdrop-blur-md text-[11px] font-semibold transition group"
            title="Open color palette & floss key (or press ])"
          >
            <ChevronLeft className="w-4 h-4 text-pink-400 group-hover:-translate-x-0.5 transition" />
            <span className="[writing-mode:vertical-lr] tracking-wider uppercase text-[9px] font-bold text-slate-300">Palette</span>
          </button>
        )}

        {/* Mobile & Tablet Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/98 backdrop-blur-2xl border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
          <button
            onClick={() => {
              setIsMobilePaletteOpen(false);
              setIsMobileControlsOpen((prev) => !prev);
            }}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${
              isMobileControlsOpen
                ? 'text-indigo-400 bg-indigo-500/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Controls</span>
          </button>

          <button
            onClick={() => {
              setIsMobileControlsOpen(false);
              setIsMobilePaletteOpen((prev) => !prev);
            }}
            className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl transition relative ${
              isMobilePaletteOpen
                ? 'text-pink-400 bg-pink-500/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Palette className="w-4 h-4" />
              <span className="absolute -top-1 -right-2 text-[9px] bg-pink-500 text-white font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {palette.length}
              </span>
            </div>
            <span className="text-[10px] font-semibold">Palette</span>
          </button>

          <button
            onClick={() => setIsProjectVaultOpen(true)}
            className="flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl text-indigo-400 hover:text-indigo-300 transition"
            title="My Projects Vault"
          >
            <div className="relative">
              <FolderArchive className="w-4 h-4" />
              {vaultProjectsCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[8px] bg-indigo-500 text-white font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {vaultProjectsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Vault</span>
          </button>

          <button
            onClick={() => setIsStitchCompanionOpen(true)}
            className="flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl text-teal-400 hover:text-teal-300 transition"
            title="Couch Mode: Hands-free row-by-row stitch tracker with screen keep-awake"
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Couch</span>
          </button>

          <button
            onClick={() => setIsWrittenInstructionsOpen(true)}
            className="flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl text-emerald-400 hover:text-emerald-300 transition"
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Written</span>
          </button>

          <button
            onClick={() => setIsStarterGalleryOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-amber-400 hover:text-amber-300 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Starters</span>
          </button>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-purple-400 hover:text-purple-300 transition"
          >
            <Wand2 className="w-4 h-4" />
            <span className="text-[10px] font-semibold">AI Draw</span>
          </button>
        </nav>

        {/* Drag & Drop Overlay */}
        {isDraggingFile && (
          <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center border-4 border-dashed border-indigo-400">
            <span className="text-4xl mb-2">📸</span>
            <h3 className="text-xl font-bold text-white">Drop picture here to pixelate!</h3>
            <p className="text-sm text-indigo-300">Supports drag & drop, file upload, or Ctrl+V paste</p>
          </div>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-indigo-950/95 text-indigo-100 border border-indigo-400/50 backdrop-blur-xl px-4 py-2 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 pointer-events-none transition-all duration-200 animate-in fade-in slide-in-from-top-2">
          <span>{toastMessage}</span>
        </div>
      )}

      <Suspense fallback={null}>
        {/* Export & Print Modal */}
        {isExportOpen && (
          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            gridData={gridData}
            palette={palette}
            config={config}
            completedCells={completedCells}
            backstitches={backstitches}
            layers={layers}
            activeLayerId={activeLayerId}
            onOpenWrittenInstructions={() => {
              setIsExportOpen(false);
              setIsWrittenInstructionsOpen(true);
            }}
            onOpenSocialCard={() => {
              setIsExportOpen(false);
              setIsSocialCardOpen(true);
            }}
            onOpenShoppingTrip={() => {
              setIsExportOpen(false);
              setIsShoppingTripOpen(true);
            }}
            onOpenEtsyKit={() => {
              setIsExportOpen(false);
              setIsEtsyKitOpen(true);
            }}
            onOpenMaterialKit={() => {
              setIsExportOpen(false);
              setIsMaterialKitOpen(true);
            }}
            onOpenPublishModal={() => {
              setIsExportOpen(false);
              setIsPublishModalOpen(true);
            }}
          />
        )}

        {/* Tapestry Crochet & Alpha Knot Written Row-by-Row Instructions Modal */}
        {isWrittenInstructionsOpen && (
          <CrochetWrittenInstructionsModal
            isOpen={isWrittenInstructionsOpen}
            onClose={() => setIsWrittenInstructionsOpen(false)}
            gridData={gridData}
            palette={palette}
            projectName="Pixel Craft Pattern"
            craftType={config.craftType}
            beadStitchStyle={config.beadLoom?.stitchStyle || 'loom'}
          />
        )}

        {/* Starter Patterns & Inspiration Gallery Modal */}
        {isStarterGalleryOpen && (
          <StarterGalleryModal
            isOpen={isStarterGalleryOpen}
            onClose={() => {
              setIsStarterGalleryOpen(false);
              setGalleryInitialTab('curated');
              setGalleryAuthorFilter(null);
              if (location.pathname === '/gallery') {
                navigate(getPathForCraft(config.craftType));
              }
            }}
            onSelectStarter={(sample, craftType, gridSize, colorsCount) => {
              handleSelectSample(sample, craftType, gridSize, colorsCount);
              if (location.pathname === '/gallery') {
                navigate(getPathForCraft(craftType || config.craftType));
              }
            }}
            onOpenAiGenerator={() => setIsAiModalOpen(true)}
            onOpenSocialCard={() => setIsSocialCardOpen(true)}
            initialTab={galleryInitialTab}
            initialAuthorFilter={galleryAuthorFilter}
            onOpenPublishModal={() => setIsPublishModalOpen(true)}
            onOpenCloudAuth={() => setIsCloudAuthOpen(true)}
            onOpenCommunityPattern={handleOpenPublishedPatternInStudio}
            user={cloudUser}
            likedPatternIds={likedPatternIds}
            onToggleCommunityLike={handleToggleCommunityLike}
          />
        )}

        {/* Ask AI to Generate Picture Modal with History */}
        {isAiModalOpen && (
          <AiGenerateModal
            isOpen={isAiModalOpen}
            onClose={() => setIsAiModalOpen(false)}
            onImageGenerated={handleAiImageGenerated}
            history={aiHistory}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
            onInspectImage={(url, prompt, style) => handleOpenInspect(url, 'AI Picture Inspection', prompt, style)}
            initialPrompt={lastAiPrompt}
            initialStyleId={lastAiStyle}
          />
        )}

        {/* Full High-Resolution Image Inspection Modal */}
        {inspectModalOpen && (
          <ImageInspectModal
            isOpen={inspectModalOpen}
            onClose={() => setInspectModalOpen(false)}
            imageUrl={inspectData?.url || null}
            title={inspectData?.title}
            prompt={inspectData?.prompt}
            styleName={inspectData?.styleName}
            onUseForCraft={(url) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                applyImageAndProcess(img, url, '');
              };
              img.src = url;
            }}
          />
        )}

        {/* Image Crop & Cut Modal */}
        {isCropModalOpen && (
          <ImageCropModal
            isOpen={isCropModalOpen}
            onClose={() => setIsCropModalOpen(false)}
            imageUrl={cropImageUrl || sourceImageDataUrl || sourceImage?.src || ''}
            onApplyCrop={handleApplyCrop}
            gridAspectRatio={config.width / Math.max(1, config.height)}
          />
        )}

        {/* Smart Background Remover & Subject Cutout Modal */}
        {isBgRemoverOpen && (
          <BackgroundRemoverModal
            isOpen={isBgRemoverOpen}
            onClose={() => setIsBgRemoverOpen(false)}
            imageUrl={sourceImageDataUrl || sourceImage?.src || ''}
            gridWidth={config.width}
            gridHeight={config.height}
            onApplyCutout={handleApplyBgCutout}
          />
        )}

        {/* Uploaded & AI Picture History Gallery Modal */}
        {isHistoryModalOpen && (
          <ImageHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            uploadHistory={uploadHistory}
            aiHistory={aiHistory}
            onSelectUploadItem={handleSelectUploadItem}
            onSelectAiItem={handleSelectHistoryImage}
            onDeleteUploadItem={handleDeleteUploadItem}
            onDeleteAiItem={handleDeleteHistoryItem}
            onClearAllUploadHistory={handleClearAllUploadHistory}
            onOpenCropForImage={handleOpenCropForImage}
          />
        )}

        {/* Help & Guide Modal */}
        {isHelpOpen && (
          <HelpModal
            isOpen={isHelpOpen}
            onClose={() => setIsHelpOpen(false)}
          />
        )}

        {/* New Pixel Canvas Modal */}
        {isNewCanvasModalOpen && (
          <NewCanvasModal
            isOpen={isNewCanvasModalOpen}
            onClose={() => setIsNewCanvasModalOpen(false)}
            currentPalette={palette}
            currentCraftType={config.craftType}
            onCreateCanvas={handleCreateBlankCanvas}
          />
        )}

        {/* Aesthetic Social Card Generator Modal */}
        {isSocialCardOpen && (
          <SocialCardModal
            isOpen={isSocialCardOpen}
            onClose={() => setIsSocialCardOpen(false)}
            gridData={gridData}
            palette={palette}
            config={config}
            defaultTitle={lastAiPrompt || 'My Pixel Craft Pattern'}
          />
        )}

        {/* Finished Size & Framing Calculator Modal */}
        {isSizeAndFrameOpen && (
          <SizeAndFrameModal
            isOpen={isSizeAndFrameOpen}
            onClose={() => setIsSizeAndFrameOpen(false)}
            gridData={gridData}
            palette={palette}
            craftType={config.craftType}
            unitSystem={config.unitSystem}
            onToggleUnitSystem={(u) => handleUpdateConfig({ unitSystem: u })}
            showPegboardLines={showPegboardLines}
            onTogglePegboardLines={() => setShowPegboardLines((prev) => !prev)}
          />
        )}

        {/* Social Media Animated Timelapse Video Generator */}
        {isTimelapseOpen && (
          <TimelapseModal
            isOpen={isTimelapseOpen}
            onClose={() => setIsTimelapseOpen(false)}
            gridData={gridData}
            palette={palette}
            craftType={config.craftType}
            defaultTitle={lastAiPrompt || 'Pixel Craft Pattern'}
          />
        )}

        {/* Pixel Text, Name & Monogram Tool */}
        {isPixelTextOpen && (
          <PixelTextModal
            isOpen={isPixelTextOpen}
            onClose={() => setIsPixelTextOpen(false)}
            palette={palette}
            craftType={config.craftType}
            canvasWidth={config.width}
            canvasHeight={config.height}
            onStampToCanvas={handleStampText}
            onCreateNewFromText={handleCreateNewFromText}
          />
        )}

        {/* Physical Craft Floss & Bead Stash Inventory */}
        {isMyStashOpen && (
          <MyStashModal
            isOpen={isMyStashOpen}
            onClose={() => {
              setIsMyStashOpen(false);
              if (useMyStashOnly && sourceImageRef.current) {
                reprocessCurrentImage();
              }
            }}
            onStashUpdated={() => {
              if (useMyStashOnly && sourceImageRef.current) {
                reprocessCurrentImage();
              }
              if (cloudUser && isSupabaseConfigured) {
                pushPreferencesToCloud(cloudUser.id, {});
              }
            }}
          />
        )}

        {/* Stitch Companion Hands-Free Focus Mode */}
        {isStitchCompanionOpen && (
          <StitchCompanionModal
            isOpen={isStitchCompanionOpen}
            onClose={() => setIsStitchCompanionOpen(false)}
            gridData={gridData}
            palette={palette}
            completedCells={completedCells}
            craftType={config.craftType}
            onBatchSetCellsCompleted={handleBatchSetCellsCompleted}
          />
        )}

        {/* In-Store Shopping Trip Checklist Modal */}
        {isShoppingTripOpen && (
          <ShoppingTripModal
            isOpen={isShoppingTripOpen}
            onClose={() => setIsShoppingTripOpen(false)}
            palette={palette}
            gridData={gridData}
            craftType={config.craftType}
            onStashUpdated={() => {
              if (useMyStashOnly && sourceImageRef.current) {
                reprocessCurrentImage();
              }
              if (cloudUser && isSupabaseConfigured) {
                pushPreferencesToCloud(cloudUser.id, {});
              }
            }}
            onOpenMaterialKit={() => {
              setIsShoppingTripOpen(false);
              setIsMaterialKitOpen(true);
            }}
          />
        )}

        {/* Smart Craft Supply Kit & Materials Checkout Modal */}
        {isMaterialKitOpen && (
          <MaterialKitModal
            isOpen={isMaterialKitOpen}
            onClose={() => setIsMaterialKitOpen(false)}
            config={config}
            palette={palette}
            gridData={gridData}
            completedCells={completedCells}
            onOpenShoppingTrip={() => {
              setIsMaterialKitOpen(false);
              setIsShoppingTripOpen(true);
            }}
          />
        )}

        {/* Standalone Craft Calculators Suite */}
        {isCalculatorsOpen && (
          <CraftCalculatorsModal
            isOpen={isCalculatorsOpen}
            onClose={() => {
              setIsCalculatorsOpen(false);
              if (location.pathname.startsWith('/calculators')) {
                navigate(getPathForCraft(config.craftType));
              }
            }}
            currentGridWidth={config.width}
            currentGridHeight={config.height}
            unitSystem={config.unitSystem}
            initialTab={calculatorInitialTab}
            onApplyGridSize={(w, h) => {
              handleUpdateConfig({ width: w, height: h, lockAspectRatio: false });
              showToast(`📏 Applied blanket grid dimensions (${w} × ${h})!`);
            }}
          />
        )}

        {/* Multi-Project Local Vault Drawer & Manager */}
        {isProjectVaultOpen && (
          <ProjectVaultModal
            isOpen={isProjectVaultOpen}
            onClose={() => setIsProjectVaultOpen(false)}
            currentConfig={config}
            currentGridData={gridData}
            currentPalette={palette}
            currentCompletedCells={completedCells}
            currentBackstitches={backstitches}
            currentLayers={layers}
            currentActiveLayerId={activeLayerId}
            currentSourceImageDataUrl={sourceImageDataUrl}
            onLoadProject={handleLoadVaultProject}
            onProjectsChanged={refreshVaultCount}
            cloudUser={cloudUser}
            isCloudSyncing={isCloudSyncing}
            lastCloudSyncedAt={lastCloudSyncedAt}
            onTriggerCloudSync={() => handleSyncCloudAll(cloudUser, false)}
            onOpenCloudAuth={() => setIsCloudAuthOpen(true)}
          />
        )}

        {/* Etsy & Seller Commercial Kit Modal */}
        {isEtsyKitOpen && (
          <EtsySellerKitModal
            isOpen={isEtsyKitOpen}
            onClose={() => setIsEtsyKitOpen(false)}
            config={config}
            gridData={gridData}
            palette={palette}
            backstitches={backstitches}
          />
        )}

        {/* Photo & Inspiration Palette Extractor Modal */}
        {isPhotoPaletteOpen && (
          <PhotoPaletteModal
            isOpen={isPhotoPaletteOpen}
            onClose={() => setIsPhotoPaletteOpen(false)}
            onApplyPaletteToGrid={handleApplyPhotoPaletteToGrid}
            onSetActivePaletteOnly={handleSetPhotoPaletteOnly}
          />
        )}

        {/* Interactive Thread & Bead Color Chart + CIELAB Hex Matcher */}
        {isColorChartOpen && (
          <ColorChartModal
            isOpen={isColorChartOpen}
            onClose={() => {
              setIsColorChartOpen(false);
              if (location.pathname.startsWith('/color-chart')) {
                navigate(getPathForCraft(config.craftType));
              }
            }}
            initialTab={colorChartInitialTab}
            onTabChange={(tab) => {
              const tabPathMap: Record<ColorChartTab, string> = {
                'hex-matcher': '/color-chart',
                'dmc-anchor': '/color-chart/dmc-to-anchor',
                perler: '/color-chart/perler-bead-colors',
                miyuki: '/color-chart/miyuki-delica',
              };
              if (location.pathname.startsWith('/color-chart')) {
                navigate(tabPathMap[tab], { replace: true });
              }
            }}
            onAddColorToPalette={(hex, label) => {
              handleAddCustomColor(hex);
              if (label) {
                showToast(`✨ Added ${label} (${hex}) to Studio palette!`);
              }
            }}
            onStashUpdated={() => {
              if (useMyStashOnly && sourceImageRef.current) {
                reprocessCurrentImage();
              }
              if (cloudUser && isSupabaseConfigured) {
                pushPreferencesToCloud(cloudUser.id, {});
              }
            }}
          />
        )}

        {/* Dedicated Pattern Detail Landing Page Modal (/patterns/:slug) */}
        {activePatternSlug !== null && (
          <PatternDetailModal
            pattern={getPatternBySlug(activePatternSlug)}
            onClose={() => {
              setActivePatternSlug(null);
              navigate(getPathForCraft(config.craftType));
            }}
            onBackToGallery={() => {
              setActivePatternSlug(null);
              navigate('/gallery');
            }}
            onOpenInStudio={(pattern) => {
              handleSelectSample(
                pattern,
                pattern.recommendedCraft,
                pattern.recommendedGridSize,
                pattern.recommendedColors
              );
              setActivePatternSlug(null);
              navigate(getPathForCraft(pattern.recommendedCraft));
              showToast(`✨ Loaded "${pattern.name}" into Studio!`);
            }}
            unitSystem={config.unitSystem}
          />
        )}

        {/* Decorative Border, Frame & Sampler Builder Modal */}
        {isBorderModalOpen && (
          <BorderBuilderModal
            isOpen={isBorderModalOpen}
            onClose={() => setIsBorderModalOpen(false)}
            gridData={gridData}
            palette={palette}
            onApplyFramedGrid={handleApplyFramedGrid}
          />
        )}

        {/* WIP Time Tracker, Stitch Speed & Social PNG Stats Card Modal */}
        {isWipTrackerOpen && (
          <WipTrackerModal
            isOpen={isWipTrackerOpen}
            onClose={() => setIsWipTrackerOpen(false)}
            gridData={gridData}
            palette={palette}
            config={config}
            completedCells={completedCells}
            isTimerRunning={isWipTimerRunning}
            activeSessionSeconds={wipSessionSeconds}
            activeSessionStartStitches={wipSessionStartStitches}
            onStartTimer={handleStartWipTimer}
            onPauseTimer={handlePauseWipTimer}
            onSaveAndResetTimer={handleSaveAndResetWipTimer}
            wipStats={wipStats}
            onUpdateWipStats={handleUpdateWipStats}
          />
        )}

        {/* Searchable Command Palette (Ctrl+K / Cmd+K) */}
        {isCommandPaletteOpen && (
          <CommandPaletteModal
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            items={commandPaletteItems}
          />
        )}

        {/* Cloud Auth, Multi-Device Vault, Stash & WIP Sync Modal */}
        {isCloudAuthOpen && (
          <CloudAuthModal
            isOpen={isCloudAuthOpen}
            onClose={() => setIsCloudAuthOpen(false)}
            user={cloudUser}
            displayName={cloudDisplayName}
            onUpdateDisplayName={handleUpdateCloudDisplayName}
            isSyncing={isCloudSyncing}
            lastSyncedAt={lastCloudSyncedAt}
            lastSyncSummary={lastCloudSyncSummary}
            onSyncNow={() => handleSyncCloudAll(cloudUser, false)}
            onSignOut={handleCloudSignOut}
            localVaultCount={vaultProjectsCount}
            wipSessionsCount={wipStats.sessions.length}
          />
        )}

        {/* Publish to Community Showcase & Short Link (/p/:id) Modal */}
        {isPublishModalOpen && (
          <PublishPatternModal
            isOpen={isPublishModalOpen}
            onClose={() => setIsPublishModalOpen(false)}
            config={config}
            gridData={gridData}
            palette={palette}
            backstitches={backstitches}
            user={cloudUser}
            defaultAuthorName={cloudDisplayName}
            remixedFrom={remixedFrom}
            onOpenCloudAuth={() => setIsCloudAuthOpen(true)}
            onPublished={(shortId, patternTitle) => {
              showToast(`🚀 Published "${patternTitle}" at /p/${shortId}!`);
            }}
          />
        )}

        {/* Shared Pattern Detail View (/p/:id Short Share Links) */}
        {activeSharedPatternId !== null && (
          <SharedPatternModal
            shortId={activeSharedPatternId}
            onClose={() => {
              setActiveSharedPatternId(null);
              navigate(getPathForCraft(config.craftType));
            }}
            user={cloudUser}
            displayName={cloudDisplayName}
            likedPatternIds={likedPatternIds}
            onToggleLike={handleToggleCommunityLike}
            onOpenCloudAuth={() => {
              setActiveSharedPatternId(null);
              setIsCloudAuthOpen(true);
            }}
            onOpenInStudio={handleOpenPublishedPatternInStudio}
            onSaveToVault={handleSavePublishedToVault}
            onSelectCreator={(author) => {
              setActiveSharedPatternId(null);
              navigate(`/u/${encodeURIComponent(author)}`);
            }}
            onDeleted={() => {
              showToast('Deleted published pattern.');
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
