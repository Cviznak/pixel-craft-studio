// High-visibility, distinct symbols commonly used in professional cross-stitch and diamond painting patterns
export const CRAFT_SYMBOLS: string[] = [
  '●', '■', '▲', '★', '♦', '✦', '✿', '⬡', 
  '✖', '✚', '♠', '♥', '♣', '♦', '▼', '◀', 
  '▶', '◆', '◈', '◉', '◎', '⦿', '✶', '✷',
  '✸', '✹', '✪', '❂', '✽', '✾', '❃', '❄',
  '❅', '❆', '❇', '❈', '※', '✢', '✣', '✤',
  '✥', '✦', '✧', '✩', '✪', '✫', '✬', '✭',
  '✮', '✯', '✰', '✲', '✳', '✴', '✵', '✶'
];

// Fallback letter/number symbols if palette exceeds standard symbol pool
export function getCraftSymbol(index: number): string {
  if (index < CRAFT_SYMBOLS.length) {
    return CRAFT_SYMBOLS[index];
  }
  const charCode = 65 + (index - CRAFT_SYMBOLS.length); // A, B, C...
  if (charCode <= 90) {
    return String.fromCharCode(charCode);
  }
  return `${index + 1}`;
}

/**
 * 72 unambiguous single-character WinAnsi/ASCII symbols rendered natively as vector text
 * in jsPDF Courier font for Pattern Keeper & Markup R-XP digital chart import compatibility.
 */
export const PATTERN_KEEPER_SYMBOLS: string[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
  'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '2', '3', '4', '5', '6', '7', '8', '9', '#', '$', '%', '&',
  '@', '+', '=', '*', '?', '!', '^', '~', '/', ':', ';', '<',
  '>', '[', ']', '{', '}', '-', 'a', 'b', 'd', 'e', 'f', 'g',
  'h', 'k', 'm', 'n', 'p', 'q', 'r', 't', 'u', 'y', '(', ')'
];

export function getPatternKeeperSymbol(index: number): string {
  if (index >= 0 && index < PATTERN_KEEPER_SYMBOLS.length) {
    return PATTERN_KEEPER_SYMBOLS[index];
  }
  // Safe printable ASCII fallback beyond 72 colors
  const code = 33 + (index % 93);
  return String.fromCharCode(code);
}
