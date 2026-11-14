import { describe, expect, it } from 'vitest';
import type { CalendarMonth, ClimateProfile, CropTraits } from '../contracts';
import { iowaClimate } from '../fixtures/analysis.iowa';
import { fixtureCrops } from '../fixtures/crops';
import { buildCalendar } from './calendar';
import { RESILIENCE_MESSAGE_CODES, resilienceScore, withExposure, yearlyHits } from './resilience';

type Row = ClimateProfile['monthly'][number];
type Cell = Omit<CalendarMonth, 'exposure'>;

const FIRST = 1981;
const LAST = 2025;
const YEARS = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);

/** July wetness of a year: 45 distinct values 0.01..0.45, scrambled so they do not follow the year order. */
const julyWetness = (year: number) => (((year - FIRST) * 17) % 45) + 1;
const julyOf = (year: number) => julyWetness(year) / 100;

/**
 * A hand-made 45-year record. Every month has wetness 0.5, tMax 20 °C and no frost days, except July wetness
 * (distinct per year) and whatever `edit` changes.
 */
function makeClimate(edit: (row: Row) => Row = (row) => row): ClimateProfile {
  const monthly: Row[] = [];
  for (const year of YEARS) {
    for (let month = 1; month <= 12; month++) {
      const base: Row = {
        year,
        month,
        rootWetness: month === 7 ? julyOf(year) : 0.5,
        rainMm: 50,
        tMaxC: 20,
        frostDays: 0,
        evapotranspirationMm: 60,
      };
      monthly.push(edit(base));
    }
  }
  return {
    source: { datasetIds: ['nasa-power-monthly'], kind: 'model', retrievedAt: '2026-11-14' },
    monthly,
    monthlyRisk: [],
    yearly: [],
    droughtYears: [],
    trends: [],
  };
}

const testCrop = (row: Partial<CropTraits> & Pick<CropTraits, 'id'>): CropTraits => ({
  family: 'Testaceae',
  legume: false,
  kind: 'cash',
  sowMonth: 5,
  harvestMonth: 10,
  sensitive: [],
  waterNeed: 'medium',
  yieldResponseFactor: 1,
  forage: false,
  residueCover: 'low',
  sources: [{ title: 'test', url: 'https://example.org', locator: 'test' }],
  ...row,
});

// A: drought in July, 20th percentile. B: heat in August above 30 °C. N: no sensitive months.
const cropA = testCrop({ id: 'a', sensitive: [{ hazard: 'drought', months: [7], threshold: 20, lossShare: 0.3 }] });
const cropB = testCrop({ id: 'b', sensitive: [{ hazard: 'heat', months: [8], threshold: 30, lossShare: 0.2 }] });
const cropN = testCrop({ id: 'n' });
const coverC = testCrop({
  id: 'c',
  kind: 'cover',
  sowMonth: 8,
  harvestMonth: 4,
  sensitive: [{ hazard: 'drought', months: [7, 9], threshold: 20, lossShare: 0.3 }],
});
const crops = [cropA, cropB, cropN, coverC];

const dryJulyYears = YEARS.filter((y) => julyWetness(y) <= 9); // the 9 driest Julys
const hotAugustYears = YEARS.filter((y) => !dryJulyYears.includes(y)).slice(0, 10); // 10 other years

/** The climate used by the score tests: dry Julys as above, hot Augusts in 10 years that are not dry. */
const scoreClimate = (edit: (row: Row) => Row = (row) => row) =>
  makeClimate((row) => edit(row.month === 8 && hotAugustYears.includes(row.year) ? { ...row, tMaxC: 31 } : row));

describe('RESILIENCE_MESSAGE_CODES', () => {
  it('lists the basis codes', () => {
    expect(RESILIENCE_MESSAGE_CODES).toContain('resilience.basis.years');
    expect(RESILIENCE_MESSAGE_CODES).toContain('resilience.basis.missing-months');
  });
});

describe('yearlyHits', () => {
  it('drought in July hits exactly the years below the field’s own 20th percentile for July', () => {
    const climate = makeClimate();
    const rows = yearlyHits(cropA, climate);
    expect(rows).toHaveLength(45);
    expect(rows.every((r) => r.month === 7 && r.hazard === 'drought')).toBe(true);

    // independent check: 20th percentile by linear interpolation of the sorted July values
    const sorted = YEARS.map(julyOf).sort((a, b) => a - b);
    const h = (sorted.length - 1) * 0.2;
    const p20 = sorted[Math.floor(h)]! + (h - Math.floor(h)) * (sorted[Math.ceil(h)]! - sorted[Math.floor(h)]!);
    const expected = YEARS.filter((y) => julyOf(y) < p20);
    expect(expected).toHaveLength(9);

    const hitYears = rows.filter((r) => r.hit).map((r) => r.year).sort((a, b) => a - b);
    expect(hitYears).toEqual(expected);
    expect(hitYears).toEqual(dryJulyYears);
  });

  it('drought deficit is the shortfall against the July median, and 0 for years without a hit', () => {
    const rows = yearlyHits(cropA, makeClimate());
    const median = 0.23; // the 23rd of 45 distinct values 0.01..0.45
    const driest = rows.find((r) => julyWetness(r.year) === 1)!;
    expect(driest.deficit).toBeCloseTo((median - 0.01) / median, 6);
    for (const r of rows.filter((x) => !x.hit)) expect(r.deficit).toBe(0);
  });

  it('heat hits when tMax is above the threshold, frost when frost days are above it; deficit 0', () => {
    const climate = makeClimate((row) => {
      if (row.month === 8 && row.year === 1990) return { ...row, tMaxC: 30.5 };
      if (row.month === 8 && row.year === 1991) return { ...row, tMaxC: 30 }; // equal: no hit
      if (row.month === 5 && row.year === 2000) return { ...row, frostDays: 3 };
      if (row.month === 5 && row.year === 2001) return { ...row, frostDays: 2 }; // equal: no hit
      return row;
    });
    const heat = yearlyHits(cropB, climate);
    expect(heat.filter((r) => r.hit).map((r) => r.year)).toEqual([1990]);
    expect(heat.every((r) => r.deficit === 0)).toBe(true);

    const frosty = testCrop({ id: 'f', sensitive: [{ hazard: 'frost', months: [5], threshold: 2, lossShare: 0.1 }] });
    const frost = yearlyHits(frosty, climate);
    expect(frost.filter((r) => r.hit).map((r) => r.year)).toEqual([2000]);
  });

  it('one row per year and sensitive month; a crop without sensitive months has no rows', () => {
    const two = testCrop({ id: 't', sensitive: [{ hazard: 'drought', months: [6, 7], threshold: 20, lossShare: 0.3 }] });
    expect(yearlyHits(two, makeClimate())).toHaveLength(90);
    expect(yearlyHits(cropN, makeClimate())).toEqual([]);
  });

  it('a month with the same wetness every year is never a drought (strictly below the percentile)', () => {
    const june = testCrop({ id: 'j', sensitive: [{ hazard: 'drought', months: [6], threshold: 20, lossShare: 0.3 }] });
    expect(yearlyHits(june, makeClimate()).some((r) => r.hit)).toBe(false);
  });

  it('omits rows for missing input months and leaves them out of the percentile', () => {
    const missing = [1981, 1982];
    const climate = makeClimate((row) =>
      row.month === 7 && missing.includes(row.year) ? { ...row, rootWetness: null } : row,
    );
    const rows = yearlyHits(cropA, climate);
    expect(rows).toHaveLength(43);
    expect(rows.some((r) => missing.includes(r.year))).toBe(false);
  });
});

describe('resilienceScore', () => {
  it('value is the share of crop-years without a hit; low and high are the 10th and 90th percentile years', () => {
    const score = resilienceScore([{ crop: 'a' }, { crop: 'b' }], crops, scoreClimate());
    // 90 crop-years, 9 drought hits for A and 10 heat hits for B, never in the same year
    expect(score.value).toBeCloseTo(Math.round((71 / 90) * 1000) / 10, 6);
    // per-year shares: 19 years at 0.5, 26 years at 1.0 -> 10th pct 0.5, 90th pct 1.0
    expect(score.low).toBe(50);
    expect(score.high).toBe(100);
    expect(score.confidence).toBe('strong');
    expect(score.basis).toEqual({ code: 'resilience.basis.years', params: { years: 45, from: 1981, to: 2025 } });
  });

  it('ignores cover crops and counts a crop without sensitive months as never hit', () => {
    const score = resilienceScore([{ crop: 'n', coverCrop: 'c' }], crops, scoreClimate());
    expect(score.value).toBe(100);
    expect(score.low).toBe(100);
    expect(score.high).toBe(100);
    expect(score.confidence).toBe('strong');
  });

  it('a crop-year is hit once even when several of its checks hit', () => {
    const both = testCrop({
      id: 'ab',
      sensitive: [
        { hazard: 'drought', months: [7], threshold: 20, lossShare: 0.3 },
        { hazard: 'heat', months: [8], threshold: 30, lossShare: 0.2 },
      ],
    });
    const score = resilienceScore([{ crop: 'ab' }], [both], scoreClimate());
    expect(score.value).toBeCloseTo(Math.round((26 / 45) * 1000) / 10, 6);
    expect(score.low).toBe(0);
    expect(score.high).toBe(100);
  });

  it('missing months lower confidence to moderate and name the gap in basis', () => {
    const climate = scoreClimate((row) =>
      row.month === 8 && [2024, 2025].includes(row.year) ? { ...row, tMaxC: null } : row,
    );
    const score = resilienceScore([{ crop: 'a' }, { crop: 'b' }], crops, climate);
    expect(score.confidence).toBe('moderate');
    expect(score.basis.code).toBe('resilience.basis.missing-months');
    expect(score.basis.params).toMatchObject({ count: 2, needed: 90, years: 45, from: 1981, to: 2025 });
  });

  it('more than 10% of the needed months missing gives weak confidence', () => {
    const gone = YEARS.slice(0, 10);
    const climate = scoreClimate((row) =>
      row.month === 8 && gone.includes(row.year) ? { ...row, tMaxC: null } : row,
    );
    const score = resilienceScore([{ crop: 'a' }, { crop: 'b' }], crops, climate);
    expect(score.confidence).toBe('weak');
    expect(score.basis).toMatchObject({ code: 'resilience.basis.missing-months', params: { count: 10, needed: 90 } });
  });

  it('a month row absent from the record counts as missing', () => {
    const climate = scoreClimate();
    climate.monthly = climate.monthly.filter((row) => !(row.year === 2000 && row.month === 7));
    const score = resilienceScore([{ crop: 'a' }], crops, climate);
    expect(score.confidence).toBe('moderate');
    expect(score.basis.params).toMatchObject({ count: 1, needed: 45 });
  });

  it('throws on an unknown crop id', () => {
    expect(() => resilienceScore([{ crop: 'nope' }], crops, scoreClimate())).toThrow(/nope/);
  });

  it('fixture Iowa maize–soybean gives a value in 0..100 inside its range', () => {
    const score = resilienceScore([{ crop: 'maize' }, { crop: 'soybean' }], fixtureCrops.US, iowaClimate);
    expect(score.value).toBeGreaterThanOrEqual(0);
    expect(score.value).toBeLessThanOrEqual(100);
    expect(score.low).toBeLessThanOrEqual(score.value);
    expect(score.value).toBeLessThanOrEqual(score.high);
    expect(score.basis.params).toMatchObject({ from: 1981, to: 2025 });
  });
});

describe('withExposure', () => {
  const cells = (): Cell[] => {
    const out: Cell[] = [];
    for (let month = 1; month <= 12; month++) {
      if (month >= 5 && month <= 10) out.push({ yearIndex: 0, month, crop: 'a', cover: 'crop' });
      else if (month === 11) out.push({ yearIndex: 0, month, cover: 'residue' });
      else out.push({ yearIndex: 0, month, cover: 'bare' });
    }
    return out;
  };

  it('marks only the months where the crop in the ground is sensitive, with the yearlyHits share', () => {
    const climate = scoreClimate();
    const out = withExposure(cells(), crops, climate, 0.1);
    expect(out).toHaveLength(12);
    const marked = out.filter((m) => m.exposure.length > 0);
    expect(marked.map((m) => m.month)).toEqual([7]);

    const rows = yearlyHits(cropA, climate).filter((r) => r.month === 7 && r.hazard === 'drought');
    const share = rows.filter((r) => r.hit).length / rows.length;
    expect(share).toBeCloseTo(0.2, 6);
    expect(marked[0]!.exposure).toEqual([
      {
        hazard: 'drought',
        probability: {
          value: 0.2,
          unit: 'share of years',
          datasetIds: ['nasa-power-monthly'],
          kind: 'derived',
          retrievedAt: '2026-11-14',
        },
      },
    ]);
    // the cell keeps its position and cover
    expect(marked[0]).toMatchObject({ yearIndex: 0, month: 7, crop: 'a', cover: 'crop' });
  });

  it('agrees with the score: one crop with one check scores (1 − share) × 100', () => {
    const climate = scoreClimate();
    const share = withExposure(cells(), crops, climate, 0.1).find((m) => m.month === 7)!.exposure[0]!.probability.value!;
    expect(resilienceScore([{ crop: 'a' }], crops, climate).value).toBeCloseTo((1 - share) * 100, 6);
  });

  it('no mark when the share is at or below markShare', () => {
    const out = withExposure(cells(), crops, scoreClimate(), 0.2);
    expect(out.every((m) => m.exposure.length === 0)).toBe(true);
  });

  it('marks a cover crop in a sensitive month; residue, bare and insensitive cells get none', () => {
    // September as dry as July: 9 of 45 years below the 20th percentile
    const climate = makeClimate((row) => (row.month === 9 ? { ...row, rootWetness: julyOf(row.year) } : row));
    const input: Cell[] = [
      { yearIndex: 0, month: 9, crop: 'c', cover: 'cover-crop' },
      { yearIndex: 0, month: 10, crop: 'c', cover: 'cover-crop' },
      { yearIndex: 0, month: 7, cover: 'bare' },
      { yearIndex: 0, month: 7, cover: 'residue' },
      { yearIndex: 0, month: 8, crop: 'b', cover: 'crop' },
    ];
    const out = withExposure(input, crops, climate, 0.1);
    expect(out[0]!.exposure.map((e) => e.hazard)).toEqual(['drought']);
    expect(out[0]!.exposure[0]!.probability.value).toBe(0.2);
    expect(out.slice(1).every((m) => m.exposure.length === 0)).toBe(true);
  });

  it('works on a real calendar with fixture crops and the Iowa climate', () => {
    const { months } = buildCalendar([{ crop: 'maize' }, { crop: 'soybean', coverCrop: 'cereal-rye' }], fixtureCrops.US);
    const out = withExposure(months, fixtureCrops.US, iowaClimate, 0.2);
    expect(out).toHaveLength(24);
    for (const m of out) {
      for (const e of m.exposure) {
        expect(m.crop).toBeDefined();
        expect(e.probability.value!).toBeGreaterThan(0.2);
        const crop = fixtureCrops.US.find((c) => c.id === m.crop)!;
        expect(crop.sensitive.some((s) => s.hazard === e.hazard && s.months.includes(m.month))).toBe(true);
      }
    }
  });
});
