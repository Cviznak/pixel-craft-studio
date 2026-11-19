import { rgbToLab } from './colorUtils';

export type BgRemovalMode = 'auto-edge' | 'magic-wand' | 'global-color';

export interface BgSeedPoint {
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
}

export interface BgBrushStroke {
  x: number;      // Normalized 0..1
  y: number;      // Normalized 0..1
  radius: number; // Normalized to max(width, height)
  action: 'erase' | 'restore';
}

export interface BgRemovalOptions {
  mode: BgRemovalMode;
  tolerance: number; // 8..70 CIELAB Delta E
  smoothEdges: boolean;
  autoTrim: boolean;
  seeds: BgSeedPoint[];
  strokes: BgBrushStroke[];
}

export interface BgRemovalResult {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  removedPercent: number;
  subjectWidth: number;
  subjectHeight: number;
}

interface LabTuple {
  l: number;
  a: number;
  b: number;
}

function labDistance(l1: number, a1: number, b1: number, l2: number, a2: number, b2: number): number {
  const dl = l1 - l2;
  const da = a1 - a2;
  const db = b1 - b2;
  return Math.sqrt(dl * dl + da * da + db * db);
}

function minClusterDistance(
  l: number,
  a: number,
  b: number,
  clusters: LabTuple[]
): number {
  let minD = Infinity;
  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    const d = labDistance(l, a, b, c.l, c.a, c.b);
    if (d < minD) minD = d;
  }
  return minD;
}

/**
 * Performs 100% in-browser background removal using CIELAB perceptual segmentation,
 * perimeter flood-filling, magic-wand seed regions, manual brush touch-ups,
 * edge defringing, and optional auto-trimming.
 */
export function removeImageBackground(
  img: HTMLImageElement,
  options: BgRemovalOptions,
  maxPreviewDim = 720
): BgRemovalResult {
  const srcW = Math.max(1, img.naturalWidth || img.width);
  const srcH = Math.max(1, img.naturalHeight || img.height);
  const scale = Math.min(1, maxPreviewDim / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  const total = w * h;

  const workCanvas = document.createElement('canvas');
  workCanvas.width = w;
  workCanvas.height = h;
  const ctx = workCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not acquire 2D canvas context');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 1. Precompute flat CIELAB buffers & track existing image alpha
  const labL = new Float32Array(total);
  const labA = new Float32Array(total);
  const labB = new Float32Array(total);
  const origAlpha = new Uint8Array(total);
  const alphaMask = new Uint8Array(total);

  for (let i = 0; i < total; i++) {
    const p = i * 4;
    const aVal = data[p + 3];
    origAlpha[i] = aVal;
    alphaMask[i] = aVal < 64 ? 0 : 255;

    const lab = rgbToLab(data[p], data[p + 1], data[p + 2]);
    labL[i] = lab.l;
    labA[i] = lab.a;
    labB[i] = lab.b;
  }

  // 2. Gather border or seed reference color clusters
  const targetClusters: LabTuple[] = [];
  const addCluster = (l: number, a: number, b: number, clusterMergeThreshold = 16) => {
    for (let i = 0; i < targetClusters.length; i++) {
      const c = targetClusters[i];
      if (labDistance(l, a, b, c.l, c.a, c.b) <= clusterMergeThreshold) {
        return;
      }
    }
    if (targetClusters.length < 6) {
      targetClusters.push({ l, a, b });
    }
  };

  // Sample perimeter pixels (2px ring) for auto-edge detection
  const perimeterIndices: number[] = [];
  for (let x = 0; x < w; x++) {
    perimeterIndices.push(x);
    if (h > 1) perimeterIndices.push((h - 1) * w + x);
  }
  for (let y = 1; y < h - 1; y++) {
    perimeterIndices.push(y * w);
    if (w > 1) perimeterIndices.push(y * w + (w - 1));
  }

  const tol = Math.max(4, options.tolerance);

  // Build seed pixel indices if any
  const seedIndices: number[] = options.seeds
    .map((s) => {
      const sx = Math.max(0, Math.min(w - 1, Math.round(s.x * (w - 1))));
      const sy = Math.max(0, Math.min(h - 1, Math.round(s.y * (h - 1))));
      return sy * w + sx;
    })
    .filter((idx) => origAlpha[idx] >= 64);

  if (options.mode === 'auto-edge') {
    const sampleStep = Math.max(1, Math.floor(perimeterIndices.length / 120));
    for (let i = 0; i < perimeterIndices.length; i += sampleStep) {
      const idx = perimeterIndices[i];
      if (origAlpha[idx] >= 64) {
        addCluster(labL[idx], labA[idx], labB[idx], 16);
      }
    }
    for (const sIdx of seedIndices) {
      addCluster(labL[sIdx], labA[sIdx], labB[sIdx], 12);
    }

    if (targetClusters.length > 0) {
      const visited = new Uint8Array(total);
      const queue = new Int32Array(total);
      let head = 0;
      let tail = 0;

      const trySeed = (idx: number) => {
        if (visited[idx]) return;
        if (origAlpha[idx] < 64) {
          visited[idx] = 1;
          alphaMask[idx] = 0;
          queue[tail++] = idx;
          return;
        }
        const d = minClusterDistance(labL[idx], labA[idx], labB[idx], targetClusters);
        if (d <= tol) {
          visited[idx] = 1;
          alphaMask[idx] = 0;
          queue[tail++] = idx;
        }
      };

      for (let i = 0; i < perimeterIndices.length; i++) {
        trySeed(perimeterIndices[i]);
      }
      for (const sIdx of seedIndices) {
        visited[sIdx] = 1;
        alphaMask[sIdx] = 0;
        queue[tail++] = sIdx;
      }

      const neighbors = [-1, 1, -w, w];
      while (head < tail) {
        const cur = queue[head++];
        const cx = cur % w;
        const cy = (cur - cx) / w;

        for (let k = 0; k < 4; k++) {
          if (k === 0 && cx === 0) continue;
          if (k === 1 && cx === w - 1) continue;
          if (k === 2 && cy === 0) continue;
          if (k === 3 && cy === h - 1) continue;

          const nxt = cur + neighbors[k];
          if (visited[nxt]) continue;

          if (origAlpha[nxt] < 64) {
            visited[nxt] = 1;
            alphaMask[nxt] = 0;
            queue[tail++] = nxt;
            continue;
          }

          const clusterDist = minClusterDistance(labL[nxt], labA[nxt], labB[nxt], targetClusters);
          const stepDist = labDistance(labL[cur], labA[cur], labB[cur], labL[nxt], labA[nxt], labB[nxt]);

          if (
            clusterDist <= tol ||
            (origAlpha[cur] >= 64 && stepDist <= tol * 0.55 && clusterDist <= tol * 1.35)
          ) {
            visited[nxt] = 1;
            alphaMask[nxt] = 0;
            queue[tail++] = nxt;
          }
        }
      }
    }
  } else if (options.mode === 'magic-wand') {
    const wandStarts =
      seedIndices.length > 0
        ? seedIndices
        : [0, w - 1, (h - 1) * w, h * w - 1].filter((idx) => idx >= 0 && idx < total);

    for (const startIdx of wandStarts) {
      if (origAlpha[startIdx] < 64) continue;
      const refL = labL[startIdx];
      const refA = labA[startIdx];
      const refB = labB[startIdx];
      addCluster(refL, refA, refB, 14);

      const visited = new Uint8Array(total);
      const queue = new Int32Array(total);
      let head = 0;
      let tail = 0;
      visited[startIdx] = 1;
      alphaMask[startIdx] = 0;
      queue[tail++] = startIdx;

      const neighbors = [-1, 1, -w, w];
      while (head < tail) {
        const cur = queue[head++];
        const cx = cur % w;
        const cy = (cur - cx) / w;

        for (let k = 0; k < 4; k++) {
          if (k === 0 && cx === 0) continue;
          if (k === 1 && cx === w - 1) continue;
          if (k === 2 && cy === 0) continue;
          if (k === 3 && cy === h - 1) continue;

          const nxt = cur + neighbors[k];
          if (visited[nxt] || origAlpha[nxt] < 64) continue;

          const dRef = labDistance(labL[nxt], labA[nxt], labB[nxt], refL, refA, refB);
          const dStep = labDistance(labL[cur], labA[cur], labB[cur], labL[nxt], labA[nxt], labB[nxt]);
          if (dRef <= tol || (dStep <= tol * 0.45 && dRef <= tol * 1.3)) {
            visited[nxt] = 1;
            alphaMask[nxt] = 0;
            queue[tail++] = nxt;
          }
        }
      }
    }
  } else if (options.mode === 'global-color') {
    if (seedIndices.length > 0) {
      for (const sIdx of seedIndices) {
        addCluster(labL[sIdx], labA[sIdx], labB[sIdx], 10);
      }
    } else {
      const sampleStep = Math.max(1, Math.floor(perimeterIndices.length / 80));
      for (let i = 0; i < perimeterIndices.length; i += sampleStep) {
        const idx = perimeterIndices[i];
        if (origAlpha[idx] >= 64) {
          addCluster(labL[idx], labA[idx], labB[idx], 16);
        }
      }
    }

    if (targetClusters.length > 0) {
      for (let i = 0; i < total; i++) {
        if (origAlpha[i] < 64) continue;
        if (minClusterDistance(labL[i], labA[i], labB[i], targetClusters) <= tol) {
          alphaMask[i] = 0;
        }
      }
    }
  }

  // 3. Apply manual erase / restore brush strokes
  if (options.strokes.length > 0) {
    const maxDim = Math.max(w, h);
    for (const stroke of options.strokes) {
      const cx = Math.round(stroke.x * (w - 1));
      const cy = Math.round(stroke.y * (h - 1));
      const rPx = Math.max(2, Math.round(stroke.radius * maxDim));
      const rSq = rPx * rPx;

      const x0 = Math.max(0, cx - rPx);
      const x1 = Math.min(w - 1, cx + rPx);
      const y0 = Math.max(0, cy - rPx);
      const y1 = Math.min(h - 1, cy + rPx);

      for (let yy = y0; yy <= y1; yy++) {
        const dy = yy - cy;
        for (let xx = x0; xx <= x1; xx++) {
          const dx = xx - cx;
          if (dx * dx + dy * dy <= rSq) {
            const idx = yy * w + xx;
            if (stroke.action === 'erase') {
              alphaMask[idx] = 0;
            } else if (origAlpha[idx] >= 32) {
              alphaMask[idx] = 255;
            }
          }
        }
      }
    }
  }

  // 4. Optional dust/pinhole cleanup + boundary defringing
  if (options.smoothEdges && w >= 3 && h >= 3) {
    const snap = new Uint8Array(alphaMask);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        let bgCount = 0;
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            if (ox === 0 && oy === 0) continue;
            if (snap[(y + oy) * w + (x + ox)] < 64) bgCount++;
          }
        }

        if (snap[idx] >= 64 && bgCount >= 6) {
          // Isolated foreground speck
          alphaMask[idx] = 0;
        } else if (snap[idx] < 64 && bgCount <= 1 && origAlpha[idx] >= 64) {
          // Tiny interior pinhole
          alphaMask[idx] = 255;
        }
      }
    }

    // Softly feather 1px boundary pixels that still lean close to background clusters
    if (targetClusters.length > 0) {
      const postSnap = new Uint8Array(alphaMask);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          if (postSnap[idx] < 64) continue;
          const hasBgNeighbor =
            postSnap[idx - 1] < 64 ||
            postSnap[idx + 1] < 64 ||
            postSnap[idx - w] < 64 ||
            postSnap[idx + w] < 64;
          if (hasBgNeighbor) {
            const d = minClusterDistance(labL[idx], labA[idx], labB[idx], targetClusters);
            if (d <= tol * 1.15) {
              alphaMask[idx] = 110;
            }
          }
        }
      }
    }
  }

  // 5. Commit alpha mask & track foreground bounding box + removed count
  let removedCount = 0;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const aVal = alphaMask[idx];
      data[idx * 4 + 3] = aVal;

      if (aVal < 64) {
        removedCount++;
      } else {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const removedPercent = Math.round((removedCount / Math.max(1, total)) * 100);

  // 6. Optional auto-trim with 4% breathing padding
  let outCanvas = workCanvas;
  if (options.autoTrim && maxX >= minX && maxY >= minY) {
    const spanW = maxX - minX + 1;
    const spanH = maxY - minY + 1;
    const pad = Math.max(4, Math.round(Math.max(spanW, spanH) * 0.04));

    const cropX = Math.max(0, minX - pad);
    const cropY = Math.max(0, minY - pad);
    const cropR = Math.min(w - 1, maxX + pad);
    const cropB = Math.min(h - 1, maxY + pad);
    const cropW = cropR - cropX + 1;
    const cropH = cropB - cropY + 1;

    if (cropW < w || cropH < h) {
      const trimmed = document.createElement('canvas');
      trimmed.width = cropW;
      trimmed.height = cropH;
      const tCtx = trimmed.getContext('2d');
      if (tCtx) {
        tCtx.drawImage(workCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        outCanvas = trimmed;
      }
    }
  }

  return {
    canvas: outCanvas,
    dataUrl: outCanvas.toDataURL('image/png'),
    removedPercent,
    subjectWidth: outCanvas.width,
    subjectHeight: outCanvas.height,
  };
}
