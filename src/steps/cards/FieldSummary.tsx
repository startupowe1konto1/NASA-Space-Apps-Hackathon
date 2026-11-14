// The field's NASA climate record and soil in a few lines, above the cards. Every value goes through <SourcedNumber>.
import { t } from '../../app/i18n';
import type { Analysis, Dataset, Hazard, Sourced } from '../../contracts';
import { SourcedNumber } from '../../ui-kit';

const hazards: Hazard[] = ['drought', 'heat', 'frost'];

/** Counting drought years from the record is our calculation on top of the provider's data. */
function droughtYears(analysis: Analysis): Sourced {
  const { profile } = analysis;
  const n = profile.yearly.length;
  const base = { datasetIds: profile.source.datasetIds, kind: 'derived' as const, retrievedAt: profile.source.retrievedAt };
  if (n === 0) return { ...base, value: null, missingReason: t('summary.droughtYears.none') };
  return { ...base, value: profile.droughtYears.length, unit: t('summary.droughtYears.unit', { n }) };
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
      unit: t('summary.yearsShare'),
      range: p.range ? { ...p.range, low: pct(p.range.low), high: pct(p.range.high) } : undefined,
    },
  };
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
        {t('summary.title')}: {field.name}
      </h2>
      <dl>
        <Row label={t('summary.droughtYears')} value={droughtYears(analysis)} datasets={datasets} decimals={0} />
        {hazards.map((hazard) => {
          const top = peak(analysis, hazard);
          const name = t(`summary.hazard.${hazard}`);
          if (!top) {
            return (
              <div key={hazard} className="border-b border-slate-200 py-2 text-base text-slate-700 last:border-0">
                {t('summary.peak.none', { hazard: name })}
              </div>
            );
          }
          return (
            <Row
              key={hazard}
              label={`${t('summary.peak', { hazard: name })}: ${t(`month.${top.month}`)}`}
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
          {t('summary.soilAndSlope')}
          <span aria-hidden="true" className="text-slate-600 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none">
            ▾
          </span>
        </summary>
        <dl>
          <Row label={t('summary.sand')} value={profile.soil.sandPct} datasets={datasets} decimals={0} />
          <Row label={t('summary.clay')} value={profile.soil.clayPct} datasets={datasets} decimals={0} />
          <Row label={t('summary.organicCarbon')} value={profile.soil.organicCarbon} datasets={datasets} />
          <Row label={t('summary.slope')} value={profile.slopePct} datasets={datasets} />
        </dl>
      </details>
    </section>
  );
}
