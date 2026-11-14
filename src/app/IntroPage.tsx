// Step 0: the start page (HANDOFF-frontend.md v2.1). The app name as the title, what the tool does in one sentence,
// and a large Start button at the bottom of the screen.
import { PROJECT_NAME } from './brand';
import { t } from './i18n';

export function IntroPage(props: { onStart: () => void }) {
  return (
    <section className="flex min-h-[calc(100dvh-7rem)] flex-col items-center text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-2">
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">{PROJECT_NAME}</h1>
        <p className="max-w-2xl text-xl leading-relaxed text-slate-700 sm:text-2xl">{t('app.intro.text')}</p>
      </div>
      <button
        type="button"
        onClick={props.onStart}
        className="mb-6 min-h-14 w-full max-w-md rounded-2xl bg-emerald-700 px-8 text-xl font-semibold text-white shadow-md transition duration-200 ease-out hover:bg-emerald-800 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/40 motion-reduce:transition-none"
      >
        {t('app.intro.start')}
      </button>
    </section>
  );
}
