import type { CraftType } from '../types/craft';

/**
 * Checks whether the browser supports native Web Speech Synthesis.
 */
export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

/**
 * Stops any ongoing voice narration immediately.
 */
export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore browser speech errors in locked contexts
  }
}

/**
 * Speaks a phrase immediately using browser speechSynthesis, canceling any prior utterance first.
 */
export function speakText(
  text: string,
  options?: { rate?: number; onStart?: () => void; onEnd?: () => void }
): void {
  if (!isSpeechSupported() || !text.trim()) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.rate = Math.max(0.6, Math.min(1.6, options?.rate ?? 1.0));
    utterance.pitch = 1.0;
    if (options?.onStart) {
      utterance.onstart = options.onStart;
    }
    if (options?.onEnd) {
      utterance.onend = options.onEnd;
      utterance.onerror = options.onEnd;
    }
    window.speechSynthesis.speak(utterance);
  } catch {
    options?.onEnd?.();
  }
}

/**
 * Returns the singular or plural craft unit term for speech narration.
 */
export function getCraftUnitName(craftType: CraftType, count: number): string {
  const plural = count !== 1;
  switch (craftType) {
    case 'alpha':
      return plural ? 'knots' : 'knot';
    case 'perler':
    case 'loom':
      return plural ? 'beads' : 'bead';
    case 'diamond':
      return plural ? 'drills' : 'drill';
    case 'pixel':
      return plural ? 'pixels' : 'pixel';
    default:
      return plural ? 'stitches' : 'stitch';
  }
}

function cleanColorNameForSpeech(rawName?: string): string {
  if (!rawName) return 'Color';
  if (rawName.startsWith('Custom #')) return `Color ${rawName.slice(8)}`;
  if (rawName.startsWith('#')) return `Color ${rawName.slice(1)}`;
  return rawName.trim();
}

/**
 * Formats a single color run into a concise spoken phrase (e.g. "6 Cream" or "Skip 3 empty").
 */
export function formatColorRunSpeech(
  count: number,
  colorName: string,
  isEmpty: boolean,
  _craftType: CraftType = 'crochet'
): string {
  if (isEmpty) {
    return `Skip ${count} empty`;
  }
  const clean = cleanColorNameForSpeech(colorName);
  return `${count} ${clean}`;
}

/**
 * Formats an entire row of runs into clear spoken directions for hands-free crafting.
 */
export function formatFullRowSpeech(
  rowNumber: number,
  directionLabel: string,
  runs: Array<{ count: number; colorName: string; isEmpty?: boolean }>,
  craftType: CraftType = 'crochet'
): string {
  const parts = runs.map((run) =>
    formatColorRunSpeech(run.count, run.colorName, !!run.isEmpty, craftType)
  );
  return `Row ${rowNumber}, ${directionLabel}: ${parts.join(', ')}.`;
}
