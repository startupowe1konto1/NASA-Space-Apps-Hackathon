// Totals per goal and the shown rotations (SPEC section 7 "Total and ranking by goal", section 8, DECISIONS D9, D20 a).
// Pure functions: the scores come in, the ranks, the soil floor and the shown lists go out.
import type { AsyncResult, GoalId, IndicatorId, PriorityId, RotationOption, Score } from '../contracts';
import type { EngineRules, GoalWeights } from './rules';

type Years = RotationOption['years'];

export interface Scored {
  id: string;
  isCurrent: boolean;
  years: Years;
  soilHealth: Score;
  climateResilience: Score;
  priorityScores: Partial<Record<PriorityId, Score>>;
  /** Income score when the income module is wired (O3-B7); absent until then. */
  income?: Score;
  /** Soil health for ranking and the soil floor, compared with the current rotation (see rankSoil). */
  rankSoil?: Score;
}

export interface Ranked extends Scored {
  totals: Record<GoalId, AsyncResult<Score>>;
  rankByGoal: Partial<Record<GoalId, number>>;
  belowSoilFloor: boolean;
}

export const GOALS: GoalId[] = ['keepSoil', 'improveSoil', 'income'];
/** Step 4 priorities that enter the priorities column. Nitrogen, erosion and organic matter act inside soil health. */
const COLUMN_PRIORITIES: PriorityId[] = ['water', 'forage'];
const CONFIDENCE: Score['confidence'][] = ['strong', 'moderate', 'weak'];

const round1 = (x: number) => Math.round(x * 10) / 10;
const clamp = (x: number) => Math.min(100, Math.max(0, x));
const weakest = (list: Score['confidence'][]) => CONFIDENCE[Math.max(...list.map((c) => CONFIDENCE.indexOf(c)))]!;

/** Mean of two or more scores, value, low and high each. */
function meanScore(list: Score[]): Score {
  const m = (k: 'value' | 'low' | 'high') => list.reduce((sum, s) => sum + s[k], 0) / list.length;
  return { value: m('value'), low: m('low'), high: m('high'), confidence: weakest(list.map((s) => s.confidence)), basis: list[0]!.basis };
}

/**
 * Total of one rotation under one goal's weights. The priorities column is the mean of the switched-on water and
 * forage scores that exist; with none, its weight is shared by the other columns in proportion (SPEC section 7).
 * Returns null when the goal needs income and the rotation has none.
 */
export function goalTotal(item: Scored, weights: GoalWeights, on: PriorityId[]): Score {
  const prio = COLUMN_PRIORITIES.filter((p) => on.includes(p))
    .map((p) => item.priorityScores[p])
    .filter((x): x is Score => x !== undefined);
  const parts: { w: number; s: Score }[] = [
    { w: weights.soilHealth, s: item.rankSoil ?? item.soilHealth },
    { w: weights.climateResilience, s: item.climateResilience },
  ];
  if (weights.income !== undefined) {
    if (!item.income) throw new Error('ranking: income weight without an income score');
    parts.push({ w: weights.income, s: item.income });
  }
  if (prio.length > 0) parts.push({ w: weights.priorities, s: meanScore(prio) });
  const sum = parts.reduce((a, p) => a + p.w, 0);
  const combine = (k: 'value' | 'low' | 'high') => parts.reduce((a, p) => a + (p.w / sum) * p.s[k], 0);
  const value = round1(clamp(combine('value')));
  const pct = (w: number) => Math.round((w / sum) * 100);
  return {
    value,
    low: Math.min(value, round1(clamp(combine('low')))),
    high: Math.max(value, round1(clamp(combine('high')))),
    confidence: weakest(parts.map((p) => p.s.confidence)),
    basis: {
      code: 'total.basis',
      params: {
        soil: pct(weights.soilHealth),
        climate: pct(weights.climateResilience),
        priorities: prio.length > 0 ? pct(weights.priorities) : 0,
        income: weights.income !== undefined ? pct(weights.income) : 0,
      },
    },
  };
}

const key = (y: Years[number]) => `${y.crop}+${y.coverCrop ?? ''}`;

/** Years that differ from the current rotation, at the best alignment over the cycle, plus the difference in length. */
export function changedYears(years: Years, current: Years): number {
  if (current.length === 0) return years.length;
  let best = Infinity;
  for (let shift = 0; shift < years.length; shift++) {
    let diff = Math.abs(years.length - current.length);
    for (let i = 0; i < Math.min(years.length, current.length); i++) {
      if (key(years[(i + shift) % years.length]!) !== key(current[i]!)) diff++;
    }
    best = Math.min(best, diff);
  }
  return best;
}

/** The main-crop cycle without cover crops, rotation-invariant: two rotations with the same key differ only by covers. */
export function mainCropKey(years: Years): string {
  const parts = years.map((y) => y.crop);
  let best: string | undefined;
  for (let s = 0; s < parts.length; s++) {
    const k = [...parts.slice(s), ...parts.slice(0, s)].join('/');
    if (best === undefined || k < best) best = k;
  }
  return best ?? '';
}

export const INCOME_NOT_WIRED: AsyncResult<Score> = { status: 'no-data', reason: { code: 'income.not-wired' } };

/**
 * Totals, ranks, soil floor and shown lists. The current rotation is ranked with the others. Each goal with totals
 * shows the current rotation plus the best `shownOthers` others, best first; the soil floor removes others from
 * keepSoil and income; no two shown others differ only by a cover crop (the current rotation's own cover-crop
 * variant may be shown next to it: adding a cover crop is the smallest change a farm can make).
 */
export function rankByGoal(
  items: Scored[],
  rules: Pick<EngineRules, 'weights' | 'floorPoints' | 'shownOthers'>,
  on: PriorityId[],
): { items: Ranked[]; shownByGoal: Partial<Record<GoalId, string[]>> } {
  const current = items.find((i) => i.isCurrent);
  const hasIncome = items.length > 0 && items.every((i) => i.income !== undefined);

  const ranked: Ranked[] = items.map((item) => ({
    ...item,
    totals: {
      keepSoil: { status: 'ready', data: goalTotal(item, rules.weights.keepSoil, on) },
      improveSoil: { status: 'ready', data: goalTotal(item, rules.weights.improveSoil, on) },
      income: hasIncome ? { status: 'ready', data: goalTotal(item, rules.weights.income, on) } : INCOME_NOT_WIRED,
    },
    rankByGoal: {},
    belowSoilFloor:
      !!current && !item.isCurrent && (item.rankSoil ?? item.soilHealth).value < (current.rankSoil ?? current.soilHealth).value - rules.floorPoints,
  }));

  const changes = new Map(ranked.map((r) => [r.id, current ? changedYears(r.years, current.years) : 0]));
  const shownByGoal: Partial<Record<GoalId, string[]>> = {};

  for (const goal of GOALS) {
    const total = (r: Ranked) => {
      const t = r.totals[goal];
      return t.status === 'ready' ? t.data.value : null;
    };
    if (ranked.some((r) => total(r) === null)) continue;
    const order = [...ranked].sort(
      (a, b) =>
        total(b)! - total(a)! ||
        (goal === 'keepSoil' ? changes.get(a.id)! - changes.get(b.id)! : 0) ||
        a.id.localeCompare(b.id),
    );
    order.forEach((r, i) => (r.rankByGoal[goal] = i + 1));

    const floor = goal === 'keepSoil' || goal === 'income';
    const picked: Ranked[] = [];
    const mains = new Set<string>();
    for (const r of order) {
      if (picked.length >= rules.shownOthers) break;
      if (r.isCurrent || (floor && r.belowSoilFloor)) continue;
      const k = mainCropKey(r.years);
      if (mains.has(k)) continue;
      mains.add(k);
      picked.push(r);
    }
    shownByGoal[goal] = order.filter((r) => r.isCurrent || picked.includes(r)).map((r) => r.id);
  }
  return { items: ranked, shownByGoal };
}

export interface SoilParts {
  isCurrent: boolean;
  coverOnly: boolean;
  soilHealth: Score;
  indicators: Partial<Record<IndicatorId, Score>>;
}

/**
 * Soil health for ranking. Rotations can have different indicators scored (a crop without a sourced rule leaves an
 * indicator out), so their own totals average different sets. For ranking, a rotation's soil is the current
 * rotation's total plus the weighted mean of its differences on the indicators both have; `weightOf` gives the
 * priority doubling. The card keeps its own soilHealth. `partial` = the shared set is smaller than either set.
 */
export function rankSoil(c: SoilParts, cur: SoilParts, weightOf: (id: IndicatorId) => number): { score: Score; shared: IndicatorId[]; partial: boolean } {
  if (c.isCurrent || c.coverOnly || cur.coverOnly) return { score: c.soilHealth, shared: [], partial: false };
  const own = Object.keys(c.indicators) as IndicatorId[];
  const theirs = Object.keys(cur.indicators) as IndicatorId[];
  const shared = theirs.filter((id) => c.indicators[id] !== undefined);
  const partial = shared.length < own.length || shared.length < theirs.length;
  if (shared.length === 0) return { score: { ...c.soilHealth, confidence: 'weak' }, shared, partial };
  const ws = shared.reduce((a, id) => a + weightOf(id), 0);
  const d = (k: 'value' | 'low' | 'high') => shared.reduce((a, id) => a + (weightOf(id) * (c.indicators[id]![k] - cur.indicators[id]![k])) / ws, 0);
  const value = round1(clamp(cur.soilHealth.value + d('value')));
  return {
    score: {
      ...c.soilHealth,
      value,
      low: Math.min(value, round1(clamp(cur.soilHealth.low + d('low')))),
      high: Math.max(value, round1(clamp(cur.soilHealth.high + d('high')))),
    },
    shared,
    partial,
  };
}
