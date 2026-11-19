import type { GridConfig, PaletteColor, CellProgress } from '../types/craft';

export interface WipSessionLog {
  id: string;
  dateIso: string;
  durationSeconds: number;
  stitchesCompleted: number;
  note?: string;
}

export interface WipStats {
  totalSeconds: number;
  sessions: WipSessionLog[];
  milestoneNote: string;
  startedAtIso: string;
}

const WIP_STORAGE_KEY = 'pixelcraft_wip_stats_v1';

export function loadWipStats(): WipStats {
  const fallback: WipStats = {
    totalSeconds: 0,
    sessions: [],
    milestoneNote: '',
    startedAtIso: new Date().toISOString(),
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(WIP_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      totalSeconds: typeof parsed.totalSeconds === 'number' ? parsed.totalSeconds : 0,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      milestoneNote: typeof parsed.milestoneNote === 'string' ? parsed.milestoneNote : '',
      startedAtIso: typeof parsed.startedAtIso === 'string' ? parsed.startedAtIso : fallback.startedAtIso,
    };
  } catch {
    return fallback;
  }
}

export function saveWipStats(stats: WipStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WIP_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota issues
  }
}

export function formatDurationClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

export function formatDurationHuman(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${safe}s`;
}

export function calculateWipMetrics(
  completedCount: number,
  totalCount: number,
  totalSeconds: number
): {
  percentDone: number;
  stitchesPerHour: number;
  estimatedHoursRemaining: number | null;
} {
  const safeTotal = Math.max(1, totalCount);
  const percentDone = Math.min(100, Math.round((completedCount / safeTotal) * 100));
  const hours = totalSeconds / 3600;
  const stitchesPerHour = hours >= 0.01 && completedCount > 0 ? Math.round(completedCount / hours) : 0;
  const remaining = Math.max(0, safeTotal - completedCount);
  const estimatedHoursRemaining =
    stitchesPerHour > 0 && remaining > 0 ? Math.round((remaining / stitchesPerHour) * 10) / 10 : null;

  return {
    percentDone,
    stitchesPerHour,
    estimatedHoursRemaining,
  };
}

/**
 * Renders a crisp 1080x1350 aesthetic WIP Progress Stats Card PNG for Reddit, Instagram & TikTok.
 */
export function renderWipStatsCardCanvas(
  gridData: number[][],
  palette: PaletteColor[],
  config: GridConfig,
  completedCells: CellProgress,
  wipStats: WipStats,
  projectTitle = 'My Craft WIP'
): HTMLCanvasElement {
  const w = 1080;
  const h = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, '#090d1a');
  bgGrad.addColorStop(0.55, '#111827');
  bgGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle decorative glow orb
  const glow = ctx.createRadialGradient(w * 0.5, 360, 40, w * 0.5, 360, 480);
  glow.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
  glow.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const gridH = gridData.length;
  const gridW = gridH > 0 ? gridData[0].length : 0;

  // Count completed & total non-empty stitches
  let totalValid = 0;
  let completedCount = 0;
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      if (gridData[y][x] >= 0) {
        totalValid++;
        if (completedCells[`${x},${y}`]) completedCount++;
      }
    }
  }
  const metrics = calculateWipMetrics(completedCount, Math.max(1, totalValid), wipStats.totalSeconds);
  const isPartial = completedCount > 0 && completedCount < totalValid;

  // Header Badge & Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#818cf8';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(`WORK IN PROGRESS  •  ${config.craftType.toUpperCase()}`, w / 2, 74);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 44px system-ui, sans-serif';
  ctx.fillText(projectTitle.slice(0, 32), w / 2, 130);

  // Center Pattern Card
  const cardX = 90;
  const cardY = 165;
  const cardW = w - cardX * 2;
  const cardH = 620;
  ctx.fillStyle = '#070b14';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.stroke();

  if (gridW > 0 && gridH > 0) {
    const innerPad = 36;
    const availW = cardW - innerPad * 2;
    const availH = cardH - innerPad * 2;
    const cell = Math.floor(Math.min(availW / gridW, availH / gridH));
    const drawW = cell * gridW;
    const drawH = cell * gridH;
    const ox = cardX + (cardW - drawW) / 2;
    const oy = cardY + (cardH - drawH) / 2;

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const idx = gridData[y][x];
        if (idx < 0 || !palette[idx]) continue;
        const c = palette[idx];
        const done = !!completedCells[`${x},${y}`];
        ctx.globalAlpha = !isPartial || done ? 1.0 : 0.25;
        ctx.fillStyle = c.hex;
        ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
      }
    }
    ctx.globalAlpha = 1.0;
  }

  // Progress Bar & Badge
  const barX = 90;
  const barY = 825;
  const barW = w - barX * 2;
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, 24, 12);
  ctx.fill();

  const fillW = Math.max(24, Math.round((metrics.percentDone / 100) * barW));
  const barGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
  barGrad.addColorStop(0, '#6366f1');
  barGrad.addColorStop(0.5, '#ec4899');
  barGrad.addColorStop(1, '#10b981');
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(barX, barY, fillW, 24, 12);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`${metrics.percentDone}% COMPLETE`, w / 2, 892);

  // 4 KPI Stat Boxes (2x2)
  const statTiles = [
    { label: 'TIME LOGGED', value: formatDurationHuman(wipStats.totalSeconds), accent: '#38bdf8' },
    { label: 'STITCHES DONE', value: `${completedCount.toLocaleString()} / ${totalValid.toLocaleString()}`, accent: '#34d399' },
    { label: 'STITCH PACE', value: metrics.stitchesPerHour > 0 ? `${metrics.stitchesPerHour} / hr` : '-- / hr', accent: '#f472b6' },
    { label: 'EST. REMAINING', value: metrics.estimatedHoursRemaining !== null ? `~${metrics.estimatedHoursRemaining} hrs` : '--', accent: '#fbbf24' },
  ];

  const tileW = (barW - 24) / 2;
  const tileH = 112;
  statTiles.forEach((tile, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const tx = barX + col * (tileW + 24);
    const ty = 924 + row * (tileH + 20);

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tx, ty, tileW, tileH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(tile.label, tx + tileW / 2, ty + 38);

    ctx.fillStyle = tile.accent;
    ctx.font = '800 32px monospace';
    ctx.fillText(tile.value, tx + tileW / 2, ty + 82);
  });

  // Palette Dots Strip + Milestone Note
  const maxDots = Math.min(14, palette.length);
  const dotSpacing = 44;
  const dotsStartX = w / 2 - ((maxDots - 1) * dotSpacing) / 2;
  for (let i = 0; i < maxDots; i++) {
    ctx.fillStyle = palette[i].hex;
    ctx.beginPath();
    ctx.arc(dotsStartX + i * dotSpacing, 1210, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (wipStats.milestoneNote.trim()) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'italic 22px system-ui, sans-serif';
    ctx.fillText(`"${wipStats.milestoneNote.trim().slice(0, 62)}"`, w / 2, 1265);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText('Crafted with Pixel Craft Studio • www.pixel-craft-studio.com', w / 2, 1312);

  return canvas;
}
