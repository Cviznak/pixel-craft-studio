import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  GridConfig, 
  PaletteColor, 
  CellProgress, 
  SampleImage, 
  CraftProject,
  AiHistoryItem,
  UploadHistoryItem 
} from './types/craft';
import { SAMPLE_IMAGES } from './utils/sampleImages';
import { extractBeautifulPalette } from './utils/paletteExtractor';
import { processImageToGrid } from './utils/pixelation';
import { saveAppState, loadAppState, clearSavedAppState } from './utils/storage';
import { DEFAULT_CROCHET_GAUGE } from './utils/craftCalculator';
import { Header } from './components/Header';
import { ControlsPanel } from './components/ControlsPanel';
import { CraftCanvas } from './components/CraftCanvas';
import { PaletteLegend } from './components/PaletteLegend';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';
import { AiGenerateModal } from './components/AiGenerateModal';
import { ImageInspectModal } from './components/ImageInspectModal';
import { StarterGalleryModal } from './components/StarterGalleryModal';
import { ImageCropModal } from './components/ImageCropModal';
import { ImageHistoryModal } from './components/ImageHistoryModal';
import { cleanConfettiColors } from './utils/paletteOperations';
import { SlidersHorizontal, Sparkles, Wand2, Palette } from 'lucide-react';

const DEFAULT_CONFIG: GridConfig = {
  width: 32,
  height: 32,
  lockAspectRatio: true,
  colorsCount: 14,
  craftType: 'perler',
  extractionMode: 'vibrant',
  dither: 'none',
  craftStandard: 'dmc',
  brightness: 0,
  contrast: 0,
  saturation: 15,
  showGridLines: true,
  show10x10MajorLines: true,
  showRulers: true,
  showSymbols: true,
  cellSize: 24,
  crochetGauge: DEFAULT_CROCHET_GAUGE,
};

export default function App() {
  const [config, setConfig] = useState<GridConfig>(DEFAULT_CONFIG);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceImageDataUrl, setSourceImageDataUrl] = useState<string | null>(null);
  const [sampleImageId, setSampleImageId] = useState<string>('flower');
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [gridData, setGridData] = useState<number[][]>([]);
  const [spotlightColorId, setSpotlightColorId] = useState<string | null>(null);
  const [activeColorIndex, setActiveColorIndex] = useState<number>(0);
  const [completedCells, setCompletedCells] = useState<CellProgress>({});
  const [isInitialLoaded, setIsInitialLoaded] = useState<boolean>(false);
  
  // Undo & Redo History for Pencil
  const [gridHistory, setGridHistory] = useState<number[][][]>([]);
  const [gridFuture, setGridFuture] = useState<number[][][]>([]);

  // AI generation state & history
  const [lastAiPrompt, setLastAiPrompt] = useState<string>('');
  const [lastAiStyle, setLastAiStyle] = useState<string>('pixel-art');
  const [aiHistory, setAiHistory] = useState<AiHistoryItem[]>([]);

  // User uploaded pictures history
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isStarterGalleryOpen, setIsStarterGalleryOpen] = useState<boolean>(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
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

  // Reference for synchronous beforeunload save
  const currentStateRef = useRef({
    config,
    palette,
    gridData,
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

  // Push snapshot to undo history before pencil stroke begins
  const handleBeforePencilStroke = useCallback(() => {
    if (gridData.length === 0) return;
    setGridHistory((prev) => [...prev.slice(-49), gridData.map((row) => [...row])]);
    setGridFuture([]); // clear redo stack on new action
  }, [gridData]);

  // Undo (Ctrl+Z)
  const handleUndo = useCallback(() => {
    if (gridHistory.length === 0) return;
    const previous = gridHistory[gridHistory.length - 1];
    setGridHistory((prev) => prev.slice(0, prev.length - 1));
    setGridFuture((prev) => [...prev.slice(-49), gridData.map((row) => [...row])]);
    setGridData(previous);
  }, [gridHistory, gridData]);

  // Redo (Ctrl+Y or Ctrl+Shift+Z)
  const handleRedo = useCallback(() => {
    if (gridFuture.length === 0) return;
    const next = gridFuture[gridFuture.length - 1];
    setGridFuture((prev) => prev.slice(0, prev.length - 1));
    setGridHistory((prev) => [...prev.slice(-49), gridData.map((row) => [...row])]);
    setGridData(next);
  }, [gridFuture, gridData]);

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    targetConfig = config
  ) => {
    const aspect = img.width / img.height;
    setAspectRatio(aspect);
    setSourceImage(img);
    setSourceImageDataUrl(dataUrl);
    setSampleImageId(sampleId);

    let targetWidth = targetConfig.width;
    let targetHeight = targetConfig.height;

    if (targetConfig.lockAspectRatio) {
      targetHeight = Math.max(8, Math.min(160, Math.round(targetWidth / aspect)));
      setConfig((prev) => ({ ...prev, height: targetHeight }));
    }

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

    tempCtx.drawImage(img, 0, 0, sampleW, sampleH);
    const imgData = tempCtx.getImageData(0, 0, sampleW, sampleH);

    // Extract palette using vibrant aesthetic algorithm
    const newPalette = extractBeautifulPalette(
      imgData,
      targetConfig.colorsCount,
      targetConfig.extractionMode,
      targetConfig.craftStandard,
      []
    );

    // Quantize onto craft grid
    const { gridData: newGrid, paletteWithCounts } = processImageToGrid(
      img,
      targetWidth,
      targetHeight,
      newPalette,
      targetConfig
    );

    setPalette(paletteWithCounts);
    setGridData(newGrid);
    setCompletedCells({});
    setGridHistory([]);
    setGridFuture([]);
  }, [config]);

  // Load saved state on mount (restores on page refresh)
  useEffect(() => {
    const restoreState = async () => {
      try {
        const saved = await loadAppState();
        if (saved) {
          setConfig(saved.config || DEFAULT_CONFIG);
          if (saved.palette && saved.palette.length > 0) {
            setPalette(saved.palette);
          }
          if (saved.gridData && saved.gridData.length > 0) {
            setGridData(saved.gridData);
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
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        applyImageAndProcess(img, defaultSample.url, defaultSample.id, DEFAULT_CONFIG);
        setIsInitialLoaded(true);
      };
      img.src = defaultSample.url;
    };

    restoreState();
  }, []);

  // Save state continuously (debounced)
  useEffect(() => {
    if (!isInitialLoaded || !sourceImage || gridData.length === 0) return;

    const timer = setTimeout(() => {
      saveAppState({
        version: 1,
        updatedAt: new Date().toISOString(),
        config,
        palette,
        gridData,
        completedCells,
        spotlightColorId,
        activeColorIndex,
        sourceImageDataUrl,
        sampleImageId,
        lastAiPrompt,
        lastAiStyle,
        aiHistory,
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [
    isInitialLoaded,
    sourceImage,
    config,
    palette,
    gridData,
    completedCells,
    spotlightColorId,
    activeColorIndex,
    sourceImageDataUrl,
    sampleImageId,
    lastAiPrompt,
    lastAiStyle,
    aiHistory,
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

  const handleSelectSample = (sample: SampleImage) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      applyImageAndProcess(img, sample.url, sample.id);
    };
    img.src = sample.url;
  };

  const handleUploadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        applyImageAndProcess(img, dataUrl, '');
        const newItem: UploadHistoryItem = {
          id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
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
  };

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

  // Clean confetti colors (<1% stitches) into their nearest CIELAB neighbor
  const handleCleanConfetti = useCallback(() => {
    if (gridData.length === 0 || palette.length <= 1) return;
    
    // Save current state for undo
    setGridHistory((prev) => [...prev.slice(-30), gridData.map((row) => [...row])]);
    setGridFuture([]);

    const result = cleanConfettiColors(gridData, palette, 1.0);
    if (result.removedCount > 0) {
      setGridData(result.newGrid);
      setPalette(result.newPalette);
      if (activeColorIndex >= result.newPalette.length) {
        setActiveColorIndex(0);
      }
    }
  }, [gridData, palette, activeColorIndex]);

  // Re-run color extraction and grid quantization on existing image
  const reprocessCurrentImage = useCallback(() => {
    if (!sourceImage) return;

    const tempCanvas = document.createElement('canvas');
    const maxDimension = 300;
    let sampleW = sourceImage.width;
    let sampleH = sourceImage.height;

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

    tempCtx.drawImage(sourceImage, 0, 0, sampleW, sampleH);
    const imgData = tempCtx.getImageData(0, 0, sampleW, sampleH);

    const locked = palette.filter((c) => c.isLocked);
    const newPalette = extractBeautifulPalette(
      imgData,
      config.colorsCount,
      config.extractionMode,
      config.craftStandard,
      locked
    );

    const { gridData: newGrid, paletteWithCounts } = processImageToGrid(
      sourceImage,
      config.width,
      config.height,
      newPalette,
      config
    );

    setPalette(paletteWithCounts);
    setGridData(newGrid);
  }, [
    sourceImage,
    config,
    palette,
  ]);

  // Update Config Helper
  const handleUpdateConfig = (newConfig: Partial<GridConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...newConfig };
      return next;
    });

    const needsReprocess = 
      newConfig.width !== undefined ||
      newConfig.height !== undefined ||
      newConfig.colorsCount !== undefined ||
      newConfig.extractionMode !== undefined ||
      newConfig.craftStandard !== undefined ||
      newConfig.dither !== undefined ||
      newConfig.brightness !== undefined ||
      newConfig.contrast !== undefined ||
      newConfig.saturation !== undefined;

    if (needsReprocess && sourceImage) {
      setTimeout(() => {
        reprocessCurrentImage();
      }, 30);
    }
  };

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

  const handlePaintCell = (x: number, y: number, colorIndex: number) => {
    if (y < 0 || y >= gridData.length || x < 0 || x >= gridData[0].length) return;
    setGridData((prev) => {
      const next = prev.map((row) => [...row]);
      next[y][x] = colorIndex;
      return next;
    });
  };

  // Palette Handlers
  const handleToggleSpotlight = (colorId: string) => {
    setSpotlightColorId((prev) => (prev === colorId ? null : colorId));
  };

  const handleUpdateColorHex = (index: number, newHex: string) => {
    setPalette((prev) => {
      const next = [...prev];
      if (next[index]) {
        const clean = newHex.replace('#', '');
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        next[index] = { ...next[index], hex: newHex, r, g, b, isLocked: true };
      }
      return next;
    });

    if (sourceImage) {
      setTimeout(() => {
        const { gridData: newGrid, paletteWithCounts } = processImageToGrid(
          sourceImage,
          config.width,
          config.height,
          palette,
          config
        );
        setGridData(newGrid);
        setPalette(paletteWithCounts);
      }, 50);
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
      setSpotlightColorId(null);
      setGridHistory([]);
      setGridFuture([]);
      setConfig(DEFAULT_CONFIG);
      handleSelectSample(SAMPLE_IMAGES[0]);
    }
  };

  const handleLoadProjectJSON = (project: CraftProject) => {
    setConfig(project.gridConfig);
    setGridData(project.gridData);
    setPalette(project.palette);
    setCompletedCells(project.completedCells || {});
    setGridHistory([]);
    setGridFuture([]);
  };

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
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenStarterGallery={() => setIsStarterGalleryOpen(true)}
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
              aspectRatio={aspectRatio}
            />
          </div>
        )}

        {/* Center Interactive Craft Canvas */}
        <CraftCanvas
          gridData={gridData}
          palette={palette}
          config={config}
          spotlightColorId={spotlightColorId}
          activeColorIndex={activeColorIndex}
          completedCells={completedCells}
          onToggleCellCompleted={handleToggleCellCompleted}
          onPaintCell={handlePaintCell}
          canUndo={gridHistory.length > 0}
          canRedo={gridFuture.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onBeforePencilStroke={handleBeforePencilStroke}
          onInspectSourceImage={() => handleOpenInspect(sourceImageDataUrl || sourceImage?.src || '', 'Source Picture')}
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
              onSelectColor={(idx) => setActiveColorIndex(idx)}
              onToggleSpotlight={handleToggleSpotlight}
              onUpdateColorHex={handleUpdateColorHex}
              onToggleLockColor={handleToggleLockColor}
              onCleanConfetti={handleCleanConfetti}
              onClose={() => setIsMobilePaletteOpen(false)}
            />
          </div>
        )}

        {/* Mobile & Tablet Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-1 flex items-center justify-around shadow-2xl">
          <button
            onClick={() => {
              setIsMobilePaletteOpen(false);
              setIsMobileControlsOpen((prev) => !prev);
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
              isMobileControlsOpen
                ? 'text-indigo-400 bg-indigo-500/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Settings</span>
          </button>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-purple-400 hover:text-purple-300 transition"
          >
            <Wand2 className="w-4 h-4" />
            <span className="text-[10px] font-semibold">AI Draw</span>
          </button>

          <button
            onClick={() => setIsStarterGalleryOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-pink-400 hover:text-pink-300 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Starters</span>
          </button>

          <button
            onClick={() => {
              setIsMobileControlsOpen(false);
              setIsMobilePaletteOpen((prev) => !prev);
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition relative ${
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
        </nav>

        {/* Drag & Drop Overlay */}
        {isDraggingFile && (
          <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center border-4 border-dashed border-indigo-400">
            <span className="text-4xl mb-2">📸</span>
            <h3 className="text-xl font-bold text-white">Drop picture here to pixelate!</h3>
            <p className="text-sm text-indigo-300">Supports PNG, JPG, WebP, SVG</p>
          </div>
        )}
      </main>

      {/* Export & Print Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        gridData={gridData}
        palette={palette}
        config={config}
        completedCells={completedCells}
      />

      {/* Starter Patterns & Inspiration Gallery Modal */}
      <StarterGalleryModal
        isOpen={isStarterGalleryOpen}
        onClose={() => setIsStarterGalleryOpen(false)}
        onSelectStarter={(sample, craftType) => {
          if (craftType) {
            handleUpdateConfig({ craftType });
          }
          handleSelectSample(sample);
        }}
        onOpenAiGenerator={() => setIsAiModalOpen(true)}
      />

      {/* Ask AI to Generate Picture Modal with History */}
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

      {/* Full High-Resolution Image Inspection Modal */}
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

      {/* Image Crop & Cut Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageUrl={cropImageUrl || sourceImageDataUrl || sourceImage?.src || ''}
        onApplyCrop={handleApplyCrop}
        gridAspectRatio={config.width / Math.max(1, config.height)}
      />

      {/* Uploaded & AI Picture History Gallery Modal */}
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

      {/* Help & Guide Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
