import { describe, expect, it } from 'vitest';
import type { Score } from '../contracts';
import { changedYears, goalTotal, rankByGoal, type Scored } from './ranking';
import { engineRules, loadRules } from './rules';

const rules = engineRules(loadRules({}));
const s = (value: number): Score => ({ value, low: value, high: value, confidence: 'strong', basis: { code: 'test' } });

const item = (id: string, years: Scored['years'], soil: number, climate: number, isCurrent = false): Scored => ({
  id,
  isCurrent,
  years,
  soilHealth: s(soil),
  climateResilience: s(climate),
  priorityScores: {},
});

const current = item('maize/soybean', [{ crop: 'maize' }, { crop: 'soybean' }], 50, 60, true);

describe('goalTotal', () => {
  it('follows the weights, sharing the priorities weight when nothing is switched on', () => {
    const t = goalTotal(item('a', [{ crop: 'maize' }], 80, 40), rules.weights.keepSoil, []);
    // 0.4 and 0.45 scaled to sum to 1: 0.4/0.85 and 0.45/0.85
    expect(t.value).toBeCloseTo((0.4 * 80 + 0.45 * 40) / 0.85, 1);
  });

  it('uses the mean of switched-on water and forage scores', () => {
    const a = { ...item('a', [{ crop: 'maize' }], 80, 40), priorityScores: { water: s(20), forage: s(60) } };
    const t = goalTotal(a, rules.weights.improveSoil, ['water', 'forage']);
    expect(t.value).toBeCloseTo(0.6 * 80 + 0.25 * 40 + 0.15 * 40, 1);
  });

  it('keeps low <= value <= high', () => {
    const a = { ...item('a', [{ crop: 'maize' }], 80, 40), climateResilience: { ...s(40), low: 20, high: 70 } };
    const t = goalTotal(a, rules.weights.keepSoil, []);
    expect(t.low).toBeLessThanOrEqual(t.value);
    expect(t.high).toBeGreaterThanOrEqual(t.value);
  });
});

describe('changedYears', () => {
  it('counts changed years, aligned over the cycle', () => {
    expect(changedYears([{ crop: 'soybean' }, { crop: 'maize' }], current.years)).toBe(0);
    expect(changedYears([{ crop: 'maize', coverCrop: 'cereal-rye' }, { crop: 'soybean' }], current.years)).toBe(1);
    expect(changedYears([{ crop: 'maize' }, { crop: 'soybean' }, { crop: 'oats' }], current.years)).toBe(1);
  });
});

describe('rankByGoal', () => {
  const others = [
    item('maize+cereal-rye/soybean', [{ crop: 'maize', coverCrop: 'cereal-rye' }, { crop: 'soybean' }], 60, 60),
    item('maize+red-clover/soybean', [{ crop: 'maize', coverCrop: 'red-clover' }, { crop: 'soybean' }], 59, 60),
    item('maize/soybean/oats', [{ crop: 'maize' }, { crop: 'soybean' }, { crop: 'oats' }], 55, 62),
    item('maize/soybean/alfalfa', [{ crop: 'maize' }, { crop: 'soybean' }, { crop: 'alfalfa' }], 70, 50),
    item('soybean/soybean/maize', [{ crop: 'soybean' }, { crop: 'soybean' }, { crop: 'maize' }], 40, 90), // below the floor
  ];
  const result = rankByGoal([current, ...others], rules, []);
  const byId = new Map(result.items.map((r) => [r.id, r]));

  it('ranks every rotation per goal, 1 = best, the current one included', () => {
    const ranks = result.items.map((r) => r.rankByGoal.keepSoil).sort((a, b) => a! - b!);
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6]);
    expect(byId.get('soybean/soybean/maize')?.rankByGoal.keepSoil).toBe(1); // best total, but below the floor
  });

  it('sets belowSoilFloor and leaves those rotations out of keepSoil and income, not improveSoil', () => {
    expect(byId.get('soybean/soybean/maize')?.belowSoilFloor).toBe(true);
    expect(byId.get('maize/soybean/oats')?.belowSoilFloor).toBe(false);
    expect(result.shownByGoal.keepSoil).not.toContain('soybean/soybean/maize');
  });

  it('shows the current rotation plus up to three others, best first', () => {
    const shown = result.shownByGoal.keepSoil!;
    expect(shown).toContain('maize/soybean');
    expect(shown.length).toBe(4);
    const totals = shown.map((id) => {
      const t = byId.get(id)!.totals.keepSoil;
      return t.status === 'ready' ? t.data.value : NaN;
    });
    expect([...totals].sort((a, b) => b - a)).toEqual(totals);
  });

  it('never shows two others that differ only by a cover crop', () => {
    const shown = result.shownByGoal.keepSoil!;
    expect(shown.includes('maize+cereal-rye/soybean') && shown.includes('maize+red-clover/soybean')).toBe(false);
  });

  it('has no income list and an income total of no-data while income is not wired', () => {
    expect(result.shownByGoal.income).toBeUndefined();
    expect(result.items[0]!.totals.income.status).toBe('no-data');
  });

  it('breaks a keepSoil tie towards the fewest changed years', () => {
    const near = item('maize+cereal-rye/soybean', [{ crop: 'maize', coverCrop: 'cereal-rye' }, { crop: 'soybean' }], 60, 60);
    const far = item('oats/alfalfa', [{ crop: 'oats' }, { crop: 'alfalfa' }], 60, 60);
    const r = rankByGoal([current, far, near], rules, []);
    const rank = (id: string) => r.items.find((x) => x.id === id)!.rankByGoal.keepSoil!;
    expect(rank('maize+cereal-rye/soybean')).toBeLessThan(rank('oats/alfalfa'));
  });

  it('shows fewer than four when fewer than three others pass the floor', () => {
    const low = item('x', [{ crop: 'oats' }], 10, 99);
    const r = rankByGoal([current, low], rules, []);
    expect(r.shownByGoal.keepSoil).toEqual(['maize/soybean']);
    expect(r.shownByGoal.improveSoil).toEqual(['maize/soybean', 'x']);
  });
});
