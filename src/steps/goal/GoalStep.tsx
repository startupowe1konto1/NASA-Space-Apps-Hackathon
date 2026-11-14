// Step 1: the farmer's main goal (SPEC section 12, D9). The goal only reorders the rotations; soil health is always shown first.
import type { ComponentType } from 'react';
import { t } from '../../app/i18n';
import { moneyAvailable } from '../../app/providers';
import { useAppStore } from '../../app/store';
import type { GoalId } from '../../contracts';
import { IconImproveSoil, IconIncome, IconKeepSoil } from '../icons';

const goals: { id: GoalId; Icon: ComponentType<{ size?: number }> }[] = [
  { id: 'keepSoil', Icon: IconKeepSoil },
  { id: 'improveSoil', Icon: IconImproveSoil },
  { id: 'income', Icon: IconIncome },
];

export function GoalStep() {
  const goal = useAppStore((s) => s.goal);
  const setGoal = useAppStore((s) => s.setGoal);

  return (
    <section className="grid gap-4">
      {/* The step title in the header already asks the question; the group repeats it for screen readers. */}
      <div role="radiogroup" aria-label={t('steps.goal.question')} className="grid gap-3">
        {goals.map(({ id, Icon }) => {
          const chosen = goal === id;
          const noteId = id === 'income' && !moneyAvailable ? 'goal-income-note' : undefined;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={chosen}
              aria-describedby={noteId}
              onClick={() => setGoal(id)}
              className={`flex min-h-[72px] w-full cursor-pointer items-start gap-4 rounded-xl border-2 px-4 py-4 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/40 ${
                chosen ? 'border-emerald-700 bg-emerald-50' : 'border-slate-300 bg-white hover:border-slate-500'
              }`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                  chosen ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800'
                }`}
              >
                <Icon size={28} />
              </span>
              <span className="grid gap-1">
                <span className="text-lg font-semibold text-slate-900">{t(`steps.goal.${id}`)}</span>
                <span className="text-base leading-snug text-slate-700">{t(`steps.goal.${id}.hint`)}</span>
                {noteId ? (
                  <span id={noteId} className="mt-1 rounded-md bg-amber-50 px-2 py-1 text-sm text-amber-900">
                    {t('steps.goal.income.noMoney')}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-base text-slate-700">{t('steps.goal.changeLater')}</p>
    </section>
  );
}
