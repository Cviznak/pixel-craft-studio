export interface CraftStandardColor {
  code: string;
  name: string;
  hex: string;
  r: number;
  g: number;
  b: number;
  brand: 'DMC' | 'Perler';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}

// Top DMC Embroidery & Cross-Stitch Floss Colors
const rawDMC = [
  { code: '310', name: 'Black', hex: '#000000' },
  { code: 'B5200', name: 'Snow White', hex: '#FFFFFF' },
  { code: 'Blanc', name: 'White', hex: '#FDFBF7' },
  { code: 'Ecru', name: 'Ecru', hex: '#F0EAD6' },
  { code: '666', name: 'Bright Red', hex: '#E31837' },
  { code: '321', name: 'Red', hex: '#C72435' },
  { code: '817', name: 'Coral Red Very Dark', hex: '#A8182B' },
  { code: '814', name: 'Garnet Dark', hex: '#770A1E' },
  { code: '3801', name: 'Light Red Orange', hex: '#E63E51' },
  { code: '602', name: 'Cranberry Medium', hex: '#DF3873' },
  { code: '605', name: 'Cranberry Very Light', hex: '#FFB8CF' },
  { code: '956', name: 'Geranium', hex: '#FF4E79' },
  { code: '3706', name: 'Melon Medium', hex: '#FF7D79' },
  { code: '741', name: 'Tangerine Medium', hex: '#FFA200' },
  { code: '740', name: 'Tangerine', hex: '#FF7800' },
  { code: '947', name: 'Burnt Orange', hex: '#F85507' },
  { code: '743', name: 'Yellow Medium', hex: '#FED648' },
  { code: '725', name: 'Topaz Medium Light', hex: '#F7C631' },
  { code: '444', name: 'Lemon Dark', hex: '#FFD700' },
  { code: '702', name: 'Kelly Green', hex: '#26A247' },
  { code: '700', name: 'Bright Green', hex: '#077E36' },
  { code: '699', name: 'Green', hex: '#05622A' },
  { code: '907', name: 'Parrot Green Light', hex: '#A6D63E' },
  { code: '906', name: 'Parrot Green Medium', hex: '#7CB929' },
  { code: '905', name: 'Parrot Green Dark', hex: '#588E23' },
  { code: '958', name: 'Seagreen Dark', hex: '#379F88' },
  { code: '964', name: 'Seagreen Light', hex: '#A7E1D4' },
  { code: '3849', name: 'Teal Green Light', hex: '#4BA199' },
  { code: '3848', name: 'Teal Green Medium', hex: '#327D78' },
  { code: '996', name: 'Electric Blue Medium', hex: '#00A8DE' },
  { code: '3846', name: 'Bright Turquoise Light', hex: '#00BBE4' },
  { code: '798', name: 'Delft Blue Dark', hex: '#4465A6' },
  { code: '796', name: 'Royal Blue Dark', hex: '#113E7F' },
  { code: '820', name: 'Royal Blue Very Dark', hex: '#09255C' },
  { code: '826', name: 'Blue Medium', hex: '#5E8FB5' },
  { code: '827', name: 'Blue Very Light', hex: '#BDD7E7' },
  { code: '550', name: 'Violet Very Dark', hex: '#5C1D6B' },
  { code: '208', name: 'Lavender Very Dark', hex: '#814187' },
  { code: '209', name: 'Lavender Dark', hex: '#A56A9F' },
  { code: '210', name: 'Lavender Medium', hex: '#C595C0' },
  { code: '553', name: 'Violet', hex: '#875184' },
  { code: '433', name: 'Brown Medium', hex: '#784323' },
  { code: '435', name: 'Brown Very Light', hex: '#B8784C' },
  { code: '436', name: 'Tan', hex: '#C98F5E' },
  { code: '437', name: 'Tan Light', hex: '#DDB386' },
  { code: '738', name: 'Tan Very Light', hex: '#E7CCAA' },
  { code: '801', name: 'Coffee Brown Dark', hex: '#5C3117' },
  { code: '898', name: 'Coffee Brown Very Dark', hex: '#492612' },
  { code: '414', name: 'Steel Gray Dark', hex: '#8C8C8C' },
  { code: '415', name: 'Pearl Gray', hex: '#D2D3D5' },
  { code: '762', name: 'Pearl Gray Very Light', hex: '#ECECEC' },
  { code: '168', name: 'Pewter Very Light', hex: '#C8CDCE' },
  { code: '3799', name: 'Pewter Gray Very Dark', hex: '#3E4144' },
  { code: '3865', name: 'Winter White', hex: '#FAF7F0' }
];

// Official Perler / Hama Bead Colors
const rawPerler = [
  { code: 'P01', name: 'White', hex: '#FFFFFF' },
  { code: 'P02', name: 'Cream', hex: '#FDF1CD' },
  { code: 'P03', name: 'Yellow', hex: '#FDD835' },
  { code: 'P04', name: 'Orange', hex: '#FB8C00' },
  { code: 'P05', name: 'Red', hex: '#E53935' },
  { code: 'P06', name: 'Purple', hex: '#6A1B9A' },
  { code: 'P07', name: 'Dark Blue', hex: '#1565C0' },
  { code: 'P08', name: 'Blue', hex: '#1E88E5' },
  { code: 'P09', name: 'Light Blue', hex: '#64B5F6' },
  { code: 'P10', name: 'Green', hex: '#2E7D32' },
  { code: 'P11', name: 'Light Green', hex: '#7CB342' },
  { code: 'P12', name: 'Brown', hex: '#5D4037' },
  { code: 'P17', name: 'Grey', hex: '#9E9E9E' },
  { code: 'P18', name: 'Black', hex: '#212121' },
  { code: 'P19', name: 'Clear', hex: '#E0E0E0' },
  { code: 'P20', name: 'Rust', hex: '#8D6E63' },
  { code: 'P21', name: 'Light Brown', hex: '#A1887F' },
  { code: 'P22', name: 'Peach', hex: '#FFCCBC' },
  { code: 'P23', name: 'Magenta', hex: '#C2185B' },
  { code: 'P24', name: 'Pastel Lavender', hex: '#CE93D8' },
  { code: 'P25', name: 'Pastel Yellow', hex: '#FFF59D' },
  { code: 'P26', name: 'Cheddar', hex: '#FFA000' },
  { code: 'P27', name: 'Toothpaste', hex: '#80DEEA' },
  { code: 'P28', name: 'Hot Coral', hex: '#FF5252' },
  { code: 'P29', name: 'Plum', hex: '#4A148C' },
  { code: 'P30', name: 'Kiwi Lime', hex: '#AFB42B' },
  { code: 'P31', name: 'Turquoise', hex: '#00ACC1' },
  { code: 'P32', name: 'Blush', hex: '#F8BBD0' },
  { code: 'P33', name: 'Pink', hex: '#F06292' },
  { code: 'P34', name: 'Butterscotch', hex: '#FFB300' },
  { code: 'P35', name: 'Dark Green', hex: '#1B5E20' },
  { code: 'P36', name: 'Dark Grey', hex: '#616161' },
  { code: 'P37', name: 'Charcoal', hex: '#37474F' },
  { code: 'P38', name: 'Evergreen', hex: '#004D40' },
  { code: 'P39', name: 'Robin Egg', hex: '#4DD0E1' },
  { code: 'P40', name: 'Salmon', hex: '#FF8A80' }
];

export const DMC_COLORS: CraftStandardColor[] = rawDMC.map(c => ({
  ...c,
  ...hexToRgb(c.hex),
  brand: 'DMC' as const,
}));

export const PERLER_COLORS: CraftStandardColor[] = rawPerler.map(c => ({
  ...c,
  ...hexToRgb(c.hex),
  brand: 'Perler' as const,
}));

export function findClosestCraftColor(
  r: number,
  g: number,
  b: number,
  brand: 'DMC' | 'Perler'
): CraftStandardColor {
  const list = brand === 'DMC' ? DMC_COLORS : PERLER_COLORS;
  let best = list[0];
  let minDistance = Infinity;

  for (const c of list) {
    // Weighted Euclidean RGB (human eye is more sensitive to green)
    const rmean = (r + c.r) / 2;
    const dr = r - c.r;
    const dg = g - c.g;
    const db = b - c.b;
    const dist = Math.sqrt(
      (2 + rmean / 256) * dr * dr +
      4 * dg * dg +
      (2 + (255 - rmean) / 256) * db * db
    );
    if (dist < minDistance) {
      minDistance = dist;
      best = c;
    }
  }

  return best;
}
