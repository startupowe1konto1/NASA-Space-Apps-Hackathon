import { describe, expect, it } from 'vitest';
import type { CalendarMonth, ClimateProfile, CropTraits } from '../contracts';
import { iowaClimate } from '../fixtures/analysis.iowa';
import { fixtureCrops } from '../fixtures/crops';
import { buildCalendar } from './calendar';
import {
  RESILIENCE_MESSAGE_CODES,
  WEAK_CONFIDENCE_MISSING_SHARE,
  droughtLimit,
  resilienceScore,
  withExposure,
  yearlyHits,
} from './resilience';

type Row = ClimateProfile['monthly'][number];
type Cell = Omit<CalendarMonth, 'exposure'>;

const FIRST = 1981;
const LAST = 2025;
const YEARS = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);

/** July wetness of a year: 45 distinct values 0.01..0.45, scrambled so they do not follow the year order. */
const julyWetness = (year: number) => (((year - FIRST) * 17) % 45) + 1;
const julyOf = (year: number) => julyWetness(year) / 100;

/** The drought percentile of data/rules/hazards.json `hazards.drought.percentile` (D30). */
const P20 = 20;

// Iowa maize–soybean, computed once with the D30 rule and locked in.
const IOWA_VALUE = 8.9;
const IOWA_LOW = 0;
const IOWA_HIGH = 30;

/**
 * A hand-made 45-year record with a dry summer. June and August wetness is 0.005 every year, July wetness is
 * distinct per year (0.01..0.45), every other month 0.5. tMax 20 °C and no frost days, unless `edit` changes them.
 *
 * Pooled over all 540 months (D30), the 20th percentile lies between the 108th and 109th lowest values: 90 dry
 * June/August months come first, so it falls between the 18th and 19th driest July (0.18 and 0.19), at 0.188.
 */
function makeClimate(edit: (row: Row) => Row = (row) => row): ClimateProfile {
  const monthly: Row[] = [];
  for (const year of YEARS) {
    for (let month = 1; month <= 12; month++) {
      const base: Row = {
        year,
        month,
        rootWetness: month === 7 ? julyOf(year) : month === 6 || month === 8 ? 0.005 : 0.5,
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

const dryJulyYears = YEARS.filter((y) => julyWetness(y) <= 18); // the 18 driest Julys, below 0.188

/** Independent check of D30: linear-interpolation percentile of every monthly wetness value in the record. */
function pooledLimit(climate: ClimateProfile, p: number): number {
  const sorted = climate.monthly
    .map((r) => r.rootWetness)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  const h = (sorted.length - 1) * (p / 100);
  const lo = Math.floor(h);
  return sorted[lo]! + (h - lo) * (sorted[Math.ceil(h)]! - sorted[lo]!);
}
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

describe('droughtLimit', () => {
  it('is the percentile of all monthly wetness values of the record, all months and years pooled (D30)', () => {
    const climate = makeClimate();
    expect(droughtLimit(climate, P20)).toBeCloseTo(0.188, 9);
    expect(droughtLimit(climate, P20)).toBeCloseTo(pooledLimit(climate, P20), 12);
  });

  it('leaves missing months out and is null when the record has no wetness at all', () => {
    const climate = makeClimate((row) => (row.month === 6 && row.year < 1991 ? { ...row, rootWetness: null } : row));
    expect(droughtLimit(climate, P20)).toBeCloseTo(pooledLimit(climate, P20), 12);
    expect(droughtLimit(makeClimate((row) => ({ ...row, rootWetness: null })), P20)).toBeNull();
  });

  it('throws on a percentile outside 0..100 instead of falling back to a default', () => {
    for (const p of [Number.NaN, -1, 101]) expect(() => droughtLimit(makeClimate(), p)).toThrow(/percentile/);
  });
});

describe('yearlyHits', () => {
  it('drought in July hits exactly the years below the 20th percentile of the whole record (D30)', () => {
    const climate = makeClimate();
    const rows = yearlyHits(cropA, climate, P20);
    expect(rows).toHaveLength(45);
    expect(rows.every((r) => r.month === 7 && r.hazard === 'drought')).toBe(true);

    const limit = pooledLimit(climate, P20);
    const expected = YEARS.filter((y) => julyOf(y) < limit);
    expect(expected).toHaveLength(18);

    const hitYears = rows.filter((r) => r.hit).map((r) => r.year).sort((a, b) => a - b);
    expect(hitYears).toEqual(expected);
    expect(hitYears).toEqual(dryJulyYears);
  });

  it('the percentile comes from the argument, not from the crop threshold', () => {
    // 17th percentile pooled: h = 91.63, between the 92nd and 93rd lowest = July 0.02 and 0.03 → 2 years
    const rows = yearlyHits(cropA, makeClimate(), 17);
    expect(rows.filter((r) => r.hit).map((r) => julyWetness(r.year)).sort((a, b) => a - b)).toEqual([1, 2]);
  });

  it('shortfallVsMedian is the shortfall against the July median in every year below it, hit or not', () => {
    const rows = yearlyHits(cropA, makeClimate(), P20);
    const median = 0.23; // the 23rd of 45 distinct July values 0.01..0.45
    const byWetness = (w: number) => rows.find((r) => julyWetness(r.year) === w)!;
    expect(byWetness(1).hit).toBe(true);
    expect(byWetness(1).shortfallVsMedian).toBeCloseTo((median - 0.01) / median, 9);
    // 0.20 is above the drought limit 0.188 but below the median: no hit, still a shortfall
    expect(byWetness(20).hit).toBe(false);
    expect(byWetness(20).shortfallVsMedian).toBeCloseTo((median - 0.2) / median, 9);
    for (const r of rows.filter((x) => julyOf(x.year) >= median)) expect(r.shortfallVsMedian).toBe(0);
    expect(rows.filter((r) => (r.shortfallVsMedian ?? 0) > 0)).toHaveLength(22);
  });

  it('heat hits when tMax is above the threshold, frost when frost days are above it; no shortfall', () => {
    const climate = makeClimate((row) => {
      if (row.month === 8 && row.year === 1990) return { ...row, tMaxC: 30.5 };
      if (row.month === 8 && row.year === 1991) return { ...row, tMaxC: 30 }; // equal: no hit
      if (row.month === 5 && row.year === 2000) return { ...row, frostDays: 3 };
      if (row.month === 5 && row.year === 2001) return { ...row, frostDays: 2 }; // equal: no hit
      return row;
    });
    const heat = yearlyHits(cropB, climate, P20);
    expect(heat.filter((r) => r.hit).map((r) => r.year)).toEqual([1990]);
    expect(heat.every((r) => r.shortfallVsMedian === null)).toBe(true);

    const frosty = testCrop({ id: 'f', sensitive: [{ hazard: 'frost', months: [5], threshold: 2, lossShare: 0.1 }] });
    const frost = yearlyHits(frosty, climate, P20);
    expect(frost.filter((r) => r.hit).map((r) => r.year)).toEqual([2000]);
    expect(frost.every((r) => r.shortfallVsMedian === null)).toBe(true);
  });

  it('one row per year and sensitive month; a crop without sensitive months has no rows', () => {
    const two = testCrop({ id: 't', sensitive: [{ hazard: 'drought', months: [6, 7], threshold: 20, lossShare: 0.3 }] });
    expect(yearlyHits(two, makeClimate(), P20)).toHaveLength(90);
    expect(yearlyHits(cropN, makeClimate(), P20)).toEqual([]);
  });

  it('a month exactly at the limit is not a drought (strictly below the percentile, D26)', () => {
    // no dry June/August: 495 of 540 values are 0.5, so the pooled 20th percentile is exactly 0.5
    const climate = makeClimate((row) => (row.month === 7 ? row : { ...row, rootWetness: 0.5 }));
    expect(droughtLimit(climate, P20)).toBe(0.5);
    const june = testCrop({ id: 'j', sensitive: [{ hazard: 'drought', months: [6], threshold: 20, lossShare: 0.3 }] });
    expect(yearlyHits(june, climate, P20).some((r) => r.hit)).toBe(false);
  });

  it('omits rows for missing input months and leaves them out of the percentile', () => {
    const missing = [1981, 1982];
    const climate = makeClimate((row) =>
      row.month === 7 && missing.includes(row.year) ? { ...row, rootWetness: null } : row,
    );
    const rows = yearlyHits(cropA, climate, P20);
    expect(rows).toHaveLength(43);
    expect(rows.some((r) => missing.includes(r.year))).toBe(false);
    const limit = pooledLimit(climate, P20);
    expect(rows.filter((r) => r.hit).map((r) => r.year)).toEqual(
      YEARS.filter((y) => !missing.includes(y) && julyOf(y) < limit),
    );
  });

  it('fixture Iowa maize: drought in 25 of 45 Julys and 37 of 45 Augusts (D30)', () => {
    const rows = yearlyHits(fixtureCrops.US.find((c) => c.id === 'maize')!, iowaClimate, P20);
    const drought = (month: number) => rows.filter((r) => r.hazard === 'drought' && r.month === month);
    expect(drought(7)).toHaveLength(45);
    expect(drought(7).filter((r) => r.hit)).toHaveLength(25);
    expect(drought(8).filter((r) => r.hit)).toHaveLength(37);
  });
});

describe('resilienceScore', () => {
  it('value is the share of crop-years without a hit; low and high are the 10th and 90th percentile years', () => {
    const score = resilienceScore([{ crop: 'a' }, { crop: 'b' }], crops, scoreClimate(), P20);
    // 90 crop-years, 18 drought hits for A and 10 heat hits for B, never in the same year: 62 / 90
    expect(score.value).toBe(68.9);
    // per-year shares: 28 years at 0.5, 17 years at 1.0 -> 10th pct 0.5, 90th pct 1.0
    expect(score.low).toBe(50);
    expect(score.high).toBe(100);
    expect(score.confidence).toBe('strong');
    expect(score.basis).toEqual({ code: 'resilience.basis.years', params: { years: 45, from: 1981, to: 2025 } });
  });

  it('ignores cover crops and counts a crop without sensitive months as never hit', () => {
    const score = resilienceScore([{ crop: 'n', coverCrop: 'c' }], crops, scoreClimate(), P20);
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
    const score = resilienceScore([{ crop: 'ab' }], [both], scoreClimate(), P20);
    expect(score.value).toBe(37.8); // 17 of 45 years without drought or heat
    expect(score.low).toBe(0);
    expect(score.high).toBe(100);
  });

  it('missing months lower confidence to moderate and name the gap in basis', () => {
    const climate = scoreClimate((row) =>
      row.month === 8 && [2024, 2025].includes(row.year) ? { ...row, tMaxC: null } : row,
    );
    const score = resilienceScore([{ crop: 'a' }, { crop: 'b' }], crops, climate, P20);
    expect(score.confidence).toBe('moderate');
    expect(score.basis.code).toBe('resilience.basis.missing-months');
    expect(score.basis.params).toMatchObject({ count: 2, needed: 90, years: 45, from: 1981, to: 2025 });
  });

  it('more than 10% of the needed months missing gives weak confidence', () => {
    expect(WEAK_CONFIDENCE_MISSING_SHARE).toBe(0.1);
    const gone = YEARS.slice(0, 10);
    const climate = scoreClimate((row) =>
      row.month === 8 && gone.includes(row.year) ? { ...row, tMaxC: null } : row,
    );
    const score = resilienceScore([{ crop: 'a' }, { crop: 'b' }], crops, climate, P20);
    expect(score.confidence).toBe('weak');
    expect(score.basis).toMatchObject({ code: 'resilience.basis.missing-months', params: { count: 10, needed: 90 } });
  });

  it('a month row absent from the record counts as missing', () => {
    const climate = scoreClimate();
    climate.monthly = climate.monthly.filter((row) => !(row.year === 2000 && row.month === 7));
    const score = resilienceScore([{ crop: 'a' }], crops, climate, P20);
    expect(score.confidence).toBe('moderate');
    expect(score.basis.params).toMatchObject({ count: 1, needed: 45 });
  });

  it('throws on an unknown crop id', () => {
    expect(() => resilienceScore([{ crop: 'nope' }], crops, scoreClimate(), P20)).toThrow(/nope/);
  });

  it('fixture Iowa maize–soybean gives a fixed value inside its range', () => {
    const score = resilienceScore([{ crop: 'maize' }, { crop: 'soybean' }], fixtureCrops.US, iowaClimate, P20);
    expect(score).toEqual({
      value: IOWA_VALUE,
      low: IOWA_LOW,
      high: IOWA_HIGH,
      confidence: 'strong',
      basis: { code: 'resilience.basis.years', params: { years: 45, from: 1981, to: 2025 } },
    });
  });

  it('throws on a drought percentile outside 0..100', () => {
    expect(() => resilienceScore([{ crop: 'a' }], crops, scoreClimate(), Number.NaN)).toThrow(/percentile/);
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
    const out = withExposure(cells(), crops, climate, 0.1, P20);
    expect(out).toHaveLength(12);
    const marked = out.filter((m) => m.exposure.length > 0);
    expect(marked.map((m) => m.month)).toEqual([7]);

    const rows = yearlyHits(cropA, climate, P20).filter((r) => r.month === 7 && r.hazard === 'drought');
    const share = rows.filter((r) => r.hit).length / rows.length;
    expect(share).toBeCloseTo(0.4, 6);
    expect(marked[0]!.exposure).toEqual([
      {
        hazard: 'drought',
        probability: {
          value: 0.4,
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
    const share = withExposure(cells(), crops, climate, 0.1, P20).find((m) => m.month === 7)!.exposure[0]!.probability.value!;
    expect(resilienceScore([{ crop: 'a' }], crops, climate, P20).value).toBeCloseTo((1 - share) * 100, 6);
  });

  it('with markShare 0.2 a summer-sensitive crop gets a drought mark and a winter-sensitive crop does not (D30)', () => {
    const winter = testCrop({
      id: 'w',
      sowMonth: 10,
      harvestMonth: 7,
      sensitive: [{ hazard: 'drought', months: [1, 2], threshold: 20, lossShare: 0.3 }],
    });
    const input: Cell[] = [
      { yearIndex: 0, month: 1, crop: 'w', cover: 'crop' },
      { yearIndex: 0, month: 2, crop: 'w', cover: 'crop' },
      { yearIndex: 1, month: 7, crop: 'a', cover: 'crop' },
    ];
    const out = withExposure(input, [...crops, winter], scoreClimate(), 0.2, P20);
    expect(out[0]!.exposure).toEqual([]);
    expect(out[1]!.exposure).toEqual([]);
    expect(out[2]!.exposure.map((e) => [e.hazard, e.probability.value])).toEqual([['drought', 0.4]]);
  });

  it('no mark when the share equals markShare (strictly above)', () => {
    const out = withExposure(cells(), crops, scoreClimate(), 0.4, P20);
    expect(out.every((m) => m.exposure.length === 0)).toBe(true);
  });

  it('marks a cover crop in a sensitive month; residue, bare and insensitive cells get none', () => {
    // September as dry as July: 180 low values pooled, the limit falls between 0.09 and 0.10, 9 of 45 years
    const climate = makeClimate((row) => (row.month === 9 ? { ...row, rootWetness: julyOf(row.year) } : row));
    const input: Cell[] = [
      { yearIndex: 0, month: 9, crop: 'c', cover: 'cover-crop' },
      { yearIndex: 0, month: 10, crop: 'c', cover: 'cover-crop' },
      { yearIndex: 0, month: 7, cover: 'bare' },
      { yearIndex: 0, month: 7, cover: 'residue' },
      { yearIndex: 0, month: 8, crop: 'b', cover: 'crop' },
    ];
    const out = withExposure(input, crops, climate, 0.1, P20);
    expect(out[0]!.exposure.map((e) => e.hazard)).toEqual(['drought']);
    expect(out[0]!.exposure[0]!.probability.value).toBe(0.2);
    expect(out.slice(1).every((m) => m.exposure.length === 0)).toBe(true);
  });

  it('works on a real calendar with fixture crops and the Iowa climate', () => {
    // maize drought: July 25/45 = 0.556, August 37/45 = 0.822; soybean drought in August 37/45
    const { months } = buildCalendar([{ crop: 'maize' }, { crop: 'soybean', coverCrop: 'cereal-rye' }], fixtureCrops.US);
    const out = withExposure(months, fixtureCrops.US, iowaClimate, 0.2, P20);
    expect(out).toHaveLength(24);
    for (const m of out) {
      for (const e of m.exposure) {
        expect(m.crop).toBeDefined();
        expect(e.probability.value!).toBeGreaterThan(0.2);
        const crop = fixtureCrops.US.find((c) => c.id === m.crop)!;
        expect(crop.sensitive.some((s) => s.hazard === e.hazard && s.months.includes(m.month))).toBe(true);
      }
    }
    const droughtMarks = out
      .filter((m) => m.exposure.some((e) => e.hazard === 'drought'))
      .map((m) => [m.crop, m.month, m.exposure.find((e) => e.hazard === 'drought')!.probability.value]);
    expect(droughtMarks).toEqual([
      ['maize', 7, 0.556],
      ['maize', 8, 0.822],
      ['soybean', 8, 0.822],
    ]);
  });
});
