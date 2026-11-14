// One rotation. Soil health and climate resilience come first whatever the goal (D9); gaps and local risks are in the
// body, never a footnote; the support sentence closes every card (SPEC section 11).
import type { ReactNode } from 'react';
import { t } from '../../app/i18n';
import type { Dataset, GoalId, Message, RotationOption } from '../../contracts';
import { ConfidenceBadge, ScoreBar, SourcedNumber, StateBoundary } from '../../ui-kit';
import { cropName } from '../shared/cropName';

export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

export function rotationTitle(rotation: RotationOption): string {
  return rotation.years
    .map((y) => (y.coverCrop ? `${cropName(y.crop)} + ${cropName(y.coverCrop)}` : cropName(y.crop)))
    .join(' → ');
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-1.5">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

const Para = ({ m }: { m: Message }) => <p className="text-base leading-snug text-slate-800">{t(m)}</p>;

export function RotationCard(props: {
  rotation: RotationOption;
  rank: number;
  goal: GoalId;
  datasets: Dataset[];
  /** Slot for the calendar strip (O2-B4), placed after the scores. */
  calendar?: ReactNode;
}) {
  const { rotation: r, rank, goal, datasets, calendar } = props;
  const weak = r.soilHealth.confidence === 'weak' || r.climateResilience.confidence === 'weak';
  const total = r.totals[goal];
  const goalName = t(`steps.goal.${goal}`);
  const keepRank = r.rankByGoal.keepSoil;

  return (
    <article
      data-testid={`card-${r.id}`}
      className={`grid gap-4 rounded-2xl border-2 bg-white p-4 shadow-sm ${r.isCurrent ? 'border-slate-700' : 'border-slate-200'}`}
    >
      {weak && r.gaps[0] ? (
        <div data-testid="weak-evidence" className="grid gap-1.5 rounded-xl border-2 border-amber-700 bg-amber-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <ConfidenceBadge confidence="weak" />
            <span className="text-sm font-semibold text-amber-950">{t('steps.rotations.weakTitle')}</span>
          </div>
          <p className="text-base leading-snug text-amber-950">{t(r.gaps[0])}</p>
        </div>
      ) : null}

      <header className="grid gap-1">
        <span
          className={`w-fit rounded-full px-2.5 py-0.5 text-sm font-semibold ${
            r.isCurrent ? 'bg-slate-800 text-white' : 'bg-emerald-100 text-emerald-900'
          }`}
        >
          {r.isCurrent ? t('steps.rotations.current') : t('steps.rotations.option', { n: rank })}
        </span>
        <h2 className="text-xl font-semibold leading-tight text-slate-900">{rotationTitle(r)}</h2>
        {goal !== 'keepSoil' && keepRank !== undefined ? (
          <p className="text-sm text-slate-700">{t('steps.rotations.rankOnKeep', { nth: ordinal(keepRank) })}</p>
        ) : null}
      </header>

      <div className="grid gap-4">
        <ScoreBar label={t('steps.rotations.soilHealth')} score={r.soilHealth} basisText={t(r.soilHealth.basis)} />
        <ScoreBar label={t('steps.rotations.climate')} score={r.climateResilience} basisText={t(r.climateResilience.basis)} />
        {goal !== 'keepSoil' ? (
          total.status === 'ready' ? (
            <ScoreBar label={t('steps.rotations.goalTotal', { goal: goalName })} score={total.data} basisText={t(total.data.basis)} />
          ) : (
            <p className="text-sm text-slate-700">{t('steps.rotations.goalTotalMissing', { goal: goalName })}</p>
          )
        ) : null}
      </div>

      {calendar}

      <Section title={t('steps.rotations.why')}>
        {r.why.map((m) => (
          <Para key={m.code} m={m} />
        ))}
      </Section>

      <Section title={t('steps.rotations.evidence')}>
        {r.evidence.map((e, i) => (
          <div key={`${e.message.code}-${i}`} className="grid gap-1">
            <Para m={e.message} />
            {e.values.length > 0 ? (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-base text-slate-900">
                {e.values.map((v, j) => (
                  <SourcedNumber key={j} value={v} datasets={datasets} />
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </Section>

      <Section title={t('steps.rotations.benefits')}>
        {r.benefits.length > 0 ? (
          r.benefits.map((m) => <Para key={m.code} m={m} />)
        ) : (
          <p className="text-base text-slate-700">{t('steps.rotations.benefitsNone')}</p>
        )}
      </Section>

      <Section title={t('steps.rotations.twins')}>
        {r.twins.status === 'ready' ? (
          <p className="text-base text-slate-800">
            {t('steps.rotations.twinsReady', {
              count: r.twins.data.caseCount,
              similarity: Math.round(r.twins.data.meanSimilarity),
            })}
          </p>
        ) : (
          <StateBoundary
            state={r.twins.status === 'error' ? 'error' : 'no-data'}
            source={r.twins.status === 'error' ? r.twins.source : undefined}
            reason={
              r.twins.status === 'not-loaded' ? t('steps.rotations.twinsNotLoaded') : t(r.twins.reason)
            }
          >
            {null}
          </StateBoundary>
        )}
      </Section>

      <Section title={t('steps.rotations.gaps')}>
        <ul className="list-disc space-y-1 pl-5 text-base leading-snug text-slate-800">
          {r.gaps.map((m, i) => (
            <li key={`${m.code}-${i}`}>{t(m)}</li>
          ))}
        </ul>
      </Section>

      <Section title={t('steps.rotations.risks')}>
        <ul className="list-disc space-y-1 pl-5 text-base leading-snug text-slate-800">
          {r.localReviewRisks.map((m, i) => (
            <li key={`${m.code}-${i}`}>{t(m)}</li>
          ))}
        </ul>
      </Section>

      <p className="rounded-lg bg-slate-100 px-3 py-2 text-base leading-snug text-slate-800">{t('app.support')}</p>
    </article>
  );
}
