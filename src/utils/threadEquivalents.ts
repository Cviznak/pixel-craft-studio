import { deltaE, rgbToLab } from './colorUtils';
import type { PaletteColor } from '../types/craft';

/**
 * Standard industry cross-reference table mapping DMC embroidery floss codes
 * to their closest Anchor stranded cotton equivalents.
 */
export const DMC_TO_ANCHOR_MAP: Record<string, { code: string; name: string }> = {
  // Whites, Creams & Lights
  'B5200': { code: '1', name: 'Snow White' },
  'Blanc': { code: '2', name: 'White' },
  'WHITE': { code: '2', name: 'White' },
  'Ecru': { code: '387', name: 'Ecru' },
  'ECRU': { code: '387', name: 'Ecru' },
  '3865': { code: '2', name: 'Winter White' },
  '712': { code: '926', name: 'Cream' },
  '822': { code: '390', name: 'Light Beige Gray' },
  '644': { code: '830', name: 'Medium Beige Gray' },
  '642': { code: '832', name: 'Dark Beige Gray' },

  // Yellows & Golds
  '3078': { code: '292', name: 'Golden Yellow Very Light' },
  '745': { code: '300', name: 'Yellow Pale' },
  '744': { code: '301', name: 'Yellow Pale Light' },
  '743': { code: '302', name: 'Yellow Medium' },
  '727': { code: '293', name: 'Topaz Very Light' },
  '726': { code: '295', name: 'Topaz Light' },
  '725': { code: '305', name: 'Topaz Medium Light' },
  '972': { code: '298', name: 'Deep Canary' },
  '973': { code: '297', name: 'Bright Canary' },
  '444': { code: '290', name: 'Lemon Dark' },
  '445': { code: '288', name: 'Lemon Light' },
  '307': { code: '289', name: 'Lemon' },
  '3822': { code: '295', name: 'Straw Light' },
  '3821': { code: '305', name: 'Straw' },
  '3820': { code: '306', name: 'Straw Dark' },
  '3852': { code: '307', name: 'Deep Straw' },

  // Oranges, Corals & Peaches
  '742': { code: '303', name: 'Light Tangerine' },
  '741': { code: '304', name: 'Tangerine Medium' },
  '740': { code: '324', name: 'Tangerine' },
  '947': { code: '330', name: 'Burnt Orange' },
  '946': { code: '332', name: 'Burnt Orange Medium' },
  '900': { code: '333', name: 'Burnt Orange Dark' },
  '3855': { code: '311', name: 'Autumn Gold Light' },
  '3854': { code: '313', name: 'Autumn Gold Medium' },
  '3853': { code: '314', name: 'Autumn Gold Dark' },
  '353': { code: '6', name: 'Peach Flesh' },
  '352': { code: '9', name: 'Coral Light' },
  '351': { code: '10', name: 'Coral' },
  '350': { code: '11', name: 'Coral Medium' },
  '349': { code: '13', name: 'Dark Coral' },
  '3708': { code: '31', name: 'Melon Light' },
  '3706': { code: '33', name: 'Melon Medium' },
  '3705': { code: '35', name: 'Melon Dark' },
  '3801': { code: '35', name: 'Light Red Orange' },

  // Reds, Pinks & Roses
  '666': { code: '46', name: 'Bright Red' },
  '321': { code: '47', name: 'Red' },
  '817': { code: '13', name: 'Coral Red Very Dark' },
  '816': { code: '45', name: 'Garnet' },
  '815': { code: '44', name: 'Garnet Medium' },
  '814': { code: '44', name: 'Garnet Dark' },
  '498': { code: '45', name: 'Red Dark' },
  '777': { code: '65', name: 'Very Dark Raspberry' },
  '605': { code: '52', name: 'Cranberry Very Light' },
  '604': { code: '55', name: 'Cranberry Light' },
  '603': { code: '55', name: 'Cranberry' },
  '602': { code: '60', name: 'Cranberry Medium' },
  '601': { code: '62', name: 'Cranberry Dark' },
  '600': { code: '63', name: 'Cranberry Very Dark' },
  '957': { code: '40', name: 'Geranium Pale' },
  '956': { code: '42', name: 'Geranium' },
  '963': { code: '73', name: 'Dusty Rose Ultra Light' },
  '962': { code: '75', name: 'Dusty Rose Medium' },
  '961': { code: '76', name: 'Dusty Rose Dark' },
  '3716': { code: '25', name: 'Dusty Rose Very Light' },
  '818': { code: '23', name: 'Baby Pink' },
  '776': { code: '24', name: 'Medium Pink' },
  '899': { code: '52', name: 'Rose Medium' },
  '335': { code: '38', name: 'Rose' },
  '326': { code: '41', name: 'Rose Very Dark' },
  '3833': { code: '86', name: 'Raspberry Light' },
  '3832': { code: '87', name: 'Raspberry Medium' },
  '3831': { code: '89', name: 'Raspberry Dark' },

  // Purples & Violets
  '554': { code: '96', name: 'Light Violet' },
  '553': { code: '98', name: 'Violet' },
  '552': { code: '100', name: 'Medium Violet' },
  '550': { code: '102', name: 'Very Dark Violet' },
  '211': { code: '107', name: 'Light Lavender' },
  '210': { code: '108', name: 'Medium Lavender' },
  '209': { code: '109', name: 'Dark Lavender' },
  '208': { code: '110', name: 'Very Dark Lavender' },
  '3837': { code: '99', name: 'Deep Lavender' },
  '327': { code: '102', name: 'Dark Violet' },
  '155': { code: '1028', name: 'Blue Violet Medium Soft' },
  '333': { code: '118', name: 'Blue Violet Very Dark' },

  // Blues & Teals
  '3846': { code: '1090', name: 'Light Bright Turquoise' },
  '3845': { code: '1089', name: 'Medium Bright Turquoise' },
  '3844': { code: '1088', name: 'Dark Bright Turquoise' },
  '996': { code: '433', name: 'Medium Electric Blue' },
  '995': { code: '410', name: 'Dark Electric Blue' },
  '827': { code: '160', name: 'Very Light Blue' },
  '826': { code: '161', name: 'Medium Blue' },
  '825': { code: '162', name: 'Dark Blue' },
  '824': { code: '164', name: 'Very Dark Blue' },
  '820': { code: '134', name: 'Very Dark Royal Blue' },
  '799': { code: '130', name: 'Medium Delft Blue' },
  '798': { code: '131', name: 'Dark Delft Blue' },
  '796': { code: '133', name: 'Dark Royal Blue' },
  '809': { code: '130', name: 'Delft Blue' },
  '800': { code: '128', name: 'Pale Delft Blue' },
  '312': { code: '979', name: 'Navy Blue Baby' },
  '311': { code: '148', name: 'Medium Navy Blue' },
  '336': { code: '150', name: 'Navy Blue' },
  '939': { code: '152', name: 'Very Dark Navy Blue' },
  '3842': { code: '923', name: 'Dark Wedgwood' },
  '3841': { code: '9159', name: 'Pale Baby Blue' },
  '3840': { code: '136', name: 'Light Lavender Blue' },
  '3839': { code: '137', name: 'Medium Lavender Blue' },
  '3838': { code: '139', name: 'Dark Lavender Blue' },

  // Greens
  '704': { code: '256', name: 'Chartreuse' },
  '702': { code: '239', name: 'Kelly Green' },
  '700': { code: '228', name: 'Bright Green' },
  '699': { code: '227', name: 'Green' },
  '907': { code: '255', name: 'Light Parrot Green' },
  '906': { code: '256', name: 'Parrot Green' },
  '905': { code: '257', name: 'Dark Parrot Green' },
  '904': { code: '258', name: 'Very Dark Parrot Green' },
  '912': { code: '209', name: 'Light Emerald Green' },
  '911': { code: '210', name: 'Medium Emerald Green' },
  '910': { code: '211', name: 'Dark Emerald Green' },
  '909': { code: '212', name: 'Very Dark Emerald Green' },
  '993': { code: '1064', name: 'Light Aquamarine' },
  '992': { code: '1066', name: 'Aquamarine' },
  '991': { code: '1068', name: 'Dark Aquamarine' },
  '959': { code: '185', name: 'Medium Seagreen' },
  '958': { code: '187', name: 'Dark Seagreen' },
  '3818': { code: '205', name: 'Ultra Very Dark Emerald' },
  '3812': { code: '188', name: 'Very Dark Seagreen' },
  '472': { code: '254', name: 'Ultra Light Avocado Green' },
  '471': { code: '265', name: 'Very Light Avocado Green' },
  '470': { code: '267', name: 'Light Avocado Green' },
  '469': { code: '268', name: 'Avocado Green' },
  '937': { code: '246', name: 'Medium Avocado Green' },
  '936': { code: '245', name: 'Very Dark Avocado Green' },
  '934': { code: '269', name: 'Black Avocado Green' },

  // Browns, Tans & Neutrals
  '437': { code: '362', name: 'Light Tan' },
  '436': { code: '368', name: 'Tan' },
  '435': { code: '374', name: 'Very Light Brown' },
  '434': { code: '310', name: 'Light Brown' },
  '433': { code: '375', name: 'Medium Brown' },
  '801': { code: '359', name: 'Dark Coffee Brown' },
  '898': { code: '360', name: 'Very Dark Coffee Brown' },
  '938': { code: '381', name: 'Ultra Dark Coffee Brown' },
  '3371': { code: '382', name: 'Black Brown' },
  '738': { code: '361', name: 'Very Light Tan' },
  '739': { code: '366', name: 'Ultra Very Light Tan' },
  '842': { code: '390', name: 'Very Light Beige Brown' },
  '841': { code: '391', name: 'Light Beige Brown' },
  '840': { code: '392', name: 'Medium Beige Brown' },
  '839': { code: '393', name: 'Dark Beige Brown' },
  '838': { code: '380', name: 'Very Dark Beige Brown' },

  // Grays & Black
  '762': { code: '234', name: 'Very Light Pearl Gray' },
  '415': { code: '398', name: 'Pearl Gray' },
  '414': { code: '235', name: 'Dark Steel Gray' },
  '413': { code: '401', name: 'Dark Pewter Gray' },
  '3799': { code: '236', name: 'Very Dark Pewter Gray' },
  '318': { code: '399', name: 'Light Steel Gray' },
  '169': { code: '848', name: 'Light Pewter' },
  '168': { code: '847', name: 'Very Light Pewter' },
  '310': { code: '403', name: 'Black' },
};

/**
 * Standard cross-reference table for Perler fuse beads to Artkal (S-series 5mm)
 * and Hama (Midi 5mm) equivalents.
 */
export const PERLER_TO_EQUIVALENTS_MAP: Record<
  string,
  { artkal: string; hama: string; name: string }
> = {
  'P01': { artkal: 'S01', hama: '01', name: 'White' },
  'P02': { artkal: 'S03', hama: '03', name: 'Yellow' },
  'P03': { artkal: 'S04', hama: '04', name: 'Orange' },
  'P05': { artkal: 'S02', hama: '05', name: 'Red' },
  'P06': { artkal: 'S11', hama: '07', name: 'Purple' },
  'P07': { artkal: 'S08', hama: '08', name: 'Dark Blue' },
  'P08': { artkal: 'S07', hama: '09', name: 'Light Blue' },
  'P09': { artkal: 'S13', hama: '10', name: 'Dark Green' },
  'P10': { artkal: 'S12', hama: '11', name: 'Green' },
  'P11': { artkal: 'S14', hama: '11', name: 'Light Green' },
  'P12': { artkal: 'S16', hama: '12', name: 'Brown' },
  'P13': { artkal: 'S15', hama: '17', name: 'Grey' },
  'P18': { artkal: 'S17', hama: '18', name: 'Black' },
  'P19': { artkal: 'S18', hama: '19', name: 'Clear' },
  'P20': { artkal: 'S19', hama: '20', name: 'Rust' },
  'P21': { artkal: 'S20', hama: '21', name: 'Light Brown' },
  'P22': { artkal: 'S21', hama: '26', name: 'Peach' },
  'P24': { artkal: 'S24', hama: '42', name: 'Magenta' },
  'P25': { artkal: 'S05', hama: '38', name: 'Cheddar' },
  'P26': { artkal: 'S26', hama: '02', name: 'Pastel Yellow' },
  'P27': { artkal: 'S27', hama: '47', name: 'Pastel Green' },
  'P28': { artkal: 'S28', hama: '46', name: 'Pastel Blue' },
  'P29': { artkal: 'S29', hama: '45', name: 'Pastel Lavender' },
  'P30': { artkal: 'S30', hama: '06', name: 'Bubblegum Pink' },
  'P31': { artkal: 'S31', hama: '27', name: 'Butterscotch' },
  'P32': { artkal: 'S32', hama: '49', name: 'Plum' },
  'P33': { artkal: 'S33', hama: '48', name: 'Periwinkle' },
  'P35': { artkal: 'S35', hama: '28', name: 'Dark Green' },
  'P36': { artkal: 'S36', hama: '71', name: 'Dark Grey' },
  'P37': { artkal: 'S37', hama: '70', name: 'Charcoal' },
  'P38': { artkal: 'S38', hama: '28', name: 'Evergreen' },
  'P39': { artkal: 'S39', hama: '49', name: 'Robin Egg' },
  'P40': { artkal: 'S40', hama: '22', name: 'Salmon' },
};

/**
 * Normalizes a color code string (e.g. "DMC 310", "310", "~DMC 666") and extracts the clean number
 */
export function extractDmcNumber(rawCode?: string): string | null {
  if (!rawCode) return null;
  const match = rawCode.match(/(?:DMC\s*)?([B0-9]+|Blanc|White|Ecru)/i);
  return match ? match[1].trim() : null;
}

/**
 * Returns the matching Anchor stranded cotton code and color name for a DMC code
 */
export function getAnchorEquivalent(rawCode?: string): { code: string; name: string } | null {
  const dmcNum = extractDmcNumber(rawCode);
  if (!dmcNum) return null;

  // Direct lookup
  if (DMC_TO_ANCHOR_MAP[dmcNum]) {
    return DMC_TO_ANCHOR_MAP[dmcNum];
  }

  // Case insensitive check
  const key = Object.keys(DMC_TO_ANCHOR_MAP).find(
    (k) => k.toLowerCase() === dmcNum.toLowerCase()
  );
  if (key) {
    return DMC_TO_ANCHOR_MAP[key];
  }

  return null;
}

/**
 * Returns the matching Artkal and Hama bead equivalents for a Perler code (e.g. "P05")
 */
export function getBeadEquivalents(perlerCode?: string): { artkal: string; hama: string; name: string } | null {
  if (!perlerCode) return null;
  const clean = perlerCode.toUpperCase().replace(/\s+/g, '');
  const match = clean.match(/P\d+/);
  const code = match ? match[0] : clean;
  return PERLER_TO_EQUIVALENTS_MAP[code] || null;
}

/**
 * Computes standard perceptual luminance / grayscale value (0 - 100)
 * Uses standard ITU-R BT.601 perceptual coefficients
 */
export function getPerceptualLuminance(r: number, g: number, b: number): number {
  return Math.round(((0.299 * r + 0.587 * g + 0.114 * b) / 255) * 100);
}

/**
 * Converts an RGB color to its pure perceptual grayscale hex representation
 */
export function getGrayscaleHex(r: number, g: number, b: number): string {
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  const hex = gray.toString(16).padStart(2, '0');
  return `#${hex}${hex}${hex}`;
}

export interface SimilarColorPair {
  indexA: number;
  indexB: number;
  colorA: PaletteColor;
  colorB: PaletteColor;
  deltaE: number;
}

/**
 * Identifies pairs of colors in a palette that are perceptually very close (deltaE < 12).
 * Allows stitchers and crafters to easily identify low-contrast colors that could blur together.
 */
export function findSimilarPalettePairs(palette: PaletteColor[], maxDeltaE = 12): SimilarColorPair[] {
  const pairs: SimilarColorPair[] = [];
  const labs = palette.map((c) => rgbToLab(c.r, c.g, c.b));

  for (let i = 0; i < palette.length; i++) {
    for (let j = i + 1; j < palette.length; j++) {
      const dist = deltaE(labs[i], labs[j]);
      if (dist < maxDeltaE) {
        pairs.push({
          indexA: i,
          indexB: j,
          colorA: palette[i],
          colorB: palette[j],
          deltaE: Math.round(dist * 10) / 10,
        });
      }
    }
  }

  return pairs.sort((a, b) => a.deltaE - b.deltaE);
}
