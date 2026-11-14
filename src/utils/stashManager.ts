import { DMC_COLORS, PERLER_COLORS, type CraftStandardColor } from './craftData';

const STORAGE_KEY_DMC = 'pixel_craft_stash_dmc';
const STORAGE_KEY_PERLER = 'pixel_craft_stash_perler';

// Popular starter presets for convenience
export const POPULAR_DMC_STARTER = [
  '310', 'B5200', 'Blanc', 'Ecru', '666', '321', '814', '743', '741', '972',
  '702', '699', '905', '798', '796', '820', '3846', '996', '602', '605',
  '915', '208', '209', '433', '436', '437', '801', '414', '415', '762',
  '3865', '745', '351', '947', '3806', '550'
];

export const POPULAR_PERLER_STARTER = [
  'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10',
  'P11', 'P12', 'P13', 'P14', 'P15', 'P16', 'P17', 'P18', 'P19', 'P20',
  'P21', 'P22', 'P23', 'P24', 'P25', 'P26', 'P27', 'P28', 'P29', 'P30',
  'P31', 'P32', 'P33', 'P34', 'P35', 'P36', 'P37', 'P38', 'P39', 'P40'
];

/**
 * Loads the user's stash set from localStorage.
 */
export function getMyStash(brand: 'DMC' | 'Perler'): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const key = brand === 'DMC' ? STORAGE_KEY_DMC : STORAGE_KEY_PERLER;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/**
 * Saves the user's stash set to localStorage.
 */
export function saveMyStash(brand: 'DMC' | 'Perler', stash: Set<string>): void {
  if (typeof window === 'undefined') return;
  const key = brand === 'DMC' ? STORAGE_KEY_DMC : STORAGE_KEY_PERLER;
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(stash)));
  } catch (err) {
    console.error('Failed to save stash to localStorage:', err);
  }
}

/**
 * Checks if a specific color code exists in the user's stash.
 */
export function isColorInStash(brand: 'DMC' | 'Perler', code: string): boolean {
  const stash = getMyStash(brand);
  return stash.has(code);
}

/**
 * Filters the catalog colors to only those in the user's stash.
 * If stash is empty, returns all colors to avoid breaking quantization.
 */
export function getAvailableStashColors(brand: 'DMC' | 'Perler'): CraftStandardColor[] {
  const all = brand === 'DMC' ? DMC_COLORS : PERLER_COLORS;
  const stash = getMyStash(brand);
  if (stash.size === 0) return all;

  const filtered = all.filter((c) => stash.has(c.code));
  return filtered.length > 0 ? filtered : all;
}
