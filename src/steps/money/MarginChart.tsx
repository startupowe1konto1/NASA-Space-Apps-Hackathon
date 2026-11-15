// Step 6 chart: the farmer's rotation first, as the reference, then each other option as the difference from it in an
// average year. A bar grows right when the option earns more and left when it earns less, from a centre line that is
// the farmer's rotation. A rotation without money keeps its row with the reason, never a zero.
// Plain HTML and CSS percentages, like src/ui-kit/ScoreBar.tsx, so no chart library.
import { useId } from 'react';
import { t } from '../../app/i18n';
import type { Dataset, Sourced } from '../../contracts';
import { SourcedNumber } from '../../ui-kit';
import { compareRows, type MoneyRow } from './moneyRows';

const fmt = (n: number) => {
  const text = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  return text === '-0' ? '0' : text;
};

/** The average year as a value of its own: the bad and good year are in the disclosure below the chart. */
const average = (row: MoneyRow): Sourced => ({ ...row.margin!, range: undefined });

/** The difference from the reference as a derived value with the sources of both margins. Shown without its sign. */
function difference(row: MoneyRow, current: MoneyRow, diff: number): Sourced {
  return {
    value: Math.abs(diff),
    unit: current.margin!.unit,
    datasetIds: [...new Set([...row.margin!.datasetIds, ...current.margin!.datasetIds])],
    kind: 'derived',
    retrievedAt: row.margin!.retrievedAt,
  };
}

const direction = (diff: number) =>
  Math.round(diff) > 0 ? t('steps.money.more') : Math.round(diff) < 0 ? t('steps.money.less') : t('steps.money.same');

function confirmedPayments(row: MoneyRow): number | null {
  const amounts = (row.money?.payments ?? [])
    .filter((p) => p.confirmed && p.amountPerHa.value !== null)
    .map((p) => p.amountPerHa.value!);
  return amounts.length ? amounts.reduce((a, b) => a + b, 0) : null;
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

function CurrentBadge() {
  return (
    <span className="inline-block w-fit rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
      {t('steps.money.current')}
    </span>
  );
}

/** The farmer's rotation: its own average-year margin, large, as the line every option is read against. */
function Reference({ row, datasets }: { row: MoneyRow; datasets: Dataset[] }) {
  return (
    <div
      role="group"
      aria-label={`${t('steps.money.reference')}: ${row.title}`}
      className="grid gap-2 rounded-xl border border-slate-300 bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6"
    >
      <div className="grid gap-1">
        <CurrentBadge />
        <span className="text-lg font-semibold leading-snug text-slate-900">{row.title}</span>
      </div>
      {row.status === 'ready' ? (
        <div className="grid gap-0.5 sm:justify-items-end">
          <span className="text-2xl">
            <SourcedNumber value={average(row)} datasets={datasets} decimals={0} />
          </span>
          <span className="text-sm text-slate-600">{t('steps.money.average')}</span>
        </div>
      ) : (
        <Reason row={row} />
      )}
    </div>
  );
}

function DiffBar({ diff, pct, label }: { diff: number; pct: (d: number) => number; label: string }) {
  const end = pct(diff);
  const left = Math.min(50, end);
  const width = Math.abs(end - 50);
  const more = diff >= 0;
  return (
    <div role="img" aria-label={label} className="relative h-8">
      <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
      <div
        data-part="bar"
        className={`absolute top-1/2 h-5 -translate-y-1/2 ${
          more ? 'rounded-r-md bg-emerald-600' : 'rounded-l-md bg-red-600'
        }`}
        style={{ left: `${left}%`, width: `${width}%` }}
      />
      <div
        data-part="reference"
        aria-hidden="true"
        className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-slate-800"
      />
    </div>
  );
}

export function MarginChart({ rows, datasets }: { rows: MoneyRow[]; datasets: Dataset[] }) {
  const titleId = useId();
  const { current, options, pct } = compareRows(rows);
  const reference = current?.status === 'ready' ? current : undefined;
  const currency = rows.find((r) => r.money)?.money?.currency ?? '';

  return (
    <figure aria-labelledby={titleId} className="grid gap-4">
      <figcaption id={titleId} className="sr-only">
        {t('steps.money.chart')}
      </figcaption>

      {current ? <Reference row={current} datasets={datasets} /> : null}

      <div className="grid gap-1">
        <h3 className="text-sm font-semibold text-slate-900">{t('steps.money.options')}</h3>
        {reference ? null : <p className="text-sm text-slate-700">{t('steps.money.noReference')}</p>}

        {reference && options.some((o) => o.diff !== undefined) ? (
          <div
            aria-hidden="true"
            className="grid grid-cols-2 pt-1 text-xs font-medium uppercase tracking-wide text-slate-600 md:ml-[calc(22rem+1.5rem)]"
          >
            <span className="pr-2 text-right">← {t('steps.money.axisLess')}</span>
            <span className="pl-2">{t('steps.money.axisMore')} →</span>
          </div>
        ) : null}

        <div className="grid">
          {options.map((row) => (
            <div
              key={row.id}
              role="group"
              aria-label={row.title}
              className="grid gap-x-6 gap-y-1.5 border-b border-slate-200 py-3 last:border-b-0 md:grid-cols-[22rem_minmax(0,1fr)] md:items-center"
            >
              <div className="grid gap-0.5">
                <span className="text-base font-medium leading-snug text-slate-900">{row.title}</span>
                {row.status === 'ready' && row.diff === undefined ? (
                  <span className="text-sm text-slate-700">
                    <SourcedNumber value={average(row)} datasets={datasets} decimals={0} />
                  </span>
                ) : null}
              </div>

              {row.diff !== undefined && reference ? (
                <div className="grid gap-1">
                  <DiffBar
                    diff={row.diff}
                    pct={pct}
                    label={t('steps.money.barLabel', {
                      name: row.title,
                      diff: fmt(Math.abs(row.diff)),
                      unit: currency,
                      direction: direction(row.diff),
                    })}
                  />
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-800">
                    <span
                      className={`text-base font-semibold ${row.diff >= 0 ? 'text-emerald-800' : 'text-red-800'}`}
                      aria-hidden="true"
                    >
                      {Math.round(row.diff) > 0 ? '+' : Math.round(row.diff) < 0 ? '−' : ''}
                    </span>
                    <SourcedNumber value={difference(row, reference, row.diff)} datasets={datasets} decimals={0} />
                    <span>{direction(row.diff)}</span>
                  </div>
                </div>
              ) : row.status === 'ready' ? null : (
                <div className="grid gap-1">
                  <div aria-hidden="true" className="h-5 rounded-md border border-dashed border-slate-300" />
                  <Reason row={row} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* A table ignores width limits, so the wrapper, not the table, is the visually hidden box. */}
      <div className="sr-only">
        <table>
          <caption>{t('steps.money.table')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('steps.money.col.rotation')}</th>
              <th scope="col">{t('steps.rotations.income.average')}</th>
              <th scope="col">{t('steps.money.col.diff')}</th>
              <th scope="col">{t('steps.rotations.income.bad')}</th>
              <th scope="col">{t('steps.rotations.income.good')}</th>
              <th scope="col">{t('steps.money.col.payments')}</th>
            </tr>
          </thead>
          <tbody>
            {[...(current ? [current] : []), ...options].map((row) => {
              const paid = confirmedPayments(row);
              const diff = 'diff' in row ? (row as { diff?: number }).diff : undefined;
              return (
                <tr key={row.id}>
                  <th scope="row">
                    {row.title}
                    {row.isCurrent ? ` (${t('steps.money.current')})` : ''}
                  </th>
                  {row.status === 'ready' ? (
                    <>
                      <td>{`${fmt(row.mean!)} ${currency}`}</td>
                      <td>{diff === undefined ? '' : `${diff >= 0 ? '+' : '−'}${fmt(Math.abs(diff))} ${currency}`}</td>
                      <td>{`${fmt(row.low!)} ${currency}`}</td>
                      <td>{`${fmt(row.high!)} ${currency}`}</td>
                      <td>{paid === null ? t('steps.money.col.none') : `${fmt(paid)} ${currency}`}</td>
                    </>
                  ) : (
                    <td colSpan={5}>
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
