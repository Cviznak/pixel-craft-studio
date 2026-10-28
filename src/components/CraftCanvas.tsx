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

  // Coordinate conversion helper from mouse event to cell [x, y]
  const getCellFromMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
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

  // Handle Mouse Events for interaction, painting, and panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || tool === 'pan' || e.shiftKey) {
      // Middle click or Pan tool
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const cell = getCellFromMouse(e);
    if (!cell) return;

    setIsInteracting(true);

    if (tool === 'tracker') {
      onToggleCellCompleted(cell.x, cell.y);
    } else if (tool === 'pencil') {
      onBeforePencilStroke?.();
      onPaintCell(cell.x, cell.y, activeColorIndex);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromMouse(e);
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

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsInteracting(false);
  };

  // Native non-passive Wheel & Touch Pinch listener (fixes passive preventDefault error and page zoom)
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

    let initialDist = 0;
    let startZoom = 1;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDist = Math.hypot(dx, dy);
        startZoom = zoom;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDist > 0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const factor = currentDist / initialDist;
        const newZoom = Math.max(0.15, Math.min(8, startZoom * factor));
        setZoom(newZoom);
        onSetZoom?.(newZoom);
      }
    };

    canvas.addEventListener('wheel', handleWheelNative, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheelNative);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [onSetZoom, zoom]);

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
    <div className="relative flex-1 h-full w-full bg-slate-900 overflow-hidden flex flex-col select-none touch-none pb-14 lg:pb-0" ref={containerRef}>
      {/* Top Floating Toolbar */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-20 flex items-center gap-1 sm:gap-2 bg-slate-800/90 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-slate-700/70 shadow-xl max-w-[calc(100vw-1rem)] overflow-x-auto">
        <button
          onClick={() => setTool('pan')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            tool === 'pan' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700/60'
          }`}
          title="Pan & Navigate (or drag with 1-finger in Pan mode)"
        >
          <Move className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pan</span>
        </button>

        <button
          onClick={() => setTool('tracker')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            tool === 'tracker' ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50' : 'text-slate-300 hover:bg-slate-700/60'
          }`}
          title="Craft Tracker: Tap beads/stitches to mark them completed"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tracker</span>
        </button>

        <button
          onClick={() => setTool('pencil')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            tool === 'pencil' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700/60'
          }`}
          title="Pencil: Tap cell to paint with selected color"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pencil</span>
        </button>

        {/* Undo / Redo */}
        <div className="w-[1px] h-5 bg-slate-700 mx-0.5 shrink-0" />
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700/60 disabled:opacity-30 disabled:hover:bg-transparent transition shrink-0"
          title="Undo Pencil (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700/60 disabled:opacity-30 disabled:hover:bg-transparent transition shrink-0"
          title="Redo Pencil (Ctrl+Y or Ctrl+Shift+Z)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-5 bg-slate-700 mx-0.5 shrink-0 hidden md:block" />

        {onInspectSourceImage && (
          <button
            onClick={onInspectSourceImage}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-700/60 hover:text-white transition shrink-0"
            title="Inspect source picture in full resolution"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Inspect</span>
          </button>
        )}

        <div className="w-[1px] h-5 bg-slate-700 mx-0.5 shrink-0" />

        <button
          onClick={() => {
            const newZoom = Math.min(8, zoom * 1.25);
            setZoom(newZoom);
            onSetZoom?.(newZoom);
          }}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700/60 transition shrink-0"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const newZoom = Math.max(0.15, zoom * 0.8);
            setZoom(newZoom);
            onSetZoom?.(newZoom);
          }}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700/60 transition shrink-0"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={fitToScreen}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700/60 transition shrink-0"
          title="Fit Canvas to Viewport"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <span className="text-slate-400 text-[11px] font-mono font-medium px-1 shrink-0">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Progress & Spotlight Bar */}
      <div className="absolute top-14 sm:top-4 right-2 sm:right-4 z-20 flex items-center gap-2">
        {spotlightColorId && (
          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/50 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-lg animate-pulse text-xs">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-200 text-[11px] font-semibold hidden sm:inline">
              Spotlight Active
            </span>
          </div>
        )}

        {totalCells > 0 && (
          <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-md px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border border-slate-700/70 shadow-xl">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold hidden sm:block">Craft Progress</span>
              <span className="text-xs font-bold text-slate-100 font-mono">
                {doneCount}/{totalCells} <span className="text-emerald-400 font-sans font-semibold">({progressPercent}%)</span>
              </span>
            </div>
            {doneCount === totalCells && (
              <button 
                onClick={triggerConfetti} 
                className="bg-emerald-500 hover:bg-emerald-600 text-white p-1 rounded-md text-xs flex items-center gap-1"
                title="Pattern Complete! Celebrate!"
              >
                <Sparkles className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full h-full block touch-none ${
          tool === 'pan' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') :
          tool === 'tracker' ? 'cursor-cell' : 'cursor-crosshair'
        }`}
      />

      {/* Coordinate & Cell Info Pill */}
      {hoverCoord && (
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-300 text-xs font-mono shadow-lg flex items-center gap-2">
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
