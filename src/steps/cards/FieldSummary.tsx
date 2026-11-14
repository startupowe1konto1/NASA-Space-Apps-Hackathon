// The field's NASA climate record and soil in a few lines, above the cards. Every value goes through <SourcedNumber>.
import { t } from '../../app/i18n';
import type { Analysis, Dataset, Hazard, Sourced } from '../../contracts';
import { SourcedNumber } from '../../ui-kit';
import { TermText } from './TermText';

// Drought is measured against the field's own record (D42), so every month is a drought in about the same share of
// years and over the whole record the count of drought years is fixed by the percentile. Neither says anything
// about this field, so the summary shows no "highest drought month" and counts drought years in the recent seasons.
const hazards: Hazard[] = ['heat', 'frost'];
/** Recent seasons in which drought years are counted. */
const RECENT_SEASONS = 15;

function recentYears(analysis: Analysis): { from: number; to: number; years: number[] } | null {
  const years = analysis.profile.yearly.map((y) => y.year);
  if (years.length === 0) return null;
  const to = Math.max(...years);
  const from = Math.max(Math.min(...years), to - RECENT_SEASONS + 1);
  return { from, to, years: years.filter((y) => y >= from) };
}

/** Counting drought years from the record is our calculation on top of the provider's data. */
function droughtYears(analysis: Analysis): Sourced {
  const { profile } = analysis;
  const recent = recentYears(analysis);
  const base = { datasetIds: profile.source.datasetIds, kind: 'derived' as const, retrievedAt: profile.source.retrievedAt };
  if (!recent) return { ...base, value: null, missingReason: t('steps.rotations.summary.droughtYears.none') };
  const value = profile.droughtYears.filter((y) => y >= recent.from).length;
  return { ...base, value, unit: t('steps.rotations.summary.droughtYears.unit', { n: recent.years.length }) };
}

/** The month with the highest share of years hit by a hazard, shown as a percentage of years. */
function peak(analysis: Analysis, hazard: Hazard): { month: number; share: Sourced } | null {
  const rows = analysis.profile.monthlyRisk.filter((m) => m.hazard === hazard && m.probability.value !== null);
  if (rows.length === 0) return null;
  const top = rows.reduce((a, b) => ((b.probability.value ?? 0) > (a.probability.value ?? 0) ? b : a));
  const p = top.probability;
  const pct = (x: number) => Math.round(x * 100);
  return {
    month: top.month,
    share: {
      ...p,
      value: pct(p.value ?? 0),
      unit: t('steps.rotations.summary.yearsShare'),
      range: p.range ? { ...p.range, low: pct(p.range.low), high: pct(p.range.high) } : undefined,
    },
  };
}

function droughtLabel(analysis: Analysis): string {
  const recent = recentYears(analysis);
  return recent
    ? t('steps.rotations.summary.droughtYears.recent', { from: recent.from, to: recent.to })
    : t('steps.rotations.summary.droughtYears');
}

function Row({ label, value, datasets, decimals }: { label: string; value: Sourced; datasets: Dataset[]; decimals?: number }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-slate-200 py-2 last:border-0">
      <dt className="text-base text-slate-700">{label}</dt>
      <dd className="text-base font-medium text-slate-900">
        <SourcedNumber value={value} datasets={datasets} decimals={decimals} />
      </dd>
    </div>
  );
}

export function FieldSummary({ analysis }: { analysis: Analysis }) {
  const { profile, datasets, field } = analysis;
  return (
    <section aria-labelledby="field-summary-title" className="grid gap-2 rounded-2xl border-2 border-slate-200 bg-white p-4">
      <h2 id="field-summary-title" className="text-lg font-semibold text-slate-900">
        {t('steps.rotations.summary.title')}: {field.name}
      </h2>
      <p className="text-sm leading-relaxed text-slate-700">
        <TermText
          code="steps.rotations.summary.droughtNote"
          terms={{ rootZone: 'root-zone', wetness: 'soil-wetness-index', model: 'model-estimate' }}
        />
      </p>
      <dl>
        <Row label={droughtLabel(analysis)} value={droughtYears(analysis)} datasets={datasets} decimals={0} />
        {hazards.map((hazard) => {
          const top = peak(analysis, hazard);
          const name = t(`steps.rotations.summary.hazard.${hazard}`);
          if (!top) {
            // Every value is missing: show the provider's reason instead of a blank line.
            const missing = analysis.profile.monthlyRisk.find((m) => m.hazard === hazard)?.probability;
            if (missing) {
              return (
                <Row key={hazard} label={t('steps.rotations.summary.peak', { hazard: name })} value={missing} datasets={datasets} />
              );
            }
            return (
              <div key={hazard} className="border-b border-slate-200 py-2 text-base text-slate-700 last:border-0">
                {t('steps.rotations.summary.peak.none', { hazard: name })}
              </div>
            );
          }
          return (
            <Row
              key={hazard}
              label={`${t('steps.rotations.summary.peak', { hazard: name })}: ${t(`steps.rotations.month.${top.month}`)}`}
              value={top.share}
              datasets={datasets}
              decimals={0}
            />
          );
        })}
      </dl>
      {/* Soil and slope fold away so the cards start on the first screen of a phone. */}
      <details className="group rounded-lg border border-slate-200 px-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-base font-medium text-slate-900 [&::-webkit-details-marker]:hidden">
          {t('steps.rotations.summary.soilAndSlope')}
          <span aria-hidden="true" className="text-slate-600 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none">
            ▾
          </span>
        </summary>
        <dl>
          <Row label={t('steps.rotations.summary.sand')} value={profile.soil.sandPct} datasets={datasets} decimals={0} />
          <Row label={t('steps.rotations.summary.clay')} value={profile.soil.clayPct} datasets={datasets} decimals={0} />
          <Row label={t('steps.rotations.summary.organicCarbon')} value={profile.soil.organicCarbon} datasets={datasets} />
          <Row label={t('steps.rotations.summary.slope')} value={profile.slopePct} datasets={datasets} />
        </dl>
      </details>
    </section>
  );
}
