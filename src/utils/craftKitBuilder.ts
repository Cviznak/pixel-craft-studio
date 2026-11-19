import type { 
  CraftType, 
  GridConfig, 
  PaletteColor, 
  CellProgress 
} from '../types/craft';
import { 
  calculateCrossStitchDimensions,
  calculatePerlerDimensions,
  calculateDiamondDimensions,
  calculateCrochetDimensions,
  calculateAlphaDimensions,
  calculateBeadLoomDimensions,
  calculateKnittingDimensions,
  estimateDmcSkeins,
  estimateBeadPacks,
  estimateCrochetYarnPerColor
} from './craftCalculator';
import { getActiveAffiliateTag } from './amazonUtils';

export interface KitItem {
  id: string;
  category: 'base' | 'frame' | 'tool' | 'bundle';
  name: string;
  specs: string;
  quantityNeeded: string;
  estimatedPriceUsd: number;
  amazonQuery: string;
  isOptional?: boolean;
  notes?: string;
}

export interface PaletteSupplyItem {
  color: PaletteColor;
  requiredUnits: number;
  unitLabel: string;
  estimatedCostUsd: number;
  amazonQuery: string;
  inStash: boolean;
}

export interface CraftSupplyKit {
  craftType: CraftType;
  title: string;
  summary: string;
  totalPieces: number;
  dimensionsSummary: string;
  baseAndFrameItems: KitItem[];
  essentialTools: KitItem[];
  starterBundleRecommendation: KitItem;
  paletteSupplies: PaletteSupplyItem[];
  estimatedTotalUsd: number;
  oneClickAmazonSearchQuery: string;
  oneClickAmazonUrl: string;
}

/**
 * Build a fully tagged Amazon Search URL with the active affiliate tag.
 */
export function buildAmazonKitUrl(query: string): string {
  const tag = getActiveAffiliateTag();
  const base = `https://www.amazon.com/s?k=${encodeURIComponent(query.trim())}`;
  return tag ? `${base}&tag=${encodeURIComponent(tag)}` : base;
}

/**
 * Calculates tailored physical materials, tools, and palette skeins/beads for the current design.
 */
export function buildCraftSupplyKit(
  config: GridConfig,
  palette: PaletteColor[],
  _gridData?: number[][],
  _completedCells?: CellProgress,
  stashCodes: Set<string> = new Set()
): CraftSupplyKit {
  const { width, height, craftType } = config;
  const totalPieces = width * height;
  const isMetric = config.unitSystem === 'metric';

  const baseAndFrameItems: KitItem[] = [];
  const essentialTools: KitItem[] = [];
  let starterBundle: KitItem;
  let dimensionsSummary = '';
  let oneClickQuery = '';

  // 1. Cross-Stitch Kit
  if (craftType === 'cross-stitch') {
    const clothCount = 14; // Default standard
    const dims = calculateCrossStitchDimensions(width, height, clothCount);
    const fabricW = isMetric ? dims.recommendedFabricSizeCm.width.toFixed(1) : dims.recommendedFabricSizeInches.width.toFixed(1);
    const fabricH = isMetric ? dims.recommendedFabricSizeCm.height.toFixed(1) : dims.recommendedFabricSizeInches.height.toFixed(1);
    const unit = isMetric ? 'cm' : 'inches';

    dimensionsSummary = `${dims.dimensions.summary} on 14ct Aida`;
    oneClickQuery = 'cross stitch kit 14 count aida cloth embroidery floss hoop needles';

    // Base Fabric with 3" margins
    baseAndFrameItems.push({
      id: 'aida-fabric',
      category: 'base',
      name: '14-Count White Aida Cloth',
      specs: `Cut size: ${fabricW} × ${fabricH} ${unit} (includes 3" margin for framing)`,
      quantityNeeded: '1 Piece',
      estimatedPriceUsd: 7.99,
      amazonQuery: `14 count aida cloth fabric white ${Math.ceil(dims.recommendedFabricSizeInches.width)}x${Math.ceil(dims.recommendedFabricSizeInches.height)}`,
      notes: 'High-density 100% natural cotton cross stitch fabric'
    });

    // Hoop recommendation based on design size
    const maxDimensionInches = Math.max(dims.dimensions.widthInches, dims.dimensions.heightInches);
    let hoopSize = 6;
    if (maxDimensionInches > 8) hoopSize = 10;
    else if (maxDimensionInches > 6) hoopSize = 8;
    else if (maxDimensionInches > 4) hoopSize = 7;

    baseAndFrameItems.push({
      id: 'embroidery-hoop',
      category: 'frame',
      name: `Bamboo Embroidery Hoop (${hoopSize}")`,
      specs: `Size ${hoopSize}-inch with brass adjustment screw`,
      quantityNeeded: '1 Hoop',
      estimatedPriceUsd: 5.49,
      amazonQuery: `bamboo embroidery hoop ${hoopSize} inch`,
      notes: 'Keeps fabric taut while stitching and serves as a classic display frame'
    });

    // Tools
    essentialTools.push({
      id: 'tapestry-needles',
      category: 'tool',
      name: 'DMC Tapestry Needles Size 24',
      specs: 'Blunt rounded tip, large elongated eye',
      quantityNeeded: '1 Pack (6 needles)',
      estimatedPriceUsd: 3.49,
      amazonQuery: 'dmc tapestry needles size 24',
      notes: 'Glides smoothly between Aida squares without piercing threads'
    });

    essentialTools.push({
      id: 'stork-scissors',
      category: 'tool',
      name: 'Precision Embroidery Stork Scissors',
      specs: '3.5-inch stainless steel ultra-sharp snips',
      quantityNeeded: '1 Pair',
      estimatedPriceUsd: 6.99,
      amazonQuery: 'vintage stork embroidery scissors stainless steel',
      notes: 'Clean flush cuts for floss tail ends'
    });

    essentialTools.push({
      id: 'bobbins-organizer',
      category: 'tool',
      name: 'Floss Bobbins & Storage Box',
      specs: '50 plastic bobbins with organizer compartments',
      quantityNeeded: '1 Set',
      estimatedPriceUsd: 7.49,
      amazonQuery: 'plastic embroidery floss bobbins with storage organizer box',
      isOptional: true,
      notes: 'Keep your palette colors tangle-free and labeled'
    });

    starterBundle = {
      id: 'starter-floss-pack',
      category: 'bundle',
      name: 'DMC 100 Skein Embroidery Floss Kit',
      specs: '100 vibrant rainbow colors with needles & threader',
      quantityNeeded: '1 Mega Pack',
      estimatedPriceUsd: 18.99,
      amazonQuery: 'embroidery floss kit 100 skeins with aida cloth and needles',
      notes: 'Great value starter bundle containing almost all basic pattern colors'
    };
  }

  // 2. Perler / Melty Beads Kit
  else if (craftType === 'perler') {
    const dims = calculatePerlerDimensions(width, height, 'midi-5mm');
    dimensionsSummary = `${dims.dimensions.summary} (${dims.totalPegboards} standard pegboards)`;
    oneClickQuery = 'perler beads bucket pegboards tweezers ironing paper';

    baseAndFrameItems.push({
      id: 'pegboards',
      category: 'base',
      name: 'Interlocking Clear Square Pegboards (29×29)',
      specs: `Grid requires ${dims.pegboardCols} across × ${dims.pegboardRows} down = ${dims.totalPegboards} board(s)`,
      quantityNeeded: `${dims.totalPegboards} Board(s)`,
      estimatedPriceUsd: Math.max(5.99, dims.totalPegboards * 2.50),
      amazonQuery: `perler beads interlocking clear square pegboards ${dims.totalPegboards > 2 ? '4 pack' : '2 pack'}`,
      notes: 'Interlocking pegboards click together for any size project'
    });

    baseAndFrameItems.push({
      id: 'ironing-paper',
      category: 'base',
      name: 'Reusable Ironing Parchment Paper',
      specs: 'Heat-resistant thermal pressing sheets',
      quantityNeeded: '1 Pack (6 sheets)',
      estimatedPriceUsd: 4.99,
      amazonQuery: 'perler bead ironing paper sheets reusable',
      notes: 'Prevents beads from sticking to household clothing iron'
    });

    essentialTools.push({
      id: 'bead-tweezers',
      category: 'tool',
      name: 'Precision Bead Craft Tweezers',
      specs: 'Fine-point bent nose ergonomic tweezers',
      quantityNeeded: '1 Pair',
      estimatedPriceUsd: 4.49,
      amazonQuery: 'perler bead tweezers ergonomic fine tip',
      notes: 'Place beads accurately without bumping neighboring beads'
    });

    essentialTools.push({
      id: 'sorting-trays',
      category: 'tool',
      name: 'Stackable Bead Sorting Trays',
      specs: 'Triangle funnel sorting trays for beads',
      quantityNeeded: '1 Set (4 trays)',
      estimatedPriceUsd: 5.99,
      amazonQuery: 'bead sorting trays triangle with pour spout',
      isOptional: true,
      notes: 'Easy color separation and quick pouring back into jars'
    });

    starterBundle = {
      id: 'perler-bucket',
      category: 'bundle',
      name: 'Perler Multi-Mix Bead Bucket (10,000 Beads)',
      specs: '10,000 mixed fuse beads with reusable storage bucket & pegboards',
      quantityNeeded: '1 Bucket',
      estimatedPriceUsd: 16.99,
      amazonQuery: 'perler beads bucket 10000 with pegboards and ironing paper',
      notes: 'Essential craft room staple covering thousands of sprite projects'
    };
  }

  // 3. Crochet / C2C Kit
  else if (craftType === 'crochet') {
    const gauge = config.crochetGauge || {
      stitchType: 'c2c',
      yarnWeight: 'worsted',
      stitchesPer4Inches: 16,
      rowsPer4Inches: 16,
      hookSizeMm: 5.0
    };
    const dims = calculateCrochetDimensions(width, height, gauge);
    dimensionsSummary = `${dims.dimensions.summary} (${gauge.yarnWeight.toUpperCase()} yarn, ~${dims.estimatedYardsTotal} yds)`;
    oneClickQuery = 'crochet ergonomic hook set yarn needle stitch markers';

    const hookSize = gauge.hookSizeMm || 5.0;
    baseAndFrameItems.push({
      id: 'crochet-hook',
      category: 'tool',
      name: `Ergonomic Crochet Hook Size ${hookSize}mm (US H-8 / I-9)`,
      specs: 'Soft rubber grip with smooth polished aluminum throat',
      quantityNeeded: '1 Hook',
      estimatedPriceUsd: 5.99,
      amazonQuery: `ergonomic crochet hook ${hookSize}mm with rubber grip`,
      notes: 'Prevents hand fatigue during long colorwork crochet sessions'
    });

    essentialTools.push({
      id: 'stitch-markers',
      category: 'tool',
      name: 'Locking Stitch Markers',
      specs: 'Colorful safety-pin style crochet locking markers',
      quantityNeeded: '1 Pack (50 count)',
      estimatedPriceUsd: 4.29,
      amazonQuery: 'locking stitch markers for crochet with storage box',
      notes: 'Mark row ends, color change boundaries, and active working loops'
    });

    essentialTools.push({
      id: 'yarn-bobbins',
      category: 'tool',
      name: 'Yarn Bobbins for Graphghans & Colorwork',
      specs: 'Plastic winding clips to hold individual color strands',
      quantityNeeded: '1 Pack (20 bobbins)',
      estimatedPriceUsd: 6.99,
      amazonQuery: 'yarn bobbins for intarsia and colorwork crochet',
      isOptional: true,
      notes: 'Crucial for multi-color graphghan blankets to prevent huge yarn knots'
    });

    essentialTools.push({
      id: 'yarn-needles',
      category: 'tool',
      name: 'Blunt Large-Eye Yarn Tapestry Needles',
      specs: 'Steel yarn needles with curved tips for weaving ends',
      quantityNeeded: '1 Pack (6 needles)',
      estimatedPriceUsd: 3.99,
      amazonQuery: 'large eye blunt yarn tapestry needles bent tip',
      notes: 'Weave in yarn tails securely behind the wrong side of your project'
    });

    starterBundle = {
      id: 'crochet-hook-kit',
      category: 'bundle',
      name: 'Complete Ergonomic Crochet Hooks Set (14 Sizes + Case)',
      specs: 'Includes 2mm - 10mm hooks, scissors, markers, tape measure & case',
      quantityNeeded: '1 Complete Kit',
      estimatedPriceUsd: 14.99,
      amazonQuery: 'ergonomic crochet hook set with case and accessories yarn needles',
      notes: 'All-in-one kit that equips you for any gauge and future blankets'
    };
  }

  // 4. Bead Loom Kit
  else if (craftType === 'loom') {
    const beadLoom = config.beadLoom || { stitchStyle: 'loom', beadType: 'delica-11' };
    const dims = calculateBeadLoomDimensions(width, height, beadLoom);
    dimensionsSummary = `${dims.dimensions.summary} (${dims.totalBeads} beads, ${dims.warpThreadsCount} warp threads)`;
    oneClickQuery = 'bead loom kit miyuki delica wildfire thread beading needles';

    baseAndFrameItems.push({
      id: 'bead-loom-frame',
      category: 'frame',
      name: 'Adjustable Metal Bead Loom Frame',
      specs: 'Heavy-duty steel loom for bracelets and straps up to 4" wide',
      quantityNeeded: '1 Loom',
      estimatedPriceUsd: 14.99,
      amazonQuery: 'bead loom for jewelry making adjustable metal frame',
      notes: 'Holds warp threads tight and even for uniform bead tension'
    });

    baseAndFrameItems.push({
      id: 'slide-clasps',
      category: 'base',
      name: `Slide End Clasp Tubes (${dims.recommendedClaspSize})`,
      specs: 'Slide-on metal ribbon tubes with lobster clasp and chain',
      quantityNeeded: '2 Pairs',
      estimatedPriceUsd: 6.49,
      amazonQuery: `slide end clasp tubes ${dims.recommendedClaspSize} jewelry findings`,
      notes: 'Professional finish for slide-on loom beaded bracelets'
    });

    essentialTools.push({
      id: 'beading-thread',
      category: 'tool',
      name: 'WildFire or Nymo Beading Thread (.006" / 0.15mm)',
      specs: 'Thermally bonded bead thread that resists fraying & needle piercing',
      quantityNeeded: '1 Spool (50 yards)',
      estimatedPriceUsd: 7.99,
      amazonQuery: 'wildfire beading thread 0.006 inch 50yd spool white',
      notes: 'Super-strong non-stretch thread for warp and weft'
    });

    essentialTools.push({
      id: 'beading-needles',
      category: 'tool',
      name: 'Size 10 & 12 Long Beading Needles',
      specs: 'Ultra-thin flexible stainless steel beading needles',
      quantityNeeded: '1 Pack (10 needles)',
      estimatedPriceUsd: 4.49,
      amazonQuery: 'beading needles size 10 12 long english beading needles',
      notes: 'Passes through Miyuki Delica 11/0 beads multiple times with ease'
    });

    starterBundle = {
      id: 'loom-starter-kit',
      category: 'bundle',
      name: 'Complete Bead Loom Starter Kit',
      specs: 'Includes metal loom, thread, beading needles, sorting tray and beads',
      quantityNeeded: '1 Kit',
      estimatedPriceUsd: 24.99,
      amazonQuery: 'bead loom kit for beginners with beads and thread',
      notes: 'Ready-to-bead kit containing all hardware and initial glass seed beads'
    };
  }

  // 5. Alpha Friendship Bracelet Kit
  else if (craftType === 'alpha') {
    const dims = calculateAlphaDimensions(width, height);
    dimensionsSummary = `${dims.dimensions.summary} (${dims.baseStringsCount} base cords, ~${dims.estimatedLeadingYardsTotal} yds)`;
    oneClickQuery = 'friendship bracelet alpha knotting clipboard cotton embroidery floss';

    baseAndFrameItems.push({
      id: 'macrame-board',
      category: 'frame',
      name: 'Macrame Knotting Board with Notches & Pins',
      specs: 'Foam grid board with peripheral string anchoring notches',
      quantityNeeded: '1 Board',
      estimatedPriceUsd: 11.99,
      amazonQuery: 'macrame board for knotting bracelets with grid',
      notes: 'Holds base threads in parallel sequence while knotting alpha rows'
    });

    baseAndFrameItems.push({
      id: 'ribbon-crimps',
      category: 'base',
      name: 'Ribbon Clamp Crimp Ends with Lobster Clasps',
      specs: 'Metal crimp clamp ends (16mm - 25mm) with jump rings',
      quantityNeeded: '1 Pack (20 sets)',
      estimatedPriceUsd: 5.99,
      amazonQuery: 'ribbon clamp crimp ends for bracelet jewelry findings',
      notes: 'Neat metal crimp clamp for alpha bracelet and bookmark edges'
    });

    essentialTools.push({
      id: 'cotton-floss-pack',
      category: 'tool',
      name: '100% Cotton Friendship Floss Skeins',
      specs: 'Durable non-stretch cotton embroidery thread',
      quantityNeeded: '1 Pack',
      estimatedPriceUsd: 9.99,
      amazonQuery: 'friendship bracelet string cotton floss bundle',
      notes: 'Tight, crisp knots that hold their shape'
    });

    essentialTools.push({
      id: 'fabric-glue',
      category: 'tool',
      name: 'Permanent Clear Fabric Glue / Fray Check',
      specs: 'Waterproof flexible adhesive for knot sealing',
      quantityNeeded: '1 Bottle',
      estimatedPriceUsd: 4.49,
      amazonQuery: 'fray check fabric sealant clear glue for knots',
      notes: 'Secure back knot tails and crimp clamp hardware'
    });

    starterBundle = {
      id: 'alpha-kit',
      category: 'bundle',
      name: 'Friendship Bracelet Maker & Knotting Loom Kit',
      specs: 'Includes string holder, pegs, clips, and 50 floss colors',
      quantityNeeded: '1 Kit',
      estimatedPriceUsd: 18.99,
      amazonQuery: 'friendship bracelet maker kit with string and loom',
      notes: 'Great all-in-one setup for alpha bracelets and keychains'
    };
  }

  // 6. Diamond Painting Kit
  else if (craftType === 'diamond') {
    const dims = calculateDiamondDimensions(width, height, 'square-2.5mm');
    dimensionsSummary = `${dims.dimensions.summary} (Square 2.5mm drills)`;
    oneClickQuery = 'diamond painting accessories tools kit drill pen wax trays';

    baseAndFrameItems.push({
      id: 'diamond-canvas',
      category: 'base',
      name: 'Adhesive Blank Diamond Painting Grid Canvas',
      specs: `Poured glue canvas with protective clear release film`,
      quantityNeeded: '1 Canvas',
      estimatedPriceUsd: 9.99,
      amazonQuery: 'blank diamond painting canvas grid self adhesive',
      notes: 'Super-sticky adhesive base grid for placing drills'
    });

    essentialTools.push({
      id: 'drill-pen',
      category: 'tool',
      name: 'Ergonomic LED Light Diamond Drill Pen',
      specs: 'Rechargeable LED pen with 1/3/6/9 multi-placer tips',
      quantityNeeded: '1 Pen Set',
      estimatedPriceUsd: 8.99,
      amazonQuery: 'diamond painting led drill pen with multi placers',
      notes: 'Illuminates symbols and places rows of drills rapidly'
    });

    essentialTools.push({
      id: 'drill-box',
      category: 'tool',
      name: '28/64-Slot Diamond Drill Organizer Box',
      specs: 'Spill-proof individual flip-lid containers with funnel & label stickers',
      quantityNeeded: '1 Box',
      estimatedPriceUsd: 9.49,
      amazonQuery: 'diamond painting storage containers 28 grids with funnel stickers',
      notes: 'Keep drills sorted by DMC code without accidental spills'
    });

    essentialTools.push({
      id: 'wax-pads',
      category: 'tool',
      name: 'Sticky Pink & Purple Wax Clay Pads',
      specs: 'High-tack silicone drill picker wax',
      quantityNeeded: '1 Pack (30 pads)',
      estimatedPriceUsd: 3.99,
      amazonQuery: 'diamond painting glue clay wax pads',
      notes: 'Fills pen tips to pick up drills cleanly'
    });

    starterBundle = {
      id: 'diamond-tools-mega-kit',
      category: 'bundle',
      name: 'Complete Diamond Painting Accessory Tool Kit',
      specs: 'Includes roller, pens, trays, 64-grid storage, wax, and tweezers',
      quantityNeeded: '1 Mega Kit',
      estimatedPriceUsd: 15.99,
      amazonQuery: 'diamond painting tools and accessories kit with roller and storage',
      notes: 'The definitive tool kit for diamond art enthusiasts'
    };
  }

  // 7. Knitting (Intarsia / Colorwork) Kit
  else if (craftType === 'knitting') {
    const knitGauge = config.knitGauge || { yarnWeight: 'worsted', stitchesPer4Inches: 18, rowsPer4Inches: 24, needleSizeMm: 4.5 };
    const dims = calculateKnittingDimensions(width, height, knitGauge);
    dimensionsSummary = `${dims.dimensions.summary} (${knitGauge.yarnWeight} yarn, ${knitGauge.needleSizeMm}mm needles)`;
    oneClickQuery = 'knitting circular needles intarsia yarn bobbins stitch markers';

    baseAndFrameItems.push({
      id: 'knitting-needles',
      category: 'tool',
      name: `Circular Knitting Needles Size ${knitGauge.needleSizeMm}mm (US 7)`,
      specs: 'Smooth stainless steel or bamboo tips with flexible 32" cable',
      quantityNeeded: '1 Pair',
      estimatedPriceUsd: 8.99,
      amazonQuery: `circular knitting needles ${knitGauge.needleSizeMm}mm 32 inch`,
      notes: 'Comfortable cable accommodates wide blanket/sweater colorwork'
    });

    essentialTools.push({
      id: 'fish-bobbins',
      category: 'tool',
      name: 'Fish-Shaped Intarsia Yarn Bobbins',
      specs: 'Pack of 30 colorwork yarn organizers',
      quantityNeeded: '1 Pack',
      estimatedPriceUsd: 6.99,
      amazonQuery: 'intarsia yarn bobbins for knitting colorwork',
      notes: 'Keep independent color threads dangling without tangling'
    });

    essentialTools.push({
      id: 'row-counter',
      category: 'tool',
      name: 'Mechanical Knitting Row Counter Clicker',
      specs: 'Handheld or needle-mounted tally counter',
      quantityNeeded: '1 Piece',
      estimatedPriceUsd: 4.99,
      amazonQuery: 'knitting row counter clicker',
      isOptional: true,
      notes: 'Track color chart rows effortlessly'
    });

    starterBundle = {
      id: 'knitting-accessories-kit',
      category: 'bundle',
      name: 'Complete Knitting Supplies & Notions Kit',
      specs: 'Stitch markers, tapestry needles, row counters, gauge ruler, case',
      quantityNeeded: '1 Kit',
      estimatedPriceUsd: 12.99,
      amazonQuery: 'knitting notions kit with case stitch markers needles',
      notes: 'Essential toolbox for knitters'
    };
  }

  // 8. General Pixel Craft
  else {
    dimensionsSummary = `${width} × ${height} pixels (${totalPieces} cells)`;
    oneClickQuery = 'pixel craft art supplies grid storage';

    baseAndFrameItems.push({
      id: 'pixel-grid-base',
      category: 'base',
      name: 'Craft Surface Grid Mat',
      specs: 'Self-healing precision cutting & layout grid mat',
      quantityNeeded: '1 Mat',
      estimatedPriceUsd: 9.99,
      amazonQuery: 'self healing craft cutting mat grid',
      notes: 'Durable surface for crafting'
    });

    essentialTools.push({
      id: 'pixel-craft-pen',
      category: 'tool',
      name: 'Precision Craft Pen & Tweezers',
      specs: 'Dual-tip fine point placement tools',
      quantityNeeded: '1 Set',
      estimatedPriceUsd: 5.99,
      amazonQuery: 'precision craft tweezers set',
      notes: 'Accurate pixel placement'
    });

    starterBundle = {
      id: 'general-pixel-pack',
      category: 'bundle',
      name: 'Pixel Art Craft Starter Pack',
      specs: 'Assorted colors and accessories',
      quantityNeeded: '1 Pack',
      estimatedPriceUsd: 14.99,
      amazonQuery: 'pixel craft art kit for beginners',
      notes: 'Great all-around starter bundle'
    };
  }

  // 3. Build Palette Supplies Breakdown
  const paletteSupplies: PaletteSupplyItem[] = palette.map((color) => {
    let units = 1;
    let label = '1 sk';
    let query = '';
    let unitCost = 0.89;

    const codeKey = color.code ? color.code.toUpperCase().replace('DMC', '').replace('~', '').trim() : '';

    if (craftType === 'cross-stitch') {
      const skeinCalc = estimateDmcSkeins(color.count);
      units = Math.max(1, skeinCalc.skeinsToBuy);
      label = `${units} skein${units > 1 ? 's' : ''}`;
      query = `dmc floss ${codeKey || color.name || ''} 6-strand embroidery thread`;
      unitCost = 0.89;
    } else if (craftType === 'perler') {
      const beadCalc = estimateBeadPacks(color.count);
      units = Math.max(1, beadCalc.packsToBuy);
      label = `${units} bag${units > 1 ? 's' : ''} (1,000 ct)`;
      query = `perler beads ${color.name || codeKey || ''} 1000 pack`;
      unitCost = 2.99;
    } else if (craftType === 'crochet' || craftType === 'knitting') {
      const yarnCalc = estimateCrochetYarnPerColor(color.count, config.crochetGauge);
      units = yarnCalc.skeins;
      label = `${units} skein${units > 1 ? 's' : ''} (~${yarnCalc.yards} yds)`;
      query = `${color.name || ''} worsted weight yarn skein`;
      unitCost = 4.50;
    } else if (craftType === 'loom') {
      const tubes = Math.max(1, Math.ceil(color.count / 1000));
      units = tubes;
      label = `${tubes} tube${tubes > 1 ? 's' : ''} (5g Delica)`;
      query = `miyuki delica 11/0 seed beads ${codeKey || color.name || ''}`;
      unitCost = 3.99;
    } else if (craftType === 'diamond') {
      const bags = Math.max(1, Math.ceil(color.count / 1000));
      units = bags;
      label = `${bags} pack${bags > 1 ? 's' : ''} (1,000 drills)`;
      query = `diamond painting drills ${codeKey || color.name || ''} dmc`;
      unitCost = 1.99;
    } else {
      units = Math.max(1, Math.ceil(color.count / 1500));
      label = `${units} pack${units > 1 ? 's' : ''}`;
      query = `craft floss thread ${color.name || ''}`;
      unitCost = 0.99;
    }

    const inStash = stashCodes.has(codeKey || color.id || color.hex);

    return {
      color,
      requiredUnits: units,
      unitLabel: label,
      estimatedCostUsd: units * unitCost,
      amazonQuery: query,
      inStash
    };
  });

  // Calculate total estimated kit cost (only missing supplies)
  let baseToolsCost = baseAndFrameItems.reduce((acc, item) => acc + item.estimatedPriceUsd, 0);
  baseToolsCost += essentialTools.filter(t => !t.isOptional).reduce((acc, item) => acc + item.estimatedPriceUsd, 0);

  const missingPaletteCost = paletteSupplies
    .filter(p => !p.inStash)
    .reduce((acc, p) => acc + p.estimatedCostUsd, 0);

  const estimatedTotalUsd = Math.round((baseToolsCost + missingPaletteCost) * 100) / 100;

  return {
    craftType,
    title: `${craftType.toUpperCase()} Materials & Starter Supply Kit`,
    summary: `Complete materials tailored for your ${width}×${height} design (${palette.length} colors, ${totalPieces} total stitches/beads).`,
    totalPieces,
    dimensionsSummary,
    baseAndFrameItems,
    essentialTools,
    starterBundleRecommendation: starterBundle,
    paletteSupplies,
    estimatedTotalUsd,
    oneClickAmazonSearchQuery: oneClickQuery,
    oneClickAmazonUrl: buildAmazonKitUrl(oneClickQuery)
  };
}
