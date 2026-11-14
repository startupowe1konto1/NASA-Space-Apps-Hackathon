import type { ComponentType } from 'react';
import { MapStep } from '../map/MapStep';
import { RotationsStep } from '../steps/cards/RotationsStep';
import { CropsStep } from '../steps/crops/CropsStep';
import { GoalStep } from '../steps/goal/GoalStep';
import { MoneyStep } from '../steps/money/MoneyStep';
import { PrioritiesStep } from '../steps/priorities/PrioritiesStep';
import { ReportStep } from '../steps/report/ReportStep';
import { PROJECT_NAME } from './brand';
import { t } from './i18n';
import { STEP_COUNT, canContinue, useAppStore } from './store';

// One component per step (SPEC section 12). O2 replaces the placeholders file by file; the paths stay.
const steps: { key: string; component: ComponentType }[] = [
  { key: 'goal', component: GoalStep },
  { key: 'field', component: MapStep },
  { key: 'crops', component: CropsStep },
  { key: 'priorities', component: PrioritiesStep },
  { key: 'rotations', component: RotationsStep },
  { key: 'money', component: MoneyStep },
  { key: 'report', component: ReportStep },
];

export function App() {
  const state = useAppStore();
  const current = steps[state.step - 1] ?? steps[0]!;
  const Step = current.component;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-medium text-slate-600">{PROJECT_NAME}</p>
        <ol className="mt-2 flex gap-1" aria-label={t('app.progress')}>
          {steps.map((s, i) => (
            <li
              key={s.key}
              aria-current={i + 1 === state.step ? 'step' : undefined}
              className={`h-2 flex-1 rounded ${i + 1 <= state.step ? 'bg-emerald-600' : 'bg-slate-200'}`}
            >
              <span className="sr-only">{t(`app.step.${s.key}`)}</span>
            </li>
          ))}
        </ol>
        <h1 className="mt-3 text-xl font-semibold">
          {t('app.stepOf', { n: state.step, total: STEP_COUNT })}: {t(`app.step.${current.key}`)}
        </h1>
      </header>

      <main className="flex-1 px-4 py-4">
        <Step />
      </main>

      <footer className="flex justify-between gap-3 border-t border-slate-200 px-4 py-3">
        <button
          type="button"
          className="min-h-11 rounded border border-slate-300 px-4 disabled:opacity-40"
          disabled={state.step === 1}
          onClick={() => state.goToStep(state.step - 1)}
        >
          {t('app.back')}
        </button>
        <button
          type="button"
          className="min-h-11 rounded bg-emerald-700 px-4 font-medium text-white disabled:opacity-40"
          disabled={!canContinue(state)}
          onClick={() => state.goToStep(state.step + 1)}
        >
          {t('app.next')}
        </button>
      </footer>
    </div>
  );
}
