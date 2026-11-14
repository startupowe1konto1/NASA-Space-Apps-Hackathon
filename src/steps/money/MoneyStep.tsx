// Step 6: what each rotation from step 5 would have earned on this field (SPEC section 12, plan
// docs/superpowers/plans/2026-11-14-step-6-money.md). Same rotations and order as the cards; a bar per rotation on one
// axis, then a disclosure per rotation with the bad, average and good year, the payments and the campaign dates.
// Income is a replay of past years at today's prices, never a forecast.
import { Fragment, useEffect, type ReactNode } from 'react';
import { t } from '../../app/i18n';
import { useAppStore } from '../../app/store';
import { useOnline } from '../../app/useOnline';
import type { Dataset, Sourced } from '../../contracts';
import { SourcedNumber, StateBoundary } from '../../ui-kit';
import { Margins, Payments } from '../cards/IncomeSection';
import { TermText } from '../cards/TermText';
import { MarginChart } from './MarginChart';
import { moneyRows, moneyScale, type MoneyRow } from './moneyRows';

/** A message template with React elements in place of its {placeholders}, as TermText does for glossary terms. */
function Template({ code, parts }: { code: string; parts: Record<string, ReactNode> }) {
  const pieces = t(code).split(/\{(\w+)\}/);
  return (
    <>
      {pieces.map((piece, i) => (
        <Fragment key={i}>{i % 2 === 0 ? piece : (parts[piece] ?? `{${piece}}`)}</Fragment>
      ))}
    </>
  );
}

/** The best option against the current rotation, in an average year. Unconfirmed payments are never part of it. */
function Headline({ rows, datasets }: { rows: MoneyRow[]; datasets: Dataset[] }) {
  const current = rows.find((r) => r.isCurrent && r.status === 'ready');
  const options = rows.filter((r) => !r.isCurrent && r.status === 'ready');
  if (!current || options.length === 0) return null;
  const best = options.reduce((a, b) => (b.mean! > a.mean! ? b : a));
  if (best.mean! <= current.mean!) {
    return <p className="text-lg leading-snug text-slate-900">{t('steps.money.headlineNone')}</p>;
  }
  const diff: Sourced = {
    value: best.mean! - current.mean!,
    unit: current.margin!.unit,
    datasetIds: [...new Set([...best.margin!.datasetIds, ...current.margin!.datasetIds])],
    kind: 'derived',
    retrievedAt: best.margin!.retrievedAt,
  };
  return (
    <p data-testid="money-headline" className="text-lg leading-snug text-slate-900">
      <Template
        code="steps.money.headline"
        parts={{
          name: <strong className="font-semibold">{best.title}</strong>,
          diff: <SourcedNumber value={diff} datasets={datasets} decimals={0} />,
        }}
      />
    </p>
  );
}

function Details({ row, datasets }: { row: MoneyRow; datasets: Dataset[] }) {
  return (
    <details data-testid="money-details" className="group rounded-lg border border-slate-200 bg-white">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
        <span className="grid">
          <span className="text-base font-medium text-slate-900">
            {row.title}
            {row.isCurrent ? <span className="text-slate-700"> · {t('steps.money.current')}</span> : null}
          </span>
          <span className="text-sm text-slate-700">{t('steps.money.details')}</span>
        </span>
        <span aria-hidden="true" className="text-slate-700 transition-transform duration-150 group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="grid gap-3 border-t border-slate-200 px-3 py-3">
        {row.status === 'ready' && row.money ? (
          <>
            <Margins m={row.money.marginPerHa} datasets={datasets} />
            <Payments money={row.money} datasets={datasets} />
          </>
        ) : (
          <StateBoundary
            state={row.status === 'error' ? 'error' : 'no-data'}
            source={row.source}
            reason={
              row.status === 'not-loaded'
                ? t('steps.rotations.income.notLoaded')
                : row.reason
                  ? t(row.reason)
                  : undefined
            }
          >
            {null}
          </StateBoundary>
        )}
      </div>
    </details>
  );
}

export function MoneyStep() {
  const analysis = useAppStore((s) => s.analysis);
  const goal = useAppStore((s) => s.goal);
  const runAnalysis = useAppStore((s) => s.runAnalysis);
  const online = useOnline();

  // The analysis needs NASA POWER, so it waits for a connection instead of starting a request that will fail.
  useEffect(() => {
    if (analysis.status === 'idle' && online) void runAnalysis();
  }, [analysis.status, online, runAnalysis]);

  if (analysis.status !== 'ready') {
    if (!online) return <StateBoundary state="offline">{null}</StateBoundary>;
    return (
      <StateBoundary
        state={analysis.status === 'error' ? 'error' : 'loading'}
        source={analysis.status === 'error' ? analysis.source : t('steps.rotations.analysis')}
        reason={analysis.status === 'error' ? analysis.reason : undefined}
        onRetry={() => void runAnalysis()}
      >
        {null}
      </StateBoundary>
    );
  }

  const { data } = analysis;
  if (data.rotations.length === 0) {
    return (
      <StateBoundary state="no-data" reason={t('steps.rotations.noCrops')}>
        {null}
      </StateBoundary>
    );
  }

  const rows = moneyRows(data, goal);
  const scale = moneyScale(rows);
  const anyReady = rows.some((r) => r.status === 'ready');

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="text-2xl text-slate-900">{t('steps.money.title')}</h2>
        <p data-testid="money-intro" className="text-base leading-relaxed text-slate-700">
          <TermText code="steps.money.intro" terms={{ margin: 'margin' }} />
        </p>
      </div>

      {anyReady ? (
        <Headline rows={rows} datasets={data.datasets} />
      ) : (
        <p role="status" className="rounded-md bg-amber-50 px-3 py-2 text-base text-amber-900">
          {t('steps.money.noneReady')}
        </p>
      )}

      <MarginChart rows={rows} scale={scale} datasets={data.datasets} />

      <div className="grid gap-2">
        {rows.map((row) => (
          <Details key={row.id} row={row} datasets={data.datasets} />
        ))}
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium text-slate-800">{t('steps.rotations.income.notForecast')}</p>
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-base leading-snug text-slate-800">{t('app.support')}</p>
      </div>
    </div>
  );
}
