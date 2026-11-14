// Step 0: the start page (HANDOFF-frontend.md v2.1). The app name as the title, what the tool does in one sentence,
// a Start button, and a drawing of a field being outlined. The drawing carries no numbers: there is no analysis yet.
import { PROJECT_NAME } from './brand';
import { t } from './i18n';

const FACTS = ['app.intro.fact.climate', 'app.intro.fact.slope', 'app.intro.fact.soil'] as const;

function FieldDrawing() {
  const lines = Array.from({ length: 21 }, (_, i) => i * 24);
  return (
    <svg viewBox="0 0 480 400" aria-hidden="true" className="h-full w-full">
      {lines.map((x) => (
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={400} className="stroke-slate-200" strokeWidth={1} />
      ))}
      {lines.map((y) => (
        <line key={`h${y}`} x1={0} y1={y} x2={480} y2={y} className="stroke-slate-200" strokeWidth={1} />
      ))}
      {[
        [36, 150, 118, 120],
        [312, 36, 132, 92],
        [318, 296, 136, 84],
        [20, 296, 120, 92],
      ].map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx={2} fill="none" className="stroke-slate-300" strokeDasharray="4 5" />
      ))}
      <polygon
        points="176,132 392,146 382,268 166,254"
        className="intro-field fill-emerald-500/15 stroke-emerald-700"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <circle cx="279" cy="200" r="5" className="fill-emerald-700" />
      <circle cx="279" cy="200" r="14" className="intro-pulse fill-none stroke-emerald-600" strokeWidth={2} />
    </svg>
  );
}

export function IntroPage(props: { onStart: () => void }) {
  return (
    <section className="grid items-center gap-10 py-6 lg:min-h-[calc(100dvh-10rem)] lg:grid-cols-[1fr_1.05fr] lg:gap-14">
      <div className="flex flex-col gap-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">{t('app.intro.eyebrow')}</p>
        <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">{PROJECT_NAME}</h1>
        <p className="max-w-xl text-lg leading-relaxed text-slate-700 sm:text-xl">{t('app.intro.text')}</p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={props.onStart}
            className="min-h-14 rounded-2xl bg-emerald-700 px-10 text-lg font-semibold text-white shadow-md transition duration-200 ease-out hover:bg-emerald-800 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/40 motion-reduce:transition-none"
          >
            {t('app.intro.start')}
          </button>
          <span className="text-sm text-slate-600">{t('app.intro.time')}</span>
        </div>
        <ul className="mt-2 grid gap-3 border-t border-slate-200 pt-6 sm:grid-cols-3">
          {FACTS.map((k) => (
            <li key={k} className="text-sm leading-snug text-slate-700">
              {t(k)}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative aspect-[6/5] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <FieldDrawing />
      </div>
    </section>
  );
}
