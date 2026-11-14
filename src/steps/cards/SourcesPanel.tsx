// Every dataset the analysis used, NASA first, with native resolution, period and what kind of value it gives.
import { t } from '../../app/i18n';
import type { Dataset } from '../../contracts';

export function SourcesPanel({ datasets }: { datasets: Dataset[] }) {
  const sorted = [...datasets].sort((a, b) => Number(b.nasa) - Number(a.nasa) || a.name.localeCompare(b.name));
  return (
    <section aria-labelledby="sources-title" className="grid gap-2 rounded-2xl border-2 border-slate-200 bg-white p-4">
      <h2 id="sources-title" className="text-lg font-semibold text-slate-900">
        {t('sources.title')}
      </h2>
      <p className="text-base text-slate-700">{t('sources.intro')}</p>
      <ul className="grid gap-2">
        {sorted.map((d) => (
          <li key={d.id} data-nasa={d.nasa} className="grid gap-0.5 border-b border-slate-200 pb-2 last:border-0">
            <span className="flex flex-wrap items-center gap-2">
              {d.nasa ? (
                <span className="rounded bg-slate-900 px-1.5 py-0.5 text-xs font-bold tracking-wide text-white">
                  {t('sources.nasa')}
                </span>
              ) : null}
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="text-base font-medium text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
              >
                {d.name}
              </a>
            </span>
            <span className="text-sm text-slate-700">
              {d.provider} · {t('sources.resolution', { value: d.resolution })} · {d.period} · {t(`ui.kind.${d.kind}`)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
