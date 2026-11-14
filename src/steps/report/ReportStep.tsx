// Step 7: one page the farmer can print or send to their advisor. The support sentence comes first (SPEC section 11),
// then what the farmer told us, the field's NASA record, the rotations for the chosen goal and every source.
import { useEffect, useState } from 'react';
import { t } from '../../app/i18n';
import { selectedField, useAppStore } from '../../app/store';
import { StateBoundary } from '../../ui-kit';
import { CalendarStrip } from '../calendar/CalendarStrip';
import { FieldSummary } from '../cards/FieldSummary';
import { RotationCard } from '../cards/RotationCard';
import { SourcesPanel } from '../cards/SourcesPanel';
import { cropName } from '../shared/cropName';
import { shareUrl } from './shareLink';

const BUTTON =
  'min-h-12 cursor-pointer rounded-xl border-2 border-emerald-700 px-4 text-base font-semibold text-emerald-900 hover:bg-emerald-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/40';

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 border-b border-slate-200 py-2 last:border-0 sm:grid-cols-[12rem_1fr] sm:gap-3">
      <dt className="text-sm font-medium text-slate-700">{label}</dt>
      <dd className="text-base text-slate-900">{children}</dd>
    </div>
  );
}

export function ReportStep() {
  const field = useAppStore(selectedField);
  const goal = useAppStore((s) => s.goal);
  const priorities = useAppStore((s) => s.priorities);
  // Select the stored array itself; a fresh [] inside the selector would re-render forever.
  const stored = useAppStore((s) => (field ? s.cropHistory[field.id] : undefined));
  const history = stored ?? [];
  const analysis = useAppStore((s) => s.analysis);
  const runAnalysis = useAppStore((s) => s.runAnalysis);
  const [copied, setCopied] = useState<'idle' | 'copied' | 'manual'>('idle');
  const [link, setLink] = useState('');

  useEffect(() => {
    if (field && analysis.status === 'idle') void runAnalysis();
  }, [field, analysis.status, runAnalysis]);

  if (!field) return <p className="text-base text-slate-700">{t('steps.report.noField')}</p>;

  const copyLink = async () => {
    const url = shareUrl(window.location.href, { goal, field, cropHistory: history, priorities });
    setLink(url);
    try {
      if (!navigator.clipboard) throw new Error('no clipboard');
      await navigator.clipboard.writeText(url);
      setCopied('copied');
    } catch {
      setCopied('manual');
    }
  };

  const ranking = analysis.status === 'ready' && analysis.data.shownByGoal[goal] ? goal : 'keepSoil';

  return (
    <section aria-labelledby="report-title" className="grid gap-5">
      <h2 id="report-title" className="text-2xl font-semibold text-slate-900">
        {t('steps.report.title')}
      </h2>

      <p className="rounded-xl border-2 border-slate-700 bg-slate-50 px-4 py-3 text-base font-medium leading-snug text-slate-900">
        {t('app.support')}
      </p>

      <dl className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-2">
        <Fact label={t('steps.report.field')}>
          {field.name} · {t('steps.report.area', { ha: field.areaHa.toFixed(1) })} ·{' '}
          {t('steps.report.location', { lat: field.centroid.lat.toFixed(4), lon: field.centroid.lon.toFixed(4) })}
          {field.parcelIds?.length ? ` · ${t('steps.report.parcels', { ids: field.parcelIds.join(', ') })}` : ''}
        </Fact>
        <Fact label={t('steps.report.goal')}>{t(`steps.goal.${goal}`)}</Fact>
        <Fact label={t('steps.report.crops')}>
          {history.length === 0
            ? t('steps.report.cropsNone')
            : [...history]
                .sort((a, b) => b.year - a.year)
                .map((y) => `${y.year}: ${cropName(y.crop)}${y.source === 'farmer' ? ` (${t('steps.report.byFarmer')})` : ''}`)
                .join(' · ')}
        </Fact>
        <Fact label={t('steps.report.priorities')}>
          {priorities.on.length === 0
            ? t('steps.report.prioritiesNone')
            : priorities.on.map((p) => t(`steps.priorities.${p}`)).join(' · ')}
        </Fact>
        {priorities.excludedCrops.length > 0 ? (
          <Fact label={t('steps.report.excluded')}>{priorities.excludedCrops.map(cropName).join(', ')}</Fact>
        ) : null}
      </dl>

      <div className="grid gap-2 print:hidden">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BUTTON} onClick={() => void copyLink()}>
            {t('steps.report.copy')}
          </button>
          <button type="button" className={BUTTON} onClick={() => window.print()}>
            {t('steps.report.print')}
          </button>
        </div>
        {copied === 'copied' ? (
          <p role="status" className="text-base font-medium text-emerald-800">
            {t('steps.report.copied')}
          </p>
        ) : null}
        {copied === 'manual' ? (
          <label className="grid gap-1 text-base text-slate-800">
            {t('steps.report.linkLabel')}
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="min-h-11 rounded-lg border-2 border-slate-400 px-3 text-sm"
            />
          </label>
        ) : null}
        <p className="text-sm text-slate-700">{t('steps.report.linkNote')}</p>
      </div>

      {analysis.status === 'ready' ? (
        <>
          <FieldSummary analysis={analysis.data} />
          {(analysis.data.shownByGoal[ranking] ?? []).flatMap((id) => {
            const r = analysis.data.rotations.find((x) => x.id === id);
            if (!r) return [];
            const others = (analysis.data.shownByGoal[ranking] ?? []).filter(
              (x) => !analysis.data.rotations.find((y) => y.id === x)?.isCurrent,
            );
            return [
              <RotationCard
                key={r.id}
                rotation={r}
                goal={ranking}
                rank={others.indexOf(r.id) + 1}
                datasets={analysis.data.datasets}
                calendar={<CalendarStrip months={r.calendar} datasets={analysis.data.datasets} />}
              />,
            ];
          })}
          <SourcesPanel datasets={analysis.data.datasets} />
          <p className="text-sm text-slate-700">
            {t('steps.report.generated', { date: analysis.data.generatedAt.slice(0, 10) })}
          </p>
        </>
      ) : (
        <StateBoundary
          state={analysis.status === 'error' ? 'error' : 'loading'}
          source={analysis.status === 'error' ? analysis.source : t('steps.report.analysis')}
          reason={analysis.status === 'error' ? analysis.reason : undefined}
          onRetry={() => void runAnalysis()}
        >
          {null}
        </StateBoundary>
      )}
    </section>
  );
}
