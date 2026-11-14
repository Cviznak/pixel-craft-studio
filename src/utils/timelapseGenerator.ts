import type { PaletteColor, CraftType } from '../types/craft';

export type TimelapseAnimationMode = 'layer-reveal' | 'row-by-row' | 'spiral';
export type TimelapseAspectRatio = '9:16' | '1:1' | '16:9';

export interface TimelapseOptions {
  gridData: number[][];
  palette: PaletteColor[];
  craftType: CraftType;
  mode: TimelapseAnimationMode;
  aspectRatio: TimelapseAspectRatio;
  fps?: number;
  durationSeconds?: number;
  title?: string;
  watermark?: boolean;
}

export interface TimelapseFrameData {
  canvas: HTMLCanvasElement;
  totalSteps: number;
  drawStep: (step: number) => void;
}

/**
 * Creates an animation controller that can render any step of the craft timelapse to a canvas.
 */
export function createTimelapseController(
  options: TimelapseOptions,
  targetCanvas: HTMLCanvasElement
): {
  totalSteps: number;
  renderStep: (stepFraction: number) => void;
  width: number;
  height: number;
} {
  const { gridData, palette, craftType, mode, aspectRatio, title = 'Pixel Craft Pattern', watermark = true } = options;
  const gridHeight = gridData.length;
  const gridWidth = gridHeight > 0 ? gridData[0].length : 0;

  // Resolve canvas resolution based on aspect ratio
  let width = 720;
  let height = 720;
  if (aspectRatio === '9:16') {
    width = 540;
    height = 960;
  } else if (aspectRatio === '16:9') {
    width = 960;
    height = 540;
  }

  targetCanvas.width = width;
  targetCanvas.height = height;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Pre-calculate cells order based on animation mode
  interface CellCoord {
    r: number;
    c: number;
    colorIdx: number;
  }

  const cells: CellCoord[] = [];
  for (let r = 0; r < gridHeight; r++) {
    for (let c = 0; c < gridWidth; c++) {
      const colorIdx = gridData[r][c];
      const color = palette[colorIdx];
      if (color && color.hex !== 'transparent') {
        cells.push({ r, c, colorIdx });
      }
    }
  }

  if (mode === 'row-by-row') {
    // Already in row order (top to bottom, left to right)
  } else if (mode === 'layer-reveal') {
    // Sort by color frequency / palette order so colors appear layer by layer
    cells.sort((a, b) => a.colorIdx - b.colorIdx);
  } else if (mode === 'spiral') {
    // Sort by Euclidean distance from center (blooming out)
    const midR = gridHeight / 2;
    const midC = gridWidth / 2;
    cells.sort((a, b) => {
      const distA = Math.pow(a.r - midR, 2) + Math.pow(a.c - midC, 2);
      const distB = Math.pow(b.r - midR, 2) + Math.pow(b.c - midC, 2);
      return distA - distB;
    });
  }

  const totalSteps = cells.length;

  // Pattern display boundaries inside the canvas
  const padding = aspectRatio === '9:16' ? 40 : 30;
  const topOffset = aspectRatio === '9:16' ? 120 : 60;
  const bottomOffset = aspectRatio === '9:16' ? 100 : 50;

  const maxPatternW = width - padding * 2;
  const maxPatternH = height - topOffset - bottomOffset;

  const cellScale = Math.min(maxPatternW / Math.max(1, gridWidth), maxPatternH / Math.max(1, gridHeight));
  const patternW = gridWidth * cellScale;
  const patternH = gridHeight * cellScale;

  const startX = (width - patternW) / 2;
  const startY = topOffset + (maxPatternH - patternH) / 2;

  const renderStep = (fraction: number) => {
    const clampedFraction = Math.max(0, Math.min(1, fraction));
    const currentStepCount = Math.floor(clampedFraction * totalSteps);

    // 1. Draw modern dark aesthetic background with subtle radial glow
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const bgGlow = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
    bgGlow.addColorStop(0, '#1e1b4b');
    bgGlow.addColorStop(0.6, '#0f172a');
    bgGlow.addColorStop(1, '#020617');
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, width, height);

    // 2. Pattern backing card
    ctx.save();
    ctx.fillStyle = '#ffffff08';
    ctx.strokeStyle = '#ffffff15';
    ctx.lineWidth = 1;
    const cardPad = 16;
    ctx.beginPath();
    ctx.roundRect(startX - cardPad, startY - cardPad, patternW + cardPad * 2, patternH + cardPad * 2, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Grid / fabric texture underlay
    ctx.save();
    ctx.strokeStyle = '#ffffff08';
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= gridWidth; c += 5) {
      const gx = startX + c * cellScale;
      ctx.beginPath();
      ctx.moveTo(gx, startY);
      ctx.lineTo(gx, startY + patternH);
      ctx.stroke();
    }
    for (let r = 0; r <= gridHeight; r += 5) {
      const gy = startY + r * cellScale;
      ctx.beginPath();
      ctx.moveTo(startX, gy);
      ctx.lineTo(startX + patternW, gy);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Render active cells up to current step
    for (let i = 0; i < currentStepCount; i++) {
      const { r, c, colorIdx } = cells[i];
      const color = palette[colorIdx];
      if (!color) continue;

      const px = startX + c * cellScale;
      const py = startY + r * cellScale;

      ctx.fillStyle = color.hex;

      if (craftType === 'perler') {
        // Bead circle with center hole
        ctx.beginPath();
        const radius = cellScale * 0.44;
        ctx.arc(px + cellScale / 2, py + cellScale / 2, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner hole
        ctx.beginPath();
        ctx.arc(px + cellScale / 2, py + cellScale / 2, radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();
      } else if (craftType === 'cross-stitch') {
        // Crisp cross-stitch block with subtle inner cross
        ctx.fillRect(px, py, cellScale, cellScale);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = Math.max(0.8, cellScale * 0.1);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + cellScale, py + cellScale);
        ctx.moveTo(px + cellScale, py);
        ctx.lineTo(px, py + cellScale);
        ctx.stroke();
      } else {
        // Flat crisp pixel
        ctx.fillRect(px, py, cellScale, cellScale);
      }
    }

    // 5. Draw Header Banner (TikTok / Reel style title)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(title, width / 2, topOffset - (aspectRatio === '9:16' ? 50 : 25));

    ctx.fillStyle = '#a5b4fc';
    ctx.font = '600 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `${craftType.toUpperCase()} PATTERN • ${gridWidth}×${gridHeight} • ${palette.length} COLORS`,
      width / 2,
      topOffset - (aspectRatio === '9:16' ? 26 : 10)
    );
    ctx.restore();

    // 6. Draw Progress Bar at bottom
    const barW = width * 0.7;
    const barH = 6;
    const barX = (width - barW) / 2;
    const barY = height - (aspectRatio === '9:16' ? 65 : 30);

    ctx.save();
    // Track
    ctx.fillStyle = '#ffffff20';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 3);
    ctx.fill();

    // Fill
    const fillGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    fillGrad.addColorStop(0, '#6366f1');
    fillGrad.addColorStop(1, '#ec4899');
    ctx.fillStyle = fillGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * clampedFraction, barH, 3);
    ctx.fill();

    // Progress text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${Math.round(clampedFraction * 100)}% Complete`, width / 2, barY + 20);

    // 7. Watermark
    if (watermark) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff60';
      ctx.font = '600 10px system-ui, -apple-system, sans-serif';
      ctx.fillText('Pixel Craft Studio ✨', width - 20, height - 15);
    }
    ctx.restore();
  };

  return {
    totalSteps,
    renderStep,
    width,
    height,
  };
}

/**
 * Records a WebM video of the animated timelapse.
 */
export async function recordTimelapseVideo(
  options: TimelapseOptions,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  const offscreen = document.createElement('canvas');
  const durationMs = (options.durationSeconds || 6) * 1000;
  const fps = options.fps || 30;
  const totalFrames = Math.round((durationMs / 1000) * fps);

  const controller = createTimelapseController(options, offscreen);

  // Setup MediaStream from canvas
  const stream = offscreen.captureStream(fps);
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
  }

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 4000000, // 4 Mbps crisp video
  });

  const chunks: BlobPart[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };
    mediaRecorder.onerror = (e) => reject(e);
  });

  mediaRecorder.start();

  // Render each frame sequentially with easing
  for (let f = 0; f <= totalFrames; f++) {
    const linearProgress = f / totalFrames;
    // Ease-in-out quadratic for smooth cinematic feel
    const easedProgress = linearProgress < 0.5
      ? 2 * linearProgress * linearProgress
      : 1 - Math.pow(-2 * linearProgress + 2, 2) / 2;

    controller.renderStep(easedProgress);

    if (onProgress) {
      onProgress(Math.round(linearProgress * 100));
    }

    // Small delay to let browser capture frames cleanly
    await new Promise((r) => setTimeout(r, 1000 / fps));
  }

  // Hold final frame for 1 second so viewer sees the finished masterpiece
  for (let h = 0; h < fps; h++) {
    controller.renderStep(1);
    await new Promise((r) => setTimeout(r, 1000 / fps));
  }

  mediaRecorder.stop();
  return recordingPromise;
}
