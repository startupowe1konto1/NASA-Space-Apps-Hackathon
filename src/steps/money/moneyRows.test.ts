// Step 6 rows and the shared axis. The fixtures carry money "not-loaded", so each test attaches a MoneyEstimate of its
// own to the shown rotations and reads every expected value back from it, never from the fixture data.
import type { MoneyEstimate } from '../../contracts';
import { iowaAnalysis } from '../../fixtures';
import { rotationTitle } from '../cards/RotationCard';
import { moneyRows, moneyScale } from './moneyRows';
import { estimate, withMoney } from './testMoney';

const shownIds = iowaAnalysis.shownByGoal.keepSoil ?? [];

describe('moneyRows', () => {
  it('keeps the rotations and the order of step 5 (shownByGoal)', () => {
    const analysis = withMoney(
      iowaAnalysis,
      shownIds.map((_, i) => ({ status: 'ready', data: estimate(100 * (i + 1), 50 * i, 200 * (i + 1)) })),
    );
    const rows = moneyRows(analysis, 'keepSoil');
    expect(rows.map((r) => r.id)).toEqual(shownIds);
    rows.forEach((row) => {
      const rotation = analysis.rotations.find((r) => r.id === row.id)!;
      expect(row.title).toBe(rotationTitle(rotation));
      expect(row.isCurrent).toBe(rotation.isCurrent);
      expect(row.status).toBe('ready');
      const m = (rotation.money as { data: MoneyEstimate }).data.marginPerHa;
      expect(row.mean).toBe(m.value);
      expect(row.low).toBe(m.range!.low);
      expect(row.high).toBe(m.range!.high);
    });
  });

  it('falls back to keepSoil when the goal has no ranking, like step 5', () => {
    const analysis = { ...iowaAnalysis, shownByGoal: { keepSoil: shownIds } };
    expect(moneyRows(analysis, 'income').map((r) => r.id)).toEqual(shownIds);
  });

  it('keeps a rotation without money with its reason and no numbers', () => {
    const reason = { code: 'income.no-yield-response', params: { crop: 'oats' } };
    const analysis = withMoney(iowaAnalysis, [{ status: 'no-data', reason }]);
    const row = moneyRows(analysis, 'keepSoil').find((r) => r.id === shownIds[0])!;
    expect(row.status).toBe('no-data');
    expect(row.reason).toEqual(reason);
    expect(row.mean).toBeUndefined();
  });

  it('treats a missing margin as no data, with its missing reason', () => {
    const m = estimate(1, 0, 2);
    const data = {
      ...m,
      marginPerHa: { ...m.marginPerHa, value: null, range: undefined, missingReason: 'test: no year' },
    };
    const row = moneyRows(withMoney(iowaAnalysis, [{ status: 'ready', data }]), 'keepSoil')[0]!;
    expect(row.status).toBe('no-data');
    expect(row.reason?.code).toBe('test: no year');
  });

  it('says not-loaded and error apart', () => {
    const analysis = withMoney(iowaAnalysis, [
      { status: 'not-loaded' },
      { status: 'error', source: 'test source', reason: { code: 'money.no-tables' } },
    ]);
    const [a, b] = moneyRows(analysis, 'keepSoil');
    expect(a!.status).toBe('not-loaded');
    expect(b!.status).toBe('error');
    expect(b!.source).toBe('test source');
  });
});

describe('moneyScale', () => {
  const rowsOf = (values: [number, number, number][]) =>
    moneyRows(
      withMoney(
        iowaAnalysis,
        values.map(([v, lo, hi]) => ({ status: 'ready', data: estimate(v, lo, hi) })),
      ),
      'keepSoil',
    );

  it('includes zero when a bad year is negative, and puts the ends at 0 and 100', () => {
    const rows = rowsOf([
      [650, -10, 1119],
      [5263, 3710, 6323],
    ]);
    const scale = moneyScale(rows);
    const [lo, hi] = scale.domain;
    expect(lo).toBeLessThan(-10);
    expect(lo).toBeLessThanOrEqual(0);
    expect(hi).toBeGreaterThanOrEqual(6323);
    expect(scale.pct(lo)).toBe(0);
    expect(scale.pct(hi)).toBe(100);
    expect(scale.ticks).toContain(0);
  });

  it('always starts at zero or below, even when every value is positive', () => {
    const scale = moneyScale(
      rowsOf([
        [223, 119, 292],
        [913, 383, 1317],
      ]),
    );
    expect(scale.domain[0]).toBeLessThanOrEqual(0);
    expect(scale.domain[1]).toBeGreaterThanOrEqual(1317);
  });

  it('gives 3 to 5 ticks on a 1, 2 or 5 step', () => {
    for (const values of [
      [
        [223, 119, 292],
        [913, 383, 1317],
      ],
      [
        [650, -10, 1119],
        [5263, 3710, 6323],
        [-73, -467, 187],
      ],
      [[1, 0.2, 3]],
    ] as [number, number, number][][]) {
      const { ticks } = moneyScale(rowsOf(values));
      expect(ticks.length).toBeGreaterThanOrEqual(3);
      expect(ticks.length).toBeLessThanOrEqual(5);
      const step = ticks[1]! - ticks[0]!;
      const mantissa = step / 10 ** Math.floor(Math.log10(step));
      expect([1, 2, 5]).toContain(Math.round(mantissa));
    }
  });

  it('has a usable axis when no row has money', () => {
    const scale = moneyScale(moneyRows(iowaAnalysis, 'keepSoil'));
    expect(scale.pct(scale.domain[0])).toBe(0);
    expect(Number.isFinite(scale.pct(0))).toBe(true);
  });
});
