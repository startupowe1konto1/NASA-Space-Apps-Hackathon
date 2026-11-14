// Placeholder from the skeleton (O1-S1). O2 replaces it with the real cards in task O2-B3; keep the path and the export name.
// It already shows the contract in use: goal-based order, gaps, risks, source chips and the support sentence.
import { useEffect } from 'react';
import { datasets } from '../../app/datasets';
import { t } from '../../app/i18n';
import { useAppStore } from '../../app/store';
import { ScoreBar, StateBoundary } from '../../ui-kit';

export function RotationsStep() {
  const analysis = useAppStore((s) => s.analysis);
  const goal = useAppStore((s) => s.goal);
  const runAnalysis = useAppStore((s) => s.runAnalysis);

  useEffect(() => {
    if (analysis.status === 'idle') void runAnalysis();
  }, [analysis.status, runAnalysis]);

  if (analysis.status !== 'ready') {
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
  const shown = data.shownByGoal[goal] ?? data.shownByGoal.keepSoil ?? [];
  const rotations = shown.flatMap((id) => data.rotations.filter((r) => r.id === id));

  return (
    <div className="grid gap-4">
      {data.shownByGoal[goal] === undefined ? <p role="status">{t('steps.rotations.goalNoData')}</p> : null}
      {rotations.map((r) => (
        <article key={r.id} className="rounded border border-slate-300 p-4">
          <h2 className="text-lg font-semibold">
            {r.years.map((y) => (y.coverCrop ? `${y.crop} + ${y.coverCrop}` : y.crop)).join(' → ')}
          </h2>
          {r.isCurrent ? <p className="text-sm font-medium text-emerald-800">{t('steps.rotations.current')}</p> : null}
          <ScoreBar label={t('steps.rotations.soilHealth')} score={r.soilHealth} basisText={t(r.soilHealth.basis)} />
          <ScoreBar
            label={t('steps.rotations.climate')}
            score={r.climateResilience}
            basisText={t(r.climateResilience.basis)}
          />
          <h3 className="mt-3 font-medium">{t('steps.rotations.gaps')}</h3>
          <ul className="list-disc pl-5">
            {r.gaps.map((m) => (
              <li key={m.code}>{t(m)}</li>
            ))}
          </ul>
          <h3 className="mt-3 font-medium">{t('steps.rotations.risks')}</h3>
          <ul className="list-disc pl-5">
            {r.localReviewRisks.map((m) => (
              <li key={m.code}>{t(m)}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-slate-700">{t('app.support')}</p>
        </article>
      ))}
      <p className="text-sm text-slate-600">{t('steps.rotations.sources', { n: datasets.length })}</p>
    </div>
  );
}
