import { describe, expect, it } from 'vitest';
import { FALLBACK_RULES, engineRules, loadRules } from './rules';

const row = (id: string, value: unknown) => ({
  id,
  value,
  unit: 'u',
  appliesTo: 'test',
  sourceTitle: 'test source',
  sourceUrl: 'https://example.org',
  sourceLocator: 'p. 1',
});

describe('loadRules', () => {
  it('returns the fallback rows when no rule file exists', () => {
    const loaded = loadRules({});
    expect(loaded.byId.get('hazards.calendar.markShare')?.value).toBe(0.2);
    expect(loaded.byId.get('goals.soilFloor.points')?.value).toBe(5);
    expect(loaded.byFile).toEqual({});
    const r = engineRules(loaded);
    expect(r.markShare).toBe(0.2);
    expect(r.notSuitableBelowSI).toBe(10);
    expect(r.floorPoints).toBe(5);
    expect(r.shownOthers).toBe(3);
    expect(r.weights.keepSoil).toEqual({ soilHealth: 0.4, climateResilience: 0.45, priorities: 0.15 });
    expect(r.weights.income).toEqual({ soilHealth: 0.3, climateResilience: 0.2, income: 0.4, priorities: 0.1 });
  });

  it('every fallback row is a sourced rule row', () => {
    for (const r of FALLBACK_RULES) {
      expect(r.sourceTitle.length).toBeGreaterThan(0);
      expect(r.sourceUrl).toMatch(/^https:\/\//);
      expect(r.sourceLocator.length).toBeGreaterThan(0);
    }
  });

  it('a provided row list wins over the fallback, and files are kept by name', () => {
    const loaded = loadRules({
      '../../data/rules/goals.json': [row('goals.soilFloor.points', 7)],
      '../../data/rules/nitrogen.json': [row('nitrogen.credit.soybean', 30)],
    });
    expect(engineRules(loaded).floorPoints).toBe(7);
    expect(loaded.byFile['nitrogen']?.map((r) => r.id)).toEqual(['nitrogen.credit.soybean']);
    expect(engineRules(loaded).markShare).toBe(0.2); // still from the fallback
  });

  it('throws on a row without a source', () => {
    expect(() => loadRules({ '../../data/rules/x.json': [{ id: 'x', value: 1 }] })).toThrow(/x.json/);
  });
});
