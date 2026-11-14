// Reorders the cards by goal. The analysis already holds the order for every goal, so no new request is made.
import { t } from '../../app/i18n';
import type { GoalId } from '../../contracts';

const goals: GoalId[] = ['keepSoil', 'improveSoil', 'income'];

export function GoalSwitcher(props: { goal: GoalId; onChange: (goal: GoalId) => void }) {
  const { goal, onChange } = props;
  return (
    <div role="radiogroup" aria-label={t('steps.rotations.goalSwitch')} className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
      {goals.map((id) => {
        const on = id === goal;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(id)}
            className={`min-h-12 cursor-pointer rounded-lg px-2 text-sm font-semibold leading-tight transition-colors duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/40 ${
              on ? 'bg-white text-emerald-900 shadow ring-2 ring-emerald-700' : 'text-slate-700 hover:bg-white/60'
            }`}
          >
            {t(`steps.goal.${id}`)}
          </button>
        );
      })}
    </div>
  );
}
