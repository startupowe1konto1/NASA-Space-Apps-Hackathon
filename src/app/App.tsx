import { useEffect, useRef, useState, type ComponentType } from 'react';
import { MapStep } from '../map/MapStep';
import { RotationsStep } from '../steps/cards/RotationsStep';
import { CropsStep } from '../steps/crops/CropsStep';
import { GlossaryPage } from '../steps/glossary/GlossaryPage';
import { GoalStep } from '../steps/goal/GoalStep';
import { MoneyStep } from '../steps/money/MoneyStep';
import { PrioritiesStep } from '../steps/priorities/PrioritiesStep';
import { ReportStep } from '../steps/report/ReportStep';
import { restoreFromHash } from '../steps/report/shareLink';
import { PROJECT_NAME } from './brand';
import { t } from './i18n';
import { StateBoundary } from '../ui-kit';
import { STEP_COUNT, canContinue, useAppStore } from './store';
import { useOnline } from './useOnline';

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
  const online = useOnline();
  // The glossary covers the step instead of being a step, so the farmer comes back to where they were.
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const glossaryButton = useRef<HTMLButtonElement>(null);

  function closeGlossary() {
    setGlossaryOpen(false);
    glossaryButton.current?.focus();
  }

  // A shared report link (#s=...) restores the farmer's input and opens the report (O2-B7).
  useEffect(() => {
    restoreFromHash(window.location.hash, useAppStore.getState());
  }, []);

  useEffect(() => {
    if (!glossaryOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeGlossary();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [glossaryOpen]);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 px-4 py-3 print:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-600">{PROJECT_NAME}</p>
          <button
            ref={glossaryButton}
            type="button"
            aria-expanded={glossaryOpen}
            className="-my-2 min-h-11 rounded px-3 text-base font-medium text-emerald-800 underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            onClick={() => (glossaryOpen ? closeGlossary() : setGlossaryOpen(true))}
          >
            {t('app.glossary')}
          </button>
        </div>
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
        {glossaryOpen ? <GlossaryPage onBack={closeGlossary} backToStep={state.step} /> : null}
        {/* Hidden, not unmounted, while the glossary is open, so the step keeps its local state (the map view). */}
        <div hidden={glossaryOpen}>
          {/* The analysis needs NASA POWER, so step 5 waits for a connection instead of starting a request that will fail. */}
          {current.key === 'rotations' && !online && state.analysis.status !== 'ready' ? (
            <StateBoundary state="offline">{null}</StateBoundary>
          ) : (
            <Step />
          )}
        </div>
      </main>

      {glossaryOpen ? null : (
        <footer className="flex justify-between gap-3 border-t border-slate-200 px-4 py-3 print:hidden">
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
      )}
    </div>
  );
}
