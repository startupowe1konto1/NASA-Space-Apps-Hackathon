import { describe, expect, it } from 'vitest';
import { iowaClimate, iowaSlope } from '../fixtures/analysis.iowa';
import { poznanClimate, poznanSlope } from '../fixtures/analysis.poznan';
import { fixtureCrops } from '../fixtures/crops';
import { engineRules, loadRules, shippedRules, toSoilRules, type RuleRow } from './rules';
import { soilHealth } from './soilHealth';
import goalsFile from '../../data/rules/goals.json';
import hazardsFile from '../../data/rules/hazards.json';

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
  it('has no rows of its own: without rule files there is nothing, and engineRules says which row is missing', () => {
    const loaded = loadRules({});
    expect(loaded.byId.size).toBe(0);
    expect(loaded.byFile).toEqual({});
    expect(() => engineRules(loaded)).toThrow(/hazards\.calendar\.markShare/);
  });

  it('reads every engine number from data/rules/goals.json and hazards.json', () => {
    const r = engineRules(shippedRules);
    const fileValue = (id: string) => [...(goalsFile as RuleRow[]), ...(hazardsFile as RuleRow[])].find((x) => x.id === id)?.value;
    expect(r.markShare).toBe(fileValue(r.ids.markShare));
    expect(r.droughtPercentile).toBe(fileValue(r.ids.drought));
    expect(r.heatMinDays).toBe(fileValue(r.ids.heatMinDays));
    expect(r.notSuitableBelowSI).toBe(fileValue(r.ids.gaez));
    expect(r.floorPoints).toBe(fileValue(r.ids.floor));
    expect(r.shownOthers).toBe(fileValue('goals.shownOthers.count'));
    expect(r.doublingFactor).toBe(fileValue('goals.priorityDoubling.factor'));
    for (const goal of ['keepSoil', 'improveSoil', 'income'] as const) expect(r.weights[goal]).toEqual(fileValue(r.ids.weights[goal]));
  });

  it('keeps rows by file name, a later file wins on the same id', () => {
    const loaded = loadRules({
      '../../data/rules/goals.json': [row('goals.soilFloor.points', 7)],
      '../../data/rules/nitrogen.json': [row('nitrogen.credit.soybean', 30)],
    });
    expect(loaded.byId.get('goals.soilFloor.points')?.value).toBe(7);
    expect(loaded.byFile['nitrogen']?.map((r) => r.id)).toEqual(['nitrogen.credit.soybean']);
  });

  it('throws on a row without a source', () => {
    expect(() => loadRules({ '../../data/rules/x.json': [{ id: 'x', value: 1 }] })).toThrow(/x.json/);
  });
});

describe('toSoilRules on the rows in data/rules', () => {
  const loaded = shippedRules;
  const rowValue = (id: string) => loaded.byId.get(id)!.value as Record<string, number>;
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const r3 = (x: number) => Math.round(x * 1000) / 1000;
  const iowa = { monthly: iowaClimate.monthly, slopePct: iowaSlope };
  const find = (list: { id: string; value: unknown }[], id: string) => list.find((r) => r.id === id)?.value;

  it('converts Iowa nitrogen credits from lb N/acre to kg N/ha with a mid value', () => {
    const { rules, sourceIds } = toSoilRules(loaded, 'US', fixtureCrops.US, [{ crop: 'maize' }, { crop: 'soybean' }], iowa);
    const { low, high } = rowValue('nitrogen.credit.soybean.us-ia') as { low: number; high: number };
    const kg = 1.121; // lb N/acre to kg N/ha, as printed in the row's unit
    expect(find(rules.nitrogen, 'nitrogen.credit.soybean')).toEqual({ low: r3(low * kg), mid: r3(((low + high) / 2) * kg), high: r3(high * kg) });
    expect(sourceIds['nitrogen.credit.soybean']).toEqual(['nitrogen.credit.soybean.us-ia']);
    expect(find(rules.nitrogen, 'nitrogen.credit.field-pea')).toBeUndefined(); // Polish row, not for Iowa
  });

  it('uses the medium soil class for Polish humus coefficients and none for Iowa', () => {
    const pl = toSoilRules(loaded, 'PL', fixtureCrops.PL, [{ crop: 'maize' }, { crop: 'winter-wheat' }], { monthly: poznanClimate.monthly, slopePct: poznanSlope });
    expect(find(pl.rules.humus, 'humus.coef.maize')).toBe(rowValue('humus.coef.maize.pl').medium);
    expect(toSoilRules(loaded, 'US', fixtureCrops.US, [{ crop: 'maize' }], iowa).rules.humus).toEqual([]);
  });

  it('builds C factors per cover state, the slope table and a bare-fallow zero point', () => {
    const { rules, sourceIds } = toSoilRules(loaded, 'US', fixtureCrops.US, [{ crop: 'maize', coverCrop: 'cereal-rye' }, { crop: 'soybean' }], iowa);
    expect(find(rules.erosion, 'erosion.cFactor.bare')).toBe((loaded.byId.get('erosion.slr.bare')!.value as number) / 100);
    const stages = ['seedbed', 'establishment', 'development', 'maturing80', 'maturing90', 'maturing96'];
    const stageMean = (id: string) => mean(stages.map((k) => rowValue(id)[k]).filter((x): x is number => typeof x === 'number'));
    const maize = stageMean('erosion.slr.maize.conventional');
    const soy = stageMean('erosion.slr.soybean.conventional');
    expect(find(rules.erosion, 'erosion.cFactor.crop')).toBeCloseTo((maize + soy) / 200, 3);
    const residue = rowValue('erosion.slr.residueCover.maize').tilled30! + rowValue('erosion.slr.residueCover.soybean').tilled30!;
    expect(find(rules.erosion, 'erosion.cFactor.residue')).toBeCloseTo(residue / 200, 3);
    expect(find(rules.erosion, 'erosion.cFactor.cover-crop')).toBeCloseTo(mean(Object.values(rowValue('erosion.slr.maize.noTillInRyeCover'))) / 100, 3);
    expect(typeof find(rules.erosion, 'erosion.zeroScoreIndex')).toBe('number');
    expect(sourceIds['erosion.zeroScoreIndex']).toContain('erosion.slr.bare');
  });

  it('leaves erosion C factors out for a cover crop without a row', () => {
    const { rules, erosionNoRow } = toSoilRules(loaded, 'PL', fixtureCrops.PL, [{ crop: 'winter-wheat', coverCrop: 'white-mustard' }, { crop: 'maize' }], {
      monthly: poznanClimate.monthly,
      slopePct: poznanSlope,
    });
    expect(find(rules.erosion, 'erosion.cFactor.cover-crop')).toBeUndefined();
    expect(erosionNoRow).toContain('white-mustard');
  });

  it('gives each family a minimum return from its crop rows, else the any-family row', () => {
    const { rules, sourceIds } = toSoilRules(loaded, 'US', fixtureCrops.US, [{ crop: 'maize' }], iowa);
    const lowOf = (v: unknown) => (typeof v === 'number' ? v : (v as { low: number }).low);
    const highOf = (v: unknown) => (typeof v === 'number' ? v : (v as { high: number }).high);
    for (const family of new Set(fixtureCrops.US.map((c) => c.family))) {
      const from = sourceIds[`pestBreak.minReturn.${family}`]!;
      expect(from.length).toBeGreaterThan(0);
      const values = from.map((id) => loaded.byId.get(id)!.value);
      const low = Math.max(...values.map(lowOf));
      expect(find(rules.pestBreak, `pestBreak.minReturn.${family}`)).toEqual(
        from[0] === 'pestBreak.returnYears.anyFamily' ? low : { low, mid: low, high: Math.max(low, ...values.map(highOf)) },
      );
    }
  });

  it('lets soilHealth score nitrogen, erosion and pest break for the Iowa current rotation', () => {
    const years = [{ crop: 'maize' }, { crop: 'soybean' }];
    const { rules } = toSoilRules(loaded, 'US', fixtureCrops.US, years, iowa);
    const profile = { ...iowaClimate, soil: { sandPct: iowaSlope, clayPct: iowaSlope, organicCarbon: iowaSlope, ph: iowaSlope }, slopePct: iowaSlope };
    const r = soilHealth(years, fixtureCrops.US, profile, rules, { goal: 'keepSoil', on: [], excludedCrops: [] });
    expect(Object.keys(r.indicators).sort()).toEqual(['erosion', 'nitrogen', 'pestBreak']);
    expect(r.missing).toEqual(['organicMatter']);
  });

  it('credits a perennial legume once per stand, not once per year', () => {
    const profile = { ...iowaClimate, soil: { sandPct: iowaSlope, clayPct: iowaSlope, organicCarbon: iowaSlope, ph: iowaSlope }, slopePct: iowaSlope };
    const nitrogenOf = (years: { crop: string }[]) => {
      const { rules } = toSoilRules(loaded, 'US', fixtureCrops.US, years, iowa);
      return soilHealth(years, fixtureCrops.US, profile, rules, { goal: 'keepSoil', on: [], excludedCrops: [] }).indicators.nitrogen!.value;
    };
    const two = nitrogenOf([{ crop: 'alfalfa' }, { crop: 'alfalfa' }, { crop: 'maize' }]);
    const three = nitrogenOf([{ crop: 'alfalfa' }, { crop: 'alfalfa' }, { crop: 'alfalfa' }, { crop: 'maize' }]);
    expect(three).toBeLessThanOrEqual(two);
  });
});
