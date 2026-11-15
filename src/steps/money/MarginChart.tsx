// Step 6 chart: one row per rotation on one shared axis. The marker is the average-year margin per hectare, the bar runs
// from the bad year to the good year (10th and 90th percentile). The current rotation is grey and a dashed line marks its
// average through every row. A rotation without money keeps its row with the reason, never a zero.
// Plain HTML and CSS percentages, like src/ui-kit/ScoreBar.tsx, so no chart library.
import { useId } from 'react';
import { t } from '../../app/i18n';
import type { Dataset } from '../../contracts';
import { SourcedNumber } from '../../ui-kit';
import type { MoneyRow, MoneyScale } from './moneyRows';

const fmt = (n: number) => {
  const text = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  return text === '-0' ? '0' : text;
};

/** The average year as a value of its own: the range is drawn as the bar, not repeated next to the number. */
const average = (row: MoneyRow) => ({ ...row.margin!, range: undefined });

function confirmedPayments(row: MoneyRow): number | null {
  const amounts = (row.money?.payments ?? [])
    .filter((p) => p.confirmed && p.amountPerHa.value !== null)
    .map((p) => p.amountPerHa.value!);
  return amounts.length ? amounts.reduce((a, b) => a + b, 0) : null;
}

/** Grid lines, zero line and reference line, drawn in each bar cell at the same positions, so they read as one line. */
function Guides({ scale, zero, reference }: { scale: MoneyScale; zero: boolean; reference?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {scale.ticks.map((tick) => (
        <span key={tick} className="absolute inset-y-0 w-px bg-slate-200" style={{ left: `${scale.pct(tick)}%` }} />
      ))}
      {zero ? (
        <span data-part="zero" className="absolute inset-y-0 w-px bg-slate-400" style={{ left: `${scale.pct(0)}%` }} />
      ) : null}
      {reference !== undefined ? (
        <span
          data-part="reference"
          className="absolute inset-y-0 w-0 border-l border-dashed border-slate-500"
          style={{ left: `${scale.pct(reference)}%` }}
        />
      ) : null}
    </div>
  );
}

function Bar({ row, scale, unit }: { row: MoneyRow; scale: MoneyScale; unit: string }) {
  const low = scale.pct(row.low!);
  const high = scale.pct(row.high!);
  return (
    <div
      role="img"
      aria-label={t('steps.money.barLabel', {
        name: row.title,
        mean: fmt(row.mean!),
        low: fmt(row.low!),
        high: fmt(row.high!),
        unit,
      })}
      className="absolute inset-x-0 top-1/2 h-6 -translate-y-1/2"
    >
      <div
        data-part="range"
        className={`absolute top-1/2 h-3 -translate-y-1/2 rounded-full border ${
          row.isCurrent ? 'border-slate-500 bg-slate-300' : 'border-emerald-700 bg-emerald-300'
        }`}
        style={{ left: `${low}%`, width: `${high - low}%` }}
      />
      <div
        data-part="marker"
        className="absolute top-0 h-6 w-1.5 -translate-x-1/2 rounded-sm bg-slate-900 ring-2 ring-white"
        style={{ left: `${scale.pct(row.mean!)}%` }}
      />
    </div>
  );
}

function Reason({ row }: { row: MoneyRow }) {
  const text =
    row.status === 'not-loaded'
      ? t('steps.rotations.income.notLoaded')
      : row.status === 'error'
        ? `${t('ui.state.error', { source: row.source ?? '' })} ${row.reason ? t(row.reason) : ''}`.trim()
        : row.reason
          ? t(row.reason)
          : '';
  return <p className="text-sm leading-snug text-slate-700">{text}</p>;
}

/** Tick labels near an end align to that end, so they never spill out of the chart. */
function tickClass(pct: number): string {
  if (pct < 6) return '';
  if (pct > 94) return '-translate-x-full';
  return '-translate-x-1/2';
}

export function MarginChart({ rows, scale, datasets }: { rows: MoneyRow[]; scale: MoneyScale; datasets: Dataset[] }) {
  const titleId = useId();
  const ready = rows.filter((r) => r.status === 'ready');
  const currency = ready[0]?.money?.currency ?? '';
  const zero = scale.domain[0] < 0;
  const current = rows.find((r) => r.isCurrent && r.status === 'ready');
  const reference = current?.mean;
  const lastTick = scale.ticks.length;

  return (
    <figure aria-labelledby={titleId} className="grid gap-1">
      <figcaption id={titleId} className="sr-only">
        {t('steps.money.chart')}
      </figcaption>

      <div className="grid">
        {rows.map((row) => (
          <div
            key={row.id}
            role="group"
            aria-label={row.title}
            className="grid gap-x-4 gap-y-1 border-b border-slate-200 py-2 last:border-b-0 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] sm:items-center"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 sm:flex-col sm:items-start sm:justify-start">
              <span className="min-w-0 text-base font-medium leading-snug text-slate-900">
                <span>{row.title}</span>
                {row.isCurrent ? (
                  <span className="ml-2 inline-block rounded-full bg-slate-800 px-2 py-0.5 align-middle text-xs font-semibold uppercase tracking-wide text-white">
                    {t('steps.money.current')}
                  </span>
                ) : null}
              </span>
              {row.status === 'ready' ? (
                <span className="shrink-0 text-base font-semibold text-slate-900">
                  <SourcedNumber value={average(row)} datasets={datasets} decimals={0} />
                </span>
              ) : null}
            </div>

            <div className="grid gap-1">
              <div className="relative h-11">
                {row.status === 'ready' ? (
                  <>
                    <Guides scale={scale} zero={zero} reference={reference} />
                    <Bar row={row} scale={scale} unit={currency} />
                  </>
                ) : (
                  <div className="absolute inset-x-0 top-1/2 h-6 -translate-y-1/2 rounded-md border border-dashed border-slate-300" />
                )}
              </div>
              {row.status === 'ready' ? null : <Reason row={row} />}
            </div>
          </div>
        ))}

        {lastTick ? (
          <div className="grid gap-x-4 pt-1 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <span className="hidden sm:block" />
            <div className="grid gap-2">
              <div aria-hidden="true" className="relative h-5">
                {scale.ticks.map((tick) => (
                  <span
                    key={tick}
                    data-part="tick"
                    className={`absolute top-0 whitespace-nowrap text-sm tabular-nums text-slate-700 ${tickClass(scale.pct(tick))}`}
                    style={{ left: `${scale.pct(tick)}%` }}
                  >
                    {fmt(tick)}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-slate-700">
                <span>{t('steps.money.axis', { currency })}</span>
                {reference !== undefined ? (
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true" className="inline-block h-4 w-0 border-l border-dashed border-slate-500" />
                    {t('steps.money.reference')}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* A table ignores width limits, so the wrapper, not the table, is the visually hidden box. */}
      <div className="sr-only">
        <table>
          <caption>{t('steps.money.table')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('steps.money.col.rotation')}</th>
              <th scope="col">{t('steps.rotations.income.bad')}</th>
              <th scope="col">{t('steps.rotations.income.average')}</th>
              <th scope="col">{t('steps.rotations.income.good')}</th>
              <th scope="col">{t('steps.money.col.payments')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const paid = confirmedPayments(row);
              return (
                <tr key={row.id}>
                  <th scope="row">
                    {row.title}
                    {row.isCurrent ? ` (${t('steps.money.current')})` : ''}
                  </th>
                  {row.status === 'ready' ? (
                    <>
                      <td>{`${fmt(row.low!)} ${currency}`}</td>
                      <td>{`${fmt(row.mean!)} ${currency}`}</td>
                      <td>{`${fmt(row.high!)} ${currency}`}</td>
                      <td>{paid === null ? t('steps.money.col.none') : `${fmt(paid)} ${currency}`}</td>
                    </>
                  ) : (
                    <td colSpan={4}>
                      <Reason row={row} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
