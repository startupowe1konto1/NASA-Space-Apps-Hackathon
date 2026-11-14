import { score, sourced } from './schemas';

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
