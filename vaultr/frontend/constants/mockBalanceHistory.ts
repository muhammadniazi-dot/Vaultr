/**
 * Mock balance-history data.
 *
 * There is no balance-history endpoint on the backend yet, so the trend chart
 * is fed by this generator. It's deliberately organized so a future
 * `GET /accounts/:id/history` (or a net-worth history endpoint) can drop in
 * and return the same `BalancePoint[]` shape with no chart changes.
 *
 * Design choices that make the mock feel real:
 *  - The series is generated *backwards* from a known current balance, so the
 *    final (most recent) point always equals the account's real balance shown
 *    elsewhere in the app — the chart never contradicts the live number.
 *  - Deltas are deterministic (seeded), so the same account renders the same
 *    history every time instead of flickering to new random values on each
 *    re-render.
 */

// A type alias (not an interface) so it satisfies Victory Native's
// `Record<string, unknown>` data constraint — interfaces aren't assignable to
// it because of declaration merging, type aliases are.
export type BalancePoint = {
  /** 0-based position, used as the numeric x key for the chart. */
  index: number;
  /** Stable 'YYYY-MM' identifier for the month. */
  monthKey: string;
  /** Short month label for the x-axis, e.g. 'Feb'. */
  label: string;
  balance: number;
};

/** Small, fast, deterministic PRNG (LCG). Same seed → same sequence. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/** Stable 32-bit hash of a string (FNV-1a) — used to seed per-account series. */
export function seedFromString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Builds a monthly balance history ending at `currentBalance` for the most
 * recent month.
 *
 * @param currentBalance  The account's live balance; the last point equals this.
 * @param months          How many monthly points to produce (default 6).
 * @param seed            Deterministic seed (e.g. `seedFromString(account.id)`).
 */
export function generateBalanceHistory(
  currentBalance: number,
  months = 6,
  seed = 1
): BalancePoint[] {
  const count = Math.max(1, Math.floor(months));
  const rng = makeRng(seed);

  // Walk backwards from the current balance. Each earlier month is derived by
  // undoing a small monthly change. A slight positive bias means balances
  // generally trend upward over time (the expected story for savings), while
  // still dipping some months so the line isn't a boring straight climb.
  const balances = new Array<number>(count);
  balances[count - 1] = round2(currentBalance);
  for (let i = count - 2; i >= 0; i -= 1) {
    // Monthly change in roughly [-7%, +11%]; dividing keeps values positive.
    const monthlyChange = (rng() - 0.4) * 0.18;
    const previous = balances[i + 1] / (1 + monthlyChange);
    // Guard against a non-finite / non-positive result from tiny balances.
    balances[i] = round2(previous > 0 && Number.isFinite(previous) ? previous : balances[i + 1]);
  }

  const now = new Date();
  const points: BalancePoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const monthsAgo = count - 1 - i;
    const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    points.push({
      index: i,
      monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      balance: balances[i],
    });
  }
  return points;
}
