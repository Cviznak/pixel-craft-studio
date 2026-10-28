import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { GridConfig, PaletteColor, CellProgress } from '../types/craft';
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
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CraftCanvasProps {
  gridData: number[][];
  palette: PaletteColor[];
  config: GridConfig;
  spotlightColorId: string | null;
  activeColorIndex: number;
  completedCells: CellProgress;
  onToggleCellCompleted: (x: number, y: number) => void;
  onPaintCell: (x: number, y: number, colorIndex: number) => void;
  onSetZoom?: (zoom: number) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onBeforePencilStroke?: () => void;
  onInspectSourceImage?: () => void;
}

export type CanvasTool = 'pan' | 'tracker' | 'pencil' | 'eyedropper';

export const CraftCanvas: React.FC<CraftCanvasProps> = ({
  gridData,
  palette,
  config,
  spotlightColorId,
  activeColorIndex,
  completedCells,
  onToggleCellCompleted,
  onPaintCell,
  onSetZoom,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onBeforePencilStroke,
  onInspectSourceImage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
  
  // Active tool
  const [tool, setTool] = useState<CanvasTool>('pan');
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

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

    const totalGridW = gridWidth * baseCellSize;
    const totalGridH = gridHeight * baseCellSize;

    const scaleX = targetW / totalGridW;
    const scaleY = targetH / totalGridH;
    const newZoom = Math.min(2.5, Math.max(0.2, Math.min(scaleX, scaleY)));

    setZoom(newZoom);
    setPan({
      x: (clientWidth - totalGridW * newZoom) / 2,
      y: (clientHeight - totalGridH * newZoom) / 2,
    });
  }, [gridWidth, gridHeight, baseCellSize]);

  useEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  // Main Render Loop onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gridWidth === 0 || gridHeight === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const container = containerRef.current;
    const width = container ? container.clientWidth : 800;
    const height = container ? container.clientHeight : 600;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

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
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, totalW, totalH);
    }

    // Determine if spotlight mode is active
    let spotlightIndex: number | null = null;
    if (spotlightColorId !== null) {
      spotlightIndex = palette.findIndex(c => c.id === spotlightColorId);
    }

    // Draw each cell
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const colorIdx = gridData[y][x];
        const color = palette[colorIdx];
        if (!color) continue;

        const px = x * cellSize;
        const py = y * cellSize;
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
          ctx.fillStyle = color.hex;
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
          ctx.strokeStyle = color.hex;
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
        } else if (config.craftType === 'diamond') {
          // Diamond painting faceted drill
          const pad = cellSize * 0.06;
          ctx.fillStyle = color.hex;
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
          ctx.fillStyle = color.hex;
          ctx.fillRect(px, py, cellSize, cellSize);
        }

        // Draw Craft Symbol if enabled or zoomed in enough
        if (config.showSymbols && cellSize * zoom >= 14) {
          ctx.fillStyle = getContrastingTextColor(color.r, color.g, color.b);
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

    // Hover box indicator
    if (hoverCoord && hoverCoord.x >= 0 && hoverCoord.x < gridWidth && hoverCoord.y >= 0 && hoverCoord.y < gridHeight) {
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(hoverCoord.x * cellSize, hoverCoord.y * cellSize, cellSize, cellSize);
    }

    ctx.restore();
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

  // Handle Pointer Events (Mouse, Touch, and Apple Pencil/Stylus)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If two fingers are actively pinching, let pinch handler take precedence
    if (pinchStateRef.current) return;

    if (e.button === 1 || tool === 'pan' || e.shiftKey) {
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

    const cell = getCellFromPointer(e);
    if (!cell) return;

    setIsInteracting(true);
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (tool === 'tracker') {
      onToggleCellCompleted(cell.x, cell.y);
    } else if (tool === 'pencil') {
      onBeforePencilStroke?.();
      onPaintCell(cell.x, cell.y, activeColorIndex);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pinchStateRef.current) return;

    const cell = getCellFromPointer(e);
    setHoverCoord(cell);

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    if (isInteracting && cell) {
      if (tool === 'tracker') {
        // Drag to complete
        onToggleCellCompleted(cell.x, cell.y);
      } else if (tool === 'pencil') {
        onPaintCell(cell.x, cell.y, activeColorIndex);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    setIsInteracting(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

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

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

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
          </div>
        )}
      </div>

      {/* Floating Canvas Dock (Bottom-Center Ergonomic Bar) */}
      <div className="absolute bottom-18 lg:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5 bg-slate-950/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl max-w-[calc(100vw-2rem)] overflow-x-auto pointer-events-auto">
        {/* Tool Segment: Pan | Tracker | Pencil */}
        <div className="flex items-center bg-slate-900/90 rounded-xl p-0.5 border border-slate-800/80 shrink-0">
          <button
            onClick={() => setTool('pan')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              tool === 'pan' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Pan & Move Canvas"
          >
            <Move className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Move</span>
          </button>

          <button
            onClick={() => setTool('tracker')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              tool === 'tracker' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tracker: Tap beads/stitches to mark them done"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Track</span>
          </button>

          <button
            onClick={() => setTool('pencil')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              tool === 'pencil' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Pencil: Tap to paint with current active color"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Draw</span>
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
            className="px-2 py-1 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-[11px] font-mono font-medium"
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
        className={`w-full h-full block touch-none ${
          tool === 'pan' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') :
          tool === 'tracker' ? 'cursor-cell' : 'cursor-crosshair'
        }`}
      />

      {/* Coordinate & Cell Info Pill */}
      {hoverCoord && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 text-slate-300 text-xs font-mono shadow-lg flex items-center gap-2 pointer-events-none">
          <span>X: {hoverCoord.x + 1}, Y: {hoverCoord.y + 1}</span>
          {gridData[hoverCoord.y]?.[hoverCoord.x] !== undefined && (
            <>
              <span className="text-slate-600">•</span>
              <div 
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ backgroundColor: palette[gridData[hoverCoord.y][hoverCoord.x]]?.hex }}
              />
              <span className="font-semibold text-slate-200">
                {palette[gridData[hoverCoord.y][hoverCoord.x]]?.code || palette[gridData[hoverCoord.y][hoverCoord.x]]?.hex}
              </span>
              <span className="text-amber-400 font-bold">
                [{palette[gridData[hoverCoord.y][hoverCoord.x]]?.symbol}]
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
