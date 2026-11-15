// The step 6 margin chart: positions come from moneyScale, numbers from the estimates the test builds.
import { render, screen, within } from '@testing-library/react';
import { t } from '../../app/i18n';
import type { RotationOption } from '../../contracts';
import { iowaAnalysis } from '../../fixtures';
import { MarginChart } from './MarginChart';
import { moneyRows, moneyScale } from './moneyRows';
import { estimate, withMoney } from './testMoney';

const datasets = iowaAnalysis.datasets;
const ids = iowaAnalysis.shownByGoal.keepSoil ?? [];
const currentIndex = ids.findIndex((id) => iowaAnalysis.rotations.find((r) => r.id === id)?.isCurrent);
const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);

// One value set per shown rotation; the current one gets a negative bad year so the zero line shows.
const values = ids.map((_, i): [number, number, number] =>
  i === currentIndex ? [650, -10, 1119] : [1000 * (i + 1), 500 * (i + 1), 1500 * (i + 1)],
);

function draw(
  money: RotationOption['money'][] = values.map(([v, lo, hi]) => ({
    status: 'ready' as const,
    data: estimate(v, lo, hi, 'PLN'),
  })),
) {
  const rows = moneyRows(withMoney(iowaAnalysis, money), 'keepSoil');
  const scale = moneyScale(rows);
  render(<MarginChart rows={rows} scale={scale} datasets={datasets} />);
  return { rows, scale };
}

const barOf = (title: string) => within(screen.getByRole('group', { name: title })).getByRole('img');
const pctStyle = (n: number) => `${n}%`;

describe('MarginChart', () => {
  it('draws one bar per rotation: the range from bad to good year and the marker at the average', async () => {
    const { rows, scale } = draw();
    await screen.findByRole('group', { name: rows[0]!.title });
    for (const row of rows) {
      const bar = barOf(row.title);
      expect(bar).toHaveAccessibleName(
        t('steps.money.barLabel', {
          name: row.title,
          mean: fmt(row.mean!),
          low: fmt(row.low!),
          high: fmt(row.high!),
          unit: 'PLN',
        }),
      );
      const marker = bar.querySelector<HTMLElement>('[data-part="marker"]')!;
      const range = bar.querySelector<HTMLElement>('[data-part="range"]')!;
      expect(marker.style.left).toBe(pctStyle(scale.pct(row.mean!)));
      expect(range.style.left).toBe(pctStyle(scale.pct(row.low!)));
      expect(range.style.width).toBe(pctStyle(scale.pct(row.high!) - scale.pct(row.low!)));
    }
  });

  it('greys the current rotation, labels it, and puts the reference line at its average', async () => {
    const { rows, scale } = draw();
    const current = rows.find((r) => r.isCurrent)!;
    expect(await screen.findAllByText(t('steps.money.current'))).not.toHaveLength(0);
    const bar = barOf(current.title);
    expect(bar.querySelector('[data-part="range"]')).toHaveClass('bg-zinc-300');
    const refs = document.querySelectorAll<HTMLElement>('[data-part="reference"]');
    expect(refs.length).toBeGreaterThan(0);
    refs.forEach((ref) => expect(ref.style.left).toBe(pctStyle(scale.pct(current.mean!))));
    expect(screen.getByText(t('steps.money.reference'))).toBeInTheDocument();
  });

  it('draws the zero line when a value is negative', async () => {
    const { scale } = draw();
    await screen.findByText(t('steps.money.reference'));
    const zeros = document.querySelectorAll<HTMLElement>('[data-part="zero"]');
    expect(zeros.length).toBeGreaterThan(0);
    zeros.forEach((z) => expect(z.style.left).toBe(pctStyle(scale.pct(0))));
  });

  it('keeps a rotation without money as a row with its reason and no marker', async () => {
    const reason = { code: 'income.no-yield-response', params: { crop: 'oats' } };
    const money: RotationOption['money'][] = values.map(([v, lo, hi], i) =>
      i === 0
        ? ({ status: 'no-data', reason } as const)
        : ({ status: 'ready', data: estimate(v, lo, hi, 'PLN') } as const),
    );
    const { rows } = draw(money);
    const row = await screen.findByRole('group', { name: rows[0]!.title });
    expect(row).toHaveTextContent(t(reason));
    expect(row.querySelector('[data-part="marker"]')).toBeNull();
    expect(row).not.toHaveTextContent(/\b0 PLN/);
  });

  it('has a hidden table with one row per rotation and the same numbers', async () => {
    const { rows } = draw();
    const table = await screen.findByRole('table', { name: t('steps.money.table') });
    const bodyRows = within(table).getAllByRole('row').slice(1);
    expect(bodyRows).toHaveLength(rows.length);
    rows.forEach((row, i) => {
      const cells = bodyRows[i]!;
      expect(cells).toHaveTextContent(row.title);
      expect(cells).toHaveTextContent(fmt(row.low!));
      expect(cells).toHaveTextContent(fmt(row.mean!));
      expect(cells).toHaveTextContent(fmt(row.high!));
    });
  });

  it('shows the axis ticks in the currency per hectare', async () => {
    const { scale } = draw();
    await screen.findByText(t('steps.money.axis', { currency: 'PLN' }));
    for (const tick of scale.ticks)
      expect(screen.getByText(fmt(tick), { selector: '[data-part="tick"]' })).toBeInTheDocument();
  });
});
