// Step 6 data: the rows the money chart draws and the one axis they share. Pure functions, no UI.
// The rotations and their order are the ones step 5 shows (analysis.shownByGoal), so both steps name the same options.
import type { Analysis, GoalId, Message, MoneyEstimate, Sourced } from '../../contracts';
import { rotationTitle } from '../cards/RotationCard';

export interface MoneyRow {
  id: string;
  title: string;
  isCurrent: boolean;
  status: 'ready' | 'no-data' | 'error' | 'not-loaded';
  /** Set when status is 'ready'. */
  money?: MoneyEstimate;
  margin?: Sourced;
  low?: number;
  mean?: number;
  high?: number;
  /** Why there is no number (no-data and error). */
  reason?: Message;
  /** The failing source (error). */
  source?: string;
}

/** The goal whose ranking is used: the chosen one, or keepSoil when the analysis has none for it (as step 5 does). */
export function rankingGoal(analysis: Analysis, goal: GoalId): GoalId {
  return analysis.shownByGoal[goal] ? goal : 'keepSoil';
}

export function moneyRows(analysis: Analysis, goal: GoalId): MoneyRow[] {
  const ids = analysis.shownByGoal[rankingGoal(analysis, goal)] ?? [];
  return ids.flatMap((id) =>
    analysis.rotations
      .filter((r) => r.id === id)
      .map((r): MoneyRow => {
        const base = { id: r.id, title: rotationTitle(r), isCurrent: r.isCurrent };
        const money = r.money;
        if (money.status === 'not-loaded') return { ...base, status: 'not-loaded' };
        if (money.status === 'no-data') return { ...base, status: 'no-data', reason: money.reason };
        if (money.status === 'error') return { ...base, status: 'error', reason: money.reason, source: money.source };
        const m = money.data.marginPerHa;
        if (m.value === null || !Number.isFinite(m.value)) {
          // The missing reason is already text; t() returns an unknown code as it is, so it reads as the reason.
          return { ...base, status: 'no-data', reason: { code: m.missingReason ?? 'income.no-margin' } };
        }
        return {
          ...base,
          status: 'ready',
          money: money.data,
          margin: m,
          mean: m.value,
          low: m.range ? Math.min(m.range.low, m.range.high) : m.value,
          high: m.range ? Math.max(m.range.low, m.range.high) : m.value,
        };
      }),
  );
}

export interface MoneyScale {
  domain: [number, number];
  ticks: number[];
  /** Position of a value on the axis, 0–100, for CSS left and width. */
  pct(value: number): number;
}

const STEPS = [1, 2, 5];

/** The ticks of a 1, 2 or 5 × 10ⁿ step that fall inside lo..hi. */
function ticksFor(lo: number, hi: number, step: number): number[] {
  const out: number[] = [];
  for (let i = Math.ceil(lo / step - 1e-9); i * step <= hi + 1e-9; i++) out.push(Number((i * step).toPrecision(12)));
  return out;
}

/** The finest 1, 2 or 5 × 10ⁿ step that gives 3 to 5 ticks inside lo..hi. */
function niceTicks(lo: number, hi: number): number[] {
  let exp = Math.floor(Math.log10((hi - lo) / 5)) - 1;
  for (let guard = 0; guard < 8; guard++, exp++) {
    for (const s of STEPS) {
      const ticks = ticksFor(lo, hi, s * 10 ** exp);
      if (ticks.length <= 5) return ticks.length >= 3 ? ticks : ticksFor(lo, hi, (s * 10 ** exp) / 2);
    }
  }
  return [lo, hi];
}

/**
 * One axis for every row: from the lowest bad year (or 0) to the highest good year (or 0), widened by 5% each side.
 * Zero is always inside, so a negative margin reads as a loss against a visible zero. The ticks are the 1, 2 or 5 step
 * values inside that range, so the bars use the width instead of an axis rounded out to empty space.
 */
export function moneyScale(rows: MoneyRow[]): MoneyScale {
  const ready = rows.filter((r) => r.status === 'ready');
  let lo = Math.min(0, ...ready.map((r) => r.low!));
  let hi = Math.max(0, ...ready.map((r) => r.high!));
  if (hi - lo === 0) hi = 1;
  const pad = (hi - lo) * 0.05;
  if (lo < 0) lo -= pad;
  hi += pad;
  const domain: [number, number] = [lo, hi];

  const pct = (value: number) => {
    const p = ((value - domain[0]) / (domain[1] - domain[0])) * 100;
    return Math.min(100, Math.max(0, p));
  };
  return { domain, ticks: ready.length ? niceTicks(lo, hi) : [], pct };
}
