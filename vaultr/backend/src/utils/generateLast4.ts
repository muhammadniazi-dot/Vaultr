/** Generates a cosmetic 4-digit string for display, e.g. "•••• 4821". */
export function generateLast4(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
