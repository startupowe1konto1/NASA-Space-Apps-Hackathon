// Placeholder from the skeleton (O1-S1). O2 replaces it in task O2-B1; keep the file path and the export name.
import { t } from '../../app/i18n';
import { useAppStore } from '../../app/store';
import type { GoalId } from '../../contracts';

const goals: GoalId[] = ['keepSoil', 'improveSoil', 'income'];

export function GoalStep() {
  const goal = useAppStore((s) => s.goal);
  const setGoal = useAppStore((s) => s.setGoal);
  return (
    <div className="grid gap-3" role="radiogroup" aria-label={t('app.step.goal')}>
      {goals.map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={goal === id}
          onClick={() => setGoal(id)}
          className={`min-h-11 rounded border px-4 py-3 text-left ${goal === id ? 'border-emerald-700 bg-emerald-50' : 'border-slate-300'}`}
        >
          <span className="block font-medium">{t(`steps.goal.${id}`)}</span>
          <span className="block text-sm text-slate-600">{t(`steps.goal.${id}.hint`)}</span>
        </button>
      ))}
    </div>
  );
}
