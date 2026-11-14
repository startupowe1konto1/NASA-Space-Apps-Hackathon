import { describe, expect, it } from 'vitest';
import type { ClimateProfile, CropEconomics, CropTraits, MoneyEstimate, Sourced } from '../contracts';
import { INCOME_MESSAGE_CODES, incomeEstimate, incomeScores, incomeTotal, yearlyYield } from './income';

type Row = ClimateProfile['monthly'][number];

/** hazards.drought.percentile (D30): pooled over every month of the record. */
const DROUGHT_P = 20;
const FIRST = 1981;
const LAST = 2025;
const YEARS = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);

/**
 * A hand-made 45-year record: every month has wetness 0.5, tMax 20 °C and no frost days, unless `edit` changes it.
 * With 0.5 in at least 37 of 45 Julys, the 20th percentile and the median are both 0.5, so a July at 0.25 is a
 * July shortfall of exactly 0.5 against the median.
 */
function makeClimate(edit: (row: Row) => Row = (row) => row): ClimateProfile {
  const monthly: Row[] = [];
  for (const year of YEARS) {
    for (let month = 1; month <= 12; month++) {
      monthly.push(
        edit({ year, month, rootWetness: 0.5, rainMm: 50, tMaxC: 20, frostDays: 0, evapotranspirationMm: 60 }),
      );
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

// A: drought in July (Ky 1.2), heat in July above 35 °C (lossShare 0.2), frost in May above 2 days (lossShare 0.15).
const cropA = testCrop({
  id: 'a',
  yieldResponseFactor: 1.2,
  sensitive: [
    { hazard: 'drought', months: [7], threshold: 20, lossShare: 0.35 },
    { hazard: 'heat', months: [7], threshold: 35, lossShare: 0.2 },
    { hazard: 'frost', months: [5], threshold: 2, lossShare: 0.15 },
  ],
});
// N: no sensitive months.
const cropN = testCrop({ id: 'n' });
// Cover crop with no yield response factor (allowed for cover crops once contract PR #44 lands).
const coverC = { ...testCrop({ id: 'c', kind: 'cover' }), yieldResponseFactor: undefined } as unknown as CropTraits;
const crops = [cropA, cropN, coverC];

const DRY = [1985, 1990, 1995, 2000, 2005]; // five Julys at 0.25
const dryClimate = makeClimate((r) => (r.month === 7 && DRY.includes(r.year) ? { ...r, rootWetness: 0.25 } : r));

const yieldOf = (rows: ReturnType<typeof yearlyYield>, year: number) => rows.find((r) => r.year === year);

describe('yearlyYield', () => {
  it('equals the reference yield in every year without a hazard hit', () => {
    const rows = yearlyYield(cropA, makeClimate(), 10, DROUGHT_P);
    expect(rows).toHaveLength(45);
    for (const r of rows) {
      expect(r.loss).toBe(0);
      expect(r.yieldTPerHa).toBe(10);
    }
  });

  it('turns a July shortfall of 0.5 against the median and yield response factor 1.2 into a loss of 0.6', () => {
    const rows = yearlyYield(cropA, dryClimate, 10, DROUGHT_P);
    expect(yieldOf(rows, 1985)!.loss).toBeCloseTo(0.6, 10);
    expect(yieldOf(rows, 1985)!.yieldTPerHa).toBeCloseTo(4, 10);
    expect(yieldOf(rows, 1986)!.loss).toBe(0);
  });

  it('counts the July shortfall against the median in a year below the median that is not a drought hit (SPEC 7)', () => {
    // Julys rise from 0.30 (1981) to 0.74 (2025), median 0.52; every other month is 0.1, so the pooled 20th
    // percentile is 0.1 and no July is a drought hit. 1981 still falls short of the median by (0.52-0.30)/0.52.
    const climate = makeClimate((r) => ({ ...r, rootWetness: r.month === 7 ? 0.3 + 0.01 * (r.year - FIRST) : 0.1 }));
    const rows = yearlyYield(cropA, climate, 10, DROUGHT_P);
    expect(yieldOf(rows, 1981)!.loss).toBeCloseTo(((0.52 - 0.3) / 0.52) * 1.2, 6);
    expect(yieldOf(rows, 2003)!.loss).toBe(0); // July 0.52 = the median
    expect(yieldOf(rows, 2025)!.loss).toBe(0);
  });

  it('takes the largest drought loss over the sensitive months, not the sum', () => {
    const twoMonths = testCrop({
      id: 'd',
      yieldResponseFactor: 1,
      sensitive: [{ hazard: 'drought', months: [6, 7], threshold: 20, lossShare: 0.3 }],
    });
    const climate = makeClimate((r) => {
      if (r.year !== 1990) return r;
      if (r.month === 6) return { ...r, rootWetness: 0.4 }; // deficit 0.2
      if (r.month === 7) return { ...r, rootWetness: 0.25 }; // deficit 0.5
      return r;
    });
    expect(yieldOf(yearlyYield(twoMonths, climate, 10, DROUGHT_P), 1990)!.loss).toBeCloseTo(0.5, 10);
  });

  it('applies lossShare for heat and for frost in a sensitive month', () => {
    const climate = makeClimate((r) => {
      if (r.year === 1990 && r.month === 7) return { ...r, tMaxC: 38 };
      if (r.year === 1991 && r.month === 5) return { ...r, frostDays: 4 };
      if (r.year === 1992 && r.month === 8) return { ...r, tMaxC: 40 }; // August is not a sensitive month of A
      return r;
    });
    const rows = yearlyYield(cropA, climate, 10, DROUGHT_P);
    expect(yieldOf(rows, 1990)!.loss).toBeCloseTo(0.2, 10);
    expect(yieldOf(rows, 1991)!.loss).toBeCloseTo(0.15, 10);
    expect(yieldOf(rows, 1991)!.yieldTPerHa).toBeCloseTo(8.5, 10);
    expect(yieldOf(rows, 1992)!.loss).toBe(0);
  });

  it('adds drought, heat and frost losses and caps the total at 1', () => {
    const climate = makeClimate((r) => {
      if (r.year !== 1990) return r;
      if (r.month === 7) return { ...r, rootWetness: 0.25, tMaxC: 38 }; // 0.6 + 0.2
      if (r.month === 5) return { ...r, frostDays: 4 }; // + 0.15
      return r;
    });
    const harsh = { ...cropA, yieldResponseFactor: 2 }; // drought alone gives 1.0
    expect(yieldOf(yearlyYield(cropA, climate, 10, DROUGHT_P), 1990)!.loss).toBeCloseTo(0.95, 10);
    const capped = yieldOf(yearlyYield(harsh, climate, 10, DROUGHT_P), 1990)!;
    expect(capped.loss).toBe(1);
    expect(capped.yieldTPerHa).toBe(0);
  });

  it('leaves out a year in which every check is missing, and never invents it', () => {
    const climate = makeClimate((r) =>
      r.year === 2000 && (r.month === 5 || r.month === 7) ? { ...r, rootWetness: null, tMaxC: null, frostDays: null } : r,
    );
    const rows = yearlyYield(cropA, climate, 10, DROUGHT_P);
    expect(rows).toHaveLength(44);
    expect(yieldOf(rows, 2000)).toBeUndefined();
  });

  it('gives the reference yield every year for a crop without sensitive months', () => {
    const rows = yearlyYield(cropN, makeClimate(), 5, DROUGHT_P);
    expect(rows).toHaveLength(45);
    expect(rows.every((r) => r.yieldTPerHa === 5)).toBe(true);
  });

  it('throws for a drought-sensitive crop without a yield response factor', () => {
    const noKy = { ...cropA, yieldResponseFactor: undefined } as unknown as CropTraits;
    expect(() => yearlyYield(noKy, dryClimate, 10, DROUGHT_P)).toThrow(/yield response factor/);
  });
});

const src = (value: number | null, unit: string, datasetId: string, retrievedAt = '2026-11-10'): Sourced => ({
  value,
  unit,
  datasetIds: [datasetId],
  kind: 'observation',
  retrievedAt,
  ...(value === null ? { missingReason: 'not in the table' } : {}),
});

// A: 10 t/ha × 200 − 1000 = 1000 in a normal year; 4 t/ha × 200 − 1000 = −200 in a dry year.
// N: 5 t/ha × 400 − 500 = 1500 every year.
const econA: CropEconomics = {
  crop: 'a',
  referenceYieldTPerHa: src(10, 't/ha', 'usda-quickstats'),
  pricePerT: src(200, 'USD/t', 'usda-quickstats'),
  directCostsPerHa: src(1000, 'USD/ha', 'isu-budgets', '2026-11-12'),
};
const econN: CropEconomics = {
  crop: 'n',
  referenceYieldTPerHa: src(5, 't/ha', 'usda-quickstats'),
  pricePerT: src(400, 'USD/t', 'usda-quickstats'),
  directCostsPerHa: src(500, 'USD/ha', 'usda-quickstats'),
};
const economics = [econA, econN];

const payment = (programme: string, amount: number | null, confirmed: boolean): MoneyEstimate['payments'][number] => ({
  programme,
  amountPerHa: src(amount, 'USD/ha', 'nrcs-payment-schedule'),
  condition: { code: 'payment.condition.test' },
  confirmed,
});

const rotation = [{ crop: 'a', coverCrop: 'c' }, { crop: 'n' }];

describe('incomeEstimate', () => {
  it('averages yield × price − direct costs over the main crops and the record years', () => {
    const r = incomeEstimate(rotation, crops, dryClimate, economics, [], 'USD', 'FY2026, check NRCS', DROUGHT_P);
    expect(r.status).toBe('ready');
    if (r.status !== 'ready') return;
    const { estimate, perYearMargins } = r.data;
    expect(perYearMargins).toHaveLength(45);
    // normal year: (1000 + 1500) / 2 = 1250; dry year: (−200 + 1500) / 2 = 650
    expect(perYearMargins.filter((m) => Math.abs(m - 650) < 1e-9)).toHaveLength(5);
    expect(perYearMargins.filter((m) => Math.abs(m - 1250) < 1e-9)).toHaveLength(40);
    expect(estimate.marginPerHa.value).toBeCloseTo((40 * 1250 + 5 * 650) / 45, 2);
    expect(estimate.marginPerHa.unit).toBe('USD/ha');
    expect(estimate.marginPerHa.kind).toBe('derived');
    expect(estimate.currency).toBe('USD');
    expect(estimate.campaign).toBe('FY2026, check NRCS');
  });

  it('gives the 10th and 90th percentile year as the range, at today’s prices', () => {
    const r = incomeEstimate(rotation, crops, dryClimate, economics, [], 'USD', 'FY2026', DROUGHT_P);
    if (r.status !== 'ready') throw new Error('expected ready');
    const range = r.data.estimate.marginPerHa.range!;
    // sorted: 5 × 650, 40 × 1250; p10 at h = 4.4 → 650 + 0.4 × 600 = 890; p90 = 1250
    expect(range.low).toBeCloseTo(890, 6);
    expect(range.high).toBeCloseTo(1250, 6);
    expect(range.basis).toBe('10th–90th percentile year of the record, at today’s prices');
  });

  it('lists every dataset the margin depends on and the latest retrieval date', () => {
    const r = incomeEstimate(rotation, crops, dryClimate, economics, [], 'USD', 'FY2026', DROUGHT_P);
    if (r.status !== 'ready') throw new Error('expected ready');
    const m = r.data.estimate.marginPerHa;
    expect([...m.datasetIds].sort()).toEqual(['isu-budgets', 'nasa-power-monthly', 'usda-quickstats']);
    expect(m.retrievedAt).toBe('2026-11-14');
  });

  it('adds only confirmed payments and names unconfirmed ones in the gaps', () => {
    const payments = [payment('NRCS 340 Cover crop', 50, true), payment('CSP bundle', 100, false)];
    const r = incomeEstimate(rotation, crops, dryClimate, economics, payments, 'USD', 'FY2026', DROUGHT_P);
    if (r.status !== 'ready') throw new Error('expected ready');
    expect(r.data.confirmedPaymentsPerHa).toBe(50);
    expect(r.data.estimate.payments).toHaveLength(2); // listed, even when left out of the sum
    expect(r.data.gaps).toEqual([{ code: 'gap.payment-unconfirmed', params: { programme: 'CSP bundle' } }]);
    // marginPerHa is the margin alone; payments are their own line
    expect(r.data.estimate.marginPerHa.value).toBeCloseTo((40 * 1250 + 5 * 650) / 45, 2);
  });

  it('leaves a confirmed payment without a rate out of the sum and names it', () => {
    const r = incomeEstimate(rotation, crops, dryClimate, economics, [payment('NRCS 328', null, true)], 'USD', 'FY2026', DROUGHT_P);
    if (r.status !== 'ready') throw new Error('expected ready');
    expect(r.data.confirmedPaymentsPerHa).toBe(0);
    expect(r.data.gaps).toEqual([{ code: 'gap.payment-no-rate', params: { programme: 'NRCS 328' } }]);
  });

  it('returns no-data when a main crop has no sourced price, and estimates nothing', () => {
    const noPrice = { ...econN, pricePerT: src(null, 'USD/t', 'usda-quickstats') };
    const r = incomeEstimate(rotation, crops, dryClimate, [econA, noPrice], [], 'USD', 'FY2026', DROUGHT_P);
    expect(r).toEqual({ status: 'no-data', reason: { code: 'income.no-price', params: { crop: 'n' } } });
  });

  it('returns no-data when a main crop has no economics row, or no sourced yield or cost', () => {
    expect(incomeEstimate(rotation, crops, dryClimate, [econA], [], 'USD', 'FY2026', DROUGHT_P)).toEqual({
      status: 'no-data',
      reason: { code: 'income.no-price', params: { crop: 'n' } },
    });
    const noCost = { ...econA, directCostsPerHa: src(null, 'USD/ha', 'isu-budgets') };
    expect(incomeEstimate(rotation, crops, dryClimate, [noCost, econN], [], 'USD', 'FY2026', DROUGHT_P)).toEqual({
      status: 'no-data',
      reason: { code: 'income.no-price', params: { crop: 'a' } },
    });
  });

  it('ignores cover crops, which have no economics row and no yield response factor', () => {
    const r = incomeEstimate(rotation, crops, dryClimate, economics, [], 'USD', 'FY2026', DROUGHT_P);
    expect(r.status).toBe('ready');
  });

  it('returns no-data when a main crop has no yield response factor', () => {
    const noKy = { ...cropA, yieldResponseFactor: undefined } as unknown as CropTraits;
    const r = incomeEstimate(rotation, [noKy, cropN, coverC], dryClimate, economics, [], 'USD', 'FY2026', DROUGHT_P);
    expect(r).toEqual({ status: 'no-data', reason: { code: 'income.no-yield-response', params: { crop: 'a' } } });
  });

  it('keeps only record years in which every main crop has a yield, and says so', () => {
    const climate = makeClimate((r) =>
      r.year === 2000 && (r.month === 5 || r.month === 7) ? { ...r, rootWetness: null, tMaxC: null, frostDays: null } : r,
    );
    const r = incomeEstimate(rotation, crops, climate, economics, [], 'USD', 'FY2026', DROUGHT_P);
    if (r.status !== 'ready') throw new Error('expected ready');
    expect(r.data.perYearMargins).toHaveLength(44);
    expect(r.data.years).toBe(44);
    expect(r.data.complete).toBe(false);
    expect(r.data.gaps).toContainEqual({ code: 'gap.income-years-left-out', params: { count: 1, years: 45 } });
  });

  it('returns no-data when no record year can be replayed', () => {
    const r = incomeEstimate(rotation, crops, { ...makeClimate(), monthly: [] }, economics, [], 'USD', 'FY2026', DROUGHT_P);
    expect(r).toEqual({ status: 'no-data', reason: { code: 'income.no-climate-years' } });
  });
});

describe('incomeTotal', () => {
  it('adds confirmed payments to the mean and to the bad-year and good-year margins', () => {
    const payments = [payment('NRCS 340', 50, true), payment('CSP', 100, false)];
    const r = incomeEstimate(rotation, crops, dryClimate, economics, payments, 'USD', 'FY2026', DROUGHT_P);
    if (r.status !== 'ready') throw new Error('expected ready');
    const t = incomeTotal(r.data);
    expect(t.meanPerHa).toBeCloseTo((40 * 1250 + 5 * 650) / 45 + 50, 2);
    expect(t.lowPerHa).toBeCloseTo(940, 6);
    expect(t.highPerHa).toBeCloseTo(1300, 6);
    expect(t.years).toBe(45);
    expect(t.complete).toBe(true);
  });
});

const total = (meanPerHa: number, lowPerHa: number, highPerHa: number, complete = true) => ({
  meanPerHa,
  lowPerHa,
  highPerHa,
  years: 45,
  complete,
});

describe('incomeScores', () => {
  it('scales margin plus confirmed payments 0–100 across the candidates of the field', () => {
    const s = incomeScores({ r1: total(100, 50, 150), r2: total(200, 150, 250), r3: total(300, 250, 350) });
    expect(s.r1!.value).toBe(0);
    expect(s.r2!.value).toBe(50);
    expect(s.r3!.value).toBe(100);
  });

  it('scales the 10th and 90th percentile years the same way and keeps them inside 0–100', () => {
    const s = incomeScores({ r1: total(100, 50, 150), r2: total(200, 150, 250), r3: total(300, 250, 350) });
    expect(s.r2!.low).toBe(25);
    expect(s.r2!.high).toBe(75);
    expect(s.r1!.low).toBe(0); // −25 clamped
    expect(s.r3!.high).toBe(100); // 125 clamped
  });

  it('gives 50 to every candidate when all incomes are equal, or there is only one', () => {
    const s = incomeScores({ r1: total(100, 50, 150), r2: total(100, 80, 120) });
    expect(s.r1).toMatchObject({ value: 50, low: 50, high: 50 });
    expect(s.r2!.value).toBe(50);
    expect(incomeScores({ only: total(10, 5, 15) }).only!.value).toBe(50);
  });

  it('is never strong: moderate with a full record, weak when a year was left out', () => {
    const s = incomeScores({ r1: total(100, 50, 150), r2: total(200, 150, 250, false) });
    expect(s.r1!.confidence).toBe('moderate');
    expect(s.r2!.confidence).toBe('weak');
  });

  it('says it is a replay of past years at today’s prices', () => {
    const s = incomeScores({ r1: total(100, 50, 150) });
    expect(s.r1!.basis).toEqual({ code: 'income.basis.replay', params: { years: 45 } });
  });

  it('returns an empty record for no candidates', () => {
    expect(incomeScores({})).toEqual({});
  });
});

describe('INCOME_MESSAGE_CODES', () => {
  it('lists every code the module emits', () => {
    expect([...INCOME_MESSAGE_CODES].sort()).toEqual(
      [
        'gap.income-years-left-out',
        'gap.payment-no-rate',
        'gap.payment-unconfirmed',
        'income.basis.replay',
        'income.no-climate-years',
        'income.no-price',
        'income.no-yield-response',
      ].sort(),
    );
  });
});
