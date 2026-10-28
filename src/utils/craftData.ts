import { rgbToLab, deltaE, type LAB } from './colorUtils';

export interface CraftStandardColor {
  code: string;
  name: string;
  hex: string;
  r: number;
  g: number;
  b: number;
  lab: LAB;
  brand: 'DMC' | 'Perler';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}

// Comprehensive DMC Embroidery & Cross-Stitch Floss Catalog (175+ standard colors)
const rawDMC = [
  // Whites, Creams & Lights
  { code: 'B5200', name: 'Snow White', hex: '#FFFFFF' },
  { code: 'Blanc', name: 'White', hex: '#FDFBF7' },
  { code: 'Ecru', name: 'Ecru', hex: '#F0EAD6' },
  { code: '3865', name: 'Winter White', hex: '#FAF7F0' },
  { code: '712', name: 'Cream', hex: '#FFFBEA' },
  { code: '822', name: 'Light Beige Gray', hex: '#E7E2D3' },
  { code: '644', name: 'Medium Beige Gray', hex: '#DDD8CB' },
  { code: '642', name: 'Dark Beige Gray', hex: '#A49F89' },

  // Yellows & Golds
  { code: '3078', name: 'Golden Yellow Very Light', hex: '#FDF9C7' },
  { code: '745', name: 'Yellow Pale', hex: '#FFE99E' },
  { code: '744', name: 'Yellow Pale Light', hex: '#FFDE78' },
  { code: '743', name: 'Yellow Medium', hex: '#FED648' },
  { code: '727', name: 'Topaz Very Light', hex: '#FFF2AF' },
  { code: '726', name: 'Topaz Light', hex: '#FDDB52' },
  { code: '725', name: 'Topaz Medium Light', hex: '#F7C631' },
  { code: '972', name: 'Deep Canary', hex: '#FFB515' },
  { code: '973', name: 'Bright Canary', hex: '#FFE300' },
  { code: '444', name: 'Lemon Dark', hex: '#FFD700' },
  { code: '445', name: 'Lemon Light', hex: '#FFF799' },
  { code: '307', name: 'Lemon', hex: '#FFEC00' },
  { code: '3822', name: 'Straw Light', hex: '#F5DC7E' },
  { code: '3821', name: 'Straw', hex: '#EFC95B' },
  { code: '3820', name: 'Straw Dark', hex: '#DFB041' },
  { code: '3852', name: 'Deep Straw', hex: '#CD9B1D' },

  // Oranges, Corals & Peaches
  { code: '742', name: 'Light Tangerine', hex: '#FFAE34' },
  { code: '741', name: 'Tangerine Medium', hex: '#FFA200' },
  { code: '740', name: 'Tangerine', hex: '#FF7800' },
  { code: '947', name: 'Burnt Orange', hex: '#F85507' },
  { code: '946', name: 'Burnt Orange Medium', hex: '#E64700' },
  { code: '900', name: 'Burnt Orange Dark', hex: '#C73800' },
  { code: '3855', name: 'Autumn Gold Light', hex: '#FBD49A' },
  { code: '3854', name: 'Autumn Gold Medium', hex: '#E8A359' },
  { code: '3853', name: 'Autumn Gold Dark', hex: '#BD6F29' },
  { code: '353', name: 'Peach Flesh', hex: '#FEC9B8' },
  { code: '352', name: 'Coral Light', hex: '#FD947B' },
  { code: '351', name: 'Coral', hex: '#F25F4C' },
  { code: '350', name: 'Coral Medium', hex: '#DE3C36' },
  { code: '349', name: 'Dark Coral', hex: '#C7242F' },
  { code: '3708', name: 'Melon Light', hex: '#FFADC0' },
  { code: '3706', name: 'Melon Medium', hex: '#FF7D79' },
  { code: '3705', name: 'Melon Dark', hex: '#F74958' },
  { code: '3801', name: 'Light Red Orange', hex: '#E63E51' },

  // Reds, Pinks & Roses
  { code: '666', name: 'Bright Red', hex: '#E31837' },
  { code: '321', name: 'Red', hex: '#C72435' },
  { code: '817', name: 'Coral Red Very Dark', hex: '#A8182B' },
  { code: '816', name: 'Garnet', hex: '#8E0D25' },
  { code: '815', name: 'Garnet Medium', hex: '#7E0B20' },
  { code: '814', name: 'Garnet Dark', hex: '#770A1E' },
  { code: '498', name: 'Red Dark', hex: '#941527' },
  { code: '777', name: 'Very Dark Raspberry', hex: '#631326' },
  { code: '605', name: 'Cranberry Very Light', hex: '#FFB8CF' },
  { code: '604', name: 'Cranberry Light', hex: '#FF97B6' },
  { code: '603', name: 'Cranberry', hex: '#F56193' },
  { code: '602', name: 'Cranberry Medium', hex: '#DF3873' },
  { code: '601', name: 'Cranberry Dark', hex: '#CE2664' },
  { code: '600', name: 'Cranberry Very Dark', hex: '#B51651' },
  { code: '957', name: 'Geranium Pale', hex: '#FD9AB2' },
  { code: '956', name: 'Geranium', hex: '#FF4E79' },
  { code: '963', name: 'Dusty Rose Ultra Light', hex: '#FED6DB' },
  { code: '962', name: 'Dusty Rose Medium', hex: '#D66A82' },
  { code: '961', name: 'Dusty Rose Dark', hex: '#B74963' },
  { code: '3716', name: 'Dusty Rose Very Light', hex: '#FBB9C3' },
  { code: '818', name: 'Baby Pink', hex: '#FEDDD8' },
  { code: '776', name: 'Medium Pink', hex: '#F8A9B8' },
  { code: '899', name: 'Rose Medium', hex: '#E76B86' },
  { code: '335', name: 'Rose', hex: '#D73B60' },
  { code: '326', name: 'Rose Very Dark', hex: '#AB1B3E' },
  { code: '3833', name: 'Raspberry Light', hex: '#D65775' },
  { code: '3832', name: 'Raspberry Medium', hex: '#BD395B' },
  { code: '3831', name: 'Raspberry Dark', hex: '#9B1F3D' },

  // Purples, Violets & Lavenders
  { code: '153', name: 'Violet Very Light', hex: '#E2CEE2' },
  { code: '554', name: 'Violet Light', hex: '#D2A1CE' },
  { code: '553', name: 'Violet', hex: '#875184' },
  { code: '552', name: 'Violet Medium', hex: '#773574' },
  { code: '550', name: 'Violet Very Dark', hex: '#5C1D6B' },
  { code: '211', name: 'Lavender Light', hex: '#DEBBDC' },
  { code: '210', name: 'Lavender Medium', hex: '#C595C0' },
  { code: '209', name: 'Lavender Dark', hex: '#A56A9F' },
  { code: '208', name: 'Lavender Very Dark', hex: '#814187' },
  { code: '3837', name: 'Lavender Ultra Dark', hex: '#63256A' },
  { code: '3747', name: 'Blue Violet Very Light', hex: '#D4DCF0' },
  { code: '3746', name: 'Blue Violet Dark', hex: '#7667A5' },
  { code: '341', name: 'Blue Violet Light', hex: '#AAB8D9' },
  { code: '340', name: 'Blue Violet Medium', hex: '#8E99C7' },
  { code: '3743', name: 'Antique Violet Very Light', hex: '#D5CFD8' },
  { code: '3042', name: 'Antique Violet Light', hex: '#B29DA9' },
  { code: '3041', name: 'Antique Violet Medium', hex: '#8F7184' },
  { code: '3836', name: 'Grape Light', hex: '#B77D9B' },
  { code: '3835', name: 'Grape Medium', hex: '#8A5271' },
  { code: '3834', name: 'Grape Dark', hex: '#64324F' },
  { code: '327', name: 'Dark Violet', hex: '#53235A' },

  // Blues & Cyans
  { code: '3756', name: 'Baby Blue Ultra Light', hex: '#EDF4F7' },
  { code: '775', name: 'Baby Blue Very Light', hex: '#D4E8F2' },
  { code: '3841', name: 'Baby Blue Pale', hex: '#BCDBEB' },
  { code: '3325', name: 'Baby Blue Light', hex: '#A8CEE8' },
  { code: '3755', name: 'Baby Blue', hex: '#83A8CA' },
  { code: '334', name: 'Baby Blue Medium', hex: '#6384AB' },
  { code: '322', name: 'Baby Blue Dark', hex: '#4B6B92' },
  { code: '312', name: 'Navy Blue Baby', hex: '#264E74' },
  { code: '311', name: 'Navy Blue Medium', hex: '#163E63' },
  { code: '823', name: 'Navy Blue Dark', hex: '#112543' },
  { code: '939', name: 'Navy Blue Very Dark', hex: '#0B172E' },
  { code: '828', name: 'Blue Very Light Pale', hex: '#C5E3EB' },
  { code: '827', name: 'Blue Very Light', hex: '#BDD7E7' },
  { code: '826', name: 'Blue Medium', hex: '#5E8FB5' },
  { code: '825', name: 'Blue Dark', hex: '#376993' },
  { code: '824', name: 'Blue Very Dark', hex: '#244869' },
  { code: '820', name: 'Royal Blue Very Dark', hex: '#09255C' },
  { code: '796', name: 'Royal Blue Dark', hex: '#113E7F' },
  { code: '797', name: 'Royal Blue', hex: '#164E94' },
  { code: '798', name: 'Delft Blue Dark', hex: '#4465A6' },
  { code: '799', name: 'Delft Blue Medium', hex: '#6988BD' },
  { code: '800', name: 'Delft Blue Pale', hex: '#B8CBE6' },
  { code: '809', name: 'Delft Blue Light', hex: '#91A8CF' },
  { code: '996', name: 'Electric Blue Medium', hex: '#00A8DE' },
  { code: '995', name: 'Electric Blue Dark', hex: '#0083B2' },
  { code: '3846', name: 'Bright Turquoise Light', hex: '#00BBE4' },
  { code: '3845', name: 'Bright Turquoise Medium', hex: '#009EB8' },
  { code: '3844', name: 'Bright Turquoise Dark', hex: '#0E8399' },
  { code: '3843', name: 'Electric Blue Light', hex: '#0699C9' },
  { code: '3842', name: 'Wedgewood Dark', hex: '#265979' },

  // Teals, Mints & Sea Greens
  { code: '964', name: 'Seagreen Light', hex: '#A7E1D4' },
  { code: '959', name: 'Seagreen Medium', hex: '#5CC2B1' },
  { code: '958', name: 'Seagreen Dark', hex: '#379F88' },
  { code: '3812', name: 'Seagreen Very Dark', hex: '#176E66' },
  { code: '3849', name: 'Teal Green Light', hex: '#4BA199' },
  { code: '3848', name: 'Teal Green Medium', hex: '#327D78' },
  { code: '3847', name: 'Teal Green Dark', hex: '#235D5A' },
  { code: '598', name: 'Turquoise Light', hex: '#87C3C2' },
  { code: '597', name: 'Turquoise', hex: '#559C9E' },
  { code: '3811', name: 'Turquoise Very Light', hex: '#BDE3E2' },
  { code: '3810', name: 'Turquoise Dark', hex: '#37777A' },
  { code: '3809', name: 'Turquoise Very Dark', hex: '#24595B' },
  { code: '3808', name: 'Turquoise Ultra Dark', hex: '#1A4244' },
  { code: '993', name: 'Aquamarine Very Light', hex: '#7EBCA8' },
  { code: '992', name: 'Aquamarine', hex: '#529F89' },
  { code: '991', name: 'Aquamarine Dark', hex: '#346B5C' },

  // Greens & Olives
  { code: '913', name: 'Nile Green Light', hex: '#93C592' },
  { code: '912', name: 'Nile Green Medium Light', hex: '#63AB72' },
  { code: '911', name: 'Nile Green Medium', hex: '#3A8A56' },
  { code: '910', name: 'Nile Green Dark', hex: '#247242' },
  { code: '909', name: 'Nile Green Very Dark', hex: '#145B32' },
  { code: '704', name: 'Chartreuse Bright', hex: '#9BD634' },
  { code: '703', name: 'Chartreuse', hex: '#63B339' },
  { code: '702', name: 'Kelly Green', hex: '#26A247' },
  { code: '701', name: 'Green Light', hex: '#1B8E3D' },
  { code: '700', name: 'Bright Green', hex: '#077E36' },
  { code: '699', name: 'Green', hex: '#05622A' },
  { code: '907', name: 'Parrot Green Light', hex: '#A6D63E' },
  { code: '906', name: 'Parrot Green Medium', hex: '#7CB929' },
  { code: '905', name: 'Parrot Green Dark', hex: '#588E23' },
  { code: '904', name: 'Parrot Green Very Dark', hex: '#436D19' },
  { code: '472', name: 'Avocado Green Ultra Light', hex: '#D2E185' },
  { code: '471', name: 'Avocado Green Very Light', hex: '#9FB25A' },
  { code: '470', name: 'Avocado Green Light', hex: '#879F3F' },
  { code: '469', name: 'Avocado Green', hex: '#5E742D' },
  { code: '937', name: 'Avocado Green Medium', hex: '#4B6227' },
  { code: '936', name: 'Avocado Green Very Dark', hex: '#3A4D1B' },
  { code: '934', name: 'Black Avocado Green', hex: '#2E3D18' },
  { code: '989', name: 'Forest Green', hex: '#799E5C' },
  { code: '988', name: 'Forest Green Medium', hex: '#5B7E41' },
  { code: '987', name: 'Forest Green Dark', hex: '#446430' },
  { code: '986', name: 'Forest Green Very Dark', hex: '#2B431D' },
  { code: '3348', name: 'Yellow Green Light', hex: '#C2D88C' },
  { code: '3347', name: 'Yellow Green Medium', hex: '#6B8E4E' },
  { code: '3346', name: 'Hunter Green', hex: '#3E5F33' },
  { code: '3345', name: 'Hunter Green Dark', hex: '#2A4623' },
  { code: '503', name: 'Blue Green Medium Light', hex: '#7FAEA7' },
  { code: '502', name: 'Blue Green', hex: '#52837B' },
  { code: '501', name: 'Blue Green Dark', hex: '#315C56' },
  { code: '500', name: 'Blue Green Very Dark', hex: '#1C3E3A' },
  { code: '734', name: 'Olive Green Light', hex: '#C4B766' },
  { code: '733', name: 'Olive Green Medium', hex: '#A79948' },
  { code: '732', name: 'Olive Green', hex: '#776A28' },
  { code: '730', name: 'Olive Green Very Dark', hex: '#544A1B' },

  // Skin Tones, Flesh & Terracotta
  { code: '945', name: 'Tawny', hex: '#F9D1B7' },
  { code: '3770', name: 'Tawny Very Light', hex: '#FEEADB' },
  { code: '754', name: 'Peach Light', hex: '#F7C6B3' },
  { code: '948', name: 'Peach Very Light', hex: '#FDE1D6' },
  { code: '758', name: 'Terra Cotta Very Light', hex: '#E79B85' },
  { code: '3778', name: 'Terra Cotta Light', hex: '#D27661' },
  { code: '356', name: 'Terra Cotta Medium', hex: '#B85844' },
  { code: '355', name: 'Terra Cotta Dark', hex: '#953E2F' },
  { code: '3774', name: 'Desert Sand Very Light', hex: '#EED9C7' },
  { code: '950', name: 'Desert Sand Light', hex: '#DFBFA7' },
  { code: '3064', name: 'Desert Sand', hex: '#BE8C6C' },
  { code: '407', name: 'Desert Sand Dark', hex: '#9E6C4C' },
  { code: '3772', name: 'Desert Sand Very Dark', hex: '#7E4C33' },
  { code: '225', name: 'Shell Pink Ultra Light', hex: '#FFDFD7' },
  { code: '224', name: 'Shell Pink Very Light', hex: '#EBBEB5' },
  { code: '223', name: 'Shell Pink Light', hex: '#C4867C' },
  { code: '221', name: 'Shell Pink Very Dark', hex: '#7C2B29' },

  // Earth Tones, Tans & Browns
  { code: '739', name: 'Tan Ultra Light', hex: '#F6E5CF' },
  { code: '738', name: 'Tan Very Light', hex: '#E7CCAA' },
  { code: '437', name: 'Tan Light', hex: '#DDB386' },
  { code: '436', name: 'Tan', hex: '#C98F5E' },
  { code: '435', name: 'Brown Very Light', hex: '#B8784C' },
  { code: '434', name: 'Brown Light', hex: '#94532B' },
  { code: '433', name: 'Brown Medium', hex: '#784323' },
  { code: '801', name: 'Coffee Brown Dark', hex: '#5C3117' },
  { code: '898', name: 'Coffee Brown Very Dark', hex: '#492612' },
  { code: '938', name: 'Coffee Brown Ultra Dark', hex: '#341A0B' },
  { code: '3371', name: 'Black Brown', hex: '#1C0D05' },
  { code: '3828', name: 'Hazelnut Brown', hex: '#B78B55' },
  { code: '3827', name: 'Golden Brown Pale', hex: '#D89E62' },
  { code: '3826', name: 'Golden Brown', hex: '#AC6A2E' },
  { code: '977', name: 'Golden Brown Light', hex: '#D68940' },
  { code: '976', name: 'Golden Brown Medium', hex: '#B86827' },
  { code: '975', name: 'Golden Brown Dark', hex: '#874413' },
  { code: '3859', name: 'Rosewood Light', hex: '#B87661' },
  { code: '3858', name: 'Rosewood Medium', hex: '#8B4837' },
  { code: '3857', name: 'Rosewood Dark', hex: '#5B2519' },
  { code: '3864', name: 'Mocha Beige Light', hex: '#C2A588' },
  { code: '3863', name: 'Mocha Beige Medium', hex: '#977A5E' },
  { code: '3862', name: 'Mocha Beige Dark', hex: '#775B42' },
  { code: '842', name: 'Beige Brown Very Light', hex: '#DACABC' },
  { code: '841', name: 'Beige Brown Light', hex: '#B19B86' },
  { code: '840', name: 'Beige Brown Medium', hex: '#896F5A' },
  { code: '839', name: 'Beige Brown Dark', hex: '#584333' },
  { code: '838', name: 'Beige Brown Very Dark', hex: '#423326' },

  // Grays & Blacks
  { code: '762', name: 'Pearl Gray Very Light', hex: '#ECECEC' },
  { code: '415', name: 'Pearl Gray', hex: '#D2D3D5' },
  { code: '414', name: 'Steel Gray Dark', hex: '#8C8C8C' },
  { code: '318', name: 'Steel Gray Light', hex: '#ABABAB' },
  { code: '317', name: 'Pewter Gray', hex: '#6C6C6C' },
  { code: '413', name: 'Pewter Gray Dark', hex: '#525252' },
  { code: '3799', name: 'Pewter Gray Very Dark', hex: '#3E4144' },
  { code: '168', name: 'Pewter Very Light', hex: '#C8CDCE' },
  { code: '169', name: 'Pewter Light', hex: '#828C91' },
  { code: '648', name: 'Beaver Gray Light', hex: '#B7B1A5' },
  { code: '647', name: 'Beaver Gray Medium', hex: '#968E7E' },
  { code: '646', name: 'Beaver Gray Dark', hex: '#797060' },
  { code: '645', name: 'Beaver Gray Very Dark', hex: '#575144' },
  { code: '535', name: 'Ash Gray Very Dark', hex: '#373B3E' },
  { code: '3024', name: 'Brown Gray Very Light', hex: '#E5E3DC' },
  { code: '3023', name: 'Brown Gray Light', hex: '#ABA497' },
  { code: '3022', name: 'Brown Gray Medium', hex: '#838072' },
  { code: '3021', name: 'Brown Gray Very Dark', hex: '#37342C' },
  { code: '3861', name: 'Cocoa Light', hex: '#9A8080' },
  { code: '3860', name: 'Cocoa', hex: '#755B5B' },
  { code: '310', name: 'Black', hex: '#000000' }
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

export const DMC_COLORS: CraftStandardColor[] = rawDMC.map(c => {
  const rgb = hexToRgb(c.hex);
  return {
    ...c,
    ...rgb,
    lab: rgbToLab(rgb.r, rgb.g, rgb.b),
    brand: 'DMC' as const,
  };
});

export const PERLER_COLORS: CraftStandardColor[] = rawPerler.map(c => {
  const rgb = hexToRgb(c.hex);
  return {
    ...c,
    ...rgb,
    lab: rgbToLab(rgb.r, rgb.g, rgb.b),
    brand: 'Perler' as const,
  };
});

/**
 * Perceptual CIELAB Delta E match against standard craft floss/bead catalogs.
 * Matches human perception with high precision.
 */
export function findClosestCraftColor(
  r: number,
  g: number,
  b: number,
  brand: 'DMC' | 'Perler'
): CraftStandardColor {
  const list = brand === 'DMC' ? DMC_COLORS : PERLER_COLORS;
  const targetLab = rgbToLab(r, g, b);
  let best = list[0];
  let minDistance = Infinity;

  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    const dist = deltaE(targetLab, c.lab);
    if (dist < minDistance) {
      minDistance = dist;
      best = c;
    }
  }

  return best;
}
