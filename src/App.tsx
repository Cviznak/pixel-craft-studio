import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { CrochetWrittenInstructionsModal } from './components/CrochetWrittenInstructionsModal';
import { NewCanvasModal } from './components/NewCanvasModal';
import { SocialCardModal } from './components/SocialCardModal';
import { SizeAndFrameModal } from './components/SizeAndFrameModal';
import { TimelapseModal } from './components/TimelapseModal';
import { PixelTextModal } from './components/PixelTextModal';
import { MyStashModal } from './components/MyStashModal';
import { StitchCompanionModal } from './components/StitchCompanionModal';
import { getMyStash } from './utils/stashManager';
import { hexToRgb } from './utils/colorUtils';
import { 
  createPaletteFromPreset, 
  createBlankCanvasGrid, 
  generateCanvasDataUrl 
} from './utils/pixelStudioPalettes';
import { getCraftSymbol } from './utils/symbols';
import { cleanConfettiColors } from './utils/paletteOperations';
import { getRouteByPath, getPathForCraft, updateDocumentMeta } from './utils/craftRoutes';
import { SlidersHorizontal, Sparkles, Wand2, Palette, Paintbrush, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [gridData, setGridData] = useState<number[][]>([]);
  const [spotlightColorId, setSpotlightColorId] = useState<string | null>(null);
  const [activeColorIndex, setActiveColorIndex] = useState<number>(0);
  const [completedCells, setCompletedCells] = useState<CellProgress>({});
  const [hasTransparency, setHasTransparency] = useState<boolean>(false);
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
  const sourceImageRef = useRef<HTMLImageElement | null>(sourceImage);
  const reprocessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestConfigRef.current = config;
  }, [config]);

  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

  useEffect(() => {
    sourceImageRef.current = sourceImage;
  }, [sourceImage]);

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
    setGridData(newGrid);
    setCompletedCells({});
    setGridHistory([]);
    setGridFuture([]);
  }, []);

  // Load saved state on mount (restores on page refresh)
  useEffect(() => {
    const restoreState = async () => {
      try {
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

  // Synchronize browser URL route with active craft and dynamic SEO metadata
  useEffect(() => {
    const route = getRouteByPath(location.pathname);
    if (route) {
      if (latestConfigRef.current.craftType !== route.craftType) {
        const next = { ...latestConfigRef.current, craftType: route.craftType };
        latestConfigRef.current = next;
        setConfig(next);
      }
      updateDocumentMeta(route);
    } else if (location.pathname === '/gallery') {
      setIsStarterGalleryOpen(true);
      updateDocumentMeta(null);
    } else {
      updateDocumentMeta(null);
    }
  }, [location.pathname]);

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
    setGridData(newGrid);
    setPalette(updatedPalette);
    paletteRef.current = updatedPalette;
    setActiveColorIndex(initialActiveColor);
    setCompletedCells({});
    setSpotlightColorId(null);
    setGridHistory([]);
    setGridFuture([]);

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
  }, [palette, showToast]);

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
    setGridData(newGrid);
  }, []);

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

  // Handle Stamping Pixel Text onto Canvas
  const handleStampText = useCallback((textMatrix: number[][], colorIndex: number, startX: number, startY: number) => {
    handleBeforePencilStroke();
    setGridData((prev) => {
      const next = prev.map((row) => [...row]);
      for (let r = 0; r < textMatrix.length; r++) {
        for (let c = 0; c < textMatrix[r].length; c++) {
          if (textMatrix[r][c] === 1) {
            const y = startY + r;
            const x = startX + c;
            if (y >= 0 && y < next.length && x >= 0 && x < next[0].length) {
              next[y][x] = colorIndex;
            }
          }
        }
      }
      return next;
    });
    showToast('Stamped pixel text onto canvas! ✨');
  }, [handleBeforePencilStroke, showToast]);

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
    setGridData(newGrid);
    setCompletedCells({});
    showToast(`Created new text canvas (${width}×${height}) ✨`);
  }, [handleBeforePencilStroke, handleUpdateConfig, showToast]);

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

  const handlePaintCell = (x: number, y: number, colorIndex: number) => {
    if (y < 0 || y >= gridData.length || x < 0 || x >= gridData[0].length) return;
    setGridData((prev) => {
      if (prev[y]?.[x] === colorIndex) return prev;
      const next = prev.map((row) => [...row]);
      next[y][x] = colorIndex;
      return next;
    });
  };

  const handleBatchPaintCells = useCallback((updates: { x: number; y: number; colorIndex: number }[]) => {
    if (updates.length === 0) return;
    setGridData((prev) => {
      if (prev.length === 0) return prev;
      let next: number[][] | null = null;
      let changed = false;
      for (const { x, y, colorIndex } of updates) {
        if (y >= 0 && y < prev.length && x >= 0 && x < prev[0].length) {
          if (prev[y][x] !== colorIndex) {
            if (!next) {
              next = prev.map((row) => [...row]);
            }
            next[y][x] = colorIndex;
            changed = true;
          }
        }
      }
      return changed && next ? next : prev;
    });
  }, []);

  // Feature 1: Canvas Transforms (Auto-Center, Nudge, Flip, Rotate)
  const handleTransformGrid = useCallback(
    (
      newGrid: number[][],
      newCompletedCells?: CellProgress,
      newWidth?: number,
      newHeight?: number
    ) => {
      setGridData(newGrid);
      if (newCompletedCells !== undefined) {
        setCompletedCells(newCompletedCells);
      }
      if (newWidth && newHeight && (newWidth !== config.width || newHeight !== config.height)) {
        const updatedConfig = { ...config, width: newWidth, height: newHeight };
        setConfig(updatedConfig);
        latestConfigRef.current = updatedConfig;
        setAspectRatio(newWidth / newHeight);
      }
      const previewDataUrl = generateCanvasDataUrl(newGrid, palette);
      if (previewDataUrl) {
        setSourceImageDataUrl(previewDataUrl);
        const img = new Image();
        img.onload = () => {
          setSourceImage(img);
          sourceImageRef.current = img;
        };
        img.src = previewDataUrl;
      }
      showToast('✨ Canvas transformed!');
    },
    [config, palette, showToast]
  );

  // Feature 2: Global Color Swap / Recolor Tool
  const handleSwapColor = useCallback(
    (sourceIndex: number, targetIndex: number) => {
      if (sourceIndex === targetIndex) return;
      handleBeforePencilStroke();
      setGridData((prev) => {
        return prev.map((row) =>
          row.map((cell) => (cell === sourceIndex ? targetIndex : cell))
        );
      });
      const sourceName = palette[sourceIndex]?.name || palette[sourceIndex]?.code || palette[sourceIndex]?.hex;
      const targetName = palette[targetIndex]?.name || palette[targetIndex]?.code || palette[targetIndex]?.hex;
      showToast(`🔄 Swapped all ${sourceName} stitches to ${targetName}!`);
    },
    [handleBeforePencilStroke, palette, showToast]
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
      setPalette(newPalette);
      paletteRef.current = newPalette;
      setGridData((prev) =>
        prev.map((row) => row.map((cell) => (cell === sourceIndex ? targetIndex : cell)))
      );
      showToast(`🎨 Recaptured stitches into new color ${newHex}!`);
    },
    [handleBeforePencilStroke, palette, showToast]
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
    if (img) {
      setTimeout(() => {
        const curConfig = latestConfigRef.current;
        const { gridData: newGrid, paletteWithCounts } = processImageToGrid(
          img,
          curConfig.width,
          curConfig.height,
          updatedPalette.length > 0 ? updatedPalette : paletteRef.current,
          curConfig
        );
        setGridData(newGrid);
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
        onOpenSocialCardModal={() => setIsSocialCardOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenStarterGallery={() => setIsStarterGalleryOpen(true)}
        onOpenNewCanvasModal={() => setIsNewCanvasModalOpen(true)}
        onOpenSizeAndFrameModal={() => setIsSizeAndFrameOpen(true)}
        onOpenTimelapseModal={() => setIsTimelapseOpen(true)}
        onOpenPixelTextModal={() => setIsPixelTextOpen(true)}
        onOpenMyStashModal={() => setIsMyStashOpen(true)}
        onOpenStitchCompanionModal={() => setIsStitchCompanionOpen(true)}
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
          showPegboardLines={showPegboardLines}
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
              onAddColor={handleAddCustomColor}
              onSwapColor={handleSwapColor}
              onSwapWithNewColor={handleSwapWithNewColor}
              onToggleCollapse={() => setIsRightPanelOpen(false)}
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
            onClick={() => setIsNewCanvasModalOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-amber-400 hover:text-amber-300 transition"
          >
            <Paintbrush className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Draw</span>
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

      {/* Export & Print Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        gridData={gridData}
        palette={palette}
        config={config}
        completedCells={completedCells}
        onOpenWrittenInstructions={() => {
          setIsExportOpen(false);
          setIsWrittenInstructionsOpen(true);
        }}
        onOpenSocialCard={() => {
          setIsExportOpen(false);
          setIsSocialCardOpen(true);
        }}
      />

      {/* Tapestry Crochet & Alpha Knot Written Row-by-Row Instructions Modal */}
      <CrochetWrittenInstructionsModal
        isOpen={isWrittenInstructionsOpen}
        onClose={() => setIsWrittenInstructionsOpen(false)}
        gridData={gridData}
        palette={palette}
        projectName="Pixel Craft Pattern"
        craftType={config.craftType}
      />

      {/* Starter Patterns & Inspiration Gallery Modal */}
      <StarterGalleryModal
        isOpen={isStarterGalleryOpen}
        onClose={() => {
          setIsStarterGalleryOpen(false);
          if (location.pathname === '/gallery') {
            navigate(getPathForCraft(config.craftType));
          }
        }}
        onSelectStarter={(sample, craftType) => {
          if (craftType) {
            handleUpdateConfig({ craftType });
          }
          handleSelectSample(sample);
          if (location.pathname === '/gallery') {
            navigate(getPathForCraft(craftType || config.craftType));
          }
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

      {/* New Pixel Canvas Modal */}
      <NewCanvasModal
        isOpen={isNewCanvasModalOpen}
        onClose={() => setIsNewCanvasModalOpen(false)}
        currentPalette={palette}
        currentCraftType={config.craftType}
        onCreateCanvas={handleCreateBlankCanvas}
      />

      {/* Aesthetic Social Card Generator Modal */}
      <SocialCardModal
        isOpen={isSocialCardOpen}
        onClose={() => setIsSocialCardOpen(false)}
        gridData={gridData}
        palette={palette}
        config={config}
        defaultTitle={lastAiPrompt || 'My Pixel Craft Pattern'}
      />

      {/* Finished Size & Framing Calculator Modal */}
      <SizeAndFrameModal
        isOpen={isSizeAndFrameOpen}
        onClose={() => setIsSizeAndFrameOpen(false)}
        gridData={gridData}
        palette={palette}
        craftType={config.craftType}
        showPegboardLines={showPegboardLines}
        onTogglePegboardLines={() => setShowPegboardLines((prev) => !prev)}
      />

      {/* Social Media Animated Timelapse Video Generator */}
      <TimelapseModal
        isOpen={isTimelapseOpen}
        onClose={() => setIsTimelapseOpen(false)}
        gridData={gridData}
        palette={palette}
        craftType={config.craftType}
        defaultTitle={lastAiPrompt || 'Pixel Craft Pattern'}
      />

      {/* Pixel Text, Name & Monogram Tool */}
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

      {/* Physical Craft Floss & Bead Stash Inventory */}
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
        }}
      />

      {/* Stitch Companion Hands-Free Focus Mode */}
      <StitchCompanionModal
        isOpen={isStitchCompanionOpen}
        onClose={() => setIsStitchCompanionOpen(false)}
        gridData={gridData}
        palette={palette}
        completedCells={completedCells}
        onBatchSetCellsCompleted={handleBatchSetCellsCompleted}
      />
    </div>
  );
}
