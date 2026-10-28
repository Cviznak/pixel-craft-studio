import type { PaletteColor, ExtractionMode, CraftStandard } from '../types/craft';
import { rgbToLab, deltaE, getVibrance, rgbToHex, type LAB, type RGB } from './colorUtils';
import { getCraftSymbol } from './symbols';
import { findClosestCraftColor } from './craftData';

interface SamplePixel {
  r: number;
  g: number;
  b: number;
  lab: LAB;
  vibrance: number;
  weight: number;
}

/**
 * Extracts a high-accuracy, aesthetically balanced color palette from image data.
 * Uses perceptual CIELAB color space and K-Means clustering.
 */
export function extractBeautifulPalette(
  imageData: ImageData,
  k: number,
  mode: ExtractionMode = 'balanced',
  craftStandard: CraftStandard = 'custom',
  lockedColors: PaletteColor[] = []
): PaletteColor[] {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  
  // 1. Gather representative pixels (sample densely for high color accuracy)
  const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / 30000)));
  const pixels: SamplePixel[] = [];

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a < 64) continue; // skip transparent pixels

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lab = rgbToLab(r, g, b);
      const vibrance = getVibrance(r, g, b);

      let weight = 1.0;
      if (mode === 'vibrant') {
        // Subtle boost for rich jewel tones while preserving true subject colors
        weight = 1.0 + vibrance * 1.8;
      } else if (mode === 'balanced') {
        // Natural balanced weighting
        weight = 1.0 + vibrance * 0.4;
      } else if (mode === 'dominant') {
        // Pure frequency based (true photographic realism)
        weight = 1.0;
      } else if (mode === 'pastel') {
        // Favor lighter pastel tones
        const lum = lab.l / 100;
        weight = (lum > 0.55 ? 1.8 : 0.7) + vibrance * 0.8;
      }

      pixels.push({ r, g, b, lab, vibrance, weight });
    }
  }

  if (pixels.length === 0) {
    return [
      { id: 'color-0', hex: '#000000', r: 0, g: 0, b: 0, symbol: '●', count: 0, percentage: 100 }
    ];
  }

  // 2. K-means++ initialization in CIELAB space
  const centroids: RGB[] = [];
  
  // Include any user-locked colors first
  lockedColors.forEach(locked => {
    centroids.push({ r: locked.r, g: locked.g, b: locked.b });
  });

  const neededK = Math.min(k, pixels.length);

  // If no locked colors, pick the initial centroid deterministically
  if (centroids.length === 0) {
    let bestPix = pixels[0];
    let maxScore = -1;

    if (mode === 'dominant') {
      // Pick pixel closest to overall mean LAB
      let sumL = 0, sumA = 0, sumB = 0;
      for (const p of pixels) {
        sumL += p.lab.l;
        sumA += p.lab.a;
        sumB += p.lab.b;
      }
      const meanLab: LAB = {
        l: sumL / pixels.length,
        a: sumA / pixels.length,
        b: sumB / pixels.length,
      };
      let minDist = Infinity;
      for (const p of pixels) {
        const d = deltaE(p.lab, meanLab);
        if (d < minDist) {
          minDist = d;
          bestPix = p;
        }
      }
    } else {
      // Pick highest weighted pixel
      for (const p of pixels) {
        if (p.weight > maxScore) {
          maxScore = p.weight;
          bestPix = p;
        }
      }
    }
    centroids.push({ r: bestPix.r, g: bestPix.g, b: bestPix.b });
  }

  // K-means++ seeding: choose points with probability proportional to D(x)^2
  while (centroids.length < neededK) {
    const centroidLabs = centroids.map(c => rgbToLab(c.r, c.g, c.b));
    let totalDistSq = 0;
    const distances: number[] = new Array(pixels.length);

    for (let i = 0; i < pixels.length; i++) {
      const p = pixels[i];
      let minDist = Infinity;
      for (const cLab of centroidLabs) {
        const d = deltaE(p.lab, cLab);
        if (d < minDist) minDist = d;
      }
      const dWeighted = minDist * p.weight;
      distances[i] = dWeighted * dWeighted;
      totalDistSq += distances[i];
    }

    let target = Math.random() * totalDistSq;
    let chosenIndex = 0;
    for (let i = 0; i < pixels.length; i++) {
      target -= distances[i];
      if (target <= 0) {
        chosenIndex = i;
        break;
      }
    }

    const chosen = pixels[chosenIndex];
    centroids.push({ r: chosen.r, g: chosen.g, b: chosen.b });
  }

  // 3. Iterative K-Means refinement in CIELAB space
  const maxIters = 14;
  let clusters: SamplePixel[][] = Array.from({ length: centroids.length }, () => []);

  for (let iter = 0; iter < maxIters; iter++) {
    clusters = Array.from({ length: centroids.length }, () => []);
    const centroidLabs = centroids.map(c => rgbToLab(c.r, c.g, c.b));

    for (const p of pixels) {
      let minDist = Infinity;
      let closestIdx = 0;
      for (let j = 0; j < centroidLabs.length; j++) {
        const d = deltaE(p.lab, centroidLabs[j]);
        if (d < minDist) {
          minDist = d;
          closestIdx = j;
        }
      }
      clusters[closestIdx].push(p);
    }

    // Recompute centroids using weighted average
    let maxShift = 0;
    for (let j = 0; j < centroids.length; j++) {
      // Preserve locked colors
      if (j < lockedColors.length) continue;

      const cluster = clusters[j];
      if (cluster.length === 0) continue;

      let sumR = 0, sumG = 0, sumB = 0, totalW = 0;
      for (const p of cluster) {
        sumR += p.r * p.weight;
        sumG += p.g * p.weight;
        sumB += p.b * p.weight;
        totalW += p.weight;
      }

      const newR = Math.round(sumR / totalW);
      const newG = Math.round(sumG / totalW);
      const newB = Math.round(sumB / totalW);

      const shift = Math.abs(centroids[j].r - newR) + Math.abs(centroids[j].g - newG) + Math.abs(centroids[j].b - newB);
      if (shift > maxShift) maxShift = shift;

      centroids[j] = { r: newR, g: newG, b: newB };
    }

    if (maxShift < 2) break;
  }

  // 4. Prune only imperceptible near-identical duplicates (deltaE < 2.8)
  const distinctCentroids: RGB[] = [];
  for (const c of centroids) {
    const cLab = rgbToLab(c.r, c.g, c.b);
    const isTooClose = distinctCentroids.some(existing => {
      const eLab = rgbToLab(existing.r, existing.g, existing.b);
      return deltaE(cLab, eLab) < 2.8; // Only prune imperceptible duplicates
    });
    if (!isTooClose || distinctCentroids.length < Math.min(3, centroids.length)) {
      distinctCentroids.push(c);
    }
  }

  // If pruning left fewer than neededK, fill back with furthest distinct pixels
  while (distinctCentroids.length < neededK && pixels.length > distinctCentroids.length) {
    const currentLabs = distinctCentroids.map(c => rgbToLab(c.r, c.g, c.b));
    let maxDist = -1;
    let bestPix = pixels[0];

    for (const p of pixels) {
      let minDist = Infinity;
      for (const cLab of currentLabs) {
        const d = deltaE(p.lab, cLab);
        if (d < minDist) minDist = d;
      }
      const score = minDist * p.weight;
      if (score > maxDist) {
        maxDist = score;
        bestPix = p;
      }
    }

    distinctCentroids.push({ r: bestPix.r, g: bestPix.g, b: bestPix.b });
  }

  // 5. Build final PaletteColor items
  const palette: PaletteColor[] = distinctCentroids.map((c, idx) => {
    let finalR = c.r;
    let finalG = c.g;
    let finalB = c.b;
    let name: string | undefined;
    let code: string | undefined;
    let brand: 'DMC' | 'Perler' | 'Custom' = 'Custom';

    if (craftStandard === 'dmc') {
      const match = findClosestCraftColor(finalR, finalG, finalB, 'DMC');
      finalR = match.r;
      finalG = match.g;
      finalB = match.b;
      name = match.name;
      code = `DMC ${match.code}`;
      brand = 'DMC';
    } else if (craftStandard === 'perler') {
      const match = findClosestCraftColor(finalR, finalG, finalB, 'Perler');
      finalR = match.r;
      finalG = match.g;
      finalB = match.b;
      name = match.name;
      code = `Perler ${match.code}`;
      brand = 'Perler';
    } else {
      // In Custom mode, keep exact true photo RGB colors, but provide nearest DMC match as reference tag
      const match = findClosestCraftColor(finalR, finalG, finalB, 'DMC');
      name = match.name;
      code = `~DMC ${match.code}`;
      brand = 'Custom';
    }

    const hex = rgbToHex(finalR, finalG, finalB);

    return {
      id: `color-${idx}`,
      hex,
      r: finalR,
      g: finalG,
      b: finalB,
      symbol: getCraftSymbol(idx),
      count: 0,
      percentage: 0,
      name,
      code,
      brand,
      isLocked: idx < lockedColors.length,
    };
  });

  return palette;
}
