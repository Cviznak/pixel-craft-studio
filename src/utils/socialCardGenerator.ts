import type { GridConfig, PaletteColor } from '../types/craft';

export interface SocialCardOptions {
  title: string;
  aspectRatio: 'square' | 'story'; // square: 1080x1080, story: 1000x1500
  theme: 'slate' | 'linen' | 'pastel' | 'arcade';
  renderStyle: 'pixel' | 'cross-stitch' | 'perler';
  showPaletteStrip: boolean;
  showDimensionsBadge: boolean;
}

export function generateSocialCard(
  gridData: number[][],
  palette: PaletteColor[],
  config: GridConfig,
  options: SocialCardOptions
): HTMLCanvasElement {
  const isSquare = options.aspectRatio === 'square';
  const width = isSquare ? 1080 : 1000;
  const height = isSquare ? 1080 : 1500;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Render Theme Background
  if (options.theme === 'slate') {
    // Deep modern obsidian slate with soft ambient glow
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    const radGlow = ctx.createRadialGradient(width / 2, height * 0.44, 50, width / 2, height * 0.44, width * 0.55);
    radGlow.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
    radGlow.addColorStop(0.5, 'rgba(139, 92, 246, 0.08)');
    radGlow.addColorStop(1, 'rgba(10, 15, 29, 0)');
    ctx.fillStyle = radGlow;
    ctx.fillRect(0, 0, width, height);
  } else if (options.theme === 'linen') {
    // Warm natural linen cloth
    ctx.fillStyle = '#f8f5ee';
    ctx.fillRect(0, 0, width, height);

    // Subtle micro cloth weave
    ctx.fillStyle = 'rgba(120, 100, 80, 0.035)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1);
    }
    for (let x = 0; x < width; x += 4) {
      ctx.fillRect(x, 0, 1, height);
    }
  } else if (options.theme === 'pastel') {
    // Soft dreamy gradient (blush rose to lavender)
    const pastelGrad = ctx.createLinearGradient(0, 0, width, height);
    pastelGrad.addColorStop(0, '#fdf4f5');
    pastelGrad.addColorStop(0.5, '#f5f3ff');
    pastelGrad.addColorStop(1, '#eef2ff');
    ctx.fillStyle = pastelGrad;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Retro arcade neon
    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, 0, width, height);

    // Neon grid lines at the bottom
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)';
    ctx.lineWidth = 1.5;
    for (let y = height * 0.7; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // Text color palette depending on theme
  const isDark = options.theme === 'slate' || options.theme === 'arcade';
  const primaryTextColor = isDark ? '#ffffff' : '#1e293b';
  const secondaryTextColor = isDark ? '#94a3b8' : '#64748b';
  const badgeBg = isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)';
  const badgeBorder = isDark ? 'rgba(71, 85, 105, 0.6)' : 'rgba(226, 232, 240, 0.9)';

  // 2. Top Header / Title
  const headerTop = isSquare ? 70 : 90;
  ctx.textAlign = 'center';

  // Subtitle / Brand pill
  ctx.fillStyle = isDark ? '#818cf8' : '#6366f1';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('PIXEL CRAFT STUDIO • FREE PATTERN', width / 2, headerTop);

  // Title
  ctx.fillStyle = primaryTextColor;
  ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(options.title || 'Pixel Craft Pattern', width / 2, headerTop + 48);

  // 3. Physical Badges
  if (options.showDimensionsBadge) {
    const gridW = gridData[0]?.length || config.width;
    const gridH = gridData.length || config.height;

    let craftLabel = 'Pixel Art';
    let dimLabel = `${gridW}×${gridH} pixels`;

    if (config.craftType === 'cross-stitch') {
      craftLabel = 'Cross-Stitch (14-ct)';
      const wIn = (gridW / 14).toFixed(1);
      const hIn = (gridH / 14).toFixed(1);
      dimLabel = `${gridW}×${gridH} sts • ${wIn}"×${hIn}"`;
    } else if (config.craftType === 'perler') {
      craftLabel = 'Perler Beads (5mm)';
      const wIn = ((gridW * 5) / 25.4).toFixed(1);
      const hIn = ((gridH * 5) / 25.4).toFixed(1);
      dimLabel = `${gridW}×${gridH} beads • ${wIn}"×${hIn}"`;
    } else if (config.craftType === 'crochet') {
      craftLabel = 'Crochet C2C';
      dimLabel = `${gridW}×${gridH} blocks`;
    }

    const badges = [craftLabel, dimLabel];
    const badgeY = headerTop + 90;

    ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const totalBadgesWidth = badges.reduce((acc, b) => acc + ctx.measureText(b).width + 36, 0) + 12;
    let badgeStartX = (width - totalBadgesWidth) / 2;

    badges.forEach((text) => {
      const textWidth = ctx.measureText(text).width;
      const bWidth = textWidth + 30;
      const bHeight = 32;

      // Rounded badge rect
      ctx.fillStyle = badgeBg;
      ctx.strokeStyle = badgeBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(badgeStartX, badgeY, bWidth, bHeight, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = secondaryTextColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, badgeStartX + bWidth / 2, badgeY + bHeight / 2 + 1);

      badgeStartX += bWidth + 12;
    });
  }

  // 4. Centered Artwork Box
  const gridH = gridData.length;
  const gridW = gridH > 0 ? gridData[0].length : 0;

  if (gridW > 0 && gridH > 0) {
    const artAreaY = headerTop + 145;
    const artAreaHeight = isSquare ? 580 : 820;
    const artAreaWidth = width - 140;

    // Card frame for the artwork
    const framePadding = 24;
    const maxArtW = artAreaWidth - framePadding * 2;
    const maxArtH = artAreaHeight - framePadding * 2;

    const cellSize = Math.max(2, Math.floor(Math.min(maxArtW / gridW, maxArtH / gridH)));
    const artPixelWidth = gridW * cellSize;
    const artPixelHeight = gridH * cellSize;

    const frameWidth = artPixelWidth + framePadding * 2;
    const frameHeight = artPixelHeight + framePadding * 2;
    const frameX = (width - frameWidth) / 2;
    const frameY = artAreaY + (artAreaHeight - frameHeight) / 2;

    // Card frame backdrop & drop shadow
    ctx.save();
    ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;
    ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameWidth, frameHeight, 24);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameWidth, frameHeight, 24);
    ctx.stroke();

    // Render Artwork cells
    const artStartX = frameX + framePadding;
    const artStartY = frameY + framePadding;

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const colorIdx = gridData[y][x];
        const px = artStartX + x * cellSize;
        const py = artStartY + y * cellSize;

        if (colorIdx === -1 || !palette[colorIdx]) {
          // Transparent / empty background inside frame
          const isEven = (x + y) % 2 === 0;
          ctx.fillStyle = isDark ? (isEven ? '#1e293b' : '#0f172a') : (isEven ? '#f1f5f9' : '#ffffff');
          ctx.fillRect(px, py, cellSize, cellSize);
          continue;
        }

        const color = palette[colorIdx];

        if (options.renderStyle === 'cross-stitch') {
          // Fabric weave background
          ctx.fillStyle = '#f5efe6';
          ctx.fillRect(px, py, cellSize, cellSize);

          // Stitched 'X'
          const pad = cellSize * 0.1;
          ctx.strokeStyle = color.hex;
          ctx.lineWidth = Math.max(1.5, cellSize * 0.22);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(px + pad, py + cellSize - pad);
          ctx.lineTo(px + cellSize - pad, py + pad);
          ctx.moveTo(px + pad, py + pad);
          ctx.lineTo(px + cellSize - pad, py + cellSize - pad);
          ctx.stroke();
        } else if (options.renderStyle === 'perler') {
          // Bead backing
          ctx.fillStyle = isDark ? '#1e293b' : '#f8fafc';
          ctx.fillRect(px, py, cellSize, cellSize);

          // Fused round bead
          const radius = cellSize * 0.44;
          const cx = px + cellSize / 2;
          const cy = py + cellSize / 2;

          ctx.fillStyle = color.hex;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();

          // Bead hole
          ctx.fillStyle = isDark ? '#0f172a' : '#64748b';
          ctx.beginPath();
          ctx.arc(cx, cy, radius * 0.32, 0, Math.PI * 2);
          ctx.fill();

          // Highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.beginPath();
          ctx.arc(cx - radius * 0.25, cy - radius * 0.25, radius * 0.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Crisp clean pixel
          ctx.fillStyle = color.hex;
          ctx.fillRect(px, py, cellSize, cellSize);
        }
      }
    }
  }

  // 5. Palette Color Dots Strip
  if (options.showPaletteStrip && palette.length > 0) {
    const paletteY = isSquare ? height - 170 : height - 210;
    const maxDots = Math.min(palette.length, 12);
    const dotRadius = isSquare ? 16 : 18;
    const dotSpacing = dotRadius * 2 + 14;
    const totalDotsW = maxDots * dotSpacing - 14;
    const startX = (width - totalDotsW) / 2 + dotRadius;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < maxDots; i++) {
      const c = palette[i];
      const cx = startX + i * dotSpacing;

      // Color circle
      ctx.fillStyle = c.hex;
      ctx.beginPath();
      ctx.arc(cx, paletteY, dotRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Symbol or DMC code below
      const label = c.code ? c.code.replace(/^(DMC|P)/i, '') : c.symbol;
      ctx.fillStyle = secondaryTextColor;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(label, cx, paletteY + dotRadius + 6);
    }
  }

  // 6. Watermark Footer
  const footerY = height - 42;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Craft your own patterns for free at www.pixel-craft-studio.com', width / 2, footerY);

  return canvas;
}
