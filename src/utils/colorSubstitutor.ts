import { deltaE, hexToRgb, rgbToHex, rgbToLab, type RGB } from './colorUtils';
import {
  DMC_COLORS,
  MIYUKI_DELICA_COLORS,
  PERLER_COLORS,
  type CraftStandardColor,
} from './craftData';
import {
  DMC_TO_ANCHOR_MAP,
  PERLER_TO_EQUIVALENTS_MAP,
  extractDmcNumber,
  getAnchorEquivalent,
  getBeadEquivalents,
} from './threadEquivalents';

export type SourceColorBrand = 'DMC' | 'Perler' | 'Miyuki' | 'Hex';

export type TargetSubstituteBrand =
  | 'DMC'
  | 'Anchor'
  | 'Perler'
  | 'Artkal'
  | 'Hama'
  | 'Miyuki'
  | 'MyDMCStash'
  | 'MyPerlerStash';

export interface ResolvedSourceColor {
  code: string;
  name: string;
  hex: string;
  brand: string;
  r: number;
  g: number;
  b: number;
}

export interface SubstituteOption {
  code: string;
  name: string;
  hex: string;
  brandLabel: string;
  deltaE: number;
  matchPercent: number;
  quality: 'Exact' | 'Very Close' | 'Good' | 'Approximate';
  note?: string;
}

export interface BatchSubstitutionRow {
  rawToken: string;
  resolved: ResolvedSourceColor | null;
  bestMatch: SubstituteOption | null;
  alternatives: SubstituteOption[];
  error?: string;
}

export interface TweedingBlendMatch {
  colorA: CraftStandardColor;
  colorB: CraftStandardColor;
  blendedHex: string;
  deltaE: number;
  matchPercent: number;
  pairContrastDeltaE: number;
  speckleRating: 'Smooth' | 'Subtle Tweed' | 'Marled';
}

function getQualityRating(dist: number): SubstituteOption['quality'] {
  if (dist < 2.5) return 'Exact';
  if (dist < 6.5) return 'Very Close';
  if (dist < 14) return 'Good';
  return 'Approximate';
}

function toMatchPercent(dist: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - dist * 1.4)));
}

/**
 * Parses messy multi-line, comma-separated, or space-separated thread/bead lists.
 * Handles formats like "DMC 310 - Black (2 skeins)", "310, 666, B5200", "#FF5500".
 */
export function parseColorCodeList(rawInput: string): string[] {
  if (!rawInput || !rawInput.trim()) return [];

  const tokens: string[] = [];
  const seen = new Set<string>();
  const lines = rawInput.split(/\r?\n|[,;]+/);

  for (const rawLine of lines) {
    let segment = rawLine.trim();
    if (!segment) continue;

    // Strip common trailing descriptions/quantities separated by " - ", " (", ":", tabs
    const descSplit = segment.split(/\s+[-–—]\s+|\s*\(|\t|:/);
    if (descSplit[0]?.trim()) {
      segment = descSplit[0].trim();
    }

    // If a segment still contains multiple tokens separated by spaces, split unless preceded directly by a single brand word
    const cleanedBrand = segment
      .replace(/^(?:dmc|anchor|perler|artkal|hama|miyuki|delica)\s+/i, '')
      .trim();

    const subTokens = cleanedBrand.split(/\s+/);
    for (let tok of subTokens) {
      tok = tok.replace(/^(?:dmc|perler|miyuki|delica)[-_]?/i, '').trim();
      if (!tok) continue;
      // Normalize pure hex without leading # when it looks like a standalone hex or keep as-is
      const dedupeKey = tok.toUpperCase();
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        tokens.push(tok);
        if (tokens.length >= 80) return tokens;
      }
    }
  }

  return tokens;
}

/**
 * Resolves a code or hex token against DMC, Perler, Miyuki Delica, or Hex.
 */
export function resolveSourceColor(
  token: string,
  sourceBrand: SourceColorBrand
): ResolvedSourceColor | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  if (sourceBrand === 'Hex' || trimmed.startsWith('#')) {
    const cleanHex = trimmed.replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(cleanHex)) {
      const normalized =
        cleanHex.length === 3
          ? `#${cleanHex
              .split('')
              .map((ch) => ch + ch)
              .join('')
              .toUpperCase()}`
          : `#${cleanHex.toUpperCase()}`;
      const rgb = hexToRgb(normalized);
      return {
        code: normalized,
        name: `Custom Hex ${normalized}`,
        hex: normalized,
        brand: 'Hex',
        r: rgb.r,
        g: rgb.g,
        b: rgb.b,
      };
    }
    if (sourceBrand === 'Hex') return null;
  }

  if (sourceBrand === 'DMC') {
    const extracted = extractDmcNumber(trimmed) || trimmed;
    const upper = extracted.toUpperCase();
    const match = DMC_COLORS.find((c) => c.code.toUpperCase() === upper);
    if (match) {
      return {
        code: match.code,
        name: match.name,
        hex: match.hex,
        brand: 'DMC',
        r: match.r,
        g: match.g,
        b: match.b,
      };
    }
    if (upper === 'WHITE') {
      const blanc = DMC_COLORS.find((c) => c.code.toUpperCase() === 'BLANC');
      if (blanc) {
        return {
          code: blanc.code,
          name: blanc.name,
          hex: blanc.hex,
          brand: 'DMC',
          r: blanc.r,
          g: blanc.g,
          b: blanc.b,
        };
      }
    }
    return null;
  }

  if (sourceBrand === 'Perler') {
    const stripped = trimmed.toUpperCase().replace(/^P/, '');
    const normalizedP = /^\d+$/.test(stripped) ? `P${stripped.padStart(2, '0')}` : trimmed.toUpperCase();
    const match = PERLER_COLORS.find(
      (c) => c.code.toUpperCase() === normalizedP || c.code.toUpperCase() === trimmed.toUpperCase()
    );
    if (!match) return null;
    return {
      code: match.code,
      name: match.name,
      hex: match.hex,
      brand: 'Perler',
      r: match.r,
      g: match.g,
      b: match.b,
    };
  }

  if (sourceBrand === 'Miyuki') {
    const digits = trimmed.toUpperCase().replace(/^DB[-_]?/, '');
    const padded = /^\d{1,4}$/.test(digits) ? `DB-${digits.padStart(4, '0')}` : trimmed.toUpperCase();
    const match = MIYUKI_DELICA_COLORS.find(
      (c) =>
        c.code.toUpperCase() === padded ||
        c.code.toUpperCase().replace('-', '') === trimmed.toUpperCase().replace('-', '')
    );
    if (!match) return null;
    return {
      code: match.code,
      name: match.name,
      hex: match.hex,
      brand: 'Miyuki',
      r: match.r,
      g: match.g,
      b: match.b,
    };
  }

  return null;
}

/**
 * Finds ranked substitutes for a resolved color against a target craft brand or personal stash.
 */
export function findSubstitutesForColor(
  source: { code: string; r: number; g: number; b: number; brand: string },
  targetBrand: TargetSubstituteBrand,
  options: { limit?: number; stashCodes?: Set<string> } = {}
): SubstituteOption[] {
  const limit = options.limit ?? 3;
  const targetLab = rgbToLab(source.r, source.g, source.b);

  if (targetBrand === 'Anchor') {
    const results: SubstituteOption[] = [];
    const usedAnchorCodes = new Set<string>();

    if (source.brand === 'DMC') {
      const exactAnchor = getAnchorEquivalent(source.code);
      if (exactAnchor) {
        usedAnchorCodes.add(exactAnchor.code);
        results.push({
          code: exactAnchor.code,
          name: exactAnchor.name,
          hex: rgbToHex(source.r, source.g, source.b),
          brandLabel: 'Anchor',
          deltaE: 0,
          matchPercent: 100,
          quality: 'Exact',
          note: 'Official DMC → Anchor table',
        });
      }
    }

    const mappedDmc = DMC_COLORS.map((dmc) => {
      const eq = DMC_TO_ANCHOR_MAP[dmc.code] || getAnchorEquivalent(dmc.code);
      return eq ? { dmc, eq, dist: deltaE(targetLab, dmc.lab) } : null;
    })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => a.dist - b.dist);

    for (const item of mappedDmc) {
      if (usedAnchorCodes.has(item.eq.code)) continue;
      usedAnchorCodes.add(item.eq.code);
      const roundedDist = Math.round(item.dist * 10) / 10;
      results.push({
        code: item.eq.code,
        name: item.eq.name,
        hex: item.dmc.hex,
        brandLabel: 'Anchor',
        deltaE: roundedDist,
        matchPercent: toMatchPercent(roundedDist),
        quality: getQualityRating(roundedDist),
        note: `Closest via DMC ${item.dmc.code}`,
      });
      if (results.length >= limit) break;
    }

    return results.slice(0, limit);
  }

  if (targetBrand === 'Artkal' || targetBrand === 'Hama') {
    const results: SubstituteOption[] = [];
    const seenTargetCodes = new Set<string>();
    const field = targetBrand === 'Artkal' ? 'artkal' : 'hama';

    if (source.brand === 'Perler') {
      const eq = getBeadEquivalents(source.code);
      if (eq) {
        const eqCode = eq[field];
        seenTargetCodes.add(eqCode);
        results.push({
          code: eqCode,
          name: eq.name,
          hex: rgbToHex(source.r, source.g, source.b),
          brandLabel: targetBrand,
          deltaE: 0,
          matchPercent: 100,
          quality: 'Exact',
          note: 'Official Perler cross-reference',
        });
      }
    }

    const mappedPerler = PERLER_COLORS.map((p) => {
      const eq = PERLER_TO_EQUIVALENTS_MAP[p.code] || getBeadEquivalents(p.code);
      return eq ? { p, eq, dist: deltaE(targetLab, p.lab) } : null;
    })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => a.dist - b.dist);

    for (const item of mappedPerler) {
      const targetCode = item.eq[field];
      if (seenTargetCodes.has(targetCode)) continue;
      seenTargetCodes.add(targetCode);
      const roundedDist = Math.round(item.dist * 10) / 10;
      results.push({
        code: targetCode,
        name: item.eq.name,
        hex: item.p.hex,
        brandLabel: targetBrand,
        deltaE: roundedDist,
        matchPercent: toMatchPercent(roundedDist),
        quality: getQualityRating(roundedDist),
        note: `Via Perler ${item.p.code}`,
      });
      if (results.length >= limit) break;
    }

    return results.slice(0, limit);
  }

  if (targetBrand === 'MyDMCStash' || targetBrand === 'MyPerlerStash') {
    const stash = options.stashCodes;
    if (!stash || stash.size === 0) return [];
    const catalog = targetBrand === 'MyDMCStash' ? DMC_COLORS : PERLER_COLORS;
    const brandLabel = targetBrand === 'MyDMCStash' ? 'My DMC Stash' : 'My Perler Stash';
    const owned = catalog.filter((c) => stash.has(c.code));
    if (owned.length === 0) return [];

    return owned
      .map((c) => {
        const isExactOwn =
          c.brand.toUpperCase() === source.brand.toUpperCase() &&
          c.code.toUpperCase() === source.code.toUpperCase();
        const dist = isExactOwn ? 0 : Math.round(deltaE(targetLab, c.lab) * 10) / 10;
        return {
          code: c.code,
          name: c.name,
          hex: c.hex,
          brandLabel,
          deltaE: dist,
          matchPercent: isExactOwn ? 100 : toMatchPercent(dist),
          quality: isExactOwn ? ('Exact' as const) : getQualityRating(dist),
          note: isExactOwn ? 'Already in your stash' : 'Owned close match',
        };
      })
      .sort((a, b) => a.deltaE - b.deltaE)
      .slice(0, limit);
  }

  const catalog =
    targetBrand === 'DMC'
      ? DMC_COLORS
      : targetBrand === 'Perler'
      ? PERLER_COLORS
      : MIYUKI_DELICA_COLORS;

  const isSameBrand = source.brand.toUpperCase() === targetBrand.toUpperCase();

  return catalog
    .filter((c) => !isSameBrand || c.code.toUpperCase() !== source.code.toUpperCase())
    .map((c) => {
      const dist = Math.round(deltaE(targetLab, c.lab) * 10) / 10;
      return {
        code: c.code,
        name: c.name,
        hex: c.hex,
        brandLabel: targetBrand,
        deltaE: dist,
        matchPercent: toMatchPercent(dist),
        quality: getQualityRating(dist),
        note: isSameBrand ? 'Closest in-catalog alternative' : undefined,
      };
    })
    .sort((a, b) => a.deltaE - b.deltaE)
    .slice(0, limit);
}

/**
 * Batch-converts an arbitrary pasted list of thread/bead codes or hex strings.
 */
export function runBatchSubstitution(
  rawInput: string,
  sourceBrand: SourceColorBrand,
  targetBrand: TargetSubstituteBrand,
  stashCodes?: Set<string>
): BatchSubstitutionRow[] {
  const tokens = parseColorCodeList(rawInput);

  return tokens.map((token) => {
    const resolved = resolveSourceColor(token, sourceBrand);
    if (!resolved) {
      return {
        rawToken: token,
        resolved: null,
        bestMatch: null,
        alternatives: [],
        error: `Unrecognized ${sourceBrand} code "${token}"`,
      };
    }

    const matches = findSubstitutesForColor(resolved, targetBrand, {
      limit: 4,
      stashCodes,
    });

    return {
      rawToken: token,
      resolved,
      bestMatch: matches[0] || null,
      alternatives: matches,
    };
  });
}

function srgbChannelToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearChannelToSrgb(lin: number): number {
  const clamped = Math.max(0, Math.min(1, lin));
  const v =
    clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return Math.round(v * 255);
}

/**
 * Optical 50/50 2-strand thread tweeding blend recommender using linear sRGB mixing
 * and CIELAB Delta E perceptual distance.
 */
export function findTwoStrandTweedingBlends(
  targetRgb: RGB,
  candidatePool: CraftStandardColor[] = DMC_COLORS,
  options: { excludeCode?: string; limit?: number; maxPairSpread?: number } = {}
): TweedingBlendMatch[] {
  const limit = options.limit ?? 5;
  const maxPairSpread = options.maxPairSpread ?? 42;
  const targetLab = rgbToLab(targetRgb.r, targetRgb.g, targetRgb.b);

  const excludeUpper = options.excludeCode?.trim().toUpperCase();
  const filteredPool = excludeUpper
    ? candidatePool.filter((c) => c.code.toUpperCase() !== excludeUpper)
    : candidatePool;

  if (filteredPool.length < 2) return [];

  // Pre-filter to top 42 nearest candidates so pair search stays well under 900 pairs
  const nearest = filteredPool
    .map((c) => ({ c, dist: deltaE(targetLab, c.lab) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 42)
    .map((entry) => entry.c);

  const matches: Array<{ match: TweedingBlendMatch; rankScore: number }> = [];

  for (let i = 0; i < nearest.length; i++) {
    const a = nearest[i];
    const aLinR = srgbChannelToLinear(a.r);
    const aLinG = srgbChannelToLinear(a.g);
    const aLinB = srgbChannelToLinear(a.b);

    for (let j = i + 1; j < nearest.length; j++) {
      const b = nearest[j];
      const pairSpread = deltaE(a.lab, b.lab);
      if (pairSpread > maxPairSpread) continue;

      const mixR = linearChannelToSrgb((aLinR + srgbChannelToLinear(b.r)) / 2);
      const mixG = linearChannelToSrgb((aLinG + srgbChannelToLinear(b.g)) / 2);
      const mixB = linearChannelToSrgb((aLinB + srgbChannelToLinear(b.b)) / 2);

      const mixLab = rgbToLab(mixR, mixG, mixB);
      const rawDist = deltaE(targetLab, mixLab);
      const roundedDist = Math.round(rawDist * 10) / 10;
      const roundedSpread = Math.round(pairSpread * 10) / 10;

      const speckleRating: TweedingBlendMatch['speckleRating'] =
        roundedSpread < 16 ? 'Smooth' : roundedSpread < 28 ? 'Subtle Tweed' : 'Marled';

      // Slightly prefer smoother blends when target error is nearly identical
      const rankScore = rawDist + pairSpread * 0.04;

      matches.push({
        rankScore,
        match: {
          colorA: a,
          colorB: b,
          blendedHex: rgbToHex(mixR, mixG, mixB).toUpperCase(),
          deltaE: roundedDist,
          matchPercent: toMatchPercent(roundedDist),
          pairContrastDeltaE: roundedSpread,
          speckleRating,
        },
      });
    }
  }

  return matches
    .sort((x, y) => x.rankScore - y.rankScore)
    .slice(0, limit)
    .map((item) => item.match);
}
