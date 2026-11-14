// Step 5: the field summary, a goal switcher, the current rotation plus the three best others, and the sources.
import { useEffect } from 'react';
import { t } from '../../app/i18n';
import { useAppStore } from '../../app/store';
import { StateBoundary } from '../../ui-kit';
import { CalendarStrip } from '../calendar/CalendarStrip';
import { FieldSummary } from './FieldSummary';
import { GoalSwitcher } from './GoalSwitcher';
import { RotationCard } from './RotationCard';
import { SourcesPanel } from './SourcesPanel';

export function RotationsStep() {
  const analysis = useAppStore((s) => s.analysis);
  const goal = useAppStore((s) => s.goal);
  const setGoal = useAppStore((s) => s.setGoal);
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
  const ranking = data.shownByGoal[goal] ? goal : 'keepSoil';
  const ids = data.shownByGoal[ranking] ?? [];
  const rotations = ids.flatMap((id) => data.rotations.filter((r) => r.id === id));
  // "Option n" counts only the other rotations, so the labels read 1, 2, 3 whatever place the current one takes.
  const others = rotations.filter((r) => !r.isCurrent).map((r) => r.id);

  return (
    <div className="grid gap-5">
      <FieldSummary analysis={data} />

      {data.rotations.length === 0 ? (
        <StateBoundary state="no-data" reason={t('steps.rotations.noCrops')}>
          {null}
        </StateBoundary>
      ) : (
        <>
          <div className="grid gap-2">
            <p className="text-base text-slate-700">{t('steps.rotations.intro')}</p>
            <GoalSwitcher goal={goal} onChange={setGoal} />
            {ranking !== goal ? (
              <p role="status" className="rounded-md bg-amber-50 px-3 py-2 text-base text-amber-900">
                {t('steps.rotations.goalNoData')}
              </p>
            ) : null}
          </div>
          {rotations.map((r) => (
            <RotationCard
              key={r.id}
              rotation={r}
              goal={ranking}
              rank={others.indexOf(r.id) + 1}
              datasets={data.datasets}
              calendar={<CalendarStrip months={r.calendar} datasets={data.datasets} />}
            />
          ))}
        </>
      )}

      <SourcesPanel datasets={data.datasets} />
    </div>
  );
}
