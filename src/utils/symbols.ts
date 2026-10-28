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
