import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { GridConfig, PaletteColor, CellProgress, BackstitchLine } from '../types/craft';
import { getContrastingTextColor } from '../utils/colorUtils';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  CheckSquare, 
  Eye, 
  Edit3, 
  Move, 
  Sparkles,
  Undo2,
  Redo2,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Eraser,
  PaintBucket,
  Pipette,
  Slash,
  Square,
  FlipHorizontal2,
  FlipVertical2,
  RotateCw,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Focus,
  Tv,
  Check,
  Type,
  Contrast,
  Smartphone,
  Wand2,
  PenTool,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioFeedback } from '../utils/audioFeedback';
import { getGrayscaleHex } from '../utils/threadEquivalents';
import {
  autoCenterGrid,
  shiftGrid,
  flipGridHorizontal,
  flipGridVertical,
  rotateGrid
} from '../utils/canvasTransform';

export type DisplayShader = 'craft' | 'crt' | 'gameboy' | 'aida' | 'glossy_bead';

interface CraftCanvasProps {
  gridData: number[][];
  palette: PaletteColor[];
  config: GridConfig;
  spotlightColorId: string | null;
  activeColorIndex: number;
  completedCells: CellProgress;
  onToggleCellCompleted: (x: number, y: number) => void;
  onBatchSetCellsCompleted?: (updates: { x: number; y: number; completed: boolean }[]) => void;
  onPaintCell: (x: number, y: number, colorIndex: number) => void;
  onBatchPaintCells?: (updates: { x: number; y: number; colorIndex: number }[]) => void;
  onSetZoom?: (zoom: number) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onBeforePencilStroke?: () => void;
  onInspectSourceImage?: () => void;
  onSelectColor?: (index: number) => void;
  onTransformGrid?: (
    newGrid: number[][],
    newCompletedCells?: CellProgress,
    newWidth?: number,
    newHeight?: number
  ) => void;
  onOpenPixelTextModal?: () => void;
  showPegboardLines?: boolean;
  backstitches?: BackstitchLine[];
  onUpdateBackstitches?: (lines: BackstitchLine[]) => void;
}

export type CanvasTool = 'pan' | 'tracker' | 'pencil' | 'eraser' | 'bucket' | 'eyedropper' | 'line' | 'rectangle' | 'wand' | 'backstitch';

function pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Bresenham's line algorithm for smooth continuous drag-tracking and drawing without gaps
function getLineCells(x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let currX = x0;
  let currY = y0;

  while (true) {
    cells.push({ x: currX, y: currY });
    if (currX === x1 && currY === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      currX += sx;
    }
    if (e2 < dx) {
      err += dx;
      currY += sy;
    }
  }

  return cells;
}

// Rectangle cells generator for outline or filled boxes
function getRectCells(x0: number, y0: number, x1: number, y1: number, filled = false): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  if (filled) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        cells.push({ x, y });
      }
    }
  } else {
    for (let x = minX; x <= maxX; x++) {
      cells.push({ x, y: minY });
      if (minY !== maxY) cells.push({ x, y: maxY });
    }
    for (let y = minY + 1; y < maxY; y++) {
      cells.push({ x: minX, y });
      if (minX !== maxX) cells.push({ x: maxX, y });
    }
  }
  return cells;
}

export const CraftCanvas: React.FC<CraftCanvasProps> = ({
  gridData,
  palette,
  config,
  spotlightColorId,
  activeColorIndex,
  completedCells,
  onToggleCellCompleted,
  onBatchSetCellsCompleted,
  onPaintCell,
  onBatchPaintCells,
  onSetZoom,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onBeforePencilStroke,
  onInspectSourceImage,
  onSelectColor,
  onTransformGrid,
  onOpenPixelTextModal,
  showPegboardLines = false,
  backstitches = [],
  onUpdateBackstitches,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Transform popover & wrap state
  const [isTransformOpen, setIsTransformOpen] = useState(false);
  const [wrapShift, setWrapShift] = useState(false);

  // Magic Wand & Backstitch states
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [wandMode, setWandMode] = useState<'contiguous' | 'all'>('contiguous');
  const [backstitchStart, setBackstitchStart] = useState<{ x: number; y: number } | null>(null);
  const [backstitchEnd, setBackstitchEnd] = useState<{ x: number; y: number } | null>(null);

  // Retro display shaders & authentic textures
  const [activeShader, setActiveShader] = useState<DisplayShader>('craft');
  const [isShaderOpen, setIsShaderOpen] = useState(false);

  // Tonal Contrast / Grayscale Value Check mode
  const [isValueCheckActive, setIsValueCheckActive] = useState<boolean>(false);

  // Screen Wake Lock (Couch Mode - keeps phone/tablet display awake)
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  const toggleWakeLock = async () => {
    if (isWakeLockActive) {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch {}
        wakeLockRef.current = null;
      }
      setIsWakeLockActive(false);
    } else {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setIsWakeLockActive(true);
        }
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);

  // Viewport transforms: pan and zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Persistent refs for smooth 60fps pinch-to-zoom on touchscreens without listener resets
  const currentZoomRef = useRef(zoom);
  currentZoomRef.current = zoom;

  const currentPanRef = useRef(pan);
  currentPanRef.current = pan;

  const pinchStateRef = useRef<{
    initialDist: number;
    startZoom: number;
    initialMidpoint: { x: number; y: number };
    startPan: { x: number; y: number };
  } | null>(null);
  
  // Active tool & Studio capabilities
  const [tool, setToolState] = useState<CanvasTool>('pan');
  const lastToolRef = useRef<CanvasTool>('pencil');

  const setTool = useCallback((newTool: CanvasTool) => {
    if (tool !== 'eyedropper') {
      lastToolRef.current = tool;
    }
    setToolState(newTool);
  }, [tool]);

  const [isMirrorMode, setIsMirrorMode] = useState<boolean>(false);
  const [previewCells, setPreviewCells] = useState<{ x: number; y: number }[] | null>(null);
  const dragShapeStartRef = useRef<{ x: number; y: number } | null>(null);

  // Transform actions with automatic undo snapshotting & sound feedback
  const handleAutoCenter = useCallback(() => {
    if (!onTransformGrid) return;
    const { newGrid, newCompletedCells, moved } = autoCenterGrid(gridData, completedCells);
    if (!moved) return;
    onBeforePencilStroke?.();
    onTransformGrid(newGrid, newCompletedCells);
    audioFeedback.playCelebrationChime();
  }, [gridData, completedCells, onTransformGrid, onBeforePencilStroke]);

  const handleNudge = useCallback((dx: number, dy: number) => {
    if (!onTransformGrid) return;
    const { newGrid, newCompletedCells } = shiftGrid(gridData, dx, dy, completedCells, wrapShift);
    onBeforePencilStroke?.();
    onTransformGrid(newGrid, newCompletedCells);
    audioFeedback.playStitchSound(true);
  }, [gridData, completedCells, wrapShift, onTransformGrid, onBeforePencilStroke]);

  const handleFlipHorizontal = useCallback(() => {
    if (!onTransformGrid) return;
    onBeforePencilStroke?.();
    const { newGrid, newCompletedCells } = flipGridHorizontal(gridData, completedCells);
    onTransformGrid(newGrid, newCompletedCells);
    audioFeedback.playStitchSound(true);
  }, [gridData, completedCells, onTransformGrid, onBeforePencilStroke]);

  const handleFlipVertical = useCallback(() => {
    if (!onTransformGrid) return;
    onBeforePencilStroke?.();
    const { newGrid, newCompletedCells } = flipGridVertical(gridData, completedCells);
    onTransformGrid(newGrid, newCompletedCells);
    audioFeedback.playStitchSound(true);
  }, [gridData, completedCells, onTransformGrid, onBeforePencilStroke]);

  const handleRotate = useCallback((direction: 'cw' | 'ccw') => {
    if (!onTransformGrid) return;
    onBeforePencilStroke?.();
    const { newGrid, newCompletedCells, newWidth, newHeight } = rotateGrid(gridData, direction, completedCells);
    onTransformGrid(newGrid, newCompletedCells, newWidth, newHeight);
    audioFeedback.playCelebrationChime();
  }, [gridData, completedCells, onTransformGrid, onBeforePencilStroke]);

  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  // Drag-and-track and drag-and-draw gesture state
  const dragTrackModeRef = useRef<boolean | null>(null);
  const lastTrackedCellRef = useRef<{ x: number; y: number } | null>(null);
  const lastPaintedCellRef = useRef<{ x: number; y: number } | null>(null);

  const gridHeight = gridData.length;
  const gridWidth = gridHeight > 0 ? gridData[0].length : 0;
  const baseCellSize = config.cellSize || 24;

  // Auto-fit to viewport on initial load or grid dimension change
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || gridWidth === 0 || gridHeight === 0) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 60;
    const targetW = clientWidth - padding;
    const targetH = clientHeight - padding;

    const rulerOffset = config.showRulers ? 24 : 0;
    const totalGridW = gridWidth * baseCellSize + rulerOffset;
    const totalGridH = gridHeight * baseCellSize + rulerOffset;

    const scaleX = targetW / totalGridW;
    const scaleY = targetH / totalGridH;
    const newZoom = Math.min(2.5, Math.max(0.2, Math.min(scaleX, scaleY)));

    setZoom(newZoom);
    setPan({
      x: (clientWidth - totalGridW * newZoom) / 2 + rulerOffset * newZoom,
      y: (clientHeight - totalGridH * newZoom) / 2 + rulerOffset * newZoom,
    });
  }, [gridWidth, gridHeight, baseCellSize, config.showRulers]);

  useEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  // Main Render Loop onto Canvas
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas || gridWidth === 0 || gridHeight === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const container = containerRef.current;
      const width = container ? container.clientWidth : 800;
      const height = container ? container.clientHeight : 600;

      // Only resize canvas buffer when dimensions actually change (prevents GPU memory reallocation lag)
      const targetW = Math.round(width * dpr);
      const targetH = Math.round(height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      if (canvas.style.width !== `${width}px`) canvas.style.width = `${width}px`;
      if (canvas.style.height !== `${height}px`) canvas.style.height = `${height}px`;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Apply pan and zoom transforms
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const cellSize = baseCellSize;
      const totalW = gridWidth * cellSize;
      const totalH = gridHeight * cellSize;

      // Draw Background Pegboard / Fabric Texture
      if (config.craftType === 'perler') {
        // Perler pegboard transparent frosted acrylic style
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, totalW, totalH);
      } else if (config.craftType === 'cross-stitch') {
        // Natural Aida cloth oatmeal/cream
        ctx.fillStyle = '#faf8f5';
        ctx.fillRect(0, 0, totalW, totalH);
      } else if (config.craftType === 'alpha') {
        // Alpha macrame / knotting board backing
        ctx.fillStyle = '#0b1120';
        ctx.fillRect(0, 0, totalW, totalH);
      } else if (config.craftType === 'loom') {
        // Dark velvet beading mat backing
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, totalW, totalH);
      } else if (config.craftType === 'knitting') {
        // Heather charcoal wool backing
        ctx.fillStyle = '#171e29';
        ctx.fillRect(0, 0, totalW, totalH);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, totalW, totalH);
      }

      // Determine if spotlight mode is active
      let spotlightIndex: number | null = null;
      if (spotlightColorId !== null) {
        spotlightIndex = palette.findIndex(c => c.id === spotlightColorId);
      }

      // Viewport culling: only draw cells visible within viewport (+1 buffer margin)
      const minCol = Math.max(0, Math.floor(-pan.x / (cellSize * zoom)) - 1);
      const maxCol = Math.min(gridWidth - 1, Math.ceil((width - pan.x) / (cellSize * zoom)) + 1);
      const minRow = Math.max(0, Math.floor(-pan.y / (cellSize * zoom)) - 1);
      const maxRow = Math.min(gridHeight - 1, Math.ceil((height - pan.y) / (cellSize * zoom)) + 1);

      // Draw each visible cell
      for (let y = minRow; y <= maxRow; y++) {
        for (let x = minCol; x <= maxCol; x++) {
        const colorIdx = gridData[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        if (colorIdx === -1) {
          // Empty transparent cell (no stitch/bead placed)
          if (config.craftType === 'perler') {
            // Draw empty peg on the pegboard
            const radius = cellSize * 0.44;
            const centerX = px + cellSize / 2;
            const centerY = py + cellSize / 2;
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.16, 0, Math.PI * 2);
            ctx.fill();
          } else if (config.craftType === 'cross-stitch') {
            // Empty Aida fabric weave
            ctx.fillStyle = '#f1ece1';
            ctx.fillRect(px, py, cellSize, cellSize);
            ctx.fillStyle = '#d5cebf';
            ctx.fillRect(px + cellSize * 0.46, py + cellSize * 0.46, cellSize * 0.08, cellSize * 0.08);
          } else {
            // Subtle transparent checkerboard
            const isEven = (x + y) % 2 === 0;
            ctx.fillStyle = isEven ? '#1e293b' : '#0f172a';
            ctx.fillRect(px, py, cellSize, cellSize);
          }

          if (config.showGridLines && cellSize * zoom >= 6) {
            ctx.strokeStyle = 'rgba(150, 150, 150, 0.15)';
            ctx.lineWidth = 1 / zoom;
            ctx.strokeRect(px, py, cellSize, cellSize);
          }
          continue;
        }

        const color = palette[colorIdx];
        if (!color) continue;

        const effectiveHex = isValueCheckActive
          ? getGrayscaleHex(color.r, color.g, color.b)
          : color.hex;

        const isDone = !!completedCells[`${x},${y}`];
        const isSpotlightMatch = spotlightIndex === null || spotlightIndex === colorIdx;

        // Dim if spotlight is active and doesn't match
        ctx.save();
        if (spotlightIndex !== null && !isSpotlightMatch) {
          ctx.globalAlpha = 0.15;
        }

        // Render based on Craft Type
        if (config.craftType === 'perler') {
          // Circular Perler bead with 3D shine and center peg hole
          const radius = cellSize * 0.44;
          const centerX = px + cellSize / 2;
          const centerY = py + cellSize / 2;

          // Peg hole underneath
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * 0.38, 0, Math.PI * 2);
          ctx.fill();

          // Bead outer body
          ctx.fillStyle = effectiveHex;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();

          // Bead 3D highlight
          const grad = ctx.createRadialGradient(
            centerX - radius * 0.3,
            centerY - radius * 0.3,
            radius * 0.1,
            centerX,
            centerY,
            radius
          );
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
          grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.05)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();

          // Inner hole
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * 0.32, 0, Math.PI * 2);
          ctx.fill();
        } else if (config.craftType === 'cross-stitch') {
          // Aida fabric weave background hole
          ctx.fillStyle = '#f1ece1';
          ctx.fillRect(px, py, cellSize, cellSize);

          // Realistic stitched 'X'
          const pad = cellSize * 0.1;
          ctx.strokeStyle = effectiveHex;
          ctx.lineWidth = Math.max(2, cellSize * 0.22);
          ctx.lineCap = 'round';

          // First diagonal /
          ctx.beginPath();
          ctx.moveTo(px + pad, py + cellSize - pad);
          ctx.lineTo(px + cellSize - pad, py + pad);
          ctx.stroke();

          // Second diagonal \ on top with slight shadow
          ctx.beginPath();
          ctx.moveTo(px + pad, py + pad);
          ctx.lineTo(px + cellSize - pad, py + cellSize - pad);
          ctx.stroke();

          // Subtle thread sheen
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = Math.max(1, cellSize * 0.07);
          ctx.beginPath();
          ctx.moveTo(px + pad + 1, py + pad);
          ctx.lineTo(px + cellSize - pad, py + cellSize - pad - 1);
          ctx.stroke();
        } else if (config.craftType === 'crochet') {
          // Authentic Tapestry Crochet Stitch Look
          // Base yarn fill
          ctx.fillStyle = effectiveHex;
          ctx.fillRect(px, py, cellSize, cellSize);

          // Crochet yarn V-stitch strands and loop texture
          const yarnWidth = Math.max(1.5, cellSize * 0.18);
          ctx.lineWidth = yarnWidth;
          ctx.lineCap = 'round';

          // Strand shadow
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
          ctx.beginPath();
          ctx.moveTo(px + cellSize * 0.22, py + cellSize * 0.2);
          ctx.lineTo(px + cellSize * 0.5, py + cellSize * 0.88);
          ctx.lineTo(px + cellSize * 0.78, py + cellSize * 0.2);
          ctx.stroke();

          // Strand yarn sheen / highlight
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.beginPath();
          ctx.moveTo(px + cellSize * 0.25, py + cellSize * 0.16);
          ctx.lineTo(px + cellSize * 0.5, py + cellSize * 0.84);
          ctx.stroke();

          // Top stitch loop
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
          ctx.beginPath();
          ctx.arc(px + cellSize * 0.5, py + cellSize * 0.18, cellSize * 0.28, Math.PI, 0);
          ctx.stroke();
        } else if (config.craftType === 'alpha') {
          // Authentic Alpha Friendship Bracelet Knot Texture (Horizontal Double Half-Hitch Knot)
          const padY = cellSize * 0.08;
          const padX = cellSize * 0.04;
          const knotW = cellSize - padX * 2;
          const knotH = cellSize - padY * 2;
          const radius = Math.min(knotW, knotH) * 0.35;

          // Vertical warp background thread guide behind knot
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = Math.max(1, cellSize * 0.1);
          ctx.beginPath();
          ctx.moveTo(px + cellSize / 2, py);
          ctx.lineTo(px + cellSize / 2, py + cellSize);
          ctx.stroke();

          // Knot pill body
          ctx.fillStyle = effectiveHex;
          ctx.beginPath();
          ctx.roundRect(px + padX, py + padY, knotW, knotH, radius);
          ctx.fill();

          // Double half-hitch horizontal ridge (shows the knot structure)
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.lineWidth = Math.max(1, cellSize * 0.12);
          ctx.beginPath();
          ctx.moveTo(px + padX + 2, py + cellSize * 0.52);
          ctx.lineTo(px + cellSize - padX - 2, py + cellSize * 0.52);
          ctx.stroke();

          // Knot top highlight
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
          ctx.lineWidth = Math.max(0.8, cellSize * 0.1);
          ctx.beginPath();
          ctx.moveTo(px + padX + 3, py + padY + 2);
          ctx.lineTo(px + cellSize - padX - 3, py + padY + 2);
          ctx.stroke();
        } else if (config.craftType === 'knitting') {
          // Authentic Stockinette Knitting Texture (Interlocking V-Stitch Loop)
          ctx.fillStyle = effectiveHex;
          ctx.fillRect(px, py, cellSize, cellSize);

          const legW = Math.max(1.2, cellSize * 0.18);
          // Left strand of the V (curves from top-left toward bottom-center)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
          ctx.lineWidth = legW;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(px + cellSize * 0.22, py + cellSize * 0.1);
          ctx.quadraticCurveTo(px + cellSize * 0.35, py + cellSize * 0.55, px + cellSize * 0.5, py + cellSize * 0.88);
          ctx.stroke();

          // Right strand of the V (curves from top-right toward bottom-center)
          ctx.beginPath();
          ctx.moveTo(px + cellSize * 0.78, py + cellSize * 0.1);
          ctx.quadraticCurveTo(px + cellSize * 0.65, py + cellSize * 0.55, px + cellSize * 0.5, py + cellSize * 0.88);
          ctx.stroke();

          // Center groove shadow (between the two legs of the V)
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.lineWidth = Math.max(1, cellSize * 0.12);
          ctx.beginPath();
          ctx.moveTo(px + cellSize * 0.5, py + cellSize * 0.25);
          ctx.lineTo(px + cellSize * 0.5, py + cellSize * 0.82);
          ctx.stroke();

          // Interlocking loop top curve shadow
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.lineWidth = Math.max(0.8, cellSize * 0.1);
          ctx.beginPath();
          ctx.arc(px + cellSize * 0.5, py + cellSize * 0.12, cellSize * 0.26, Math.PI, 0);
          ctx.stroke();
        } else if (config.craftType === 'loom') {
          // Miyuki Delica Glass Cylinder Seed Bead Simulation
          const padX = cellSize * 0.05;
          const padY = cellSize * 0.08;
          const bw = cellSize - padX * 2;
          const bh = cellSize - padY * 2;
          const r = Math.min(3, bh * 0.25);

          // Bead base cylinder body with slight corner radius
          ctx.fillStyle = effectiveHex;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(px + padX, py + padY, bw, bh, r);
          } else {
            ctx.rect(px + padX, py + padY, bw, bh);
          }
          ctx.fill();

          // Glass Cylindrical 3D Specular Highlight (gleam along upper cylinder edge)
          const grad = ctx.createLinearGradient(px, py + padY, px, py + padY + bh);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
          grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.15)');
          grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.05)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(px + padX, py + padY, bw, bh, r);
          } else {
            ctx.rect(px + padX, py + padY, bw, bh);
          }
          ctx.fill();

          // Bead inner thread hole / pass-through core slit
          if (cellSize * zoom >= 12) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            const holeH = Math.max(1.5, bh * 0.18);
            const holeW = bw * 0.55;
            ctx.beginPath();
            ctx.ellipse(
              px + cellSize / 2,
              py + cellSize / 2,
              holeW / 2,
              holeH / 2,
              0,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Inner thread white glimmer
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(px + cellSize / 2 - holeW * 0.35, py + cellSize / 2 - 0.5, holeW * 0.7, 1);
          }

          // Delicate outer glass edge
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.lineWidth = Math.max(0.6, cellSize * 0.05);
          ctx.stroke();
        } else if (config.craftType === 'diamond') {
          // Diamond painting faceted drill
          const pad = cellSize * 0.06;
          ctx.fillStyle = effectiveHex;
          ctx.fillRect(px + pad, py + pad, cellSize - pad * 2, cellSize - pad * 2);

          // Facet specular sparkles
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.beginPath();
          ctx.moveTo(px + pad, py + pad);
          ctx.lineTo(px + cellSize / 2, py + cellSize / 2);
          ctx.lineTo(px + cellSize - pad, py + pad);
          ctx.fill();

          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.beginPath();
          ctx.moveTo(px + pad, py + cellSize - pad);
          ctx.lineTo(px + cellSize / 2, py + cellSize / 2);
          ctx.lineTo(px + cellSize - pad, py + cellSize - pad);
          ctx.fill();
        } else {
          // Clean pixel art
          ctx.fillStyle = effectiveHex;
          ctx.fillRect(px, py, cellSize, cellSize);
        }

        // Draw Craft Symbol if enabled or zoomed in enough
        if (config.showSymbols && cellSize * zoom >= 14) {
          const textColor = isValueCheckActive
            ? (0.299 * color.r + 0.587 * color.g + 0.114 * color.b > 128 ? '#000000' : '#ffffff')
            : getContrastingTextColor(color.r, color.g, color.b);
          ctx.fillStyle = textColor;
          ctx.font = `bold ${Math.max(9, Math.floor(cellSize * 0.52))}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(color.symbol, px + cellSize / 2, py + cellSize / 2 + 1);
        }

        // Cell boundary
        if (config.showGridLines && cellSize * zoom >= 6) {
          ctx.strokeStyle = config.craftType === 'pixel' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(150, 150, 150, 0.25)';
          ctx.lineWidth = 1 / zoom;
          ctx.strokeRect(px, py, cellSize, cellSize);
        }

        // Completed marker in Tracker mode
        if (isDone) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.45)'; // emerald transparent
          ctx.fillRect(px, py, cellSize, cellSize);

          // Draw Checkmark
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(2, cellSize * 0.14);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(px + cellSize * 0.25, py + cellSize * 0.52);
          ctx.lineTo(px + cellSize * 0.44, py + cellSize * 0.72);
          ctx.lineTo(px + cellSize * 0.75, py + cellSize * 0.28);
          ctx.stroke();
        }

        // Spotlight glowing outline for matching cells
        if (spotlightIndex !== null && isSpotlightMatch) {
          ctx.strokeStyle = '#f59e0b'; // amber glow
          ctx.lineWidth = 2.5 / zoom;
          ctx.strokeRect(px, py, cellSize, cellSize);
        }

        ctx.restore();
      }
    }

    // Draw 10x10 Major Grid Lines (The universal craft pattern standard)
    if (config.show10x10MajorLines) {
      ctx.strokeStyle = '#dc2626'; // Red or bold dark grid line
      ctx.lineWidth = 2 / zoom;

      for (let x = 0; x <= gridWidth; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, totalH);
        ctx.stroke();
      }

      for (let y = 0; y <= gridHeight; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(totalW, y * cellSize);
        ctx.stroke();
      }
    }

    // Draw 29x29 Interlocking Pegboard Seam Lines (Perler / Hama / Artkal)
    if (showPegboardLines) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b'; // Amber dashed line
      ctx.lineWidth = 3 / zoom;
      ctx.setLineDash([8 / zoom, 4 / zoom]);

      for (let x = 29; x < gridWidth; x += 29) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, totalH);
        ctx.stroke();
      }

      for (let y = 29; y < gridHeight; y += 29) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(totalW, y * cellSize);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw On-Canvas Labeled Rulers (Columns at Top & Rows at Left)
    if (config.showRulers) {
      const rulerSize = 24;

      // 1. Top Ruler (Columns)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, -rulerSize, totalW, rulerSize);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1 / zoom;
      ctx.strokeRect(0, -rulerSize, totalW, rulerSize);

      // 2. Left Ruler (Rows)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-rulerSize, 0, rulerSize, totalH);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1 / zoom;
      ctx.strokeRect(-rulerSize, 0, rulerSize, totalH);

      // 3. Top-Left Corner Box
      ctx.fillStyle = '#030712';
      ctx.fillRect(-rulerSize, -rulerSize, rulerSize, rulerSize);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1 / zoom;
      ctx.strokeRect(-rulerSize, -rulerSize, rulerSize, rulerSize);
      ctx.fillStyle = '#64748b';
      ctx.font = `bold ${Math.max(8, Math.floor(10 / Math.max(0.7, zoom)))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('#', -rulerSize / 2, -rulerSize / 2);

      // Labeling frequency for Top Ruler based on current zoom
      const colStep = (cellSize * zoom >= 24) ? 1 : (cellSize * zoom >= 10 ? 5 : 10);
      const fontSize = Math.max(8, Math.floor(11 / Math.max(0.6, zoom)));
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`;

      for (let x = 0; x < gridWidth; x++) {
        const colNum = x + 1;
        const cx = x * cellSize;
        const isHoverCol = hoverCoord?.x === x;
        const shouldLabel = (colNum % colStep === 0) || colNum === 1 || colNum === gridWidth;

        // Active column highlight on top ruler
        if (isHoverCol) {
          ctx.fillStyle = '#4f46e5';
          ctx.fillRect(cx, -rulerSize, cellSize, rulerSize);
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${colNum}`, cx + cellSize / 2, -rulerSize / 2);
        } else if (shouldLabel) {
          ctx.fillStyle = (colNum % 10 === 0) ? '#f43f5e' : (colNum % 5 === 0 ? '#38bdf8' : '#94a3b8');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${colNum}`, cx + cellSize / 2, -rulerSize / 2);
        }

        // Column tick mark
        ctx.strokeStyle = colNum % 10 === 0 ? '#f43f5e' : (colNum % 5 === 0 ? '#0284c7' : '#1e293b');
        ctx.lineWidth = colNum % 10 === 0 ? 1.5 / zoom : 1 / zoom;
        ctx.beginPath();
        ctx.moveTo(cx + cellSize, -rulerSize * 0.4);
        ctx.lineTo(cx + cellSize, 0);
        ctx.stroke();
      }

      // Left Ruler (Rows)
      const rowStep = (cellSize * zoom >= 24) ? 1 : (cellSize * zoom >= 10 ? 5 : 10);

      for (let y = 0; y < gridHeight; y++) {
        const rowNum = y + 1;
        const cy = y * cellSize;
        const isHoverRow = hoverCoord?.y === y;
        const shouldLabel = (rowNum % rowStep === 0) || rowNum === 1 || rowNum === gridHeight;

        // Active row highlight on left ruler
        if (isHoverRow) {
          ctx.fillStyle = '#4f46e5';
          ctx.fillRect(-rulerSize, cy, rulerSize, cellSize);
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${rowNum}`, -rulerSize / 2, cy + cellSize / 2);
        } else if (shouldLabel) {
          ctx.fillStyle = (rowNum % 10 === 0) ? '#f43f5e' : (rowNum % 5 === 0 ? '#38bdf8' : '#94a3b8');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${rowNum}`, -rulerSize / 2, cy + cellSize / 2);
        }

        // Row tick mark
        ctx.strokeStyle = rowNum % 10 === 0 ? '#f43f5e' : (rowNum % 5 === 0 ? '#0284c7' : '#1e293b');
        ctx.lineWidth = rowNum % 10 === 0 ? 1.5 / zoom : 1 / zoom;
        ctx.beginPath();
        ctx.moveTo(-rulerSize * 0.4, cy + cellSize);
        ctx.lineTo(0, cy + cellSize);
        ctx.stroke();
      }
    }

    // Outer border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3 / zoom;
    ctx.strokeRect(0, 0, totalW, totalH);

    // Center Cross Marks (essential for cross-stitch center starting point)
    const midX = (gridWidth / 2) * cellSize;
    const midY = (gridHeight / 2) * cellSize;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2 / zoom;
    // Top arrow
    ctx.beginPath();
    ctx.moveTo(midX, -10);
    ctx.lineTo(midX, 0);
    ctx.stroke();
    // Left arrow
    ctx.beginPath();
    ctx.moveTo(-10, midY);
    ctx.lineTo(0, midY);
    ctx.stroke();

    // Vertical Symmetry / Mirror Line
    if (isMirrorMode && gridWidth > 1) {
      const mirrorX = (gridWidth / 2) * cellSize;
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = Math.max(1.5, 2 / zoom);
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.beginPath();
      ctx.moveTo(mirrorX, 0);
      ctx.lineTo(mirrorX, totalH);
      ctx.stroke();
      ctx.restore();
    }

    // Live shape preview overlay (Line and Rectangle tools)
    if (previewCells && previewCells.length > 0) {
      const activeColor = palette[activeColorIndex];
      const previewFill = activeColor
        ? (isValueCheckActive ? getGrayscaleHex(activeColor.r, activeColor.g, activeColor.b) : activeColor.hex)
        : '#ffffff';
      ctx.save();
      ctx.fillStyle = previewFill;
      ctx.globalAlpha = 0.6;
      for (const c of previewCells) {
        if (c.x >= 0 && c.x < gridWidth && c.y >= 0 && c.y < gridHeight) {
          ctx.fillRect(c.x * cellSize, c.y * cellSize, cellSize, cellSize);
        }
      }
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 / zoom;
      ctx.globalAlpha = 0.9;
      for (const c of previewCells) {
        if (c.x >= 0 && c.x < gridWidth && c.y >= 0 && c.y < gridHeight) {
          ctx.strokeRect(c.x * cellSize, c.y * cellSize, cellSize, cellSize);
        }
      }
      ctx.restore();
    }

    // Magic Wand Selected Cells Overlay
    if (selectedCells.size > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(34, 211, 238, 0.28)';
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = Math.max(1, 1.5 / zoom);
      selectedCells.forEach((key) => {
        const [sxStr, syStr] = key.split(',');
        const sx = parseInt(sxStr, 10);
        const sy = parseInt(syStr, 10);
        if (sx >= 0 && sx < gridWidth && sy >= 0 && sy < gridHeight) {
          ctx.fillRect(sx * cellSize, sy * cellSize, cellSize, cellSize);
          ctx.strokeRect(sx * cellSize, sy * cellSize, cellSize, cellSize);
        }
      });
      ctx.restore();
    }

    // Backstitch Overlay Layer
    if (backstitches.length > 0 || (backstitchStart && backstitchEnd)) {
      ctx.save();
      ctx.lineCap = 'round';
      for (const line of backstitches) {
        const lx1 = line.x1 * cellSize;
        const ly1 = line.y1 * cellSize;
        const lx2 = line.x2 * cellSize;
        const ly2 = line.y2 * cellSize;

        // Subtle outer halo so dark lines show clearly on dark cells
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = Math.max(2.5, cellSize * 0.22);
        ctx.beginPath();
        ctx.moveTo(lx1, ly1);
        ctx.lineTo(lx2, ly2);
        ctx.stroke();

        ctx.strokeStyle = line.colorHex;
        ctx.lineWidth = Math.max(1.5, cellSize * 0.14);
        ctx.beginPath();
        ctx.moveTo(lx1, ly1);
        ctx.lineTo(lx2, ly2);
        ctx.stroke();
      }

      if (backstitchStart && backstitchEnd) {
        const activeHex = palette[activeColorIndex]?.hex || '#f43f5e';
        ctx.strokeStyle = activeHex;
        ctx.lineWidth = Math.max(2, cellSize * 0.16);
        ctx.setLineDash([4 / zoom, 3 / zoom]);
        ctx.beginPath();
        ctx.moveTo(backstitchStart.x * cellSize, backstitchStart.y * cellSize);
        ctx.lineTo(backstitchEnd.x * cellSize, backstitchEnd.y * cellSize);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(backstitchEnd.x * cellSize, backstitchEnd.y * cellSize, Math.max(2.5, cellSize * 0.14), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Hover box indicator
    if (hoverCoord && hoverCoord.x >= 0 && hoverCoord.x < gridWidth && hoverCoord.y >= 0 && hoverCoord.y < gridHeight) {
      ctx.strokeStyle = tool === 'eyedropper' ? '#a855f7' : tool === 'eraser' ? '#f43f5e' : '#2563eb';
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(hoverCoord.x * cellSize, hoverCoord.y * cellSize, cellSize, cellSize);

      // If mirror mode is active and drawing/erasing, also draw ghost hover box on mirror cell
      if (isMirrorMode && ['pencil', 'eraser', 'line', 'rectangle'].includes(tool)) {
        const mirrorX = gridWidth - 1 - hoverCoord.x;
        if (mirrorX !== hoverCoord.x) {
          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5 / zoom;
          ctx.setLineDash([3 / zoom, 3 / zoom]);
          ctx.strokeRect(mirrorX * cellSize, hoverCoord.y * cellSize, cellSize, cellSize);
          ctx.restore();
        }
      }
    }

      ctx.restore();

      // Display Shaders & Authentic Textures post-processing overlay
      if (activeShader === 'crt') {
        ctx.save();
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.width;
        const h = canvas.height;

        // Scanlines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        for (let y = 0; y < h; y += 4 * dpr) {
          ctx.fillRect(0, y, w, 1.8 * dpr);
        }

        // Phosphor ambiance
        ctx.fillStyle = 'rgba(34, 197, 94, 0.04)';
        ctx.fillRect(0, 0, w, h);

        // Radial Vignette
        const radGrad = ctx.createRadialGradient(
          w / 2, h / 2, Math.min(w, h) * 0.42,
          w / 2, h / 2, Math.max(w, h) * 0.75
        );
        radGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0.52)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      } else if (activeShader === 'gameboy') {
        ctx.save();
        const w = canvas.width;
        const h = canvas.height;
        ctx.globalCompositeOperation = 'color';
        ctx.fillStyle = '#8bac0f';
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(15, 56, 15, 0.12)';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      } else if (activeShader === 'aida') {
        ctx.save();
        const w = canvas.width;
        const h = canvas.height;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(180, 160, 130, 0.09)';
        for (let y = 0; y < h; y += 6) {
          ctx.fillRect(0, y, w, 1);
        }
        for (let x = 0; x < w; x += 6) {
          ctx.fillRect(x, 0, 1, h);
        }
        ctx.restore();
      } else if (activeShader === 'glossy_bead') {
        ctx.save();
        const w = canvas.width;
        const h = canvas.height;
        const glossGrad = ctx.createLinearGradient(0, 0, w, h);
        glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
        glossGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.02)');
        glossGrad.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
        ctx.fillStyle = glossGrad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    gridData,
    palette,
    config,
    spotlightColorId,
    completedCells,
    zoom,
    pan,
    hoverCoord,
    gridWidth,
    gridHeight,
    baseCellSize,
    isMirrorMode,
    previewCells,
    activeColorIndex,
    tool,
    activeShader,
    isValueCheckActive,
    selectedCells,
    backstitches,
    backstitchStart,
    backstitchEnd,
  ]);

  // Coordinate conversion helper from pointer/mouse event to cell [x, y]
  const getCellFromPointer = (e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cellSize = baseCellSize;
    const cellX = Math.floor((mouseX - pan.x) / (cellSize * zoom));
    const cellY = Math.floor((mouseY - pan.y) / (cellSize * zoom));

    if (cellX >= 0 && cellX < gridWidth && cellY >= 0 && cellY < gridHeight) {
      return { x: cellX, y: cellY };
    }
    return null;
  };

  // Snaps pointer to nearest grid vertex/intersection (0..gridWidth, 0..gridHeight) for Backstitch
  const getVertexFromPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cellSize = baseCellSize;
    const vx = Math.max(0, Math.min(gridWidth, Math.round((mouseX - pan.x) / (cellSize * zoom))));
    const vy = Math.max(0, Math.min(gridHeight, Math.round((mouseY - pan.y) / (cellSize * zoom))));
    const fx = (mouseX - pan.x) / (cellSize * zoom);
    const fy = (mouseY - pan.y) / (cellSize * zoom);
    return { vx, vy, fx, fy };
  };

  // Magic Wand Selection
  const handleMagicWandSelect = useCallback((startX: number, startY: number, additive: boolean) => {
    if (startY < 0 || startY >= gridHeight || startX < 0 || startX >= gridWidth) return;
    const targetIdx = gridData[startY][startX];
    const nextSelected = additive ? new Set(selectedCells) : new Set<string>();

    if (wandMode === 'all') {
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          if (gridData[y][x] === targetIdx) {
            nextSelected.add(`${x},${y}`);
          }
        }
      }
    } else {
      const visited = new Uint8Array(gridWidth * gridHeight);
      const queue: [number, number][] = [[startX, startY]];
      visited[startY * gridWidth + startX] = 1;

      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        nextSelected.add(`${cx},${cy}`);
        const neighbors: [number, number][] = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
            const flatIdx = ny * gridWidth + nx;
            if (!visited[flatIdx] && gridData[ny][nx] === targetIdx) {
              visited[flatIdx] = 1;
              queue.push([nx, ny]);
            }
          }
        }
      }
    }

    audioFeedback.playStitchSound(true);
    setSelectedCells(nextSelected);
  }, [gridData, gridWidth, gridHeight, wandMode, selectedCells]);

  const handleNudgeSelection = useCallback((dx: number, dy: number) => {
    if (selectedCells.size === 0) return;
    onBeforePencilStroke?.();

    const updates: { x: number; y: number; colorIndex: number }[] = [];
    const newSelection = new Set<string>();
    const snapshot = new Map<string, number>();

    selectedCells.forEach((key) => {
      const [sxStr, syStr] = key.split(',');
      const sx = parseInt(sxStr, 10);
      const sy = parseInt(syStr, 10);
      if (sy >= 0 && sy < gridHeight && sx >= 0 && sx < gridWidth) {
        snapshot.set(key, gridData[sy][sx]);
      }
    });

    // Clear vacated cells that won't be overwritten by moved cells
    const destKeys = new Set<string>();
    snapshot.forEach((_, key) => {
      const [sxStr, syStr] = key.split(',');
      const nx = parseInt(sxStr, 10) + dx;
      const ny = parseInt(syStr, 10) + dy;
      if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
        destKeys.add(`${nx},${ny}`);
      }
    });

    snapshot.forEach((_, key) => {
      if (!destKeys.has(key)) {
        const [sxStr, syStr] = key.split(',');
        updates.push({ x: parseInt(sxStr, 10), y: parseInt(syStr, 10), colorIndex: -1 });
      }
    });

    snapshot.forEach((colorIdx, key) => {
      const [sxStr, syStr] = key.split(',');
      const nx = parseInt(sxStr, 10) + dx;
      const ny = parseInt(syStr, 10) + dy;
      if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
        updates.push({ x: nx, y: ny, colorIndex: colorIdx });
        newSelection.add(`${nx},${ny}`);
      }
    });

    if (updates.length > 0) {
      if (onBatchPaintCells) {
        onBatchPaintCells(updates);
      } else {
        for (const u of updates) onPaintCell(u.x, u.y, u.colorIndex);
      }
      audioFeedback.playStitchSound(true);
    }
    setSelectedCells(newSelection);
  }, [selectedCells, gridData, gridWidth, gridHeight, onBeforePencilStroke, onBatchPaintCells, onPaintCell]);

  const handleRecolorSelection = useCallback(() => {
    if (selectedCells.size === 0) return;
    onBeforePencilStroke?.();
    const updates: { x: number; y: number; colorIndex: number }[] = [];
    selectedCells.forEach((key) => {
      const [sxStr, syStr] = key.split(',');
      const sx = parseInt(sxStr, 10);
      const sy = parseInt(syStr, 10);
      if (sx >= 0 && sx < gridWidth && sy >= 0 && sy < gridHeight) {
        updates.push({ x: sx, y: sy, colorIndex: activeColorIndex });
      }
    });
    if (updates.length > 0) {
      if (onBatchPaintCells) onBatchPaintCells(updates);
      else for (const u of updates) onPaintCell(u.x, u.y, u.colorIndex);
      audioFeedback.playStitchSound(true);
    }
  }, [selectedCells, gridWidth, gridHeight, activeColorIndex, onBeforePencilStroke, onBatchPaintCells, onPaintCell]);

  const handleInvertSelection = useCallback(() => {
    const inverted = new Set<string>();
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const key = `${x},${y}`;
        if (!selectedCells.has(key)) {
          inverted.add(key);
        }
      }
    }
    setSelectedCells(inverted);
  }, [gridWidth, gridHeight, selectedCells]);

  const handleDeleteSelection = useCallback(() => {
    if (selectedCells.size === 0) return;
    onBeforePencilStroke?.();
    const updates: { x: number; y: number; colorIndex: number }[] = [];
    selectedCells.forEach((key) => {
      const [sxStr, syStr] = key.split(',');
      const sx = parseInt(sxStr, 10);
      const sy = parseInt(syStr, 10);
      if (sx >= 0 && sx < gridWidth && sy >= 0 && sy < gridHeight) {
        updates.push({ x: sx, y: sy, colorIndex: -1 });
      }
    });
    if (updates.length > 0) {
      if (onBatchPaintCells) onBatchPaintCells(updates);
      else for (const u of updates) onPaintCell(u.x, u.y, -1);
      audioFeedback.playStitchSound(false);
    }
    setSelectedCells(new Set());
  }, [selectedCells, gridWidth, gridHeight, onBeforePencilStroke, onBatchPaintCells, onPaintCell]);

  // Studio Flood Fill (BFS 4-way area fill)
  const handleFloodFill = useCallback((startX: number, startY: number, fillIndex: number) => {
    if (startY < 0 || startY >= gridHeight || startX < 0 || startX >= gridWidth) return;
    const targetColor = gridData[startY][startX];
    if (targetColor === fillIndex) return;

    onBeforePencilStroke?.();

    const visited = new Uint8Array(gridWidth * gridHeight);
    const queue: [number, number][] = [[startX, startY]];
    visited[startY * gridWidth + startX] = 1;

    // If mirror mode is active, also seed mirror start cell if matching
    if (isMirrorMode) {
      const mirrorStartX = gridWidth - 1 - startX;
      if (gridData[startY]?.[mirrorStartX] === targetColor) {
        const mIdx = startY * gridWidth + mirrorStartX;
        if (!visited[mIdx]) {
          visited[mIdx] = 1;
          queue.push([mirrorStartX, startY]);
        }
      }
    }

    const updates: { x: number; y: number; colorIndex: number }[] = [];

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      updates.push({ x: cx, y: cy, colorIndex: fillIndex });

      const neighbors: [number, number][] = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
          const idx = ny * gridWidth + nx;
          if (!visited[idx] && gridData[ny][nx] === targetColor) {
            visited[idx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }

    if (updates.length > 0) {
      audioFeedback.playStitchSound(fillIndex !== -1);
      if (onBatchPaintCells) {
        onBatchPaintCells(updates);
      } else {
        for (const u of updates) {
          onPaintCell(u.x, u.y, fillIndex);
        }
      }
    }
  }, [gridData, gridWidth, gridHeight, isMirrorMode, onBeforePencilStroke, onBatchPaintCells, onPaintCell]);

  // Handle Pointer Events (Mouse, Touch, and Apple Pencil/Stylus)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If two fingers are actively pinching, let pinch handler take precedence
    if (pinchStateRef.current) return;

    if (e.button === 1 || tool === 'pan' || (e.shiftKey && tool !== 'rectangle' && tool !== 'wand' && tool !== 'backstitch')) {
      // Middle click or Pan tool
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      return;
    }

    if (tool === 'backstitch') {
      const vertex = getVertexFromPointer(e);
      if (!vertex) return;

      // Shift-click or Right-click erases nearest backstitch segment
      if ((e.shiftKey || e.button === 2) && onUpdateBackstitches) {
        let bestIdx = -1;
        let bestDist = 0.6;
        backstitches.forEach((line, idx) => {
          const d = pointToSegmentDist(vertex.fx, vertex.fy, line.x1, line.y1, line.x2, line.y2);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = idx;
          }
        });
        if (bestIdx !== -1) {
          onUpdateBackstitches(backstitches.filter((_, idx) => idx !== bestIdx));
          audioFeedback.playStitchSound(false);
        }
        return;
      }

      setIsInteracting(true);
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      setBackstitchStart({ x: vertex.vx, y: vertex.vy });
      setBackstitchEnd({ x: vertex.vx, y: vertex.vy });
      return;
    }

    const cell = getCellFromPointer(e);
    if (!cell) return;

    setIsInteracting(true);
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (tool === 'wand') {
      handleMagicWandSelect(cell.x, cell.y, e.shiftKey);
    } else if (tool === 'tracker') {
      const isDone = !!completedCells[`${cell.x},${cell.y}`];
      const targetMode = !isDone;
      dragTrackModeRef.current = targetMode;
      lastTrackedCellRef.current = cell;

      audioFeedback.playStitchSound(targetMode);

      if (onBatchSetCellsCompleted) {
        onBatchSetCellsCompleted([{ x: cell.x, y: cell.y, completed: targetMode }]);
      } else {
        onToggleCellCompleted(cell.x, cell.y);
      }
    } else if (tool === 'pencil') {
      onBeforePencilStroke?.();
      lastPaintedCellRef.current = cell;
      audioFeedback.playStitchSound(true);

      const updates = [{ x: cell.x, y: cell.y, colorIndex: activeColorIndex }];
      if (isMirrorMode) {
        const mirrorX = gridWidth - 1 - cell.x;
        if (mirrorX !== cell.x) {
          updates.push({ x: mirrorX, y: cell.y, colorIndex: activeColorIndex });
        }
      }

      if (onBatchPaintCells) {
        onBatchPaintCells(updates);
      } else {
        for (const u of updates) onPaintCell(u.x, u.y, u.colorIndex);
      }
    } else if (tool === 'eraser') {
      onBeforePencilStroke?.();
      lastPaintedCellRef.current = cell;
      audioFeedback.playStitchSound(false);

      const updates = [{ x: cell.x, y: cell.y, colorIndex: -1 }];
      if (isMirrorMode) {
        const mirrorX = gridWidth - 1 - cell.x;
        if (mirrorX !== cell.x) {
          updates.push({ x: mirrorX, y: cell.y, colorIndex: -1 });
        }
      }

      if (onBatchPaintCells) {
        onBatchPaintCells(updates);
      } else {
        for (const u of updates) onPaintCell(u.x, u.y, -1);
      }
    } else if (tool === 'bucket') {
      handleFloodFill(cell.x, cell.y, activeColorIndex);
    } else if (tool === 'eyedropper') {
      const colorIdx = gridData[cell.y]?.[cell.x];
      if (colorIdx !== undefined && colorIdx >= 0 && colorIdx < palette.length) {
        onSelectColor?.(colorIdx);
        audioFeedback.playStitchSound(true);
        // Return to previous drawing tool for immediate painting
        setTool(lastToolRef.current === 'eyedropper' ? 'pencil' : lastToolRef.current);
      }
    } else if (tool === 'line' || tool === 'rectangle') {
      dragShapeStartRef.current = cell;
      let initialCells = [cell];
      if (isMirrorMode) {
        const mX = gridWidth - 1 - cell.x;
        if (mX !== cell.x) initialCells.push({ x: mX, y: cell.y });
      }
      setPreviewCells(initialCells);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pinchStateRef.current) return;

    const cell = getCellFromPointer(e);

    // Only trigger hover state change when the pointer actually crosses cell boundaries
    setHoverCoord((prev) => {
      if (!prev && !cell) return null;
      if (prev && cell && prev.x === cell.x && prev.y === cell.y) return prev;
      return cell;
    });

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    if (isInteracting && tool === 'backstitch' && backstitchStart) {
      const vertex = getVertexFromPointer(e);
      if (vertex) {
        setBackstitchEnd((prev) => (prev && prev.x === vertex.vx && prev.y === vertex.vy ? prev : { x: vertex.vx, y: vertex.vy }));
      }
      return;
    }

    if (isInteracting && cell) {
      if (tool === 'tracker') {
        if (dragTrackModeRef.current !== null && lastTrackedCellRef.current) {
          if (cell.x !== lastTrackedCellRef.current.x || cell.y !== lastTrackedCellRef.current.y) {
            const lineCells = getLineCells(lastTrackedCellRef.current.x, lastTrackedCellRef.current.y, cell.x, cell.y);
            lastTrackedCellRef.current = cell;
            const targetMode = dragTrackModeRef.current;
            const updates = lineCells
              .filter((c) => c.x >= 0 && c.x < gridWidth && c.y >= 0 && c.y < gridHeight)
              .filter((c) => !!completedCells[`${c.x},${c.y}`] !== targetMode)
              .map((c) => ({ x: c.x, y: c.y, completed: targetMode }));

            if (updates.length > 0) {
              audioFeedback.playStitchSound(targetMode);
              if (onBatchSetCellsCompleted) {
                onBatchSetCellsCompleted(updates);
              } else {
                for (const u of updates) {
                  onToggleCellCompleted(u.x, u.y);
                }
              }
            }
          }
        }
      } else if (tool === 'pencil' || tool === 'eraser') {
        const targetColor = tool === 'pencil' ? activeColorIndex : -1;
        if (lastPaintedCellRef.current) {
          if (cell.x !== lastPaintedCellRef.current.x || cell.y !== lastPaintedCellRef.current.y) {
            const lineCells = getLineCells(lastPaintedCellRef.current.x, lastPaintedCellRef.current.y, cell.x, cell.y);
            lastPaintedCellRef.current = cell;

            const updates: { x: number; y: number; colorIndex: number }[] = [];
            for (const c of lineCells) {
              if (c.x >= 0 && c.x < gridWidth && c.y >= 0 && c.y < gridHeight) {
                if (gridData[c.y]?.[c.x] !== targetColor) {
                  updates.push({ x: c.x, y: c.y, colorIndex: targetColor });
                }
                if (isMirrorMode) {
                  const mX = gridWidth - 1 - c.x;
                  if (mX >= 0 && mX < gridWidth && gridData[c.y]?.[mX] !== targetColor) {
                    updates.push({ x: mX, y: c.y, colorIndex: targetColor });
                  }
                }
              }
            }

            if (updates.length > 0) {
              if (onBatchPaintCells) {
                onBatchPaintCells(updates);
              } else {
                for (const u of updates) {
                  onPaintCell(u.x, u.y, targetColor);
                }
              }
            }
          }
        }
      } else if (tool === 'line') {
        if (dragShapeStartRef.current) {
          const start = dragShapeStartRef.current;
          let line = getLineCells(start.x, start.y, cell.x, cell.y);
          if (isMirrorMode) {
            const mStart = { x: gridWidth - 1 - start.x, y: start.y };
            const mEnd = { x: gridWidth - 1 - cell.x, y: cell.y };
            line = [...line, ...getLineCells(mStart.x, mStart.y, mEnd.x, mEnd.y)];
          }
          setPreviewCells(line);
        }
      } else if (tool === 'rectangle') {
        if (dragShapeStartRef.current) {
          const start = dragShapeStartRef.current;
          const filled = e.shiftKey;
          let rect = getRectCells(start.x, start.y, cell.x, cell.y, filled);
          if (isMirrorMode) {
            const mStart = { x: gridWidth - 1 - start.x, y: start.y };
            const mEnd = { x: gridWidth - 1 - cell.x, y: cell.y };
            rect = [...rect, ...getRectCells(mStart.x, mStart.y, mEnd.x, mEnd.y, filled)];
          }
          setPreviewCells(rect);
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'backstitch' && backstitchStart && backstitchEnd && onUpdateBackstitches) {
      if (backstitchStart.x !== backstitchEnd.x || backstitchStart.y !== backstitchEnd.y) {
        const activeCol = palette[activeColorIndex];
        const newLine: BackstitchLine = {
          id: `bs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          x1: backstitchStart.x,
          y1: backstitchStart.y,
          x2: backstitchEnd.x,
          y2: backstitchEnd.y,
          colorHex: activeCol?.hex || '#000000',
          colorCode: activeCol?.code,
          strands: 2,
        };
        onUpdateBackstitches([...backstitches, newLine]);
        audioFeedback.playStitchSound(true);
      }
      setBackstitchStart(null);
      setBackstitchEnd(null);
    }

    if ((tool === 'line' || tool === 'rectangle') && previewCells && previewCells.length > 0) {
      onBeforePencilStroke?.();
      const updates = previewCells
        .filter((c) => c.x >= 0 && c.x < gridWidth && c.y >= 0 && c.y < gridHeight)
        .map((c) => ({ x: c.x, y: c.y, colorIndex: activeColorIndex }));

      if (updates.length > 0) {
        audioFeedback.playStitchSound(true);
        if (onBatchPaintCells) {
          onBatchPaintCells(updates);
        } else {
          for (const u of updates) {
            onPaintCell(u.x, u.y, activeColorIndex);
          }
        }
      }
    }

    setIsDragging(false);
    setIsInteracting(false);
    dragTrackModeRef.current = null;
    lastTrackedCellRef.current = null;
    lastPaintedCellRef.current = null;
    dragShapeStartRef.current = null;
    setPreviewCells(null);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  // Keyboard Shortcuts for Studio Drawing Tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      // Nudge shortcuts (Shift + Arrows)
      if (e.shiftKey && (selectedCells.size > 0 || onTransformGrid)) {
        const nudgeFn = (dx: number, dy: number) => {
          if (selectedCells.size > 0) handleNudgeSelection(dx, dy);
          else handleNudge(dx, dy);
        };
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          nudgeFn(0, -1);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          nudgeFn(0, 1);
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          nudgeFn(-1, 0);
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          nudgeFn(1, 0);
          return;
        }
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === 'b') {
        setTool('pencil');
      } else if (key === 'e') {
        setTool('eraser');
      } else if (key === 'g') {
        setTool('bucket');
      } else if (key === 'w') {
        setTool('wand');
      } else if (key === 'k') {
        setTool('backstitch');
      } else if (key === 'i') {
        setTool('eyedropper');
      } else if (key === 'l') {
        setTool('line');
      } else if (key === 'u') {
        setTool('rectangle');
      } else if (key === 'm') {
        setIsMirrorMode((prev) => !prev);
      } else if (key === 't') {
        setTool('tracker');
      } else if (key === 'h' || key === ' ') {
        setTool('pan');
      } else if (key === 'escape' && selectedCells.size > 0) {
        setSelectedCells(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, onTransformGrid, handleNudge, selectedCells, handleNudgeSelection]);

  // Native non-passive Wheel & Touch Pinch listener (persistent across zoom renders)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setZoom((prevZoom) => {
        const newZoom = Math.max(0.15, Math.min(8, prevZoom * zoomFactor));
        setPan((prevPan) => ({
          x: mouseX - (mouseX - prevPan.x) * (newZoom / prevZoom),
          y: mouseY - (mouseY - prevPan.y) * (newZoom / prevZoom),
        }));
        onSetZoom?.(newZoom);
        return newZoom;
      });
    };

    const initPinch = (e: TouchEvent) => {
      if (e.touches.length < 2) return;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const dist = Math.hypot(dx, dy);

      const rect = canvas.getBoundingClientRect();
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const midY = (t1.clientY + t2.clientY) / 2 - rect.top;

      pinchStateRef.current = {
        initialDist: Math.max(dist, 1),
        startZoom: currentZoomRef.current,
        initialMidpoint: { x: midX, y: midY },
        startPan: { ...currentPanRef.current },
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
        initPinch(e);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
        if (!pinchStateRef.current) {
          initPinch(e);
          return;
        }

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        const currentDist = Math.hypot(dx, dy);

        const { initialDist, startZoom, initialMidpoint, startPan } = pinchStateRef.current;
        if (initialDist <= 0) return;

        const factor = currentDist / initialDist;
        const newZoom = Math.max(0.15, Math.min(8, startZoom * factor));

        const rect = canvas.getBoundingClientRect();
        const currentMidX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const currentMidY = (t1.clientY + t2.clientY) / 2 - rect.top;

        // Scale and pan around pinch midpoint
        const scaleRatio = newZoom / startZoom;
        const newPanX = currentMidX - (initialMidpoint.x - startPan.x) * scaleRatio;
        const newPanY = currentMidY - (initialMidpoint.y - startPan.y) * scaleRatio;

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
        onSetZoom?.(newZoom);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStateRef.current = null;
      }
    };

    canvas.addEventListener('wheel', handleWheelNative, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheelNative);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onSetZoom]);

  // Progress stats
  const totalCells = gridWidth * gridHeight;
  const doneCount = Object.keys(completedCells).length;
  const progressPercent = totalCells > 0 ? ((doneCount / totalCells) * 100).toFixed(1) : '0';

  // Audio feedback toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => audioFeedback.isEnabled());
  const handleToggleSound = () => {
    const next = audioFeedback.toggleSound();
    setSoundEnabled(next);
  };

  // Real-world physical dimensions based on craft type & gauge
  const physicalSize = React.useMemo(() => {
    if (gridWidth === 0 || gridHeight === 0) return null;
    if (config.craftType === 'perler') {
      const wIn = ((gridWidth * 5.0) / 25.4).toFixed(1);
      const hIn = ((gridHeight * 5.0) / 25.4).toFixed(1);
      const wCm = (gridWidth * 0.5).toFixed(1);
      const hCm = (gridHeight * 0.5).toFixed(1);
      return `${wIn}"×${hIn}" (${wCm}×${hCm}cm)`;
    }
    if (config.craftType === 'cross-stitch') {
      const wIn = (gridWidth / 14).toFixed(1);
      const hIn = (gridHeight / 14).toFixed(1);
      const wCm = ((gridWidth / 14) * 2.54).toFixed(1);
      const hCm = ((gridHeight / 14) * 2.54).toFixed(1);
      return `${wIn}"×${hIn}" (14ct Aida • ${wCm}×${hCm}cm)`;
    }
    if (config.craftType === 'alpha') {
      const wIn = ((gridWidth * 1.2) / 25.4).toFixed(1);
      const hIn = ((gridHeight * 0.95) / 25.4).toFixed(1);
      const wCm = ((gridWidth * 1.2) / 10).toFixed(1);
      const hCm = ((gridHeight * 0.95) / 10).toFixed(1);
      return `${wIn}"×${hIn}" (${gridWidth} base strings • ${wCm}×${hCm}cm)`;
    }
    if (config.craftType === 'crochet') {
      const stsPerIn = (config.crochetGauge?.stitchesPer4Inches || 16) / 4;
      const rowsPerIn = (config.crochetGauge?.rowsPer4Inches || 18) / 4;
      const wIn = (gridWidth / stsPerIn).toFixed(1);
      const hIn = (gridHeight / rowsPerIn).toFixed(1);
      return `${wIn}"×${hIn}" crochet`;
    }
    if (config.craftType === 'knitting') {
      const stsPerIn = (config.knitGauge?.stitchesPer4Inches || 20) / 4;
      const rowsPerIn = (config.knitGauge?.rowsPer4Inches || 26) / 4;
      const wIn = (gridWidth / stsPerIn).toFixed(1);
      const hIn = (gridHeight / rowsPerIn).toFixed(1);
      const wCm = ((gridWidth / stsPerIn) * 2.54).toFixed(1);
      const hCm = ((gridHeight / rowsPerIn) * 2.54).toFixed(1);
      return `${wIn}"×${hIn}" (${wCm}×${hCm}cm • Knit)`;
    }
    if (config.craftType === 'loom') {
      const wMm = gridWidth * 1.6;
      const hMm = gridHeight * 1.3;
      const wIn = (wMm / 25.4).toFixed(1);
      const hIn = (hMm / 25.4).toFixed(1);
      const wCm = (wMm / 10).toFixed(1);
      const hCm = (hMm / 10).toFixed(1);
      return `${wIn}"×${hIn}" (${wCm}×${hCm}cm • Delica 11/0)`;
    }
    return null;
  }, [gridWidth, gridHeight, config.craftType, config.crochetGauge, config.knitGauge, config.beadLoom]);

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  // Auto celebrate pattern completion once when hitting 100%
  const prevDoneRef = useRef<number>(doneCount);
  useEffect(() => {
    if (totalCells > 0 && doneCount === totalCells && prevDoneRef.current < totalCells) {
      triggerConfetti();
      audioFeedback.playCelebrationChime();
    }
    prevDoneRef.current = doneCount;
  }, [doneCount, totalCells, triggerConfetti]);

  return (
    <div className="relative flex-1 h-full w-full bg-slate-900/90 overflow-hidden flex flex-col select-none touch-none pb-14 lg:pb-0" ref={containerRef}>
      {/* Top Right: Progress & Spotlight Badges */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col items-end gap-1.5 pointer-events-auto">
        {spotlightColorId && (
          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/60 backdrop-blur-md px-3 py-1 rounded-xl shadow-lg text-xs animate-pulse">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-200 text-xs font-semibold">
              Color Spotlight Active
            </span>
          </div>
        )}

        {totalCells > 0 && (
          <div className="flex flex-col bg-slate-950/85 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-xl overflow-hidden min-w-[140px]">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Stitched</span>
              <span className="text-xs font-bold text-slate-100 font-mono">
                {doneCount}/{totalCells} <span className="text-emerald-400 font-sans font-semibold">({progressPercent}%)</span>
              </span>
              {doneCount === totalCells && (
                <button 
                  onClick={triggerConfetti} 
                  className="bg-emerald-500 hover:bg-emerald-600 text-white p-0.5 rounded text-xs flex items-center ml-1"
                  title="Pattern Complete! Celebrate!"
                >
                  <Sparkles className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Visual Mini Progress Bar */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {physicalSize && (
              <div className="text-[9px] text-slate-400 font-mono mt-1 text-right">
                {physicalSize}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transform Popover Panel */}
      {isTransformOpen && onTransformGrid && (
        <div className="absolute bottom-32 lg:bottom-20 left-1/2 -translate-x-1/2 z-30 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5 min-w-[270px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800/90 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-indigo-400" />
              Canvas Transforms
            </span>
            <button
              onClick={() => setIsTransformOpen(false)}
              className="text-slate-500 hover:text-slate-200 text-xs px-1"
            >
              ✕
            </button>
          </div>

          {/* Auto-Center */}
          <button
            onClick={handleAutoCenter}
            className="w-full py-1.5 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            title="Compute bounding box and shift artwork to exact center of canvas"
          >
            <Focus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Auto-Center Artwork</span>
          </button>

          {/* 1-Pixel Nudge Controls */}
          <div className="flex flex-col items-center gap-1 bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between w-full text-[10px] text-slate-400 font-semibold mb-0.5">
              <span>Nudge 1 Pixel (Shift+Arrows)</span>
              <label className="flex items-center gap-1 text-[9px] cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={wrapShift}
                  onChange={(e) => setWrapShift(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 w-3 h-3"
                />
                <span>Wrap</span>
              </label>
            </div>
            <button
              onClick={() => handleNudge(0, -1)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Nudge Up 1px"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNudge(-1, 0)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                title="Nudge Left 1px"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <div className="w-3 h-3 rounded-full bg-slate-700/60" />
              <button
                onClick={() => handleNudge(1, 0)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                title="Nudge Right 1px"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => handleNudge(0, 1)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Nudge Down 1px"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Flip & Rotate Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={handleFlipHorizontal}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-800 transition"
              title="Flip Horizontally"
            >
              <FlipHorizontal2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Flip Horiz</span>
            </button>
            <button
              onClick={handleFlipVertical}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-800 transition"
              title="Flip Vertically"
            >
              <FlipVertical2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Flip Vert</span>
            </button>
            <button
              onClick={() => handleRotate('ccw')}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-800 transition"
              title="Rotate 90° Counter-Clockwise"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Rotate 90° CCW</span>
            </button>
            <button
              onClick={() => handleRotate('cw')}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-800 transition"
              title="Rotate 90° Clockwise"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Rotate 90° CW</span>
            </button>
          </div>
        </div>
      )}

      {/* Shaders Popover Panel */}
      {isShaderOpen && (
        <div className="absolute bottom-32 lg:bottom-20 left-1/2 -translate-x-1/2 z-30 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl flex flex-col gap-1 min-w-[240px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800/90 pb-1.5 px-1 mb-1">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-emerald-400" />
              Display Shaders
            </span>
            <button
              onClick={() => setIsShaderOpen(false)}
              className="text-slate-500 hover:text-slate-200 text-xs px-1"
            >
              ✕
            </button>
          </div>
          {[
            { id: 'craft', label: 'Default Craft Style', desc: 'Simulated stitches or perler beads', icon: '🖼️' },
            { id: 'crt', label: 'Retro CRT Arcade', desc: 'Scanlines, phosphor glow & vignette', icon: '📺' },
            { id: 'gameboy', label: 'Game Boy LCD', desc: 'Classic 4-tone DMG dot-matrix', icon: '🕹️' },
            { id: 'aida', label: 'Woven Aida Cloth', desc: 'Cross-stitch woven fabric texture', icon: '🧵' },
            { id: 'glossy_bead', label: 'Glossy Melted Beads', desc: 'Shiny Perler bead fused highlight', icon: '🔮' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveShader(item.id as DisplayShader);
                setIsShaderOpen(false);
              }}
              className={`flex items-center justify-between p-2 rounded-xl text-left transition ${
                activeShader === item.id
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{item.icon}</span>
                <div>
                  <div className="text-xs font-semibold">{item.label}</div>
                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                </div>
              </div>
              {activeShader === item.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}

      {/* Floating Canvas Dock (Bottom-Center Compact Ergonomic Bar) */}
      <div className="absolute bottom-16 lg:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-slate-950/95 backdrop-blur-xl p-1 sm:p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl max-w-[calc(100%-1rem)] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pointer-events-auto">
        {/* Navigation & Tracking Mode */}
        <div className="flex items-center bg-slate-900/90 rounded-xl p-0.5 border border-slate-800/80 shrink-0 gap-0.5">
          <button
            onClick={() => setTool('pan')}
            className={`p-1.5 rounded-lg transition-all ${
              tool === 'pan' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Pan & Move Canvas (H / Space)"
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setTool('tracker')}
            className={`p-1.5 rounded-lg transition-all ${
              tool === 'tracker' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Stitch Tracker (T): Tap or drag across beads/stitches to mark them done"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-[1px] h-4 bg-slate-800 shrink-0" />

        {/* Pixel Art Studio Drawing Tools */}
        <div className="flex items-center bg-slate-900/90 rounded-xl p-0.5 border border-slate-800/80 shrink-0 gap-0.5">
          <button
            onClick={() => setTool('pencil')}
            className={`p-1.5 rounded-lg transition-all ${
              tool === 'pencil' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Pencil (B): Draw pixels with active color"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-lg transition-all ${
              tool === 'eraser' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Eraser (E): Erase pixels to transparent"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setTool('bucket')}
            className={`p-1.5 rounded-lg transition-all ${
              tool === 'bucket' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Paint Bucket (G): Flood fill connected color area"
          >
            <PaintBucket className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setTool('wand')}
            className={`p-1.5 rounded-lg transition-all ${
              tool === 'wand' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md ring-1 ring-cyan-300' : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60'
            }`}
            title="Magic Wand (W): Select connected pixels or all pixels of a color to move/recolor/delete"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setTool('eyedropper')}
            className={`p-1.5 rounded-lg transition-all ${
              tool === 'eyedropper' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Eyedropper (I): Click canvas pixel to pick its color"
          >
            <Pipette className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setTool('line')}
            className={`p-1.5 rounded-lg transition-all ${
              tool === 'line' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Line Tool (L): Drag to draw straight lines"
          >
            <Slash className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setTool('rectangle')}
            className={`p-1.5 rounded-lg transition-all ${
              tool === 'rectangle' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Rectangle (U): Drag to draw boxes (Hold Shift for filled)"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setTool('backstitch')}
            className={`p-1.5 rounded-lg transition-all ${
              tool === 'backstitch' ? 'bg-rose-500 text-white shadow-md ring-1 ring-rose-300' : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800/60'
            }`}
            title="Backstitch / Outline (K): Drag along grid edges to draw stitch outlines"
          >
            <PenTool className="w-3.5 h-3.5" />
          </button>

          {/* Pixel Text & Monogram Tool */}
          {onOpenPixelTextModal && (
            <button
              onClick={onOpenPixelTextModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800/60 transition-all"
              title="Pixel Text & Monogram Tool: Stamp letters, names & dates"
            >
              <Type className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}

          {/* Symmetry / Mirror Drawing Mode */}
          <button
            onClick={() => setIsMirrorMode((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-all ${
              isMirrorMode
                ? 'bg-sky-500 text-white shadow-md ring-1 ring-sky-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title={isMirrorMode ? 'Symmetry Mirror: ON (Press M to toggle)' : 'Symmetry Mirror: OFF (Press M to toggle)'}
          >
            <FlipHorizontal2 className="w-3.5 h-3.5" />
          </button>

          {/* Transform & Auto-Center Popover Toggle */}
          {onTransformGrid && (
            <button
              onClick={() => {
                setIsTransformOpen((prev) => !prev);
                setIsShaderOpen(false);
              }}
              className={`p-1.5 rounded-lg transition-all ${
                isTransformOpen
                  ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Transform Canvas: Auto-Center, 1px Nudge, Flip, and Rotate"
            >
              <Move className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Retro Display Shaders & Authentic Textures Toggle */}
          <button
            onClick={() => {
              setIsShaderOpen((prev) => !prev);
              setIsTransformOpen(false);
            }}
            className={`p-1.5 rounded-lg transition-all ${
              isShaderOpen || activeShader !== 'craft'
                ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Display Shaders: Retro CRT, Game Boy LCD, Woven Aida, Glossy Beads"
          >
            <Tv className="w-3.5 h-3.5" />
          </button>

          {/* Tonal Contrast / Grayscale Value Check Toggle */}
          <button
            onClick={() => setIsValueCheckActive((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-all ${
              isValueCheckActive
                ? 'bg-amber-400 text-slate-950 font-bold shadow-md ring-1 ring-amber-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Tonal Value Check / Grayscale Contrast (Check light-vs-dark contrast)"
          >
            <Contrast className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="w-[1px] h-4 bg-slate-800 shrink-0" />
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="w-[1px] h-4 bg-slate-800 shrink-0" />
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => {
              const newZoom = Math.max(0.15, zoom * 0.8);
              setZoom(newZoom);
              onSetZoom?.(newZoom);
            }}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={fitToScreen}
            className="px-1.5 py-1 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-[11px] font-mono font-medium"
            title="Fit Canvas to Screen"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={() => {
              const newZoom = Math.min(8, zoom * 1.25);
              setZoom(newZoom);
              onSetZoom?.(newZoom);
            }}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={fitToScreen}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title="Fit to screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {onInspectSourceImage && (
            <button
              onClick={onInspectSourceImage}
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
              title="Inspect original source picture"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          )}

          {/* Stitch Sound & Haptics Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-1.5 rounded-lg transition ${
              soundEnabled
                ? 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
            }`}
            title={soundEnabled ? 'Stitch sound effects ON (click to mute)' : 'Stitch sound effects MUTED (click to enable)'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Screen Wake Lock Toggle (Couch Mode) */}
          <button
            onClick={toggleWakeLock}
            className={`p-1.5 rounded-lg transition ${
              isWakeLockActive
                ? 'text-teal-300 bg-teal-500/20 shadow-xs'
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
            }`}
            title={
              isWakeLockActive
                ? 'Screen Wake Lock ON (Screen stays awake while crafting)'
                : 'Keep Screen Awake (Couch mode - prevents phone/tablet from sleeping)'
            }
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={(e) => {
          if (tool === 'backstitch') e.preventDefault();
        }}
        className={`w-full h-full block touch-none ${
          tool === 'pan' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') :
          tool === 'tracker' ? 'cursor-cell' :
          tool === 'eyedropper' ? 'cursor-crosshair' :
          tool === 'eraser' ? 'cursor-pointer' :
          'cursor-crosshair'
        }`}
      />

      {/* Magic Wand Selection Action Toolbar */}
      {(tool === 'wand' || selectedCells.size > 0) && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 bg-slate-950/95 border border-cyan-500/50 backdrop-blur-xl px-2.5 py-1.5 rounded-2xl shadow-2xl flex flex-wrap items-center justify-center gap-1.5 max-w-[94vw] animate-in fade-in duration-150">
          <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 pr-1 border-r border-slate-800">
            <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{selectedCells.size} sel</span>
          </div>

          {/* Connected vs All Occurrences Toggle */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setWandMode('contiguous')}
              className={`px-1.5 py-0.5 rounded font-semibold transition ${
                wandMode === 'contiguous' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Select connected pixels of the same color"
            >
              Connected
            </button>
            <button
              type="button"
              onClick={() => setWandMode('all')}
              className={`px-1.5 py-0.5 rounded font-semibold transition ${
                wandMode === 'all' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Select every pixel of this color across the entire canvas"
            >
              All Color
            </button>
          </div>

          {selectedCells.size > 0 && (
            <>
              {/* Nudge Directional Buttons */}
              <div className="flex items-center gap-0.5 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleNudgeSelection(-1, 0)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-200"
                  title="Nudge Selection Left"
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeSelection(0, -1)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-200"
                  title="Nudge Selection Up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeSelection(0, 1)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-200"
                  title="Nudge Selection Down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeSelection(1, 0)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-200"
                  title="Nudge Selection Right"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleRecolorSelection}
                className="px-2 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white text-[10px] font-bold transition"
                title="Paint selected cells with active color"
              >
                Recolor
              </button>
              <button
                type="button"
                onClick={handleInvertSelection}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition"
                title="Invert selection"
              >
                Invert
              </button>
              <button
                type="button"
                onClick={handleDeleteSelection}
                className="p-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 transition"
                title="Erase selected cells to transparent"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedCells(new Set())}
                className="px-1.5 py-1 rounded-lg text-slate-400 hover:text-white text-[10px] font-semibold"
                title="Clear selection (Esc)"
              >
                ✕
              </button>
            </>
          )}
        </div>
      )}

      {/* Backstitch Tool Floating Bar */}
      {tool === 'backstitch' && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 bg-slate-950/95 border border-rose-500/50 backdrop-blur-xl px-3 py-1.5 rounded-2xl shadow-2xl flex items-center gap-2 text-[11px] animate-in fade-in duration-150">
          <PenTool className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-bold text-rose-200">
            Backstitch ({backstitches.length} lines)
          </span>
          <span className="hidden sm:inline text-[10px] text-slate-400">
            Drag corners to outline • Shift/Right-click to delete
          </span>
          {backstitches.length > 0 && onUpdateBackstitches && (
            <button
              type="button"
              onClick={() => onUpdateBackstitches([])}
              className="ml-1 px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[10px] font-semibold transition"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Mirror Symmetry Badge */}
      {isMirrorMode && (
        <div className="absolute top-12 left-3 sm:top-14 sm:left-4 z-20 bg-sky-950/80 border border-sky-500/50 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-sky-200 flex items-center gap-1.5 shadow-lg pointer-events-none animate-in fade-in duration-100">
          <FlipHorizontal2 className="w-3 h-3 text-sky-400" />
          <span>Mirror Symmetry ON</span>
        </div>
      )}

      {/* Tonal Contrast Grayscale Active Badge */}
      {isValueCheckActive && (
        <div className="absolute top-12 left-3 sm:top-14 sm:left-4 z-20 bg-slate-950/90 border border-amber-500/50 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 flex items-center gap-2 shadow-xl animate-in fade-in duration-150">
          <Contrast className="w-3.5 h-3.5 text-amber-400" />
          <span>Tonal Contrast (B&W) Active</span>
          <button
            onClick={() => setIsValueCheckActive(false)}
            className="ml-1 text-slate-400 hover:text-white text-[10px] bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded transition"
            title="Return to full color view"
          >
            Exit
          </button>
        </div>
      )}

      {/* Screen Wake Lock Active Badge */}
      {isWakeLockActive && (
        <div className="absolute top-12 right-3 sm:top-14 sm:right-4 z-20 bg-slate-950/90 border border-teal-500/50 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-300 flex items-center gap-2 shadow-xl animate-in fade-in duration-150">
          <Smartphone className="w-3.5 h-3.5 text-teal-400" />
          <span>Screen Awake Active 📱</span>
          <button
            onClick={toggleWakeLock}
            className="ml-1 text-slate-400 hover:text-white text-[10px] bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded transition"
            title="Turn off wake lock"
          >
            Off
          </button>
        </div>
      )}

      {/* Coordinate & Cell Info Pill */}
      {hoverCoord && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 text-slate-300 text-xs font-mono shadow-lg flex items-center gap-2 pointer-events-none">
          <span className="font-semibold text-slate-200">
            Col: {hoverCoord.x + 1}/{gridWidth} • Row: {hoverCoord.y + 1}/{gridHeight}
          </span>
          {gridData[hoverCoord.y]?.[hoverCoord.x] === -1 ? (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 italic">Empty (No stitch)</span>
            </>
          ) : gridData[hoverCoord.y]?.[hoverCoord.x] !== undefined && palette[gridData[hoverCoord.y][hoverCoord.x]] ? (
            <>
              <span className="text-slate-600">•</span>
              <div 
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
                style={{ backgroundColor: palette[gridData[hoverCoord.y][hoverCoord.x]]?.hex }}
              />
              <span className="font-semibold text-slate-100">
                {palette[gridData[hoverCoord.y][hoverCoord.x]]?.code || palette[gridData[hoverCoord.y][hoverCoord.x]]?.hex}
              </span>
              <span className="text-amber-400 font-bold">
                [{palette[gridData[hoverCoord.y][hoverCoord.x]]?.symbol}]
              </span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
