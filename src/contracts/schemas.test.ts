import type { CropTraits, WaterNeed } from './index';
import { cropTraits, moneyFile, score, sourced } from './schemas';

const base = { datasetIds: ['nasa-power-monthly'], kind: 'model', retrievedAt: '2026-11-14' };

describe('sourced', () => {
  it('accepts a value with its source', () => {
    expect(sourced.safeParse({ ...base, value: 0.31, unit: 'm³/m³' }).success).toBe(true);
  });

  it('rejects a missing value without a reason', () => {
    expect(sourced.safeParse({ ...base, value: null }).success).toBe(false);
  });

  it('accepts a missing value with a reason', () => {
    expect(sourced.safeParse({ ...base, value: null, missingReason: 'outside the coverage of the soil survey' }).success).toBe(true);
  });

  it('rejects a value with no dataset', () => {
    expect(sourced.safeParse({ ...base, datasetIds: [], value: 1 }).success).toBe(false);
  });
});

describe('score', () => {
  const basis = { code: 'x' };
  it('needs the value inside its range', () => {
    expect(score.safeParse({ value: 60, low: 50, high: 70, confidence: 'moderate', basis }).success).toBe(true);
    expect(score.safeParse({ value: 80, low: 50, high: 70, confidence: 'moderate', basis }).success).toBe(false);
  });
});

describe('cropTraits', () => {
  const base = {
    id: 'x', family: 'Poaceae', legume: false, sowMonth: 9, harvestMonth: 4, sensitive: [],
    forage: false, residueCover: 'high', sources: [{ title: 't', url: 'https://example.org', locator: 'p. 1' }],
  };

  it('accepts a cover crop without water need and yield response factor, since it is not harvested for yield', () => {
    expect(cropTraits.safeParse({ ...base, kind: 'cover' }).success).toBe(true);
  });

  it('still requires water need for cash and perennial crops', () => {
    expect(cropTraits.safeParse({ ...base, kind: 'cash' }).success).toBe(false);
    expect(cropTraits.safeParse({ ...base, kind: 'perennial', yieldResponseFactor: 1.1 }).success).toBe(false);
    expect(cropTraits.safeParse({ ...base, kind: 'cash', waterNeed: 'low', yieldResponseFactor: 1.05 }).success).toBe(true);
  });

  it('accepts any crop kind without a yield response factor (D29: a missing Ky gives no-data income)', () => {
    expect(cropTraits.safeParse({ ...base, kind: 'cash', waterNeed: 'low' }).success).toBe(true);
    expect(cropTraits.safeParse({ ...base, kind: 'perennial', waterNeed: 'high' }).success).toBe(true);
  });
});

describe('WaterNeed', () => {
  it('is the type of CropTraits.waterNeed, so engine maps can key on it', () => {
    const need: NonNullable<CropTraits['waterNeed']> = 'medium';
    const asType: WaterNeed = need;
    const byNeed: Record<WaterNeed, number> = { low: 1, medium: 2, high: 3 };
    expect(byNeed[asType]).toBe(2);
  });
});

describe('moneyFile economics periods', () => {
  const ref = { title: 't', url: 'https://example.org', locator: 'yield: p. 1' };
  const row = {
    crop: 'maize', referenceYieldTPerHa: 10, pricePerT: 150, directCostsPerHa: 1000, sources: [ref],
    yieldPeriod: '2021–2025 mean', pricePeriod: '2025 marketing year', costsPeriod: '2026 budget',
  };
  const file = (economics: object[]) => ({ campaign: 'c', currency: 'USD', economics, payments: [] });

  it('accepts a row where each value has its own period and no single year', () => {
    expect(moneyFile.safeParse(file([row])).success).toBe(true);
  });

  it('keeps the periods when parsing', () => {
    const parsed = moneyFile.parse(file([row]));
    expect(parsed.economics[0]).toMatchObject({ yieldPeriod: row.yieldPeriod, pricePeriod: row.pricePeriod, costsPeriod: row.costsPeriod });
  });

  it('rejects an empty period', () => {
    expect(moneyFile.safeParse(file([{ ...row, pricePeriod: '' }])).success).toBe(false);
  });
});
