// Step 0: the start page (HANDOFF-frontend.md v2.1). The app name, what the tool does in two sentences, and Start.
import { PROJECT_NAME } from './brand';
import { t } from './i18n';

export function IntroPage(props: { onStart: () => void }) {
  return (
    <section className="grid gap-6 py-6 sm:py-10">
      <h1 className="text-3xl font-semibold leading-tight text-slate-900">{PROJECT_NAME}</h1>
      <p className="max-w-prose text-lg leading-relaxed text-slate-700">{t('app.intro.text')}</p>
      <button
        type="button"
        onClick={props.onStart}
        className="min-h-12 w-full rounded-lg bg-emerald-700 px-8 text-lg font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/40 sm:w-fit"
      >
        {t('app.intro.start')}
      </button>
    </section>
  );
}
