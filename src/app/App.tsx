import { useEffect, useRef, useState, type ComponentType } from 'react';
import { MapStep } from '../map/MapStep';
import { RotationsStep } from '../steps/cards/RotationsStep';
import { CropsStep } from '../steps/crops/CropsStep';
import { GlossaryPage } from '../steps/glossary/GlossaryPage';
import { GoalStep } from '../steps/goal/GoalStep';
import { MoneyStep } from '../steps/money/MoneyStep';
import { PrioritiesStep } from '../steps/priorities/PrioritiesStep';
import { PROJECT_NAME } from './brand';
import { IntroPage } from './IntroPage';
import { LANGS, setLang, t, useLang } from './i18n';
import { StateBoundary } from '../ui-kit';
import { STEP_COUNT, STEP_KEYS, canContinue, useAppStore, type StepKey } from './store';
import { useOnline } from './useOnline';

// One component per step (SPEC section 12); the order lives in STEP_KEYS. Step 0 is the start page.
const STEP_COMPONENTS: Record<StepKey, ComponentType> = {
  field: MapStep,
  goal: GoalStep,
  crops: CropsStep,
  priorities: PrioritiesStep,
  rotations: RotationsStep,
  money: MoneyStep,
};

export function App() {
  const state = useAppStore();
  const key: StepKey | undefined = STEP_KEYS[state.step - 1];
  const Step = key ? STEP_COMPONENTS[key] : null;
  const online = useOnline();
  // Subscribing here re-renders the whole tree when the language changes; t() reads the language itself.
  const lang = useLang((s) => s.lang);
  // The glossary covers the step instead of being a step, so the farmer comes back to where they were.
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const glossaryButton = useRef<HTMLButtonElement>(null);

  function closeGlossary() {
    setGlossaryOpen(false);
    glossaryButton.current?.focus();
  }

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
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">

          {/* The start page shows the name as its own heading. */}
          {Step ? <p className="text-sm font-medium text-slate-600">{PROJECT_NAME}</p> : null}
          <div className="ml-auto flex items-center gap-2">
            <button
              ref={glossaryButton}
              type="button"
              aria-expanded={glossaryOpen}
              className="-my-2 min-h-11 rounded px-3 text-base font-medium text-emerald-800 underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              onClick={() => (glossaryOpen ? closeGlossary() : setGlossaryOpen(true))}
            >
              {t('app.glossary')}
            </button>
            <div role="group" aria-label={t('app.language')} className="-my-2 flex rounded border border-slate-300">
              {LANGS.map((code) => (
                <button
                  key={code}
                  type="button"
                  lang={code}
                  aria-pressed={lang === code}
                  className={`min-h-11 min-w-11 px-2 text-sm font-medium first:rounded-l last:rounded-r focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                    lang === code ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700'
                  }`}
                  onClick={() => setLang(code)}
                >
                  {t(`app.lang.${code}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
        {key ? (
          <>
            <ol className="mt-2 flex gap-1" aria-label={t('app.progress')}>
              {STEP_KEYS.map((k, i) => (
                <li
                  key={k}
                  aria-current={i + 1 === state.step ? 'step' : undefined}
                  className={`h-2 flex-1 rounded ${i + 1 <= state.step ? 'bg-emerald-600' : 'bg-slate-200'}`}
                >
                  <span className="sr-only">{t(`app.step.${k}`)}</span>
                </li>
              ))}
            </ol>
            <h1 className="mt-3 text-xl font-semibold">
              {t('app.stepOf', { n: state.step, total: STEP_COUNT })}: {t(`app.step.${key}`)}
            </h1>
          </>
        ) : null}
      </header>

      <main className="flex-1 px-4 py-4">
        {glossaryOpen ? <GlossaryPage onBack={closeGlossary} backToStep={state.step} /> : null}
        {/* Hidden, not unmounted, while the glossary is open, so the step keeps its local state (the map view). */}
        <div hidden={glossaryOpen}>
          {/* The analysis needs NASA POWER, so step 5 waits for a connection instead of starting a request that will fail. */}
          {!Step ? (
            <IntroPage onStart={() => state.goToStep(1)} />
          ) : key === 'rotations' && !online && state.analysis.status !== 'ready' ? (
            <StateBoundary state="offline">{null}</StateBoundary>
          ) : (
            <Step />
          )}
        </div>
      </main>

      {glossaryOpen || !Step ? null : (
        <footer className="flex justify-between gap-3 border-t border-slate-200 px-4 py-3 print:hidden">
          <button
            type="button"
            className="min-h-11 rounded border border-slate-300 px-4 disabled:opacity-40"
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
