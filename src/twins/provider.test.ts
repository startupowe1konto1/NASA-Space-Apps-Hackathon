import { describe, expect, it } from 'vitest';
import type { Field, FieldProfile } from '../contracts';
import { createTwinsProvider, type CasesFile } from './provider';

const feats = (gsRainMm: number, gsRootZoneWetness: number, frostDaysPerYear: number, yearlyMaxTempC: number) => ({
  gsMeanTempC: 18, gsRainMm, gsRootZoneWetness, frostDaysPerYear, yearlyMaxTempC,
});
const crops = (entries: Record<string, number>) => ({
  crops: Object.fromEntries(Object.entries(entries).map(([id, share]) => [id, { sharePct: share, yieldTPerHa: 5, years: '2019–2023', source: 'usda-nass-quickstats' }])),
});

const cases: CasesFile = {
  meta: { retrievedAt: '2026-11-14', script: 'scripts/twins_outcomes.py', sourceUrl: 'https://quickstats.nass.usda.gov/' },
  regions: [
    { id: 'US-1', name: 'Near County, IA', country: 'US', centroid: { lat: 42, lon: -93 }, features: feats(600, 0.5, 140, 35), outcome: crops({ maize: 55, soybean: 40 }) },
    { id: 'US-2', name: 'Far County, NE', country: 'US', centroid: { lat: 41, lon: -100 }, features: feats(300, 0.3, 170, 38), outcome: crops({ maize: 70 }) },
    { id: 'US-3', name: 'Wheat County, MN', country: 'US', centroid: { lat: 45, lon: -95 }, features: feats(590, 0.5, 141, 35), outcome: crops({ 'winter-wheat': 30 }) },
    { id: 'US-4', name: 'No Data County, IN', country: 'US', centroid: { lat: 40, lon: -86 }, features: feats(600, 0.5, 140, 35), outcome: null },
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `PL-${i}`, name: `Region ${i}`, country: 'PL' as const, centroid: { lat: 52, lon: 17 },
      features: feats(330 + i, 0.36, 105, 33), outcome: crops({ 'winter-wheat': 25, maize: 10 }),
    })),
  ],
};

const field: Field = {
  id: 'demo-iowa', name: 'Iowa demo field', country: 'US', areaHa: 24, centroid: { lat: 42.03, lon: -93.5 },
  polygon: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [0, 0]]] },
};
const profile = (rainPerSeasonMonth: number): FieldProfile => {
  const monthly = [2001, 2002].flatMap((year) =>
    Array.from({ length: 12 }, (_, i) => ({
      year, month: i + 1,
      rainMm: i + 1 >= 4 && i + 1 <= 9 ? rainPerSeasonMonth : 20,
      rootWetness: 0.5, tMaxC: i === 6 ? 35 : 10, frostDays: i < 3 || i > 9 ? 28 : 0, evapotranspirationMm: null,
    })),
  );
  return { monthly } as unknown as FieldProfile;
};

const provider = createTwinsProvider(cases);

describe('TwinsProvider', () => {
  it('returns the nearest regions that grow a crop of the rotation, with case count and mean similarity', async () => {
    const result = await provider.getTwins(field, profile(100), [{ crop: 'maize' }, { crop: 'soybean' }]);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    const { cases: found, caseCount, meanSimilarity } = result.data;
    expect(found[0]).toMatchObject({ regionName: 'Near County, IA', country: 'US', crops: ['maize', 'soybean'], years: '2019–2023' });
    expect(found.map((c) => c.regionName)).not.toContain('Wheat County, MN'); // grows none of the rotation's crops
    expect(found.map((c) => c.regionName)).not.toContain('No Data County, IN'); // no outcome
    expect(found).toHaveLength(10);
    expect(caseCount).toBe(10);
    expect(meanSimilarity).toBeCloseTo(found.reduce((s, c) => s + c.similarity, 0) / 10, 5);
    expect(found[0]!.similarity).toBeGreaterThanOrEqual(found[1]!.similarity);
    expect(found[0]!.outcome).toMatchObject({ value: 95, unit: '% of harvested area in these crops', kind: 'observation', retrievedAt: '2026-11-14' });
  });

  it('is no-data with twins.no-cases when no region grows a crop of the rotation', async () => {
    const result = await provider.getTwins(field, profile(100), [{ crop: 'phacelia' }]);
    expect(result).toEqual({ status: 'no-data', reason: { code: 'twins.no-cases' } });
  });

  it('counts a cover crop of the rotation too', async () => {
    const result = await provider.getTwins(field, profile(100), [{ crop: 'oats', coverCrop: 'winter-wheat' }]);
    expect(result.status).toBe('ready');
  });
});

describe('caseBaseTwinsProvider on the shipped case base', () => {
  it('answers for the Iowa demo field without throwing: ready with cases, or no-data while outcomes are missing', async () => {
    const { caseBaseTwinsProvider } = await import('./provider');
    const result = await caseBaseTwinsProvider.getTwins(field, profile(100), [{ crop: 'maize' }, { crop: 'soybean' }]);
    expect(['ready', 'no-data']).toContain(result.status);
  });
});
