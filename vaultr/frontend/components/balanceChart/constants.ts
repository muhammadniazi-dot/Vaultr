/** Shared sizing/format helpers for the balance-history chart bodies. */

export const CHART_HEIGHT = 200;

// Compact CAD for axis ticks / labels so they stay readable and uncluttered.
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${Math.round(value)}`;
}
