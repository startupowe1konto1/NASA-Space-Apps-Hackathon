import { describe, expect, it } from 'vitest';
import { iowaClimate, iowaSlope } from '../fixtures/analysis.iowa';
import { poznanClimate, poznanSlope } from '../fixtures/analysis.poznan';
import { fixtureCrops } from '../fixtures/crops';
import { FALLBACK_RULES, engineRules, loadRules, toSoilRules } from './rules';
import { soilHealth } from './soilHealth';
import { O4_ROWS } from './testdata/o4Rules';

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

describe('toSoilRules on O4 rows (PR #27)', () => {
  const loaded = loadRules({ '../../data/rules/o4.json': O4_ROWS });
  const iowa = { monthly: iowaClimate.monthly, slopePct: iowaSlope };
  const find = (list: { id: string; value: unknown }[], id: string) => list.find((r) => r.id === id)?.value;

  it('converts Iowa nitrogen credits from lb N/acre to kg N/ha with a mid value', () => {
    const { rules, sourceIds } = toSoilRules(loaded, 'US', fixtureCrops.US, [{ crop: 'maize' }, { crop: 'soybean' }], iowa);
    expect(find(rules.nitrogen, 'nitrogen.credit.soybean')).toEqual({ low: 50.445, mid: 58.853, high: 67.26 });
    expect(sourceIds['nitrogen.credit.soybean']).toEqual(['nitrogen.credit.soybean.us-ia']);
    expect(find(rules.nitrogen, 'nitrogen.credit.field-pea')).toBeUndefined(); // Polish row, not for Iowa
  });

  it('uses the medium soil class for Polish humus coefficients and none for Iowa', () => {
    const pl = toSoilRules(loaded, 'PL', fixtureCrops.PL, [{ crop: 'maize' }, { crop: 'winter-wheat' }], { monthly: poznanClimate.monthly, slopePct: poznanSlope });
    expect(find(pl.rules.humus, 'humus.coef.maize')).toBe(-1.15);
    expect(toSoilRules(loaded, 'US', fixtureCrops.US, [{ crop: 'maize' }], iowa).rules.humus).toEqual([]);
  });

  it('builds C factors per cover state, the slope table and a bare-fallow zero point', () => {
    const { rules, sourceIds } = toSoilRules(loaded, 'US', fixtureCrops.US, [{ crop: 'maize', coverCrop: 'cereal-rye' }, { crop: 'soybean' }], iowa);
    expect(find(rules.erosion, 'erosion.cFactor.bare')).toBe(1);
    const maize = (64 + 56 + 43 + 32 + 25 + 21) / 6;
    const soy = (60 + 52 + 38 + 20 + 17) / 5;
    expect(find(rules.erosion, 'erosion.cFactor.crop')).toBeCloseTo((maize + soy) / 200, 3);
    expect(find(rules.erosion, 'erosion.cFactor.residue')).toBeCloseTo((37 + 46) / 200, 3);
    expect(find(rules.erosion, 'erosion.cFactor.cover-crop')).toBeCloseTo((11 * 4 + 9 + 7) / 6 / 100, 3);
    expect(typeof find(rules.erosion, 'erosion.zeroScoreIndex')).toBe('number');
    expect(sourceIds['erosion.zeroScoreIndex']).toContain('erosion.slr.bare');
  });

  it('leaves erosion C factors out for a cover crop without a row', () => {
    const { rules } = toSoilRules(loaded, 'PL', fixtureCrops.PL, [{ crop: 'winter-wheat', coverCrop: 'white-mustard' }, { crop: 'maize' }], {
      monthly: poznanClimate.monthly,
      slopePct: poznanSlope,
    });
    expect(find(rules.erosion, 'erosion.cFactor.cover-crop')).toBeUndefined();
  });

  it('gives each family a minimum return from its crop rows, else the any-family row', () => {
    const { rules } = toSoilRules(loaded, 'US', fixtureCrops.US, [{ crop: 'maize' }], iowa);
    expect(find(rules.pestBreak, 'pestBreak.minReturn.Poaceae')).toEqual({ low: 2, mid: 2, high: 3 });
    expect(find(rules.pestBreak, 'pestBreak.minReturn.Fabaceae')).toEqual({ low: 3, mid: 3, high: 3 });
  });

  it('lets soilHealth score nitrogen, erosion and pest break for the Iowa current rotation', () => {
    const years = [{ crop: 'maize' }, { crop: 'soybean' }];
    const { rules } = toSoilRules(loaded, 'US', fixtureCrops.US, years, iowa);
    const profile = { ...iowaClimate, soil: { sandPct: iowaSlope, clayPct: iowaSlope, organicCarbon: iowaSlope, ph: iowaSlope }, slopePct: iowaSlope };
    const r = soilHealth(years, fixtureCrops.US, profile, rules, { goal: 'keepSoil', on: [], excludedCrops: [] });
    expect(Object.keys(r.indicators).sort()).toEqual(['erosion', 'nitrogen', 'pestBreak']);
    expect(r.missing).toEqual(['organicMatter']);
  });
});
