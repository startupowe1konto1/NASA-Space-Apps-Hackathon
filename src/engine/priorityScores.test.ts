import { describe, expect, it } from 'vitest';
import type { ClimateProfile } from '../contracts';
import { iowaClimate } from '../fixtures/analysis.iowa';
import { fixtureCrops } from '../fixtures/crops';
import { PRIORITY_MESSAGE_CODES, forageScore, waterScore } from './priorityScores';

const us = fixtureCrops.US;
const NEED = { low: 200, medium: 400, high: 600 };

/** A record where every month gets `rain(year, month)` mm. */
function climate(rain: (year: number, month: number) => number | null, years = [2020, 2021, 2022, 2023]): ClimateProfile {
  return {
    source: { datasetIds: ['nasa-power-monthly'], kind: 'model', retrievedAt: '2026-11-14' },
    monthly: years.flatMap((year) =>
      Array.from({ length: 12 }, (_, i) => ({
        year, month: i + 1, rootWetness: 0.5, rainMm: rain(year, i + 1), tMaxC: 20, frostDays: 0, evapotranspirationMm: 50,
      })),
    ),
    monthlyRisk: [], yearly: [], droughtYears: [], trends: [],
  };
}

describe('forageScore', () => {
  it('is the share of years with a forage main crop or a forage cover crop', () => {
    expect(forageScore([{ crop: 'maize' }, { crop: 'soybean' }], us).value).toBe(0);
    expect(forageScore([{ crop: 'maize', coverCrop: 'cereal-rye' }, { crop: 'soybean' }], us).value).toBe(50);
    expect(forageScore([{ crop: 'oats' }, { crop: 'alfalfa' }, { crop: 'maize' }, { crop: 'soybean' }], us).value).toBe(50);
    expect(forageScore([{ crop: 'oats', coverCrop: 'red-clover' }, { crop: 'alfalfa' }], us).value).toBe(100);
  });

  it('carries a listed basis code', () => {
    expect(PRIORITY_MESSAGE_CODES).toContain(forageScore([{ crop: 'maize' }], us).basis.code);
  });
});

describe('waterScore', () => {
  it('counts the crop-years where growing-season rain covers the need class', () => {
    // maize (high, May–Oct = 6 months) needs 600 mm; soybean (medium) needs 400 mm
    const wet = waterScore([{ crop: 'maize' }, { crop: 'soybean' }], us, climate(() => 100), NEED);
    expect(wet.value).toBe(100);
    const mid = waterScore([{ crop: 'maize' }, { crop: 'soybean' }], us, climate(() => 90), NEED);
    expect(mid.value).toBe(50); // 540 mm: soybean covered, maize not
    const dry = waterScore([{ crop: 'maize' }, { crop: 'soybean' }], us, climate(() => 50), NEED);
    expect(dry.value).toBe(0);
  });

  it('gives the spread across years as the range', () => {
    // in 2021 the season is dry, so maize falls short that year only
    const c = climate((year) => (year === 2021 ? 60 : 110));
    const s = waterScore([{ crop: 'maize' }], us, c, NEED);
    expect(s.value).toBe(75);
    expect(s.low).toBe(0);
    expect(s.high).toBe(100);
  });

  it('a winter crop counts rain from its autumn sowing in the previous calendar year', () => {
    // winter-wheat: sown October, harvested July = 10 months; needs 400 mm (medium)
    const c = climate((_, month) => (month >= 10 ? 100 : 20)); // Oct–Dec 300 + Jan–Jul 140 = 440
    const s = waterScore([{ crop: 'winter-wheat' }], us, c, NEED);
    expect(s.value).toBe(100);
    // the first record year has no previous autumn and is left out, not counted as dry
    expect(s.basis.params?.cropYears).toBe(3);
  });

  it('skips seasons with missing rain and lowers confidence', () => {
    const c = climate((year, month) => (year === 2022 && month === 6 ? null : 100));
    const s = waterScore([{ crop: 'maize' }], us, c, NEED);
    expect(s.value).toBe(100);
    expect(s.confidence).toBe('moderate');
    expect(s.basis.params?.cropYears).toBe(3);
  });

  it('runs on the Iowa fixture record', () => {
    const s = waterScore([{ crop: 'maize' }, { crop: 'soybean' }], us, iowaClimate, NEED);
    expect(s.value).toBeGreaterThanOrEqual(0);
    expect(s.value).toBeLessThanOrEqual(100);
    expect(PRIORITY_MESSAGE_CODES).toContain(s.basis.code);
  });

  it('with no usable season the score is weak with its own basis', () => {
    const s = waterScore([{ crop: 'maize' }], us, climate(() => null), NEED);
    expect(s.confidence).toBe('weak');
    expect(s.basis.code).toBe('priority.basis.water-no-data');
  });
});
